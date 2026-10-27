/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReferenceDoc, ChatMessage, Complaint, ComplaintCategory } from '../types';
import { maskSensitiveIdentifiers } from './validation';
import { calculatePriorityScore } from './scoring';

export interface ConsultationResponse {
  answer: string;
  citations: {
    title: string;
    documentNumber?: string;
    section?: string;
  }[];
  isFallback: boolean;
  maskedNotice?: string;
}

/**
 * Simulates grounded consultation against active official references (FR-02)
 * Ensures AI strictly answers from active references and provides citations.
 */
export function processConsultationQuestion(
  rawQuestion: string,
  references: ReferenceDoc[]
): ConsultationResponse {
  const { maskedText, detectedCount } = maskSensitiveIdentifiers(rawQuestion);
  const qLower = maskedText.toLowerCase();

  const activeRefs = references.filter((r) => r.active);

  let bestMatch: ReferenceDoc | null = null;
  let matchReason = '';

  // Matching logic against active official references
  if (qLower.includes('ktp') || qLower.includes('blangko') || qLower.includes('hilang') || qLower.includes('rusak')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-01' || r.title.toLowerCase().includes('ktp')) || null;
    matchReason = 'Prosedur penggantian KTP-el rusak atau hilang';
  } else if (qLower.includes('ikd') || qLower.includes('digital') || qLower.includes('wajah') || qLower.includes('aplikasi')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-04' || r.title.toLowerCase().includes('ikd')) || null;
    matchReason = 'Panduan aktivasi Identitas Kependudukan Digital (IKD)';
  } else if (qLower.includes('kk') || qLower.includes('keluarga') || qLower.includes('nama') || qLower.includes('hvs')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-02' || r.title.toLowerCase().includes('keluarga')) || null;
    matchReason = 'Penerbitan dan perubahan elemen data Kartu Keluarga';
  } else if (qLower.includes('lahir') || qLower.includes('kelahiran') || qLower.includes('terlambat')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-03' || r.title.toLowerCase().includes('kelahiran')) || null;
    matchReason = 'Pelaporan dan penerbitan Akta Kelahiran';
  } else if (qLower.includes('pindah') || qLower.includes('skpwni') || qLower.includes('domisili')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-05' || r.title.toLowerCase().includes('pindah')) || null;
    matchReason = 'Standar pelayanan surat pindah datang penduduk';
  } else if (qLower.includes('mati') || qLower.includes('kematian') || qLower.includes('meninggal')) {
    bestMatch = activeRefs.find((r) => r.id === 'ref-06' || r.title.toLowerCase().includes('kematian')) || null;
    matchReason = 'Layanan akta kematian dan pembaruan KK';
  } else {
    // General keyword search across reference text
    bestMatch =
      activeRefs.find(
        (r) =>
          r.title.toLowerCase().includes(qLower) ||
          r.text.toLowerCase().includes(qLower)
      ) || null;
  }

  const maskedNotice =
    detectedCount > 0
      ? `Perhatian: Terdeteksi ${detectedCount} nomor identitas sensitif (NIK/KK) yang telah disamarkan demi privasi data Anda.`
      : undefined;

  if (bestMatch) {
    const answer = `Berdasarkan dokumen resmi yang aktif (${bestMatch.title}):\n\n${bestMatch.text}\n\n*Catatan penting: Seluruh layanan administrasi kependudukan bebas pungutan biaya (Rp 0,-). Jawaban ini merupakan informasi awal dan bukan keputusan resmi Dindukcapil.*`;

    return {
      answer,
      citations: [
        {
          title: bestMatch.title,
          documentNumber: bestMatch.document_number,
          section: bestMatch.section,
        },
      ],
      isFallback: false,
      maskedNotice,
    };
  }

  // Fallback response when no active reference covers the inquiry (FR-02 acceptance criteria)
  const fallbackAnswer = `Mohon maaf, informasi terkait pertanyaan tersebut **belum tersedia** dalam dokumen referensi resmi aktif yang terverifikasi di aplikasi SIAGA Adminduk.\n\nSesuai standar operasional, sistem konsultasi AI tidak diperkenankan mengarang persyaratan, waktu, lokasi, maupun biaya layanan tanpa dasar regulasi tertulis.\n\nSilakan sampaikan pertanyaan atau kendala Anda melalui **Form Pengaduan** agar dapat ditelaah dan dijawab langsung oleh petugas Dindukcapil.`;

  return {
    answer: fallbackAnswer,
    citations: [],
    isFallback: true,
    maskedNotice,
  };
}

/**
 * Simulates structured AI complaint analysis (FR-07)
 */
export function analyzeComplaintContent(
  category: ComplaintCategory,
  description: string,
  existingComplaints: Complaint[]
): {
  ai_summary: string;
  ai_topic: string;
  ai_sentiment: 'negatif' | 'netral' | 'positif';
  severity: number;
  service_impact: number;
  issue_label: string;
  frequency_30d: number;
  priority_score: number;
  priority_level: 'tinggi' | 'sedang' | 'rendah';
} {
  const descLower = description.toLowerCase();

  let severity = 3;
  let service_impact = 3;
  let sentiment: 'negatif' | 'netral' | 'positif' = 'negatif';
  let issue_label = 'Permasalahan Administrasi Umum';
  let topic = `Pelayanan ${category}`;

  if (descLower.includes('blangko') || descLower.includes('habis')) {
    issue_label = 'Kekosongan Blangko KTP';
    severity = 5;
    service_impact = 5;
    topic = 'Ketersediaan Blangko KTP-el';
  } else if (descLower.includes('gagal') || descLower.includes('error') || descLower.includes('kamera')) {
    issue_label = 'Galat Aplikasi / Sistem';
    severity = 4;
    service_impact = 3;
    topic = 'Kendala Teknis Aplikasi';
  } else if (descLower.includes('salah') || descLower.includes('revisi') || descLower.includes('ralat')) {
    issue_label = 'Ralat Data Dokumen';
    severity = 3;
    service_impact = 4;
    topic = 'Perbaikan Elemen Data';
  } else if (descLower.includes('rusak') || descLower.includes('hilang')) {
    issue_label = 'Penggantian Fisik Dokumen';
    severity = 3;
    service_impact = 3;
    topic = 'Penggantian Dokumen Rusak/Hilang';
  } else if (descLower.includes('usul') || descLower.includes('saran') || descLower.includes('sabtu')) {
    issue_label = 'Aspirasi Pelayanan';
    sentiment = 'positif';
    severity = 1;
    service_impact = 2;
    topic = 'Usulan Peningkatan Layanan';
  }

  // Count similar issues in 30 days among existing complaints
  const similarCount = existingComplaints.filter(
    (c) =>
      c.issue_label.toLowerCase() === issue_label.toLowerCase() ||
      c.category === category
  ).length;
  const frequency_30d = Math.max(similarCount + 1, 1);

  const { score, level } = calculatePriorityScore(severity, service_impact, frequency_30d);

  const summary = `Pengaduan terkait ${topic.toLowerCase()} dengan uraian: "${description.slice(0, 80)}${description.length > 80 ? '...' : ''}"`;

  return {
    ai_summary: summary,
    ai_topic: topic,
    ai_sentiment: sentiment,
    severity,
    service_impact,
    issue_label,
    frequency_30d,
    priority_score: score,
    priority_level: level,
  };
}
