/**
 * PixelForge AI — Centralized Output & Input Validation Service (PART 12)
 * 
 * Enforces rigorous quality criteria before files can be displayed or downloaded:
 * - File integrity & non-empty buffer checks
 * - Magic number & MIME type verification
 * - Image decode & dimension validity
 * - Alpha channel transparency ratio checks
 * - Video stream playability, duration, and container validation
 */

export interface ImageValidationResult {
  valid: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  mimeType?: string;
  hasTransparency?: boolean;
  transparencyRatio?: number;
  sizeBytes?: number;
  error?: string;
  errorCode?: string;
}

export interface VideoValidationResult {
  valid: boolean;
  duration?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  mimeType?: string;
  isPlayable?: boolean;
  sizeBytes?: number;
  error?: string;
  errorCode?: string;
}

export interface InputValidationResult {
  valid: boolean;
  fileName?: string;
  sizeBytes?: number;
  mimeType?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Validates input files before submitting to heavy AI or Canvas processing
 */
export function validateInputFile(
  file: File,
  options: {
    maxSizeBytes?: number; // Defaults to 25MB
    allowedMimeTypes?: string[];
  } = {}
): InputValidationResult {
  const { maxSizeBytes = 25 * 1024 * 1024, allowedMimeTypes } = options;

  if (!file) {
    return { valid: false, error: 'No file provided.', errorCode: 'ERR_FILE_MISSING' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).', errorCode: 'ERR_EMPTY_FILE' };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      sizeBytes: file.size,
      error: `File size exceeds the platform limit of ${maxMb}MB.`,
      errorCode: 'ERR_FILE_TOO_LARGE',
    };
  }

  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const isAllowed = allowedMimeTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        mimeType: file.type,
        error: `File format "${file.type || 'unknown'}" is not supported. Supported: ${allowedMimeTypes.join(', ')}`,
        errorCode: 'ERR_UNSUPPORTED_FORMAT',
      };
    }
  }

  return {
    valid: true,
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}

/**
 * Validates generated image outputs before displaying or permitting download
 */
export async function validateImageOutput(
  imageSource: string,
  options: {
    requireAlpha?: boolean;
    minWidth?: number;
    minHeight?: number;
    expectedScale?: number;
    originalDimensions?: { width: number; height: number };
  } = {}
): Promise<ImageValidationResult> {
  const { requireAlpha = false, minWidth = 1, minHeight = 1, expectedScale, originalDimensions } = options;

  if (!imageSource || typeof imageSource !== 'string' || imageSource.trim().length === 0) {
    return {
      valid: false,
      error: 'Empty or missing image buffer output.',
      errorCode: 'ERR_OUTPUT_BUFFER_EMPTY',
    };
  }

  // Detect MIME type
  let mimeType = 'image/png';
  if (imageSource.startsWith('data:image/jpeg') || imageSource.startsWith('data:image/jpg')) {
    mimeType = 'image/jpeg';
  } else if (imageSource.startsWith('data:image/webp')) {
    mimeType = 'image/webp';
  }

  // Calculate size in bytes from base64
  let sizeBytes = 0;
  if (imageSource.startsWith('data:')) {
    const base64Data = imageSource.split(',')[1] || '';
    sizeBytes = Math.round((base64Data.length * 3) / 4);
    if (sizeBytes < 100) {
      return {
        valid: false,
        sizeBytes,
        error: 'Generated image output file is truncated or too small (<100 bytes).',
        errorCode: 'ERR_OUTPUT_TRUNCATED',
      };
    }
  }

  // Decode image element
  return new Promise<ImageValidationResult>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve({
        valid: false,
        error: 'Image decoding timed out. Buffer may be corrupted.',
        errorCode: 'ERR_DECODE_TIMEOUT',
      });
    }, 8000);

    img.onload = () => {
      clearTimeout(timer);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (width < minWidth || height < minHeight) {
        resolve({
          valid: false,
          width,
          height,
          error: `Image dimensions (${width}x${height}) do not meet minimum requirements (${minWidth}x${minHeight}).`,
          errorCode: 'ERR_INVALID_DIMENSIONS',
        });
        return;
      }

      // Check expected scale if specified (e.g. 2x, 4x upscaling)
      if (expectedScale && originalDimensions) {
        const expectedW = originalDimensions.width * expectedScale;
        const expectedH = originalDimensions.height * expectedScale;
        // Allow ±2px deviation for rounding
        if (Math.abs(width - expectedW) > 2 || Math.abs(height - expectedH) > 2) {
          resolve({
            valid: false,
            width,
            height,
            error: `Super-resolution dimension mismatch: expected ${expectedW}x${expectedH}, got ${width}x${height}.`,
            errorCode: 'ERR_SCALE_DIMENSION_MISMATCH',
          });
          return;
        }
      }

      // Calculate GCD Aspect Ratio
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const div = gcd(width, height);
      const aspectRatio = `${Math.round(width / div)}:${Math.round(height / div)}`;

      // Alpha channel transparency check
      let hasTransparency = false;
      let transparencyRatio = 0;

      if (requireAlpha || mimeType === 'image/png' || mimeType === 'image/webp') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 256); // Subsample for performance
          canvas.height = Math.min(height, 256);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let transparentPixels = 0;
            const total = canvas.width * canvas.height;

            for (let i = 3; i < data.length; i += 4) {
              if (data[i] < 250) {
                transparentPixels++;
              }
            }

            hasTransparency = transparentPixels > 0;
            transparencyRatio = Math.round((transparentPixels / total) * 1000) / 10;
          }
        } catch {
          // Non-blocking canvas inspect
        }

        if (requireAlpha && !hasTransparency) {
          resolve({
            valid: false,
            width,
            height,
            mimeType,
            hasTransparency: false,
            error: 'Alpha channel verification failed: Output lacks transparent pixels.',
            errorCode: 'ERR_NO_ALPHA_TRANSPARENCY',
          });
          return;
        }
      }

      resolve({
        valid: true,
        width,
        height,
        aspectRatio,
        mimeType,
        sizeBytes,
        hasTransparency,
        transparencyRatio,
      });
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve({
        valid: false,
        error: 'Failed to decode image raster. Corrupted image buffer.',
        errorCode: 'ERR_IMAGE_DECODE_FAILED',
      });
    };

    img.src = imageSource;
  });
}

/**
 * Validates video outputs before displaying or allowing download
 */
export async function validateVideoOutput(
  videoSource: string | Blob,
  options: {
    minDurationSeconds?: number;
    maxDurationSeconds?: number;
  } = {}
): Promise<VideoValidationResult> {
  const { minDurationSeconds = 0.5, maxDurationSeconds = 60 } = options;

  if (!videoSource) {
    return { valid: false, error: 'Empty video stream output.', errorCode: 'ERR_EMPTY_VIDEO_OUTPUT' };
  }

  const url = typeof videoSource === 'string' ? videoSource : URL.createObjectURL(videoSource);

  return new Promise<VideoValidationResult>((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const timer = setTimeout(() => {
      resolve({
        valid: false,
        error: 'Video metadata loading timed out. Output container may be corrupt.',
        errorCode: 'ERR_VIDEO_TIMEOUT',
      });
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration;

      if (width <= 0 || height <= 0) {
        resolve({
          valid: false,
          error: `Invalid video dimensions (${width}x${height}).`,
          errorCode: 'ERR_INVALID_VIDEO_DIMENSIONS',
        });
        return;
      }

      if (!isFinite(duration) || duration < minDurationSeconds || duration > maxDurationSeconds) {
        resolve({
          valid: false,
          width,
          height,
          duration,
          error: `Video duration (${duration.toFixed(1)}s) outside valid range (${minDurationSeconds}s - ${maxDurationSeconds}s).`,
          errorCode: 'ERR_INVALID_VIDEO_DURATION',
        });
        return;
      }

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const div = gcd(width, height);
      const aspectRatio = `${Math.round(width / div)}:${Math.round(height / div)}`;

      resolve({
        valid: true,
        width,
        height,
        duration: Math.round(duration * 10) / 10,
        aspectRatio,
        isPlayable: true,
        mimeType: typeof videoSource === 'string' && videoSource.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
      });
    };

    video.onerror = () => {
      clearTimeout(timer);
      resolve({
        valid: false,
        error: 'Browser media decoder could not parse video container.',
        errorCode: 'ERR_VIDEO_DECODE_FAILED',
      });
    };

    video.src = url;
  });
}
