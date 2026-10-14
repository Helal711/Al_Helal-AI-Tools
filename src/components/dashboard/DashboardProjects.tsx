import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Grid,
  List,
  Star,
  Edit3,
  Copy,
  Trash2,
  Archive,
  Download,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProjectDoc, firestore } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { ProjectDetailView } from './ProjectDetailView';

interface DashboardProjectsProps {
  projects: ProjectDoc[];
  selectedProjectId?: string | null;
  onSelectProject: (projectId: string | null) => void;
  setActiveView: (view: string) => void;
  onRefreshData?: () => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
  onOpenNewProjectModal: () => void;
}

export const DashboardProjects: React.FC<DashboardProjectsProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  setActiveView,
  onRefreshData,
  onPreviewImage,
  onOpenNewProjectModal,
}) => {
  const { success, error } = useToast();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);
  const [filterArchivedOnly, setFilterArchivedOnly] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline rename
  const [renamingProject, setRenamingProject] = useState<ProjectDoc | null>(null);
  const [newName, setNewName] = useState('');

  // If a specific project is selected, render the ProjectDetailView
  const activeProject = projects.find((p) => p.projectId === selectedProjectId);
  if (activeProject) {
    return (
      <ProjectDetailView
        project={activeProject}
        onBack={() => onSelectProject(null)}
        setActiveView={setActiveView}
        onRefreshData={onRefreshData}
        onPreviewImage={onPreviewImage}
      />
    );
  }

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || (p.tool && p.tool.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (filterFavoriteOnly && !p.favorite) return false;
    if (filterArchivedOnly && !p.archived) return false;
    if (!filterArchivedOnly && p.archived) return false; // Hide archived by default
    if (filterCategory !== 'all' && p.tool !== filterCategory) return false;

    return true;
  });

  // Unique tools for filtering
  const toolCategories = Array.from(new Set(projects.map((p) => p.tool).filter(Boolean)));

  // Batch actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map((p) => p.projectId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected projects?`)) {
      try {
        await Promise.all(Array.from(selectedIds).map((id) => firestore.deleteProject(id)));
        success(`Deleted ${selectedIds.size} projects`);
        setSelectedIds(new Set());
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete some projects');
      }
    }
  };

  const handleBatchArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => firestore.archiveProject(id, !filterArchivedOnly))
      );
      success(`${filterArchivedOnly ? 'Restored' : 'Archived'} ${selectedIds.size} projects`);
      setSelectedIds(new Set());
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to archive projects');
    }
  };

  // Single project actions
  const handleToggleFavorite = async (project: ProjectDoc) => {
    try {
      await firestore.setProject({
        ...project,
        favorite: !project.favorite,
        updatedAt: new Date().toISOString(),
      });
      success(project.favorite ? 'Removed from favorites' : 'Pinned to favorites');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update favorite status');
    }
  };

  const handleDuplicate = async (project: ProjectDoc) => {
    try {
      const duplicated = await firestore.duplicateProject(project.projectId);
      if (duplicated) {
        success(`Project duplicated as "${duplicated.name}"`);
        if (onRefreshData) onRefreshData();
      }
    } catch {
      error('Failed to duplicate project');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Delete this project?')) {
      try {
        await firestore.deleteProject(projectId);
        success('Project deleted');
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete project');
      }
    }
  };

  const handleStartRename = (project: ProjectDoc) => {
    setRenamingProject(project);
    setNewName(project.name);
  };

  const handleSaveRename = async () => {
    if (!renamingProject || !newName.trim()) return;
    try {
      await firestore.setProject({
        ...renamingProject,
        name: newName.trim(),
        updatedAt: new Date().toISOString(),
      });
      success('Project renamed');
      setRenamingProject(null);
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to rename');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>My Projects</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Organize, version, and manage all your creative graphic sessions and exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by name or tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tool Category Selector */}
          {toolCategories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Tools</option>
              {toolCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Favorites Filter */}
          <button
            type="button"
            onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
            className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              filterFavoriteOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${filterFavoriteOnly ? 'fill-amber-500' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Archived Filter */}
          <button
            type="button"
            onClick={() => setFilterArchivedOnly(!filterArchivedOnly)}
            className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              filterArchivedOnly
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
          </button>

          {/* Layout Mode Toggles */}
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
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Action Bar if items selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 text-xs text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1 font-semibold"
            >
              <CheckSquare className="h-4 w-4 text-indigo-600" />
              <span>{selectedIds.size} Selected</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchArchive}
              className="rounded-lg bg-white px-2.5 py-1 font-semibold shadow-2xs hover:bg-slate-50 dark:bg-slate-800"
            >
              {filterArchivedOnly ? 'Restore Selected' : 'Archive Selected'}
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="rounded-lg bg-rose-600 px-2.5 py-1 font-bold text-white shadow-2xs hover:bg-rose-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No projects found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterCategory !== 'all' || filterFavoriteOnly
              ? 'No projects match your current filters. Clear filters or search term to see all projects.'
              : 'Create your first project to start organizing visual enhancements and generative artwork.'}
          </p>
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            + Create New Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const isSelected = selectedIds.has(p.projectId);
            const preview = p.processedImage || p.originalImage || '';
            return (
              <div
                key={p.projectId}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs hover:border-slate-300 dark:bg-slate-900 transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Select Checkbox & Star Badge */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-3 border border-slate-100 dark:border-slate-800">
                    {preview ? (
                      <img
                        src={preview}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Layers className="h-6 w-6" />
                      </div>
                    )}

                    {/* Checkbox overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(p.projectId);
                      }}
                      className="absolute top-2 left-2 z-10 rounded-md bg-black/60 p-1 text-white hover:bg-black"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300" />
                      )}
                    </button>

                    {/* Favorite star */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(p);
                      }}
                      className="absolute top-2 right-2 z-10 rounded-md bg-black/60 p-1 text-white hover:bg-black"
                    >
                      <Star className={`h-4 w-4 ${p.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                      {p.tool || 'Studio Project'}
                    </span>
                    <span className="font-mono">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3
                    className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-indigo-600"
                    title={p.name}
                    onClick={() => onSelectProject(p.projectId)}
                  >
                    {p.name}
                  </h3>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectProject(p.projectId)}
                    className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    <span>View Project</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartRename(p)}
                      title="Rename"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(p)}
                      title="Duplicate"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.projectId)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button type="button" onClick={toggleSelectAll}>
                    {selectedIds.size === filteredProjects.length ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">AI Engine</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.map((p) => {
                const isSelected = selectedIds.has(p.projectId);
                return (
                  <tr
                    key={p.projectId}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button type="button" onClick={() => toggleSelectOne(p.projectId)}>
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
                          onClick={() => onSelectProject(p.projectId)}
                        >
                          {p.processedImage || p.originalImage ? (
                            <img
                              src={p.processedImage || p.originalImage}
                              alt={p.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-600">
                              <Layers className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer"
                            onClick={() => onSelectProject(p.projectId)}
                          >
                            {p.name}
                          </p>
                          <span className="text-[10px] text-slate-400">{p.status || 'Active'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {p.tool}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(p)}
                          className="p-1 text-slate-400 hover:text-amber-500"
                        >
                          <Star className={`h-3.5 w-3.5 ${p.favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(p)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(p)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.projectId)}
                          className="p-1 text-slate-400 hover:text-rose-600"
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

      {/* Rename Modal */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rename Project</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingProject(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
