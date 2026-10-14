import React, { useState } from 'react';
import { FolderPlus, X, UploadCloud, Sparkles } from 'lucide-react';
import { firestore } from '../../firebase/firestore';
import { storage } from '../../firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [tool, setTool] = useState('AI Image Generator');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      let initialImageUri: string | undefined = undefined;

      if (selectedFile) {
        const fileDoc = await storage.uploadUserFile(
          user.uid,
          'projects',
          selectedFile.name,
          selectedFile
        );
        initialImageUri = fileDoc.storagePath;
      }

      const created = await firestore.createProject({
        userId: user.uid,
        name: name.trim(),
        tool,
        originalImage: initialImageUri,
        processedImage: initialImageUri,
      });

      if (created) {
        if (description.trim()) {
          await firestore.setProject({
            ...created,
            description: description.trim(),
          });
        }
        success(`Project "${name}" created!`);
        onClose();
        setName('');
        setDescription('');
        setSelectedFile(null);
        onProjectCreated(created.projectId);
      }
    } catch (e: any) {
      error(e.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FolderPlus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New Project</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Summer Campaign Shoot 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Primary AI Workflow</label>
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="AI Image Generator">AI Image Generator</option>
              <option value="Background Remover">Background Remover</option>
              <option value="Photo Enhancer">Photo Enhancer</option>
              <option value="Image Upscaler">Image Upscaler</option>
              <option value="Object Remover">Object Remover</option>
              <option value="Passport Photo Maker">Passport Photo Maker</option>
              <option value="E-Commerce Staging">E-Commerce Staging</option>
              <option value="AI Image Editor">AI Image Editor</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief overview of project goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Initial Asset (Optional)</label>
            <div className="mt-1 flex items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
              <label className="cursor-pointer">
                <UploadCloud className="mx-auto h-6 w-6 text-slate-400" />
                <span className="mt-1 block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedFile ? selectedFile.name : 'Upload initial input image'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
