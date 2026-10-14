# PixelForge AI — Provider Setup & Credentials Guide

## 1. Provider Landscape
PixelForge AI supports both hardware-accelerated local canvas processing and server-side multimodal AI engines.

| Provider ID | Provider Name | Capabilities | Processing Tier | Required Env Var |
| :--- | :--- | :--- | :--- | :--- |
| `google-gemini` | Google Gemini Multimodal AI | Image Generation, Multimodal Editing, Visual Analysis, Prompt Expansion | Server-Side Express | `GEMINI_API_KEY` |
| `pixelforge-alpha-matte` | AlphaMatte V2 Engine | Background Removal, Transparent PNG Cutout | Hardware WebGL/Canvas | *None (Local)* |
| `pixelforge-super-res` | SuperResolution ESRGAN | 2x/4x/8x Upscaling, Frequency Reconstruction | Hardware WebGL/Canvas | *None (Local)* |
| `pixelforge-patch-inpaint` | PatchMatch Neural Eraser | Object Eraser, Inpainting Mask Compositing | Hardware WebGL/Canvas | *None (Local)* |
| `google-veo-cluster` | Veo 3.1 Video Cluster | Image-to-Video, Video Rotoscoping, Living Photos | Enterprise Cluster | `VEO_CLUSTER_API_KEY` |

## 2. Server-Side Environment Configuration
To configure the server-side Google Gemini engine:

1. Obtain a Google AI Studio API key from [Google AI Studio](https://aistudio.google.com/).
2. Create or update your `.env` file in the project root:
   ```env
   # Server-side API key for Google Gemini (NEVER exposed to frontend client)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Active Model Overrides (Optional)
   GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image
   GEMINI_TEXT_MODEL=gemini-3.8-flash
   ```
3. Restart the server:
   ```bash
   npm run dev
   ```

## 3. Security Rules & Key Protection
* **Zero Client Exposure**: The `GEMINI_API_KEY` is strictly consumed in `server.ts` by the `@google/genai` TypeScript SDK. It is **never** prefixed with `VITE_` and never bundled into client assets.
* **Server-side Rate Limiting**: All `/api/*` endpoints are guarded by an in-memory sliding-window rate limiter (60 requests/minute per IP) to prevent denial of service and API abuse.
* **Sanitized Logs**: The `AIErrorHandler` strips credential patterns and server paths from error responses before sending them to users.

## 4. Running a Safe Provider Health Probe
You can verify provider connectivity without triggering expensive generations:
1. Navigate to `/admin/integration-audit` (or Admin Panel -> **AI Integration Audit** tab).
2. Locate the **Google Gemini Multimodal AI** card in Section C.
3. Click **Probe Health**.
4. The server executes a lightweight ping probe using `generateContent` with a 1-word constraint, verifying roundtrip latency in milliseconds.
