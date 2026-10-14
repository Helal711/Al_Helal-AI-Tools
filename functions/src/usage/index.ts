import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Scheduled job recovery: Find jobs stuck in 'processing' state for > 3 minutes and mark 'failed'
export const recoverStuckJobs = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const db = admin.firestore();
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

  const stuckGenerations = await db.collection('generations')
    .where('status', '==', 'processing')
    .where('createdAt', '<', threeMinutesAgo)
    .limit(50)
    .get();

  const batch = db.batch();
  stuckGenerations.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'failed',
      errorMessage: 'Processing timed out. Please retry the operation.',
      completedAt: new Date().toISOString(),
    });
  });

  if (stuckGenerations.size > 0) {
    await batch.commit();
    console.log(`Recovered ${stuckGenerations.size} stuck jobs.`);
  }
});
