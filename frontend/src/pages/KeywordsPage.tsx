import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus, Upload, Download, Search, Trash2, Edit2, Play, Pause,
  Smartphone, Monitor, Globe, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { api } from '../services/api';
import type { Keyword, Website, Brand } from '../types';
import { CSVImportModal } from '../components/CSVImportModal';
import { Badge } from '../components/Badge';

export const KeywordsPage: React.FC = () => {
  const { onSelectKeyword } = useOutletContext<{ onSelectKeyword: (id: number) => void }>();

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);

  // Add/Edit form state
  const [formKeyword, setFormKeyword] = useState('');
  const [formLandingPage, setFormLandingPage] = useState('/');
  const [formWebsiteId, setFormWebsiteId] = useState<number>(0);
  const [formLocation, setFormLocation] = useState('Global');
  const [formCountry, setFormCountry] = useState('Global');
  const [formDevice, setFormDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [formSaving, setFormSaving] = useState(false);

  const fetchKeywords = () => {
    setLoading(true);
    api.getKeywords({
      brand_id: selectedBrand ? Number(selectedBrand) : undefined,
      website_id: selectedWebsite ? Number(selectedWebsite) : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: search.trim() || undefined,
      limit: 100,
    })
      .then((kws) => setKeywords(kws))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([api.getWebsites(), api.getBrands()])
      .then(([w, b]) => {
        setWebsites(w);
        setBrands(b);
        if (w.length > 0) setFormWebsiteId(w[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [selectedBrand, selectedWebsite, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeywords();
  };

  const handleToggleStatus = async (kw: Keyword) => {
    const newStatus = kw.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateKeyword(kw.id, { status: newStatus });
      fetchKeywords();
    } catch (e) {
      alert('Failed to update status.');
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    if (!confirm('Are you sure you want to delete this keyword and all its ranking history?')) return;
    try {
      await api.deleteKeyword(id);
      fetchKeywords();
    } catch (e) {
      alert('Failed to delete keyword.');
    }
  };

  const handleSaveKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      if (editingKeyword) {
        await api.updateKeyword(editingKeyword.id, {
          keyword: formKeyword,
          landing_page_url: formLandingPage,
          website_id: formWebsiteId,
          location: formLocation,
          country: formCountry,
          device: formDevice,
        });
      } else {
        await api.createKeyword({
          keyword: formKeyword,
          landing_page_url: formLandingPage,
          website_id: formWebsiteId,
          location: formLocation,
          country: formCountry,
          device: formDevice,
          status: 'active',
        });
      }
      setIsAddOpen(false);
      setEditingKeyword(null);
      fetchKeywords();
    } catch (err: any) {
      alert(err.message || 'Failed to save keyword.');
    } finally {
      setFormSaving(false);
    }
  };

  const openEditModal = (kw: Keyword) => {
    setEditingKeyword(kw);
    setFormKeyword(kw.keyword);
    setFormLandingPage(kw.landing_page_url);
    setFormWebsiteId(kw.website_id);
    setFormLocation(kw.location);
    setFormCountry(kw.country);
    setFormDevice(kw.device);
    setIsAddOpen(true);
  };

  const openAddModal = () => {
    setEditingKeyword(null);
    setFormKeyword('');
    setFormLandingPage('/');
    if (websites.length > 0) setFormWebsiteId(websites[0].id);
    setFormLocation('Global');
    setFormCountry('Global');
    setFormDevice('desktop');
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Keyword Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure target keywords, landing page URL mappings, bulk CSV imports, and tracking status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>
          <a
            href="/api/keywords/export/csv"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Keyword</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-base p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search keywords or URLs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-slate-50/50"
              />
            </form>
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedWebsite(''); }}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Websites</option>
            {websites
              .filter((w) => !selectedBrand || w.brand_id === Number(selectedBrand))
              .map((w) => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Tracking)</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Keyword</th>
                <th className="py-3 px-4">Website & Landing Page</th>
                <th className="py-3 px-4">Target Location</th>
                <th className="py-3 px-4 text-center">Device</th>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">Loading keywords...</td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No keywords found. Click "Add Keyword" or "Import CSV" to begin tracking.
                  </td>
                </tr>
              ) : (
                keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectKeyword(kw.id)}
                        className="font-bold text-slate-900 hover:text-red-600 text-left transition-colors"
                      >
                        {kw.keyword}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{kw.website_domain}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{kw.landing_page_url}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {kw.location}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {kw.device === 'mobile' ? (
                        <span className="inline-flex p-1 rounded bg-slate-100 text-slate-600" title="Mobile">
                          <Smartphone className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex p-1 rounded bg-slate-100 text-slate-600" title="Desktop">
                          <Monitor className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {kw.current_position && kw.current_position <= 3 ? (
                        <Badge variant="green" size="sm">#{kw.current_position}</Badge>
                      ) : kw.current_position && kw.current_position <= 10 ? (
                        <Badge variant="blue" size="sm">#{kw.current_position}</Badge>
                      ) : kw.current_position && kw.current_position <= 100 ? (
                        <span className="text-slate-800">#{kw.current_position}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unranked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(kw)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          kw.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title="Click to toggle active/pause"
                      >
                        {kw.status === 'active' ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(kw)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Edit Keyword"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKeyword(kw.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Keyword"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Bulk Import Modal */}
      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        websites={websites}
        onSuccess={fetchKeywords}
      />

      {/* Add / Edit Keyword Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">
                {editingKeyword ? 'Edit Keyword' : 'Add New Keyword'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKeyword}>
              <div className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Keyword Query *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sap consulting services"
                    value={formKeyword}
                    onChange={(e) => setFormKeyword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Website *
                  </label>
                  <select
                    value={formWebsiteId}
                    onChange={(e) => setFormWebsiteId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
                  >
                    {websites.map((w) => (
                      <option key={w.id} value={w.id}>{w.domain} ({w.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Landing Page Path *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /solutions/sap"
                    value={formLandingPage}
                    onChange={(e) => setFormLandingPage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New York or Global"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Target Device
                    </label>
                    <select
                      value={formDevice}
                      onChange={(e) => setFormDevice(e.target.value as 'desktop' | 'mobile')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
                    >
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {formSaving ? 'Saving...' : editingKeyword ? 'Save Changes' : 'Add Keyword'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
