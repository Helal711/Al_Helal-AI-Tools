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
exports.enhancePromptCallable = exports.generateImageCallable = void 0;
const functions = __importStar(require("firebase-functions"));
const genai_1 = require("@google/genai");
// Initialize Gemini SDK with runtime secret
function getGenAIClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return null;
    return new genai_1.GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'pixelforge-cloud-functions' } },
    });
}
// Server-side callable for text-to-image synthesis
exports.generateImageCallable = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = data;
    if (!prompt || typeof prompt !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Valid prompt is required.');
    }
    const ai = getGenAIClient();
    if (!ai) {
        throw new functions.https.HttpsError('failed-precondition', 'Gemini AI provider is not configured.');
    }
    try {
        const fullPrompt = `${prompt}, ${style} style, high detail visual clarity`;
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio } },
        });
        let imageUrl = null;
        const candidates = response.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const mime = part.inlineData.mimeType || 'image/png';
                    imageUrl = `data:${mime};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        if (!imageUrl) {
            throw new functions.https.HttpsError('internal', 'Provider returned no image data.');
        }
        return {
            success: true,
            imageUrl,
            prompt: fullPrompt,
            createdAt: new Date().toISOString(),
        };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message || 'Image generation failed.');
    }
});
// Server-side callable for prompt enhancement
exports.enhancePromptCallable = functions.https.onCall(async (data) => {
    const { prompt, style = 'cinematic' } = data;
    if (!prompt)
        return { enhancedPrompt: prompt };
    const ai = getGenAIClient();
    if (!ai) {
        return { enhancedPrompt: `${prompt}, high detail ${style} composition, 8k resolution, studio lighting` };
    }
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Expand this prompt into a rich visual description for image generation: "${prompt}". Style: ${style}. Output ONLY the prompt text.`,
        });
        return { enhancedPrompt: res.text ? res.text.trim() : prompt };
    }
    catch {
        return { enhancedPrompt: prompt };
    }
});
//# sourceMappingURL=index.js.map