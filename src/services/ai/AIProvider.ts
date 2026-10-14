/**
 * PixelForge AI — Core AI Provider Abstraction Interface (PART 10)
 * 
 * Defines the standardized contract that every AI model/engine adapter must satisfy.
 * Decouples frontend tools from concrete SDK implementations (Google Gemini, Local Canvas, etc.).
 */

export {
  AICapability,
  type ProviderStatus,
  type ProviderHealthReport,
  type AIProvider,
  type AIResult,
  type GenerateImageInput,
  type EditImageInput,
  type AnalyzeImageInput,
  type BackgroundRemovalInput,
  type ObjectRemovalInput,
  type EnhanceImageInput,
  type UpscaleInput,
  type VideoGenerationInput,
} from './types';

import {
  AIProvider,
  AICapability,
  ProviderHealthReport,
  AIResult,
} from './types';
import { AIErrorHandler, SanitizedAIError } from './AIErrorHandler';

/**
 * Standardized Base Provider with capability checks, input validation, and error normalization
 */
export abstract class BaseAIProvider implements AIProvider {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly capabilities: AICapability[];
  public abstract readonly priority: number;

  public abstract isAvailable(): Promise<boolean>;
  public abstract healthCheck(): Promise<ProviderHealthReport>;

  public supports(capability: AICapability): boolean {
    return this.capabilities.includes(capability);
  }

  public getCapabilities(): AICapability[] {
    return [...this.capabilities];
  }

  public validateInput(input: any): { valid: boolean; error?: string } {
    if (!input) {
      return { valid: false, error: 'Input payload is missing or empty' };
    }
    return { valid: true };
  }

  public normalizeError(error: any): SanitizedAIError {
    return AIErrorHandler.sanitize(error, this.name);
  }

  protected unsupported(capability: AICapability): AIResult<any> {
    return {
      success: false,
      error: `Capability ${capability} is not supported by provider ${this.name}`,
      errorCode: 'ERR_CAPABILITY_UNSUPPORTED',
      providerId: this.id,
      capability,
      processingTimeMs: 0,
    };
  }
}
