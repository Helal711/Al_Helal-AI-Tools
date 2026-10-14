/**
 * PixelForge AI — AI Result Management Service
 * 
 * Manages storage, indexing, and retrieval of generated AI assets across Firestore and local storage.
 * Section 27 & Unified AI Processing Engine requirement.
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase/firebaseConfig';
import { AIResultRecord } from './types';

export class AIResultService {
  private localResultCache: AIResultRecord[] = [];

  constructor() {
    this.loadLocalCache();
  }

  private loadLocalCache(): void {
    try {
      const stored = localStorage.getItem('pixelforge_ai_results');
      if (stored) {
        this.localResultCache = JSON.parse(stored);
      }
    } catch {
      this.localResultCache = [];
    }
  }

  private persistLocalCache(): void {
    try {
      localStorage.setItem('pixelforge_ai_results', JSON.stringify(this.localResultCache.slice(0, 100)));
    } catch {
      // Storage quota or private browsing fallback
    }
  }

  /**
   * Saves an AI processing result to Firestore (if authenticated) and local cache
   */
  public async saveResult(params: {
    userId?: string;
    projectId?: string;
    jobId: string;
    toolId: string;
    providerId: string;
    modelId?: string;
    originalFileId?: string;
    resultFileId?: string;
    thumbnailFileId?: string;
    metadata?: Record<string, any>;
  }): Promise<AIResultRecord> {
    const resultId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveUserId = params.userId || auth.currentUser?.uid || 'anonymous';

    const record: AIResultRecord = {
      id: resultId,
      userId: effectiveUserId,
      projectId: params.projectId,
      jobId: params.jobId,
      toolId: params.toolId,
      providerId: params.providerId,
      modelId: params.modelId,
      originalFileId: params.originalFileId,
      resultFileId: params.resultFileId,
      thumbnailFileId: params.thumbnailFileId,
      createdAt: new Date().toISOString(),
      metadata: params.metadata || {},
    };

    // Always record locally for instant UI responsiveness
    this.localResultCache.unshift(record);
    this.persistLocalCache();

    // Persist to Firestore if user is authenticated
    if (auth.currentUser && db) {
      try {
        await setDoc(doc(db, 'ai_results', resultId), record);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `ai_results/${resultId}`);
      }
    }

    return record;
  }

  /**
   * Retrieves results for a specific user
   */
  public async getUserResults(userId?: string, maxLimit = 50): Promise<AIResultRecord[]> {
    const effectiveUserId = userId || auth.currentUser?.uid;

    if (effectiveUserId && db) {
      try {
        const q = query(
          collection(db, 'ai_results'),
          where('userId', '==', effectiveUserId),
          orderBy('createdAt', 'desc'),
          limit(maxLimit)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as AIResultRecord);
        }
      } catch {
        // Fallback to local cache if network/rules restricted
      }
    }

    return this.localResultCache.filter(
      (r) => !effectiveUserId || r.userId === effectiveUserId || r.userId === 'anonymous'
    );
  }

  /**
   * Retrieves results for a specific tool
   */
  public async getToolResults(toolId: string, limitCount = 20): Promise<AIResultRecord[]> {
    return this.localResultCache.filter((r) => r.toolId === toolId).slice(0, limitCount);
  }

  /**
   * Deletes a result record
   */
  public async deleteResult(resultId: string): Promise<boolean> {
    this.localResultCache = this.localResultCache.filter((r) => r.id !== resultId);
    this.persistLocalCache();

    if (auth.currentUser && db) {
      try {
        await deleteDoc(doc(db, 'ai_results', resultId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `ai_results/${resultId}`);
      }
    }

    return true;
  }
}

export const aiResultService = new AIResultService();
