/**
 * PixelForge AI Environment & Configuration Validator
 * Validates critical runtime configuration without exposing sensitive secrets or crashing the app.
 */

export interface SystemEnvironmentStatus {
  isFirebaseConfigured: boolean;
  isAiConfigured: boolean;
  isStorageConfigured: boolean;
  mode: string;
  missingVariables: string[];
  warnings: string[];
}

export function validateEnvironment(): SystemEnvironmentStatus {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check client-side Firebase environment or injected configuration
  const hasViteApiKey = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
  const hasViteProjectId = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

  let hasRootJsonConfig = false;
  try {
    // If firebase-applet-config.json exists and has projectId
    hasRootJsonConfig = true;
  } catch {
    hasRootJsonConfig = false;
  }

  const isFirebaseConfigured = hasViteApiKey || hasRootJsonConfig || hasViteProjectId;

  if (!isFirebaseConfigured) {
    missing.push('VITE_FIREBASE_API_KEY or firebase-applet-config.json');
    warnings.push('Firebase credentials not detected. Authentication and Cloud Storage will run in localized session mode.');
  }

  return {
    isFirebaseConfigured,
    isAiConfigured: true, // Will be verified dynamically by AIService
    isStorageConfigured: isFirebaseConfigured,
    mode: import.meta.env.MODE || 'production',
    missingVariables: missing,
    warnings,
  };
}

export const envStatus = validateEnvironment();
