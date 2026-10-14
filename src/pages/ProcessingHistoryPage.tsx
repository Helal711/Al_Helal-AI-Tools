import React, { useState } from 'react';
import { History, Download, Filter, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';

interface HistoryPageProps {
  setActiveView: (view: string) => void;
}

export const ProcessingHistoryPage: React.FC<HistoryPageProps> = ({ setActiveView }) => {
  const { history } = useHistory();
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Image Processing History</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Timeline of all visual transformations, super-resolution runs, and generative outputs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['all', 'completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <History className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No processing history yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Your processing events and downloads are stored automatically as you create.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Launch a Workspace
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Visual Output</th>
                <th className="px-6 py-3 font-semibold">Tool Employed</th>
                <th className="px-6 py-3 font-semibold">Input / Prompt</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <img src={item.url || item.processedImage} alt="Result" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">{item.tool}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {item.prompt || (item.originalUrl || item.originalImage ? 'Input Photo' : 'Procedural Canvas')}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <a
                      href={item.url || item.processedImage}
                      download={`pixelforge_history_${item.id}.png`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </a>
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
