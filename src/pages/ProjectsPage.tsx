import React, { useState, useEffect } from 'react';
import { FolderKanban, Search, Download, Trash2, Edit3, Grid, List, Sparkles, Plus, Check } from 'lucide-react';
import { firestore, ProjectDoc } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProjectsPageProps {
  setActiveView: (view: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ setActiveView }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      return;
    }
    const unsubscribe = firestore.subscribeUserProjects(user.uid, (items) => {
      setProjects(items);
    });
    return unsubscribe;
  }, [user?.uid]);

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.tool.toLowerCase().includes(q);
  });

  const handleDelete = async (id: string) => {
    await firestore.deleteProject(id);
    success('Project removed.');
  };

  const handleStartRename = (project: ProjectDoc) => {
    setEditingId(project.projectId);
    setEditName(project.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return;
    const p = projects.find((item) => item.projectId === id);
    if (p) {
      await firestore.setProject({
        ...p,
        name: editName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingId(null);
      success('Project renamed.');
    }
  };

  const handleCreateNew = () => {
    setActiveView('tools');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            My Visual Projects
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage your saved visual assets, e-commerce staging shoots, and passport layouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search & Layout View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto border border-slate-200 rounded-xl p-1 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold' : 'text-slate-500'
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'list' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold' : 'text-slate-500'
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No projects found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'Try matching another search keyword.' : 'Start your first visual editing session to save projects.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Create Your First Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.projectId}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {p.tool}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {editingId === p.projectId ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(p.projectId)}
                      className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {p.name}
                  </h3>
                )}

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-600 capitalize">{p.status}</span>
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setActiveView(`tool:${p.tool.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                  className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Open in Studio
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartRename(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Rename Project"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.projectId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    title="Delete Project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 dark:bg-slate-800 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Project Name</th>
                <th className="px-6 py-3 font-semibold">Tool</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Modified</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.map((p) => (
                <tr key={p.projectId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {p.name}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{p.tool}</td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">
                    {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('tools')}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.projectId)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
