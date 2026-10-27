/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Complaint, ComplaintCategory } from '../types';

export interface DashboardMetrics {
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
  prioritasTinggi: number;
  prioritasSedang: number;
  prioritasRendah: number;
}

export interface CategoryMetric {
  category: ComplaintCategory;
  count: number;
  percentage: number;
}

export interface TrendDataPoint {
  dateLabel: string;
  count: number;
}

export interface AggregateReport {
  generatedAt: string;
  totalAnalyzed: number;
  topIssues: { label: string; count: number; category: string }[];
  categoryBreakdown: CategoryMetric[];
  priorityDistribution: { high: number; medium: number; low: number };
  systemObservations: string[];
  recommendations: string[];
  dataLimitationNotice: string;
}

export type PeriodFilter = '7d' | '30d' | '90d' | 'all';

/**
 * Filters complaints according to chosen administrative evaluation period.
 */
export function filterComplaintsByPeriod(
  complaints: Complaint[],
  period: PeriodFilter
): Complaint[] {
  if (period === 'all') return complaints;

  const now = Date.now();
  let maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  if (period === '7d') {
    maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  } else if (period === '90d') {
    maxAgeMs = 90 * 24 * 60 * 60 * 1000;
  }

  return complaints.filter((c) => {
    const time = new Date(c.created_at).getTime();
    return now - time <= maxAgeMs;
  });
}

export function computeDashboardMetrics(complaints: Complaint[]): DashboardMetrics {
  const metrics: DashboardMetrics = {
    total: complaints.length,
    baru: 0,
    diproses: 0,
    selesai: 0,
    prioritasTinggi: 0,
    prioritasSedang: 0,
    prioritasRendah: 0,
  };

  complaints.forEach((c) => {
    if (c.status === 'baru') metrics.baru++;
    else if (c.status === 'diproses') metrics.diproses++;
    else if (c.status === 'selesai') metrics.selesai++;

    if (c.priority_level === 'tinggi') metrics.prioritasTinggi++;
    else if (c.priority_level === 'sedang') metrics.prioritasSedang++;
    else metrics.prioritasRendah++;
  });

  return metrics;
}

export function computeCategoryDistribution(complaints: Complaint[]): CategoryMetric[] {
  const categories: ComplaintCategory[] = [
    'KTP-el',
    'Kartu Keluarga',
    'Akta Kelahiran',
    'Akta Kematian',
    'IKD',
    'Pindah Datang',
    'Lainnya',
  ];

  const total = complaints.length;
  const counts: Record<string, number> = {};
  categories.forEach((cat) => (counts[cat] = 0));

  complaints.forEach((c) => {
    if (counts[c.category] !== undefined) {
      counts[c.category]++;
    } else {
      counts['Lainnya'] = (counts['Lainnya'] || 0) + 1;
    }
  });

  return categories
    .map((cat) => ({
      category: cat,
      count: counts[cat] || 0,
      percentage: total > 0 ? Math.round(((counts[cat] || 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Computes trend data based on selected period and actual complaints in database.
 * Supports:
 * - 7d: Daily for past 7 days
 * - 30d: 5-day intervals or daily for past 30 days
 * - 90d: 3 months / monthly breakdown
 * - all: Monthly breakdown across all dates
 */
export function computeTrendData(
  complaints: Complaint[],
  period: PeriodFilter = '7d'
): TrendDataPoint[] {
  const now = new Date();

  if (period === '7d') {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map[key] = 0;
    }

    complaints.forEach((c) => {
      const key = c.created_at.split('T')[0];
      if (map[key] !== undefined) {
        map[key]++;
      }
    });

    return Object.entries(map).map(([dateStr, count]) => {
      const parts = dateStr.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      return { dateLabel: label, count };
    });
  }

  if (period === '30d') {
    // 6 intervals of 5 days each
    const intervals: { start: Date; end: Date; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 5);
      const start = new Date(end);
      start.setDate(start.getDate() - 4);
      const label = `${start.getDate()}/${start.getMonth() + 1}`;
      intervals.push({ start, end, label, count: 0 });
    }

    complaints.forEach((c) => {
      const cTime = new Date(c.created_at).getTime();
      for (const inv of intervals) {
        if (cTime >= inv.start.getTime() && cTime <= inv.end.getTime() + 86400000) {
          inv.count++;
          break;
        }
      }
    });

    return intervals.map((inv) => ({ dateLabel: inv.label, count: inv.count }));
  }

  if (period === '90d') {
    // 3 months (Triwulanan)
    const months: { label: string; yearMonth: string; count: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        yearMonth: ym,
        count: 0,
      });
    }

    complaints.forEach((c) => {
      const ym = c.created_at.slice(0, 7);
      const target = months.find((m) => m.yearMonth === ym);
      if (target) {
        target.count++;
      }
    });

    return months.map((m) => ({ dateLabel: m.label, count: m.count }));
  }

  // period === 'all'
  // Group by available months in dataset (up to past 6 months)
  const monthMap: Record<string, { label: string; count: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[ym] = {
      label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      count: 0,
    };
  }

  complaints.forEach((c) => {
    const ym = c.created_at.slice(0, 7);
    if (monthMap[ym]) {
      monthMap[ym].count++;
    } else {
      const parts = ym.split('-');
      const mIdx = parseInt(parts[1] || '1', 10) - 1;
      monthMap[ym] = {
        label: `${monthNames[mIdx] || ym}`,
        count: 1,
      };
    }
  });

  return Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([, val]) => ({ dateLabel: val.label, count: val.count }));
}

/**
 * Computes structured aggregate pattern report and recommendations (PRD FR-13 & Final)
 * based strictly on stored database complaints.
 */
export function generateAggregateAnalysis(complaints: Complaint[]): AggregateReport {
  const total = complaints.length;

  // Issue frequency tally
  const issueMap: Record<string, { count: number; category: string }> = {};
  complaints.forEach((c) => {
    const key = c.issue_label || c.category;
    if (!issueMap[key]) {
      issueMap[key] = { count: 0, category: c.category };
    }
    issueMap[key].count++;
  });

  const sortedIssues = Object.entries(issueMap)
    .map(([label, val]) => ({ label, count: val.count, category: val.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const categoryBreakdown = computeCategoryDistribution(complaints);
  const metrics = computeDashboardMetrics(complaints);

  if (total === 0) {
    return {
      generatedAt: new Date().toISOString(),
      totalAnalyzed: 0,
      topIssues: [],
      categoryBreakdown: [],
      priorityDistribution: { high: 0, medium: 0, low: 0 },
      systemObservations: ['Belum ada pengaduan yang tersimpan dalam sistem pada periode ini.'],
      recommendations: [
        'Sistem siap menerima laporan pengaduan masyarakat melalui portal publik.',
      ],
      dataLimitationNotice:
        'Data pengaduan belum tersedia. Analisis statistik memerlukan minimal data masuk.',
    };
  }

  const systemObservations: string[] = [
    `Total ${total} pengaduan aktual terdata, dengan ${metrics.prioritasTinggi} laporan (${Math.round(
      (metrics.prioritasTinggi / total) * 100
    )}%) tergolong Prioritas Tinggi (skor ≥ 75).`,
    `Masalah berulang paling menonjol: "${sortedIssues[0]?.label || '-'}" dengan ${
      sortedIssues[0]?.count || 0
    } laporan pada modul ${sortedIssues[0]?.category || '-'}.`,
    `Tingkat penanganan: ${metrics.selesai} selesai (${Math.round(
      (metrics.selesai / total) * 100
    )}%), ${metrics.diproses} sedang ditangani petugas, dan ${metrics.baru} menunggu telaah awal.`,
  ];

  const recommendations: string[] = [
    'Prioritaskan penyelesaian pengaduan berstatus Prioritas Tinggi yang belum ditanggapi.',
    'Koordinasikan pasokan logistik atau fasilitasi aktivasi IKD apabila keluhan didominasi oleh fisik KTP-el.',
    'Pantau SLA waktu verifikasi permohonan daring agar tidak melampaui standar pelayanan operasional 3 hari kerja.',
  ];

  const dataLimitationNotice =
    total < 10
      ? `Catatan Keterbatasan Data: Jumlah sampel ${total} pengaduan merupakan indikasi awal terukur dan disarankan divalidasi langsung ke unit pelayanan terkait.`
      : `Analisis terukur dari ${total} pengaduan riil dalam database. Petugas disarankan menelaah rekomendasi sebelum penetapan kebijakan resmi.`;

  return {
    generatedAt: new Date().toISOString(),
    totalAnalyzed: total,
    topIssues: sortedIssues,
    categoryBreakdown,
    priorityDistribution: {
      high: metrics.prioritasTinggi,
      medium: metrics.prioritasSedang,
      low: metrics.prioritasRendah,
    },
    systemObservations,
    recommendations,
    dataLimitationNotice,
  };
}
