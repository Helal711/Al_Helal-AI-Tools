import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Secure Admin System Settings updater
export const updateSystemSettingsCallable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const db = admin.firestore();
  // Verify admin status from Firestore /admins collection
  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists && context.auth.token.email !== 'AlHelal711@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized. Requires Administrator role.');
  }

  const { dailyLimit, dailyRateLimitPerUser, maintenanceMode, activeProvider, enabledTools } = data;

  await db.collection('system_settings').doc('global').set({
    dailyLimit: dailyLimit ?? 25,
    dailyRateLimitPerUser: dailyRateLimitPerUser ?? 60,
    maintenanceMode: Boolean(maintenanceMode),
    activeProvider: activeProvider || 'Google AI Studio (Gemini)',
    enabledTools: enabledTools || [],
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  await db.collection('admin_logs').add({
    adminId: context.auth.uid,
    action: 'Update System Configuration',
    details: `Updated daily limit to ${dailyLimit} ops/day.`,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
});
