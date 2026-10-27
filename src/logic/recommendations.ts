/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Complaint, ComplaintCategory } from '../types';

export interface StructuredRecommendation {
  id: string;
  masalah: string;
  kategori: ComplaintCategory | string;
  tingkatUrgensi: 'Tinggi' | 'Sedang' | 'Rendah';
  dataPendukung: string;
  alasan: string;
  saranPerbaikan: string[];
  totalKasus: number;
  kasusPrioritasTinggi: number;
  kasusBelumSelesai: number;
}

export interface LocalAnalysisSummary {
  periodLabel: string;
  totalComplaints: number;
  topCategory: { category: string; count: number; percentage: number } | null;
  highPriorityCount: number;
  highPriorityPercentage: number;
  recurringIssuesCount: number;
  recommendations: StructuredRecommendation[];
  dataLimitationNotice: string;
}

/**
 * Generates automated, deterministic follow-up recommendations based strictly
 * on actual complaints stored in the database.
 * Each recommendation provides: Masalah, Data Pendukung, Alasan, and Saran Perbaikan.
 * Zero hallucination - all numbers come directly from filtered complaints.
 */
export function generateLocalRecommendations(
  complaints: Complaint[],
  periodLabel: string
): LocalAnalysisSummary {
  const total = complaints.length;

  if (total === 0) {
    return {
      periodLabel,
      totalComplaints: 0,
      topCategory: null,
      highPriorityCount: 0,
      highPriorityPercentage: 0,
      recurringIssuesCount: 0,
      recommendations: [],
      dataLimitationNotice:
        'Belum ada data pengaduan pada periode yang dipilih. Sistem tidak dapat menghasilkan rekomendasi tanpa data riil.',
    };
  }

  // Count high priority
  const highPriorityComplaints = complaints.filter((c) => c.priority_level === 'tinggi');
  const highPriorityCount = highPriorityComplaints.length;
  const highPriorityPercentage = Math.round((highPriorityCount / total) * 100);

  // Category counts
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const topCategoryEntry = sortedCategories[0];
  const topCategory = topCategoryEntry
    ? {
        category: topCategoryEntry[0],
        count: topCategoryEntry[1],
        percentage: Math.round((topCategoryEntry[1] / total) * 100),
      }
    : null;

  // Group by issue label or category to detect recurring problems
  const issueClusters: Record<
    string,
    {
      label: string;
      category: ComplaintCategory;
      complaints: Complaint[];
    }
  > = {};

  complaints.forEach((c) => {
    const key = (c.issue_label || c.category).trim();
    if (!issueClusters[key]) {
      issueClusters[key] = {
        label: key,
        category: c.category,
        complaints: [],
      };
    }
    issueClusters[key].complaints.push(c);
  });

  // Sort clusters by count descending, then by priority score
  const sortedClusters = Object.values(issueClusters).sort((a, b) => {
    if (b.complaints.length !== a.complaints.length) {
      return b.complaints.length - a.complaints.length;
    }
    const avgScoreB =
      b.complaints.reduce((acc, curr) => acc + curr.priority_score, 0) / b.complaints.length;
    const avgScoreA =
      a.complaints.reduce((acc, curr) => acc + curr.priority_score, 0) / a.complaints.length;
    return avgScoreB - avgScoreA;
  });

  const recommendations: StructuredRecommendation[] = [];

  // Build recommendations for the top clusters
  sortedClusters.slice(0, 4).forEach((cluster, idx) => {
    const count = cluster.complaints.length;
    const highInCluster = cluster.complaints.filter((c) => c.priority_level === 'tinggi').length;
    const unresolvedInCluster = cluster.complaints.filter((c) => c.status !== 'selesai').length;
    const avgScore = Math.round(
      cluster.complaints.reduce((acc, curr) => acc + curr.priority_score, 0) / count
    );

    const clusterLower = cluster.label.toLowerCase();
    const category = cluster.category;

    let masalah = `Masalah Pelayanan ${cluster.label}`;
    let alasan = '';
    let saranPerbaikan: string[] = [];
    let tingkatUrgensi: 'Tinggi' | 'Sedang' | 'Rendah' =
      highInCluster > 0 || avgScore >= 75 ? 'Tinggi' : avgScore >= 50 ? 'Sedang' : 'Rendah';

    if (clusterLower.includes('blangko') || clusterLower.includes('ktp')) {
      masalah = 'Keterbatasan Ketersediaan Blangko KTP-el Fisik';
      alasan =
        'Ketiadaan fisik blangko KTP-el secara langsung menghambat warga yang membutuhkan verifikasi dokumen mendesak pada perbankan, BPJS darurat, dan pendaftaran kerja.';
      saranPerbaikan = [
        'Ajukan permohonan penambahan kuota darurat blangko KTP-el ke Ditjen Dukcapil Kemendagri.',
        'Wajibkan petugas loket mendampingi aktivasi IKD (Identitas Kependudukan Digital) bagi warga sebagai identitas digital resmi sesuai Permendagri No. 72/2022.',
        'Sosialisasikan surat edaran ke perbankan, BPJS, dan instansi daerah di Kabupaten Brebes mengenai legalitas IKD sebagai pengganti KTP-el fisik.',
      ];
    } else if (
      clusterLower.includes('ikd') ||
      clusterLower.includes('kamera') ||
      clusterLower.includes('aplikasi')
    ) {
      masalah = 'Kendala Teknis Registrasi & Aktivasi IKD (KTP Digital)';
      alasan =
        'Kegagalan face recognition atau pemindaian barcode pada smartphone warga menghambat target transformasi digital adminduk dan menimbulkan frustrasi warga di loket.';
      saranPerbaikan = [
        'Sediakan "Pojok Bantuan IKD" di dinas dan seluruh kantor kecamatan dengan pencahayaan memadai dan panduan perizinan kamera smartphone.',
        'Buat materi panduan visual (infografis/video singkat) langkah pembersihan cache aplikasi dan pembaruan versi IKD terbaru.',
        'Pastikan operator loket siap melakukan aktivasi manual dengan perangkat pendukung dinas apabila perangkat warga tidak kompatibel.',
      ];
    } else if (
      clusterLower.includes('kk') ||
      clusterLower.includes('keluarga') ||
      clusterLower.includes('ralat') ||
      clusterLower.includes('verifikasi')
    ) {
      masalah = 'Keterlambatan atau Kendala Verifikasi Perubahan Kartu Keluarga';
      alasan =
        'Waktu tunggu penandatanganan elektronik (TTE) atau revisi elemen data KK melampaui batas standar pelayanan operasional 3 hari kerja, memicu komplain berulang.';
      saranPerbaikan = [
        'Evaluasi antrean verifikasi pada portal SIAK Terpusat dan terapkan rotasi tugas verifikator pada jam sibuk.',
        'Beri konfirmasi notifikasi atau batas estimasi jelas pada pemohon apabila dokumen pendukung (ijazah/buku nikah) belum terbaca dengan jelas.',
        'Prioritaskan verifikasi berkas permohonan KK yang telah tertunda lebih dari 48 jam.',
      ];
    } else if (
      clusterLower.includes('akta') ||
      clusterLower.includes('lahir') ||
      clusterLower.includes('mati')
    ) {
      masalah = 'Penerbitan Dokumen Pencatatan Sipil (Akta Kelahiran / Kematian)';
      alasan =
        'Kelengkapan berkas saksi atau surat keterangan kelahiran/kematian sering menjadi hambatan komunikasi antara pemohon dan operator loket.';
      saranPerbaikan = [
        'Sosialisasikan formulir SPTJM (Surat Pernyataan Tanggung Jawab Mutlak) sebagai solusi alternatif bila surat keterangan medis tidak tersedia.',
        'Percepat integrasi layanan 3-in-1 (terbit Akta Kelahiran sekaligus pembaruan KK dan KIA).',
      ];
    } else if (
      clusterLower.includes('pindah') ||
      clusterLower.includes('skpwni') ||
      clusterLower.includes('sinkron')
    ) {
      masalah = 'Sinkronisasi Surat Keterangan Pindah Warga Negara Indonesia (SKPWNI)';
      alasan =
        'Data kepindahan antar-kabupaten/provinsi yang belum terkonsolidasi di server pusat Kemendagri dapat menggantungkan status kependudukan dan hak jaminan sosial warga.';
      saranPerbaikan = [
        'Lakukan konsolidasi manual NIK via dashboard pemantauan SIAK Kemendagri untuk data yang belum sinkron dalam 1x24 jam.',
        'Komunikasikan nomor resi SKPWNI dan panduan pelaporan ke daerah tujuan secara transparan kepada pemohon.',
      ];
    } else {
      masalah = `Penanganan Keluhan Layanan ${cluster.category}: ${cluster.label}`;
      alasan =
        'Akumulasi keluhan pada topik ini mengindikasikan adanya celah komunikasi alur pelayanan atau ketidaksesuaian ekspektasi warga terhadap durasi penyelesaian.';
      saranPerbaikan = [
        'Lakukan audit alur pelayanan internal pada unit penanganan terkait.',
        'Perbarui informasi persyaratan dan prosedur pada papan pengumuman dinas serta menu Referensi SIAGA Adminduk.',
        'Selesaikan pengaduan yang belum tuntas dengan menghubungi pemohon melalui kontak yang tercatat.',
      ];
    }

    const dataPendukung = `Tercatat ${count} laporan (${Math.round(
      (count / total) * 100
    )}% dari total ${total} pengaduan periode ini); ${highInCluster} laporan berkategori Prioritas Tinggi (skor rata-rata ${avgScore}); ${unresolvedInCluster} pengaduan saat ini berstatus belum selesai.`;

    recommendations.push({
      id: `rec-${idx + 1}`,
      masalah,
      kategori: category,
      tingkatUrgensi,
      dataPendukung,
      alasan,
      saranPerbaikan,
      totalKasus: count,
      kasusPrioritasTinggi: highInCluster,
      kasusBelumSelesai: unresolvedInCluster,
    });
  });

  const dataLimitationNotice =
    total < 10
      ? `Catatan Keterbatasan Data: Jumlah pengaduan pada filter ini adalah ${total} laporan. Hasil analisis dan rekomendasi merupakan indikasi awal terukur dan disarankan diverifikasi langsung oleh petugas unit terkait.`
      : `Analisis terukur dari ${total} pengaduan tersimpan dalam database. Rekomendasi dihitung secara deterministik untuk mendukung telaah kebijakan pimpinan Dindukcapil.`;

  return {
    periodLabel,
    totalComplaints: total,
    topCategory,
    highPriorityCount,
    highPriorityPercentage,
    recurringIssuesCount: sortedClusters.filter((c) => c.complaints.length > 1).length,
    recommendations,
    dataLimitationNotice,
  };
}

/**
 * Objective rule-based determination for complaint initial severity, impact, and issue label.
 * Eliminates external Gemini API call while strictly enforcing objective standards.
 */
export function analyzeComplaintDeterministically(
  category: ComplaintCategory,
  description: string
): {
  summary: string;
  suggested_category: ComplaintCategory;
  sentiment: 'negatif' | 'netral' | 'positif';
  severity: number;
  service_impact: number;
  primary_issue_label: string;
  follow_up_recommendation: string;
  limitation_note?: string;
  rule_applied: string;
} {
  const descLower = (description || '').toLowerCase();

  let severity = 3;
  let service_impact = 3;
  let sentiment: 'negatif' | 'netral' | 'positif' = 'negatif';
  let primary_issue_label = 'Permasalahan Administrasi Umum';
  let follow_up_recommendation =
    'Verifikasi data pemohon pada sistem SIAK Terpusat dan komunikasikan tindak lanjut ke nomor kontak pelapor.';
  let rule_applied = 'Aturan Standar Layanan Adminduk';

  // Rule 1: KTP Blangko Habis (Critical severity 5, impact 5)
  if (
    descLower.includes('blangko') ||
    descLower.includes('habis') ||
    descLower.includes('kosong') ||
    descLower.includes('material ktp')
  ) {
    primary_issue_label = 'Kekosongan Blangko KTP';
    severity = 5;
    service_impact = 5;
    rule_applied = 'Aturan Logistik Kritis: Ketiadaan Blangko KTP-el Fisik (Keparahan 5, Dampak 5)';
    follow_up_recommendation =
      'Eskalasi ketersediaan kuota blangko ke Ditjen Dukcapil dan tawarkan aktivasi IKD (KTP Digital) sebagai identitas sah alternatif.';
  }
  // Rule 2: IKD / Kamera / Error Aplikasi (Severity 4, impact 3)
  else if (
    descLower.includes('ikd') ||
    descLower.includes('kamera') ||
    descLower.includes('scan') ||
    descLower.includes('gagal aktivasi') ||
    descLower.includes('error') ||
    descLower.includes('aplikasi')
  ) {
    primary_issue_label = 'Kendala Teknis IKD / Aplikasi';
    severity = 4;
    service_impact = 3;
    rule_applied = 'Aturan Kendala Digital: Galat Aktivasi IKD / Aplikasi (Keparahan 4, Dampak 3)';
    follow_up_recommendation =
      'Pandu pemohon melakukan reset cache aplikasi atau arahkan ke loket pelayanan kecamatan untuk aktivasi tatap muka.';
  }
  // Rule 3: Keterlambatan / TTE / Verifikasi tertunda (Severity 3, impact 4)
  else if (
    descLower.includes('lama') ||
    descLower.includes('terlambat') ||
    descLower.includes('belum jadi') ||
    descLower.includes('belum diverifikasi') ||
    descLower.includes('tertahan') ||
    descLower.includes('tte')
  ) {
    primary_issue_label = 'Keterlambatan Verifikasi Berkas';
    severity = 3;
    service_impact = 4;
    rule_applied =
      'Aturan Waktu Pelayanan: Melebihi Batas SLA Standar Operasional (Keparahan 3, Dampak 4)';
    follow_up_recommendation =
      'Buka antrean permohonan pada aplikasi SIAK, cek kelengkapan dokumen pendukung, dan percepat penandatanganan elektronik (TTE).';
  }
  // Rule 4: Ralat Elemen Data / Salah Ketik (Severity 3, impact 3)
  else if (
    descLower.includes('salah') ||
    descLower.includes('ralat') ||
    descLower.includes('revisi') ||
    descLower.includes('beda nik') ||
    descLower.includes('keliru')
  ) {
    primary_issue_label = 'Ralat Elemen Data Kependudukan';
    severity = 3;
    service_impact = 3;
    rule_applied = 'Aturan Perbaikan Data: Ketidaksesuaian Elemen Data Warga (Keparahan 3, Dampak 3)';
    follow_up_recommendation =
      'Periksa dokumen autentik pendukung (ijazah/buku nikah) dan lakukan pemutakhiran data kependudukan.';
  }
  // Rule 5: Penggantian Rusak / Hilang (Severity 3, impact 2)
  else if (descLower.includes('hilang') || descLower.includes('rusak') || descLower.includes('patah')) {
    primary_issue_label = 'Penggantian Dokumen Rusak/Hilang';
    severity = 3;
    service_impact = 2;
    rule_applied = 'Aturan Penggantian Fisik: Dokumen Rusak atau Hilang (Keparahan 3, Dampak 2)';
    follow_up_recommendation =
      'Verifikasi surat kehilangan kepolisian (untuk dokumen hilang) atau bukti fisik dokumen rusak untuk cetak ulang.';
  }
  // Rule 6: Surat Pindah / SKPWNI (Severity 4, impact 4)
  else if (descLower.includes('pindah') || descLower.includes('skpwni') || descLower.includes('domisili')) {
    primary_issue_label = 'Sinkronisasi Surat Pindah (SKPWNI)';
    severity = 4;
    service_impact = 4;
    rule_applied =
      'Aturan Pendaftaran Penduduk: Konsolidasi Surat Pindah Datang (Keparahan 4, Dampak 4)';
    follow_up_recommendation =
      'Lakukan penelusuran status SKPWNI di sistem terpusat dan pastikan data siap diterbitkan di daerah tujuan.';
  }
  // Rule 7: Aspirasi / Pujian Layanan (Severity 1, impact 2)
  else if (
    descLower.includes('usul') ||
    descLower.includes('saran') ||
    descLower.includes('terima kasih') ||
    descLower.includes('bagus') ||
    descLower.includes('apresiasi')
  ) {
    primary_issue_label = 'Aspirasi & Evaluasi Layanan';
    sentiment = 'positif';
    severity = 1;
    service_impact = 2;
    rule_applied = 'Aturan Aspirasi: Masukan Konstruktif atau Apresiasi Warga (Keparahan 1, Dampak 2)';
    follow_up_recommendation =
      'Catat masukan warga sebagai bahan evaluasi perbaikan jam dan sarana pelayanan Dindukcapil.';
  }

  const cleanDesc = description.trim();
  const summary = `Pengaduan terkait ${category} mengenai: "${cleanDesc.slice(0, 95)}${
    cleanDesc.length > 95 ? '...' : ''
  }"`;

  const limitation_note =
    cleanDesc.length < 25
      ? 'Uraian pengaduan singkat (< 25 karakter). Penilaian keparahan dan dampak awal bersifat indikatif dan dianjurkan ditinjau oleh petugas.'
      : undefined;

  return {
    summary,
    suggested_category: category,
    sentiment,
    severity,
    service_impact,
    primary_issue_label,
    follow_up_recommendation,
    limitation_note,
    rule_applied,
  };
}
