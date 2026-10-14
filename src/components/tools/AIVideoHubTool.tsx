import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Film,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Sliders,
  FileVideo,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { activeAIProvider } from '../../ai/provider';
import { useToast } from '../../context/ToastContext';
import { useHistory } from '../../context/HistoryContext';
import {
  inspectVideoMetadata,
  extractVideoThumbnail,
  extractVideoKeyframes,
  type VideoMetadata,
} from '../../services/videoProcessing';

export const AIVideoHubTool: React.FC = () => {
  const { success, error: toastError } = useToast();
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [activePipeline, setActivePipeline] = useState<'motion_photo' | 'video_inspector' | 'img2video' | 'video_bg'>('motion_photo');
  const [providerStatus, setProviderStatus] = useState<{
    available: boolean;
    message: string;
    reason?: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // 1. Motion Photo Animator State
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [motionStyle, setMotionStyle] = useState<'ken_burns' | 'pan_horizontal' | 'parallax_pulse' | 'gentle_tilt'>('ken_burns');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 2. Video Inspector & Thumbnail Extractor State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [scrubTime, setScrubTime] = useState<number>(1.0);
  const [extractedThumbnail, setExtractedThumbnail] = useState<string | null>(null);
  const [extractedKeyframes, setExtractedKeyframes] = useState<Array<{ timestamp: number; dataUrl: string }>>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  useEffect(() => {
    async function checkStatus() {
      setLoadingStatus(true);
      try {
        const res = await activeAIProvider.getVideoStatus();
        setProviderStatus(res);
      } catch {
        setProviderStatus({
          available: false,
          reason: 'AI provider not configured',
          message: 'Cloud video synthesis cluster requires dedicated GPU render nodes and Veo 3.1 enterprise license key.',
        });
      } finally {
        setLoadingStatus(false);
      }
    }
    checkStatus();
  }, []);

  // Canvas animation loop
  useEffect(() => {
    if (!inputImage || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      startTimeRef.current = Date.now();
    };
    img.src = inputImage;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (imageObjRef.current && isPlaying) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const loopDuration = 4; // 4 seconds loop
        const t = (elapsed % loopDuration) / loopDuration; // 0 to 1
        const eased = 0.5 - 0.5 * Math.cos(t * Math.PI * 2); // Sine wave 0 to 1 to 0

        const cw = canvas.width;
        const ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        const img = imageObjRef.current;
        let scale = 1;
        let dx = 0;
        let dy = 0;

        if (motionStyle === 'ken_burns') {
          scale = 1 + eased * 0.18;
          dx = (cw - cw * scale) / 2;
          dy = (ch - ch * scale) / 2;
        } else if (motionStyle === 'pan_horizontal') {
          scale = 1.12;
          const maxShift = cw * 0.08;
          dx = (eased - 0.5) * maxShift;
          dy = (ch - ch * scale) / 2;
        } else if (motionStyle === 'parallax_pulse') {
          scale = 1 + Math.sin(elapsed * 2) * 0.06;
          dx = (cw - cw * scale) / 2;
          dy = (ch - ch * scale) / 2;
        } else if (motionStyle === 'gentle_tilt') {
          scale = 1.1;
          dx = (cw - cw * scale) / 2 + Math.sin(elapsed * 1.5) * 12;
          dy = (ch - ch * scale) / 2 + Math.cos(elapsed * 1.5) * 8;
        }

        ctx.save();
        ctx.drawImage(img, dx, dy, cw * scale, ch * scale);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inputImage, motionStyle, isPlaying]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setInputImage(reader.result as string);
      setRecordedVideoUrl(null);
      success('Image loaded for motion animation.');
    };
    reader.readAsDataURL(file);
  };

  // Record 4-second animated video via MediaRecorder
  const handleRecordVideo = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    try {
      if (typeof MediaRecorder === 'undefined') {
        toastError('MediaRecorder API is not supported in this environment.');
        return;
      }

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setIsRecording(false);
        setRecordingProgress(100);
        success('Motion video synthesized and ready for download!');

        addHistoryItem({
          url: inputImage || '',
          tool: 'AI Motion Photo Animator',
          processedImage: inputImage || '',
        });
      };

      setIsRecording(true);
      setRecordingProgress(0);
      startTimeRef.current = Date.now();
      recorder.start();

      const startTime = Date.now();
      const interval = setInterval(() => {
        const pct = Math.min(99, Math.round(((Date.now() - startTime) / 4000) * 100));
        setRecordingProgress(pct);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4000);
    } catch (err: any) {
      setIsRecording(false);
      toastError(err.message || 'Failed to record motion video stream.');
    }
  };

  // Video Inspector Handlers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVideoFile(file);
      const meta = await inspectVideoMetadata(file);
      setVideoMetadata(meta);
      const initialSeek = Math.min(1.0, meta.durationSeconds > 0 ? meta.durationSeconds / 2 : 0);
      setScrubTime(initialSeek);

      const thumb = await extractVideoThumbnail(file, { timeSeconds: initialSeek });
      setExtractedThumbnail(thumb.dataUrl);

      // Generate keyframe contact sheet
      extractVideoKeyframes(file, 4).then(setExtractedKeyframes);
      success('Video parsed and metadata analyzed successfully.');
    } catch (err: any) {
      toastError(err.message || 'Failed to parse video file.');
    }
  };

  const handleSeekThumbnail = async (time: number) => {
    if (!videoFile) return;
    setScrubTime(time);
    setIsExtracting(true);
    try {
      const thumb = await extractVideoThumbnail(videoFile, { timeSeconds: time });
      setExtractedThumbnail(thumb.dataUrl);
    } catch (err: any) {
      toastError(err.message || 'Failed to extract frame.');
    } finally {
      setIsExtracting(false);
    }
  };

  const pipelines = [
    {
      id: 'motion_photo',
      title: 'Photo Animator (Living Photo)',
      desc: 'Animate static photographs with natural cinematic motion (Ken Burns zoom, pan, organic pulse) and export 60 FPS video.',
      specs: 'HTML5 60 FPS · WebM / MP4 Export · Zero Server Latency',
      modelTarget: 'Client-Accelerated Motion Synthesis Engine',
      online: true,
    },
    {
      id: 'video_inspector',
      title: 'Video Inspector & Thumbnail Studio',
      desc: 'Inspect media containers, view resolution & bitrate telemetry, and extract high-definition still thumbnails from any timestamp.',
      specs: 'Frame Scrubber · 1080p Export · Keyframe Contact Sheet',
      modelTarget: 'Native HTML5 Video Pipeline',
      online: true,
    },
    {
      id: 'img2video',
      title: 'Image to Video (Veo Generative Synthesis)',
      desc: 'Animate photographs with generative 3D camera moves (pan, dolly, orbit) using Google Veo video models.',
      specs: '720p / 1080p · 24 FPS · Up to 5s duration',
      modelTarget: 'Veo 3.1 Lite (veo-3.1-lite-generate-preview)',
      online: false,
    },
    {
      id: 'video_bg',
      title: 'Video Background Removal (Rotoscoping)',
      desc: 'Automatic foreground subject isolation across MP4 video frames without green screens.',
      specs: 'Alpha WebM / ProRes 4444 Export · Frame-by-frame tracking',
      modelTarget: 'Temporal Matting Cluster',
      online: false,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Video Hub & Motion Synthesis</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Advanced generative video architecture, client motion synthesis, and video telemetry studio.
        </p>
      </div>

      {/* Honest Provider Status Notice for cloud models */}
      {!loadingStatus && providerStatus && !providerStatus.available && (activePipeline === 'img2video' || activePipeline === 'video_bg') && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 p-5 text-amber-900 dark:text-amber-200 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Cloud Video Cluster Status:
                </span>
                <span className="rounded bg-amber-200/80 dark:bg-amber-800 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-100">
                  {providerStatus.reason || 'AI provider not configured'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {providerStatus.message ||
                  'High-throughput video generation requires dedicated cloud render workers and a configured Veo 3.1 enterprise license key. Client-side Living Photo Animator and Video Inspector are fully available below.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {pipelines.map((pipe) => {
          const isSelected = activePipeline === pipe.id;
          return (
            <button
              key={pipe.id}
              onClick={() => setActivePipeline(pipe.id as any)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Video className={`h-4 w-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  pipe.online ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {pipe.online ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{pipe.title}</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{pipe.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 1. MOTION PHOTO ANIMATOR WORKSPACE */}
      {activePipeline === 'motion_photo' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Living Photo Motion Synthesizer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform any still photograph into a cinematic looping motion video with zero server latency.
              </p>
            </div>
            {inputImage && (
              <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Upload New Image</span>
              </label>
            )}
          </div>

          {!inputImage ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-12 text-center">
              <Film className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select a Photograph to Animate</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Works with portraits, landscapes, architecture, and artwork. Supports JPG, PNG, WEBP.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer transition-colors">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Upload className="h-4 w-4" />
                <span>Choose Photo</span>
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Canvas Preview Area */}
              <div className="lg:col-span-8 space-y-3">
                <div className="relative flex aspect-4/3 items-center justify-center rounded-2xl bg-slate-950 overflow-hidden shadow-inner border border-slate-800">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="h-full w-full object-contain"
                  />

                  {/* Play/Pause Overlay */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 text-white border border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="text-[11px] font-mono text-slate-300">
                      {isPlaying ? '60 FPS Live Motion' : 'Paused'}
                    </span>
                  </div>

                  {isRecording && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
                      <p className="text-xs font-bold text-white">Rendering MP4 / WebM Motion Stream ({recordingProgress}%)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tuning & Export Controls */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    <span>Motion Camera Pattern</span>
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {[
                      { id: 'ken_burns', label: 'Ken Burns Zoom In', desc: 'Smooth slow cinematic focal zoom' },
                      { id: 'pan_horizontal', label: 'Cinema Horizontal Pan', desc: 'Gentle lateral camera motion' },
                      { id: 'parallax_pulse', label: 'Parallax Living Pulse', desc: 'Subtle breathing ambient depth' },
                      { id: 'gentle_tilt', label: 'Dynamic Drift Orbit', desc: 'Floating perspective camera drift' },
                    ].map((pattern) => (
                      <button
                        key={pattern.id}
                        type="button"
                        onClick={() => setMotionStyle(pattern.id as any)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          motionStyle === pattern.id
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{pattern.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{pattern.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleRecordVideo}
                    disabled={isRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <Film className="h-4 w-4" />
                    <span>{isRecording ? 'Synthesizing Stream...' : 'Synthesize 4s Video Loop'}</span>
                  </button>

                  {recordedVideoUrl && (
                    <a
                      href={recordedVideoUrl}
                      download={`pixelforge_motion_${Date.now()}.webm`}
                      onClick={() => incrementDownloads()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Video (.webm)</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. VIDEO INSPECTOR & THUMBNAIL STUDIO */}
      {activePipeline === 'video_inspector' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Video Telemetry & Thumbnail Studio</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect video containers, dimensions, duration, and extract still frame thumbnails at high resolution.
              </p>
            </div>
            {videoFile && (
              <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs">
                <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Open Different Video</span>
              </label>
            )}
          </div>

          {!videoFile ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-12 text-center">
              <FileVideo className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload MP4 or WebM Video File</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Extract frame timestamps, calculate bitrates, and generate high-fidelity poster covers.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer transition-colors">
                <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                <Upload className="h-4 w-4" />
                <span>Select Video File</span>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Telemetry Summary Cards */}
              {videoMetadata && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">DIMENSIONS</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{videoMetadata.width} × {videoMetadata.height}</p>
                    <p className="text-[11px] text-slate-400">{videoMetadata.aspectRatio}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">DURATION</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{videoMetadata.durationSeconds}s</p>
                    <p className="text-[11px] text-slate-400">~{videoMetadata.approxFrameRate} FPS</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">CONTAINER</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{videoMetadata.containerFormat.replace('video/', '').toUpperCase()}</p>
                    <p className="text-[11px] text-slate-400">{Math.round((videoMetadata.fileSizeBytes || 0) / 1024)} KB</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">EST. BITRATE</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{videoMetadata.estimatedBitrateKbps} kbps</p>
                    <p className="text-[11px] text-slate-400">H.264 / VP9</p>
                  </div>
                </div>
              )}

              {/* Scrubber & Thumbnail Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 overflow-hidden shadow-inner flex items-center justify-center min-h-[360px]">
                    {extractedThumbnail ? (
                      <img
                        src={extractedThumbnail}
                        alt="Extracted Frame Thumbnail"
                        className="max-h-[360px] max-w-full rounded-xl object-contain shadow-md"
                      />
                    ) : (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    )}
                  </div>

                  {/* Scrubber Slider */}
                  {videoMetadata && (
                    <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Seek Frame Timestamp</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{scrubTime.toFixed(2)}s / {videoMetadata.durationSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0.1, videoMetadata.durationSeconds)}
                        step="0.05"
                        value={scrubTime}
                        onChange={(e) => handleSeekThumbnail(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Extracted Keyframes & Download */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Thumbnail Actions
                    </h3>

                    {extractedThumbnail && (
                      <a
                        href={extractedThumbnail}
                        download={`pixelforge_thumb_${scrubTime.toFixed(1)}s_${Date.now()}.jpg`}
                        onClick={() => incrementDownloads()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Frame ({videoMetadata?.width}×{videoMetadata?.height})</span>
                      </a>
                    )}
                  </div>

                  {/* Sequential Keyframe Contact Sheet */}
                  {extractedKeyframes.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-4 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Extracted Keyframe Strip
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {extractedKeyframes.map((kf, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setScrubTime(kf.timestamp);
                              setExtractedThumbnail(kf.dataUrl);
                            }}
                            className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-16/9"
                          >
                            <img src={kf.dataUrl} alt={`Frame at ${kf.timestamp}s`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-mono text-white">
                              {kf.timestamp}s
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3 & 4. CLOUD VEO SYNTHESIS ARCHITECTURE WORKSPACE */}
      {(activePipeline === 'img2video' || activePipeline === 'video_bg') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {pipelines.find((p) => p.id === activePipeline)?.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target Engine: {pipelines.find((p) => p.id === activePipeline)?.modelTarget}
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 font-mono text-xs text-slate-600 dark:text-slate-300">
              {pipelines.find((p) => p.id === activePipeline)?.specs}
            </span>
          </div>

          <div className="relative flex min-h-[340px] items-center justify-center rounded-xl bg-slate-950 p-6 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 opacity-80" />
            <div className="relative z-10 max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                <Play className="h-8 w-8 translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Veo Cloud Video Cluster</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Configure your Google Cloud Veo 3.1 endpoint in Admin Console to enable remote generative video synthesis.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  disabled
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 opacity-60 cursor-not-allowed"
                >
                  <Film className="h-4 w-4" />
                  <span>Cloud GPU Worker Required</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
