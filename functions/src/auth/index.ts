import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// User account initialization trigger
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(user.uid);

  // Check if initial admin email
  const isAdmin = user.email === 'AlHelal711@gmail.com';

  await userRef.set({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Creator',
    photoURL: user.photoURL || '',
    role: isAdmin ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    settings: {
      theme: 'system',
      defaultFormat: 'png',
      autoEnhance: true,
      notificationsEnabled: true,
    },
  }, { merge: true });

  if (isAdmin) {
    await db.collection('admins').doc(user.uid).set({
      role: 'superadmin',
      email: user.email,
      grantedAt: new Date().toISOString(),
    });
  }
});

// User deletion cleanup trigger
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // Delete user document
  await db.collection('users').doc(user.uid).delete();
  await db.collection('admins').doc(user.uid).delete().catch(() => {});

  // Clean user files from Firebase Storage
  try {
    await bucket.deleteFiles({ prefix: `users/${user.uid}/` });
  } catch (err) {
    console.warn(`Failed to clean storage files for user ${user.uid}:`, err);
  }
});
