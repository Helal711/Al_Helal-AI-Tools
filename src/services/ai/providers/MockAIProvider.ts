/**
 * PixelForge AI — Development Mock AI Provider
 * 
 * Used strictly in isolated local test suites.
 * Automatically disabled in production environments.
 */

import {
  AIProvider,
  AICapability,
  ProviderHealthReport,
  GenerateImageInput,
  BackgroundRemovalInput,
  AIResult,
} from '../types';

export class MockAIProvider implements AIProvider {
  public readonly id = 'mock-dev-provider';
  public readonly name = 'Development Mock AI Engine';
  public readonly priority = 99; // Lowest fallback

  public readonly capabilities: AICapability[] = [
    AICapability.IMAGE_GENERATION,
    AICapability.BACKGROUND_REMOVAL,
    AICapability.IMAGE_ENHANCEMENT,
    AICapability.IMAGE_UPSCALING,
  ];

  public async isAvailable(): Promise<boolean> {
    // Only available when explicitly running in development and testing
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }

  public async healthCheck(): Promise<ProviderHealthReport> {
    return {
      available: await this.isAvailable(),
      status: 'DEVELOPMENT_MODE',
      latencyMs: 5,
      message: 'Mock provider active for offline testing.',
      supportedCapabilities: this.capabilities,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  public async generateImage(input: GenerateImageInput): Promise<AIResult<{ imageUrl: string; prompt: string }>> {
    return {
      success: true,
      data: {
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%234f46e5"/><text x="200" y="200" fill="white" font-size="20" text-anchor="middle">Mock Generation Output</text></svg>',
        prompt: input.prompt,
      },
      providerId: this.id,
      capability: AICapability.IMAGE_GENERATION,
      processingTimeMs: 150,
      metadata: { mock: true },
    };
  }

  public async removeBackground(input: BackgroundRemovalInput): Promise<AIResult<{ imageUrl: string }>> {
    return {
      success: true,
      data: { imageUrl: input.imageUri },
      providerId: this.id,
      capability: AICapability.BACKGROUND_REMOVAL,
      processingTimeMs: 100,
      metadata: { mock: true },
    };
  }
}
