import React, { useState } from 'react';
import { HelpCircle, RefreshCw, Download, Sparkles, X } from 'lucide-react';
import { ToolHeader } from './ToolHeader';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface ToolWorkspaceProps {
  toolId?: string;
  title: string;
  description: string;
  helpTips?: string[];
  icon?: React.ReactNode;
  uploadContent: React.ReactNode;
  previewContent: React.ReactNode;
  settingsContent?: React.ReactNode;
  processButtonLabel?: string;
  isProcessing?: boolean;
  canProcess?: boolean;
  onProcess?: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  downloadLabel?: string;
  hasResult?: boolean;
  supportsBatch?: boolean;
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  toolId = 'tool',
  title,
  description,
  helpTips = [],
  icon,
  uploadContent,
  previewContent,
  settingsContent,
  processButtonLabel = 'Process Image',
  isProcessing = false,
  canProcess = true,
  onProcess,
  onReset,
  onDownload,
  downloadLabel = 'Download Result',
  hasResult = false,
  supportsBatch = false,
  isBatchMode = false,
  onToggleBatchMode,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <ToolHeader
        toolId={toolId}
        name={title}
        description={description}
        icon={icon}
        onReset={onReset}
        onOpenHelp={helpTips.length > 0 ? () => setShowHelp(true) : undefined}
        supportsBatch={supportsBatch}
        isBatchMode={isBatchMode}
        onToggleBatchMode={onToggleBatchMode}
      />

      {/* Guide & Help Modal */}
      {showHelp && (
        <Modal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="Guide & Tips for Best Results"
          description={`Optimizing output quality in ${title}`}
          size="sm"
        >
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
            {helpTips.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">{tip}</li>
            ))}
          </ul>
        </Modal>
      )}

      {/* 2. MAIN 3-ZONE / 2-ZONE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Upload / Source Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Input Source
            </h3>
            {uploadContent}
          </div>
        </div>

        {/* Center: Canvas / Before-After Preview Area */}
        <div className={`${settingsContent ? 'lg:col-span-6' : 'lg:col-span-9'} space-y-4 min-h-[440px]`}>
          {previewContent}
        </div>

        {/* Right: Settings / Controls (if provided) */}
        {settingsContent && (
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Parameters & Tuning
              </h3>
              {settingsContent}
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Al_Helal AI Tools Engine · Free Technical Usage Allocation</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onReset && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
            >
              Reset
            </Button>
          )}

          {onProcess && (
            <Button
              size="sm"
              variant="primary"
              disabled={isProcessing || !canProcess}
              isLoading={isProcessing}
              onClick={onProcess}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            >
              {processButtonLabel}
            </Button>
          )}

          {hasResult && onDownload && (
            <Button
              size="sm"
              variant="primary"
              onClick={onDownload}
              className="bg-emerald-600 hover:bg-emerald-500"
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              {downloadLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
