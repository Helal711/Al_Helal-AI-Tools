/**
 * Video Generation Provider
 * Adheres strictly to honest capability reporting:
 * High-throughput video rendering requires specialized GPU clusters.
 * Gracefully reports provider unavailability when not provisioned.
 */

import { VideoProvider, GenerateVideoOptions, AIProviderResult } from './types';

export class VeoVideoProvider implements VideoProvider {
  readonly name = 'Google Veo 3.1 Temporal Engine';

  async getStatus(): Promise<{ available: boolean; message: string; reason: string }> {
    try {
      const res = await fetch('/api/video/status');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Endpoint fallback
    }
    return {
      available: false,
      reason: 'AI provider not configured',
      message: 'This AI feature is currently unavailable. Dedicated video rendering cluster required.',
    };
  }

  async generateVideo(
    _options: GenerateVideoOptions
  ): Promise<AIProviderResult<{ videoUrl?: string; status: string }>> {
    const status = await this.getStatus();
    if (!status.available) {
      return {
        success: false,
        error: status.message || 'This AI feature is currently unavailable.',
        provider: this.name,
        processingTimeMs: 0,
      };
    }

    return {
      success: false,
      error: 'This AI feature is currently unavailable.',
      provider: this.name,
      processingTimeMs: 0,
    };
  }
}

export const defaultVideoProvider = new VeoVideoProvider();
