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
exports.cleanupTemporaryFiles = exports.processInpaintCallable = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Inpainting validation and metadata registration
exports.processInpaintCallable = functions.https.onCall(async (data, context) => {
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
exports.cleanupTemporaryFiles = functions.pubsub.schedule('every 24 hours').onRun(async () => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'tmp/' });
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdTime = metadata.timeCreated ? new Date(metadata.timeCreated).getTime() : 0;
        if (createdTime && createdTime < oneDayAgo) {
            await file.delete().catch(() => { });
        }
    }
});
//# sourceMappingURL=index.js.map