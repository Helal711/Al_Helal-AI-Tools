/**
 * PixelForge AI — Unified AI Processing Engine (AIService)
 * 
 * Central facade for all visual AI operations across the platform.
 * Decouples frontend tools completely from underlying AI models and providers.
 * 
 * Pipeline:
 * User Request -> Capability Identification -> Technical Quota Check ->
 * AI Job Creation -> Provider Router & Health Selection -> Execution ->
 * Fallback Failover -> Result Storage -> Audit & Telemetry -> User Result
 */

import {
  AICapability,
  AIProvider,
  AIResult,
  GenerateImageInput,
  EditImageInput,
  AnalyzeImageInput,
  BackgroundRemovalInput,
  ObjectRemovalInput,
  EnhanceImageInput,
  UpscaleInput,
  VideoGenerationInput,
  ProviderHealthReport,
} from './types';
import { providerRegistry } from './AIProviderRegistry';
import { AIProviderRouter } from './AIProviderRouter';
import { AIJobService } from './AIJobService';
import { aiResultService } from './AIResultService';
import { AIErrorHandler, SanitizedAIError } from './AIErrorHandler';
import { usageService } from '../usageService';

export class CentralAIService {
  private router = new AIProviderRouter();
  private jobService = new AIJobService();

  /**
   * Helper to verify invisible technical limits before running heavy operations
   */
  private async checkLimits(toolId: string, userId?: string): Promise<void> {
    const check = await usageService.checkLimit(userId || 'anonymous', toolId);
    if (!check.allowed) {
      throw new Error(`Technical daily usage limit reached (${check.limit} operations/day). Quota resets at midnight.`);
    }
  }

  /**
   * 1. Text-to-Image Synthesis
   */
  public async generateImage(
    input: GenerateImageInput,
    toolId = 'ai-image-generator'
  ): Promise<AIResult<{ imageUrl: string; prompt: string; seed?: number }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    // Idempotency check
    const idKey = this.jobService.generateIdempotencyKey(input.userId || 'anon', toolId, input.prompt);
    if (this.jobService.isDuplicateRequest(idKey)) {
      return {
        success: false,
        error: 'A duplicate image generation job is already in progress.',
        errorCode: 'ERR_DUPLICATE_JOB',
        providerId: 'internal-engine',
        capability: AICapability.IMAGE_GENERATION,
        processingTimeMs: 0,
      };
    }
    this.jobService.registerRequest(idKey);

    // Create tracking job
    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.IMAGE_GENERATION,
      providerId: 'auto-routed',
      prompt: input.prompt,
      parameters: { aspectRatio: input.aspectRatio, style: input.style },
      idempotencyKey: idKey,
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.IMAGE_GENERATION,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.generateImage) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement generateImage`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.IMAGE_GENERATION,
              processingTimeMs: 0,
            };
          }
          return await provider.generateImage(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        // Store result in catalog
        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          modelId: result.modelId,
          resultFileId: result.data.imageUrl,
          metadata: { prompt: input.prompt, style: input.style },
        });

        // Record technical quota usage
        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'AI Image Generator');
      await this.jobService.updateJobStatus(job.id, 'FAILED', {
        errorCode: sanitized.code,
        errorMessage: sanitized.userMessage,
        processingTimeMs: Date.now() - start,
      });

      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.IMAGE_GENERATION,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 2. AI Image Editing / Inpainting with Prompt
   */
  public async editImage(
    input: EditImageInput,
    toolId = 'ai-image-editor'
  ): Promise<AIResult<{ imageUrl: string; instruction: string }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.IMAGE_EDITING,
      providerId: 'auto-routed',
      prompt: input.instruction,
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.IMAGE_EDITING,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.editImage) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement editImage`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.IMAGE_EDITING,
              processingTimeMs: 0,
            };
          }
          return await provider.editImage(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          modelId: result.modelId,
          resultFileId: result.data.imageUrl,
          metadata: { instruction: input.instruction },
        });

        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'AI Image Editor');
      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.IMAGE_EDITING,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 3. Background Removal
   */
  public async removeBackground(
    input: BackgroundRemovalInput,
    toolId = 'background-remover'
  ): Promise<AIResult<{ imageUrl: string }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.BACKGROUND_REMOVAL,
      providerId: 'auto-routed',
      parameters: { bgColor: input.bgColor, feather: input.feather },
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.BACKGROUND_REMOVAL,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.removeBackground) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement removeBackground`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.BACKGROUND_REMOVAL,
              processingTimeMs: 0,
            };
          }
          return await provider.removeBackground(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          resultFileId: result.data.imageUrl,
        });

        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'Background Remover');
      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.BACKGROUND_REMOVAL,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 4. Object Removal / Inpainting
   */
  public async removeObject(
    input: ObjectRemovalInput,
    toolId = 'object-remover'
  ): Promise<AIResult<{ imageUrl: string }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.OBJECT_REMOVAL,
      providerId: 'auto-routed',
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.OBJECT_REMOVAL,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.removeObject) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement removeObject`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.OBJECT_REMOVAL,
              processingTimeMs: 0,
            };
          }
          return await provider.removeObject(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          resultFileId: result.data.imageUrl,
        });

        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'Object Remover');
      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.OBJECT_REMOVAL,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 5. Super-Resolution & Upscaling
   */
  public async upscaleImage(
    input: UpscaleInput,
    toolId = 'image-upscaler'
  ): Promise<AIResult<{ imageUrl: string; scale: number }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.IMAGE_UPSCALING,
      providerId: 'auto-routed',
      parameters: { scale: input.scale },
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.IMAGE_UPSCALING,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.upscaleImage) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement upscaleImage`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.IMAGE_UPSCALING,
              processingTimeMs: 0,
            };
          }
          return await provider.upscaleImage(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          resultFileId: result.data.imageUrl,
          metadata: { scale: input.scale },
        });

        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'Image Upscaler');
      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.IMAGE_UPSCALING,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 6. Image Enhancement & Restoration
   */
  public async enhanceImage(
    input: EnhanceImageInput,
    toolId = 'image-enhancer'
  ): Promise<AIResult<{ imageUrl: string }>> {
    const start = Date.now();
    await this.checkLimits(toolId, input.userId);

    const job = await this.jobService.createJob({
      userId: input.userId,
      toolId,
      capability: AICapability.IMAGE_ENHANCEMENT,
      providerId: 'auto-routed',
    });

    try {
      const result = await this.router.executeWithFallback(
        AICapability.IMAGE_ENHANCEMENT,
        toolId,
        async (provider: AIProvider) => {
          if (!provider.enhanceImage) {
            return {
              success: false,
              error: `Provider ${provider.name} does not implement enhanceImage`,
              errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
              providerId: provider.id,
              capability: AICapability.IMAGE_ENHANCEMENT,
              processingTimeMs: 0,
            };
          }
          return await provider.enhanceImage(input);
        }
      );

      if (result.success && result.data) {
        await this.jobService.updateJobStatus(job.id, 'COMPLETED', {
          processingTimeMs: Date.now() - start,
          outputFileIds: [result.data.imageUrl],
        });

        await aiResultService.saveResult({
          userId: input.userId,
          jobId: job.id,
          toolId,
          providerId: result.providerId,
          resultFileId: result.data.imageUrl,
        });

        await usageService.recordOperation(input.userId || 'anonymous', toolId);
      } else {
        await this.jobService.updateJobStatus(job.id, 'FAILED', {
          errorCode: result.errorCode,
          errorMessage: result.error,
          processingTimeMs: Date.now() - start,
        });
      }

      return result;
    } catch (err) {
      const sanitized = AIErrorHandler.sanitize(err, 'Image Enhancer');
      return {
        success: false,
        error: sanitized.userMessage,
        errorCode: sanitized.code,
        providerId: 'auto-router',
        capability: AICapability.IMAGE_ENHANCEMENT,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * 7. Multimodal Image Analysis & Prompt Expansion
   */
  public async analyzeImage(
    input: AnalyzeImageInput,
    toolId = 'image-analysis'
  ): Promise<AIResult<{ description: string; labels: string[]; dominantColors: string[] }>> {
    const start = Date.now();
    return await this.router.executeWithFallback(
      AICapability.IMAGE_ANALYSIS,
      toolId,
      async (provider: AIProvider) => {
        if (!provider.analyzeImage) {
          return {
            success: false,
            error: `Provider ${provider.name} does not implement analyzeImage`,
            errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
            providerId: provider.id,
            capability: AICapability.IMAGE_ANALYSIS,
            processingTimeMs: Date.now() - start,
          };
        }
        return await provider.analyzeImage(input);
      }
    );
  }

  /**
   * 8. Video Generation
   */
  public async generateVideo(
    input: VideoGenerationInput,
    toolId = 'ai-video-generator'
  ): Promise<AIResult<{ videoUrl?: string; status: string }>> {
    const start = Date.now();
    return await this.router.executeWithFallback(
      AICapability.VIDEO_GENERATION,
      toolId,
      async (provider: AIProvider) => {
        if (!provider.generateVideo) {
          return {
            success: false,
            error: `Provider ${provider.name} does not implement generateVideo`,
            errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
            providerId: provider.id,
            capability: AICapability.VIDEO_GENERATION,
            processingTimeMs: Date.now() - start,
          };
        }
        return await provider.generateVideo(input);
      }
    );
  }

  /**
   * 9. Prompt Enhancement via LLM
   */
  public async enhancePrompt(prompt: string, style?: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      if (!res.ok) return prompt;
      const json = await res.json();
      return json.enhancedPrompt || prompt;
    } catch {
      return prompt;
    }
  }

  /**
   * System Health and Provider Diagnostic Overview
   */
  public async getSystemHealth(): Promise<Record<string, ProviderHealthReport>> {
    const providers = providerRegistry.getAllProviders();
    const reports: Record<string, ProviderHealthReport> = {};

    await Promise.all(
      providers.map(async (p) => {
        reports[p.id] = await p.healthCheck();
      })
    );

    return reports;
  }
}

export const aiService = new CentralAIService();
