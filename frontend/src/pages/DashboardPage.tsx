import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Target, Award,
  Globe, Layers, PlayCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
  ChevronRight, BarChart2, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell
} from 'recharts';
import { api } from '../services/api';
import type {
  AnalyticsOverview, DistributionItem, MovementItem,
  TrendItem, Brand, Website, AlertItem
} from '../types';
import { Badge } from '../components/Badge';

export const DashboardPage: React.FC = () => {
  const { onSelectKeyword, onOpenRunJob } = useOutletContext<{
    onSelectKeyword: (id: number) => void;
    onOpenRunJob: () => void;
  }>();
  const navigate = useNavigate();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>(undefined);
  const [selectedWebsite, setSelectedWebsite] = useState<number | undefined>(undefined);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [movements, setMovements] = useState<{ biggest_improvements: MovementItem[]; biggest_drops: MovementItem[] }>({
    biggest_improvements: [],
    biggest_drops: []
  });
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial dropdown options
  useEffect(() => {
    Promise.all([api.getBrands(), api.getWebsites()])
      .then(([b, w]) => {
        setBrands(b);
        setWebsites(w);
      })
      .catch(console.error);
  }, []);

  // Load dashboard metrics when filters change
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAnalyticsOverview(selectedBrand, selectedWebsite),
      api.getDistribution(selectedBrand, selectedWebsite),
      api.getMovements(selectedBrand, selectedWebsite),
      api.getTrends(30, selectedBrand, selectedWebsite),
      api.getAlerts({ is_read: false, brand_id: selectedBrand }),
    ])
      .then(([ov, dist, mov, tr, al]) => {
        setOverview(ov);
        setDistribution(dist);
        setMovements(mov);
        setTrends(tr);
        setAlerts(al);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrand, selectedWebsite]);

  // Color map for distribution bar chart
  const getBarColor = (range: string) => {
    if (range.includes('Top 3')) return '#16A34A'; // emerald
    if (range.includes('Top 10')) return '#2563EB'; // blue
    if (range.includes('Top 20')) return '#0284C7'; // sky
    if (range.includes('Top 50')) return '#D97706'; // amber
    if (range.includes('Top 100')) return '#EA580C'; // orange
    return '#94A3B8'; // gray
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Scope Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Executive SEO Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
              Live Tracker
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time keyword positioning, SERP volatility, and multi-brand rank telemetry.
          </p>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Selector */}
          <select
            value={selectedBrand || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setSelectedBrand(val);
              setSelectedWebsite(undefined);
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">All Brands (Multi-Tenant)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Website Selector */}
          <select
            value={selectedWebsite || ''}
            onChange={(e) => setSelectedWebsite(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="">All Websites</option>
            {websites
              .filter((w) => !selectedBrand || w.brand_id === selectedBrand)
              .map((w) => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
          </select>

          {/* Run Rank Check CTA */}
          <button
            onClick={onOpenRunJob}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Check Now</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Keywords */}
        <div className="card-base p-3.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Keywords</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overview?.total_keywords ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Configured pool</div>
        </div>

        {/* Tracked In Top 100 */}
        <div className="card-base p-3.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracked (Top 100)</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {overview?.tracked_keywords ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active on SERP</div>
        </div>

        {/* Top 3 */}
        <div className="card-base p-3.5 bg-emerald-50/40 border-emerald-200/60">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Google Top 3</div>
          <div className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-1">
            {overview?.top_3 ?? '—'}
            <Award className="w-3.5 h-3.5 text-emerald-600 inline" />
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">High conversion</div>
        </div>

        {/* Top 10 */}
        <div className="card-base p-3.5 bg-blue-50/40 border-blue-200/60">
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Google Top 10</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {overview?.top_10 ?? '—'}
          </div>
          <div className="text-[10px] text-blue-600 mt-1">Page 1 dominance</div>
        </div>

        {/* Top 20 */}
        <div className="card-base p-3.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top 20</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {overview?.top_20 ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Striking distance</div>
        </div>

        {/* Improved */}
        <div className="card-base p-3.5 bg-emerald-50/40 border-emerald-200/60">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Improved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center">
            +{overview?.improved ?? '0'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Positive delta
          </div>
        </div>

        {/* Dropped */}
        <div className="card-base p-3.5 bg-rose-50/40 border-rose-200/60">
          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Dropped</div>
          <div className="text-2xl font-black text-rose-600 mt-1 flex items-center">
            -{overview?.dropped ?? '0'}
          </div>
          <div className="text-[10px] text-rose-700 mt-1 flex items-center gap-0.5">
            <ArrowDownRight className="w-3 h-3" /> Downward delta
          </div>
        </div>

        {/* Average Position */}
        <div className="card-base p-3.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Position</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            #{overview?.average_position?.toFixed(1) ?? '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across all assets</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart: 30-Day Historical Movement */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                30-Day Position & Top 10 Trajectory
              </h2>
              <p className="text-xs text-slate-500">
                Daily aggregate performance and Top 10 rankings footprint over time.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Avg Position (Inverted)
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Top 10 Count
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  {/* Left Y-axis for inverted average position */}
                  <YAxis
                    yAxisId="left"
                    reversed={true}
                    domain={[1, 'auto']}
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `#${v}`}
                  />
                  {/* Right Y-axis for Top 10 volume */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'avg_position' ? `#${value}` : value,
                      name === 'avg_position' ? 'Avg Rank' : 'Top 10 Keywords'
                    ]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avg_position"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="top_10_count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading ranking trajectory telemetry...
              </div>
            )}
          </div>
        </div>

        {/* Ranking Distribution Breakdown */}
        <div className="card-base p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-700" />
              Ranking Distribution
            </h2>
            <p className="text-xs text-slate-500">Tier volume across organic positions.</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis dataKey="range" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} Keywords`, 'Volume']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Distribution Summary Table */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-500 font-semibold">Top 3</div>
              <div className="text-sm font-black text-emerald-600">{overview?.top_3 || 0}</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-500 font-semibold">Top 10</div>
              <div className="text-sm font-black text-blue-600">{overview?.top_10 || 0}</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-500 font-semibold">Top 20</div>
              <div className="text-sm font-black text-slate-800">{overview?.top_20 || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Movements & Volatility Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Improvements */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Biggest Improvements</h3>
                <p className="text-xs text-slate-500">Keywords with highest rank ascensions.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/rankings?change_filter=improved')}
              className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {movements.biggest_improvements.slice(0, 5).map((m) => (
              <div
                key={m.keyword_id}
                onClick={() => onSelectKeyword(m.keyword_id)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-bold text-slate-800 truncate">{m.keyword}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{m.domain}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 font-mono">
                    #{m.previous_position || 'Unranked'} → <strong className="text-slate-800">#{m.current_position}</strong>
                  </span>
                  <Badge variant="green">+{m.change}</Badge>
                </div>
              </div>
            ))}
            {movements.biggest_improvements.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">No improvements recorded recently.</div>
            )}
          </div>
        </div>

        {/* Top Drops */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Biggest Drops</h3>
                <p className="text-xs text-slate-500">Keywords suffering downward volatility.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/rankings?change_filter=dropped')}
              className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {movements.biggest_drops.slice(0, 5).map((m) => (
              <div
                key={m.keyword_id}
                onClick={() => onSelectKeyword(m.keyword_id)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-bold text-slate-800 truncate">{m.keyword}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{m.domain}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 font-mono">
                    #{m.previous_position || 'Unranked'} → <strong className="text-slate-800">#{m.current_position || 'Lost'}</strong>
                  </span>
                  <Badge variant="red">{m.change}</Badge>
                </div>
              </div>
            ))}
            {movements.biggest_drops.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">No drops recorded recently.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts Alert Box */}
      {alerts.length > 0 && (
        <div className="card-base p-5 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Active SERP Volatility Alerts ({alerts.length} Unresolved)
              </h3>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              Review all alerts →
            </button>
          </div>

          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      a.severity === 'critical' ? 'bg-rose-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-semibold text-slate-800 truncate">{a.message}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0 pl-2">
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
