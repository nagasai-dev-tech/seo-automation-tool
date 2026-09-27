import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BellRing, CheckCheck, AlertCircle, AlertTriangle, Info,
  TrendingDown, CheckCircle2, Filter
} from 'lucide-react';
import { api } from '../services/api';
import type { AlertItem } from '../types';
import { Badge } from '../components/Badge';

export const AlertsPage: React.FC = () => {
  const { onSelectKeyword } = useOutletContext<{ onSelectKeyword: (id: number) => void }>();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = () => {
    setLoading(true);
    api.getAlerts({
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      is_read: unreadOnly ? false : undefined,
    })
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, unreadOnly]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      fetchAlerts();
    } catch (e) {
      alert('Failed to mark alert as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      fetchAlerts();
    } catch (e) {
      alert('Failed to mark all as read.');
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-red-600" />
            SERP Volatility & Position Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated notifications for dramatic ranking movements, Top 10 drops, and unranked anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-slate-500" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-base p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Severity:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['all', 'critical', 'warning', 'info'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 rounded-md capitalize font-semibold transition-all ${
                  severityFilter === s ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
          />
          <span className="text-slate-700 font-medium">Unread Only</span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="card-base p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">No Active Alerts</div>
            <p className="mt-1 text-slate-400">All keywords are performing within stable SERP thresholds.</p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`card-base p-4 flex items-start justify-between gap-4 transition-all ${
                !a.is_read ? 'bg-white border-l-4 border-l-red-600 shadow-sm' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 mt-0.5 shrink-0">
                  {getAlertIcon(a.severity)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'yellow' : 'blue'}>
                      {a.severity.toUpperCase()}
                    </Badge>
                    {a.website_domain && (
                      <span className="text-[11px] font-mono text-slate-500">{a.website_domain}</span>
                    )}
                    {a.brand_name && (
                      <span className="text-[11px] text-slate-400">• {a.brand_name}</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">{a.message}</div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                    {a.keyword_text && (
                      <button
                        onClick={() => onSelectKeyword(a.keyword_id)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Inspect "{a.keyword_text}" →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!a.is_read && (
                <button
                  onClick={() => handleMarkRead(a.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
