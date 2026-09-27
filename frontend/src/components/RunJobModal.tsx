import React, { useState } from 'react';
import { PlayCircle, X, Globe, Layers } from 'lucide-react';
import { api } from '../services/api';
import type { Website, Brand } from '../types';

interface RunJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  websites: Website[];
  brands: Brand[];
  onJobStarted: (jobId: number) => void;
}

export const RunJobModal: React.FC<RunJobModalProps> = ({
  isOpen,
  onClose,
  websites,
  brands,
  onJobStarted
}) => {
  const [scope, setScope] = useState<'all' | 'website' | 'brand'>('all');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(websites[0]?.id || 0);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 0);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    setLoading(true);
    try {
      const payload: { website_id?: number | null; brand_id?: number | null } = {};
      if (scope === 'website') {
        payload.website_id = selectedWebsiteId;
      } else if (scope === 'brand') {
        payload.brand_id = selectedBrandId;
      }
      const job = await api.runJob(payload);
      onJobStarted(job.id);
      onClose();
    } catch (e) {
      console.error('Failed to trigger job', e);
      alert('Failed to trigger rank check job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900">Run Rank Check Now</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Dispatch an asynchronous rank tracking sweep. Celery workers will execute SERP checks, compute ranking changes, update history, and record alerts.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Execution Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  scope === 'all'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Brands (Full)
              </button>
              <button
                type="button"
                onClick={() => setScope('brand')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  scope === 'brand'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Specific Brand
              </button>
              <button
                type="button"
                onClick={() => setScope('website')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  scope === 'website'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Specific Website
              </button>
            </div>
          </div>

          {scope === 'brand' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Brand
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'website' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Target Website
              </label>
              <select
                value={selectedWebsiteId}
                onChange={(e) => setSelectedWebsiteId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.domain} ({w.name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? 'Starting Check...' : 'Start Rank Check'}
          </button>
        </div>
      </div>
    </div>
  );
};
