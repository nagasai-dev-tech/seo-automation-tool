import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, Globe, Monitor, Smartphone,
  TrendingUp, TrendingDown, Minus, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import type { KeywordDetail } from '../types';
import { Badge } from './Badge';

interface KeywordDetailModalProps {
  keywordId: number | null;
  onClose: () => void;
}

export const KeywordDetailModal: React.FC<KeywordDetailModalProps> = ({ keywordId, onClose }) => {
  const [range, setRange] = useState<number>(30);
  const [data, setData] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!keywordId) return;
    setLoading(true);
    api.getKeywordDetail(keywordId, range)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [keywordId, range]);

  if (!keywordId) return null;

  const kw = data?.keyword;
  const currentPos = kw?.current_position;
  const prevPos = kw?.previous_position;
  const change = kw?.position_change || 0;

  // Chart data formatting
  const chartData = (data?.history || []).map((h) => ({
    date: h.date,
    position: h.position && h.position <= 100 ? h.position : null,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{kw?.keyword || 'Keyword Details'}</h2>
              {kw?.device === 'mobile' ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                  <Smartphone className="w-3 h-3" /> Mobile
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                  <Monitor className="w-3 h-3" /> Desktop
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                {kw?.location || 'Global'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{kw?.website_domain}</span>
              <span>•</span>
              <span className="text-slate-500">{kw?.brand_name}</span>
              <span>•</span>
              <a
                href={kw?.target_url || `https://${kw?.website_domain}${kw?.landing_page_url}`}
                target="_blank"
                rel="noreferrer"
                className="text-red-600 hover:underline flex items-center gap-1"
              >
                {kw?.landing_page_url} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading ranking history...</div>
          ) : (
            <>
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Position</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {currentPos && currentPos <= 100 ? `#${currentPos}` : 'Unranked'}
                    </span>
                    {currentPos && currentPos <= 3 && (
                      <Badge variant="green" size="sm">Top 3</Badge>
                    )}
                    {currentPos && currentPos > 3 && currentPos <= 10 && (
                      <Badge variant="blue" size="sm">Top 10</Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Position</div>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-slate-700">
                      {prevPos && prevPos <= 100 ? `#${prevPos}` : 'Unranked'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Position Change</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {change > 0 ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="text-2xl font-bold text-emerald-600">+{change}</span>
                        <span className="text-xs text-emerald-600 font-medium">Improved</span>
                      </>
                    ) : change < 0 ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-rose-600" />
                        <span className="text-2xl font-bold text-rose-600">{change}</span>
                        <span className="text-xs text-rose-600 font-medium">Dropped</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-5 h-5 text-slate-400" />
                        <span className="text-2xl font-bold text-slate-600">0</span>
                        <span className="text-xs text-slate-500 font-medium">Unchanged</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Verified</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {kw?.last_checked ? new Date(kw.last_checked).toLocaleDateString() : 'Today'}
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Historical Ranking Trajectory</h3>
                    <p className="text-xs text-slate-500">Track Google organic ranking changes over time (Rank #1 is top).</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setRange(d)}
                        className={`text-xs font-semibold px-3 py-1 rounded-md transition-all ${
                          range === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis
                          reversed={true}
                          domain={[1, 'auto']}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => `#${val}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(value: any) => [`#${value}`, 'Position']}
                        />
                        <Line
                          type="monotone"
                          dataKey="position"
                          stroke="#dc2626"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#dc2626' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No ranking history points recorded for this window.
                    </div>
                  )}
                </div>
              </div>

              {/* SERP Snippet Preview */}
              {data?.serp_preview && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Google SERP Snippet Preview</h3>
                    <span className="text-xs text-slate-400 font-mono">Position #{data.serp_preview.position || 'N/A'}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 font-sans max-w-2xl">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <span className="truncate">{data.serp_preview.url_found || `https://${kw?.website_domain}${kw?.landing_page_url}`}</span>
                    </div>
                    <div className="text-base font-medium text-blue-700 hover:underline cursor-pointer leading-snug">
                      {data.serp_preview.title || `${kw?.keyword} Solutions | ${kw?.website_domain}`}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {data.serp_preview.snippet || `Official verified ranking page for ${kw?.keyword}. Learn more about expert services on ${kw?.website_domain}.`}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Changes Log */}
              {data?.recent_changes && data.recent_changes.length > 0 && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">Recent Movement Log</h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {data.recent_changes.map((c) => (
                      <div key={c.id} className="px-5 py-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono">{new Date(c.checked_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">
                            #{c.previous_position || 'Unranked'} → #{c.current_position || 'Unranked'}
                          </span>
                          {c.change_type === 'improved' && (
                            <Badge variant="green">+{c.change} Improved</Badge>
                          )}
                          {c.change_type === 'dropped' && (
                            <Badge variant="red">{c.change} Dropped</Badge>
                          )}
                          {c.change_type === 'unchanged' && (
                            <Badge variant="slate">Unchanged</Badge>
                          )}
                          {c.change_type === 'new' && (
                            <Badge variant="blue">New</Badge>
                          )}
                          {c.change_type === 'lost' && (
                            <Badge variant="yellow">Lost</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
