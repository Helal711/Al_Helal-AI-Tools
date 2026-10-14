/**
 * PixelForge AI — Video Generation Provider
 * 
 * Transparently reports honest cluster configuration requirements for video rendering.
 */

import {
  AIProvider,
  AICapability,
  ProviderHealthReport,
  VideoGenerationInput,
  AIResult,
} from '../types';

export class VideoProvider implements AIProvider {
  public readonly id = 'google-veo-cluster';
  public readonly name = 'Google Veo Video Cluster (Configuration Required)';
  public readonly priority = 1;

  public readonly capabilities: AICapability[] = [
    AICapability.VIDEO_GENERATION,
    AICapability.VIDEO_ENHANCEMENT,
    AICapability.VIDEO_BACKGROUND_REMOVAL,
  ];

  public async isAvailable(): Promise<boolean> {
    return false; // Explicitly requires external cluster credentials
  }

  public async healthCheck(): Promise<ProviderHealthReport> {
    return {
      available: false,
      status: 'PROVIDER_REQUIRED',
      message: 'High-throughput video rendering requires specialized GPU cluster credentials.',
      supportedCapabilities: this.capabilities,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  public async generateVideo(_input: VideoGenerationInput): Promise<AIResult<{ videoUrl?: string; status: string }>> {
    return {
      success: false,
      error: 'Generative video rendering requires a configured high-throughput video GPU provider.',
      errorCode: 'ERR_VIDEO_PROVIDER_REQUIRED',
      providerId: this.id,
      capability: AICapability.VIDEO_GENERATION,
      processingTimeMs: 0,
    };
  }
}
