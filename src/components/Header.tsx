/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveNavTab } from '../types';
import {
  Menu,
  Building2,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Search,
  MessageSquareText,
  FileText,
  LayoutDashboard,
  Sparkles,
  Inbox,
  BookOpen,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeTab, setActiveTab, currentUser, logoutStaff } = useApp();

  const getPageInfo = (tab: ActiveNavTab): { title: string; subtitle: string; icon: React.ReactNode } => {
    switch (tab) {
      case 'konsultasi':
        return {
          title: 'Konsultasi Adminduk AI',
          subtitle: 'Tanya jawab persyaratan dan prosedur dokumen kependudukan',
          icon: <MessageSquareText className="w-5 h-5 text-blue-700" />,
        };
      case 'pengaduan':
        return {
          title: 'Formulir Pengaduan Pelayanan',
          subtitle: 'Pencatatan kendala kependudukan dan penerbitan tiket resmi',
          icon: <FileText className="w-5 h-5 text-blue-700" />,
        };
      case 'cek-status':
        return {
          title: 'Cek Status Pengaduan',
          subtitle: 'Pelacakan tindak lanjut pengaduan melalui nomor tiket',
          icon: <Search className="w-5 h-5 text-blue-700" />,
        };
      case 'dashboard':
        return {
          title: 'Dashboard Penanganan & Analisis',
          subtitle: 'Ringkasan operasional dan visualisasi data pengaduan adminduk',
          icon: <LayoutDashboard className="w-5 h-5 text-blue-700" />,
        };
      case 'analisis-ai':
        return {
          title: 'Analisis Pengaduan Berbantuan AI',
          subtitle: 'Telaah pola keluhan, skor prioritas deterministik, dan rekomendasi kebijakan',
          icon: <Sparkles className="w-5 h-5 text-blue-700" />,
        };
      case 'daftar-pengaduan':
        return {
          title: 'Manajemen Pengaduan Warga',
          subtitle: 'Daftar penanganan, tindak lanjut, dan tanggapan resmi petugas',
          icon: <Inbox className="w-5 h-5 text-blue-700" />,
        };
      case 'referensi':
        return {
          title: 'Manajemen Referensi Dokumen',
          subtitle: 'Kelola regulasi resmi, standar pelayanan, dan SOP sumber AI',
          icon: <BookOpen className="w-5 h-5 text-blue-700" />,
        };
      case 'login':
        return {
          title: 'Login Petugas Dindukcapil',
          subtitle: 'Akses khusus petugas dan administrator Kabupaten Brebes',
          icon: <LogIn className="w-5 h-5 text-blue-700" />,
        };
      case 'arsip-teknis':
        return {
          title: 'Spesifikasi & Status Sistem',
          subtitle: 'Matriks kesiapan teknis, arsitektur, dan keamanan data',
          icon: <Layers className="w-5 h-5 text-blue-700" />,
        };
      default:
        return {
          title: 'SIAGA Adminduk',
          subtitle: 'Sistem Informasi Asistensi dan Pengaduan Adminduk',
          icon: <Building2 className="w-5 h-5 text-blue-700" />,
        };
    }
  };

  const pageInfo = getPageInfo(activeTab);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      {/* Top mini-bar for project context */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium text-slate-100">SIAGA Adminduk v3.0</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">Dindukcapil Kab. Brebes</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {currentUser ? (
            <span className="text-emerald-400 font-medium">Sesi Petugas Aktif</span>
          ) : (
            <span className="text-slate-400">Portal Akses Publik</span>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Mobile Hamburger & Page Header */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2.5 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shrink-0"
            aria-label="Buka navigasi sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden sm:flex p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0">
              {pageInfo.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {pageInfo.title}
              </h1>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right side user / auth actions */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-700 uppercase font-semibold">
                  {currentUser.role} Dindukcapil
                </div>
              </div>
              <button
                onClick={logoutStaff}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Keluar dari akun petugas"
                aria-label="Keluar dari akun petugas"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login Petugas</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
