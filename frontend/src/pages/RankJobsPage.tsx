import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  PlayCircle, RefreshCw, XCircle, RotateCcw, CheckCircle2,
  AlertTriangle, Clock, Activity, Cpu
} from 'lucide-react';
import { api } from '../services/api';
import type { RankCheckJob } from '../types';
import { Badge } from '../components/Badge';

export const RankJobsPage: React.FC = () => {
  const { onOpenRunJob } = useOutletContext<{ onOpenRunJob: () => void }>();
  const [jobs, setJobs] = useState<RankCheckJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchJobs = () => {
    api.getJobs()
      .then((data) => setJobs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();

    // Auto-poll if any job is currently running or queued
    const interval = setInterval(() => {
      api.getJobs().then((data) => {
        setJobs(data);
      }).catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await api.cancelJob(id);
      fetchJobs();
    } catch (e) {
      alert('Failed to cancel job.');
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await api.retryJob(id);
      fetchJobs();
    } catch (e) {
      alert('Failed to retry job.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="green"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
      case 'running':
        return <Badge variant="blue"><Activity className="w-3 h-3 animate-spin" /> Running</Badge>;
      case 'queued':
        return <Badge variant="slate"><Clock className="w-3 h-3" /> Queued</Badge>;
      case 'failed':
        return <Badge variant="red"><AlertTriangle className="w-3 h-3" /> Failed</Badge>;
      case 'cancelled':
        return <Badge variant="slate"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-red-600" />
            Rank Check Jobs & Background Workers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Asynchronous SERP scraping telemetry, Celery queue status, and real-time execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            title="Refresh Jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
          <button
            onClick={onOpenRunJob}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Run New Job</span>
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Target Website / Scope</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-center">Success / Fail</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">Loading worker queue...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No background rank check jobs executed yet. Click "Run New Job" to trigger a sweep.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => {
                  const pct = j.total_keywords > 0 ? Math.round((j.processed_keywords / j.total_keywords) * 100) : 0;
                  return (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Job ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #{j.id}
                      </td>

                      {/* Scope */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {j.website_domain || (j.brand_name ? `${j.brand_name} (Brand)` : 'All Brands & Websites')}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {j.total_keywords} Keywords Target
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-4 w-48">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                          <span>{j.processed_keywords} / {j.total_keywords}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              j.status === 'completed'
                                ? 'bg-emerald-500'
                                : j.status === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-red-600 animate-pulse'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      {/* Success / Fail */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-emerald-600 font-bold">{j.successful}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-rose-600 font-bold">{j.failed}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(j.status)}
                      </td>

                      {/* Timing */}
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <div>Created: {new Date(j.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        {j.completed_at && (
                          <div className="text-slate-400 font-mono">Done: {new Date(j.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {j.status === 'running' || j.status === 'queued' ? (
                          <button
                            onClick={() => handleCancel(j.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 ml-auto"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        ) : j.status === 'failed' ? (
                          <button
                            onClick={() => handleRetry(j.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retry
                          </button>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
