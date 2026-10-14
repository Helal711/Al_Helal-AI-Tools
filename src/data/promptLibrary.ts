/**
 * PixelForge AI — Prompt Library & Smart Prompt Assistant
 * 
 * Reusable prompt templates, categories, and generative prompt enhancer.
 */

export interface PromptTemplate {
  id: string;
  category: 'Product' | 'Portrait' | 'Fashion' | 'Landscape' | 'Marketing' | 'Social Media' | 'Background' | 'Creative';
  title: string;
  prompt: string;
  tags: string[];
}

export const PROMPT_LIBRARY: PromptTemplate[] = [
  // Product
  {
    id: 'prod-1',
    category: 'Product',
    title: 'Luxury Perfume on Marble',
    prompt: 'A sleek minimalist crystal perfume bottle resting on smooth Carrara marble, dramatic soft studio ray of light, water droplets, shallow depth of field, 8k commercial photography.',
    tags: ['luxury', 'perfume', 'marble', 'studio'],
  },
  {
    id: 'prod-2',
    category: 'Product',
    title: 'Modern Wireless Earbuds',
    prompt: 'Matte black wireless earbuds floating above charging case, neon cyan and magenta rim lighting, dark futuristic background, ultra-sharp product showcase render.',
    tags: ['tech', 'audio', 'futuristic', 'neon'],
  },
  {
    id: 'prod-3',
    category: 'Product',
    title: 'Natural Organic Skincare',
    prompt: 'Amber glass dropper bottle placed on rustic natural slate rock, fresh green eucalyptus leaves, warm morning golden sunlight, organic botanical aesthetic.',
    tags: ['cosmetics', 'organic', 'nature', 'sunlight'],
  },

  // Portrait
  {
    id: 'port-1',
    category: 'Portrait',
    title: 'Executive Studio Headshot',
    prompt: 'A confident corporate professional in tailored navy wool suit, soft gray studio backdrop, flattering softbox lighting, natural skin texture, 85mm portrait lens f/1.8.',
    tags: ['corporate', 'linkedin', 'executive', 'headshot'],
  },
  {
    id: 'port-2',
    category: 'Portrait',
    title: 'Moody Editorial Portrait',
    prompt: 'Cinematic portrait of a musician, dramatic chiaroscuro side lighting, warm amber and cobalt shadows, film grain 35mm aesthetic, introspective gaze.',
    tags: ['editorial', 'cinematic', 'moody', 'film'],
  },

  // Fashion
  {
    id: 'fash-1',
    category: 'Fashion',
    title: 'High-Fashion Milan Runway',
    prompt: 'Editorial fashion model walking a brutalist concrete runway, avant-garde silk drapery coat, overcast diffused daylight, Vogue magazine aesthetic.',
    tags: ['fashion', 'runway', 'editorial', 'vogue'],
  },
  {
    id: 'fash-2',
    category: 'Fashion',
    title: 'Vintage Streetwear 90s',
    prompt: 'Urban streetwear lookbook in Tokyo Harajuku street, oversized colorful retro jacket, disposable camera flash photography, vintage 90s film aesthetic.',
    tags: ['streetwear', 'tokyo', 'retro', 'urban'],
  },

  // Landscape
  {
    id: 'land-1',
    category: 'Landscape',
    title: 'Misty Alpine Lake Sunrise',
    prompt: 'Breathtaking reflection of snow-capped granite peaks in a serene turquoise alpine lake, morning fog drifting through pine trees, warm golden dawn light, ultra wide angle.',
    tags: ['nature', 'mountains', 'lake', 'sunrise'],
  },
  {
    id: 'land-2',
    category: 'Landscape',
    title: 'Futuristic Cyberpunk Skyline',
    prompt: 'Sprawling high-tech metropolis at twilight, holographic neon billboards, flying autonomous vehicles, rain-slicked glass skywalks, photorealistic octane render.',
    tags: ['cyberpunk', 'sci-fi', 'neon', 'cityscape'],
  },

  // Background
  {
    id: 'bg-1',
    category: 'Background',
    title: 'Sunlit Minimalist Living Room',
    prompt: 'Sunlit Scandinavian living room interior, fluted oak wall paneling, bouclé cream chair, soft linen curtains casting gentle shadows, architecture digest photography.',
    tags: ['interior', 'scandinavian', 'minimal', 'sunlight'],
  },
  {
    id: 'bg-2',
    category: 'Background',
    title: 'Abstract Fluid 3D Ribbon',
    prompt: 'Ethereal iridescent liquid ribbons looping through dark void, iridescent prism chromatic reflections, smooth glossy glass curvature, 4k abstract wallpaper.',
    tags: ['abstract', '3d', 'iridescent', 'wallpaper'],
  },
];

/**
 * Smart Prompt Assistant (Section 42)
 * Enriches simple prompts into high-production descriptors.
 */
export function enhancePrompt(shortPrompt: string): string {
  const p = shortPrompt.trim();
  if (!p) return '';

  const enhancements = [
    'photorealistic 8k commercial quality',
    'cinematic soft studio lighting',
    'shot on 85mm prime lens f/1.8',
    'ultra-sharp textures and natural micro-details',
    'balanced color grading and ambient fill',
  ];

  return `${p}, ${enhancements.join(', ')}`;
}
