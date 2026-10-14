import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wand2,
  Sliders,
  Layers as LayersIcon,
  RotateCcw,
  RotateCw,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Paintbrush,
  Sparkles,
  Crop,
  Sun,
  Contrast,
  Palette,
  Undo2,
  Redo2,
  Save,
  Check,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Slider } from '../../ui/Slider';
import { Card } from '../../ui/Card';
import { MaskingCanvas } from './MaskingCanvas';
import { LayersPanel, EditorLayer } from './LayersPanel';
import { AIEditPromptPanel } from './AIEditPromptPanel';
import { aiService } from '../../../services/ai/AIService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { inpaintMaskedObject } from '../../../services/imageProcessing';

export interface AIImageEditorProps {
  initialImage: string;
  onClose?: () => void;
  onSaveProject?: (imageUri: string) => void;
}

export const AIImageEditor: React.FC<AIImageEditorProps> = ({
  initialImage,
  onClose,
  onSaveProject,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<'adjust' | 'mask' | 'ai_prompt' | 'layers'>('adjust');

  // Images state and history stack for Undo/Redo
  const [currentImage, setCurrentImage] = useState<string>(initialImage);
  const [history, setHistory] = useState<string[]>([initialImage]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Filter adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);

  // Mask data for inpainting
  const [maskDataUrl, setMaskDataUrl] = useState<string>('');

  // Prompt state
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Layers
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: 'layer-base', name: 'Background Image', type: 'image', visible: true, locked: false, opacity: 100 },
    { id: 'layer-mask', name: 'Inpainting Mask', type: 'mask', visible: true, locked: false, opacity: 80 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-base');

  // Push new state to undo/redo history
  const pushHistory = (newImageUri: string) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newImageUri);
    // Max 20 history states to preserve memory
    if (nextHistory.length > 20) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setCurrentImage(newImageUri);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCurrentImage(history[prevIdx]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCurrentImage(history[nextIdx]);
    }
  }, [historyIndex, history]);

  // Global Keyboard shortcuts listener: Ctrl+Z / Ctrl+Shift+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Execute Generative Inpainting / AI Edit
  const handleApplyAIEdit = async () => {
    if (!editPrompt.trim() && !maskDataUrl) return;
    setIsProcessing(true);

    try {
      // If prompt is provided, dispatch to unified AIService
      if (editPrompt.trim()) {
        const result = await aiService.editImage({
          imageBase64: currentImage,
          instruction: editPrompt,
          userId: user?.uid,
        });

        if (result.success && result.data?.imageUrl) {
          pushHistory(result.data.imageUrl);
          success('AI edit completed successfully.');
          setEditPrompt('');
        } else {
          throw new Error(result.error || 'Generative modification could not be completed.');
        }
      } else if (maskDataUrl) {
        // Fallback to local inpainting diffusion
        const maskCanvas = document.createElement('canvas');
        const maskImg = new Image();
        maskImg.src = maskDataUrl;
        await new Promise((resolve) => (maskImg.onload = resolve));
        maskCanvas.width = maskImg.width;
        maskCanvas.height = maskImg.height;
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) mCtx.drawImage(maskImg, 0, 0);

        const inpaintedUri = await inpaintMaskedObject(currentImage, maskCanvas);
        pushHistory(inpaintedUri);
        success('Masked area erased and texture inpainted.');
      }
    } catch (err: any) {
      toastError(err.message || 'Edit operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    if (onSaveProject) onSaveProject(currentImage);
    success('Project changes saved.');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `pixelforge_edit_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    if (!editorContainerRef.current) return;
    if (!isFullscreen) {
      if (editorContainerRef.current.requestFullscreen) {
        editorContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={editorContainerRef}
      className="flex flex-col h-full min-h-[82vh] rounded-3xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      {/* 1. TOP EDITOR TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2">
          {/* Tool Modes Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveTool('adjust')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTool === 'adjust'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Adjust</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('mask')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTool === 'mask'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Paintbrush className="h-3.5 w-3.5" />
              <span>Mask & Erase</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('ai_prompt')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTool === 'ai_prompt'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('layers')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTool === 'layers'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayersIcon className="h-3.5 w-3.5" />
              <span>Layers</span>
            </button>
          </div>
        </div>

        {/* Center: Undo / Redo */}
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            ariaLabel="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={historyIndex <= 0}
            icon={<Undo2 className="h-4 w-4" />}
          />
          <span className="text-[10px] font-mono text-slate-400 px-1">
            {historyIndex + 1}/{history.length}
          </span>
          <IconButton
            size="sm"
            ariaLabel="Redo (Ctrl+Shift+Z)"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            icon={<Redo2 className="h-4 w-4" />}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <IconButton
            size="sm"
            ariaLabel={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            onClick={toggleFullscreen}
            icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          />

          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            leftIcon={isSaved ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Save className="h-3.5 w-3.5" />}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleDownload}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE BODY: Canvas + Inspector Sidebar */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Workspace Canvas Area */}
        <div className="flex-1 p-4 bg-slate-950/5 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden">
          {activeTool === 'mask' ? (
            <MaskingCanvas
              imageSrc={currentImage}
              onMaskChange={setMaskDataUrl}
              className="w-full h-full"
            />
          ) : (
            <div
              className="relative flex h-full w-full items-center justify-center p-4"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
              }}
            >
              <img
                src={currentImage}
                alt="Editor viewport"
                className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          )}
        </div>

        {/* Right Inspector & Settings Drawer */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/90 overflow-y-auto shrink-0 space-y-4">
          {activeTool === 'adjust' && (
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Color Adjustments
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setSaturation(100);
                    setBlur(0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-600"
                >
                  Reset
                </button>
              </div>

              <Slider
                label="Brightness"
                value={brightness}
                min={20}
                max={200}
                unit="%"
                onChange={setBrightness}
              />
              <Slider
                label="Contrast"
                value={contrast}
                min={20}
                max={200}
                unit="%"
                onChange={setContrast}
              />
              <Slider
                label="Saturation"
                value={saturation}
                min={0}
                max={250}
                unit="%"
                onChange={setSaturation}
              />
              <Slider
                label="Soft Blur"
                value={blur}
                min={0}
                max={20}
                unit="px"
                onChange={setBlur}
              />
            </Card>
          )}

          {activeTool === 'mask' && (
            <Card padding="md" className="space-y-3">
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Selective Inpainting
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Brush over the unwanted element or backdrop. The neural inpainter blends surrounding textures seamlessly.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleApplyAIEdit}
                isLoading={isProcessing}
                disabled={!maskDataUrl}
              >
                Erase & Inpaint Area
              </Button>
            </Card>
          )}

          {activeTool === 'ai_prompt' && (
            <AIEditPromptPanel
              prompt={editPrompt}
              onPromptChange={setEditPrompt}
              onSubmitEdit={handleApplyAIEdit}
              isProcessing={isProcessing}
            />
          )}

          {activeTool === 'layers' && (
            <LayersPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onToggleVisibility={(id) =>
                setLayers((prev) =>
                  prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
                )
              }
              onToggleLock={(id) =>
                setLayers((prev) =>
                  prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
                )
              }
              onUpdateOpacity={(id, op) =>
                setLayers((prev) =>
                  prev.map((l) => (l.id === id ? { ...l, opacity: op } : l))
                )
              }
              onAddLayer={() => {
                const newId = `layer-${Date.now()}`;
                setLayers((prev) => [
                  ...prev,
                  { id: newId, name: `Layer ${prev.length + 1}`, type: 'adjustment', visible: true, locked: false, opacity: 100 },
                ]);
                setActiveLayerId(newId);
              }}
              onDuplicateLayer={(id) => {
                const target = layers.find((l) => l.id === id);
                if (!target) return;
                const newId = `layer-${Date.now()}`;
                setLayers((prev) => [
                  ...prev,
                  { ...target, id: newId, name: `${target.name} Copy` },
                ]);
                setActiveLayerId(newId);
              }}
              onDeleteLayer={(id) => {
                setLayers((prev) => prev.filter((l) => l.id !== id));
                if (activeLayerId === id && layers.length > 1) {
                  setActiveLayerId(layers[0].id);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
