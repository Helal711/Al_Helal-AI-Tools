import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Scissors,
  Wand2,
  FolderKanban,
  Heart,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  ArrowRight,
  Maximize2,
  Sliders,
  Crop,
  Video,
  UploadCloud,
  Cpu,
  Layers,
  Bell,
  Shield,
} from 'lucide-react';
import { MASTER_TOOL_REGISTRY } from '../../data/toolRegistry';
import { useTheme } from '../../context/ThemeContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleTheme, isDark } = useTheme();

  // Quick command actions
  const defaultActions = [
    {
      id: 'tool:background-remover',
      title: 'Open Background Remover',
      category: 'Quick Tool',
      icon: Scissors,
    },
    {
      id: 'tool:ai-image-generator',
      title: 'Create AI Image',
      category: 'Quick Tool',
      icon: Sparkles,
    },
    {
      id: 'tool:image-editor',
      title: 'Open AI Image Editor',
      category: 'Quick Tool',
      icon: Wand2,
    },
    {
      id: 'tool:image-upscaler',
      title: 'Open Image Upscaler',
      category: 'Quick Tool',
      icon: Maximize2,
    },
    {
      id: 'tool:object-remover',
      title: 'Open Object Eraser',
      category: 'Quick Tool',
      icon: Crop,
    },
    {
      id: 'projects',
      title: 'Open My Projects',
      category: 'Workspace',
      icon: FolderKanban,
    },
    {
      id: 'dashboard/files',
      title: 'Open All Files & Storage',
      category: 'Workspace',
      icon: UploadCloud,
    },
    {
      id: 'dashboard/jobs',
      title: 'Open Processing Jobs Monitor',
      category: 'Workspace',
      icon: Cpu,
    },
    {
      id: 'dashboard/templates',
      title: 'Open Creative Templates',
      category: 'Workspace',
      icon: Layers,
    },
    {
      id: 'dashboard/prompts',
      title: 'Open Saved Prompts Library',
      category: 'Workspace',
      icon: Sparkles,
    },
    {
      id: 'dashboard/notifications',
      title: 'Open Activity Notifications',
      category: 'Workspace',
      icon: Bell,
    },
    {
      id: 'favorites',
      title: 'Open Favorites',
      category: 'Workspace',
      icon: Heart,
    },
    {
      id: 'dashboard/privacy',
      title: 'Open Privacy & Data Management',
      category: 'Workspace',
      icon: Shield,
    },
    {
      id: 'settings',
      title: 'Open Studio Settings',
      category: 'Workspace',
      icon: Settings,
    },
    {
      id: 'theme_toggle',
      title: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: isDark ? Sun : Moon,
    },
    {
      id: 'docs',
      title: 'Open Help & Guides',
      category: 'Help',
      icon: HelpCircle,
    },
  ];

  // Search filtered items
  const filteredTools = query.trim()
    ? MASTER_TOOL_REGISTRY.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }).map((t) => ({
        id: `tool:${t.slug}`,
        title: t.name,
        category: t.category.replace('_', ' '),
        icon: Sparkles,
      }))
    : defaultActions;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredTools[selectedIndex];
      if (selected) {
        if (selected.id === 'theme_toggle') {
          toggleTheme();
        } else {
          onSelectAction(selected.id);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tools..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching tools or commands found.
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredTools.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (item.id === 'theme_toggle') {
                        toggleTheme();
                      } else {
                        onSelectAction(item.id);
                      }
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
            <span>·</span>
            <span>Select <kbd className="font-mono">↵</kbd></span>
          </div>
          <span>Al_Helal AI Tools Fast Actions</span>
        </div>
      </div>
    </div>
  );
};
