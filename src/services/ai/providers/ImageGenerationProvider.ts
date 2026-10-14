/**
 * PixelForge AI — Dedicated Image Generation Provider
 * 
 * High-fidelity synthesis provider routing prompts to server-side multimodal image models
 * (e.g. Gemini / Imagen / Stable Diffusion style endpoints).
 */

import {
  AIProvider,
  AICapability,
  ProviderHealthReport,
  GenerateImageInput,
  AIResult,
} from '../types';

export class ImageGenerationProvider implements AIProvider {
  public readonly id = 'pixelforge-image-synthesis';
  public readonly name = 'PixelForge Neural Image Generator';
  public readonly priority = 1;

  public readonly capabilities: AICapability[] = [
    AICapability.IMAGE_GENERATION,
    AICapability.BACKGROUND_GENERATION,
    AICapability.PORTRAIT_GENERATION,
    AICapability.HEADSHOT_GENERATION,
    AICapability.IMAGE_VARIATION,
  ];

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/health');
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.hasGeminiKey);
    } catch {
      return false;
    }
  }

  public async healthCheck(): Promise<ProviderHealthReport> {
    const start = Date.now();
    try {
      const res = await fetch('/api/ai/health');
      const data = await res.json();
      const latencyMs = Date.now() - start;
      const hasKey = Boolean(data.hasGeminiKey);

      return {
        available: hasKey,
        status: hasKey ? 'CONNECTED' : 'PROVIDER_REQUIRED',
        latencyMs,
        message: hasKey
          ? 'Neural Image Generation engine online and verified.'
          : 'Backend AI API key not configured on server.',
        supportedCapabilities: this.capabilities,
        activeModel: data.config?.activeImageModel || 'gemini-3.1-flash-lite-image',
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        available: false,
        status: 'TEMPORARILY_UNAVAILABLE',
        message: err.message || 'Image Generation provider unreachable.',
        supportedCapabilities: this.capabilities,
        lastCheckedAt: new Date().toISOString(),
      };
    }
  }

  public async generateImage(
    input: GenerateImageInput
  ): Promise<AIResult<{ imageUrl: string; prompt: string; seed?: number }>> {
    const start = Date.now();
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.prompt,
          aspectRatio: input.aspectRatio || '1:1',
          style: input.style || 'Photorealistic',
          negativePrompt: input.negativePrompt,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.imageUrl) {
        throw new Error(json.error || json.message || 'Image synthesis request failed');
      }

      return {
        success: true,
        data: {
          imageUrl: json.imageUrl,
          prompt: json.prompt || input.prompt,
        },
        providerId: this.id,
        modelId: json.model || 'gemini-3.1-flash-lite-image',
        capability: AICapability.IMAGE_GENERATION,
        processingTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Image generation failed',
        errorCode: 'ERR_IMAGE_SYNTHESIS_FAILED',
        providerId: this.id,
        capability: AICapability.IMAGE_GENERATION,
        processingTimeMs: Date.now() - start,
      };
    }
  }
}
