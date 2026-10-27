/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  KeyRound,
  FileCode,
  Sparkles,
  Cpu,
  Check,
} from 'lucide-react';

export const TechnicalSpecView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Arsitektur & Matriks Kesiapan Teknis</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Spesifikasi Teknis & Status Rilis Final: SIAGA Adminduk v3.0
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Dokumentasi kebutuhan teknis, pemisahan arsitektur antarmuka, logika & akses data, serta transparansi fitur yang berfungsi nyata vs ditunda.
        </p>
      </div>

      {/* 1. Kebutuhan Teknis yang Perlu Dipastikan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-700" />
          <span>1. Landasan Arsitektur & Kebutuhan Teknis Terintegrasi</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-700" />
              <span>Analisis Lokal & Deterministik</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              - Bebas ketergantungan API pihak ketiga untuk analisis pengaduan.
              <br />
              - Analisis tren dan kategori dihitung langsung dari data pengaduan tersimpan.
              <br />
              - Rekomendasi otomatis terstruktur (Masalah, Data Pendukung, Alasan, Saran Perbaikan).
              <br />
              - Transparan, stabil, dan tidak mengalami halusinasi data.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Firebase Authentication</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              - Login Petugas berbasis email & kata sandi terverifikasi via Firebase Auth.
              <br />
              - Akses warga publik terbuka tanpa login untuk konsultasi dan pengajuan tiket.
              <br />
              - Menu Dashboard, Manajemen Pengaduan, dan Manajemen Referensi diproteksi penuh.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cloud Firestore Database</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              - Koleksi `complaints` & `references` tersimpan persisten secara realtime.
              <br />
              - Aturan keamanan `firestore.rules` membatasi akses baca data sensitif publik.
              <br />
              - Cek status pengaduan publik hanya menampilkan nomor tiket tanpa mengekspos data warga lain.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pemisahan Komponen Arsitektural */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-700" />
          <span>2. Pemisahan Arsitektur Kode (Clean Modular Separation)</span>
        </h2>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">Layer</th>
                <th className="px-3 py-2.5">Direktori / File</th>
                <th className="px-3 py-2.5">Tanggung Jawab (Separation of Concerns)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-3 py-2.5 font-bold text-blue-900">Data Model & Types</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">/src/types/index.ts</td>
                <td className="px-3 py-2.5">Definisi struktur data lengkap sesuai PRD v3.0 (Complaint, ReferenceDoc, StaffUser, ChatMessage).</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-blue-900">Akses Data (Repository)</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">/src/data/storage.ts</td>
                <td className="px-3 py-2.5">Antarmuka repository `IAppDataStore` memisahkan persistensi dari UI, mendukung Firestore dan fallback terisolasi.</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-blue-900">Logika Skor & Validasi</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">/src/logic/scoring.ts, validation.ts, ticket.ts</td>
                <td className="px-3 py-2.5">Rumus prioritas resmi: `(Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6)`, generator tiket unik, dan penyamaran privasi.</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-blue-900">Rekomendasi & Analisis Lokal</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">/src/logic/recommendations.ts, analytics.ts</td>
                <td className="px-3 py-2.5">Generator rekomendasi 4-elemen (Masalah, Data Pendukung, Alasan, Saran Perbaikan) berbasis data aktual tersimpan.</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-bold text-blue-900">Komponen Antarmuka</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">/src/views/* & /src/components/*</td>
                <td className="px-3 py-2.5">Konsultasi publik, Form Pengaduan, Cek Tiket, Dashboard KPI, Manajemen Pengaduan, Kelola Referensi, dan Sidebar responsif.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Matriks Status: Berfungsi Nyata vs Ditunda */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>3. Matriks Status: Fitur Berfungsi Nyata (Penyempurnaan Final)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Fitur Berfungsi Nyata */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fitur yang Sudah Berfungsi Penuh (100% Data Aktual):</span>
            </div>
            <ul className="space-y-1.5 text-emerald-950 text-[11px]">
              <li>✓ <strong>Analisis Lokal Pengaduan:</strong> Bebas Gemini API khusus analisis pengaduan, menghitung jumlah, kategori terbanyak, tren bulanan/triwulanan, dan masalah berulang dari database.</li>
              <li>✓ <strong>Dashboard Admin Dinamis:</strong> KPI total, baru, sedang diproses, selesai, grafik tren periodik (7h, 30h, 90h, semua), kategori terbanyak, dan tabel prioritas tinggi (skor &ge; 75).</li>
              <li>✓ <strong>Rumus Skor Prioritas Baku:</strong> `Skor = (Keparahan × 8) + (Dampak × 6) + (Frekuensi × 6)` dengan pemetaan frekuensi 30 hari (1=1, 2-3=2, 4-6=3, 7-10=4, &gt;10=5) dan verifikasi petugas.</li>
              <li>✓ <strong>Rekomendasi Tindak Lanjut Otomatis:</strong> Menghasilkan 4 elemen lengkap (Masalah, Data Pendukung, Alasan, Saran Perbaikan) tanpa mengarang asumsi.</li>
              <li>✓ <strong>Keamanan Akun & Data Pelapor:</strong> Firebase Authentication, proteksi data pribadi warga (nama/kontak terisolasi), dan public ticket check mandiri.</li>
              <li>✓ <strong>Konsultasi Publik & Referensi Resmi:</strong> Tanya jawab publik berdasar referensi aktif yang dikelola petugas secara realtime.</li>
            </ul>
          </div>

          {/* Fitur yang Ditunda */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Fitur yang Ditunda Sesuai Scope PRD v3.0:</span>
            </div>
            <ul className="space-y-1.5 text-amber-950 text-[11px]">
              <li>⏳ <strong>Ekspor / Impor CSV Pengaduan (D-02, D-03):</strong> Ekspor rekapitulasi data dan impor berkas lama dengan pemetaan kolom.</li>
              <li>⏳ <strong>Notifikasi Otomatis SMS / WhatsApp (D-04, D-05):</strong> Pengiriman pesan otomatis ke nomor HP pelapor (di luar scope MVP).</li>
              <li>⏳ <strong>Log Chat Konsultasi Warga:</strong> Audit trail percakapan warga untuk evaluasi kualitas jawaban (MVP sengaja membatasi untuk privasi).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Rekapitulasi Tahap Implementasi */}
      <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          Kemajuan Pengembangan SIAGA Adminduk Dindukcapil Brebes
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
            <div className="font-semibold text-emerald-400">Tahap 1 (Selesai)</div>
            <p className="text-slate-300 text-[11px]">
              Kerangka antarmuka responsif, konsultasi publik, form pengaduan, dan cek tiket.
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
            <div className="font-semibold text-emerald-400">Tahap 2 (Selesai)</div>
            <p className="text-slate-300 text-[11px]">
              Firebase Authentication, proteksi rute admin, dan aturan keamanan database.
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
            <div className="font-semibold text-emerald-400">Tahap 3 (Selesai)</div>
            <p className="text-slate-300 text-[11px]">
              Manajemen referensi dokumen regulasi dan navigasi sidebar responsif.
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1">
            <div className="font-semibold text-emerald-400">Tahap Final (Selesai)</div>
            <p className="text-slate-300 text-[11px]">
              Analisis pengaduan lokal, dashboard dinamis multi-periode, skor prioritas baku, dan rekomendasi otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
