/**
 * Al_Helal AI Tools Provider Architecture & Capability Types
 * Standardized interfaces decoupling all UI tools from AI providers.
 */

export interface ProviderCapabilityRegistry {
  backgroundRemoval: boolean;
  objectRemoval: boolean;
  imageGeneration: boolean;
  imageEditing: boolean;
  upscaling: boolean;
  photoEnhancement: boolean;
  videoGeneration: boolean;
  promptExpansion: boolean;
  imageAnalysis: boolean;
}

export interface ProviderHealthStatus {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'not_configured' | 'maintenance' | 'degraded';
  model?: string;
  latencyMs?: number;
  message: string;
}

// Unified Result Interface for all provider outputs
export interface AIProviderResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model?: string;
  processingTimeMs: number;
}

// 1. Image Generation Options & Interface
export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: string;
  negativePrompt?: string;
  userId?: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generateImage(options: GenerateImageOptions): Promise<AIProviderResult<{ imageUrl: string; prompt: string; seed?: number }>>;
}

// 2. Image Editing Options & Interface
export interface EditImageOptions {
  imageBase64: string;
  instruction: string;
  mimeType?: string;
  userId?: string;
}

export interface ImageEditingProvider {
  readonly name: string;
  editImage(options: EditImageOptions): Promise<AIProviderResult<{ imageUrl: string; instruction: string }>>;
}

// 3. Background Removal Options & Interface
export interface RemoveBackgroundOptions {
  imageUri: string;
  sensitivity?: number;
  bgColor?: string;
  customBgImage?: string;
  feather?: number;
  userId?: string;
}

export interface BackgroundRemovalProvider {
  readonly name: string;
  removeBackground(options: RemoveBackgroundOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
}

// 4. Object Removal & Inpainting Options & Interface
export interface RemoveObjectOptions {
  imageUri: string;
  maskDataUrl: string; // Base64 mask image or transparent alpha canvas
  quality?: 'fast' | 'high';
  userId?: string;
}

export interface ObjectRemovalProvider {
  readonly name: string;
  removeObject(options: RemoveObjectOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
}

// 5. Image Upscaling Options & Interface
export interface UpscaleImageOptions {
  imageUri: string;
  scale: 1 | 2 | 4;
  sharpenAmount?: number;
  contrastBoost?: number;
  faceEnhance?: boolean;
  denoise?: boolean;
  userId?: string;
}

export interface ImageUpscaleProvider {
  readonly name: string;
  upscaleImage(options: UpscaleImageOptions): Promise<AIProviderResult<{ imageUrl: string; scale: number }>>;
}

// 6. Photo Enhancement Options & Interface
export interface EnhanceImageOptions {
  imageUri: string;
  sharpen?: number; // 0 to 100
  denoise?: boolean;
  lighting?: number; // 0 to 100
  colorCorrection?: boolean;
  faceEnhancement?: boolean;
  detailEnhancement?: boolean;
  userId?: string;
}

export interface EnhancementProvider {
  readonly name: string;
  enhanceImage(options: EnhanceImageOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
}

// 7. Video Generation Options & Interface
export interface GenerateVideoOptions {
  imageUri: string;
  durationSeconds?: number;
  motionStrength?: number;
  cameraMovement?: 'pan' | 'orbit' | 'zoom' | 'static';
  userId?: string;
}

export interface VideoProvider {
  readonly name: string;
  generateVideo(options: GenerateVideoOptions): Promise<AIProviderResult<{ videoUrl?: string; status: string }>>;
  getStatus(): Promise<{ available: boolean; message: string; reason: string }>;
}

// 8. Google Gemini Multimodal Provider Interface
export interface GeminiProvider {
  readonly name: string;
  readonly model: string;
  generateImage(options: GenerateImageOptions): Promise<AIProviderResult<{ imageUrl: string; prompt: string }>>;
  editImage(options: EditImageOptions): Promise<AIProviderResult<{ imageUrl: string; instruction: string }>>;
  analyzeImage(imageBase64: string): Promise<any>;
  classifyImage(imageBase64: string): Promise<{ category: string; tags: string[]; confidence: number }>;
  describeImage(imageBase64: string): Promise<string>;
  generatePromptSuggestions(prompt: string, style?: string): Promise<string>;
}

// Unified facade interface for frontend consumption
export interface IAIService {
  getCapabilities(): ProviderCapabilityRegistry;
  isAvailable(feature: keyof ProviderCapabilityRegistry): boolean;
  getUnavailableMessage(feature: keyof ProviderCapabilityRegistry): string;

  generateImage(options: GenerateImageOptions): Promise<AIProviderResult<{ imageUrl: string; prompt: string }>>;
  editImage(options: EditImageOptions): Promise<AIProviderResult<{ imageUrl: string; instruction: string }>>;
  removeBackground(options: RemoveBackgroundOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
  removeObject(options: RemoveObjectOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
  upscaleImage(options: UpscaleImageOptions): Promise<AIProviderResult<{ imageUrl: string; scale: number }>>;
  enhanceImage(options: EnhanceImageOptions): Promise<AIProviderResult<{ imageUrl: string }>>;
  generateVideo(options: GenerateVideoOptions): Promise<AIProviderResult<{ videoUrl?: string; status: string }>>;

  enhancePrompt(prompt: string, style?: string): Promise<string>;
  analyzeImage(imageBase64: string): Promise<any>;
  describeImage(imageBase64: string): Promise<string>;
}
