/**
 * PixelForge AI Usage Control & Rate Limiting Service
 * Protects server resources without any credit, token, or paywall system.
 * Enforces a daily fair-use technical limit per user/device.
 */

import { firestore } from '../firebase/firestore';

export interface UsageRecord {
  userId: string;
  tool: string;
  date: string; // YYYY-MM-DD
  operationCount: number;
  lastOperationAt: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  message?: string;
}

// Local tools are 100% client-side and never consume server/AI daily quota
const EXEMPT_TOOLS = new Set([
  'resize',
  'crop',
  'rotate',
  'flip',
  'compress',
  'convert',
  'image-resizer',
  'image-cropper',
  'image-compressor',
  'image-converter',
  'Local Image Tools',
  'Image RESIZE',
  'Image CROP',
  'Image COMPRESS',
  'Image CONVERT',
  'Image ROTATE',
  'Image FLIP',
]);

const DEFAULT_DAILY_LIMIT = 25;

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class UsageService {
  private dailyLimit: number = DEFAULT_DAILY_LIMIT;

  constructor() {
    this.syncDailyLimitFromSettings();
  }

  public setDailyLimit(limit: number): void {
    if (limit > 0) {
      this.dailyLimit = limit;
    }
  }

  public getDailyLimit(): number {
    return this.dailyLimit;
  }

  private async syncDailyLimitFromSettings(): Promise<void> {
    try {
      const settings = await firestore.getSystemSettings();
      if (settings?.dailyLimit && typeof settings.dailyLimit === 'number') {
        this.dailyLimit = settings.dailyLimit;
      }
    } catch {
      // Keep default
    }
  }

  public isToolExempt(toolName: string): boolean {
    if (!toolName) return false;
    const lower = toolName.toLowerCase();
    for (const exempt of EXEMPT_TOOLS) {
      if (lower.includes(exempt.toLowerCase())) return true;
    }
    return false;
  }

  public async checkLimit(userId: string | undefined | null, toolName: string): Promise<UsageCheckResult> {
    return this.checkUsage(userId, toolName);
  }

  /**
   * Check if user is allowed to perform operation before running
   */
  public async checkUsage(userId: string | undefined | null, toolName: string): Promise<UsageCheckResult> {
    if (this.isToolExempt(toolName)) {
      return { allowed: true, count: 0, limit: this.dailyLimit, remaining: this.dailyLimit };
    }

    const effectiveUserId = userId || 'anonymous_guest';
    const today = getTodayString();
    const localKey = `pf_usage_${effectiveUserId}_${today}`;

    // Read local cache count
    let count = 0;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        count = parseInt(stored, 10) || 0;
      }
    } catch {
      count = 0;
    }

    const remaining = Math.max(0, this.dailyLimit - count);
    const allowed = count < this.dailyLimit;

    return {
      allowed,
      count,
      limit: this.dailyLimit,
      remaining,
      message: allowed
        ? undefined
        : 'Your daily processing limit has been reached. Please try again later.',
    };
  }

  /**
   * Increment and record technical operation
   */
  public async recordOperation(
    userId: string | undefined | null,
    toolName: string
  ): Promise<UsageCheckResult> {
    if (this.isToolExempt(toolName)) {
      return { allowed: true, count: 0, limit: this.dailyLimit, remaining: this.dailyLimit };
    }

    const effectiveUserId = userId || 'anonymous_guest';
    const today = getTodayString();
    const localKey = `pf_usage_${effectiveUserId}_${today}`;

    let count = 0;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        count = parseInt(stored, 10) || 0;
      }
    } catch {
      count = 0;
    }

    count += 1;

    try {
      localStorage.setItem(localKey, count.toString());
    } catch {
      // Ignore quota error in local storage
    }

    // Persist to Firestore if user is authenticated
    if (userId && userId !== 'anonymous_guest') {
      try {
        await firestore.logToolUsage(userId, toolName);
      } catch (err) {
        console.warn('Failed to sync usage to Firestore:', err);
      }
    }

    const remaining = Math.max(0, this.dailyLimit - count);
    const allowed = count <= this.dailyLimit;

    return {
      allowed,
      count,
      limit: this.dailyLimit,
      remaining,
      message: allowed
        ? undefined
        : 'Your daily processing limit has been reached. Please try again later.',
    };
  }
}

export const usageService = new UsageService();
