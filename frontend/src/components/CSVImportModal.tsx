import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { api } from '../services/api';
import type { Website } from '../types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  websites: Website[];
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  websites,
  onSuccess
}) => {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number>(websites[0]?.id || 0);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    duplicate_rows: number;
    imported_count: number;
    errors: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedWebsiteId) {
      setErrorMsg('Please select a target website and a valid CSV file.');
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    try {
      const res = await api.importKeywordsCSV(selectedWebsiteId, file);
      setResult(res);
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to import CSV.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,keyword,landing_page,location,country,language,device\nsap consulting services,/solutions/sap,New York,United States,en,desktop\nenterprise cloud erp,/products/erp,London,United Kingdom,en,mobile\ncloud accounting saas,/features/accounting,Hyderabad,India,en,desktop";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "avention_keywords_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900">Bulk Import Keywords</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target Website selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assign to Target Website
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

          {/* Format info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Required CSV Header:</span>
              <button
                onClick={downloadSampleCSV}
                className="text-red-600 hover:underline flex items-center gap-1 font-medium"
              >
                <Download className="w-3 h-3" /> Sample CSV
              </button>
            </div>
            <code className="block p-1.5 bg-slate-100 rounded text-slate-800 font-mono text-[11px] overflow-x-auto">
              keyword,landing_page,location,country,language,device
            </code>
          </div>

          {/* File input */}
          <div className="border-2 border-dashed border-slate-200 hover:border-red-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'Click to select CSV file'}
              </div>
              <div className="text-xs text-slate-400 mt-1">UTF-8 or standard CSV up to 10MB</div>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Result Summary */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Import Validation & Results
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-slate-400 font-medium">Total</div>
                  <div className="font-bold text-slate-800 text-base">{result.total_rows}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-emerald-600 font-medium">Imported</div>
                  <div className="font-bold text-emerald-700 text-base">{result.imported_count}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-amber-600 font-medium">Duplicates</div>
                  <div className="font-bold text-amber-700 text-base">{result.duplicate_rows}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-rose-600 font-medium">Invalid</div>
                  <div className="font-bold text-rose-700 text-base">{result.invalid_rows}</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-rose-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {uploading ? 'Validating & Importing...' : 'Import Keywords'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
