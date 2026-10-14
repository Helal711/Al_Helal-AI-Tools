import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  Eye,
  EyeOff,
  FlipHorizontal,
  Trash2,
} from 'lucide-react';
import { IconButton } from '../../ui/IconButton';
import { Slider } from '../../ui/Slider';

export interface MaskingCanvasProps {
  imageSrc: string;
  onMaskChange?: (maskDataUrl: string) => void;
  className?: string;
}

export const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  imageSrc,
  onMaskChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(25);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showMask, setShowMask] = useState(true);
  const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas resolution to match image
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth || img.width || 800;
    canvas.height = img.naturalHeight || img.height || 600;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setMaskHistory([initial]);
      setHistoryIndex(0);
    }
  }, []);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      // Render translucent red mask
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save snapshot in undo history
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = maskHistory.slice(0, historyIndex + 1);
    nextHistory.push(snap);
    setMaskHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    if (onMaskChange) {
      onMaskChange(canvas.toDataURL('image/png'));
    }
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setMaskHistory([snap]);
    setHistoryIndex(0);
    if (onMaskChange) onMaskChange('');
  };

  const undoMask = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetIndex = historyIndex - 1;
    ctx.putImageData(maskHistory[targetIndex], 0, 0);
    setHistoryIndex(targetIndex);
    if (onMaskChange) onMaskChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Masking Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool('brush')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              tool === 'brush'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            <span>Brush</span>
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              tool === 'eraser'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2 w-48">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Size:</span>
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-800"
          />
          <span className="font-mono text-[11px] text-slate-500 w-6">{brushSize}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            ariaLabel={showMask ? 'Hide Mask Overlay' : 'Show Mask Overlay'}
            onClick={() => setShowMask(!showMask)}
            icon={showMask ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
          />
          <IconButton
            size="sm"
            ariaLabel="Undo Mask Stroke"
            onClick={undoMask}
            disabled={historyIndex <= 0}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          />
          <IconButton
            size="sm"
            ariaLabel="Clear Mask"
            onClick={clearMask}
            icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
          />
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 p-2 shadow-inner select-none cursor-crosshair min-h-[380px]"
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Source target for mask"
          onLoad={initCanvas}
          className="max-h-[60vh] max-w-full rounded-lg object-contain pointer-events-none"
        />

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ opacity: showMask ? 1 : 0 }}
          className="absolute inset-0 h-full w-full object-contain pointer-events-auto transition-opacity duration-150"
        />
      </div>
    </div>
  );
};
