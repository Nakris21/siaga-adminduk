/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReferenceDoc } from '../types';

export const INITIAL_DUMMY_REFERENCES: ReferenceDoc[] = [
  {
    id: 'ref-01',
    title: 'Standar Pelayanan Penerbitan KTP-el Penggantian Karena Rusak atau Hilang',
    document_type: 'standar_pelayanan',
    document_number: 'SP-DUKCAPIL-01/2025',
    document_date: '2025-01-15',
    year: '2025',
    summary: 'Ketentuan dan persyaratan pencetakan ulang KTP-el akibat rusak atau hilang tanpa pengantar RT/RW.',
    source_url: 'https://dindukcapil.brebeskab.go.id/layanan/ktp-el',
    section: 'Bab II Poin 3 (Penggantian Fisik KTP-el)',
    text: `1. Penggantian KTP-el rusak: Pemohon membawa KTP-el fisik yang rusak dan fotokopi Kartu Keluarga. Tidak perlu surat pengantar RT/RW.
2. Penggantian KTP-el hilang: Pemohon membawa Surat Keterangan Kehilangan dari Kepolisian setempat dan fotokopi Kartu Keluarga.
3. Waktu penyelesaian: Maksimal 1 (satu) hari kerja jika blangko tersedia dan jaringan SIAK terhubung.
4. Biaya: GRATIS (Rp 0,-). Seluruh layanan administrasi kependudukan dilarang memungut biaya apapun.`,
    active: true,
    updated_at: '2026-10-15T08:00:00Z',
    verified_by: 'Budi Santoso, S.IP (Verifikator Regulasi)',
  },
  {
    id: 'ref-02',
    title: 'Permendagri Nomor 108 Tahun 2019 tentang Pelaksanaan Perpres No. 96 Tahun 2018',
    document_type: 'peraturan',
    document_number: 'Permendagri No. 108/2019',
    document_date: '2019-12-10',
    year: '2019',
    summary: 'Peraturan Menteri Dalam Negeri terkait tata cara pendaftaran penduduk dan penerbitan Kartu Keluarga.',
    source_url: 'https://peraturan.bpk.go.id/Details/138656/permendagri-no-108-tahun-2019',
    section: 'Pasal 12 & 14 (Penerbitan dan Perubahan Kartu Keluarga)',
    text: `Penerbitan Kartu Keluarga (KK) baru atau perubahan data:
1. Penambahan anggota keluarga karena kelahiran: Mengisi formulir F-1.02, menyertakan Surat Keterangan Lahir dari dokter/bidan/penolong kelahiran, dan KK lama.
2. Perubahan data elemen kependudukan (nama, pendidikan, agama, pekerjaan): Melampirkan bukti pendukung yang sah (ijazah, surat penetapan pengadilan jika ganti nama, atau surat keterangan instansi terkait).
3. Penerbitan KK saat ini menggunakan kertas putih HVS 80gr ukuran A4 dengan Quick Response (QR) Code Tanda Tangan Elektronik (TTE) resmi, tidak lagi memerlukan legalisir basah.`,
    active: true,
    updated_at: '2026-10-10T10:30:00Z',
    verified_by: 'Ratna Dewi, M.H (Analis Kebijakan)',
  },
  {
    id: 'ref-03',
    title: 'SOP Pelaporan dan Penerbitan Akta Kelahiran Terlambat dan Baru',
    document_type: 'sop',
    document_number: 'SOP-CS-AKTA-04',
    document_date: '2024-06-20',
    year: '2024',
    summary: 'Prosedur operasional standar pencatatan kelahiran anak dan penegasan bebas denda keterlambatan.',
    section: 'Standar Operasional Prosedur Pencatatan Kelahiran',
    text: `Persyaratan Pencatatan Kelahiran:
1. Surat Keterangan Lahir dari fasilitas kesehatan/dokter/bidan/penolong kelahiran.
2. Buku Nikah / Kutipan Akta Perkawinan orang tua.
3. Kartu Keluarga (KK) dan KTP-el kedua orang tua.
4. Berita Acara Kepolisian bagi anak yang tidak diketahui asal-usulnya.
5. Jika pelaporan melampaui batas 60 hari sejak kelahiran, tetap diproses di Dindukcapil tanpa denda administrasi (sesuai putusan MK dan regulasi terkini). Pengurusan dapat diajukan secara daring atau loket terpadu.`,
    active: true,
    updated_at: '2026-09-28T14:15:00Z',
    verified_by: 'Budi Santoso, S.IP (Verifikator Regulasi)',
  },
  {
    id: 'ref-04',
    title: 'Panduan Resmi dan FAQ Aktivasi Identitas Kependudukan Digital (IKD)',
    document_type: 'faq_resmi',
    document_number: 'FAQ-IKD-2025/11',
    document_date: '2025-02-01',
    year: '2025',
    summary: 'Tanya jawab resmi mengenai tata cara aktivasi aplikasi IKD (KTP Digital) pada ponsel cerdas.',
    source_url: 'https://dukcapil.kemendagri.go.id/layanan/ikd',
    section: 'Petunjuk Teknis Aktivasi Digital ID',
    text: `Syarat dan Alur Aktivasi IKD (KTP Digital):
1. Memiliki KTP-el fisik atau sudah pernah melakukan perekaman biometrik.
2. Memiliki ponsel pintar (smartphone) berbasis Android atau iOS dengan koneksi internet aktif.
3. Memiliki nomor HP dan alamat email aktif pribadi yang belum pernah digunakan akun IKD lain.
4. Unduh aplikasi 'Identitas Kependudukan Digital' resmi Kemendagri dari Google Play Store / App Store.
5. Masukkan data identitas, lakukan swafoto verifikasi wajah (face recognition).
6. Pindai QR Code aktivasi di kantor Dindukcapil kecamatan/kabupaten melalui petugas registrasi atau mesin anjungan mandiri.`,
    active: true,
    updated_at: '2026-10-20T09:00:00Z',
    verified_by: 'Hendri Kurnia, S.Kom (Pranata Komputer)',
  },
  {
    id: 'ref-05',
    title: 'Standar Pelayanan Perpindahan Penduduk Keluar dan Datang (SKPWNI)',
    document_type: 'standar_pelayanan',
    document_number: 'SP-PINDAH-03/2024',
    document_date: '2024-08-11',
    year: '2024',
    summary: 'Standar pengurusan surat pindah domisili antar kab/kota dan antar provinsi tanpa pengantar RT/RW.',
    section: 'Bab III Layanan Pindah Datang',
    text: `Prosedur Surat Keterangan Pindah Warga Negara Indonesia (SKPWNI):
1. Pemohon hanya perlu membawa fotokopi Kartu Keluarga dan mengisi formulir F-1.03.
2. Tidak diperlukan lagi surat pengantar RT, RW, Kelurahan, maupun Kecamatan sesuai Perpres No. 96 Tahun 2018.
3. Bagi pemohon pindah dalam satu kabupaten/kota atau antar-provinsi, pengurusan dapat diselesaikan langsung di Dinas Kependudukan dan Pencatatan Sipil.
4. Dokumen SKPWNI diterbitkan dalam format digital PDF dengan TTE yang dapat dicetak mandiri.`,
    active: true,
    updated_at: '2026-08-15T11:45:00Z',
    verified_by: 'Ratna Dewi, M.H (Analis Kebijakan)',
  },
  {
    id: 'ref-06',
    title: 'SOP Penerbitan Akta Kematian dan Penghapusan Data dari Kartu Keluarga',
    document_type: 'sop',
    document_number: 'SOP-CS-KEMATIAN-07',
    document_date: '2024-05-18',
    year: '2024',
    summary: 'Pelayanan paket 3-in-1 saat pelaporan kematian: Akta Kematian, KK baru, dan KTP-el status baru.',
    section: 'Layanan Terintegrasi 3-in-1 Kematian',
    text: `Persyaratan Pelaporan Kematian:
1. Surat Kematian dari Rumah Sakit/Puskesmas/Dokter atau Surat Keterangan Kematian dari Kepala Desa/Lurah (F-2.01).
2. Kartu Keluarga dan KTP-el asli jenazah.
3. Fotokopi KTP-el pelapor dan 2 orang saksi.
4. Hasil keluaran layanan adalah paket 3-in-1: Kutipan Akta Kematian, Kartu Keluarga baru keluarga yang ditinggalkan, dan KTP-el status cerai mati bagi pasangan hidup.
5. Seluruh proses GRATIS tanpa biaya retribusi.`,
    active: false, // Inactive example to demonstrate active/inactive toggle
    updated_at: '2026-07-10T16:20:00Z',
    verified_by: 'Budi Santoso, S.IP (Verifikator Regulasi)',
  },
  {
    id: 'ref-07',
    title: 'Surat Edaran Dirjen Dukcapil No. 470/13287/Dukcapil tentang Pemanfaatan Kertas Putih A4 80gr',
    document_type: 'lainnya',
    document_number: 'SE Dirjen Dukcapil No. 470/13287/2021',
    document_date: '2021-09-08',
    year: '2021',
    summary: 'Instruksi resmi pencetakan mandiri seluruh dokumen kependudukan (kecuali KTP-el & KIA) dengan kertas putih HVS A4.',
    section: 'Poin 2 Pemanfaatan Dokumen TTE',
    text: `Ketentuan Pencetakan Dokumen Kependudukan:
1. Semua dokumen administrasi kependudukan selain KTP-el dan Kartu Identitas Anak (KIA) dicetak menggunakan kertas putih HVS A4 80 gram.
2. Dokumen yang dilengkapi QR Code Tanda Tangan Elektronik (TTE) merupakan dokumen otentik berkekuatan hukum sah tanpa memerlukan cap/stempel basah.
3. Lembaga perbankan, instansi kesehatan, dan dinas wajib menerima salinan dokumen ber-TTE tanpa meminta legalisir ulang.`,
    active: true,
    updated_at: '2026-10-18T10:00:00Z',
    verified_by: 'Ratna Dewi, M.H (Analis Kebijakan)',
  },
];
