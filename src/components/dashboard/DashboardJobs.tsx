import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Copy,
  Terminal,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AIJob } from '../../services/ai/types';
import { aiJobService } from '../../services/ai/AIJobService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardJobsProps {
  setActiveView: (view: string) => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
}

export const DashboardJobs: React.FC<DashboardJobsProps> = ({ setActiveView, onPreviewImage }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchId, setSearchId] = useState('');
  const [debugJob, setDebugJob] = useState<AIJob | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setJobs([]);
      return;
    }
    const unsub = aiJobService.subscribeUserJobs(user.uid, (list) => {
      setJobs(list);
    });
    return () => unsub();
  }, [user?.uid]);

  const filteredJobs = jobs.filter((j) => {
    if (searchId && !j.id.toLowerCase().includes(searchId.toLowerCase())) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'running' && j.status !== 'PROCESSING' && j.status !== 'QUEUED') return false;
      if (filterStatus === 'completed' && j.status !== 'COMPLETED') return false;
      if (filterStatus === 'failed' && j.status !== 'FAILED') return false;
    }
    return true;
  });

  const handleCancelJob = async (jobId: string) => {
    try {
      await aiJobService.cancelJob(jobId);
      success('Processing job cancelled');
    } catch {
      error('Failed to cancel job');
    }
  };

  const handleCopyDebug = (job: AIJob) => {
    navigator.clipboard.writeText(JSON.stringify(job, null, 2));
    success('Job debug payload copied');
  };

  const getStatusBadge = (status: AIJob['status']) => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="h-3 w-3 animate-spin" />
            <span>Queued</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
            <RotateCw className="h-3 w-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>AI Processing Jobs Monitor</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry, queue execution status, and diagnostics for background AI workloads.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'running', 'completed', 'failed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Cpu className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No processing jobs active</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Jobs are dispatched when you initiate AI generation, background removal, or object inpainting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    {job.id}
                  </span>
                  {getStatusBadge(job.status)}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Started: {new Date(job.createdAt).toLocaleTimeString()}</span>
                  {job.processingTimeMs && <span>· Duration: {(job.processingTimeMs / 1000).toFixed(2)}s</span>}
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">AI Capability</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{job.capability}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Provider / Model</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate block">
                    {job.providerId} {job.modelId ? `(${job.modelId})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tool Workspace</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{job.toolId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Idempotency Key</span>
                  <span className="font-mono text-slate-500 truncate block">
                    {job.idempotencyKey || 'none'}
                  </span>
                </div>
              </div>

              {/* Error Box if Failed */}
              {job.errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  <p className="font-bold">Execution Error:</p>
                  <p className="mt-0.5 font-mono text-[11px]">{job.errorMessage}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDebugJob(job)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Inspect Payload
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyDebug(job)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Copy JSON
                </button>

                {(job.status === 'PROCESSING' || job.status === 'QUEUED') && (
                  <button
                    type="button"
                    onClick={() => handleCancelJob(job.id)}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                  >
                    Cancel Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug Modal */}
      {debugJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <span>Job Telemetry Payload: {debugJob.id}</span>
            </h3>
            <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] font-mono text-emerald-400">
              {JSON.stringify(debugJob, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDebugJob(null)}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
