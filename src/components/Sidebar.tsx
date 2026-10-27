/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveNavTab } from '../types';
import {
  MessageSquareText,
  FileText,
  Search,
  LayoutDashboard,
  Sparkles,
  Inbox,
  BookOpen,
  Layers,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  X,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
}) => {
  const { activeTab, setActiveTab, currentUser, logoutStaff, resetAllData } = useApp();

  const handleNav = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  // Menu items strictly separated according to requirement B
  const publicMenuItems = [
    {
      id: 'konsultasi' as ActiveNavTab,
      label: 'Konsultasi AI',
      icon: <MessageSquareText className="w-5 h-5 shrink-0" />,
      description: 'Asisten tanya jawab regulasi adminduk',
    },
    {
      id: 'pengaduan' as ActiveNavTab,
      label: 'Form Pengaduan',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      description: 'Kirim keluhan & dapatkan nomor tiket',
    },
    {
      id: 'cek-status' as ActiveNavTab,
      label: 'Cek Status Pengaduan',
      icon: <Search className="w-5 h-5 shrink-0" />,
      description: 'Lacak progres tiket pengaduan',
    },
    {
      id: 'arsip-teknis' as ActiveNavTab,
      label: 'Spesifikasi & Status',
      icon: <Layers className="w-5 h-5 shrink-0" />,
      description: 'Informasi sistem & kesiapan teknis',
    },
  ];

  const adminMenuItems = [
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      description: 'Ringkasan metrik & visualisasi data',
    },
    {
      id: 'analisis-ai' as ActiveNavTab,
      label: 'Analisis & Rekomendasi',
      icon: <Sparkles className="w-5 h-5 shrink-0 text-blue-400" />,
      description: 'Pola keluhan, skor prioritas & rekomendasi lokal',
    },
    {
      id: 'daftar-pengaduan' as ActiveNavTab,
      label: 'Manajemen Pengaduan',
      icon: <Inbox className="w-5 h-5 shrink-0" />,
      description: 'Antrean & tindak lanjut laporan warga',
    },
    {
      id: 'referensi' as ActiveNavTab,
      label: 'Manajemen Referensi',
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
      description: 'Kelola dokumen regulasi & standar SOP',
    },
  ];

  const currentMenuItems = currentUser ? adminMenuItems : publicMenuItems;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          /* Mobile behavior */
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } ${
          /* Desktop behavior */
          isDesktopCollapsed ? 'lg:translate-x-0 lg:w-20' : 'lg:translate-x-0 lg:w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Building2 className="w-5 h-5 text-blue-100" />
            </div>

            {/* Show brand text only when expanded on desktop, or always on mobile */}
            <div
              className={`flex flex-col transition-opacity duration-200 ${
                isDesktopCollapsed ? 'lg:hidden' : 'block'
              }`}
            >
              <span className="font-bold text-sm text-white tracking-tight leading-tight whitespace-nowrap">
                SIAGA Adminduk
              </span>
              <span className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">
                {currentUser ? 'Portal Petugas Brebes' : 'Dindukcapil Kab. Brebes'}
              </span>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden cursor-pointer"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse/Expand button for Desktop */}
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isDesktopCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            aria-label={isDesktopCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
          >
            {isDesktopCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Identity Card (Admin Only) */}
        {currentUser && (
          <div
            className={`p-3 border-b border-slate-800 bg-slate-800/40 transition-all ${
              isDesktopCollapsed ? 'lg:p-2 lg:text-center' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-400/30">
                {currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'P'}
              </div>
              <div
                className={`overflow-hidden transition-opacity ${
                  isDesktopCollapsed ? 'lg:hidden' : 'block'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>{currentUser.role} Dindukcapil</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {/* Section Heading */}
          <div
            className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
              isDesktopCollapsed ? 'lg:hidden' : 'block'
            }`}
          >
            {currentUser ? 'Menu Navigasi Admin' : 'Layanan Warga Publik'}
          </div>

          {currentMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isDesktopCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                >
                  {item.icon}
                  <span
                    className={`whitespace-nowrap transition-opacity ${
                      isDesktopCollapsed ? 'lg:hidden' : 'block'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                {/* Floating Tooltip when Desktop Sidebar is Collapsed */}
                {isDesktopCollapsed && (
                  <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {item.description}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 shrink-0 bg-slate-900">
          {currentUser ? (
            <>
              {/* Optional switch to public preview */}
              <div className="relative group">
                <button
                  onClick={() => handleNav('konsultasi')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${
                    isDesktopCollapsed ? 'lg:justify-center lg:px-2' : ''
                  }`}
                  title="Lihat Pratinjau Layanan Publik"
                >
                  <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className={`${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>
                    Buka Portal Publik
                  </span>
                </button>
                {isDesktopCollapsed && (
                  <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                    Buka Portal Publik
                  </div>
                )}
              </div>

              {/* Logout button */}
              <div className="relative group">
                <button
                  onClick={logoutStaff}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors cursor-pointer ${
                    isDesktopCollapsed ? 'lg:justify-center lg:px-2' : ''
                  }`}
                  title="Keluar dari akun petugas"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className={`${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>
                    Logout Petugas
                  </span>
                </button>
                {isDesktopCollapsed && (
                  <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-rose-950 text-rose-200 text-xs rounded-md shadow-xl border border-rose-800 whitespace-nowrap z-50 pointer-events-none">
                    Logout Petugas
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Public user bottom: Login Petugas */
            <div className="relative group">
              <button
                onClick={() => handleNav('login')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700 ${
                  activeTab === 'login' ? 'ring-2 ring-blue-500 text-blue-300' : ''
                } ${isDesktopCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                title="Login Petugas Dindukcapil"
              >
                <LogIn className="w-4 h-4 shrink-0 text-blue-400" />
                <span className={`${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>
                  Login Petugas
                </span>
              </button>
              {isDesktopCollapsed && (
                <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                  Login Petugas / Admin
                </div>
              )}
            </div>
          )}

          {/* Reset Demo Data Button */}
          <div
            className={`pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 ${
              isDesktopCollapsed ? 'lg:hidden' : 'flex'
            }`}
          >
            <span>SIAGA v3.0</span>
            <button
              onClick={() => {
                if (window.confirm('Kembalikan data ke contoh dummy awal?')) {
                  resetAllData();
                }
              }}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset data ke default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
