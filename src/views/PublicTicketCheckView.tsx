/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  FileText,
  Calendar,
  User,
  ArrowRight,
  MessageSquareText,
  Lock,
} from 'lucide-react';

export const PublicTicketCheckView: React.FC = () => {
  const { checkTicketNumber, setCheckTicketNumber, getPublicComplaintByTicket, setActiveTab } = useApp();
  const [inputTicket, setInputTicket] = useState(checkTicketNumber || '');
  const [searched, setSearched] = useState(false);
  const [complaintResult, setComplaintResult] = useState<Complaint | null>(null);

  useEffect(() => {
    if (checkTicketNumber) {
      setInputTicket(checkTicketNumber);
      const res = getPublicComplaintByTicket(checkTicketNumber);
      setComplaintResult(res);
      setSearched(true);
    }
  }, [checkTicketNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTicket.trim()) return;

    const trimmed = inputTicket.trim();
    setCheckTicketNumber(trimmed);
    const res = getPublicComplaintByTicket(trimmed);
    setComplaintResult(res);
    setSearched(true);
  };

  const handleSampleClick = (sampleTicket: string) => {
    setInputTicket(sampleTicket);
    setCheckTicketNumber(sampleTicket);
    const res = getPublicComplaintByTicket(sampleTicket);
    setComplaintResult(res);
    setSearched(true);
  };

  // Mask name for privacy protection (e.g. "Budi Santoso" -> "Budi S***")
  const maskName = (name: string) => {
    if (!name) return '-';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].length > 3 ? `${parts[0].slice(0, 2)}***` : parts[0];
    }
    return `${parts[0]} ${parts[1].slice(0, 1)}***`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cek Status Pengaduan Anda
        </h1>
        <p className="text-xs text-slate-600 max-w-lg mx-auto">
          Demi keamanan dan perlindungan privasi warga, sistem hanya menampilkan rincian pengaduan yang sesuai dengan nomor tiket yang dimasukkan.
        </p>
      </div>

      {/* Ticket Search Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-800">
            Masukkan Nomor Tiket Pengaduan:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputTicket}
                onChange={(e) => setInputTicket(e.target.value)}
                placeholder="Contoh: PGD-20261024-8K2A1M"
                className="w-full uppercase font-mono px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={!inputTicket.trim()}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Cek Status</span>
            </button>
          </div>

          {/* Quick sample chips for testing */}
          <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
            <span>Contoh tiket pengujian:</span>
            <button
              type="button"
              onClick={() => handleSampleClick('PGD-20261024-8K2A1M')}
              className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer"
            >
              PGD-20261024-8K2A1M (Baru)
            </button>
            <button
              type="button"
              onClick={() => handleSampleClick('PGD-20261023-4L9P2X')}
              className="text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 cursor-pointer"
            >
              PGD-20261023-4L9P2X (Diproses)
            </button>
            <button
              type="button"
              onClick={() => handleSampleClick('PGD-20261021-2M5N8Q')}
              className="text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
            >
              PGD-20261021-2M5N8Q (Selesai)
            </button>
          </div>
        </form>
      </div>

      {/* Result Section */}
      {searched && (
        <>
          {complaintResult ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Nomor Tiket:</div>
                  <div className="font-mono text-xl sm:text-2xl font-extrabold text-blue-900">
                    {complaintResult.ticket_number}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs text-slate-500">Status Terkini:</div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      complaintResult.status === 'baru'
                        ? 'bg-blue-100 text-blue-800'
                        : complaintResult.status === 'diproses'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {complaintResult.status === 'baru' && <Clock className="w-3.5 h-3.5" />}
                    {complaintResult.status === 'diproses' && <Clock className="w-3.5 h-3.5" />}
                    {complaintResult.status === 'selesai' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{complaintResult.status}</span>
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-700 mb-3">Alur Penanganan Laporan:</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-xs shadow-xs">
                      ✓
                    </div>
                    <div className="font-semibold text-slate-900">Diterima</div>
                    <div className="text-[10px] text-slate-500">Tercatat di sistem</div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs shadow-xs ${
                        complaintResult.status === 'diproses' || complaintResult.status === 'selesai'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {complaintResult.status === 'diproses' || complaintResult.status === 'selesai'
                        ? '✓'
                        : '2'}
                    </div>
                    <div className="font-semibold text-slate-900">Ditelaah Petugas</div>
                    <div className="text-[10px] text-slate-500">Verifikasi berkas</div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs shadow-xs ${
                        complaintResult.status === 'selesai'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {complaintResult.status === 'selesai' ? '✓' : '3'}
                    </div>
                    <div className="font-semibold text-slate-900">Selesai</div>
                    <div className="text-[10px] text-slate-500">Tanggapan diberikan</div>
                  </div>
                </div>
              </div>

              {/* Complaint Details Card */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-800">Rincian Pengaduan:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Kategori Layanan:</span>
                    <span className="font-semibold text-slate-800">{complaintResult.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Waktu Pengajuan:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(complaintResult.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nama Pelapor:</span>
                    <span className="font-semibold text-slate-800">{maskName(complaintResult.name)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Keamanan Privasi:</span>
                    <span className="text-slate-600 flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Data pribadi dilindungi</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="text-slate-500 font-medium">Uraian Masalah yang Dilaporkan:</div>
                  <div className="text-slate-900 leading-relaxed whitespace-pre-line">
                    {complaintResult.description}
                  </div>
                </div>
              </div>

              {/* Staff Response Card */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-800">
                  Tindak Lanjut & Tanggapan Resmi Petugas Dindukcapil:
                </div>
                {complaintResult.response ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Tanggapan Resmi Petugas:</span>
                    </div>
                    <div className="text-emerald-950 leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded border border-emerald-100">
                      {complaintResult.response}
                    </div>
                    {complaintResult.response_updated_at && (
                      <div className="text-[11px] text-emerald-800">
                        Waktu Tanggapan:{' '}
                        {new Date(complaintResult.response_updated_at).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-700" />
                      <span>Laporan Sedang Dalam Antrean Penanganan</span>
                    </div>
                    <p className="text-blue-800 leading-relaxed text-[11px]">
                      Petugas loket dan verifikator administrasi kependudukan sedang menelaah laporan ini.
                      Silakan simpan nomor tiket dan lakukan pengecekan status secara berkala.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-rose-200 rounded-xl p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Nomor Tiket Tidak Ditemukan
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Sistem tidak menemukan data pengaduan dengan nomor tiket <strong>"{inputTicket}"</strong>.
                Pastikan Anda memasukkan nomor tiket dengan format yang benar (contoh: <code>PGD-20261024-XXXXXX</code>) atau ajukan pengaduan baru bila belum tercatat.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('pengaduan')}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-medium hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Buat Pengaduan Baru
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Helpful links */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <span>Butuh bantuan informasi persyaratan dokumen?</span>
        <button
          onClick={() => setActiveTab('konsultasi')}
          className="text-blue-700 hover:underline font-medium flex items-center gap-1"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>Tanya Asisten Konsultasi AI</span>
        </button>
      </div>
    </div>
  );
};
