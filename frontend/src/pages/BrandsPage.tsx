import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Globe, Key, X } from 'lucide-react';
import { api } from '../services/api';
import type { Brand } from '../types';
import { Badge } from '../components/Badge';

export const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBrands = () => {
    setLoading(true);
    api.getBrands()
      .then(setBrands)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBrand) {
        await api.updateBrand(editingBrand.id, {
          name: formName,
          slug: formSlug,
          description: formDescription,
        });
      } else {
        await api.createBrand({
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: formDescription,
          status: 'active',
        });
      }
      setIsOpen(false);
      fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Failed to save brand.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"? This cascades to all its websites and keywords.`)) return;
    try {
      await api.deleteBrand(id);
      fetchBrands();
    } catch (e) {
      alert('Failed to delete brand.');
    }
  };

  const openAdd = () => {
    setEditingBrand(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setIsOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditingBrand(b);
    setFormName(b.name);
    setFormSlug(b.slug);
    setFormDescription(b.description || '');
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brand Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-tenant business brands, parent corporate accounts, and organizational divisions.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {brands.map((b) => (
          <div key={b.id} className="card-base p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <Badge variant={b.status === 'active' ? 'green' : 'slate'}>
                  {b.status}
                </Badge>
              </div>

              <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
              <div className="text-[11px] text-slate-400 font-mono mb-2">slug: {b.slug}</div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {b.description || 'Enterprise portfolio brand managing target websites and search queries.'}
              </p>

              <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3" /> Websites
                  </div>
                  <div className="font-black text-slate-800 text-base mt-0.5">{b.website_count || 0}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Key className="w-3 h-3" /> Keywords
                  </div>
                  <div className="font-black text-slate-800 text-base mt-0.5">{b.keyword_count || 0}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(b)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                title="Edit Brand"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(b.id, b.name)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                title="Delete Brand"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Brand Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud ERP"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingBrand) {
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="enterprise-cloud-erp"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the brand..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
