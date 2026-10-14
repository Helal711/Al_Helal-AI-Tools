import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// On project deletion, clean up any associated storage files
export const onProjectDeleted = functions.firestore
  .document('projects/{projectId}')
  .onDelete(async (snap) => {
    const data = snap.data();
    if (!data) return;

    const bucket = admin.storage().bucket();
    const userId = data.userId;
    const projectId = snap.id;

    if (userId) {
      try {
        await bucket.deleteFiles({ prefix: `users/${userId}/projects/${projectId}` });
      } catch (e) {
        console.warn(`Could not clean storage for project ${projectId}:`, e);
      }
    }
  });
