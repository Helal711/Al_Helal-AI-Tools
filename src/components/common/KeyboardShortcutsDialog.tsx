import React from 'react';
import { Modal } from '../ui/Modal';
import { Keyboard } from 'lucide-react';

export interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { key: `${mod} + K`, description: 'Open Command Palette & Global Search' },
    { key: `${mod} + Z`, description: 'Undo last editor action' },
    { key: `${mod} + Shift + Z`, description: 'Redo last editor action' },
    { key: `${mod} + V`, description: 'Paste image from clipboard directly into workspace' },
    { key: 'Esc', description: 'Close modals, drawers, or reset current selection' },
    { key: 'Space + Drag', description: 'Pan image canvas' },
    { key: 'Scroll Wheel', description: 'Zoom in / out on canvas' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Accelerate your visual creation workflow with quick keys."
      size="sm"
    >
      <div className="space-y-3">
        {shortcuts.map((sc, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800 last:border-0"
          >
            <span className="text-xs text-slate-700 dark:text-slate-300">{sc.description}</span>
            <kbd className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs">
              {sc.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
};
