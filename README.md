# Al_Helal AI Tools — Next-Generation Visual Creation & Editing Platform

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-Multimodal-4285F4.svg)](https://ai.google.dev)
[![Zero Credits](https://img.shields.io/badge/Credits-100%25_Free-emerald.svg)](#zero-credit-philosophy)

Al_Helal AI Tools is a modern, production-grade visual creation and editing web application inspired by the workflow architecture of professional imaging suites, built as an independent creation platform with an original visual identity.

---

## 🌟 Zero-Credit Philosophy

Unlike platforms that restrict users behind credit deductions, coin balances, and recharge paywalls:
- **No credits or coin balances anywhere** in the user interface.
- **100% free-to-use** across all enabled tools.
- High-throughput capacity managed technically via server-side queuing, rate-limiting, and client-side canvas acceleration.

---

## 🚀 Key Feature Workspaces

1. **Background Remover**:
   - 1-click subject extraction with fine edge feathering and hair contour matting.
   - Interactive checkerboard transparency preview.
   - Solid studio color fills (pure white, off-white, crimson, sky blue) or custom uploaded backdrop.
   - Interactive draggable Before/After comparison slider.
   - Instant high-res PNG download.

2. **AI Image Generator**:
   - Natural language text-to-image synthesis powered by Google Gemini multimodal models (`gemini-3.1-flash-lite-image`).
   - Multiple aspect ratios (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`).
   - 11 aesthetic presets: Photorealistic, Cinematic, 3D Render, Anime, Watercolor, Fashion, Minimalist.
   - Built-in AI prompt expander (`gemini-3.8-flash`) and negative prompt support.

3. **Object Remover & Retouching**:
   - Interactive HTML5 drawing canvas with smart mask brush, eraser, and adjustable brush sizes.
   - Multi-step Undo/Redo history stack and zoom/pan controls.
   - Iterative texture diffusion and inpainting algorithms.

4. **Photo Enhancer & Super-Resolution**:
   - 2x and 4x super-resolution upscaling.
   - Unsharp masking, high-frequency sharpness boost, and contrast dynamic range recovery.
   - Interactive split comparison slider.

5. **Passport & ID Photo Maker**:
   - Biometric country presets: US (2x2" / 51x51mm), EU/UK (35x45mm), India, and China.
   - Background replacement with official white, off-white, light blue, and neutral gray.
   - Formal suit overlay selector (Navy Executive, Charcoal Black, Formal Gray).
   - Printable 4x6" (1200x1800 px at 300 DPI) sheet grid with cutting guidelines for pharmacy/home printing.

6. **E-Commerce Product Studio**:
   - Automated product cutout and catalog staging.
   - Stage presets: Travertine stone pedestal, Amazon pure white (#ffffff), luxury dark granite, warm wood tabletop.
   - Realistic contact drop shadows with depth and blur controls.
   - Standard export channels: Amazon (1:1 2000px), Shopify (4:3), Instagram Post (1:1), Story/Reels (9:16).

7. **AI Design & Poster Studio**:
   - Typographic composition engine for promotional posters, social media banners, and wallpapers.
   - Automated visual backdrop generation with headline and subheading overlays.

8. **AI Video Hub**:
   - Generative video architecture for Image-to-Video, Video Background Removal, and Portrait Motion.
   - Transparent provider state reporting ("AI provider not configured" when specialized GPU clusters are offline).

9. **Utility Studio**:
   - Local browser-accelerated image compressor (up to 85% file size reduction).
   - Format conversion between WebP, PNG, and JPEG with custom quality and width limits.

10. **Administrator Console**:
    - Live throughput metrics, active users, storage utilization, and audit logs.
    - Individual tool governance (enable/disable toggles, daily user quotas, max file size).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Express full-stack proxy running with Vite dev middleware (`server.ts`).
- **AI Engine**: Google GenAI SDK (`@google/genai`) using `gemini-3.1-flash-lite-image` and `gemini-3.8-flash`.
- **Database & Security**: Firebase Firestore rules (`firestore.rules`), Storage rules (`storage.rules`), Blueprint (`firebase-blueprint.json`).

---

## 📦 Quick Start & Local Development

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/your-username/pixelforge-ai.git
cd pixelforge-ai
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure environment variables
Copy `.env.example` to `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`
Set your Gemini API key:
\`\`\`env
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=3000
\`\`\`

### 4. Run development server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Build & Deployment

### 1. Build Application & Cloud Functions
\`\`\`bash
# Build frontend web assets (Vite -> dist)
npm run build

# Build serverless Cloud Functions (TypeScript -> functions/lib)
npm run --prefix functions build
\`\`\`

### 2. Firebase Deployment via CLI
\`\`\`bash
# Authenticate to Firebase
firebase login

# Set active project
firebase use civil-groove-n8gvj

# Deploy all services (Frontend, Cloud Functions, Security Rules)
firebase deploy --only hosting,functions,firestore:rules,storage:rules

# Or deploy individually:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
\`\`\`

### 3. Setting Server-Side AI Provider Secrets (Cloud Functions)
To configure the Google Gemini API key securely in production without committing keys to Git:
\`\`\`bash
# Set Gemini API key as a Cloud Function secret or environment variable
firebase functions:secrets:set GEMINI_API_KEY
\`\`\`

---

## 🐙 GitHub Repository & Automated CI/CD

### 1. Initializing Git & Connecting Remote
\`\`\`bash
git init
git add .
git commit -m "feat: complete Al_Helal AI Tools production release"
git branch -M main
git remote add origin https://github.com/<your-username>/al-helal-ai-tools.git
git push -u origin main
\`\`\`

### 2. GitHub Actions Secrets Configuration
In your GitHub repository settings under **Settings > Secrets and variables > Actions**, configure the following:

| Secret Name | Description | Source |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON key for deployment | Firebase Console > Project Settings > Service accounts |
| `VITE_FIREBASE_API_KEY` | Public client API key | `firebase-applet-config.json` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `civil-groove-n8gvj.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `civil-groove-n8gvj` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Cloud Storage bucket | `civil-groove-n8gvj.firebasestorage.app` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:385970805771:web:ef0d43af7abf779f027b0e` |

---

## 🔒 Security & Privacy

- **Zero Client API Key Leakage**: All generative AI requests are handled exclusively through server-side proxy routes and authenticated Cloud Functions.
- **ABAC Firestore Security**: Fine-grained Attribute-Based Access Control isolating user documents to authenticated UIDs.
- **Privacy-First Processing**: In-browser client canvas processing whenever possible for immediate privacy and zero latency.
- **100% Free / Zero Credits**: No coin balances, fake free counters, or payment paywalls.

---

## 📄 License

Licensed under the Apache License, Version 2.0. See LICENSE for details.
