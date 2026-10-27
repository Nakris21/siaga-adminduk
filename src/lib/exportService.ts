/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from 'docx';
import { Complaint } from '../types';
import { generateLocalRecommendations } from '../logic/recommendations';

/**
 * Filter complaints strictly between startDate and endDate (inclusive of full days).
 */
export function filterComplaintsByCustomDateRange(
  complaints: Complaint[],
  startDateStr: string,
  endDateStr: string
): Complaint[] {
  if (!startDateStr && !endDateStr) {
    return complaints;
  }

  const start = startDateStr ? new Date(`${startDateStr}T00:00:00.000`) : new Date(0);
  const end = endDateStr ? new Date(`${endDateStr}T23:59:59.999`) : new Date('2099-12-31T23:59:59.999');

  const startTime = start.getTime();
  const endTime = end.getTime();

  return complaints.filter((c) => {
    if (!c.created_at) return false;
    const itemDate = new Date(c.created_at).getTime();
    return itemDate >= startTime && itemDate <= endTime;
  });
}

/**
 * Format ISO date string into Indonesian human-readable date.
 * Example: "27 Oktober 2026, 14:30 WIB" or "27/10/2026"
 */
export function formatIndonesianDate(isoString?: string, withTime: boolean = false): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    if (!withTime) {
      return `${day} ${month} ${year}`;
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  } catch {
    return isoString;
  }
}

/**
 * Calculate completion duration between created_at and completion date.
 * If unfinished, returns "Belum selesai (X hari berjalan)".
 */
export function calculateCompletionDuration(
  createdAt?: string,
  completedAt?: string,
  status?: string
): string {
  if (!createdAt) return '-';

  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return '-';

  if (status === 'selesai') {
    const finishedTime = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diffMs = Math.max(0, finishedTime - createdTime);

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    if (days === 0 && remainingHours === 0) {
      return '< 1 jam';
    }
    if (days === 0) {
      return `${remainingHours} jam`;
    }
    if (remainingHours === 0) {
      return `${days} hari`;
    }
    return `${days} hari ${remainingHours} jam`;
  } else {
    // Unfinished: consistently display status and running duration
    const diffMs = Math.max(0, Date.now() - createdTime);
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) {
      return 'Belum selesai (< 1 hari berjalan)';
    }
    return `Belum selesai (${totalDays} hari berjalan)`;
  }
}

/**
 * Trigger file download helper using Blob
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download Excel (.xlsx) report of complaints.
 * Contains required columns:
 * 1. Tanggal Pengaduan
 * 2. Nama Pelapor
 * 3. Uraian Pengaduan
 * 4. Respons Petugas
 * 5. Tanggal Selesai
 * 6. Status Pengaduan
 * 7. Durasi Penyelesaian
 */
export function exportComplaintsToExcel(
  complaints: Complaint[],
  startDateStr: string,
  endDateStr: string
): void {
  const formattedStart = formatIndonesianDate(startDateStr);
  const formattedEnd = formatIndonesianDate(endDateStr);
  const exportDate = formatIndonesianDate(new Date().toISOString(), true);

  // Metadata headers
  const headerData = [
    ['PEMERINTAH KABUPATEN BREBES'],
    ['DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL'],
    ['SIAGA ADMINDUK - SISTEM INFORMASI ASISTENSI & PENGADUAN ADMINISTRASI KEPENDUDUKAN'],
    ['REKAPITULASI PENANGANAN PENGADUAN MASYARAKAT'],
    [''],
    ['Periode Data:', `${formattedStart} s.d. ${formattedEnd}`],
    ['Tanggal Cetak / Ekspor:', exportDate],
    ['Total Data Pengaduan:', `${complaints.length} Laporan`],
    [''],
  ];

  // Table Column Headers (Strictly fulfills requested columns + ticket & category for clarity)
  const tableHeaders = [
    'No',
    'Tanggal Pengaduan',
    'Nomor Tiket',
    'Nama Pelapor',
    'Kategori',
    'Uraian Pengaduan',
    'Respons Petugas',
    'Tanggal Selesai',
    'Status Pengaduan',
    'Durasi Penyelesaian',
    'Prioritas',
  ];

  const tableRows = complaints.map((c, index) => {
    const tanggalPengaduan = formatIndonesianDate(c.created_at, true);
    const namaPelapor = c.name || '-';
    const uraianPengaduan = c.description || '-';
    const responsPetugas = c.response || 'Belum ada tanggapan';
    const tanggalSelesai =
      c.status === 'selesai' && c.response_updated_at
        ? formatIndonesianDate(c.response_updated_at, true)
        : '-';
    const statusPengaduan =
      c.status === 'baru'
        ? 'Baru'
        : c.status === 'diproses'
        ? 'Sedang Diproses'
        : 'Selesai';
    const durasiPenyelesaian = calculateCompletionDuration(
      c.created_at,
      c.response_updated_at,
      c.status
    );
    const prioritas = `${c.priority_level?.toUpperCase() || 'SEDANG'} (${c.priority_score || 0})`;

    return [
      index + 1,
      tanggalPengaduan,
      c.ticket_number,
      namaPelapor,
      c.category,
      uraianPengaduan,
      responsPetugas,
      tanggalSelesai,
      statusPengaduan,
      durasiPenyelesaian,
      prioritas,
    ];
  });

  const fullData = [...headerData, tableHeaders, ...tableRows];

  const worksheet = XLSX.utils.aoa_to_sheet(fullData);

  // Column width configuration for clean display
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 22 }, // Tanggal Pengaduan
    { wch: 18 }, // Nomor Tiket
    { wch: 24 }, // Nama Pelapor
    { wch: 18 }, // Kategori
    { wch: 45 }, // Uraian Pengaduan
    { wch: 45 }, // Respons Petugas
    { wch: 22 }, // Tanggal Selesai
    { wch: 18 }, // Status Pengaduan
    { wch: 26 }, // Durasi Penyelesaian
    { wch: 16 }, // Prioritas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Pengaduan');

  const fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanStart = startDateStr.replace(/-/g, '');
  const cleanEnd = endDateStr.replace(/-/g, '');
  const fileName = `Rekap_Pengaduan_SIAGA_Adminduk_${cleanStart}_${cleanEnd}.xlsx`;
  downloadBlob(blob, fileName);
}

/**
 * Generate and download formal Word (.docx) recommendation report for leadership.
 * Contains:
 * 1. Judul laporan & periode analisis
 * 2. Ringkasan jumlah pengaduan
 * 3. Rekap status pengaduan (baru, sedang diproses, selesai)
 * 4. Resume pengaduan berdasarkan kategori atau masalah utama
 * 5. Masalah yang sering muncul dan tren pengaduan berbasis data nyata
 * 6. Rekomendasi tindak lanjut perbaikan pelayanan
 * 7. Kesimpulan singkat evaluasi pimpinan
 */
export async function exportRecommendationToDocx(
  complaints: Complaint[],
  startDateStr: string,
  endDateStr: string
): Promise<void> {
  const formattedStart = formatIndonesianDate(startDateStr);
  const formattedEnd = formatIndonesianDate(endDateStr);
  const todayFormatted = formatIndonesianDate(new Date().toISOString());

  const total = complaints.length;
  const statusCounts = {
    baru: complaints.filter((c) => c.status === 'baru').length,
    diproses: complaints.filter((c) => c.status === 'diproses').length,
    selesai: complaints.filter((c) => c.status === 'selesai').length,
  };

  const highPriority = complaints.filter((c) => c.priority_level === 'tinggi').length;
  const mediumPriority = complaints.filter((c) => c.priority_level === 'sedang').length;
  const lowPriority = complaints.filter((c) => c.priority_level === 'rendah').length;

  const completionRate = total > 0 ? Math.round((statusCounts.selesai / total) * 100) : 0;

  // Category counts
  const categoryMap: Record<string, number> = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // Local structured recommendations
  const localAnalysis = generateLocalRecommendations(
    complaints,
    `${formattedStart} s.d. ${formattedEnd}`
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Kop Surat Formal Kedinasan
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PEMERINTAH KABUPATEN BREBES',
                bold: true,
                size: 26, // 13pt
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL',
                bold: true,
                size: 28, // 14pt
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Jl. Veteran No. 1, Brebes, Jawa Tengah 52212 | Telp: (0283) 671158 | dindukcapil.brebeskab.go.id',
                size: 18, // 9pt
                font: 'Arial',
                color: '4B5563',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: {
                color: '1E3A8A',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 18,
              },
            },
            children: [],
          }),
          new Paragraph({ text: '' }),

          // Document Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: 'LAPORAN REKOMENDASI DAN EVALUASI PENANGANAN PENGADUAN',
                bold: true,
                size: 24, // 12pt
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SISTEM INFORMASI ASISTENSI & PENGADUAN ADMINISTRASI KEPENDUDUKAN (SIAGA ADMINDUK)',
                bold: true,
                size: 20,
                font: 'Arial',
                color: '1E40AF',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Periode Analisis: ${formattedStart} s.d. ${formattedEnd}`,
                bold: true,
                size: 20,
                font: 'Arial',
                color: '374151',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // BAB I: PENDAHULUAN
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'I. PENDAHULUAN & RINGKASAN EKSEKUTIF',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Laporan ini menyajikan rekapitulasi data dan rekomendasi kebijakan operasional pelayanan administrasi kependudukan di Dinas Kependudukan dan Pencatatan Sipil Kabupaten Brebes untuk periode ${formattedStart} sampai dengan ${formattedEnd}. Seluruh data diolah secara faktual dari database SIAGA Adminduk tanpa menggunakan estimasi fiktif. Selama periode pelaporan tercatat sejumlah `,
                font: 'Arial',
                size: 21,
              }),
              new TextRun({
                text: `${total} pengaduan masyarakat`,
                bold: true,
                font: 'Arial',
                size: 21,
              }),
              new TextRun({
                text: ` yang masuk melalui kanal mandiri warga. Tingkat penyelesaian pengaduan (complaint resolution rate) saat ini mencapai `,
                font: 'Arial',
                size: 21,
              }),
              new TextRun({
                text: `${completionRate}%`,
                bold: true,
                font: 'Arial',
                size: 21,
              }),
              new TextRun({
                text: ` (${statusCounts.selesai} laporan telah tuntas ditindaklanjuti).`,
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // BAB II: REKAPITULASI STATUS PENANGANAN
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'II. REKAPITULASI STATUS PENANGANAN PENGADUAN',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Status progres tindak lanjut oleh tim petugas pelayanan kependudukan disajikan pada tabel berikut:',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Table Rekap Status
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Status Penanganan', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Jumlah Pengaduan', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Persentase & Keterangan', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Baru (Menunggu Tindak Lanjut)', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(statusCounts.baru), bold: true, font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${total > 0 ? Math.round((statusCounts.baru / total) * 100) : 0}% (Perlu telaah petugas loket/verifikator)`, font: 'Arial', size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Sedang Diproses (Koordinasi/Koreksi)', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(statusCounts.diproses), bold: true, font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${total > 0 ? Math.round((statusCounts.diproses / total) * 100) : 0}% (Dalam proses perbaikan data/validasi)`, font: 'Arial', size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Selesai (Telah Ditanggapi/Diterbitkan)', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(statusCounts.selesai), bold: true, font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${completionRate}% (Tuntas dikomunikasikan ke warga)`, font: 'Arial', size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL LAPORAN', bold: true, font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(total), bold: true, font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ children: [new TextRun({ text: '100%', bold: true, font: 'Arial', size: 20 })] })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Priority Scoring Note
          new Paragraph({
            children: [
              new TextRun({
                text: 'Klasifikasi Tingkat Urgensi Pengaduan (Rumus Prioritas SIAGA Adminduk):',
                bold: true,
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `Prioritas Tinggi (Skor ≥ 75): ${highPriority} laporan (${total > 0 ? Math.round((highPriority / total) * 100) : 0}%). Laporan berdampak krusial pada hak dasar kependudukan (perbankan, BPJS, pekerjaan) atau berulang tinggi.`,
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `Prioritas Sedang (Skor 50–74): ${mediumPriority} laporan. Permasalahan ralat elemen data reguler dan revisi dokumen.`,
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `Prioritas Rendah (Skor < 50): ${lowPriority} laporan. Permintaan informasi atau aspirasi layanan.`,
                font: 'Arial',
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // BAB III: RESUME BERDASARKAN KATEGORI
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'III. RESUME PENGADUAN BERDASARKAN KATEGORI LAYANAN',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Sebaran pengaduan masyarakat menurut jenis dokumen/layanan administrasi kependudukan pada periode ini adalah sebagai berikut:',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Table Kategori
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Kategori Dokumen / Layanan', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Jumlah', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR, color: 'auto' },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Proporsi', bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })],
                  }),
                ],
              }),
              ...sortedCategories.map(([cat, count], idx) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font: 'Arial', size: 20 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: cat, bold: idx === 0, font: 'Arial', size: 20 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(count), font: 'Arial', size: 20 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, font: 'Arial', size: 20 })] })],
                    }),
                  ],
                });
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // BAB IV: MASALAH BERULANG & TREN
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'IV. MASALAH YANG SERING MUNCUL & TREN PENANGANAN',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Berdasarkan pengelompokan laporan aktual pada periode ${formattedStart} s.d. ${formattedEnd}, diidentifikasi sejumlah isu dominan yang memerlukan perhatian operasional:`,
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          ...localAnalysis.recommendations.map((rec, rIdx) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${rIdx + 1}. ${rec.masalah} (Kategori: ${rec.kategori})`,
                  bold: true,
                  size: 20,
                  font: 'Arial',
                  color: '1E40AF',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Data Pendukung: ', bold: true, font: 'Arial', size: 20 }),
                new TextRun({ text: rec.dataPendukung, font: 'Arial', size: 20 }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Akar Masalah & Alasan: ', bold: true, font: 'Arial', size: 20 }),
                new TextRun({ text: rec.alasan, font: 'Arial', size: 20 }),
              ],
            }),
            new Paragraph({ text: '' }),
          ]).flat(),

          // BAB V: REKOMENDASI TINDAK LANJUT PERBAIKAN LAYANAN
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'V. REKOMENDASI TINDAK LANJUT PERBAIKAN PELAYANAN',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Menindaklanjuti temuan dan tren pengaduan di atas, berikut langkah-langkah konkret yang direkomendasikan kepada Pimpinan dan Unit Kerja Dindukcapil Kabupaten Brebes:',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          ...localAnalysis.recommendations.map((rec) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Fokus Perbaikan: ${rec.masalah}`,
                  bold: true,
                  size: 20,
                  font: 'Arial',
                  color: '065F46', // Dark emerald
                }),
              ],
            }),
            ...rec.saranPerbaikan.map(
              (saran) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: saran,
                      font: 'Arial',
                      size: 20,
                    }),
                  ],
                })
            ),
            new Paragraph({ text: '' }),
          ]).flat(),

          // BAB VI: KESIMPULAN & ARAHAN PIMPINAN
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: 'VI. KESIMPULAN & EVALUASI PIMPINAN',
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `1. Secara umum, pelayanan administrasi kependudukan pada periode ${formattedStart} sampai ${formattedEnd} telah menangani ${total} aduan masyarakat dengan rasio penyelesaian ${completionRate}%.`,
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '2. Pengaduan dengan tingkat urgensi tinggi perlu mendapatkan percepatan penyelesaian melalui koordinasi lintas bidang, khususnya terkait kuota blangko KTP-el dan sosialisasi legalitas Identitas Kependudukan Digital (IKD) kepada instansi pengguna.',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '3. Optimalisasi pendampingan aktivasi IKD di tingkat kecamatan dan dinas sangat krusial guna menekan frekuensi aduan masyarakat di masa mendatang.',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Demikian laporan rekomendasi dan evaluasi penanganan pengaduan ini disusun untuk menjadi bahan pertimbangan dan arahan kebijakan Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Brebes.',
                font: 'Arial',
                size: 21,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          // Tanda Tangan Pimpinan / Tim
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [new Paragraph({ text: '' })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Brebes, ${todayFormatted}`,
                            font: 'Arial',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Tim Pengelola Pengaduan SIAGA Adminduk',
                            bold: true,
                            font: 'Arial',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Dindukcapil Kabupaten Brebes',
                            font: 'Arial',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({ text: '' }),
                      new Paragraph({ text: '' }),
                      new Paragraph({ text: '' }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '(___________________________)',
                            bold: true,
                            font: 'Arial',
                            size: 20,
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'NIP. ........................................',
                            font: 'Arial',
                            size: 18,
                            color: '6B7280',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanStart = startDateStr.replace(/-/g, '');
  const cleanEnd = endDateStr.replace(/-/g, '');
  const fileName = `Laporan_Rekomendasi_Pimpinan_SIAGA_Adminduk_${cleanStart}_${cleanEnd}.docx`;
  downloadBlob(blob, fileName);
}
