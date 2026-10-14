/**
 * Al_Helal AI Tools Provider Abstraction Layer
 * Standardized adapter delegating all operations to the central AIService
 */

import { aiService, CentralAIService } from './AIService';
import { GenerateImageOptions, EditImageOptions, AIProviderResult } from './types';

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  style?: string;
  negativePrompt?: string;
  quality?: 'standard' | 'hd';
}

export interface EditImageParams {
  imageBase64: string;
  instruction: string;
  mimeType?: string;
}

export interface AIProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
}

export interface IAIProvider {
  name: string;
  generateImage(params: GenerateImageParams): Promise<AIProviderResponse<{ imageUrl: string; prompt: string }>>;
  editImage(params: EditImageParams): Promise<AIProviderResponse<{ imageUrl: string }>>;
  enhancePrompt(prompt: string, style?: string): Promise<string>;
  analyzeImage(imageBase64: string): Promise<any>;
  getVideoStatus(): Promise<{ available: boolean; message: string; reason?: string }>;
}

export class GeminiAIProvider implements IAIProvider {
  name = 'Google Gemini Multimodal';

  async generateImage(params: GenerateImageParams): Promise<AIProviderResponse<{ imageUrl: string; prompt: string }>> {
    const res = await aiService.generateImage({
      prompt: params.prompt,
      aspectRatio: params.aspectRatio,
      style: params.style,
      negativePrompt: params.negativePrompt,
    });
    return {
      success: res.success,
      data: res.data,
      error: res.error,
      provider: res.provider,
    };
  }

  async editImage(params: EditImageParams): Promise<AIProviderResponse<{ imageUrl: string }>> {
    const res = await aiService.editImage({
      imageBase64: params.imageBase64,
      instruction: params.instruction,
      mimeType: params.mimeType,
    });
    return {
      success: res.success,
      data: res.data ? { imageUrl: res.data.imageUrl } : undefined,
      error: res.error,
      provider: res.provider,
    };
  }

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    return aiService.enhancePrompt(prompt, style);
  }

  async analyzeImage(imageBase64: string): Promise<any> {
    return aiService.analyzeImage(imageBase64);
  }

  async getVideoStatus(): Promise<{ available: boolean; message: string; reason?: string }> {
    const res = await aiService.generateVideo({ imageUri: '' });
    return {
      available: false,
      message: res.error || 'This AI feature is currently unavailable.',
      reason: 'AI provider not configured',
    };
  }
}

// Global active AI provider adapter
export const activeAIProvider: IAIProvider = new GeminiAIProvider();

export { aiService, CentralAIService };
