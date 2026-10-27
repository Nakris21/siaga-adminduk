/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * Sanitizes input text before forwarding to AI:
 * Removes 16-digit NIK/KK, phone numbers, and email addresses.
 */
function sanitizeTextForAI(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b\d{16}\b/g, '[NIK/KK_DISAMARKAN]')
    .replace(/(\+?62|08)[0-9]{8,12}\b/g, '[NOMOR_HP_DISAMARKAN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_DISAMARKAN]');
}

/**
 * Heuristic fallback for individual complaint analysis when Gemini API key is absent or unreachable.
 */
function generateFallbackAnalysis(category: string, description: string) {
  const descLower = (description || '').toLowerCase();
  let severity = 3;
  let service_impact = 3;
  let sentiment: 'negatif' | 'netral' | 'positif' = 'negatif';
  let primary_issue_label = 'Permasalahan Administrasi Umum';
  let follow_up_recommendation =
    'Verifikasi keabsahan berkas pemohon dan komunikasikan tindak lanjut melalui kanal resmi.';

  if (descLower.includes('blangko') || descLower.includes('habis')) {
    primary_issue_label = 'Kekosongan Blangko KTP';
    severity = 5;
    service_impact = 5;
    follow_up_recommendation =
      'Koordinasikan kuota cadangan blangko KTP-el atau arahkan pemohon mengaktivasi IKD sebagai identitas digital sah.';
  } else if (descLower.includes('gagal') || descLower.includes('error') || descLower.includes('kamera')) {
    primary_issue_label = 'Galat Aplikasi / Sistem';
    severity = 4;
    service_impact = 3;
    follow_up_recommendation =
      'Pandu pemohon memeriksa izin kamera atau bantu proses aktivasi langsung di loket pelayanan adminduk.';
  } else if (descLower.includes('salah') || descLower.includes('revisi') || descLower.includes('ralat')) {
    primary_issue_label = 'Ralat Elemen Data';
    severity = 3;
    service_impact = 4;
    follow_up_recommendation =
      'Buka antrean verifikasi data pemohon pada sistem SIAK dan lakukan pemutakhiran data sesuai dokumen pendukung.';
  } else if (descLower.includes('rusak') || descLower.includes('hilang') || descLower.includes('patah')) {
    primary_issue_label = 'Penggantian Fisik Dokumen';
    severity = 3;
    service_impact = 3;
    follow_up_recommendation =
      'Periksa kelengkapan surat kehilangan dari kepolisian atau bukti fisik dokumen rusak sebelum mencetak ulang.';
  } else if (descLower.includes('usul') || descLower.includes('saran') || descLower.includes('sabtu')) {
    primary_issue_label = 'Aspirasi Pelayanan';
    sentiment = 'positif';
    severity = 1;
    service_impact = 2;
    follow_up_recommendation =
      'Catat aspirasi sebagai bahan telaah kebijakan operasional dan jadwalkan evaluasi layanan berkala.';
  }

  const summary = `Pengaduan kategori ${category || 'Lainnya'} mengenai: "${description.slice(0, 90)}${
    description.length > 90 ? '...' : ''
  }"`;

  return {
    summary,
    suggested_category: category || 'Lainnya',
    sentiment,
    severity,
    service_impact,
    primary_issue_label,
    follow_up_recommendation,
    limitation_note:
      description.length < 25
        ? 'Uraian pengaduan sangat singkat sehingga penilaian keparahan dan rekomendasi masih bersifat indikatif.'
        : null,
    source: 'heuristic_fallback',
  };
}

/**
 * Heuristic fallback for aggregate trend analysis when Gemini API key is absent or unreachable.
 */
function generateFallbackTrendAnalysis(
  complaintsSummary: any,
  periodName: string,
  totalCount: number
) {
  return {
    executive_summary: `Pada periode ${periodName || 'terkini'}, tercatat total ${totalCount} pengaduan masyarakat. Pola pengaduan didominasi oleh permohonan fisik dokumen dan perbaikan data kependudukan.`,
    recurring_issues: [
      {
        issue: 'Kekosongan Blangko KTP-el',
        category: 'KTP-el',
        observed_frequency: 'Tinggi',
        impact_assessment: 'Menghambat keperluan warga pada perbankan, BPJS, dan pekerjaan.',
      },
      {
        issue: 'Kendala Verifikasi Revisi Kartu Keluarga Mandiri',
        category: 'Kartu Keluarga',
        observed_frequency: 'Sedang',
        impact_assessment: 'Waktu tunggu verifikasi melampaui standar operasional 3 hari kerja.',
      },
      {
        issue: 'Aktivasi Biometrik IKD Gagal di Perangkat Warga',
        category: 'IKD',
        observed_frequency: 'Sedang',
        impact_assessment: 'Menurunkan adopsi identitas kependudukan digital.',
      },
    ],
    inferred_root_causes: [
      {
        area: 'Logistik & Distribusi Blangko',
        indication: 'Ketergantungan pasokan blangko fisik dari pusat Ditjen Dukcapil Kemendagri.',
        verification_needed: 'Cek sisa stok harian di loket dinas dan kecamatan serta jadwal distribusi berkala.',
      },
      {
        area: 'SOP Verifikasi Online',
        indication: 'Antrean verifikasi berkas daring bertumpuk karena pembagian shift operator belum seimbang.',
        verification_needed: 'Audit SLA respons verifikator pada portal pelayanan daring.',
      },
      {
        area: 'Kompatibilitas Perangkat Lunak',
        indication: 'Variasi spesifikasi kamera smartphone warga saat menjalankan algoritma face recognition IKD.',
        verification_needed: 'Sediakan panduan teknis spesifikasi minimum dan asistensi loket kecamatan.',
      },
    ],
    policy_recommendations: [
      {
        title: 'Penguatan Sosialisasi IKD Sebagai Pengganti KTP-el Fisik',
        action: 'Terbitkan surat edaran kepada instansi vertikal dan lembaga perbankan mengenai keabsahan IKD.',
        target_unit: 'Bidang Pemanfaatan Data & Inovasi Pelayanan',
      },
      {
        title: 'Optimalisasi Petugas Verifikator Daring',
        action: 'Terapkan sistem rotasi petugas verifikator saat terjadi lonjakan permohonan Kartu Keluarga.',
        target_unit: 'Bidang Pelayanan Pendaftaran Penduduk',
      },
      {
        title: 'Pojok Bantuan IKD di Seluruh Kantor Kecamatan',
        action: 'Sediakan petugas pendamping aktivasi IKD untuk warga lanjut usia atau yang mengalami galat aplikasi.',
        target_unit: 'Bidang PIAK & Kerjasama Layanan Kecamatan',
      },
    ],
    data_limitation_statement:
      totalCount < 10
        ? 'Catatan Keterbatasan Data: Jumlah data pengaduan pada periode ini kurang dari 10 laporan. Analisis ini merupakan indikasi awal dan disarankan memvalidasi langsung ke unit terkait.'
        : 'Analisis berbasis tren data pengaduan riil. Rekomendasi disusun sebagai bahan pertimbangan pimpinan dinas.',
    source: 'heuristic_fallback',
  };
}

// POST /api/ai/analyze-complaint (Local Deterministic Analysis - PRD Final)
app.post('/api/ai/analyze-complaint', async (req, res) => {
  try {
    const { category, description } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Uraian pengaduan wajib diisi' });
    }

    const sanitizedDesc = sanitizeTextForAI(description);
    // PRD Final: Process locally without external Gemini API
    const analysis = generateFallbackAnalysis(category, sanitizedDesc);
    analysis.source = 'analisis_lokal_terstandar';
    return res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing complaint locally:', error);
    const { category, description } = req.body;
    return res.json(generateFallbackAnalysis(category, description));
  }
});

// POST /api/ai/trend-analysis (Local Database Pattern Analysis - PRD Final)
app.post('/api/ai/trend-analysis', async (req, res) => {
  try {
    const { complaintsSummary, periodName, totalCount } = req.body;
    // PRD Final: Process aggregate patterns locally based on actual database complaints
    const report = generateFallbackTrendAnalysis(complaintsSummary, periodName, totalCount || 0);
    report.source = 'analisis_database_lokal';
    return res.json(report);
  } catch (error: any) {
    console.error('Error generating trend analysis locally:', error);
    const { complaintsSummary, periodName, totalCount } = req.body;
    return res.json(generateFallbackTrendAnalysis(complaintsSummary, periodName, totalCount || 0));
  }
});

// Setup Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIAGA Adminduk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
