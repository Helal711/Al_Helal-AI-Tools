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
exports.onUserDeleted = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// User account initialization trigger
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
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
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    // Delete user document
    await db.collection('users').doc(user.uid).delete();
    await db.collection('admins').doc(user.uid).delete().catch(() => { });
    // Clean user files from Firebase Storage
    try {
        await bucket.deleteFiles({ prefix: `users/${user.uid}/` });
    }
    catch (err) {
        console.warn(`Failed to clean storage files for user ${user.uid}:`, err);
    }
});
//# sourceMappingURL=index.js.map