import React, { useState } from 'react';
import {
  Search,
  Scissors,
  Sparkles,
  Maximize2,
  Eraser,
  Sliders,
  FileBadge,
  ShoppingBag,
  LayoutTemplate,
  Video,
  Archive,
  Zap,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { ALL_TOOLS, CATEGORY_METADATA } from '../data/toolsData';

interface AllToolsPageProps {
  initialCategory?: string;
  setActiveView: (view: string) => void;
}

export const AllToolsPage: React.FC<AllToolsPageProps> = ({
  initialCategory = 'all',
  setActiveView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'name'>('featured');

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.shortDescription.toLowerCase().includes(q) ||
      tool.capabilities.some((c) => c.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  }).sort((a, b) => {
    if (sortBy === 'featured') {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
    if (sortBy === 'popular') {
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    }
    return a.name.localeCompare(b.name);
  });

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Scissors': return <Scissors className="h-5 w-5" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5" />;
      case 'Eraser': return <Eraser className="h-5 w-5" />;
      case 'Maximize2': return <Maximize2 className="h-5 w-5" />;
      case 'Sliders': return <Sliders className="h-5 w-5" />;
      case 'FileBadge': return <FileBadge className="h-5 w-5" />;
      case 'ShoppingBag': return <ShoppingBag className="h-5 w-5" />;
      case 'LayoutTemplate': return <LayoutTemplate className="h-5 w-5" />;
      case 'Video': return <Video className="h-5 w-5" />;
      case 'Archive': return <Archive className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Creative Tools Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Browse our full suite of {ALL_TOOLS.length} visual creation, editing, enhancement, and e-commerce tools.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tools by name or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Categories & Sorting Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-700/60">
          {CATEGORY_METADATA.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden ${
                  isSelected
                    ? 'bg-white text-indigo-600 shadow-2xs dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-[11px] text-slate-400 font-mono">({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end lg:self-auto text-xs text-slate-500 dark:text-slate-400">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="featured">Featured First</option>
            <option value="popular">Popular First</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tools match your search criteria</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search query or switching categories.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 min-h-[44px] rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-colors">
                    {getToolIcon(tool.iconName)}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    {tool.category.replace('ai-', '')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {tool.shortDescription}
                </p>

                {/* Capabilities rendered with clean typographic separators (Zero-Pill discipline) */}
                <div className="mt-4 flex flex-wrap gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {tool.capabilities.map((cap, i) => (
                    <span key={i} className="after:content-['·'] last:after:content-[''] after:mx-1">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {tool.status === 'active' ? 'Free to use' : tool.status === 'pipeline_ready' ? 'Pipeline Ready' : 'Free Tool'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView(`tool:${tool.slug}`)}
                  className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-600 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden transition-all shadow-2xs"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
