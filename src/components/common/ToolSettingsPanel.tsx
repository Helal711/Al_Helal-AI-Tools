import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders, Settings2 } from 'lucide-react';
import { Slider } from '../ui/Slider';
import { Card } from '../ui/Card';

export interface ToolSettingsPanelProps {
  children?: React.ReactNode;
  advancedSettings?: React.ReactNode;
  title?: string;
  className?: string;
}

export const ToolSettingsPanel: React.FC<ToolSettingsPanelProps> = ({
  children,
  advancedSettings,
  title = 'Processing Settings',
  className = '',
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <Card padding="md" className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <Settings2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {title}
        </h3>
      </div>

      {/* Main tool settings */}
      <div className="space-y-4">{children}</div>

      {/* Collapsible Advanced Settings */}
      {advancedSettings && (
        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex w-full items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              <span>Advanced Parameters</span>
            </div>
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {advancedOpen && (
            <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-150">
              {advancedSettings}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
