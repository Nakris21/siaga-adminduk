/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint, ComplaintCategory, ComplaintStatus, PriorityLevel } from '../types';
import { calculateFrequencyValue } from '../logic/scoring';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  Send,
  User,
  Phone,
  Mail,
  Sparkles,
  Calculator,
  ShieldCheck,
  ChevronRight,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

export const ComplaintListView: React.FC = () => {
  const {
    complaints,
    updateComplaintStatus,
    selectedComplaintId,
    setSelectedComplaintId,
    currentUser,
    setActiveTab,
    triggerAIAnalysisForComplaint,
    adjustComplaintAssessment,
    isAnalyzingComplaintId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Selected item modal/drawer state
  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || null;
  const [responseText, setResponseText] = useState('');
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>('diproses');
  const [isSavingResponse, setIsSavingResponse] = useState(false);

  // Officer adjustment states
  const [editSeverity, setEditSeverity] = useState<number>(3);
  const [editImpact, setEditImpact] = useState<number>(3);
  const [isSavingAssessment, setIsSavingAssessment] = useState<boolean>(false);
  const [showOverrideForm, setShowOverrideForm] = useState<boolean>(false);

  // Sync modal form when selectedComplaint changes
  React.useEffect(() => {
    if (selectedComplaint) {
      setResponseText(selectedComplaint.response || '');
      setTargetStatus(selectedComplaint.status);
      setEditSeverity(selectedComplaint.severity || 3);
      setEditImpact(selectedComplaint.service_impact || 3);
      setShowOverrideForm(false);
    }
  }, [selectedComplaintId]);

  // Filtering
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.issue_label && c.issue_label.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.ai_topic && c.ai_topic.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || c.priority_level === selectedPriority;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const handleSaveResponse = async () => {
    if (!selectedComplaint) return;
    setIsSavingResponse(true);
    await updateComplaintStatus(selectedComplaint.id, targetStatus, responseText);
    setIsSavingResponse(false);
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

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Akses Terbatas: Menu Khusus Petugas Dindukcapil
            </h1>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Demi keamanan dan privasi data kependudukan warga, <strong>Daftar Pengaduan Umum</strong> tidak dapat diakses secara publik.
              <br /><br />
              Warga publik hanya dapat memantau status pengaduan miliknya sendiri melalui menu <strong>Cek Status Pengaduan</strong> dengan memasukkan nomor tiket resmi.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Daftar & Penanganan Pengaduan (Internal Petugas)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Kelola pengaduan warga, pantau hasil analisis AI, dan berikan tanggapan resmi petugas.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor tiket, nama pelapor, isu, kata kunci..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="baru">Baru</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Prioritas</option>
              <option value="tinggi">Prioritas Tinggi</option>
              <option value="sedang">Prioritas Sedang</option>
              <option value="rendah">Prioritas Rendah</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong>{filteredComplaints.length}</strong> dari{' '}
            <strong>{complaints.length}</strong> pengaduan
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedPriority('all');
              }}
              className="text-blue-600 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Complaints List Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Tiket & Tanggal</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Pelapor</th>
                <th className="px-4 py-3">Uraian / Analisis AI</th>
                <th className="px-4 py-3 text-center">Prioritas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Tidak ada pengaduan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => {
                  const isHigh = item.priority_level === 'tinggi';
                  const isMedium = item.priority_level === 'sedang';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedComplaintId(item.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedComplaintId === item.id ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-blue-900">
                          {item.ticket_number}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{item.category}</span>
                        {item.issue_label && (
                          <div className="text-[10px] text-slate-500">{item.issue_label}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.phone}</div>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="line-clamp-2 text-slate-600">
                          {item.ai_summary || item.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className={`font-bold text-xs ${
                            isHigh
                              ? 'text-rose-700'
                              : isMedium
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.priority_score}
                        </div>
                        <div className="text-[10px] uppercase text-slate-400">
                          {item.priority_level}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold uppercase ${
                            item.status === 'baru'
                              ? 'text-blue-700'
                              : item.status === 'diproses'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.response && (
                          <div className="text-[10px] text-emerald-600">Ada tanggapan</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaintId(item.id);
                          }}
                          className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded font-medium transition-colors"
                        >
                          Detail
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

      {/* Detail & Response Modal / Drawer (FR-11) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-blue-900">
                    {selectedComplaint.ticket_number}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                      selectedComplaint.status === 'baru'
                        ? 'bg-blue-50 text-blue-700'
                        : selectedComplaint.status === 'diproses'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {selectedComplaint.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kategori: <strong>{selectedComplaint.category}</strong> · Diterima pada:{' '}
                  {new Date(selectedComplaint.created_at).toLocaleString('id-ID')}
                </div>
              </div>

              <button
                onClick={() => setSelectedComplaintId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reporter Contact Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Informasi Pelapor (Akses Terbatas Petugas)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 pt-1">
                <div>Nama: <strong>{selectedComplaint.name}</strong></div>
                <div>Telepon: <strong>{selectedComplaint.phone}</strong></div>
                <div>Email: <strong>{selectedComplaint.email || 'Tidak dicantumkan'}</strong></div>
              </div>
            </div>

            {/* Original Complaint Description */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-800">Uraian Pengaduan Asli:</div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 whitespace-pre-line leading-relaxed">
                {selectedComplaint.description}
              </div>
            </div>

            {/* AI Structured Analysis & Priority Score Calculation Breakdown (FR-07, FR-08, Tahap 4) */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Analisis AI SIAGA Adminduk & Skor Prioritas (FR-07, FR-08)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerAIAnalysisForComplaint(selectedComplaint.id)}
                    disabled={isAnalyzingComplaintId === selectedComplaint.id}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isAnalyzingComplaintId === selectedComplaint.id ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isAnalyzingComplaintId === selectedComplaint.id ? 'Menganalisis...' : 'Analisis Ulang AI'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200">
                    <span className="text-[11px] text-slate-500 font-medium">Skor:</span>
                    <span className="text-sm font-bold text-blue-900">
                      {selectedComplaint.priority_score}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        selectedComplaint.priority_level === 'tinggi'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedComplaint.priority_level === 'sedang'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedComplaint.priority_level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary and classification */}
              <div className="space-y-2 text-slate-800">
                <div>
                  <strong className="text-slate-900">Ringkasan Masalah (AI):</strong>{' '}
                  <span className="text-slate-700">{selectedComplaint.ai_summary || '-'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <div className="text-slate-600">
                    <strong>Label Masalah:</strong>{' '}
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                      {selectedComplaint.issue_label}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <strong>Sentimen:</strong>{' '}
                    <span
                      className={`px-2 py-0.5 rounded font-medium capitalize ${
                        selectedComplaint.ai_sentiment === 'positif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedComplaint.ai_sentiment === 'netral'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedComplaint.ai_sentiment}
                    </span>
                  </div>
                </div>

                {/* AI Follow-up recommendation */}
                {selectedComplaint.ai_recommendation && (
                  <div className="p-3 bg-white border border-blue-200 rounded-lg text-slate-800 space-y-1">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Saran Tindak Lanjut bagi Petugas:</span>
                    </span>
                    <p className="leading-relaxed text-slate-700">{selectedComplaint.ai_recommendation}</p>
                  </div>
                )}

                {/* Limitation note if applicable */}
                {selectedComplaint.ai_limitation_note && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                    ⚠️ {selectedComplaint.ai_limitation_note}
                  </div>
                )}
              </div>

              {/* Exact Formula Breakdown */}
              <div className="p-2.5 bg-white border border-blue-100 rounded text-[11px] text-slate-600 space-y-1">
                <div className="font-mono text-slate-700">
                  Rumus Skor: (Keparahan × 8) + (Dampak × 6) + (Nilai Frekuensi × 6)
                </div>
                <div className="font-mono text-blue-900 font-semibold">
                  = ({selectedComplaint.severity} × 8) + ({selectedComplaint.service_impact} × 6) + (
                  {calculateFrequencyValue(selectedComplaint.frequency_30d)} × 6) ={' '}
                  {selectedComplaint.priority_score}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>
                    *Frekuensi 30 hari: {selectedComplaint.frequency_30d} kasus sejenis (nilai bobot:{' '}
                    {calculateFrequencyValue(selectedComplaint.frequency_30d)})
                  </span>
                  {selectedComplaint.ai_verified_by && (
                    <span className="text-emerald-700 font-medium">
                      Diverifikasi oleh: {selectedComplaint.ai_verified_by}
                    </span>
                  )}
                </div>
              </div>

              {/* Officer Verification Override Toggle & Form */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOverrideForm(!showOverrideForm)}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showOverrideForm ? 'Tutup Verifikasi Petugas' : 'Verifikasi / Sesuaikan Bobot Keparahan & Dampak'}</span>
                </button>

                {showOverrideForm && (
                  <div className="mt-2.5 p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Keparahan Masalah (1–5):
                        </label>
                        <select
                          value={editSeverity}
                          onChange={(e) => setEditSeverity(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                        >
                          <option value={1}>1 - Ringan / Saran biasa</option>
                          <option value={2}>2 - Gangguan minor</option>
                          <option value={3}>3 - Menghambat urusan standar</option>
                          <option value={4}>4 - Menghambat urusan krusial</option>
                          <option value={5}>5 - Sangat kritis / darurat</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Dampak Layanan (1–5):
                        </label>
                        <select
                          value={editImpact}
                          onChange={(e) => setEditImpact(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                        >
                          <option value={1}>1 - Dampak perseorangan minimal</option>
                          <option value={2}>2 - Dampak lokal minor</option>
                          <option value={3}>3 - Potensi perlambatan antrean</option>
                          <option value={4}>4 - Berdampak luas satu wilayah</option>
                          <option value={5}>5 - Berdampak sistemik dinas</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSavingAssessment(true);
                          await adjustComplaintAssessment(selectedComplaint.id, editSeverity, editImpact);
                          setIsSavingAssessment(false);
                          setShowOverrideForm(false);
                        }}
                        disabled={isSavingAssessment}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingAssessment ? 'Menyimpan...' : 'Simpan Verifikasi'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 italic">
                *Pemberitahuan: Hasil analisis AI adalah alat bantu pertimbangan petugas Dindukcapil dan bukan penetapan otomatis.
              </div>
            </div>

            {/* Official Staff Response Form (FR-11) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-800">
                  Tindak Lanjut & Tanggapan Resmi Petugas:
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Ubah Status:</span>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ComplaintStatus)}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="baru">Baru</option>
                    <option value="diproses">Sedang Diproses</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Tuliskan tanggapan resmi atau langkah penyelesaian untuk pelapor..."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              {selectedComplaint.response_updated_at && (
                <div className="text-[11px] text-slate-400">
                  Tanggapan terakhir disimpan pada:{' '}
                  {new Date(selectedComplaint.response_updated_at).toLocaleString('id-ID')}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaintId(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveResponse}
                  disabled={isSavingResponse}
                  className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSavingResponse ? 'Menyimpan...' : 'Simpan Pembaruan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
