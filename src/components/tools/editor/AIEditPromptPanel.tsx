import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Clock,
  Heart,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Input';
import { Slider, Switch } from '../../ui/Slider';
import { aiService } from '../../../services/ai/AIService';
import { useToast } from '../../../context/ToastContext';

export interface AIEditPromptPanelProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmitEdit: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const AIEditPromptPanel: React.FC<AIEditPromptPanelProps> = ({
  prompt,
  onPromptChange,
  onSubmitEdit,
  isProcessing = false,
  className = '',
}) => {
  const [creativeStrength, setCreativeStrength] = useState(75);
  const [preserveSubject, setPreserveSubject] = useState(true);
  const [preserveFace, setPreserveFace] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const { success } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pixelforge_edit_prompt_history');
      if (stored) setPromptHistory(JSON.parse(stored));
    } catch {
      setPromptHistory([]);
    }
  }, []);

  const savePromptToHistory = (p: string) => {
    if (!p.trim()) return;
    try {
      const updated = [p.trim(), ...promptHistory.filter((item) => item !== p.trim())].slice(0, 15);
      setPromptHistory(updated);
      localStorage.setItem('pixelforge_edit_prompt_history', JSON.stringify(updated));
    } catch {
      // storage quota fallback
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enriched = await aiService.enhancePrompt(prompt, 'Photorealistic Creative Modification');
      onPromptChange(enriched);
      success('Prompt enhanced with visual lighting and geometry details.');
    } catch {
      // fallback
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = () => {
    savePromptToHistory(prompt);
    onSubmitEdit();
  };

  return (
    <Card padding="md" className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Generative AI Instruction
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Clock className="h-3 w-3" />
          <span>History ({promptHistory.length})</span>
        </button>
      </div>

      {/* Prompt History Dropdown */}
      {showHistory && promptHistory.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/80 max-h-40 overflow-y-auto space-y-1">
          {promptHistory.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-1.5 text-xs text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
              onClick={() => {
                onPromptChange(h);
                setShowHistory(false);
              }}
            >
              <span className="truncate pr-2">{h}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const updated = promptHistory.filter((_, idx) => idx !== i);
                  setPromptHistory(updated);
                  localStorage.setItem('pixelforge_edit_prompt_history', JSON.stringify(updated));
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Prompt Input */}
      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe what you want to change (e.g., 'Change background to a modern sunlit design studio', 'Remove the watch and blend skin textures')..."
          rows={3}
        />

        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEnhancePrompt}
            isLoading={isEnhancing}
            disabled={!prompt.trim()}
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
          >
            Improve Prompt
          </Button>
          <span className="text-[10px] text-slate-400">{prompt.length} chars</span>
        </div>
      </div>

      {/* AI Modification Controls */}
      <div className="space-y-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
        <Slider
          label="Creative Strength"
          value={creativeStrength}
          min={10}
          max={100}
          unit="%"
          onChange={setCreativeStrength}
        />

        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
          <Switch
            label="Preserve Main Subject"
            description="Restricts AI generation to background and masked areas"
            checked={preserveSubject}
            onChange={setPreserveSubject}
          />
          <Switch
            label="Preserve Facial Features"
            description="Protects facial proportions and expression fidelity"
            checked={preserveFace}
            onChange={setPreserveFace}
          />
        </div>
      </div>

      {/* Primary Trigger Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        isLoading={isProcessing}
        disabled={!prompt.trim() || isProcessing}
        className="w-full"
        leftIcon={<Wand2 className="h-4 w-4" />}
      >
        Apply AI Edit
      </Button>
    </Card>
  );
};
