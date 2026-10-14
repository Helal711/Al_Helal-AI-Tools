import React, { useState } from 'react';
import { UploadDropzone } from '../common/UploadDropzone';
import { AIImageEditor } from './editor/AIImageEditor';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import { useToast } from '../../context/ToastContext';
import { firestore } from '../../firebase/firestore';

export const AIImageEditorTool: React.FC = () => {
  const { user } = useAuth();
  const { addHistoryItem } = useHistory();
  const { success } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelected = (dataUrl: string) => {
    setSelectedImage(dataUrl);
  };

  const handleSaveProject = async (savedUri: string) => {
    if (user?.uid) {
      try {
        await firestore.createProject({
          userId: user.uid,
          name: `Studio Edit ${new Date().toLocaleDateString()}`,
          originalImage: selectedImage || undefined,
          processedImage: savedUri,
          tool: 'AI Image Editor',
        });
        addHistoryItem({
          url: savedUri,
          processedImage: savedUri,
          tool: 'AI Image Editor',
        });
      } catch {
        // Fallback
      }
    }
  };

  if (selectedImage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            ← Open Different Image
          </button>
        </div>
        <AIImageEditor
          initialImage={selectedImage}
          onClose={() => setSelectedImage(null)}
          onSaveProject={handleSaveProject}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          AI Image Editor & Creative Studio
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Professional prompt-based generative editing, neural inpainting, layer composition, and tone grading canvas.
        </p>
      </div>

      <UploadDropzone
        title="Upload Image for AI Studio Editing"
        subtitle="Supports JPG, PNG, WEBP up to 25MB · Unlimited free processing"
        onImageSelected={handleImageSelected}
      />
    </div>
  );
};
