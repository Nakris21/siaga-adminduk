/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReferenceDoc, DocumentType } from '../types';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Save,
  Info,
  ShieldCheck,
  Tag,
  Lock,
  Eye,
  ExternalLink,
  Calendar,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';

export const ReferencesView: React.FC = () => {
  const {
    references,
    toggleReferenceActive,
    saveReferenceDoc,
    deleteReferenceDoc,
    currentUser,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal create/edit state
  const [editingDoc, setEditingDoc] = useState<Partial<ReferenceDoc> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Detail preview modal state
  const [previewDoc, setPreviewDoc] = useState<ReferenceDoc | null>(null);

  // Delete confirmation modal state
  const [docToDelete, setDocToDelete] = useState<ReferenceDoc | null>(null);

  const documentTypes: { id: DocumentType; label: string }[] = [
    { id: 'peraturan', label: 'Peraturan Perundang-undangan' },
    { id: 'standar_pelayanan', label: 'Standar Pelayanan' },
    { id: 'sop', label: 'Standar Operasional Prosedur (SOP)' },
    { id: 'faq_resmi', label: 'FAQ Resmi' },
    { id: 'lainnya', label: 'Dokumen Resmi Lainnya' },
  ];

  // Access guard for unauthenticated users (Requirement B & Tahap 2)
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Akses Terbatas: Pengelolaan Referensi Dokumen
            </h1>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Pengelolaan dokumen regulasi resmi, standar pelayanan, dan basis pengetahuan konsultasi AI hanya dapat diakses oleh Petugas dan Administrator Dindukcapil yang terverifikasi.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setActiveTab('login')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Login Petugas / Administrator
            </button>
            <button
              onClick={() => setActiveTab('konsultasi')}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Halaman Publik
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtering references
  const filteredReferences = references.filter((r) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.title.toLowerCase().includes(query) ||
      r.text.toLowerCase().includes(query) ||
      (r.document_number && r.document_number.toLowerCase().includes(query)) ||
      (r.section && r.section.toLowerCase().includes(query)) ||
      (r.year && String(r.year).includes(query)) ||
      (r.summary && r.summary.toLowerCase().includes(query));

    const matchesType = selectedType === 'all' || r.document_type === selectedType;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && r.active) ||
      (selectedStatus === 'inactive' && !r.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCount = references.filter((r) => r.active).length;
  const inactiveCount = references.filter((r) => !r.active).length;

  const handleOpenAdd = () => {
    setEditingDoc({
      title: '',
      document_type: 'peraturan',
      document_number: '',
      document_date: new Date().toISOString().split('T')[0],
      year: new Date().getFullYear().toString(),
      section: '',
      summary: '',
      source_url: '',
      text: '',
      active: true,
    });
    setValidationErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: ReferenceDoc) => {
    setEditingDoc({ ...doc });
    setValidationErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editingDoc?.title || editingDoc.title.trim().length < 5) {
      errors.title = 'Judul dokumen wajib diisi minimal 5 karakter.';
    }
    if (!editingDoc?.document_type) {
      errors.document_type = 'Pilih salah satu jenis dokumen resmi.';
    }
    if (!editingDoc?.text || editingDoc.text.trim().length < 10) {
      errors.text = 'Isi dokumen atau teks referensi wajib diisi minimal 10 karakter.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateForm()) return;

    if (!editingDoc || !editingDoc.title || !editingDoc.text) return;

    setIsSubmitting(true);
    try {
      const ok = await saveReferenceDoc({
        ...editingDoc,
        title: editingDoc.title.trim(),
        text: editingDoc.text.trim(),
        document_type: editingDoc.document_type || 'peraturan',
        document_number: editingDoc.document_number?.trim() || undefined,
        year: editingDoc.year?.trim() || undefined,
        section: editingDoc.section?.trim() || undefined,
        summary: editingDoc.summary?.trim() || undefined,
        source_url: editingDoc.source_url?.trim() || undefined,
      });

      if (ok) {
        // Berhasil disimpan: tutup modal dan arahkan kembali ke daftar referensi
        setIsModalOpen(false);
        setEditingDoc(null);
      } else {
        // Gagal disimpan: jangan tutup modal atau hapus input pengguna
        setSubmitError('Penyimpanan dokumen tidak dapat diproses oleh sistem. Silakan periksa kembali isian Anda.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Terjadi kesalahan sistem saat menyimpan dokumen referensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    await deleteReferenceDoc(docToDelete.id);
    setDocToDelete(null);
  };

  const getTypeLabel = (type: DocumentType): string => {
    const item = documentTypes.find((t) => t.id === type);
    return item ? item.label : type;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <span>Manajemen Referensi Dokumen Resmi</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Kelola basis pengetahuan regulasi resmi Dindukcapil. AI hanya akan menjawab konsultasi warga berdasarkan dokumen yang berstatus <strong>AKTIF</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Referensi Baru</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-blue-950">Prinsip Basis Pengetahuan AI SIAGA Adminduk:</div>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            Setiap dokumen yang berstatus <strong>Aktif</strong> langsung menjadi sumber rujukan asisten AI pada konsultasi publik. Jika suatu dokumen dinonaktifkan, AI dilarang berspekulasi/mengarang informasi dan secara otomatis mengarahkan warga ke formulir pengaduan.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Dokumen</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{references.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tersimpan di basis data</div>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dokumen Aktif (AI)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Digunakan rujukan konsultasi</div>
        </div>

        <div className="bg-white border border-slate-200 bg-slate-50/50 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Dokumen Nonaktif</span>
          </div>
          <div className="text-2xl font-bold text-slate-600 mt-1">{inactiveCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tidak dipakai oleh AI</div>
        </div>

        <div className="bg-white border border-blue-200 bg-blue-50/20 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-blue-800 font-medium">Jenis Terbanyak</div>
          <div className="text-sm font-bold text-blue-950 mt-2 truncate">
            Standar Pelayanan & Peraturan
          </div>
          <div className="text-[10px] text-blue-700 mt-0.5">5 kategori tersedia</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search query input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, nomor dokumen/SK, tahun, pasal, atau kata kunci..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Filter Jenis Dokumen */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Jenis Dokumen</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.label}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Semua Status</option>
              <option value="active">Hanya Dokumen Aktif</option>
              <option value="inactive">Hanya Dokumen Nonaktif</option>
            </select>

            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                }}
                className="text-xs text-blue-700 hover:underline font-medium px-2 py-1"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong>{filteredReferences.length}</strong> dari{' '}
            <strong>{references.length}</strong> dokumen resmi
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Status aktif dapat diubah langsung melalui toggle switch di kolom status
          </span>
        </div>
      </div>

      {/* References Table View (Desktop & Tablet) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Judul & Keterangan Dokumen</th>
                <th className="px-4 py-3">Jenis Dokumen</th>
                <th className="px-4 py-3">Nomor / Tahun</th>
                <th className="px-4 py-3 text-center">Status AI</th>
                <th className="px-4 py-3">Pembaruan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Tidak ditemukan dokumen referensi yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredReferences.map((ref) => (
                  <tr
                    key={ref.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !ref.active ? 'bg-slate-50/40 text-slate-500' : ''
                    }`}
                  >
                    {/* Judul & Ringkasan */}
                    <td className="px-4 py-3.5 max-w-sm">
                      <div className="font-bold text-slate-900 leading-snug">{ref.title}</div>
                      {ref.summary && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {ref.summary}
                        </p>
                      )}
                      {ref.section && (
                        <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                          {ref.section}
                        </div>
                      )}
                    </td>

                    {/* Jenis Dokumen */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block text-[11px] font-medium text-slate-700">
                        {getTypeLabel(ref.document_type)}
                      </span>
                    </td>

                    {/* Nomor & Tahun */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-slate-800">
                        {ref.document_number || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {ref.year ? `Tahun ${ref.year}` : '-'}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleReferenceActive(ref.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                          ref.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Klik untuk mengubah status aktif/nonaktif"
                      >
                        {ref.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Terakhir Diperbarui */}
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {new Date(ref.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(ref)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          title="Lihat Detail Teks Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ref)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          title="Edit Dokumen"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDocToDelete(ref)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Dokumen (Preview) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {getTypeLabel(previewDoc.document_type)}
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {previewDoc.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Nomor Dokumen:</span>
                <span className="font-semibold text-slate-800">{previewDoc.document_number || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tahun / Tanggal:</span>
                <span className="font-semibold text-slate-800">{previewDoc.year || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status AI:</span>
                <span
                  className={`font-semibold ${
                    previewDoc.active ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {previewDoc.active ? 'Aktif (Rujukan AI)' : 'Nonaktif'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Verifikator:</span>
                <span className="text-slate-700 font-medium truncate block">
                  {previewDoc.verified_by || 'Dindukcapil'}
                </span>
              </div>
            </div>

            {previewDoc.summary && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-1">
                <div className="font-semibold text-blue-900">Ringkasan Dokumen:</div>
                <p className="leading-relaxed">{previewDoc.summary}</p>
              </div>
            )}

            {/* Isi Teks Referensi */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-800">
                Isi Teks Referensi (Grounded Knowledge):
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                {previewDoc.text}
              </div>
            </div>

            {previewDoc.source_url && (
              <div className="text-xs pt-1">
                <a
                  href={previewDoc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Buka Berkas Regulasi / Tautan Resmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  handleOpenEdit(previewDoc);
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Dokumen Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Dokumen */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingDoc.id ? 'Edit Dokumen Referensi Resmi' : 'Tambah Dokumen Referensi Baru'}
                </h2>
                <p className="text-xs text-slate-500">
                  Pastikan informasi yang dimasukkan valid sesuai salinan SK atau regulasi resmi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Judul Dokumen */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Judul Dokumen / Regulasi <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={editingDoc.title || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  placeholder="Contoh: Standar Pelayanan Penerbitan KTP-el Rusak atau Hilang"
                  className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    validationErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-xs text-rose-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* Jenis Dokumen & Nomor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Jenis Dokumen <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={editingDoc.document_type || 'peraturan'}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        document_type: e.target.value as DocumentType,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nomor Dokumen / SK / Peraturan
                  </label>
                  <input
                    type="text"
                    value={editingDoc.document_number || ''}
                    onChange={(e) =>
                      setEditingDoc({ ...editingDoc, document_number: e.target.value })
                    }
                    placeholder="Contoh: Permendagri No. 108/2019"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Tahun, Tanggal & Pasal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Tahun Terbit</label>
                  <input
                    type="text"
                    value={editingDoc.year || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, year: e.target.value })}
                    placeholder="Contoh: 2025"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Tanggal Dokumen</label>
                  <input
                    type="date"
                    value={editingDoc.document_date || ''}
                    onChange={(e) =>
                      setEditingDoc({ ...editingDoc, document_date: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Bagian / Pasal / Bab
                  </label>
                  <input
                    type="text"
                    value={editingDoc.section || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, section: e.target.value })}
                    placeholder="Contoh: Pasal 14 ayat (1)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Ringkasan & Sumber URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Ringkasan Singkat
                  </label>
                  <input
                    type="text"
                    value={editingDoc.summary || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, summary: e.target.value })}
                    placeholder="Ringkasan 1 kalimat tentang dokumen ini..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Sumber / Tautan Berkas Resmi
                  </label>
                  <input
                    type="url"
                    value={editingDoc.source_url || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, source_url: e.target.value })}
                    placeholder="https://dindukcapil.brebeskab.go.id/..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Teks Isi Referensi */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Isi Dokumen / Teks Referensi Resmi (Grounded Knowledge) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={6}
                  value={editingDoc.text || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, text: e.target.value })}
                  placeholder="Tuliskan secara lengkap butir-butir persyaratan, biaya layanan (gratis Rp 0), durasi penyelesaian, dan prosedur resmi yang sah..."
                  className={`w-full bg-white border rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    validationErrors.text ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.text && (
                  <p className="text-xs text-rose-600 mt-1">{validationErrors.text}</p>
                )}
              </div>

              {/* Checkbox Status Aktif */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Status Aktif Dokumen</div>
                  <div className="text-[11px] text-slate-500">
                    Bila aktif, dokumen ini akan langsung digunakan asisten AI untuk menjawab pertanyaan warga.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDoc.active ?? true}
                    onChange={(e) => setEditingDoc({ ...editingDoc, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Dokumen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dokumen */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-slate-900">Konfirmasi Hapus Referensi</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus dokumen <strong>"{docToDelete.title}"</strong>?
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
