import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Download, Filter, Search, ArrowUpDown, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Smartphone, Monitor
} from 'lucide-react';
import { api } from '../services/api';
import type { RankingOverviewRow, Brand, Website } from '../types';
import { Badge } from '../components/Badge';

export const RankingsPage: React.FC = () => {
  const { onSelectKeyword } = useOutletContext<{ onSelectKeyword: (id: number) => void }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<RankingOverviewRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter options
  const [brands, setBrands] = useState<Brand[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);

  // Selected filters
  const [brandId, setBrandId] = useState<string>(searchParams.get('brand_id') || '');
  const [websiteId, setWebsiteId] = useState<string>(searchParams.get('website_id') || '');
  const [location, setLocation] = useState<string>(searchParams.get('location') || 'all');
  const [device, setDevice] = useState<string>(searchParams.get('device') || 'all');
  const [positionFilter, setPositionFilter] = useState<string>(searchParams.get('position_filter') || 'all');
  const [changeFilter, setChangeFilter] = useState<string>(searchParams.get('change_filter') || 'all');
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>('current_position');
  const [order, setOrder] = useState<string>('asc');

  // Load dropdown options
  useEffect(() => {
    Promise.all([api.getBrands(), api.getWebsites()])
      .then(([b, w]) => {
        setBrands(b);
        setWebsites(w);
      })
      .catch(console.error);
  }, []);

  // Fetch rankings table
  const fetchRankings = () => {
    setLoading(true);
    api.getRankingsOverview({
      brand_id: brandId ? Number(brandId) : undefined,
      website_id: websiteId ? Number(websiteId) : undefined,
      location: location !== 'all' ? location : undefined,
      device: device !== 'all' ? device : undefined,
      position_filter: positionFilter !== 'all' ? positionFilter : undefined,
      change_filter: changeFilter !== 'all' ? changeFilter : undefined,
      search: search.trim() ? search.trim() : undefined,
      sort_by: sortBy,
      order: order,
      page,
      limit: 25,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRankings();
  }, [page, brandId, websiteId, location, device, positionFilter, changeFilter, sortBy, order]);

  // Handle manual search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRankings();
  };

  // Toggle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', brandId);
    if (websiteId) sp.set('website_id', websiteId);
    window.open(`/api/rankings/export/csv?${sp.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rankings Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete Google organic SERP standings, position deltas, and landing page assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => { setPage(1); fetchRankings(); }}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="card-base p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search keyword or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-slate-50/50"
              />
            </form>
          </div>

          {/* Brand Filter */}
          <select
            value={brandId}
            onChange={(e) => { setBrandId(e.target.value); setWebsiteId(''); setPage(1); }}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Website Filter */}
          <select
            value={websiteId}
            onChange={(e) => { setWebsiteId(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Websites</option>
            {websites
              .filter((w) => !brandId || w.brand_id === Number(brandId))
              .map((w) => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
          </select>

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => { setPositionFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Positions</option>
            <option value="top3">Top 3 Positions</option>
            <option value="top10">Top 10 (Page 1)</option>
            <option value="top20">Top 20 Positions</option>
            <option value="top50">Top 50 Positions</option>
            <option value="top100">Top 100 Positions</option>
            <option value="unranked">Unranked (101+)</option>
          </select>

          {/* Change Filter */}
          <select
            value={changeFilter}
            onChange={(e) => { setChangeFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Movements</option>
            <option value="improved">Improved Only (↑)</option>
            <option value="dropped">Dropped Only (↓)</option>
            <option value="unchanged">Unchanged (→)</option>
            <option value="new">New Keywords</option>
            <option value="lost">Lost Rankings</option>
          </select>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Device:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              {['all', 'desktop', 'mobile'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDevice(d); setPage(1); }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition-all ${
                    device === d ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-300">|</div>

          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>Found <strong className="text-slate-800">{total}</strong> ranking keywords</span>
          </div>

          {(brandId || websiteId || positionFilter !== 'all' || changeFilter !== 'all' || device !== 'all' || search) && (
            <button
              onClick={() => {
                setBrandId('');
                setWebsiteId('');
                setPositionFilter('all');
                setChangeFilter('all');
                setDevice('all');
                setSearch('');
                setPage(1);
              }}
              className="ml-auto text-xs text-red-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('keyword')}>
                  <div className="flex items-center gap-1">
                    <span>Keyword</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Landing Page & Website</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Device</th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort('previous_position')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Previous</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort('current_position')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Current</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort('change')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Change</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Trend</th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-800" onClick={() => handleSort('last_checked')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Last Checked</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    Loading SERP rankings...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    No keywords matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const currPos = row.current_position;
                  const prevPos = row.previous_position;
                  const chg = row.change;

                  return (
                    <tr
                      key={row.keyword_id}
                      onClick={() => onSelectKeyword(row.keyword_id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Keyword Title */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          {row.keyword}
                        </div>
                        {row.snippet && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {row.snippet}
                          </div>
                        )}
                      </td>

                      {/* Landing Page & Domain */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{row.domain}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                          {row.landing_page_url}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-600">
                        {row.location}
                      </td>

                      {/* Device */}
                      <td className="py-3 px-4 text-center">
                        {row.device === 'mobile' ? (
                          <span className="inline-flex p-1 rounded bg-slate-100 text-slate-600" title="Mobile">
                            <Smartphone className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1 rounded bg-slate-100 text-slate-600" title="Desktop">
                            <Monitor className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Previous Position */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {prevPos && prevPos <= 100 ? `#${prevPos}` : '—'}
                      </td>

                      {/* Current Position */}
                      <td className="py-3 px-4 text-center">
                        {currPos && currPos <= 3 ? (
                          <Badge variant="green" size="sm">#{currPos}</Badge>
                        ) : currPos && currPos <= 10 ? (
                          <Badge variant="blue" size="sm">#{currPos}</Badge>
                        ) : currPos && currPos <= 100 ? (
                          <span className="font-mono font-bold text-slate-800">#{currPos}</span>
                        ) : (
                          <Badge variant="slate" size="sm">101+ / Not Ranked</Badge>
                        )}
                      </td>

                      {/* Change */}
                      <td className="py-3 px-4 text-center">
                        {row.change_type === 'improved' && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 font-mono">
                            <TrendingUp className="w-3 h-3" />+{chg}
                          </span>
                        )}
                        {row.change_type === 'dropped' && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 font-mono">
                            <TrendingDown className="w-3 h-3" />{chg}
                          </span>
                        )}
                        {row.change_type === 'unchanged' && (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                        {row.change_type === 'new' && (
                          <Badge variant="blue" size="sm">New</Badge>
                        )}
                        {row.change_type === 'lost' && (
                          <Badge variant="red" size="sm">Lost</Badge>
                        )}
                      </td>

                      {/* Trend Symbol */}
                      <td className="py-3 px-4 text-center font-bold text-base">
                        {row.trend === '↑' ? (
                          <span className="text-emerald-600">↑</span>
                        ) : row.trend === '↓' ? (
                          <span className="text-rose-600">↓</span>
                        ) : (
                          <span className="text-slate-300">→</span>
                        )}
                      </td>

                      {/* Last Checked */}
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {row.last_checked ? new Date(row.last_checked).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Showing Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({total} total entries)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">{page}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
