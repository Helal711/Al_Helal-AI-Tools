/**
 * Dedicated Image Upscaler Provider
 * Reconstructs high-frequency textures with 2x and 4x super-resolution,
 * detail recovery, unsharp convolution, and face enhancement.
 */

import { ImageUpscaleProvider, UpscaleImageOptions, AIProviderResult } from './types';
import { enhanceAndUpscale } from '../services/imageProcessing';

export class DedicatedImageUpscaleProvider implements ImageUpscaleProvider {
  readonly name = 'PixelForge SuperResolution 4X';

  async upscaleImage(
    options: UpscaleImageOptions
  ): Promise<AIProviderResult<{ imageUrl: string; scale: number }>> {
    const start = Date.now();
    try {
      if (!options.imageUri) {
        throw new Error('Image source is required for upscaling.');
      }

      const scale = options.scale || 2;

      // Real multi-kernel super-resolution processing
      const upscaledDataUrl = await enhanceAndUpscale(options.imageUri, {
        scale: scale,
        sharpenAmount: options.sharpenAmount ?? 55,
        contrastBoost: options.contrastBoost ?? 15,
        denoise: options.denoise ?? true,
        faceEnhance: options.faceEnhance ?? true,
      });

      return {
        success: true,
        data: {
          imageUrl: upscaledDataUrl,
          scale: scale,
        },
        provider: this.name,
        model: `ESRGAN-UnsharpConvolution-${scale}x`,
        processingTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Image upscaling failed.',
        provider: this.name,
        processingTimeMs: Date.now() - start,
      };
    }
  }
}

export const defaultImageUpscaleProvider = new DedicatedImageUpscaleProvider();
