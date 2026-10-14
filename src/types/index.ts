export type ToolCategory =
  | 'ai-image'
  | 'ai-design'
  | 'ai-portrait'
  | 'ai-ecommerce'
  | 'ai-video'
  | 'ai-utility';

export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  shortDescription: string;
  longDescription: string;
  iconName: string;
  featured?: boolean;
  popular?: boolean;
  badge?: string;
  capabilities: string[];
  sampleImage?: string;
  status: 'active' | 'beta' | 'pipeline_ready';
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'preparing' | 'processing' | 'generating' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface GeneratedImageItem {
  id: string;
  url: string;
  originalUrl?: string;
  originalImage?: string;
  processedImage?: string;
  prompt?: string;
  tool: string;
  style?: string;
  aspectRatio?: string;
  createdAt: string;
  fileSize?: string;
  dimensions?: { width: number; height: number };
  metadata?: Record<string, any>;
}

export type HistoryItem = GeneratedImageItem;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  role: 'USER' | 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN' | 'user' | 'admin';
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    autoEnhance?: boolean;
    defaultFormat?: 'png' | 'webp' | 'jpeg';
  };
}

export interface AdminMetrics {
  totalUsers: number;
  activeToday: number;
  totalCreations: number;
  geminiCalls: number;
  storageUsedMB: number;
  errorRatePercent: number;
  uptimePercent: number;
}

export interface ToolAdminConfig {
  id: string;
  name: string;
  enabled: boolean;
  dailyLimitPerUser: number;
  maxFileSizeMB: number;
  provider: 'gemini' | 'client-canvas' | 'hybrid';
  preferredModel: string;
}
