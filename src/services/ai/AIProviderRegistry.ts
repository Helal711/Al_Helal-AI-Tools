/**
 * PixelForge AI — Extensible AI Provider Registry
 * 
 * Central registry maintaining active AI providers, capability bindings, and priority order.
 */

import { AIProvider, AICapability } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { BackgroundRemovalProvider } from './providers/BackgroundRemovalProvider';
import { UpscaleProvider } from './providers/UpscaleProvider';
import { ObjectRemovalProvider } from './providers/ObjectRemovalProvider';
import { EnhancementProvider } from './providers/EnhancementProvider';
import { VideoProvider } from './providers/VideoProvider';
import { ImageGenerationProvider } from './providers/ImageGenerationProvider';
import { MockAIProvider } from './providers/MockAIProvider';

export class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new ImageGenerationProvider());
    this.registerProvider(new BackgroundRemovalProvider());
    this.registerProvider(new UpscaleProvider());
    this.registerProvider(new ObjectRemovalProvider());
    this.registerProvider(new EnhancementProvider());
    this.registerProvider(new VideoProvider());

    // Register Mock provider only for development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      this.registerProvider(new MockAIProvider());
    }
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersForCapability(capability: AICapability): AIProvider[] {
    return Array.from(this.providers.values())
      .filter((p) => p.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority);
  }

  public async getBestProvider(capability: AICapability): Promise<AIProvider | undefined> {
    const candidates = this.getProvidersForCapability(capability);
    for (const provider of candidates) {
      const available = await provider.isAvailable();
      if (available) {
        return provider;
      }
    }
    // Return primary candidate even if unavailable so caller can inspect health report
    return candidates[0];
  }

  public async isCapabilityAvailable(capability: AICapability): Promise<boolean> {
    const best = await this.getBestProvider(capability);
    return best ? await best.isAvailable() : false;
  }
}

export const providerRegistry = new AIProviderRegistry();
