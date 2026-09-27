import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { KeywordDetailModal } from '../components/KeywordDetailModal';
import { RunJobModal } from '../components/RunJobModal';
import { api } from '../services/api';
import type { Website, Brand } from '../types';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const [isRunJobOpen, setIsRunJobOpen] = useState<boolean>(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    Promise.all([api.getWebsites(), api.getBrands()])
      .then(([w, b]) => {
        setWebsites(w);
        setBrands(b);
      })
      .catch((err) => console.error('Failed to load initial layout data', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectKeyword={(id) => setSelectedKeywordId(id)}
          onOpenRunJob={() => setIsRunJobOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onSelectKeyword: setSelectedKeywordId, onOpenRunJob: () => setIsRunJobOpen(true) }} />
        </main>
      </div>

      {/* Global Modals */}
      <KeywordDetailModal
        keywordId={selectedKeywordId}
        onClose={() => setSelectedKeywordId(null)}
      />

      <RunJobModal
        isOpen={isRunJobOpen}
        onClose={() => setIsRunJobOpen(false)}
        websites={websites}
        brands={brands}
        onJobStarted={() => {
          // Toast or redirect handled gracefully
          alert('Rank check job started! Check the "Rank Jobs" page for real-time progress.');
        }}
      />
    </div>
  );
};
