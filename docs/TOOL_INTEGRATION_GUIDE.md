# PixelForge AI — Tool Integration & Developer Guide

## 1. How to Register a New Tool
To add a new visual tool to PixelForge AI:

1. **Declare Tool Metadata**:
   Open `src/data/toolRegistry.ts` and add a new entry to `MASTER_TOOL_REGISTRY`:
   ```typescript
   {
     id: 'my-new-tool',
     name: 'My New Visual Tool',
     slug: 'my-new-tool',
     category: 'AI_IMAGE', // AI_IMAGE | AI_EDITOR | AI_PORTRAIT | AI_ECOMMERCE | AI_DESIGN | AI_UTILITY | AI_VIDEO
     description: 'Detailed description of visual algorithm and use cases.',
     shortDescription: '1-sentence summary.',
     icon: 'Sparkles',
     status: 'ready', // 'ready' | 'provider_required' | 'coming_soon' | 'disabled'
     provider: 'Google Gemini Pro Image Synthesis',
     requiresAI: true,
     supportsBatch: false,
     supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
     maxFileSize: 25,
     route: 'tool:my-new-tool',
     seoTitle: 'My New Visual Tool — PixelForge AI',
     seoDescription: 'High resolution visual transformation.',
     tags: ['visual', 'ai', 'editing'],
   }
   ```

2. **Map Tool in ToolDispatcher**:
   In `src/components/tools/ToolDispatcher.tsx`, add a routing case mapping your tool slug to its interactive component:
   ```typescript
   case 'my-new-tool':
     return <MyNewToolComponent />;
   ```

3. **Declare Capabilities in Capability Matrix**:
   In `src/services/ai/ToolCapabilityMatrix.ts`, map the new tool ID to its processing mode (`client_canvas` | `server_ai` | `hybrid` | `cluster_pipeline`) and required capability.

4. **Implement Provider Adapter Contract**:
   Ensure the provider adapter satisfies the `AIProvider` interface:
   ```typescript
   export class MyProvider extends BaseAIProvider {
     public readonly id = 'my-provider';
     public readonly name = 'My Provider Engine';
     public readonly capabilities = [AICapability.IMAGE_ENHANCEMENT];
     public readonly priority = 1;

     public async isAvailable(): Promise<boolean> { ... }
     public async healthCheck(): Promise<ProviderHealthReport> { ... }
   }
   ```

5. **Write Regression Tests**:
   Add test coverage in `tests/` verifying input validation, oversized file handling, and output serialization.

## 2. Capability Validation Rules
* Never claim a model supports background removal or transparent cutout unless its API or canvas engine explicitly extracts an alpha channel.
* Never fabricate fake outputs or simulated progress bars. If a provider is not connected, display the standardized "Provider Required" notice.
* Transparent PNGs must contain valid alpha channel bytes (`0` to `255`).
