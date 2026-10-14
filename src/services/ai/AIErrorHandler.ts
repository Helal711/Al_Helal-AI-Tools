/**
 * PixelForge AI — Error Sanitization & User-Friendly Error Handler
 * 
 * Protects application integrity by stripping internal traces, server paths, and credentials
 * while presenting actionable, human-readable notifications to end-users.
 */

export interface SanitizedAIError {
  userMessage: string;
  code: string;
  category: 'USAGE_LIMIT' | 'PROVIDER_OFFLINE' | 'UNSUPPORTED_FORMAT' | 'PAYLOAD_OVERSIZE' | 'NETWORK' | 'GENERAL';
  recoverable: boolean;
  suggestedAction?: string;
}

export class AIErrorHandler {
  public static sanitize(error: unknown, contextToolName = 'AI Tool'): SanitizedAIError {
    const rawMessage = error instanceof Error ? error.message : String(error);

    // 1. Technical Daily or Rate Limit
    if (
      rawMessage.toLowerCase().includes('limit reached') ||
      rawMessage.toLowerCase().includes('rate limit') ||
      rawMessage.includes('429')
    ) {
      return {
        userMessage: 'Service usage limit reached for this session. Please wait a moment before trying again.',
        code: 'ERR_USAGE_LIMIT_EXCEEDED',
        category: 'USAGE_LIMIT',
        recoverable: true,
        suggestedAction: 'Wait 1-2 minutes or check tomorrow for technical quota reset.',
      };
    }

    // 2. Missing Provider or Unconfigured Backend
    if (
      rawMessage.toLowerCase().includes('provider not configured') ||
      rawMessage.toLowerCase().includes('provider required') ||
      rawMessage.toLowerCase().includes('missing key') ||
      rawMessage.includes('503')
    ) {
      return {
        userMessage: `This ${contextToolName} capability is temporarily unavailable on the server.`,
        code: 'ERR_PROVIDER_UNAVAILABLE',
        category: 'PROVIDER_OFFLINE',
        recoverable: false,
        suggestedAction: 'Please try another AI tool or check back later.',
      };
    }

    // 3. Oversized Payload or Dimensions
    if (
      rawMessage.toLowerCase().includes('too large') ||
      rawMessage.toLowerCase().includes('payload') ||
      rawMessage.toLowerCase().includes('oversized') ||
      rawMessage.includes('413')
    ) {
      return {
        userMessage: 'The uploaded image exceeds the maximum supported resolution or file size (25MB limit).',
        code: 'ERR_IMAGE_OVERSIZED',
        category: 'PAYLOAD_OVERSIZE',
        recoverable: true,
        suggestedAction: 'Please resize or compress your image using our free Local Image Resizer.',
      };
    }

    // 4. Unsupported or Corrupted File Type
    if (
      rawMessage.toLowerCase().includes('format') ||
      rawMessage.toLowerCase().includes('mime') ||
      rawMessage.toLowerCase().includes('corrupted')
    ) {
      return {
        userMessage: 'This file format is not supported by this tool. Please upload a standard PNG, JPG, or WebP image.',
        code: 'ERR_UNSUPPORTED_FORMAT',
        category: 'UNSUPPORTED_FORMAT',
        recoverable: true,
        suggestedAction: 'Convert your file to PNG or JPG before uploading.',
      };
    }

    // 5. Network / Timeout
    if (
      rawMessage.toLowerCase().includes('timeout') ||
      rawMessage.toLowerCase().includes('network') ||
      rawMessage.toLowerCase().includes('offline')
    ) {
      return {
        userMessage: 'The visual processing request timed out. Please check your internet connection.',
        code: 'ERR_NETWORK_TIMEOUT',
        category: 'NETWORK',
        recoverable: true,
        suggestedAction: 'Check connection and click Retry.',
      };
    }

    // Default Sanitized Fallback
    return {
      userMessage: `We could not process this image right now. Please try again in a moment.`,
      code: 'ERR_PROCESSING_INTERRUPTED',
      category: 'GENERAL',
      recoverable: true,
      suggestedAction: 'Try again with a different photo or prompt.',
    };
  }
}
