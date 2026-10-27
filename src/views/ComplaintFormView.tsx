/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ComplaintCategory } from '../types';
import { validateComplaintForm } from '../logic/validation';
import {
  FileText,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

export const ComplaintFormView: React.FC = () => {
  const {
    submitComplaint,
    currentUser,
    setActiveTab,
    setSelectedComplaintId,
    complaints,
    setCheckTicketNumber,
  } = useApp();

  const [category, setCategory] = useState<ComplaintCategory>('KTP-el');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successReceipt, setSuccessReceipt] = useState<{
    ticketNumber: string;
    category: ComplaintCategory;
    name: string;
    submittedAt: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const categories: ComplaintCategory[] = [
    'KTP-el',
    'Kartu Keluarga',
    'Akta Kelahiran',
    'Akta Kematian',
    'IKD',
    'Pindah Datang',
    'Lainnya',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validation check (FR-05)
    const val = validateComplaintForm({ category, description, name, phone, email });
    if (!val.isValid) {
      setFieldErrors(val.errors as Record<string, string>);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitComplaint({
        category,
        description,
        name,
        phone,
        email: email || undefined,
      });

      if (result.success && result.ticketNumber) {
        setSuccessReceipt({
          ticketNumber: result.ticketNumber,
          category,
          name,
          submittedAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        });
        // Reset form
        setDescription('');
        setName('');
        setPhone('');
        setEmail('');
      } else {
        setFieldErrors({ general: result.error || 'Terjadi kesalahan saat memproses pengaduan.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (!successReceipt) return;
    navigator.clipboard.writeText(successReceipt.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Success Receipt State (FR-06) */}
      {successReceipt ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pengaduan Berhasil Terkirim
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Laporan Anda telah tercatat dalam sistem SIAGA Adminduk dan akan ditelaah oleh petugas Dindukcapil.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Nomor Tiket Pengaduan Anda
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-wide">
                {successReceipt.ticketNumber}
              </span>
              <button
                onClick={copyTicket}
                className="p-2 text-slate-600 hover:text-blue-700 hover:bg-white rounded-md border border-slate-200 transition-colors cursor-pointer"
                title="Salin nomor tiket"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <div className="text-center text-xs font-medium text-emerald-700">
                Nomor tiket telah disalin ke clipboard!
              </div>
            )}
            <div className="text-xs text-slate-500 text-center">
              Waktu Pengiriman: {successReceipt.submittedAt} · Kategori: {successReceipt.category}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Penting: Simpan Nomor Tiket Anda</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Harap catat atau tangkap layar (screenshot) nomor tiket ini. Petugas kami akan menghubungi nomor kontak terdaftar jika membutuhkan verifikasi berkas tambahan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setSuccessReceipt(null)}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer text-center"
            >
              Ajukan Pengaduan Lain
            </button>
            <button
              onClick={() => {
                setCheckTicketNumber(successReceipt.ticketNumber);
                setActiveTab('cek-status');
              }}
              className="flex-1 py-2.5 px-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Cek Status Tiket Ini Langsung</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {currentUser && (
            <div className="text-center pt-1 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('daftar-pengaduan')}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                Buka di Daftar Pengaduan Petugas
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Form Input State (FR-05) */
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              <span>Formulir Pengaduan Layanan Adminduk</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Sampaikan kendala, kekeliruan dokumen, atau hambatan pelayanan administrasi kependudukan Anda secara terstruktur.
            </p>
          </div>

          {fieldErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fieldErrors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Kategori Layanan <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.category && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.category}</p>
              )}
            </div>

            {/* Description textarea */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Uraian Pengaduan <span className="text-rose-600">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    description.trim().length >= 20 ? 'text-slate-500' : 'text-amber-600 font-medium'
                  }`}
                >
                  {description.trim().length} / minimal 20 karakter
                </span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara rinci permasalahan, lokasi kantor/layanan, tanggal kejadian, atau dokumen terkait (tanpa mencantumkan NIK rahasia)..."
                className={`w-full bg-white border rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  fieldErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {fieldErrors.description && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.description}</p>
              )}
            </div>

            {/* Reporter Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Nama Lengkap Pelapor <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    fieldErrors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Nomor WhatsApp / HP Aktif <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    fieldErrors.phone ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Alamat Email <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com (untuk menerima salinan tanggapan petugas)"
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  fieldErrors.email ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Privacy notice of contact information (FR-05) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
              <strong>Pernyataan Privasi Kontak:</strong> Nama dan kontak Anda dienkripsi serta hanya dapat diakses oleh petugas Dindukcapil yang berwenang untuk tujuan klarifikasi teknis dan konfirmasi status permohonan.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses dan Menghasilkan Nomor Tiket...</span>
              ) : (
                <>
                  <span>Kirim Pengaduan & Dapatkan Nomor Tiket</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
