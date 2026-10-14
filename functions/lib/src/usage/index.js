"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverStuckJobs = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Scheduled job recovery: Find jobs stuck in 'processing' state for > 3 minutes and mark 'failed'
exports.recoverStuckJobs = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
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
//# sourceMappingURL=index.js.map