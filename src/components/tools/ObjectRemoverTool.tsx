import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Eraser,
  Paintbrush,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { loadImage, verifyImageDimensions } from '../../services/imageProcessing';
import { validateImageOutput } from '../../services/outputValidation';
import { aiService } from '../../ai/AIService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import { usageService } from '../../services/usageService';
import { ProcessingState } from '../../types';

export const ObjectRemoverTool: React.FC = () => {
  const { user } = useAuth();
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // Brush settings
  const [brushSize, setBrushSize] = useState<number>(28);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aiPrompt, setAiPrompt] = useState<string>('');

  // Canvas refs
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Undo/Redo history of mask states
  const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const saveMaskState = useCallback(() => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    const newHistory = maskHistory.slice(0, historyIndex + 1);
    newHistory.push(data);
    setMaskHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [historyIndex, maskHistory]);

  const initCanvases = useCallback(async (src: string) => {
    const img = await loadImage(src);
    const imgCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imgCanvas || !maskCanvas) return;

    imgCanvas.width = img.naturalWidth || img.width;
    imgCanvas.height = img.naturalHeight || img.height;
    maskCanvas.width = imgCanvas.width;
    maskCanvas.height = imgCanvas.height;

    const imgCtx = imgCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (imgCtx) {
      imgCtx.drawImage(img, 0, 0);
    }
    if (maskCtx) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    setMaskHistory([]);
    setHistoryIndex(-1);
    saveMaskState();
  }, [saveMaskState]);

  const handleImageSelected = async (imageUri: string) => {
    setOriginalImage(imageUri);
    setResultImage(null);
    setTimeout(() => {
      initCanvases(imageUri);
    }, 50);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mask = maskCanvasRef.current;
    if (!mask) return { x: 0, y: 0 };
    const rect = mask.getBoundingClientRect();
    const scaleX = mask.width / rect.width;
    const scaleY = mask.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveMaskState();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.65)'; // Translucent red mask
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const mask = maskCanvasRef.current;
      if (!mask) return;
      const ctx = mask.getContext('2d');
      if (ctx) {
        ctx.putImageData(maskHistory[nextIdx], 0, 0);
        setHistoryIndex(nextIdx);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < maskHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const mask = maskCanvasRef.current;
      if (!mask) return;
      const ctx = mask.getContext('2d');
      if (ctx) {
        ctx.putImageData(maskHistory[nextIdx], 0, 0);
        setHistoryIndex(nextIdx);
      }
    }
  };

  const handleClearMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, mask.width, mask.height);
      saveMaskState();
    }
  };

  const handleRemoveObject = async () => {
    if (!originalImage || !maskCanvasRef.current) return;

    const usageCheck = await usageService.checkUsage(user?.uid, 'Object Remover');
    if (!usageCheck.allowed) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Daily Limit Reached',
        error: usageCheck.message || 'Your daily processing limit has been reached. Please try again later.',
      });
      return;
    }

    setProcessingState({
      status: 'preparing',
      progress: 20,
      message: 'Extracting object mask coordinates...',
    });

    try {
      let processed: string;

      if (aiPrompt.trim()) {
        setProcessingState({
          status: 'processing',
          progress: 50,
          message: 'Executing prompt-guided generative inpainting with Gemini...',
        });
        const editRes = await aiService.editImage({
          imageBase64: originalImage,
          instruction: `Inpaint and replace the masked area: ${aiPrompt.trim()}`,
          userId: user?.uid,
        });

        if (!editRes.success || !editRes.data) {
          throw new Error(editRes.error || 'Generative inpainting request failed.');
        }
        processed = editRes.data.imageUrl;
      } else {
        setProcessingState({
          status: 'processing',
          progress: 50,
          message: 'Diffusing background texture and shadow synthesis...',
        });
        await new Promise((r) => setTimeout(r, 150));

        const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
        const response = await aiService.removeObject({
          imageUri: originalImage,
          maskDataUrl,
          userId: user?.uid,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to erase masked object.');
        }
        processed = response.data.imageUrl;
      }

      setProcessingState({
        status: 'finalizing',
        progress: 90,
        message: 'Applying boundary smoothing & output verification...',
      });
      await new Promise((r) => setTimeout(r, 100));

      await usageService.recordOperation(user?.uid, 'Object Remover');

      // Professional Output verification (Section 15)
      const validation = await validateImageOutput(processed);
      if (!validation.valid) {
        throw new Error(validation.error || 'Inpainting output verification failed: Corrupted image buffer produced.');
      }

      setResultImage(processed);
      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Object removed cleanly!',
      });

      addHistoryItem({
        url: processed,
        processedImage: processed,
        originalUrl: originalImage,
        tool: 'Object Remover',
      });
    } catch (err: any) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Failed to erase object',
        error: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `pixelforge_erased_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setMaskHistory([]);
    setHistoryIndex(-1);
    setProcessingState({ status: 'idle', progress: 0, message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Object Remover & Inpainting</h1>
          <p className="mt-1 text-xs text-slate-500">
            Paint over unwanted objects, people, or telephone wires to erase them naturally.
          </p>
        </div>
        {originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>New Photo</span>
          </button>
        )}
      </div>

      {!originalImage ? (
        <ImageUploadZone onImageSelected={handleImageSelected} />
      ) : (
        <div className="space-y-6">
          <ProcessingStateIndicator state={processingState} onRetry={handleRemoveObject} />

          {resultImage ? (
            /* Result View: Before & After comparison */
            <div className="space-y-4">
              <BeforeAfterSlider
                beforeImage={originalImage}
                afterImage={resultImage}
                beforeLabel="Original with Object"
                afterLabel="Retouched Result"
                aspectRatio="16/10"
                onDownload={handleDownload}
                className="w-full min-h-[420px]"
              />
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setResultImage(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Adjust Mask & Retouch More
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Clean Image</span>
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Painting Workspace */
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              {/* Top Toolbar Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTool('brush')}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTool === 'brush' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Paintbrush className="h-3.5 w-3.5" />
                    <span>Brush</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('eraser')}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTool === 'eraser' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    <span>Eraser</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200 mx-1" />

                  {/* Brush Size Slider */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-[11px] font-medium text-slate-400">Size:</span>
                    <input
                      type="range"
                      min="8"
                      max="80"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                      className="w-24 accent-indigo-600 cursor-pointer"
                    />
                    <span className="font-mono text-xs w-6 text-slate-500">{brushSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Undo stroke"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= maskHistory.length - 1}
                    title="Redo stroke"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleClearMask}
                    title="Clear painted mask"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <div className="h-5 w-px bg-slate-200 mx-1" />
                  <button
                    onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                    title="Zoom in"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                    title="Zoom out"
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Canvas Interactive Area */}
              <div className="relative flex min-h-[420px] max-h-[600px] items-center justify-center overflow-auto rounded-xl bg-slate-900 p-4">
                <div
                  className="relative select-none"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                  <canvas ref={imageCanvasRef} className="max-h-[500px] w-auto max-w-full block" />
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    className="absolute inset-0 h-full w-full cursor-crosshair"
                  />
                </div>
              </div>

              {/* Optional Prompt-Guided Inpainting */}
              <div className="flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">AI Prompt (Optional):</span>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'replace with smooth background', 'inpaint with empty blue sky'..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Bottom Trigger Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight unwanted elements with red strokes, then click &quot;Remove Object&quot;.
                </p>
                <button
                  onClick={handleRemoveObject}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Remove Object</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
