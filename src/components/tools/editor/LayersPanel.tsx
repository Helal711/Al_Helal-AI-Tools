import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Layers,
  Sliders,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { IconButton } from '../../ui/IconButton';

export interface EditorLayer {
  id: string;
  name: string;
  type: 'image' | 'mask' | 'text' | 'adjustment';
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  data?: any;
}

export interface LayersPanelProps {
  layers: EditorLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onAddLayer: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  className?: string;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  className = '',
}) => {
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <Card padding="md" className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Layers ({layers.length})
          </h4>
        </div>
        <button
          type="button"
          onClick={onAddLayer}
          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>New Layer</span>
        </button>
      </div>

      {/* Layer Opacity Slider for Selected Layer */}
      {activeLayer && (
        <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              {activeLayer.name} Opacity
            </span>
            <span className="font-mono text-slate-500">{activeLayer.opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLayer.opacity}
            onChange={(e) => onUpdateOpacity(activeLayer.id, parseInt(e.target.value, 10))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-800"
          />
        </div>
      )}

      {/* Layers List */}
      <div className="space-y-1 max-h-[220px] overflow-y-auto">
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer border ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500/70 dark:bg-indigo-950/40 dark:text-indigo-200'
                  : 'border-transparent text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
                <span className="truncate font-medium">{layer.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Duplicate layer"
                >
                  <Copy className="h-3 w-3" />
                </button>

                {layers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Delete layer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
