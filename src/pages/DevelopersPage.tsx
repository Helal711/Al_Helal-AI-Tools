import React, { useState } from 'react';
import { Key, Shield, Code, Terminal, Check, Copy, AlertCircle, RefreshCw, Trash2, Webhook } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string;
}

export const DevelopersPage: React.FC<{ setActiveView: (v: string) => void }> = ({ setActiveView }) => {
  const { success } = useToast();
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_1',
      name: 'Default Production Key',
      prefix: 'pk_live_8f93...4b12',
      createdAt: '2026-09-15',
      lastUsedAt: 'Just now',
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'keys' | 'webhooks'>('endpoints');

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const rawSecret = `pk_live_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `${rawSecret.substring(0, 12)}...${rawSecret.substring(rawSecret.length - 4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Never',
    };

    setKeys([newKey, ...keys]);
    setRevealedSecret(rawSecret);
    setNewKeyName('');
    success('API key created successfully.');
  };

  const handleRevokeKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
    success('API key revoked.');
  };

  const handleCopySecret = () => {
    if (!revealedSecret) return;
    navigator.clipboard.writeText(revealedSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    success('API key copied to clipboard.');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Code className="h-4 w-4" />
          PixelForge Developer Platform
        </div>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
          Visual AI APIs & Documentation
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Integrate PixelForge cutouts, super-resolution upscaling, photo enhancement, and generation into your applications.
        </p>

        {/* Navigation Tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'endpoints'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            API Endpoints & Specs
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'keys'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            API Key Management
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'webhooks'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Webhooks & Asynchronous Jobs
          </button>
        </div>
      </div>

      {activeTab === 'endpoints' && (
        <div className="space-y-8">
          {/* Authentication Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Authentication & Headers
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Authenticate requests by including your secret API key in the Authorization header.
            </p>
            <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200">
              Authorization: Bearer pk_live_your_api_key_here
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Shield className="h-4 w-4 text-emerald-500" />
              Standard rate limits: 60 requests/minute per key. HTTP 429 returned upon limit exceedance.
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-6">
            {/* 1. Background Remove */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  POST
                </span>
                <code className="text-sm font-semibold text-slate-900 dark:text-white">
                  /api/v1/images/background-remove
                </code>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Removes backgrounds from image payloads and returns transparent PNG or WebP data.
              </p>
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">cURL Request Example:</div>
                <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200">
{`curl -X POST https://pixelforge.ai/api/v1/images/background-remove \\
  -H "Authorization: Bearer pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "data:image/jpeg;base64,...",
    "format": "png",
    "feather": 1.5
  }'`}
                </pre>
              </div>
            </div>

            {/* 2. Upscale */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  POST
                </span>
                <code className="text-sm font-semibold text-slate-900 dark:text-white">
                  /api/v1/images/upscale
                </code>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Super-resolution neural upscaling to 2x or 4x scale with facial detail recovery.
              </p>
            </div>

            {/* 3. Enhance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  POST
                </span>
                <code className="text-sm font-semibold text-slate-900 dark:text-white">
                  /api/v1/images/enhance
                </code>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Adjusts sharpness, lighting balance, adaptive contrast, and denoise parameters.
              </p>
            </div>

            {/* 4. Generate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  POST
                </span>
                <code className="text-sm font-semibold text-slate-900 dark:text-white">
                  /api/v1/images/generate
                </code>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Generates high-resolution visuals from descriptive text prompts.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Secret Key Modal Banner */}
          {revealedSecret && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 dark:text-amber-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Save your API Key Now — It will not be shown again!
                  </h3>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    For security reasons, this secret key cannot be retrieved after you close or refresh this page.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-amber-200 select-all overflow-x-auto">
                      {revealedSecret}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copy
                    </button>
                    <button
                      onClick={() => setRevealedSecret(null)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Key Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New API Key</h2>
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder="Key label (e.g. Staging Server, Webhook Worker)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Generate Key
              </button>
            </div>
          </div>

          {/* Keys Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Label</th>
                  <th className="px-6 py-3">Prefix</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Last Used</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{k.prefix}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{k.createdAt}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{k.lastUsedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="rounded p-1 text-slate-400 hover:text-red-500"
                        title="Revoke key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Webhook Architecture & Verification</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            For asynchronous batch or high-resolution render operations, provide a <code>webhookUrl</code> in your POST request payload. PixelForge will ping your endpoint with HMAC-SHA256 signature verification upon completion.
          </p>
          <div className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200">
{`// Webhook Event Payload Example:
{
  "event": "image.completed",
  "jobId": "job_94821a",
  "resultUrl": "https://storage.pixelforge.ai/results/...",
  "status": "success",
  "durationMs": 420
}`}
          </div>
        </div>
      )}
    </div>
  );
};
