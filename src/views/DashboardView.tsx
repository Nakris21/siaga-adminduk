/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  computeDashboardMetrics,
  computeCategoryDistribution,
  computeTrendData,
  filterComplaintsByPeriod,
  PeriodFilter,
} from '../logic/analytics';
import { generateLocalRecommendations } from '../logic/recommendations';
import { calculateFrequencyValue } from '../logic/scoring';
import {
  filterComplaintsByCustomDateRange,
  exportComplaintsToExcel,
  exportRecommendationToDocx,
  formatIndonesianDate,
} from '../lib/exportService';
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Filter,
  Eye,
  Lock,
  Search,
  Check,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Calendar,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { complaints, setActiveTab, setSelectedComplaintId, currentUser } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Export date range state (Defaults to last 30 days)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [exportStartDate, setExportStartDate] = useState<string>(defaultStartDate);
  const [exportEndDate, setExportEndDate] = useState<string>(defaultEndDate);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Filter complaints based on the selected period for the visual charts
  const filteredComplaints = filterComplaintsByPeriod(complaints, selectedPeriod);

  // Filter complaints strictly based on the custom date range for the file exports
  const exportFilteredComplaints = filterComplaintsByCustomDateRange(
    complaints,
    exportStartDate,
    exportEndDate
  );

  const exportStatusCounts = {
    baru: exportFilteredComplaints.filter((c) => c.status === 'baru').length,
    diproses: exportFilteredComplaints.filter((c) => c.status === 'diproses').length,
    selesai: exportFilteredComplaints.filter((c) => c.status === 'selesai').length,
  };

  const handleExportExcel = () => {
    if (exportFilteredComplaints.length === 0) {
      setExportFeedback({
        type: 'warning',
        message:
          'Tidak ada data pengaduan pada periode tanggal yang dipilih. Ubah tanggal mulai atau akhir untuk mengunduh rekap Excel.',
      });
      return;
    }

    try {
      setIsExportingExcel(true);
      exportComplaintsToExcel(exportFilteredComplaints, exportStartDate, exportEndDate);
      setExportFeedback({
        type: 'success',
        message: `Rekap pengaduan (.xlsx) berhasil diunduh (${exportFilteredComplaints.length} data pengaduan).`,
      });
    } catch (err: any) {
      setExportFeedback({
        type: 'error',
        message: `Gagal mengunduh Excel: ${err?.message || 'Terjadi kendala sistem'}`,
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportDocx = async () => {
    if (exportFilteredComplaints.length === 0) {
      setExportFeedback({
        type: 'warning',
        message:
          'Tidak ada data pengaduan pada periode tanggal yang dipilih. Ubah tanggal mulai atau akhir untuk menyusun laporan rekomendasi pimpinan.',
      });
      return;
    }

    try {
      setIsExportingDocx(true);
      await exportRecommendationToDocx(exportFilteredComplaints, exportStartDate, exportEndDate);
      setExportFeedback({
        type: 'success',
        message: `Laporan rekomendasi untuk pimpinan (.docx) berhasil disusun dan diunduh (${exportFilteredComplaints.length} data laporan).`,
      });
    } catch (err: any) {
      setExportFeedback({
        type: 'error',
        message: `Gagal menyusun dokumen Word: ${err?.message || 'Terjadi kendala sistem'}`,
      });
    } finally {
      setIsExportingDocx(false);
    }
  };

  const setPresetDateRange = (preset: 'today' | '7d' | '30d' | 'this_month' | 'this_year' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setExportStartDate(todayStr);
      setExportEndDate(todayStr);
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setExportStartDate(d.toISOString().split('T')[0]);
      setExportEndDate(todayStr);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setExportStartDate(d.toISOString().split('T')[0]);
      setExportEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setExportStartDate(firstDay.toISOString().split('T')[0]);
      setExportEndDate(todayStr);
    } else if (preset === 'this_year') {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setExportStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setExportEndDate(todayStr);
    } else if (preset === 'all') {
      setExportStartDate('2020-01-01');
      setExportEndDate(todayStr);
    }
    setExportFeedback(null);
  };

  const metrics = computeDashboardMetrics(filteredComplaints);
  const categoryStats = computeCategoryDistribution(filteredComplaints);
  const trendData = computeTrendData(filteredComplaints, selectedPeriod);

  const periodLabels: Record<PeriodFilter, string> = {
    '7d': '7 Hari Terakhir',
    '30d': '30 Hari Terakhir (Bulanan)',
    '90d': '90 Hari Terakhir (Triwulanan)',
    all: 'Semua Periode',
  };

  const localRecommendationsSummary = generateLocalRecommendations(
    filteredComplaints,
    periodLabels[selectedPeriod]
  );

  // Complaints with high priority (score >= 75), ordered by priority score descending
  const highPriorityComplaints = [...filteredComplaints]
    .filter((c) => c.priority_level === 'tinggi')
    .sort((a, b) => b.priority_score - a.priority_score);

  // Fallback to top scored if no items >= 75
  const displayedPrioritizedComplaints =
    highPriorityComplaints.length > 0
      ? highPriorityComplaints
      : [...filteredComplaints].sort((a, b) => b.priority_score - a.priority_score).slice(0, 5);

  const handleRowClick = (id: string) => {
    setSelectedComplaintId(id);
    setActiveTab('daftar-pengaduan');
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard Analisis Internal Petugas
            </h1>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Metrik evaluasi layanan, formula prioritas, dan agregat pengaduan merupakan area kerja internal petugas Dindukcapil.
              <br /><br />
              Warga publik dapat melakukan pengecekan status tiket pengaduan secara mandiri melalui menu <strong>Cek Status Pengaduan</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setActiveTab('cek-status')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Cek Status Pengaduan Saya</span>
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Login Petugas / Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Period Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Penanganan & Analisis Pengaduan
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Metrik berbasis data aktual database, rumus skor prioritas deterministik, dan rekomendasi tindak lanjut otomatis.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Periode:</span>
          </span>
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedPeriod === p
                  ? 'bg-blue-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari (Bulan)' : p === '90d' ? 'Triwulan' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards (FR-10 & Final) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Pengaduan</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
          <div className="text-[11px] text-slate-400">Periode: {periodLabels[selectedPeriod]}</div>
        </div>

        <div className="bg-white border border-blue-200 bg-blue-50/20 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>Baru (Belum Diproses)</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{metrics.baru}</div>
          <div className="text-[11px] text-blue-600">Perlu telaah petugas</div>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span>Sedang Diproses</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{metrics.diproses}</div>
          <div className="text-[11px] text-amber-600">Dalam tindak lanjut</div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span>Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{metrics.selesai}</div>
          <div className="text-[11px] text-emerald-600">Tanggapan terkirim</div>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 space-y-1 col-span-2 sm:col-span-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700">
            <span>Prioritas Tinggi</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">{metrics.prioritasTinggi}</div>
          <div className="text-[11px] text-rose-600 font-medium">Skor rumus &ge; 75</div>
        </div>
      </div>

      {/* Unduh Laporan & Rekapitulasi Pengaduan (Item 1, 2, 3: Filter Periode, Excel .xlsx, Word .docx) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Download className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Unduh Laporan & Rekapitulasi Pengaduan
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Khusus Petugas
              </span>
            </div>
            <p className="text-xs text-slate-600 pl-8">
              Pilih tanggal mulai dan tanggal akhir sebagai dasar pengambilan data untuk mengunduh rekap spreadsheet dan dokumen telaah pimpinan.
            </p>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1 sm:self-center pl-8 sm:pl-0">
            <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Preset:</span>
            </span>
            <button
              type="button"
              onClick={() => setPresetDateRange('7d')}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPresetDateRange('30d')}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPresetDateRange('this_month')}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPresetDateRange('this_year')}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Tahun Ini
            </button>
            <button
              type="button"
              onClick={() => setPresetDateRange('all')}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Semua Data
            </button>
          </div>
        </div>

        {/* Date Filter Inputs & Realtime Match Count */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => {
                setExportStartDate(e.target.value);
                setExportFeedback(null);
              }}
              className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => {
                setExportEndDate(e.target.value);
                setExportFeedback(null);
              }}
              className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Real-time Match Indicator */}
          <div className="md:col-span-6 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Data Sesuai Periode:
              </span>
              <span className="font-bold text-blue-900 font-mono text-sm">
                {exportFilteredComplaints.length} Laporan
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                Baru: {exportStatusCounts.baru}
              </span>
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                Diproses: {exportStatusCounts.diproses}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                Selesai: {exportStatusCounts.selesai}
              </span>
              <span className="text-slate-400 font-mono text-[10px] ml-auto">
                {formatIndonesianDate(exportStartDate)} s.d. {formatIndonesianDate(exportEndDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alert if any */}
        {exportFeedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
              exportFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : exportFeedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {exportFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{exportFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportFeedback(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Action Buttons: Excel (.xlsx) and Word (.docx) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Button 1: Excel .xlsx */}
          <div className="border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-4 transition-colors flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold">Rekap Pengaduan (.xlsx)</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Format spreadsheet resmi memuat: Tanggal Pengaduan, Nama Pelapor, Uraian Pengaduan, Respons Petugas, Tanggal Selesai, Status, dan Durasi Penyelesaian.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel || exportFilteredComplaints.length === 0}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                exportFilteredComplaints.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap Pengaduan (.xlsx)</span>
                </>
              )}
            </button>
          </div>

          {/* Button 2: Word .docx */}
          <div className="border border-blue-200 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-4 transition-colors flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-900">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold">Laporan Rekomendasi untuk Pimpinan (.docx)</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Naskah dinas formal untuk Kepala Dinas memuat resume kategori, rekap status, pola masalah berulang, skor prioritas, dan saran tindak lanjut perbaikan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportDocx}
              disabled={isExportingDocx || exportFilteredComplaints.length === 0}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                exportFilteredComplaints.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {isExportingDocx ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyusun Dokumen Word...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Laporan Rekomendasi (.docx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Structured Automatic Recommendations (Item 4: Masalah, Data Pendukung, Alasan, Saran Perbaikan) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div
          onClick={() => setShowRecommendations(!showRecommendations)}
          className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Rekomendasi Tindak Lanjut Otomatis (Lokal Database)
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {localRecommendationsSummary.recommendations.length} Isu Prioritas
              </span>
            </div>
            <h2 className="text-base font-bold text-white">
              Telaah Pola & Solusi Perbaikan Layanan ({periodLabels[selectedPeriod]})
            </h2>
          </div>
          <button className="text-slate-400 hover:text-white p-1">
            {showRecommendations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showRecommendations && (
          <div className="p-5 space-y-4 bg-slate-50/60 border-t border-slate-200">
            {localRecommendationsSummary.recommendations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Belum ada data pengaduan pada periode {periodLabels[selectedPeriod]} untuk menghasilkan rekomendasi.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localRecommendationsSummary.recommendations.map((rec) => {
                  const isHigh = rec.tingkatUrgensi === 'Tinggi';
                  return (
                    <div
                      key={rec.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-blue-300 transition-colors"
                    >
                      {/* Header with Title and Urgency Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">
                            {rec.kategori}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">{rec.masalah}</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Urgensi: {rec.tingkatUrgensi}
                        </span>
                      </div>

                      {/* 1. Data Pendukung (Concrete count, zero hallucination) */}
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wide text-slate-500">
                          Data Pendukung (Hitungan Riil Database):
                        </span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-mono text-[11px]">
                          {rec.dataPendukung}
                        </p>
                      </div>

                      {/* 2. Alasan */}
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wide text-slate-500">
                          Alasan Operasional / Regulasi:
                        </span>
                        <p className="text-slate-600 leading-relaxed">{rec.alasan}</p>
                      </div>

                      {/* 3. Saran Perbaikan */}
                      <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                        <span className="font-semibold text-blue-900 block text-[11px] uppercase tracking-wide">
                          Saran Perbaikan Konkret:
                        </span>
                        <ul className="space-y-1 text-slate-700 pl-1">
                          {rec.saranPerbaikan.map((saran, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-blue-600 font-bold shrink-0 mt-0.5">✓</span>
                              <span>{saran}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-200">
              <span>{localRecommendationsSummary.dataLimitationNotice}</span>
              <span className="italic text-slate-600">
                Dihasilkan secara deterministik berdasarkan data database riil.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section: Category Distribution & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kategori Terbanyak</h2>
              <p className="text-xs text-slate-500">
                Peringkat modul pengaduan masyarakat pada periode {periodLabels[selectedPeriod]}
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-1">
            {categoryStats.length === 0 || metrics.total === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                Belum ada data pengaduan pada periode yang dipilih.
              </div>
            ) : (
              categoryStats.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span className="text-slate-600 font-mono">
                      <strong>{item.count}</strong> laporan <span className="text-slate-400">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(item.percentage, item.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Grafik Tren Laporan Masuk</h2>
              <p className="text-xs text-slate-500">
                Fluktuasi pengaduan pada rentang {periodLabels[selectedPeriod]}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {metrics.total} Laporan
            </span>
          </div>

          {/* SVG/CSS Trend representation */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 px-2">
            {trendData.map((dp, idx) => {
              const maxCount = Math.max(...trendData.map((d) => d.count), 4);
              const heightPercent = (dp.count / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-semibold text-slate-700 font-mono">{dp.count}</span>
                  <div className="w-full bg-slate-100 rounded-t h-28 flex items-end">
                    <div
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors rounded-t"
                      style={{ height: `${Math.max(heightPercent, dp.count > 0 ? 12 : 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{dp.dateLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Priority breakdown summary */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
              <div className="text-rose-900 font-bold text-sm font-mono">{metrics.prioritasTinggi}</div>
              <div className="text-[10px] text-rose-700 font-medium">Tinggi (&ge;75)</div>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-amber-900 font-bold text-sm font-mono">{metrics.prioritasSedang}</div>
              <div className="text-[10px] text-amber-700 font-medium">Sedang (50–74)</div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-emerald-900 font-bold text-sm font-mono">{metrics.prioritasRendah}</div>
              <div className="text-[10px] text-emerald-700 font-medium">Rendah (&lt;50)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Prioritized Complaints Table (Item 2 & 3: Skor Prioritas & Daftar Prioritas Tinggi) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Pengaduan Prioritas Tinggi (Skor &ge; 75)
              </h2>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                {displayedPrioritizedComplaints.length} Laporan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dihitung berdasarkan rumus: <strong>(Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6)</strong>
            </p>
          </div>
          <button
            onClick={() => setActiveTab('daftar-pengaduan')}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Seluruh Pengaduan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Nomor Tiket</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Uraian / Ringkasan Masalah</th>
                <th className="px-4 py-3 text-center">Keparahan / Dampak</th>
                <th className="px-4 py-3 text-center">Skor & Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPrioritizedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada pengaduan pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                displayedPrioritizedComplaints.map((item) => {
                  const isHigh = item.priority_level === 'tinggi';
                  const isMedium = item.priority_level === 'sedang';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-900">
                        {item.ticket_number}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{item.category}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                        {item.ai_summary || item.description}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="text-slate-800 font-semibold">K:{item.severity}</span> /{' '}
                        <span className="text-slate-800 font-semibold">D:{item.service_impact}</span>
                        <div className="text-[10px] text-slate-400">
                          Freq:{item.frequency_30d}x (w={calculateFrequencyValue(item.frequency_30d)})
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block font-bold text-sm font-mono ${
                            isHigh
                              ? 'text-rose-700'
                              : isMedium
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.priority_score}
                        </span>
                        <span
                          className={`text-[10px] block uppercase font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.priority_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                            item.status === 'baru'
                              ? 'bg-blue-50 text-blue-700'
                              : item.status === 'diproses'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
