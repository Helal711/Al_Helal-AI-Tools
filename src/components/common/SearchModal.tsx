import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { ALL_TOOLS } from '../../data/toolsData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape or open on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools = ALL_TOOLS.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.shortDescription.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3.5">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search AI tools (e.g. background remover, passport, upscaler...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-500 ml-2">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No tools found matching &quot;{query}&quot;. Try searching for &quot;remover&quot;, &quot;portrait&quot;, or &quot;upscale&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Matching Tools ({filteredTools.length})
              </div>
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool.slug);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-indigo-50/60 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        {tool.name}
                      </span>
                      <span className="text-[11px] text-slate-400">· {tool.category.replace('ai-', '').toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {tool.shortDescription}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Footer hint */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            All creative tools 100% free to use with fair-use quotas
          </span>
          <span>Click to launch workspace</span>
        </div>
      </div>
    </div>
  );
};
