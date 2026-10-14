/**
 * Al_Helal AI Tools Central Service Abstraction Layer
 * 
 * Architecture:
 * AIService
 * ├── GeminiProvider
 * ├── ImageGenerationProvider
 * ├── BackgroundRemovalProvider
 * ├── ImageEditingProvider
 * ├── ImageUpscaleProvider
 * ├── ObjectRemovalProvider
 * ├── EnhancementProvider
 * └── VideoProvider
 * 
 * Frontend components interact exclusively with AIService.
 * UI never directly depends on underlying AI models or SDK details.
 */

import {
  IAIService,
  ProviderCapabilityRegistry,
  AIProviderResult,
  GenerateImageOptions,
  EditImageOptions,
  RemoveBackgroundOptions,
  RemoveObjectOptions,
  UpscaleImageOptions,
  EnhanceImageOptions,
  GenerateVideoOptions,
  GeminiProvider,
  ImageGenerationProvider,
  BackgroundRemovalProvider,
  ImageEditingProvider,
  ImageUpscaleProvider,
  ObjectRemovalProvider,
  EnhancementProvider,
  VideoProvider,
} from './types';

import { GoogleGeminiProvider, defaultGeminiProvider } from './GeminiProvider';
import { DedicatedBackgroundRemovalProvider, defaultBackgroundRemovalProvider } from './BackgroundRemovalProvider';
import { DedicatedObjectRemovalProvider, defaultObjectRemovalProvider } from './ObjectRemovalProvider';
import { DedicatedImageUpscaleProvider, defaultImageUpscaleProvider } from './ImageUpscaleProvider';
import { DedicatedEnhancementProvider, defaultEnhancementProvider } from './EnhancementProvider';
import { VeoVideoProvider, defaultVideoProvider } from './VideoProvider';

export class CentralAIService implements IAIService {
  private geminiProvider: GeminiProvider = defaultGeminiProvider;
  private imageGenProvider: ImageGenerationProvider = defaultGeminiProvider;
  private bgRemovalProvider: BackgroundRemovalProvider = defaultBackgroundRemovalProvider;
  private imageEditingProvider: ImageEditingProvider = defaultGeminiProvider;
  private upscaleProvider: ImageUpscaleProvider = defaultImageUpscaleProvider;
  private objectRemovalProvider: ObjectRemovalProvider = defaultObjectRemovalProvider;
  private enhancementProvider: EnhancementProvider = defaultEnhancementProvider;
  private videoProvider: VideoProvider = defaultVideoProvider;

  // Active Provider Capability Registry
  private capabilities: ProviderCapabilityRegistry = {
    backgroundRemoval: true,
    objectRemoval: true,
    imageGeneration: true,
    imageEditing: true,
    upscaling: true,
    photoEnhancement: true,
    videoGeneration: false, // Transparent: Video cluster requires dedicated GPU rendering farm
    promptExpansion: true,
    imageAnalysis: true,
  };

  constructor() {
    this.refreshCapabilitiesFromServer();
  }

  public getCapabilities(): ProviderCapabilityRegistry {
    return { ...this.capabilities };
  }

  public isAvailable(feature: keyof ProviderCapabilityRegistry): boolean {
    return Boolean(this.capabilities[feature]);
  }

  public getUnavailableMessage(feature: keyof ProviderCapabilityRegistry): string {
    if (feature === 'videoGeneration') {
      return 'This AI feature is currently unavailable. Dedicated video rendering cluster required.';
    }
    return 'This AI feature is currently unavailable.';
  }

  public async refreshCapabilitiesFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        if (data.hasGeminiKey === false) {
          this.capabilities.imageGeneration = false;
          this.capabilities.imageEditing = false;
        } else {
          this.capabilities.imageGeneration = true;
          this.capabilities.imageEditing = true;
        }
      }
    } catch {
      // Retain active defaults
    }
  }

  // Admin Configuration Hooks to swap providers dynamically
  public setGeminiProvider(p: GeminiProvider): void {
    this.geminiProvider = p;
  }
  public setImageGenerationProvider(p: ImageGenerationProvider): void {
    this.imageGenProvider = p;
  }
  public setBackgroundRemovalProvider(p: BackgroundRemovalProvider): void {
    this.bgRemovalProvider = p;
  }
  public setImageEditingProvider(p: ImageEditingProvider): void {
    this.imageEditingProvider = p;
  }
  public setUpscaleProvider(p: ImageUpscaleProvider): void {
    this.upscaleProvider = p;
  }
  public setObjectRemovalProvider(p: ObjectRemovalProvider): void {
    this.objectRemovalProvider = p;
  }
  public setEnhancementProvider(p: EnhancementProvider): void {
    this.enhancementProvider = p;
  }
  public setCapability(cap: keyof ProviderCapabilityRegistry, enabled: boolean): void {
    this.capabilities[cap] = enabled;
  }

  // Standardized AI execution methods

  async generateImage(
    options: GenerateImageOptions
  ): Promise<AIProviderResult<{ imageUrl: string; prompt: string }>> {
    if (!this.capabilities.imageGeneration) {
      return {
        success: false,
        error: this.getUnavailableMessage('imageGeneration'),
        provider: this.imageGenProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.imageGenProvider.generateImage(options);
  }

  async editImage(
    options: EditImageOptions
  ): Promise<AIProviderResult<{ imageUrl: string; instruction: string }>> {
    if (!this.capabilities.imageEditing) {
      return {
        success: false,
        error: this.getUnavailableMessage('imageEditing'),
        provider: this.imageEditingProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.imageEditingProvider.editImage(options);
  }

  async removeBackground(
    options: RemoveBackgroundOptions
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    if (!this.capabilities.backgroundRemoval) {
      return {
        success: false,
        error: this.getUnavailableMessage('backgroundRemoval'),
        provider: this.bgRemovalProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.bgRemovalProvider.removeBackground(options);
  }

  async removeObject(
    options: RemoveObjectOptions
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    if (!this.capabilities.objectRemoval) {
      return {
        success: false,
        error: this.getUnavailableMessage('objectRemoval'),
        provider: this.objectRemovalProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.objectRemovalProvider.removeObject(options);
  }

  async upscaleImage(
    options: UpscaleImageOptions
  ): Promise<AIProviderResult<{ imageUrl: string; scale: number }>> {
    if (!this.capabilities.upscaling) {
      return {
        success: false,
        error: this.getUnavailableMessage('upscaling'),
        provider: this.upscaleProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.upscaleProvider.upscaleImage(options);
  }

  async enhanceImage(
    options: EnhanceImageOptions
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    if (!this.capabilities.photoEnhancement) {
      return {
        success: false,
        error: this.getUnavailableMessage('photoEnhancement'),
        provider: this.enhancementProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.enhancementProvider.enhanceImage(options);
  }

  async generateVideo(
    options: GenerateVideoOptions
  ): Promise<AIProviderResult<{ videoUrl?: string; status: string }>> {
    if (!this.capabilities.videoGeneration) {
      return {
        success: false,
        error: this.getUnavailableMessage('videoGeneration'),
        provider: this.videoProvider.name,
        processingTimeMs: 0,
      };
    }
    return this.videoProvider.generateVideo(options);
  }

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    return this.geminiProvider.generatePromptSuggestions(prompt, style);
  }

  async analyzeImage(imageBase64: string): Promise<any> {
    return this.geminiProvider.analyzeImage(imageBase64);
  }

  async describeImage(imageBase64: string): Promise<string> {
    return this.geminiProvider.describeImage(imageBase64);
  }
}

// Global AIService singleton
export const aiService = new CentralAIService();
