/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Complaint } from '../types';
import { calculatePriorityScore } from '../logic/scoring';

interface RawComplaintSeed {
  id: string;
  ticket_number: string;
  created_at: string;
  category: Complaint['category'];
  description: string;
  name: string;
  phone: string;
  email?: string;
  status: Complaint['status'];
  response?: string;
  response_updated_at?: string;
  ai_analysis_status: Complaint['ai_analysis_status'];
  ai_summary: string;
  ai_topic: string;
  ai_sentiment: Complaint['ai_sentiment'];
  severity: number;
  service_impact: number;
  issue_label: string;
  frequency_30d: number;
  source: Complaint['source'];
  ai_recommendation?: string;
}

const SEED_DATA: RawComplaintSeed[] = [
  {
    id: 'cmp-001',
    ticket_number: 'PGD-20261024-8K2A1M',
    created_at: '2026-10-24T09:15:00Z',
    category: 'KTP-el',
    description: 'Blangko KTP-el di loket kecamatan habis sudah lebih dari 3 minggu, padahal saya sangat membutuhkan fisik KTP untuk keperluan validasi rekening bank dan BPJS darurat.',
    name: 'Warga Anonim (Kec. Timur)',
    phone: '081234567001',
    email: 'warga.anonim1@contoh.id',
    status: 'baru',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Keterlambatan pencetakan fisik KTP-el selama 3 minggu akibat kekosongan blangko menghambat administrasi perbankan.',
    ai_topic: 'Ketersediaan Blangko KTP-el',
    ai_sentiment: 'negatif',
    severity: 5,
    service_impact: 5,
    issue_label: 'Kekosongan Blangko KTP',
    frequency_30d: 12,
    source: 'simulasi',
    ai_recommendation: 'Prioritaskan pengiriman stok blangko darurat atau fasilitasi aktivasi IKD bagi pemohon perbankan.',
  },
  {
    id: 'cmp-002',
    ticket_number: 'PGD-20261023-4L9P2X',
    created_at: '2026-10-23T14:30:00Z',
    category: 'Kartu Keluarga',
    description: 'Terdapat kesalahan pengetikan nama ibu kandung pada Kartu Keluarga hasil cetak mandiri. Sudah mengajukan revisi online namun statusnya tertahan lebih dari 5 hari tanpa notifikasi.',
    name: 'Pelapor Adminduk 02',
    phone: '081398765002',
    status: 'diproses',
    response: 'Data permohonan perbaikan telah diverifikasi petugas operator. Pemohon dapat mengunduh ulang PDF KK ber-TTE mulai esok hari.',
    response_updated_at: '2026-10-24T10:00:00Z',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Kesalahan penulisan nama pada KK cetak mandiri dan lamanya verifikasi revisi online tanpa notifikasi.',
    ai_topic: 'Ralat Data Kartu Keluarga',
    ai_sentiment: 'negatif',
    severity: 3,
    service_impact: 4,
    issue_label: 'Keterlambatan Verifikasi KK',
    frequency_30d: 5,
    source: 'simulasi',
    ai_recommendation: 'Periksa berkas ijazah/buku nikah pendukung di dashboard operator dan percepat verifikasi perbaikan KK.',
  },
  {
    id: 'cmp-003',
    ticket_number: 'PGD-20261022-7T3V9K',
    created_at: '2026-10-22T11:05:00Z',
    category: 'IKD',
    description: 'Aplikasi Identitas Kependudukan Digital selalu gagal saat tahap pemindaian wajah (face recognition). Muncul pesan galat kamera tidak dapat diakses padahal izin kamera di Android sudah aktif.',
    name: 'Warga Pengguna IKD (Kec. Barat)',
    phone: '085211223003',
    email: 'user.ikd@contoh.id',
    status: 'baru',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Kendala teknis face recognition pada aplikasi IKD di perangkat Android meskipun izin kamera telah diberikan.',
    ai_topic: 'Galat Teknis Aplikasi IKD',
    ai_sentiment: 'negatif',
    severity: 3,
    service_impact: 3,
    issue_label: 'Aktivasi IKD Gagal Kamera',
    frequency_30d: 8,
    source: 'simulasi',
    ai_recommendation: 'Arahkan pemohon melakukan pembersihan cache aplikasi atau lakukan registrasi barcode langsung di loket kecamatan.',
  },
  {
    id: 'cmp-004',
    ticket_number: 'PGD-20261021-2M5N8Q',
    created_at: '2026-10-21T08:45:00Z',
    category: 'Akta Kelahiran',
    description: 'Pengajuan akta kelahiran anak baru lahir secara online sudah berstatus selesai, tetapi tautan unduh dokumen PDF rusak (Error 404 saat dibuka). Mohon kirimkan ulang file akta.',
    name: 'Orang Tua Pemohon',
    phone: '087812349004',
    status: 'selesai',
    response: 'Tautan unduhan dokumen telah diperbaiki dan file PDF Kutipan Akta Kelahiran ber-TTE telah dikirimkan ke email terdaftar.',
    response_updated_at: '2026-10-21T16:20:00Z',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Dokumen akta kelahiran online tidak dapat diunduh akibat tautan berkas rusak (Error 404).',
    ai_topic: 'Unduhan Dokumen Akta Kelahiran',
    ai_sentiment: 'netral',
    severity: 4,
    service_impact: 4,
    issue_label: 'Tautan Unduh Akta Rusak',
    frequency_30d: 3,
    source: 'simulasi',
    ai_recommendation: 'Kirimkan berkas PDF salinan akta ber-TTE via email pemohon dan laporkan bug tautan ke admin server SIAK.',
  },
  {
    id: 'cmp-005',
    ticket_number: 'PGD-20261020-9R6B3W',
    created_at: '2026-10-20T16:10:00Z',
    category: 'Pindah Datang',
    description: 'Surat Pindah (SKPWNI) dari daerah asal sudah diterbitkan, tetapi saat didaftarkan di loket dinas tujuan, data NIK belum terbaca di sistem SIAK terpusat sehingga proses pindah terhambat.',
    name: 'Warga Pindah Domisili',
    phone: '082155667005',
    email: 'pindah.warga@contoh.id',
    status: 'diproses',
    response: 'Petugas sedang melakukan konsolidasi data manual ke server pusat Ditjen Dukcapil Kemendagri.',
    response_updated_at: '2026-10-22T09:15:00Z',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Sinkronisasi data SKPWNI antar wilayah terhambat karena NIK belum terkonsolidasi di server SIAK terpusat.',
    ai_topic: 'Konsolidasi Data SKPWNI',
    ai_sentiment: 'negatif',
    severity: 4,
    service_impact: 5,
    issue_label: 'Sinkronisasi SIAK Pindah Datang',
    frequency_30d: 9,
    source: 'simulasi',
    ai_recommendation: 'Lakukan konsolidasi manual NIK ke data center Ditjen Dukcapil dan konfirmasikan status ke dinas asal.',
  },
  {
    id: 'cmp-006',
    ticket_number: 'PGD-20261019-1J7C4Z',
    created_at: '2026-10-19T13:20:00Z',
    category: 'Akta Kematian',
    description: 'Petugas kelurahan meminta surat pengantar dari RT/RW untuk pelaporan kematian, padahal informasi yang saya dengar dari media sosial dinas hal tersebut sudah tidak disyaratkan.',
    name: 'Keluarga Pelapor',
    phone: '081277889006',
    status: 'selesai',
    response: 'Telah dikonfirmasikan ke pihak kelurahan bahwa permohonan akta kematian tidak memerlukan pengantar RT/RW. Berkas pemohon telah diterima langsung.',
    response_updated_at: '2026-10-20T11:00:00Z',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Perbedaan pemahaman syarat pengantar RT/RW untuk pelaporan kematian antara petugas wilayah dan regulasi resmi.',
    ai_topic: 'Ketidaksesuaian Syarat Berkas',
    ai_sentiment: 'negatif',
    severity: 3,
    service_impact: 3,
    issue_label: 'Pungutan / Syarat Berlebih RT-RW',
    frequency_30d: 4,
    source: 'simulasi',
    ai_recommendation: 'Kirimkan edaran penegasan Standar Pelayanan ke kelurahan terkait bahwa pengantar RT/RW telah dihapus per Permendagri.',
  },
  {
    id: 'cmp-007',
    ticket_number: 'PGD-20261018-6H3K5V',
    created_at: '2026-10-18T10:00:00Z',
    category: 'Lainnya',
    description: 'Mohon penambahan jam layanan loket di hari Sabtu untuk warga pekerja yang tidak dapat mengurus perbaikan data di hari kerja.',
    name: 'Masyarakat Pekerja',
    phone: '089612345007',
    status: 'baru',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Aspirasi warga pekerja untuk pembukaan jam layanan loket administrasi kependudukan pada hari Sabtu.',
    ai_topic: 'Aspirasi Jam Pelayanan',
    ai_sentiment: 'positif',
    severity: 1,
    service_impact: 2,
    issue_label: 'Usulan Layanan Akhir Pekan',
    frequency_30d: 2,
    source: 'simulasi',
    ai_recommendation: 'Agendakan usulan layanan loket akhir pekan atau program jemput bola mingguan dalam rapat evaluasi triwulan dinas.',
  },
  {
    id: 'cmp-008',
    ticket_number: 'PGD-20261017-3E9Y2S',
    created_at: '2026-10-17T15:40:00Z',
    category: 'KTP-el',
    description: 'Perekaman KTP-el untuk lansia disabilitas di rumah (layanan jemput bola) sudah diajukan via kelurahan 2 minggu lalu namun belum ada jadwal kunjungan petugas ke rumah.',
    name: 'Keluarga Pemohon Disabilitas',
    phone: '081344556008',
    email: 'keluarga.lansia@contoh.id',
    status: 'diproses',
    response: 'Tim Layanan Jemput Bola Dindukcapil telah menjadwalkan kunjungan perekaman biometrik pada hari Kamis pekan ini.',
    response_updated_at: '2026-10-18T14:00:00Z',
    ai_analysis_status: 'berhasil',
    ai_summary: 'Permintaan percepatan penjadwalan layanan jemput bola perekaman biometrik KTP-el untuk lansia disabilitas.',
    ai_topic: 'Layanan Jemput Bola',
    ai_sentiment: 'netral',
    severity: 4,
    service_impact: 4,
    issue_label: 'Jadwal Layanan Jemput Bola',
    frequency_30d: 3,
    source: 'simulasi',
    ai_recommendation: 'Segera jadwalkan tim mobile biometrik ke alamat pemohon dan laporkan nomor kontak pendamping disabilitas.',
  },
];

export const INITIAL_DUMMY_COMPLAINTS: Complaint[] = SEED_DATA.map((seed) => {
  const { score, level } = calculatePriorityScore(
    seed.severity,
    seed.service_impact,
    seed.frequency_30d
  );
  return {
    ...seed,
    priority_score: score,
    priority_level: level,
  };
});
