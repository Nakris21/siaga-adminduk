/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Info,
  Loader2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { currentUser, loginStaff, logoutStaff, setActiveTab } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi Anda.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await loginStaff(email.trim(), password);
      if (!result.success) {
        setErrorMsg(result.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kendala jaringan saat menghubungi server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header Identitas Dindukcapil Brebes */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-xs border border-blue-200">
            <Building2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Dindukcapil Kabupaten Brebes
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Login Petugas
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              SIAGA Adminduk — Sistem Informasi Asistensi dan Pengaduan Administrasi Kependudukan
            </p>
          </div>
        </div>

        {/* Status Jika Sudah Login */}
        {currentUser ? (
          <div className="space-y-5 pt-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sesi Petugas Terautentikasi Aktif (Firebase Auth)</span>
              </div>

              <div className="text-xs text-emerald-950 space-y-1.5 bg-white/70 p-3 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nama Petugas:</span>
                  <span className="font-semibold text-slate-900">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email Terdaftar:</span>
                  <span className="font-mono text-slate-800">{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kewenangan / Role:</span>
                  <span className="font-bold text-blue-900 uppercase">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Unit Kerja:</span>
                  <span className="text-slate-800">{currentUser.unit}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex-1 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Buka Dashboard Petugas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={logoutStaff}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Login Petugas */
          <>
            {/* Pesan Kesalahan Bahasa Indonesia */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Input Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Email Petugas / Dinas
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh: petugas@dindukcapil.brebeskab.go.id"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Input Password dengan Toggle Tampilkan / Sembunyikan */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tombol Masuk dengan Indikator Loading & Mencegah Klik Ganda */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kredensial Firebase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke SIAGA Adminduk</span>
                  </>
                )}
              </button>
            </form>

            {/* Kebijakan Akun Petugas */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Kebijakan Keamanan & Autentikasi:</span>
              </div>
              <p className="leading-relaxed">
                Aplikasi ini tidak menyediakan registrasi akun publik. Seluruh akun petugas dibuat dan dikelola langsung melalui <strong>Firebase Authentication Console</strong> oleh Administrator Dindukcapil Kabupaten Brebes.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
