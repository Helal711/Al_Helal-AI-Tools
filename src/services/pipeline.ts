/**
 * PixelForge AI Unified Processing Pipeline
 * 
 * Pipeline lifecycle:
 * Validate Input -> Usage Limit Check -> Create Job -> Queue -> AI Provider -> Store Result -> Update Firestore -> Return
 * 
 * Job Statuses:
 * - 'queued'
 * - 'processing'
 * - 'completed'
 * - 'failed'
 */

import { aiService } from '../ai/AIService';
import { usageService } from './usageService';
import { firestore } from '../firebase/firestore';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ProcessingJob<TResult = any> {
  id: string;
  userId?: string;
  tool: string;
  status: JobStatus;
  progress: number;
  message: string;
  inputMeta?: {
    sizeBytes?: number;
    mimeType?: string;
    prompt?: string;
  };
  result?: TResult;
  error?: string;
  createdAt: number;
  completedAt?: number;
  processingTimeMs?: number;
}

export type JobListener = (job: ProcessingJob) => void;

class ProcessingPipeline {
  private activeJobs: Map<string, ProcessingJob> = new Map();
  private listeners: Map<string, Set<JobListener>> = new Map();

  private createJobId(): string {
    return 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  private notifyJobUpdate(job: ProcessingJob) {
    this.activeJobs.set(job.id, job);
    const set = this.listeners.get(job.id);
    if (set) {
      set.forEach((cb) => cb({ ...job }));
    }
  }

  public subscribeJob(jobId: string, listener: JobListener): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);

    const current = this.activeJobs.get(jobId);
    if (current) {
      listener({ ...current });
    }

    return () => {
      this.listeners.get(jobId)?.delete(listener);
    };
  }

  /**
   * Validate image payload
   */
  public validateImageInput(dataUriOrBase64: string, maxSizeBytes = 25 * 1024 * 1024): void {
    if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
      throw new Error('Please select or upload a valid image.');
    }
    // Check approximate payload size
    const base64Content = dataUriOrBase64.split(',')[1] || dataUriOrBase64;
    const approxBytes = Math.round((base64Content.length * 3) / 4);
    if (approxBytes > maxSizeBytes) {
      throw new Error(`Image exceeds the maximum supported size of ${maxSizeBytes / (1024 * 1024)}MB.`);
    }
  }

  /**
   * Execute an AI operation through the managed queue and pipeline
   */
  public async executeJob<TResult>(
    params: {
      userId?: string;
      tool: string;
      operation: (updateProgress: (p: number, msg: string) => void) => Promise<TResult>;
      inputMeta?: ProcessingJob['inputMeta'];
      onProgress?: (progress: number, message: string) => void;
    }
  ): Promise<ProcessingJob<TResult>> {
    const { userId, tool, operation, inputMeta, onProgress } = params;
    const jobId = this.createJobId();
    const startTime = Date.now();

    const job: ProcessingJob<TResult> = {
      id: jobId,
      userId,
      tool,
      status: 'queued',
      progress: 5,
      message: 'Validating processing request...',
      inputMeta,
      createdAt: startTime,
    };
    this.notifyJobUpdate(job);

    try {
      // 1. Technical Usage Protection check (zero credit requirement)
      const usageCheck = await usageService.checkUsage(userId, tool);
      if (!usageCheck.allowed) {
        throw new Error(usageCheck.message || 'Your daily processing limit has been reached. Please try again later.');
      }

      // 2. Transition to processing
      job.status = 'processing';
      job.progress = 20;
      job.message = 'Initializing AI pipeline...';
      this.notifyJobUpdate(job);
      onProgress?.(job.progress, job.message);

      const updateProgress = (p: number, msg: string) => {
        job.progress = p;
        job.message = msg;
        this.notifyJobUpdate(job);
        onProgress?.(p, msg);
      };

      // 3. Execute underlying operation
      const result = await operation(updateProgress);

      // 4. Record technical usage count
      await usageService.recordOperation(userId, tool);

      // 5. Finalize job
      const completedTime = Date.now();
      job.status = 'completed';
      job.progress = 100;
      job.message = 'Processing successfully finished.';
      job.result = result;
      job.completedAt = completedTime;
      job.processingTimeMs = completedTime - startTime;
      this.notifyJobUpdate(job);
      onProgress?.(100, job.message);

      // 6. Optional Firestore logging if user authenticated
      if (userId && (result as any)?.imageUrl) {
        try {
          await firestore.logGeneration({
            userId,
            tool,
            prompt: inputMeta?.prompt || '',
            url: (result as any).imageUrl,
            model: (result as any).model || 'PixelForge-AI',
            provider: (result as any).provider || 'PixelForge Engine',
            status: 'completed',
          });
        } catch {
          // Non-blocking log
        }
      }

      return job;
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Operation failed during pipeline execution.';
      job.completedAt = Date.now();
      job.processingTimeMs = Date.now() - startTime;
      this.notifyJobUpdate(job);
      onProgress?.(0, job.error || 'Pipeline error');
      throw err;
    }
  }
}

export const processingPipeline = new ProcessingPipeline();
