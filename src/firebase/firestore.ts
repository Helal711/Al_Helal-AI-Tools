/**
 * Firestore Client Database Layer & Data Models
 * PixelForge AI Architecture
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebaseConfig';

export type PlatformRole = 'USER' | 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN' | 'user' | 'admin';

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: PlatformRole;
  createdAt: string;
  lastLoginAt: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    defaultFormat?: 'png' | 'webp' | 'jpeg';
    autoEnhance?: boolean;
    notificationsEnabled?: boolean;
  };
}

export interface AuditLogDoc {
  id: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  targetType: 'user' | 'tool' | 'provider' | 'model' | 'system' | 'template' | 'announcement' | 'retention' | 'flag';
  targetId: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  reason?: string;
  requestId?: string;
  safeMetadata?: Record<string, any>;
}

export interface FeatureFlagDoc {
  key: string;
  description: string;
  enabled: boolean;
  environment: 'production' | 'staging' | 'all';
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export interface AnnouncementDoc {
  id: string;
  title: string;
  content: string;
  category: 'MAINTENANCE' | 'RELEASE' | 'UPDATE' | 'OUTAGE';
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  publishedAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface ToolOverrideDoc {
  toolId: string;
  availability: 'AVAILABLE' | 'DISABLED' | 'MAINTENANCE' | 'PROVIDER_REQUIRED' | 'TEMPORARILY_UNAVAILABLE';
  maintenanceMessage?: string;
  maxFileSizeMB?: number;
  displayOrder?: number;
  categoryPlacement?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ProjectDoc {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  coverFileId?: string;
  favorite?: boolean;
  archived?: boolean;
  tool: string;
  originalFile?: string;
  resultFile?: string;
  originalImage?: string;
  processedImage?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  assetCount?: number;
  resultCount?: number;
  createdAt: string;
  updatedAt?: string;
  lastOpenedAt?: string;
  metadata?: Record<string, any>;
}

export interface GenerationDoc {
  generationId?: string;
  userId: string;
  tool: string;
  prompt?: string;
  inputFile?: string;
  outputFile?: string;
  url?: string;
  model: string;
  provider: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt?: string;
  processingTime?: number;
  errorMessage?: string;
}

export interface FileDoc {
  fileId: string;
  userId: string;
  projectId?: string;
  storagePath: string;
  name: string;
  size: number;
  mimeType: string;
  fileType?: 'original' | 'result' | 'edited' | 'reference' | 'other';
  source?: 'upload' | 'generation' | 'edit' | 'enhancement' | 'upscale' | 'import';
  thumbnailUrl?: string;
  dimensions?: { width: number; height: number };
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface TemplateDoc {
  templateId: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  toolId: string;
  prompt?: string;
  settings: Record<string, any>;
  visibility: 'PRIVATE' | 'PUBLIC';
  thumbnailUrl?: string;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPromptDoc {
  promptId: string;
  userId: string;
  name: string;
  description?: string;
  promptText: string;
  category: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteDoc {
  favoriteId: string;
  userId: string;
  projectId?: string;
  imageUrl: string;
  title: string;
  tool: string;
  type?: 'tool' | 'project' | 'result' | 'template' | 'prompt';
  createdAt: string;
}

export interface NotificationDoc {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
  read: boolean;
  relatedResourceType?: 'project' | 'file' | 'generation' | 'job';
  relatedResourceId?: string;
  createdAt: string;
}

export interface ToolUsageDoc {
  id: string;
  userId: string;
  tool: string;
  timestamp: string;
  processingTimeMs: number;
  success: boolean;
}

export interface AdminLogDoc {
  logId: string;
  adminId: string;
  action: string;
  details: string;
  targetUserId?: string;
  timestamp: string;
}

export interface SystemSettingsDoc {
  settingId: string;
  maintenanceMode: boolean;
  dailyRateLimitPerUser: number;
  dailyLimit?: number;
  maxFileSizeMB: number;
  activeProvider: string;
  enabledTools: string[];
  updatedAt: string;
}

class FirestoreService {
  // Helper to check if user is authenticated with Firebase Auth
  private isUserAuthenticated(targetUserId?: string): boolean {
    const current = auth.currentUser;
    if (!current) return false;
    if (targetUserId && current.uid !== targetUserId) return false;
    return true;
  }

  // --- USERS ---
  async getUser(uid: string): Promise<UserDoc | null> {
    if (!this.isUserAuthenticated(uid)) return null;
    const p = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? (snap.data() as UserDoc) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, p);
    }
  }

  async setUser(uid: string, data: Partial<UserDoc>): Promise<void> {
    if (!this.isUserAuthenticated(uid)) return;
    const p = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async setUserProfile(uid: string, data: Partial<UserDoc>): Promise<void> {
    return this.setUser(uid, data);
  }

  async listAllUsers(): Promise<UserDoc[]> {
    if (!auth.currentUser) return [];
    const p = 'users';
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => d.data() as UserDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }

  async updateUserStatus(uid: string, status: 'active' | 'suspended', reason?: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        suspensionReason: reason || null,
        lastLoginAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, p);
    }
  }

  async updateUserRole(uid: string, role: PlatformRole): Promise<void> {
    if (!auth.currentUser) return;
    const p = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, p);
    }
  }

  // --- PROJECTS ---
  async getProject(projectId: string): Promise<ProjectDoc | null> {
    if (!auth.currentUser) return null;
    const p = `projects/${projectId}`;
    try {
      const snap = await getDoc(doc(db, 'projects', projectId));
      return snap.exists() ? (snap.data() as ProjectDoc) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, p);
    }
  }

  async listUserProjects(userId: string): Promise<ProjectDoc[]> {
    if (!this.isUserAuthenticated(userId)) return [];
    const p = 'projects';
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', userId),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ProjectDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
    }
  }

  async setProject(project: ProjectDoc): Promise<void> {
    if (!this.isUserAuthenticated(project.userId)) return;
    const p = `projects/${project.projectId}`;
    try {
      await setDoc(doc(db, 'projects', project.projectId), project, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async createProject(params: {
    userId: string;
    name: string;
    originalImage?: string;
    processedImage?: string;
    tool?: string;
  }): Promise<ProjectDoc | null> {
    if (!this.isUserAuthenticated(params.userId)) return null;
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docData: ProjectDoc = {
      projectId,
      userId: params.userId,
      name: params.name,
      originalImage: params.originalImage,
      processedImage: params.processedImage,
      originalFile: params.originalImage,
      resultFile: params.processedImage,
      tool: params.tool || 'AI Image Editor',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.setProject(docData);
    return docData;
  }

  async deleteProject(projectId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `projects/${projectId}`;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  subscribeUserProjects(userId: string, callback: (projects: ProjectDoc[]) => void): Unsubscribe {
    // CRITICAL (from Firebase Skill): Only attach onSnapshot listeners if auth is ready and user is authenticated
    if (!this.isUserAuthenticated(userId)) {
      callback([]);
      return () => {};
    }

    const p = 'projects';
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      limit(50)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as ProjectDoc)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, p);
      }
    );
  }

  // --- GENERATIONS ---
  async logGeneration(gen: GenerationDoc): Promise<void> {
    if (!this.isUserAuthenticated(gen.userId)) return;
    const genId = gen.generationId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullDoc: GenerationDoc = {
      ...gen,
      generationId: genId,
      createdAt: gen.createdAt || new Date().toISOString(),
      outputFile: gen.outputFile || gen.url,
      url: gen.url || gen.outputFile,
    };
    const p = `generations/${genId}`;
    try {
      await setDoc(doc(db, 'generations', genId), fullDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, p);
    }
  }

  subscribeUserGenerations(userId: string, callback: (gens: GenerationDoc[]) => void): Unsubscribe {
    if (!this.isUserAuthenticated(userId)) {
      callback([]);
      return () => {};
    }

    const p = 'generations';
    const q = query(
      collection(db, 'generations'),
      where('userId', '==', userId),
      limit(50)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as GenerationDoc)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, p);
      }
    );
  }

  // --- FILES ---
  async recordFile(file: FileDoc): Promise<void> {
    if (!this.isUserAuthenticated(file.userId)) return;
    const p = `files/${file.fileId}`;
    try {
      await setDoc(doc(db, 'files', file.fileId), file);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, p);
    }
  }

  async listUserFiles(userId: string): Promise<FileDoc[]> {
    if (!this.isUserAuthenticated(userId)) return [];
    const p = 'files';
    try {
      const q = query(collection(db, 'files'), where('userId', '==', userId), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as FileDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `files/${fileId}`;
    try {
      await deleteDoc(doc(db, 'files', fileId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  // --- FAVORITES ---
  async addFavorite(fav: FavoriteDoc): Promise<void> {
    if (!this.isUserAuthenticated(fav.userId)) return;
    const p = `favorites/${fav.favoriteId}`;
    try {
      await setDoc(doc(db, 'favorites', fav.favoriteId), fav);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, p);
    }
  }

  async removeFavorite(favoriteId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `favorites/${favoriteId}`;
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  async setFavoriteTool(userId: string, toolId: string, isFav: boolean): Promise<void> {
    if (!this.isUserAuthenticated(userId)) return;
    const favId = `fav_tool_${userId}_${toolId}`;
    if (isFav) {
      await this.addFavorite({
        favoriteId: favId,
        userId,
        tool: toolId,
        title: toolId,
        imageUrl: '',
        createdAt: new Date().toISOString(),
      });
    } else {
      await this.removeFavorite(favId);
    }
  }

  subscribeUserFavorites(userId: string, callback: (favs: FavoriteDoc[]) => void): Unsubscribe {
    if (!this.isUserAuthenticated(userId)) {
      callback([]);
      return () => {};
    }

    const p = 'favorites';
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      limit(50)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as FavoriteDoc)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, p);
      }
    );
  }

  // --- NOTIFICATIONS ---
  async createNotification(notif: NotificationDoc): Promise<void> {
    if (!this.isUserAuthenticated(notif.userId)) return;
    const p = `notifications/${notif.notificationId}`;
    try {
      await setDoc(doc(db, 'notifications', notif.notificationId), notif);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, p);
    }
  }

  async markNotificationRead(notificationId: string, read: boolean = true): Promise<void> {
    if (!auth.currentUser) return;
    const p = `notifications/${notificationId}`;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, p);
    }
  }

  subscribeUserNotifications(userId: string, callback: (items: NotificationDoc[]) => void): Unsubscribe {
    // CRITICAL: Only attach onSnapshot listeners if auth is ready and user is authenticated
    if (!this.isUserAuthenticated(userId)) {
      callback([]);
      return () => {};
    }

    const p = 'notifications';
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(20)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => d.data() as NotificationDoc)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, p);
      }
    );
  }

  // --- TOOL USAGE METRICS ---
  async logToolUsage(metricOrUserId: ToolUsageDoc | string, toolName?: string): Promise<void> {
    if (typeof metricOrUserId === 'string') {
      const metric: ToolUsageDoc = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: metricOrUserId,
        tool: toolName || 'general',
        timestamp: new Date().toISOString(),
        processingTimeMs: 0,
        success: true,
      };
      return this.logToolUsage(metric);
    }
    if (!this.isUserAuthenticated(metricOrUserId.userId)) return;
    const p = `tool_usage/${metricOrUserId.id}`;
    try {
      await setDoc(doc(db, 'tool_usage', metricOrUserId.id), metricOrUserId);
    } catch (e) {
      console.warn('Tool usage metric write notice:', e);
    }
  }

  async listToolUsageMetrics(): Promise<ToolUsageDoc[]> {
    if (!auth.currentUser) return [];
    const p = 'tool_usage';
    try {
      const q = query(collection(db, 'tool_usage'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ToolUsageDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
    }
  }

  // --- ADMIN LOGS ---
  async logAdminAction(log: AdminLogDoc): Promise<void> {
    if (!auth.currentUser) return;
    const p = `admin_logs/${log.logId}`;
    try {
      await setDoc(doc(db, 'admin_logs', log.logId), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, p);
    }
  }

  async listAdminLogs(): Promise<AdminLogDoc[]> {
    if (!auth.currentUser) return [];
    const p = 'admin_logs';
    try {
      const q = query(collection(db, 'admin_logs'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as AdminLogDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }

  // --- SECURITY AUDIT TRAIL ---
  async recordAuditLog(log: AuditLogDoc): Promise<void> {
    if (!auth.currentUser) return;
    const p = `audit_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.warn('Audit log write notice:', e);
    }
  }

  async listAuditLogs(limitCount = 50): Promise<AuditLogDoc[]> {
    if (!auth.currentUser) return [];
    const p = 'audit_logs';
    try {
      const q = query(collection(db, 'audit_logs'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => d.data() as AuditLogDoc)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }

  // --- FEATURE FLAGS ---
  async listFeatureFlags(): Promise<FeatureFlagDoc[]> {
    if (!auth.currentUser) return [];
    const p = 'feature_flags';
    try {
      const snap = await getDocs(collection(db, 'feature_flags'));
      return snap.docs.map((d) => d.data() as FeatureFlagDoc);
    } catch (e) {
      console.warn('Feature flags fetch notice:', e);
      return [];
    }
  }

  async setFeatureFlag(flag: FeatureFlagDoc): Promise<void> {
    if (!auth.currentUser) return;
    const p = `feature_flags/${flag.key}`;
    try {
      await setDoc(doc(db, 'feature_flags', flag.key), flag, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  // --- SYSTEM ANNOUNCEMENTS ---
  async listAnnouncements(): Promise<AnnouncementDoc[]> {
    const p = 'announcements';
    try {
      const snap = await getDocs(collection(db, 'announcements'));
      return snap.docs
        .map((d) => d.data() as AnnouncementDoc)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn('Announcements fetch notice:', e);
      return [];
    }
  }

  async saveAnnouncement(announcement: AnnouncementDoc): Promise<void> {
    if (!auth.currentUser) return;
    const p = `announcements/${announcement.id}`;
    try {
      await setDoc(doc(db, 'announcements', announcement.id), announcement, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `announcements/${id}`;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  // --- TOOL OVERRIDES ---
  async listToolOverrides(): Promise<ToolOverrideDoc[]> {
    const p = 'tool_overrides';
    try {
      const snap = await getDocs(collection(db, 'tool_overrides'));
      return snap.docs.map((d) => d.data() as ToolOverrideDoc);
    } catch (e) {
      console.warn('Tool overrides fetch notice:', e);
      return [];
    }
  }

  async setToolOverride(override: ToolOverrideDoc): Promise<void> {
    if (!auth.currentUser) return;
    const p = `tool_overrides/${override.toolId}`;
    try {
      await setDoc(doc(db, 'tool_overrides', override.toolId), override, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  // --- SYSTEM SETTINGS ---
  async getSystemSettings(): Promise<SystemSettingsDoc | null> {
    const p = 'system_settings/global';
    try {
      const snap = await getDoc(doc(db, 'system_settings', 'global'));
      return snap.exists() ? (snap.data() as SystemSettingsDoc) : null;
    } catch (e) {
      console.warn('System settings fetch notice:', e);
      return null;
    }
  }

  async updateSystemSettings(settings: Partial<SystemSettingsDoc>): Promise<void> {
    if (!auth.currentUser) return;
    const p = 'system_settings/global';
    try {
      await setDoc(
        doc(db, 'system_settings', 'global'),
        { ...settings, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  // --- TEMPLATES ---
  async listUserTemplates(userId: string): Promise<TemplateDoc[]> {
    if (!this.isUserAuthenticated(userId)) return [];
    const p = 'templates';
    try {
      const q = query(collection(db, 'templates'), where('userId', '==', userId), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TemplateDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }

  async listPublicTemplates(): Promise<TemplateDoc[]> {
    const p = 'templates';
    try {
      const q = query(collection(db, 'templates'), where('visibility', '==', 'PUBLIC'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TemplateDoc);
    } catch (e) {
      console.warn('Public templates fetch notice:', e);
      return [];
    }
  }

  async getTemplate(templateId: string): Promise<TemplateDoc | null> {
    const p = `templates/${templateId}`;
    try {
      const snap = await getDoc(doc(db, 'templates', templateId));
      return snap.exists() ? (snap.data() as TemplateDoc) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, p);
      return null;
    }
  }

  async saveTemplate(template: TemplateDoc): Promise<void> {
    if (!this.isUserAuthenticated(template.userId)) return;
    const p = `templates/${template.templateId}`;
    try {
      await setDoc(doc(db, 'templates', template.templateId), template, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `templates/${templateId}`;
    try {
      await deleteDoc(doc(db, 'templates', templateId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  // --- SAVED PROMPTS ---
  async listUserPrompts(userId: string): Promise<SavedPromptDoc[]> {
    if (!this.isUserAuthenticated(userId)) return [];
    const p = 'saved_prompts';
    try {
      const q = query(collection(db, 'saved_prompts'), where('userId', '==', userId), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as SavedPromptDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }

  async savePrompt(prompt: SavedPromptDoc): Promise<void> {
    if (!this.isUserAuthenticated(prompt.userId)) return;
    const p = `saved_prompts/${prompt.promptId}`;
    try {
      await setDoc(doc(db, 'saved_prompts', prompt.promptId), prompt, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async deletePrompt(promptId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `saved_prompts/${promptId}`;
    try {
      await deleteDoc(doc(db, 'saved_prompts', promptId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  async toggleFavoritePrompt(promptId: string, favorite: boolean): Promise<void> {
    if (!auth.currentUser) return;
    const p = `saved_prompts/${promptId}`;
    try {
      await updateDoc(doc(db, 'saved_prompts', promptId), {
        favorite,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  // --- PROJECT ACTIONS ---
  async archiveProject(projectId: string, archived: boolean): Promise<void> {
    if (!auth.currentUser) return;
    const p = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        archived,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async duplicateProject(projectId: string): Promise<ProjectDoc | null> {
    if (!auth.currentUser) return null;
    const project = await this.getProject(projectId);
    if (!project || project.userId !== auth.currentUser.uid) return null;

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duplicated: ProjectDoc = {
      ...project,
      projectId: newId,
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.setProject(duplicated);
    return duplicated;
  }

  // --- NOTIFICATION ACTIONS ---

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (!this.isUserAuthenticated(userId)) return;
    const p = 'notifications';
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        limit(100)
      );
      const snap = await getDocs(q);
      const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
      await Promise.all(updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    if (!auth.currentUser) return;
    const p = `notifications/${notificationId}`;
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, p);
    }
  }

  // --- DATA EXPORT & ACCOUNT DELETION ---
  async exportUserData(userId: string): Promise<Record<string, any>> {
    if (!this.isUserAuthenticated(userId)) throw new Error('Unauthorized export request');

    const [userDoc, projects, files, prompts, templates, favorites, notifications] = await Promise.all([
      this.getUser(userId),
      this.listUserProjects(userId),
      this.listUserFiles(userId),
      this.listUserPrompts(userId),
      this.listUserTemplates(userId),
      (async () => {
        const q = query(collection(db, 'favorites'), where('userId', '==', userId), limit(100));
        const s = await getDocs(q);
        return s.docs.map((d) => d.data());
      })(),
      (async () => {
        const q = query(collection(db, 'notifications'), where('userId', '==', userId), limit(100));
        const s = await getDocs(q);
        return s.docs.map((d) => d.data());
      })(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: userDoc,
      projects,
      files,
      prompts,
      templates,
      favorites,
      notifications,
    };
  }

  async deleteUserAccount(userId: string): Promise<boolean> {
    if (!this.isUserAuthenticated(userId)) throw new Error('Unauthorized deletion request');

    try {
      // 1. Delete user projects
      const projects = await this.listUserProjects(userId);
      await Promise.all(projects.map((p) => this.deleteProject(p.projectId)));

      // 2. Delete user files metadata
      const files = await this.listUserFiles(userId);
      await Promise.all(files.map((f) => this.deleteFile(f.fileId)));

      // 3. Delete user prompts
      const prompts = await this.listUserPrompts(userId);
      await Promise.all(prompts.map((p) => this.deletePrompt(p.promptId)));

      // 4. Delete user templates
      const templates = await this.listUserTemplates(userId);
      await Promise.all(templates.map((t) => this.deleteTemplate(t.templateId)));

      // 5. Delete notifications
      const notifQ = query(collection(db, 'notifications'), where('userId', '==', userId), limit(100));
      const notifSnap = await getDocs(notifQ);
      await Promise.all(notifSnap.docs.map((d) => deleteDoc(d.ref)));

      // 6. Delete favorites
      const favQ = query(collection(db, 'favorites'), where('userId', '==', userId), limit(100));
      const favSnap = await getDocs(favQ);
      await Promise.all(favSnap.docs.map((d) => deleteDoc(d.ref)));

      // 7. Delete user profile doc
      await deleteDoc(doc(db, 'users', userId));

      return true;
    } catch (e) {
      console.error('Account deletion execution error:', e);
      return false;
    }
  }
}

export const firestore = new FirestoreService();
