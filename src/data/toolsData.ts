import { ToolItem, ToolCategory } from '../types';
import { MASTER_TOOL_REGISTRY, ToolRegistryItem } from './toolRegistry';

function mapCategory(cat: ToolRegistryItem['category']): ToolCategory {
  switch (cat) {
    case 'AI_IMAGE':
    case 'AI_EDITOR':
      return 'ai-image';
    case 'AI_PORTRAIT':
      return 'ai-portrait';
    case 'AI_ECOMMERCE':
      return 'ai-ecommerce';
    case 'AI_DESIGN':
      return 'ai-design';
    case 'AI_VIDEO':
      return 'ai-video';
    case 'AI_UTILITY':
    default:
      return 'ai-utility';
  }
}

export const ALL_TOOLS: ToolItem[] = MASTER_TOOL_REGISTRY.map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  category: mapCategory(item.category),
  shortDescription: item.shortDescription,
  longDescription: item.description,
  iconName: item.icon,
  featured: item.featured ?? false,
  popular: item.popular ?? false,
  badge: item.badge,
  capabilities: item.tags.slice(0, 4),
  status: item.status === 'ready' ? 'active' : item.status === 'provider_required' ? 'pipeline_ready' : 'beta',
}));

export const CATEGORY_METADATA = [
  { id: 'all', label: 'All Tools', count: ALL_TOOLS.length },
  { id: 'ai-image', label: 'AI Image & Cutout', count: ALL_TOOLS.filter((t) => t.category === 'ai-image').length },
  { id: 'ai-portrait', label: 'Portraits & Passports', count: ALL_TOOLS.filter((t) => t.category === 'ai-portrait').length },
  { id: 'ai-ecommerce', label: 'E-Commerce Studio', count: ALL_TOOLS.filter((t) => t.category === 'ai-ecommerce').length },
  { id: 'ai-design', label: 'Design & Social', count: ALL_TOOLS.filter((t) => t.category === 'ai-design').length },
  { id: 'ai-utility', label: 'Local Utilities', count: ALL_TOOLS.filter((t) => t.category === 'ai-utility').length },
  { id: 'ai-video', label: 'Video Hub', count: ALL_TOOLS.filter((t) => t.category === 'ai-video').length },
];

