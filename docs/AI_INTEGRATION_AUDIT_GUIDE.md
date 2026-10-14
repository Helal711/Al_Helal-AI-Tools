# PixelForge AI — AI Integration Audit Guide

## 1. Overview
The **AI Integration Audit** is an automated and continuous architectural verification engine that validates every registered visual processing capability in PixelForge AI. Rather than relying on static claims or client-side UI buttons, the audit inspects real provider bindings, server environment variables, input constraints, and execution models.

## 2. Tool Discovery & Architecture
PixelForge AI maintains a single source of truth for tool definitions:
* **Tool Registry**: `src/data/toolRegistry.ts` (`MASTER_TOOL_REGISTRY`)
* **Capability Matrix**: `src/services/ai/ToolCapabilityMatrix.ts`
* **Provider Registry**: `src/services/ai/AIProviderRegistry.ts`
* **Backend Handlers**: `server.ts` & `src/services/imageProcessing.ts`

Every tool discovered in `MASTER_TOOL_REGISTRY` is mapped into a `ToolCapabilityRecord` covering:
* `toolId` and canonical `toolName`
* Audit category (e.g. Basic Utilities, Background Processing, Image Enhancement, Inpainting, Generative Synthesis, Portraits, Video, E-Commerce)
* Required capability (`AICapability` enum)
* Processing mode:
  * `client_canvas`: Hardware-accelerated WebGL/Canvas 2D execution in browser (zero server cost, zero latency, offline capable).
  * `server_ai`: Server-side neural synthesis via Google Gemini (`@google/genai`).
  * `hybrid`: Dual client/server architecture with instant local canvas rendering and server-side neural refinement passes.
  * `cluster_pipeline`: Dedicated GPU rendering clusters for high-throughput temporal video synthesis.

## 3. Implementation Statuses Explained
* **Fully Implemented (`fully_implemented`)**: Both the UI component, processing algorithms, and provider adapters are complete and operational. Client canvas tools and connected Gemini tools hold this status.
* **Partially Implemented (`partially_implemented`)**: The client canvas workflow and editing suites are fully operational, but advanced prompt-guided multi-modal passes require an external API key.
* **Provider Required (`provider_required`)**: The feature pipeline is architected, but requires specialized external infrastructure (e.g., Veo Video Cluster). The UI transparently presents a "Provider Required" standby notice and **never produces fake outputs**.
* **Blocked Missing Config (`blocked_missing_config`)**: A real provider integration exists, but mandatory environment variables (e.g. `GEMINI_API_KEY`) are missing from the server environment.

## 4. Test Result Interpretations
* **PASSED**: The tool was executed with a non-destructive verification payload (e.g., in-memory PNG rasterization or backend health ping) and successfully produced a valid, readable output buffer within tolerance.
* **SKIPPED**: The tool is currently marked as *Provider Required* (e.g., video rendering cluster), and is intentionally bypassed to avoid fabricating simulated outputs.
* **FAILED**: The tool failed execution, encountered a timeout, or the server returned an error.

## 5. Known Limitations
1. **Browser Memory Bounding**: Client-side canvas tools operate on images up to 25MB and dimensions up to 16,384 x 16,384 px.
2. **Generative Model Quotas**: Google Gemini image synthesis operations are subject to daily fair-use technical limits (configurable in Admin Console).
3. **Zero Credit Policy**: PixelForge AI does not use a credit balance, credit purchases, or paywalls. Fair use is managed via rate-limiting and operational quotas.
