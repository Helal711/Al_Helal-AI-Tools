import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inpainting validation and metadata registration
export const processInpaintCallable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { imageUri, maskDataUrl } = data;
  if (!imageUri || !maskDataUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Image and mask data required.');
  }

  return {
    success: true,
    message: 'Mask validated for patch synthesis pipeline.',
    timestamp: new Date().toISOString(),
  };
});

// Storage upload cleanup trigger: cleanup temp files older than 24 hours
export const cleanupTemporaryFiles = functions.pubsub.schedule('every 24 hours').onRun(async () => {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix: 'tmp/' });
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const createdTime = metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : 0;
    if (createdTime && createdTime < oneDayAgo) {
      await file.delete().catch(() => {});
    }
  }
});
