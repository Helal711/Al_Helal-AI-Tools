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
exports.updateSystemSettingsCallable = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Secure Admin System Settings updater
exports.updateSystemSettingsCallable = functions.https.onCall(async (data, context) => {
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
//# sourceMappingURL=index.js.map