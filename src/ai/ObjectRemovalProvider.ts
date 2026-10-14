/**
 * Object Removal & Inpainting Provider
 * Receives original image and painted mask buffer, applies boundary gradient reconstruction
 * and seamless background blending.
 */

import { ObjectRemovalProvider, RemoveObjectOptions, AIProviderResult } from './types';
import { inpaintMaskedObject, loadImage } from '../services/imageProcessing';

export class DedicatedObjectRemovalProvider implements ObjectRemovalProvider {
  readonly name = 'PixelForge PatchInpaint Neural';

  async removeObject(
    options: RemoveObjectOptions
  ): Promise<AIProviderResult<{ imageUrl: string }>> {
    const start = Date.now();
    try {
      if (!options.imageUri || !options.maskDataUrl) {
        throw new Error('Both source image and mask overlay are required.');
      }

      // Try server-side inpainting first if available
      try {
        const res = await fetch('/api/ai/remove-object', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUri: options.imageUri,
            maskDataUrl: options.maskDataUrl,
            quality: options.quality || 'high',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.imageUrl) {
            return {
              success: true,
              data: { imageUrl: json.imageUrl },
              provider: this.name,
              model: 'Server PatchMatch Multi-Pass',
              processingTimeMs: Date.now() - start,
            };
          }
        }
      } catch {
        // Fall back to client canvas inpainting algorithm
      }

      // Client-side canvas-based mask inpainting
      const maskImg = await loadImage(options.maskDataUrl);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = maskImg.naturalWidth || maskImg.width;
      maskCanvas.height = maskImg.naturalHeight || maskImg.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Canvas context unavailable');
      maskCtx.drawImage(maskImg, 0, 0);

      const inpaintedUrl = await inpaintMaskedObject(options.imageUri, maskCanvas);

      return {
        success: true,
        data: { imageUrl: inpaintedUrl },
        provider: this.name,
        model: 'Client-Diffusion-Inpainter',
        processingTimeMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Object removal failed.',
        provider: this.name,
        processingTimeMs: Date.now() - start,
      };
    }
  }
}

export const defaultObjectRemovalProvider = new DedicatedObjectRemovalProvider();
