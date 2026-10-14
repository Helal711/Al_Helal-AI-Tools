/**
 * PixelForge AI — AI Job Management Service
 * 
 * Manages lifecycle of asynchronous AI processing jobs in Firestore (ai_jobs collection):
 * Creation -> Queuing -> Concurrency -> Idempotency -> Completion / Failure / Cancellation
 */

import { doc, setDoc, updateDoc, getDoc, collection, query, where, limit, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase/firebaseConfig';
import { AIJob, AIJobStatus, AICapability } from './types';

export class AIJobService {
  private activeIdempotencyKeys = new Set<string>();

  /**
   * Generates a stable idempotency key to prevent accidental duplicate requests (Section 24)
   */
  public generateIdempotencyKey(userId: string, toolId: string, inputPayload: string): string {
    let hash = 0;
    for (let i = 0; i < inputPayload.length; i++) {
      hash = (hash << 5) - hash + inputPayload.charCodeAt(i);
      hash |= 0;
    }
    return `${userId || 'anon'}_${toolId}_${Math.abs(hash)}`;
  }

  public isDuplicateRequest(idempotencyKey: string): boolean {
    return this.activeIdempotencyKeys.has(idempotencyKey);
  }

  public registerRequest(idempotencyKey: string): void {
    this.activeIdempotencyKeys.add(idempotencyKey);
    // Release key after 10 seconds without keeping process alive
    const timer = setTimeout(() => this.activeIdempotencyKeys.delete(idempotencyKey), 10000);
    timer?.unref?.();
  }

  public async createJob(jobParams: {
    userId?: string;
    projectId?: string;
    toolId: string;
    capability: AICapability;
    providerId: string;
    modelId?: string;
    prompt?: string;
    parameters?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<AIJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: AIJob = {
      id: jobId,
      userId: jobParams.userId || auth.currentUser?.uid,
      projectId: jobParams.projectId,
      toolId: jobParams.toolId,
      capability: jobParams.capability,
      providerId: jobParams.providerId,
      modelId: jobParams.modelId,
      status: 'QUEUED',
      prompt: jobParams.prompt,
      parameters: jobParams.parameters,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      idempotencyKey: jobParams.idempotencyKey,
    };

    if (auth.currentUser && job.userId === auth.currentUser.uid) {
      const p = `ai_jobs/${jobId}`;
      try {
        await setDoc(doc(db, 'ai_jobs', jobId), job);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, p);
      }
    }

    return job;
  }

  public async updateJobStatus(
    jobId: string,
    status: AIJobStatus,
    updates: {
      errorMessage?: string;
      errorCode?: string;
      outputFileIds?: string[];
      processingTimeMs?: number;
    } = {}
  ): Promise<void> {
    const payload: Partial<AIJob> = {
      status,
      ...updates,
    };

    if (status === 'PROCESSING') {
      payload.startedAt = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      payload.completedAt = new Date().toISOString();
    } else if (status === 'FAILED') {
      payload.failedAt = new Date().toISOString();
    }

    if (auth.currentUser) {
      const p = `ai_jobs/${jobId}`;
      try {
        await updateDoc(doc(db, 'ai_jobs', jobId), payload);
      } catch {
        // Non-blocking update failure
      }
    }
  }

  public async getJob(jobId: string): Promise<AIJob | null> {
    if (!auth.currentUser) return null;
    const p = `ai_jobs/${jobId}`;
    try {
      const snap = await getDoc(doc(db, 'ai_jobs', jobId));
      return snap.exists() ? (snap.data() as AIJob) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, p);
    }
  }

  public async cancelJob(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'CANCELLED');
  }

  public subscribeUserJobs(userId: string, callback: (jobs: AIJob[]) => void): Unsubscribe {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      callback([]);
      return () => {};
    }

    const p = 'ai_jobs';
    const q = query(collection(db, 'ai_jobs'), where('userId', '==', userId), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as AIJob)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, p);
      }
    );
  }
}

export const aiJobService = new AIJobService();
