import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Globe, Smartphone, Monitor,
  Layers, MapPin, Award
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, Legend
} from 'recharts';
import { api } from '../services/api';
import type {
  DistributionItem, TrendItem, LocationPerformanceItem,
  DevicePerformanceItem, MovementItem, Brand
} from '../types';
import { Badge } from '../components/Badge';

export const AnalyticsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>(undefined);
  const [days, setDays] = useState<number>(30);

  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [locations, setLocations] = useState<LocationPerformanceItem[]>([]);
  const [devices, setDevices] = useState<DevicePerformanceItem[]>([]);
  const [movements, setMovements] = useState<{ biggest_improvements: MovementItem[]; biggest_drops: MovementItem[] }>({
    biggest_improvements: [],
    biggest_drops: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getBrands().then(setBrands).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDistribution(selectedBrand),
      api.getTrends(days, selectedBrand),
      api.getLocations(selectedBrand),
      api.getDevices(selectedBrand),
      api.getMovements(selectedBrand),
    ])
      .then(([dist, tr, loc, dev, mov]) => {
        setDistribution(dist);
        setTrends(tr);
        setLocations(loc);
        setDevices(dev);
        setMovements(mov);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrand, days]);

  const getBarColor = (range: string) => {
    if (range.includes('Top 3')) return '#16A34A';
    if (range.includes('Top 10')) return '#2563EB';
    if (range.includes('Top 20')) return '#0284C7';
    if (range.includes('Top 50')) return '#D97706';
    if (range.includes('Top 100')) return '#EA580C';
    return '#94A3B8';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-600" />
            SEO Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive multi-dimensional keyword analytics across search tiers, geographical markets, and devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 shadow-2xs focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  days === d ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trajectory & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <div className="card-base p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Historical Position Trajectory ({days} Days)</h2>
            <p className="text-xs text-slate-500">Inverted line chart: higher is better rank.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis
                  reversed={true}
                  domain={[1, 'auto']}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`#${val}`, 'Average Position']}
                />
                <Line
                  type="monotone"
                  dataKey="avg_position"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Bar Chart */}
        <div className="card-base p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Ranking Distribution by Tier</h2>
            <p className="text-xs text-slate-500">Keyword counts per SERP tier range.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Location Performance & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Performance Table */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-red-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Geographical Location Performance</h2>
              <p className="text-xs text-slate-500">Keyword rankings comparison by target city/region.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-center">Total Keywords</th>
                  <th className="py-2.5 px-3 text-center">Top 10 Rankings</th>
                  <th className="py-2.5 px-3 text-right">Avg Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {locations.map((loc) => (
                  <tr key={loc.location} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {loc.location}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{loc.total_keywords}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="green">{loc.top_10_count}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      #{loc.avg_position.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Performance Breakdown */}
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-red-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Device Performance</h2>
              <p className="text-xs text-slate-500">Desktop vs Mobile SERP standings.</p>
            </div>
          </div>

          <div className="space-y-4">
            {devices.map((d) => (
              <div key={d.device} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    {d.device.toLowerCase() === 'desktop' ? (
                      <Monitor className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-slate-600" />
                    )}
                    <span>{d.device} Search</span>
                  </div>
                  <Badge variant="blue">{d.total_keywords} Keywords</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Average Rank</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">#{d.avg_position.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Top 10 Footprint</div>
                    <div className="text-base font-black text-emerald-600 mt-0.5">{d.top_10_count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
