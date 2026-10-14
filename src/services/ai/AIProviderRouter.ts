/**
 * PixelForge AI — Provider Router & Dynamic Fallback Engine
 * 
 * Routes tool operations to the optimal provider based on:
 * Capability -> Provider Priority -> Health Check -> Fallback Resolution
 */

import { providerRegistry } from './AIProviderRegistry';
import { AICapability, AIProvider, AIResult } from './types';
import { AIErrorHandler } from './AIErrorHandler';

export interface RouteTelemetry {
  capability: AICapability;
  toolId: string;
  selectedProviderId: string;
  isFallback: boolean;
  durationMs: number;
  success: boolean;
  errorCode?: string;
}

export class AIProviderRouter {
  private auditListeners: Array<(telemetry: RouteTelemetry) => void> = [];

  public onTelemetry(listener: (telemetry: RouteTelemetry) => void): () => void {
    this.auditListeners.push(listener);
    return () => {
      this.auditListeners = this.auditListeners.filter((l) => l !== listener);
    };
  }

  private emitTelemetry(telemetry: RouteTelemetry): void {
    this.auditListeners.forEach((l) => l(telemetry));
  }

  /**
   * Resolves the primary and fallback provider chain for a capability
   */
  public async resolveProviderChain(capability: AICapability): Promise<{
    primary?: AIProvider;
    fallbacks: AIProvider[];
  }> {
    const candidates = providerRegistry.getProvidersForCapability(capability);
    if (candidates.length === 0) {
      return { primary: undefined, fallbacks: [] };
    }

    return {
      primary: candidates[0],
      fallbacks: candidates.slice(1),
    };
  }

  /**
   * Executes an operation with automated primary -> fallback failover
   */
  public async executeWithFallback<T>(
    capability: AICapability,
    toolId: string,
    operationFn: (provider: AIProvider) => Promise<AIResult<T>>
  ): Promise<AIResult<T>> {
    const start = Date.now();
    const { primary, fallbacks } = await this.resolveProviderChain(capability);

    if (!primary) {
      return {
        success: false,
        error: `No provider registered for capability: ${capability}`,
        errorCode: 'ERR_NO_PROVIDER_FOR_CAPABILITY',
        providerId: 'none',
        capability,
        processingTimeMs: Date.now() - start,
      };
    }

    // 1. Try Primary Provider
    try {
      const isPrimaryAvailable = await primary.isAvailable();
      if (isPrimaryAvailable) {
        const result = await operationFn(primary);
        if (result.success) {
          this.emitTelemetry({
            capability,
            toolId,
            selectedProviderId: primary.id,
            isFallback: false,
            durationMs: Date.now() - start,
            success: true,
          });
          return result;
        }
      }
    } catch (primaryErr: any) {
      console.warn(`[AI Router] Primary provider ${primary.id} failed:`, primaryErr.message);
    }

    // 2. Try Fallbacks in priority order
    for (const fallback of fallbacks) {
      try {
        const isFallbackAvailable = await fallback.isAvailable();
        if (isFallbackAvailable) {
          console.info(`[AI Router] Failing over to fallback provider: ${fallback.id}`);
          const fallbackResult = await operationFn(fallback);
          if (fallbackResult.success) {
            fallbackResult.isFallback = true;
            this.emitTelemetry({
              capability,
              toolId,
              selectedProviderId: fallback.id,
              isFallback: true,
              durationMs: Date.now() - start,
              success: true,
            });
            return fallbackResult;
          }
        }
      } catch (fallbackErr: any) {
        console.warn(`[AI Router] Fallback provider ${fallback.id} failed:`, fallbackErr.message);
      }
    }

    // 3. All providers exhausted
    const sanitized = AIErrorHandler.sanitize(new Error('All compatible AI providers failed to process request'), toolId);
    this.emitTelemetry({
      capability,
      toolId,
      selectedProviderId: primary.id,
      isFallback: false,
      durationMs: Date.now() - start,
      success: false,
      errorCode: sanitized.code,
    });

    return {
      success: false,
      error: sanitized.userMessage,
      errorCode: sanitized.code,
      providerId: primary.id,
      capability,
      processingTimeMs: Date.now() - start,
    };
  }
}

export const providerRouter = new AIProviderRouter();
