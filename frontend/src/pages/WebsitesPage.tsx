import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Plus, PlayCircle, ExternalLink, TrendingUp, TrendingDown,
  Trash2, Edit2, Layers, CheckCircle2, X
} from 'lucide-react';
import { api } from '../services/api';
import type { Website, Brand } from '../types';
import { Badge } from '../components/Badge';

export const WebsitesPage: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Website | null>(null);
  const [formDomain, setFormDomain] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrandId, setFormBrandId] = useState<number>(0);
  const [formCountry, setFormCountry] = useState('Global');
  const [formSaving, setFormSaving] = useState(false);

  const fetchWebsites = () => {
    setLoading(true);
    api.getWebsites()
      .then((data) => setWebsites(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWebsites();
    api.getBrands().then((b) => {
      setBrands(b);
      if (b.length > 0) setFormBrandId(b[0].id);
    });
  }, []);

  const handleRunCheck = async (websiteId: number, domain: string) => {
    try {
      await api.checkWebsiteRankings(websiteId);
      alert(`Rank check initiated for ${domain}! You can view the live progress on the Rank Jobs page.`);
    } catch (e: any) {
      alert(e.message || 'Failed to trigger rank check.');
    }
  };

  const handleDelete = async (id: number, domain: string) => {
    if (!confirm(`Are you sure you want to delete ${domain}? All associated keywords and ranking history will be removed.`)) return;
    try {
      await api.deleteWebsite(id);
      fetchWebsites();
    } catch (e) {
      alert('Failed to delete website.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      if (editingSite) {
        await api.updateWebsite(editingSite.id, {
          domain: formDomain,
          name: formName,
          brand_id: formBrandId,
          country: formCountry,
        });
      } else {
        await api.createWebsite({
          domain: formDomain,
          name: formName,
          brand_id: formBrandId,
          country: formCountry,
          status: 'active',
        });
      }
      setIsModalOpen(false);
      fetchWebsites();
    } catch (err: any) {
      alert(err.message || 'Failed to save website.');
    } finally {
      setFormSaving(false);
    }
  };

  const openAdd = () => {
    setEditingSite(null);
    setFormDomain('');
    setFormName('');
    if (brands.length > 0) setFormBrandId(brands[0].id);
    setFormCountry('Global');
    setIsModalOpen(true);
  };

  const openEdit = (site: Website) => {
    setEditingSite(site);
    setFormDomain(site.domain);
    setFormName(site.name);
    setFormBrandId(site.brand_id);
    setFormCountry(site.country);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Website Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Domains tracked by the platform with aggregate SEO rankings, Top 10 footprint, and check history.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Website</span>
        </button>
      </div>

      {/* Website Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {websites.map((w) => (
          <div key={w.id} className="card-base p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {w.brand_name || 'Brand'}
                </span>
                <span className={`w-2 h-2 rounded-full ${w.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm truncate">{w.name}</h3>
              </div>
              <div className="text-xs text-slate-500 font-mono truncate mb-4">{w.domain}</div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Keywords</div>
                  <div className="font-black text-slate-800 text-base">{w.keyword_count || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Avg Rank</div>
                  <div className="font-black text-slate-800 text-base">
                    {w.avg_position ? `#${w.avg_position.toFixed(1)}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Top 10</div>
                  <div className="font-black text-emerald-600 text-base">{w.top_10_count || 0}</div>
                </div>
              </div>

              {/* Delta Movement Row */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> +{w.improved_count || 0}
                </div>
                <div className="flex items-center gap-1 text-rose-600 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> -{w.dropped_count || 0}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {w.last_checked ? new Date(w.last_checked).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleRunCheck(w.id, w.domain)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Run SEO Rank Check Now"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Run Check
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/rankings?website_id=${w.id}`)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  title="View Rankings"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(w)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  title="Edit Website"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(w.id, w.domain)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  title="Delete Website"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Website Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">
                {editingSite ? 'Edit Website' : 'Add New Website'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Domain (e.g. example.com) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="domain.com"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Corporate Portal"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign to Brand *
                  </label>
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Target Country
                  </label>
                  <input
                    type="text"
                    placeholder="United States, India, Global..."
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {formSaving ? 'Saving...' : editingSite ? 'Save Changes' : 'Create Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
