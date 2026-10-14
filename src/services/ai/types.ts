/**
 * PixelForge AI — Unified AI Engine Types & Capability Specifications
 * 
 * Provider-agnostic abstraction layer decoupling frontend tools from concrete AI models.
 */

// Centralized AI Capability Enum (Section 5)
export enum AICapability {
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  IMAGE_EDITING = 'IMAGE_EDITING',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  BACKGROUND_REMOVAL = 'BACKGROUND_REMOVAL',
  OBJECT_REMOVAL = 'OBJECT_REMOVAL',
  IMAGE_ENHANCEMENT = 'IMAGE_ENHANCEMENT',
  IMAGE_UPSCALING = 'IMAGE_UPSCALING',
  IMAGE_RESTORATION = 'IMAGE_RESTORATION',
  IMAGE_COLORIZATION = 'IMAGE_COLORIZATION',
  BACKGROUND_GENERATION = 'BACKGROUND_GENERATION',
  PORTRAIT_GENERATION = 'PORTRAIT_GENERATION',
  HEADSHOT_GENERATION = 'HEADSHOT_GENERATION',
  IMAGE_VARIATION = 'IMAGE_VARIATION',
  IMAGE_EXTENSION = 'IMAGE_EXTENSION',
  IMAGE_RELIGHTING = 'IMAGE_RELIGHTING',
  IMAGE_RECOLORING = 'IMAGE_RECOLORING',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  VIDEO_ENHANCEMENT = 'VIDEO_ENHANCEMENT',
  VIDEO_BACKGROUND_REMOVAL = 'VIDEO_BACKGROUND_REMOVAL',
  PHOTO_ANIMATION = 'PHOTO_ANIMATION',
}

// Provider Lifecycle & Health Statuses
export type ProviderStatus =
  | 'CONNECTED'
  | 'CONFIGURED'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'PROVIDER_REQUIRED'
  | 'DEVELOPMENT_MODE';

export interface ProviderHealthReport {
  available: boolean;
  status: ProviderStatus;
  latencyMs?: number;
  message: string;
  supportedCapabilities: AICapability[];
  activeModel?: string;
  lastCheckedAt: string;
}

// Common Operation Inputs
export interface GenerateImageInput {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: string;
  negativePrompt?: string;
  numberOfOutputs?: number;
  userId?: string;
}

export interface EditImageInput {
  imageBase64: string;
  instruction: string;
  mimeType?: string;
  userId?: string;
}

export interface AnalyzeImageInput {
  imageUri: string;
  prompt?: string;
  userId?: string;
}

export interface BackgroundRemovalInput {
  imageUri: string;
  sensitivity?: number;
  bgColor?: string;
  customBgImage?: string;
  feather?: number;
  outputFormat?: 'png' | 'webp';
  userId?: string;
}

export interface ObjectRemovalInput {
  imageUri: string;
  maskDataUrl: string;
  quality?: 'fast' | 'high';
  userId?: string;
}

export interface EnhanceImageInput {
  imageUri: string;
  sharpen?: number;
  lighting?: number;
  denoise?: boolean;
  contrast?: number;
  faceEnhancement?: boolean;
  colorCorrection?: boolean;
  detailEnhancement?: boolean;
  userId?: string;
}

export interface UpscaleInput {
  imageUri: string;
  scale: 1 | 2 | 4 | 8;
  sharpenAmount?: number;
  contrastBoost?: number;
  faceEnhance?: boolean;
  denoise?: boolean;
  userId?: string;
}

export interface VideoGenerationInput {
  imageUri: string;
  prompt?: string;
  durationSeconds?: number;
  motionStrength?: number;
  userId?: string;
}

// Standard Provider Result
export interface AIResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  providerId: string;
  modelId?: string;
  capability: AICapability;
  processingTimeMs: number;
  isFallback?: boolean;
  metadata?: Record<string, any>;
}

// Common AI Provider Interface (Section 4)
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AICapability[];
  readonly priority: number; // 1 = Highest

  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<ProviderHealthReport>;

  supports?(capability: AICapability): boolean;
  getCapabilities?(): AICapability[];
  validateInput?(input: any): { valid: boolean; error?: string };
  normalizeError?(error: any): any;

  generateImage?(input: GenerateImageInput): Promise<AIResult<{ imageUrl: string; prompt: string; seed?: number }>>;
  editImage?(input: EditImageInput): Promise<AIResult<{ imageUrl: string; instruction: string }>>;
  analyzeImage?(input: AnalyzeImageInput): Promise<AIResult<{ description: string; labels: string[]; dominantColors: string[] }>>;
  removeBackground?(input: BackgroundRemovalInput): Promise<AIResult<{ imageUrl: string }>>;
  removeObject?(input: ObjectRemovalInput): Promise<AIResult<{ imageUrl: string }>>;
  enhanceImage?(input: EnhanceImageInput): Promise<AIResult<{ imageUrl: string }>>;
  upscaleImage?(input: UpscaleInput): Promise<AIResult<{ imageUrl: string; scale: number }>>;
  generateVideo?(input: VideoGenerationInput): Promise<AIResult<{ videoUrl?: string; status: string }>>;
}

// AI Job Model (Section 13)
export type AIJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface AIJob {
  id: string;
  userId?: string;
  projectId?: string;
  toolId: string;
  capability: AICapability;
  providerId: string;
  modelId?: string;
  status: AIJobStatus;
  inputFileIds?: string[];
  outputFileIds?: string[];
  prompt?: string;
  parameters?: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  processingTimeMs?: number;
  retryCount: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

// AI Result Model (Section 27)
export interface AIResultRecord {
  id: string;
  userId: string;
  projectId?: string;
  jobId: string;
  toolId: string;
  providerId: string;
  modelId?: string;
  originalFileId?: string;
  resultFileId?: string;
  thumbnailFileId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// AI Audit Log Model (Section 42)
export interface AIAuditLog {
  id: string;
  userId?: string;
  jobId: string;
  toolId: string;
  providerId: string;
  modelId?: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY' | 'FALLBACK';
  processingTimeMs: number;
  errorCode?: string;
  errorMessage?: string;
}

// Tool to Capability Definition
export interface ToolCapabilityBinding {
  toolId: string;
  capability: AICapability;
  inputType: 'IMAGE' | 'PROMPT' | 'IMAGE_AND_MASK' | 'VIDEO';
  outputType: 'IMAGE' | 'TRANSPARENT_IMAGE' | 'VIDEO' | 'TEXT';
  supportsBatch: boolean;
  supportsBeforeAfter: boolean;
  preferredFormats: string[];
}
