/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintCategory } from '../types';
import { calculateFrequencyValue } from '../logic/scoring';
import { generateLocalRecommendations, StructuredRecommendation } from '../logic/recommendations';
import {
  TrendingUp,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Building2,
  Check,
  ChevronDown,
  Eye,
  Lock,
  Search,
  Cpu,
} from 'lucide-react';

export const AiAnalysisView: React.FC = () => {
  const {
    complaints,
    currentUser,
    setActiveTab,
    setSelectedComplaintId,
    triggerAIAnalysisForComplaint,
    isAnalyzingComplaintId,
    adjustComplaintAssessment,
  } = useApp();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGeneratingTrend, setIsGeneratingTrend] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  // Modal for individual complaint review & adjustment
  const [inspectingComplaintId, setInspectingComplaintId] = useState<string | null>(null);
  const inspectingComplaint = complaints.find((c) => c.id === inspectingComplaintId) || null;

  // Manual adjustment draft state
  const [editSeverity, setEditSeverity] = useState<number>(3);
  const [editImpact, setEditImpact] = useState<number>(3);
  const [editLabel, setEditLabel] = useState<string>('');
  const [isSavingAdjustment, setIsSavingAdjustment] = useState<boolean>(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  React.useEffect(() => {
    if (inspectingComplaint) {
      setEditSeverity(inspectingComplaint.severity || 3);
      setEditImpact(inspectingComplaint.service_impact || 3);
      setEditLabel(inspectingComplaint.issue_label || '');
      setAdjustmentError(null);
    }
  }, [inspectingComplaintId]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Analisis Pengaduan (Internal Petugas)
            </h1>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Fitur analisis pengaduan lokal, formula prioritas, dan telaah tren pelayanan kependudukan diperuntukkan bagi petugas berwenang Dindukcapil Kabupaten Brebes.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setActiveTab('login')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Login Petugas / Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter complaints according to selected date range and category
  const filteredComplaints = complaints.filter((c) => {
    const createdAtTime = new Date(c.created_at).getTime();
    const now = Date.now();

    let matchesDate = true;
    if (dateRange === '7d') {
      matchesDate = now - createdAtTime <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '30d') {
      matchesDate = now - createdAtTime <= 30 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '90d') {
      matchesDate = now - createdAtTime <= 90 * 24 * 60 * 60 * 1000;
    }

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesDate && matchesCategory;
  });

  const periodLabel =
    dateRange === '7d'
      ? '7 Hari Terakhir'
      : dateRange === '30d'
      ? '30 Hari Terakhir'
      : dateRange === '90d'
      ? '90 Hari Terakhir (Triwulan)'
      : 'Semua Periode';

  // Compute local recommendations based on filtered complaints
  const localRecommendations = generateLocalRecommendations(filteredComplaints, periodLabel);

  // Calculate metrics for current filtered dataset
  const totalInPeriod = filteredComplaints.length;
  const highPriorityInPeriod = filteredComplaints.filter((c) => c.priority_level === 'tinggi').length;
  const mediumPriorityInPeriod = filteredComplaints.filter((c) => c.priority_level === 'sedang').length;
  const lowPriorityInPeriod = filteredComplaints.filter((c) => c.priority_level === 'rendah').length;

  // Recurring issues tally
  const issueCounts: Record<string, { count: number; category: string }> = {};
  filteredComplaints.forEach((c) => {
    const key = c.issue_label || c.category;
    if (!issueCounts[key]) {
      issueCounts[key] = { count: 0, category: c.category };
    }
    issueCounts[key].count++;
  });

  const recurringIssues = Object.entries(issueCounts)
    .map(([label, val]) => ({ label, count: val.count, category: val.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleSaveAdjustment = async () => {
    if (!inspectingComplaint) return;
    setAdjustmentError(null);
    setIsSavingAdjustment(true);
    try {
      const ok = await adjustComplaintAssessment(
        inspectingComplaint.id,
        editSeverity,
        editImpact,
        editLabel
      );
      if (ok) {
        // Berhasil diperbarui: tutup modal dan arahkan kembali ke daftar analisis
        setInspectingComplaintId(null);
      } else {
        // Gagal: pertahankan modal dan input petugas
        setAdjustmentError('Gagal memperbarui penilaian petugas. Silakan coba kembali.');
      }
    } catch (err: any) {
      setAdjustmentError(err?.message || 'Terjadi kesalahan sistem saat menyimpan penilaian petugas.');
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const categories: ComplaintCategory[] = [
    'KTP-el',
    'Kartu Keluarga',
    'Akta Kelahiran',
    'Akta Kematian',
    'IKD',
    'Pindah Datang',
    'Lainnya',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold mb-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-700" />
            <span>Analisis Lokal & Skor Prioritas Terstandar</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pusat Analisis & Rekomendasi Terstruktur SIAGA Adminduk
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Menganalisis pengaduan secara deterministik dari database tersimpan Dindukcapil Kabupaten Brebes. Menghitung skor prioritas sesuai rumus resmi dan merumuskan rekomendasi tindak lanjut berbasis data faktual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Buka Dashboard
          </button>
        </div>
      </div>

      {/* Transparency Banner on Local Deterministic Analysis (PRD Final Item 1 & 3) */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Standar Analisis Lokal & Rumus Skor Prioritas:</span>
          <p className="leading-relaxed text-blue-900">
            Analisis dijalankan secara <strong>lokal pada data tersimpan di database</strong> tanpa ketergantungan API pihak ketiga.
            Skor prioritas dihitung menggunakan rumus baku:
            <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded mx-1 font-bold text-blue-950">
              Skor = (Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6)
            </span>
            dengan rentang frekuensi 30 hari: 1 kasus = 1, 2–3 = 2, 4–6 = 3, 7–10 = 4, &gt;10 = 5.
            Ambang prioritas: <strong>Tinggi &ge; 75</strong>, <strong>Sedang 50–74</strong>, <strong>Rendah &lt; 50</strong>.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Periode Data:</span>
          </span>

          {(['7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                dateRange === r
                  ? 'bg-blue-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === '7d' ? '7 Hari' : r === '30d' ? '30 Hari (Bulan)' : r === '90d' ? 'Triwulan' : 'Semua Data'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filter Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="text-xs text-slate-500">Total Pengaduan dalam Filter</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalInPeriod}</div>
          <div className="text-[11px] text-slate-400">Periode: {periodLabel}</div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="text-xs text-rose-700 font-semibold flex items-center justify-between">
            <span>Prioritas Tinggi (&ge; 75)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 font-mono">{highPriorityInPeriod}</div>
          <div className="text-[11px] text-rose-600">Perlu penanganan segera</div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="text-xs text-amber-700 font-semibold">Prioritas Sedang (50–74)</div>
          <div className="text-2xl font-bold text-amber-900 font-mono">{mediumPriorityInPeriod}</div>
          <div className="text-[11px] text-amber-600">Jadwal penanganan normal</div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-1 shadow-xs">
          <div className="text-xs text-emerald-700 font-semibold">Prioritas Rendah (&lt; 50)</div>
          <div className="text-2xl font-bold text-emerald-900 font-mono">{lowPriorityInPeriod}</div>
          <div className="text-[11px] text-emerald-600">Aspirasi & kendala minor</div>
        </div>
      </div>

      {/* Structured Automatic Recommendations (Item 4: Masalah, Data Pendukung, Alasan, Saran Perbaikan) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Rekomendasi Tindak Lanjut Otomatis (Data Aktual)</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Rekomendasi Perbaikan Layanan Berdasarkan Kategori, Tren & Frekuensi
            </h2>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            {localRecommendations.recommendations.length} Rekomendasi Teridentifikasi
          </span>
        </div>

        {localRecommendations.recommendations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Belum ada pengaduan pada filter ini untuk menyusun rekomendasi terstruktur.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localRecommendations.recommendations.map((rec) => {
              const isHigh = rec.tingkatUrgensi === 'Tinggi';
              return (
                <div
                  key={rec.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded inline-block mb-1">
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
                      {rec.tingkatUrgensi}
                    </span>
                  </div>

                  {/* 1. Data Pendukung */}
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wide">
                      1. Data Pendukung (Fakta Hitungan Riil):
                    </span>
                    <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200 leading-relaxed font-mono text-[11px]">
                      {rec.dataPendukung}
                    </p>
                  </div>

                  {/* 2. Alasan */}
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wide">
                      2. Alasan Masalah:
                    </span>
                    <p className="text-slate-600 leading-relaxed">{rec.alasan}</p>
                  </div>

                  {/* 3. Saran Perbaikan */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/80">
                    <span className="font-semibold text-blue-900 block text-[11px] uppercase tracking-wide">
                      3. Saran Perbaikan Konkret:
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

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>{localRecommendations.dataLimitationNotice}</span>
          <span className="italic text-slate-600">
            Tidak mengarang asumsi: Semua rekomendasi didasarkan pada perhitungan data riil tersimpan.
          </span>
        </div>
      </div>

      {/* Main Grid: Recurring Issues Table & Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recurring Issues Sidebar Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Masalah Berulang Teratas</h2>
              <p className="text-xs text-slate-500">Berdasarkan frekuensi laporan berlabel sama</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-1">
            {recurringIssues.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                Belum ada pengaduan pada filter ini.
              </div>
            ) : (
              recurringIssues.map((item, idx) => {
                const percentage = Math.round((item.count / (totalInPeriod || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="text-blue-700 font-bold font-mono">{item.count} laporan</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Kategori: {item.category}</span>
                      <span>{percentage}% dari total</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Explanation on formula */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs space-y-1 text-slate-700">
            <span className="font-bold text-blue-900">Formula Prioritas Baku (FR-08):</span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Skor = (Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6).
              <br />
              Frekuensi 30 hari: 1 laporan = 1; 2–3 = 2; 4–6 = 3; 7–10 = 4; &gt;10 = 5.
            </p>
          </div>
        </div>

        {/* Complaints Analysis List Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Antrean Pengaduan & Hasil Penilaian Lokal
              </h2>
              <p className="text-xs text-slate-500">
                Diurutkan berdasarkan skor prioritas tertinggi (rumus deterministik)
              </p>
            </div>
            <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              {filteredComplaints.length} Laporan
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Tiket & Tanggal</th>
                  <th className="px-4 py-3">Ringkasan & Label Isu</th>
                  <th className="px-4 py-3 text-center">Keparahan / Dampak</th>
                  <th className="px-4 py-3 text-center">Skor & Prioritas</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada data pengaduan pada filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  [...filteredComplaints]
                    .sort((a, b) => b.priority_score - a.priority_score)
                    .map((item) => {
                      const isHigh = item.priority_level === 'tinggi';
                      const isMedium = item.priority_level === 'sedang';

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-blue-900">
                              {item.ticket_number}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {item.category}
                            </div>
                          </td>

                          <td className="px-4 py-3 max-w-sm">
                            <div className="font-medium text-slate-800 line-clamp-2">
                              {item.ai_summary || item.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                {item.issue_label}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  item.ai_sentiment === 'positif'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : item.ai_sentiment === 'netral'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {item.ai_sentiment}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            <div className="text-slate-700 font-semibold">
                              K:{item.severity} / D:{item.service_impact}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Freq: {item.frequency_30d}x (w={calculateFrequencyValue(item.frequency_30d)})
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div
                              className={`text-sm font-bold font-mono ${
                                isHigh
                                  ? 'text-rose-700'
                                  : isMedium
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {item.priority_score}
                            </div>
                            <span
                              className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
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

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setInspectingComplaintId(item.id)}
                                className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg font-semibold cursor-pointer transition-colors"
                              >
                                Rincian & Verifikasi
                              </button>
                            </div>
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

      {/* Inspecting & Adjustment Modal (FR-07, FR-08, FR-11, Tahap Final) */}
      {inspectingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-blue-900">
                    {inspectingComplaint.ticket_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      inspectingComplaint.priority_level === 'tinggi'
                        ? 'bg-rose-100 text-rose-800'
                        : inspectingComplaint.priority_level === 'sedang'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Prioritas {inspectingComplaint.priority_level} (Skor: {inspectingComplaint.priority_score})
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kategori: <strong>{inspectingComplaint.category}</strong> · Diterima:{' '}
                  {new Date(inspectingComplaint.created_at).toLocaleString('id-ID')}
                </div>
              </div>

              <button
                onClick={() => setInspectingComplaintId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Original Complaint Content */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">Isi Pengaduan Asli:</div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 whitespace-pre-line leading-relaxed">
                {inspectingComplaint.description}
              </div>
            </div>

            {/* Analysis & Recommendation Cards */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-700" />
                  <span>Hasil Analisis Lokal Terstandar</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-medium">
                  Sumber: {inspectingComplaint.ai_source || 'analisis_lokal'}
                </span>
              </div>

              <div className="space-y-2 text-slate-800">
                <div>
                  <strong>Ringkasan Masalah:</strong> {inspectingComplaint.ai_summary || '-'}
                </div>
                <div>
                  <strong>Label Masalah Utama:</strong> {inspectingComplaint.issue_label}
                </div>
                <div>
                  <strong>Sentimen:</strong>{' '}
                  <span className="capitalize font-medium">{inspectingComplaint.ai_sentiment}</span>
                </div>
                {inspectingComplaint.ai_recommendation && (
                  <div className="p-2.5 bg-white border border-blue-200 rounded text-slate-700">
                    <span className="font-bold text-blue-900 block mb-0.5">Saran Tindak Lanjut Petugas:</span>
                    <p className="leading-relaxed">{inspectingComplaint.ai_recommendation}</p>
                  </div>
                )}
                {inspectingComplaint.ai_limitation_note && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    ⚠️ {inspectingComplaint.ai_limitation_note}
                  </div>
                )}
              </div>
            </div>

            {/* Score Calculation Formula Breakdown */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="font-bold text-slate-800">Rincian Perhitungan Skor Aplikasi:</div>
              <div className="p-2.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-700 space-y-1">
                <div>Rumus = (Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6)</div>
                <div className="font-bold text-blue-900">
                  = ({inspectingComplaint.severity} × 8) + ({inspectingComplaint.service_impact} × 6) + (
                  {calculateFrequencyValue(inspectingComplaint.frequency_30d)} × 6) = {inspectingComplaint.priority_score}
                </div>
              </div>
              <div className="text-[11px] text-slate-500">
                *Nilai frekuensi {calculateFrequencyValue(inspectingComplaint.frequency_30d)} diperoleh dari {inspectingComplaint.frequency_30d} kasus serupa dalam 30 hari terakhir.
              </div>
            </div>

            {/* Officer Verification & Manual Override (PRD FR-08 & Final) */}
            <div className="p-4 bg-slate-100/70 border border-slate-300 rounded-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
                  <span>Penilaian Keparahan & Dampak oleh Petugas</span>
                </span>
                {inspectingComplaint.ai_verified_by && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Diverifikasi: {inspectingComplaint.ai_verified_by}
                  </span>
                )}
              </div>

              {adjustmentError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adjustmentError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Tingkat Keparahan (1 - 5):
                  </label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value={1}>1 - Ringan / Aspirasi / Pertanyaan</option>
                    <option value={2}>2 - Gangguan minor tidak mendesak</option>
                    <option value={3}>3 - Menghambat urusan perorangan standar</option>
                    <option value={4}>4 - Menghambat urusan krusial (Bank/BPJS/pekerjaan)</option>
                    <option value={5}>5 - Kritis (Blangko habis total / pungli / darurat)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Dampak Layanan (1 - 5):
                  </label>
                  <select
                    value={editImpact}
                    onChange={(e) => setEditImpact(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value={1}>1 - Dampak perseorangan minimal</option>
                    <option value={2}>2 - Dampak lokal minor</option>
                    <option value={3}>3 - Berpotensi memperlambat antrean loket</option>
                    <option value={4}>4 - Berdampak luas di satu kecamatan/loket</option>
                    <option value={5}>5 - Berdampak sistemik pada reputasi dinas</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAdjustment}
                  disabled={isSavingAdjustment}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingAdjustment ? 'Menyimpan...' : 'Simpan Penilaian Petugas'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setSelectedComplaintId(inspectingComplaint.id);
                  setActiveTab('daftar-pengaduan');
                  setInspectingComplaintId(null);
                }}
                className="text-blue-700 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Buka Form Tanggapan Petugas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setInspectingComplaintId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
