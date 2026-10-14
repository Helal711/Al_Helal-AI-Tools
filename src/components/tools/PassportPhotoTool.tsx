import React, { useState } from 'react';
import { Download, RefreshCw, FileBadge, Check, Printer } from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { generatePassportPhoto } from '../../services/imageProcessing';
import { useHistory } from '../../context/HistoryContext';
import { ProcessingState } from '../../types';

export const PassportPhotoTool: React.FC = () => {
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<string | null>(null);
  const [sheetResult, setSheetResult] = useState<string | null>(null);

  const [standard, setStandard] = useState<'us' | 'eu' | 'in' | 'cn'>('us');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [suitStyle, setSuitStyle] = useState<'none' | 'navy_suit' | 'black_suit' | 'formal_gray'>('none');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [printPaper, setPrintPaper] = useState<'4x6' | 'a4' | 'letter'>('4x6');
  const [cutGuides, setCutGuides] = useState<boolean>(true);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const countryStandards = [
    { id: 'us', label: 'US Passport / Visa', size: '2x2" (51x51mm)', desc: 'Official White Background' },
    { id: 'eu', label: 'EU / UK / Schengen', size: '35x45 mm', desc: 'Light Gray or Off-White' },
    { id: 'in', label: 'India Passport / OCI', size: '35x45 mm', desc: 'Light Background' },
    { id: 'cn', label: 'China Visa / Passport', size: '33x48 mm', desc: 'White Background' },
  ];

  const bgColors = [
    { label: 'Pure White', value: '#ffffff' },
    { label: 'Off-White', value: '#f8fafc' },
    { label: 'Light Sky Blue', value: '#e0f2fe' },
    { label: 'Soft Neutral Gray', value: '#e2e8f0' },
  ];

  const suitStyles = [
    { id: 'none', label: 'Original Clothing' },
    { id: 'navy_suit', label: 'Executive Navy Suit' },
    { id: 'black_suit', label: 'Charcoal Black Suit' },
    { id: 'formal_gray', label: 'Formal Dark Gray' },
  ];

  const handleImageSelected = async (imageUri: string) => {
    setOriginalImage(imageUri);
    await processPassport(imageUri, standard, bgColor, suitStyle);
  };

  const processPassport = async (
    imageSrc: string,
    std: 'us' | 'eu' | 'in' | 'cn',
    bg: string,
    suit: 'none' | 'navy_suit' | 'black_suit' | 'formal_gray'
  ) => {
    try {
      setProcessingState({
        status: 'preparing',
        progress: 20,
        message: 'Detecting facial positioning and crown-to-chin ratio...',
      });
      await new Promise((r) => setTimeout(r, 120));

      setProcessingState({
        status: 'processing',
        progress: 60,
        message: 'Formatting to official biometric standards...',
      });
      await new Promise((r) => setTimeout(r, 150));

      const { photoUrl, sheetUrl } = await generatePassportPhoto(imageSrc, {
        standard: std,
        bgColor: bg,
        suitStyle: suit,
        exportMode: 'print_sheet_4x6',
      });

      setProcessingState({
        status: 'finalizing',
        progress: 95,
        message: 'Generating 300 DPI 4x6" printable sheet...',
      });
      await new Promise((r) => setTimeout(r, 80));

      setPhotoResult(photoUrl);
      setSheetResult(sheetUrl || null);

      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Passport and print sheet created!',
      });

      addHistoryItem({
        url: photoUrl,
        originalUrl: imageSrc,
        tool: 'Passport Photo Maker',
      });
    } catch (err: any) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Failed to process passport photo',
        error: err.message,
      });
    }
  };

  const handleDownloadSingle = () => {
    if (!photoResult) return;
    const a = document.createElement('a');
    a.href = photoResult;
    a.download = `pixelforge_passport_${standard}_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  const handleDownloadSheet = () => {
    if (!sheetResult) return;
    const a = document.createElement('a');
    a.href = sheetResult;
    a.download = `pixelforge_passport_sheet_4x6_${Date.now()}.jpg`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setPhotoResult(null);
    setSheetResult(null);
    setProcessingState({ status: 'idle', progress: 0, message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Passport & ID Photo Maker</h1>
          <p className="mt-1 text-xs text-slate-500">
            Generate compliant biometric passport photos with suit overlays and printable 4x6&quot; sheet layouts.
          </p>
        </div>
        {originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Upload New Photo</span>
          </button>
        )}
      </div>

      {!originalImage ? (
        <ImageUploadZone onImageSelected={handleImageSelected} />
      ) : (
        <div className="space-y-6">
          <ProcessingStateIndicator
            state={processingState}
            onRetry={() => processPassport(originalImage, standard, bgColor, suitStyle)}
          />

          {photoResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left / Center: Preview Stage (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGuidelines(!showGuidelines)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        showGuidelines ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {showGuidelines ? 'Hide Biometric Guides' : 'Show Biometric Guides'}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Resolution: 300 DPI Official Spec</span>
                </div>

                {/* Photo Preview Stage */}
                <div className="relative flex min-h-[380px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-900/95 p-6 shadow-xs">
                  <div className="relative overflow-hidden rounded-xl shadow-2xl border border-white/20 bg-white">
                    <img
                      src={photoResult}
                      alt="Passport Portrait"
                      className="max-h-[360px] w-auto block object-contain"
                      referrerPolicy="no-referrer"
                    />

                    {/* Biometric guideline overlay */}
                    {showGuidelines && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-3">
                        <div className="w-full border-b border-dashed border-red-500/80 text-[10px] text-red-500 font-mono text-right pr-2">
                          Crown Limit (70-80%)
                        </div>
                        <div className="h-28 w-24 rounded-full border border-dashed border-indigo-400/70" />
                        <div className="w-full border-t border-dashed border-red-500/80 text-[10px] text-red-500 font-mono text-right pr-2">
                          Chin Line
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Printable 4x6 Sheet Preview Card */}
                {sheetResult && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">4x6&quot; Printable Photo Sheet</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium">Ready for home or pharmacy printing</span>
                    </div>
                    <div className="relative aspect-3/2 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img src={sheetResult} alt="Printable sheet" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Country Spec & Customization Controls (5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-6 shadow-xs">
                {/* Standard Selector */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <FileBadge className="h-4 w-4 text-indigo-600" />
                      <span>Country Specification</span>
                    </label>
                    <span className="text-[10px] text-slate-400 italic">Configurable presets</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {countryStandards.map((cs) => {
                      const isSelected = standard === cs.id;
                      return (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => {
                            setStandard(cs.id as any);
                            processPassport(originalImage, cs.id as any, bgColor, suitStyle);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{cs.label}</p>
                            <p className="text-[11px] text-slate-500">{cs.desc}</p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-indigo-600">{cs.size}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    * Preset specifications are configurable guidelines. Always verify with your local consulate or embassy.
                  </p>
                </div>

                {/* Print Sheet Layout Options */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <Printer className="h-4 w-4 text-indigo-600" />
                      <span>Print Sheet Paper</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cutGuides}
                        onChange={(e) => setCutGuides(e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span>Cut Guides</span>
                    </label>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: '4x6', label: '4×6" Photo', desc: '6 photos' },
                      { id: 'a4', label: 'A4 Sheet', desc: '12 photos' },
                      { id: 'letter', label: 'US Letter', desc: '8 photos' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPrintPaper(p.id as any)}
                        className={`rounded-xl border p-2 text-center transition-all ${
                          printPaper === p.id
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 font-bold text-indigo-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{p.label}</div>
                        <div className="text-[10px] text-slate-400">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Background Color
                  </label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {bgColors.map((col) => {
                      const isSelected = bgColor === col.value;
                      return (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => {
                            setBgColor(col.value);
                            processPassport(originalImage, standard, col.value, suitStyle);
                          }}
                          className={`relative flex h-9 items-center justify-center rounded-xl border transition-all ${
                            isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                          }`}
                          style={{ backgroundColor: col.value }}
                          title={col.label}
                        >
                          {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suit Attire Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Formal Attire Overlay
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {suitStyles.map((suit) => {
                      const isSelected = suitStyle === suit.id;
                      return (
                        <button
                          key={suit.id}
                          type="button"
                          onClick={() => {
                            setSuitStyle(suit.id as any);
                            processPassport(originalImage, standard, bgColor, suit.id as any);
                          }}
                          className={`rounded-xl border p-2 text-left text-xs transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-700 ring-1 ring-indigo-600'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {suit.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Download Actions */}
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <button
                    onClick={handleDownloadSheet}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Download 4x6&quot; Print Sheet (JPG)</span>
                  </button>

                  <button
                    onClick={handleDownloadSingle}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Single Photo (PNG)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
