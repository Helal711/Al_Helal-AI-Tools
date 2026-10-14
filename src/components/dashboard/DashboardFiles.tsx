import React, { useState } from 'react';
import {
  UploadCloud,
  Search,
  Filter,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  FileImage,
  Layers,
  ArrowUpDown,
  Plus,
  FolderPlus,
  Grid,
  List,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { FileDoc, ProjectDoc, firestore } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardFilesProps {
  files: FileDoc[];
  projects: ProjectDoc[];
  onOpenUploadModal: () => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
  onRefreshData?: () => void;
  setActiveView: (view: string) => void;
}

export const DashboardFiles: React.FC<DashboardFilesProps> = ({
  files,
  projects,
  onOpenUploadModal,
  onPreviewImage,
  onRefreshData,
  setActiveView,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Assign to project modal
  const [assigningFile, setAssigningFile] = useState<FileDoc | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter logic
  const filteredFiles = files
    .filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = f.name.toLowerCase().includes(q) || (f.mimeType && f.mimeType.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (filterSource !== 'all' && f.source !== filterSource) return false;
      if (filterType !== 'all') {
        if (filterType === 'png' && !f.mimeType.includes('png')) return false;
        if (filterType === 'jpeg' && !f.mimeType.includes('jpeg') && !f.mimeType.includes('jpg')) return false;
        if (filterType === 'webp' && !f.mimeType.includes('webp')) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredFiles.map((f) => f.fileId)));
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm('Delete this file from your personal cloud storage?')) {
      try {
        await firestore.deleteFile(fileId);
        success('File deleted from cloud storage');
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete file');
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected files?`)) {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => firestore.deleteFile(id)));
        success(`Deleted ${selectedIds.size} files`);
        setSelectedIds(new Set());
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete files');
      }
    }
  };

  const handleCopyLink = (file: FileDoc) => {
    navigator.clipboard.writeText(file.storagePath);
    success('Asset link copied to clipboard');
  };

  const handleDownload = (file: FileDoc) => {
    const a = document.createElement('a');
    a.href = file.storagePath;
    a.download = file.name;
    a.click();
  };

  const handleSaveAssign = async () => {
    if (!assigningFile || !selectedProjectId) return;
    const proj = projects.find((p) => p.projectId === selectedProjectId);
    if (!proj) return;

    try {
      await firestore.setProject({
        ...proj,
        processedImage: assigningFile.storagePath,
        updatedAt: new Date().toISOString(),
      });
      success(`Assigned file to project "${proj.name}"`);
      setAssigningFile(null);
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to assign file to project');
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>All Files & Asset Storage</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Unified media repository for all uploaded inputs, generated artwork, and high-res results.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenUploadModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files by name or mime type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Sources</option>
            <option value="upload">Uploaded Files</option>
            <option value="generation">AI Generations</option>
            <option value="edit">Editor Exports</option>
            <option value="enhancement">Enhancements</option>
            <option value="upscale">Upscaled Images</option>
          </select>

          {/* Format Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Formats</option>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG / JPG</option>
            <option value="webp">WebP</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">File Name</option>
            <option value="size">File Size</option>
          </select>

          {/* View Toggles */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-400'}`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 text-xs text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleSelectAll} className="flex items-center gap-1 font-semibold">
              <CheckSquare className="h-4 w-4 text-indigo-600" />
              <span>{selectedIds.size} Selected</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBatchDelete}
            className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white shadow-2xs hover:bg-rose-700"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <UploadCloud className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No media assets found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterSource !== 'all' || filterType !== 'all'
              ? 'No files matched your search or filters. Clear query to see all assets.'
              : 'Upload an image or generate creative assets in any studio tool to populate your storage.'}
          </p>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Upload Image Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.fileId);
            return (
              <div
                key={file.fileId}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3 shadow-2xs hover:border-slate-300 dark:bg-slate-900 transition-all ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPreviewImage(file.storagePath, file.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onPreviewImage(file.storagePath, file.name);
                      }
                    }}
                    className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950 mb-2.5 cursor-pointer"
                  >
                    <img
                      src={file.storagePath}
                      alt={file.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(file.fileId);
                      }}
                      className="absolute top-2 left-2 z-10 rounded-md bg-black/60 p-1 text-white hover:bg-black"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-slate-300" />
                      )}
                    </button>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={file.name}>
                    {file.name}
                  </p>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* File Action Icons */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(file)}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title="Copy Data/URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigningFile(file)}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title="Move to Project"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.fileId)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button type="button" onClick={toggleSelectAll}>
                    {selectedIds.size === filteredFiles.length ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Date Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.fileId);
                return (
                  <tr
                    key={file.fileId}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => toggleSelectOne(file.fileId)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-lg bg-slate-950 overflow-hidden shrink-0 cursor-pointer"
                          onClick={() => onPreviewImage(file.storagePath, file.name)}
                        >
                          <img
                            src={file.storagePath}
                            alt={file.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer truncate max-w-xs"
                          onClick={() => onPreviewImage(file.storagePath, file.name)}
                        >
                          {file.name}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{formatSize(file.size)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{file.mimeType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(file)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Copy Link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssigningFile(file)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Assign to Project"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(file.fileId)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign File to Project Modal */}
      {assigningFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assign File to Project</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an existing creative project to attach &quot;{assigningFile.name}&quot; to.
            </p>

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} ({p.tool})
                </option>
              ))}
            </select>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningFile(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedProjectId}
                onClick={handleSaveAssign}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Attach Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
