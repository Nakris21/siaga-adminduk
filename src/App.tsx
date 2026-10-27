/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ConsultationView } from './views/ConsultationView';
import { ComplaintFormView } from './views/ComplaintFormView';
import { DashboardView } from './views/DashboardView';
import { AiAnalysisView } from './views/AiAnalysisView';
import { ComplaintListView } from './views/ComplaintListView';
import { ReferencesView } from './views/ReferencesView';
import { LoginView } from './views/LoginView';
import { TechnicalSpecView } from './views/TechnicalSpecView';
import { PublicTicketCheckView } from './views/PublicTicketCheckView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, toast, hideToast, isLoading, isAuthChecking } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex overflow-x-hidden">
      {/* Sidebar Navigation (Responsive: Collapsible on Desktop, Off-canvas Drawer on Tablet/Mobile) */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
      />

      {/* Main Content Area: adjusts left margin to match sidebar state */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Header with Hamburger and Page Context */}
        <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Global Toast Notification (Z-[9999] so it persists visibly across modal closures & redirects) */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-[9999] max-w-sm w-full animate-fade-in pointer-events-none">
            <div
              className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-2.5 text-xs pointer-events-auto backdrop-blur-xs transition-all ${
                toast.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-400 text-emerald-950 font-medium'
                  : toast.type === 'error'
                  ? 'bg-rose-50/95 border-rose-400 text-rose-950 font-medium'
                  : 'bg-blue-50/95 border-blue-400 text-blue-950 font-medium'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1 leading-snug">{toast.text}</div>
              <button
                type="button"
                onClick={() => hideToast()}
                className="text-slate-400 hover:text-slate-700 p-0.5 -mr-1 -mt-0.5 cursor-pointer rounded"
                title="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* View Router */}
        <main className="flex-1 pb-16">
          {isLoading || isAuthChecking ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs text-slate-500 font-medium">Memverifikasi sesi & memuat SIAGA Adminduk...</div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'konsultasi' && <ConsultationView />}
              {activeTab === 'pengaduan' && <ComplaintFormView />}
              {activeTab === 'cek-status' && <PublicTicketCheckView />}
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'analisis-ai' && <AiAnalysisView />}
              {activeTab === 'daftar-pengaduan' && <ComplaintListView />}
              {activeTab === 'referensi' && <ReferencesView />}
              {activeTab === 'login' && <LoginView />}
              {activeTab === 'arsip-teknis' && <TechnicalSpecView />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <div className="font-semibold text-slate-700">
              SIAGA Adminduk · Sistem Informasi Asistensi & Pengaduan Administrasi Kependudukan
            </div>
            <div>
              Dinas Kependudukan dan Pencatatan Sipil Kabupaten Brebes · Acuan PRD/FRD v3.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
