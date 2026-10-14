import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
  Download,
  FileText,
  Sliders,
  ExternalLink,
  ChevronRight,
  Eye,
  Play,
  Clock,
  Layers,
  Sparkles,
  Server,
  Activity,
  ArrowUpDown,
  Lock,
  ChevronLeft,
  X,
  Code2,
} from 'lucide-react';
import {
  ToolCapabilityRecord,
  ToolAuditSummary,
  ToolAuditCategory,
  ImplementationStatus,
  TestResultStatus,
  getToolCapabilityMatrix,
  getAuditSummary,
  runToolVerification,
  exportAuditReport,
} from '../../services/ai/ToolCapabilityMatrix';
import { useToast } from '../../context/ToastContext';

interface AdminIntegrationAuditProps {
  setActiveView?: (view: string) => void;
}

export const AdminIntegrationAudit: React.FC<AdminIntegrationAuditProps> = ({ setActiveView }) => {
  const { success, error: toastError } = useToast();

  const [matrix, setMatrix] = useState<ToolCapabilityRecord[]>(() => getToolCapabilityMatrix());
  const [summary, setSummary] = useState<ToolAuditSummary>(() => getAuditSummary());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTestResult, setSelectedTestResult] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'status' | 'test'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected tool for detail modal
  const [inspectedTool, setInspectedTool] = useState<ToolCapabilityRecord | null>(null);

  // Verification states
  const [verifyingToolId, setVerifyingToolId] = useState<string | null>(null);
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Provider live health test states
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [probingProviderId, setProbingProviderId] = useState<string | null>(null);

  // Refresh data on mount
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/audit/providers');
      if (res.ok) {
        const data = await res.json();
        setProviderStatuses(data.providers || []);
      }
    } catch {
      // Fallback
    }
  };

  const handleProbeProvider = async (providerId: string) => {
    setProbingProviderId(providerId);
    try {
      const res = await fetch('/api/admin/audit/verify-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.status === 'HEALTHY') {
        success(`${providerId}: ${data.message}`);
      } else {
        toastError(`${providerId}: ${data.message}`);
      }
      await fetchProviders();
    } catch (err: any) {
      toastError(`Probe error: ${err.message}`);
    } finally {
      setProbingProviderId(null);
    }
  };

  // Run single tool test
  const handleTestTool = async (tool: ToolCapabilityRecord) => {
    setVerifyingToolId(tool.toolId);
    try {
      const res = await runToolVerification(tool.toolId);
      if (res.status === 'passed') {
        success(`${tool.toolName}: Verification Passed (${res.latencyMs}ms)`);
      } else if (res.status === 'skipped') {
        success(`${tool.toolName}: ${res.details}`);
      } else {
        toastError(`${tool.toolName}: Test Failed — ${res.details}`);
      }

      // Refresh records
      const updatedMatrix = getToolCapabilityMatrix();
      setMatrix(updatedMatrix);
      setSummary(getAuditSummary(updatedMatrix));

      if (inspectedTool && inspectedTool.toolId === tool.toolId) {
        const fresh = updatedMatrix.find((t) => t.toolId === tool.toolId);
        if (fresh) setInspectedTool(fresh);
      }
    } catch (err: any) {
      toastError(`Failed to verify ${tool.toolName}: ${err.message}`);
    } finally {
      setVerifyingToolId(null);
    }
  };

  // Run full batch audit
  const handleRunFullAudit = async () => {
    setIsBatchTesting(true);
    setBatchProgress(0);
    const total = matrix.length;

    for (let i = 0; i < total; i++) {
      const t = matrix[i];
      await runToolVerification(t.toolId);
      setBatchProgress(Math.round(((i + 1) / total) * 100));
    }

    const updated = getToolCapabilityMatrix();
    setMatrix(updated);
    setSummary(getAuditSummary(updated));
    setIsBatchTesting(false);
    success(`Completed audit verification across all ${total} registered tools!`);
  };

  // Export report
  const handleExport = (format: 'json' | 'csv') => {
    const content = exportAuditReport(format);
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelforge_ai_integration_audit_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    success(`Audit report exported (${format.toUpperCase()})`);
  };

  // Filtering & Sorting
  const filteredTools = useMemo(() => {
    return matrix.filter((t) => {
      // Search
      const matchesSearch =
        t.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.toolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.providerName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      // Status
      if (selectedStatus !== 'all' && t.implementationStatus !== selectedStatus) return false;

      // Test result
      if (selectedTestResult !== 'all' && t.lastTestStatus !== selectedTestResult) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.toolName.localeCompare(b.toolName);
      else if (sortBy === 'category') comparison = a.categoryLabel.localeCompare(b.categoryLabel);
      else if (sortBy === 'status') comparison = a.implementationStatus.localeCompare(b.implementationStatus);
      else if (sortBy === 'test') comparison = a.lastTestStatus.localeCompare(b.lastTestStatus);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [matrix, searchQuery, selectedCategory, selectedStatus, selectedTestResult, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredTools.length / pageSize) || 1;
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTools.slice(start, start + pageSize);
  }, [filteredTools, currentPage, pageSize]);

  const categoriesList: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'BASIC_UTILITY', label: 'Basic Image Utilities' },
    { id: 'BACKGROUND_PROCESSING', label: 'Background & Cutout' },
    { id: 'IMAGE_ENHANCEMENT', label: 'Image Enhancement & Upscale' },
    { id: 'AI_IMAGE_EDITING', label: 'AI Inpainting & Editing' },
    { id: 'IMAGE_GENERATION', label: 'Generative Synthesis' },
    { id: 'PORTRAIT_AND_FACE', label: 'Portraits & Biometrics' },
    { id: 'VIDEO_TOOLS', label: 'Video & Motion Synthesis' },
    { id: 'DESIGN_AND_ECOMMERCE', label: 'E-Commerce & Creatives' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Integration Audit & Capability Matrix
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                PART 10 · Live technical inspection of all 55 registered AI tools, provider bindings, and verified operability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRunFullAudit}
            disabled={isBatchTesting}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60"
          >
            <Play className={`h-3.5 w-3.5 ${isBatchTesting ? 'animate-spin' : ''}`} />
            <span>{isBatchTesting ? `Auditing (${batchProgress}%)` : 'Run Full Verification'}</span>
          </button>
        </div>
      </div>

      {/* SECTION A: Integration Overview (8 Metric Counters) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Section A: Operational Verification Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Total Tools */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Registered</span>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{summary.totalTools}</p>
            <span className="text-[10px] text-slate-500">100% catalogued</span>
          </div>

          {/* 2. Fully Verified */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Fully Verified</span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300">{summary.fullyVerified}</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">E2E passed</span>
          </div>

          {/* 3. Partially Implemented */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Partially Impl.</span>
            <p className="mt-1 font-mono text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.partiallyImplemented}</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400">Hybrid client tools</span>
          </div>

          {/* 4. Standby / Provider Required */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Provider Required</span>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-700 dark:text-amber-300">{summary.uiOnlyOrStandby}</p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Veo Video Cluster</span>
          </div>

          {/* 5. Missing Provider Config */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Missing Config</span>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{summary.missingProviderConfig}</p>
            <span className="text-[10px] text-slate-500">Env keys pending</span>
          </div>

          {/* 6. Unsupported Capabilities */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Unsupported</span>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{summary.unsupportedCapabilities}</p>
            <span className="text-[10px] text-slate-500">Zero rogue tools</span>
          </div>

          {/* 7. Failing Tests */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Failing Tests</span>
            <p className="mt-1 font-mono text-2xl font-bold text-rose-700 dark:text-rose-300">{summary.failingTests}</p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400">Requires triage</span>
          </div>

          {/* 8. Awaiting Verification */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-4 shadow-2xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">Awaiting Test</span>
            <p className="mt-1 font-mono text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.awaitingVerification}</p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400">Pending probe</span>
          </div>
        </div>
      </div>

      {/* SECTION C: Provider Health Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Section C: Configured AI Provider Cluster & Health Status
          </h2>
          <span className="text-[11px] text-slate-400">Real-time server & hardware probes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerStatuses.map((prov) => {
            const isHealthy = prov.healthStatus === 'HEALTHY';
            const isMissing = prov.healthStatus === 'MISSING_CONFIGURATION';
            const isUnavailable = prov.healthStatus === 'UNAVAILABLE';
            const isProbing = probingProviderId === prov.providerId;

            return (
              <div
                key={prov.providerId}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{prov.name}</h3>
                      <p className="font-mono text-[10px] text-slate-400">{prov.providerId}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isHealthy
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : isMissing
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : isMissing ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      {prov.healthStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {prov.note}
                  </p>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-2.5 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Required Env Var:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{prov.requiredEnvVar}</span>
                    </div>
                    {prov.latencyMs !== null && (
                      <div className="flex justify-between text-slate-500">
                        <span>Latency Probe:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{prov.latencyMs} ms</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {prov.supportedCapabilities?.length || 0} capabilities declared
                  </span>
                  <button
                    onClick={() => handleProbeProvider(prov.providerId)}
                    disabled={isProbing}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3 w-3 ${isProbing ? 'animate-spin' : ''}`} />
                    <span>{isProbing ? 'Probing...' : 'Probe Health'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B: Tool Audit Table with Filters & Sorting */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Section B: Registered Tool Capability Inventory ({filteredTools.length} of {matrix.length})
            </h2>
            <p className="text-xs text-slate-500">
              Granular inspection of routing, execution models, and verification statuses.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search 55 tools, providers, or IDs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Implementation Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="fully_implemented">Fully Implemented</option>
              <option value="partially_implemented">Partially Implemented</option>
              <option value="provider_required">Provider Required (Standby)</option>
              <option value="blocked_missing_config">Blocked by Missing Config</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Result</label>
            <select
              value={selectedTestResult}
              onChange={(e) => {
                setSelectedTestResult(e.target.value);
                setCurrentPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
              <option value="not_tested">Not Tested</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tool Name & ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Required Capability</th>
                <th className="py-3 px-4">Current Provider</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Result</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedTools.map((tool) => {
                const isTesting = verifyingToolId === tool.toolId;
                const isPassed = tool.lastTestStatus === 'passed';
                const isSkipped = tool.lastTestStatus === 'skipped';
                const isFailed = tool.lastTestStatus === 'failed';

                return (
                  <tr
                    key={tool.toolId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{tool.toolName}</span>
                        <p className="font-mono text-[10px] text-slate-400">{tool.toolId}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {tool.categoryLabel}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {tool.requiredCapability}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {tool.providerName}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">mode: {tool.processingMode}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tool.implementationStatus === 'fully_implemented'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : tool.implementationStatus === 'partially_implemented'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            : tool.implementationStatus === 'provider_required'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {tool.implementationStatus === 'fully_implemented'
                          ? 'Fully Implemented'
                          : tool.implementationStatus === 'partially_implemented'
                          ? 'Partially Implemented'
                          : tool.implementationStatus === 'provider_required'
                          ? 'Provider Required'
                          : 'Blocked / Config'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {isPassed && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {isSkipped && <HelpCircle className="h-4 w-4 text-amber-600" />}
                        {isFailed && <XCircle className="h-4 w-4 text-rose-600" />}
                        {!isPassed && !isSkipped && !isFailed && (
                          <Clock className="h-4 w-4 text-slate-400" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            isPassed
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isSkipped
                              ? 'text-amber-700 dark:text-amber-400'
                              : isFailed
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {tool.lastTestStatus.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tool.lastTestedAt}</p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTestTool(tool)}
                          disabled={isTesting}
                          title="Run Non-Destructive Verification Test"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors disabled:opacity-60"
                        >
                          <Play className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Test'}</span>
                        </button>
                        <button
                          onClick={() => setInspectedTool(tool)}
                          title="Inspect Tool Technical Specifications"
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTools.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No matching tools found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search query or filter selections.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredTools.length)} of {filteredTools.length} tools
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D: Tool Detail View Modal */}
      {inspectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  {inspectedTool.categoryLabel}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">
                  {inspectedTool.toolName}
                </h3>
                <p className="font-mono text-xs text-slate-400">ID: {inspectedTool.toolId}</p>
              </div>

              <button
                onClick={() => setInspectedTool(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Implementation Overview</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedTool.description}
              </p>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Frontend Component</span>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all">
                  {inspectedTool.frontendComponent}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Backend Handler</span>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all">
                  {inspectedTool.backendHandler}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Provider Adapter</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {inspectedTool.providerName}
                </p>
                <p className="font-mono text-[10px] text-slate-400">ID: {inspectedTool.providerId}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Credentials Required</span>
                <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {inspectedTool.requiredEnvVar || 'None (Client Canvas)'}
                </p>
                <p className="text-[10px] text-slate-400">No secret values exposed to client.</p>
              </div>
            </div>

            {/* Formats & Capability Flags */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supported Formats & Capabilities</span>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px]">
                  Inputs: {inspectedTool.inputTypes.join(', ')}
                </span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px]">
                  Outputs: {inspectedTool.outputTypes.join(', ')}
                </span>
                {inspectedTool.supportsTransparency && (
                  <span className="rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 font-semibold text-[11px]">
                    Alpha Transparency
                  </span>
                )}
                {inspectedTool.supportsBatchProcessing && (
                  <span className="rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 font-semibold text-[11px]">
                    Batch Multi-File
                  </span>
                )}
              </div>
            </div>

            {/* Limitations & Recommendations */}
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">Known Limitations</span>
                <p className="text-amber-900 dark:text-amber-200 leading-relaxed">
                  {inspectedTool.knownLimitations}
                </p>
              </div>

              <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase">Recommended Action</span>
                <p className="text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  {inspectedTool.recommendedAction}
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Last Tested: <span className="font-semibold">{inspectedTool.lastTestedAt}</span> (
                <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{inspectedTool.lastTestStatus}</span>)
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTestTool(inspectedTool)}
                  disabled={verifyingToolId === inspectedTool.toolId}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-60"
                >
                  <Play className={`h-3.5 w-3.5 ${verifyingToolId === inspectedTool.toolId ? 'animate-spin' : ''}`} />
                  <span>{verifyingToolId === inspectedTool.toolId ? 'Testing...' : 'Run Test Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
