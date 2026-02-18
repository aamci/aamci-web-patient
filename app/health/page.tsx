import { CheckCircle, Server, Clock } from 'lucide-react';

export const dynamic = "force-dynamic";

export default function HealthPage() {

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Web-Patient Front</h2>
            <p className="text-sm text-green-400">Healthy</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
            <Server className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">Environment</p>
              <p className="text-sm text-white font-mono">{process.env.NODE_ENV}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
            <Server className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">API Base URL</p>
              <p className="text-sm text-white font-mono truncate">
                {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
            <Clock className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-xs text-slate-400">Timestamp</p>
              <p className="text-sm text-white font-mono">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
