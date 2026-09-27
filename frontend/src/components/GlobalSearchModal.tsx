import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Layers, Key, ArrowRight, X, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import type { SearchResultItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKeyword?: (id: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectKeyword
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'keyword' && onSelectKeyword) {
      onSelectKeyword(item.id);
    } else if (item.url) {
      navigate(item.url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'brand': return <Layers className="w-4 h-4 text-purple-600" />;
      case 'website': return <Globe className="w-4 h-4 text-blue-600" />;
      case 'landing_page': return <ExternalLink className="w-4 h-4 text-amber-600" />;
      default: return <Key className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-base font-medium"
            placeholder="Search keywords, landing pages, websites, brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded text-slate-400 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-400">Searching SEO database...</div>
          )}

          {!loading && results.length === 0 && query.trim() !== '' && (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching SEO assets found for "<span className="font-semibold text-slate-700">{query}</span>"
            </div>
          )}

          {!loading && results.length === 0 && query.trim() === '' && (
            <div className="p-4 text-xs text-slate-400 text-center">
              Quickly jump to any keyword, domain, brand or landing page in the system.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm">
                      {getIcon(item.type)}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-800 truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-slate-500 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-red-600 font-medium">
                    <span className="capitalize text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{item.type.replace('_', ' ')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
