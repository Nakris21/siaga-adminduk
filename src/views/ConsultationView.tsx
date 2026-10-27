/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

export const ConsultationView: React.FC = () => {
  const { chatMessages, sendChatMessage, clearChat, references, setActiveTab } = useApp();
  const [inputText, setInputText] = useState('');
  const [privacyNoticeAcknowledged, setPrivacyNoticeAcknowledged] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRefCount = references.filter((r) => r.active).length;

  const quickQuestions = [
    'Bagaimana syarat ganti KTP-el yang rusak atau hilang?',
    'Bagaimana prosedur pembuatan Akta Kelahiran yang terlambat?',
    'Apa syarat dan cara aktivasi IKD (KTP Digital)?',
    'Bagaimana cara perubahan nama atau elemen data pada Kartu Keluarga?',
    'Apakah mengurus surat pindah (SKPWNI) butuh pengantar RT/RW?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handleQuickQuestion = (q: string) => {
    sendChatMessage(q);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Konsultasi Administrasi Kependudukan
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Asisten konsultasi berbasis basis pengetahuan resmi Dindukcapil (
            <span className="font-semibold text-slate-800">{activeRefCount} dokumen aktif</span>)
          </p>
        </div>

        <button
          onClick={clearChat}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Mulai Percakapan Baru</span>
        </button>
      </div>

      {/* FR-03 Privacy Warning Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-950">
            Peringatan Privasi Data Kependudukan (FR-03)
          </div>
          <p className="text-amber-800 leading-relaxed">
            Dilarang mencantumkan <strong>Nomor Induk Kependudukan (NIK 16 digit)</strong>,{' '}
            <strong>Nomor Kartu Keluarga</strong>, atau dokumen identitas asli dalam percakapan chat.
            Sistem kami menerapkan penyamaran otomatis jika terdeteksi deret angka sensitif demi keamanan data pribadi Anda.
          </p>
        </div>
      </div>

      {/* FR-04 Disclaimer Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Pemberitahuan Resmi:</strong> Jawaban yang dihasilkan asisten AI merupakan panduan informasi awal berdasarkan referensi regulasi yang tersimpan dan <em>bukan merupakan ketetapan hukum resmi Dindukcapil</em>. Seluruh pengurusan dokumen kependudukan resmi adalah <strong>Gratis (Rp 0,-)</strong>.
        </p>
      </div>

      {/* Quick Questions (FR-01) */}
      <div className="space-y-1.5 pt-1">
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Pertanyaan Cepat:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                <span>{isUser ? 'Anda' : 'SIAGA Asisten AI'}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-lg p-3.5 text-sm ${
                  isUser
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Citations block (FR-02 acceptance criteria) */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Dasar Referensi Resmi:</span>
                    </div>
                    {msg.citations.map((cite, i) => (
                      <div key={i} className="pl-5 text-slate-700">
                        <div className="font-medium">{cite.title}</div>
                        {(cite.documentNumber || cite.section) && (
                          <div className="text-[11px] text-slate-500">
                            {[cite.documentNumber, cite.section].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Action Link if inquiry is unhandled (FR-02) */}
                {msg.isFallback && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab('pengaduan')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      <span>Sampaikan Melalui Form Pengaduan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik pertanyaan terkait KTP-el, KK, Akta, IKD, atau Pindah Datang..."
          className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm font-medium cursor-pointer"
        >
          <span>Kirim</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Guidance footnote */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
        <span>Model konsultasi: Responsif terhadap referensi berstatus aktif.</span>
        <button
          onClick={() => setActiveTab('referensi')}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <BookOpen className="w-3 h-3" />
          <span>Lihat Dokumen Referensi Tersedia</span>
        </button>
      </div>
    </div>
  );
};
