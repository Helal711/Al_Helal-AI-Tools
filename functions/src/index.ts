import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once for all functions
if (!admin.apps.length) {
  admin.initializeApp();
}

// 1. Authentication lifecycle
export * from './auth';

// 2. AI Generative & Multimodal functions
export * from './ai';

// 3. Image processing & storage cleanup
export * from './image';

// 4. Project lifecycle & triggers
export * from './projects';

// 5. System administration & governance
export * from './admin';

// 6. Usage rate limiting & stuck job recovery
export * from './usage';
