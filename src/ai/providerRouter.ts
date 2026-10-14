/**
 * Al_Helal AI Tools — Provider Router & Dynamic Dispatcher
 * 
 * Implements architectural routing between UI tools and AI providers:
 * Tool Slug -> Resolve Provider -> Check Enabled & Healthy -> Route / Fallback -> Execute & Log Telemetry
 */

import { aiService } from './AIService';
import { AIProviderResult } from './types';
import { getToolBySlug } from '../data/toolRegistry';

export interface RouteExecutionRecord {
  toolSlug: string;
  provider: string;
  operation: string;
  durationMs: number;
  success: boolean;
  timestamp: string;
  error?: string;
}

// In-memory operational telemetry for Admin Tool Analytics (Section 47 & 48)
const operationalHistory: RouteExecutionRecord[] = [];

export class ProviderRouter {
  /**
   * Records operational metrics for admin visibility
   */
  public logOperation(record: RouteExecutionRecord): void {
    operationalHistory.unshift(record);
    if (operationalHistory.length > 200) {
      operationalHistory.pop();
    }
  }

  public getOperationalLogs(): RouteExecutionRecord[] {
    return [...operationalHistory];
  }

  public getToolHealthSummary(): Record<string, { status: 'healthy' | 'degraded' | 'provider_required'; lastError?: string; totalOps: number }> {
    const summary: Record<string, { status: 'healthy' | 'degraded' | 'provider_required'; lastError?: string; totalOps: number }> = {};

    for (const record of operationalHistory) {
      if (!summary[record.toolSlug]) {
        summary[record.toolSlug] = {
          status: record.success ? 'healthy' : 'degraded',
          lastError: record.error,
          totalOps: 0,
        };
      }
      summary[record.toolSlug].totalOps++;
      if (!record.success && summary[record.toolSlug].status === 'healthy') {
        summary[record.toolSlug].status = 'degraded';
        summary[record.toolSlug].lastError = record.error;
      }
    }
    return summary;
  }

  /**
   * Routes Background Removal operations
   */
  public async routeBackgroundRemoval(
    toolSlug: string,
    imageUri: string,
    options: { feather?: number; bgColor?: string; customBgImage?: string; sensitivity?: number } = {}
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    const start = Date.now();
    const tool = getToolBySlug(toolSlug);

    if (tool && tool.status === 'provider_required') {
      return {
        success: false,
        error: `Provider required: ${tool.provider}`,
        provider: 'none',
        model: 'none',
        processingTimeMs: 0,
      };
    }

    try {
      const res = await aiService.removeBackground({
        imageUri,
        bgColor: options.bgColor,
        customBgImage: options.customBgImage,
        feather: options.feather,
        sensitivity: options.sensitivity,
      });

      this.logOperation({
        toolSlug,
        provider: res.provider,
        operation: 'background-removal',
        durationMs: Date.now() - start,
        success: res.success,
        timestamp: new Date().toISOString(),
        error: res.error,
      });

      return res;
    } catch (err: any) {
      this.logOperation({
        toolSlug,
        provider: 'backgroundRemovalProvider',
        operation: 'background-removal',
        durationMs: Date.now() - start,
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Routes Image Enhancement operations
   */
  public async routeImageEnhance(
    toolSlug: string,
    imageUri: string,
    params: {
      sharpen?: number;
      lighting?: number;
      denoise?: boolean;
      faceEnhancement?: boolean;
      colorCorrection?: boolean;
    } = {}
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    const start = Date.now();
    try {
      const res = await aiService.enhanceImage({
        imageUri,
        sharpen: params.sharpen,
        lighting: params.lighting,
        denoise: params.denoise,
        faceEnhancement: params.faceEnhancement,
        colorCorrection: params.colorCorrection,
      });

      this.logOperation({
        toolSlug,
        provider: res.provider,
        operation: 'enhance',
        durationMs: Date.now() - start,
        success: res.success,
        timestamp: new Date().toISOString(),
        error: res.error,
      });

      return res;
    } catch (err: any) {
      this.logOperation({
        toolSlug,
        provider: 'enhancementProvider',
        operation: 'enhance',
        durationMs: Date.now() - start,
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Routes Image Upscale operations
   */
  public async routeImageUpscale(
    toolSlug: string,
    imageUri: string,
    scale: 1 | 2 | 4,
    faceEnhance: boolean = true
  ): Promise<AIProviderResult<{ imageUrl: string; scale: number }>> {
    const start = Date.now();
    try {
      const res = await aiService.upscaleImage({
        imageUri,
        scale,
        faceEnhance,
      });

      this.logOperation({
        toolSlug,
        provider: res.provider,
        operation: 'upscale',
        durationMs: Date.now() - start,
        success: res.success,
        timestamp: new Date().toISOString(),
        error: res.error,
      });

      return res;
    } catch (err: any) {
      this.logOperation({
        toolSlug,
        provider: 'upscaleProvider',
        operation: 'upscale',
        durationMs: Date.now() - start,
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Routes Generative Image Syntheses
   */
  public async routeImageGeneration(
    toolSlug: string,
    prompt: string,
    options: {
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      style?: string;
      negativePrompt?: string;
    } = {}
  ): Promise<AIProviderResult<{ imageUrl: string; prompt: string; seed?: number }>> {
    const start = Date.now();
    try {
      const res = await aiService.generateImage({
        prompt,
        aspectRatio: options.aspectRatio || '1:1',
        style: options.style,
        negativePrompt: options.negativePrompt,
      });

      this.logOperation({
        toolSlug,
        provider: res.provider,
        operation: 'generate',
        durationMs: Date.now() - start,
        success: res.success,
        timestamp: new Date().toISOString(),
        error: res.error,
      });

      return res;
    } catch (err: any) {
      this.logOperation({
        toolSlug,
        provider: 'geminiProvider',
        operation: 'generate',
        durationMs: Date.now() - start,
        success: false,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
      throw err;
    }
  }
}

export const providerRouter = new ProviderRouter();
