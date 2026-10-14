import * as functions from 'firebase-functions';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with runtime secret
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'pixelforge-cloud-functions' } },
  });
}

// Server-side callable for text-to-image synthesis
export const generateImageCallable = functions.https.onCall(async (data, context) => {
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
      config: { imageConfig: { aspectRatio: aspectRatio as any } },
    });

    let imageUrl: string | null = null;
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
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Image generation failed.');
  }
});

// Server-side callable for prompt enhancement
export const enhancePromptCallable = functions.https.onCall(async (data) => {
  const { prompt, style = 'cinematic' } = data;
  if (!prompt) return { enhancedPrompt: prompt };

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
  } catch {
    return { enhancedPrompt: prompt };
  }
});
