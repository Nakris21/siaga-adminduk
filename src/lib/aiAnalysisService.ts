/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Complaint, ComplaintCategory, AIAnalysisResponse, TrendAnalysisReport } from '../types';
import { calculatePriorityScore, calculateFrequencyValue } from '../logic/scoring';
import {
  analyzeComplaintDeterministically,
  generateLocalRecommendations,
} from '../logic/recommendations';

/**
 * Strips citizen identifiers (NIK/KK 16 digits, phone numbers, emails)
 * before processing to uphold strict privacy standards.
 */
export function sanitizeComplaintText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b\d{16}\b/g, '[NIK/KK_DISAMARKAN]')
    .replace(/(\+?62|08)[0-9]{8,12}\b/g, '[NOMOR_HP_DISAMARKAN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_DISAMARKAN]');
}

/**
 * Counts how many complaints with the same issue label or category occurred in the last 30 days.
 * Ensures consistent, deterministic frequency calculation directly from the stored database records.
 *
 * Mapping (PRD FR-08 & Tahap Final):
 * - 1 laporan = 1
 * - 2-3 laporan = 2
 * - 4-6 laporan = 3
 * - 7-10 laporan = 4
 * - >10 laporan = 5
 */
export function countSimilarComplaints30d(
  issueLabel: string,
  category: ComplaintCategory,
  allComplaints: Complaint[],
  excludeId?: string
): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const labelNorm = (issueLabel || '').toLowerCase().trim();

  let count = 0;
  for (const c of allComplaints) {
    if (excludeId && c.id === excludeId) continue;
    const createdAtTime = new Date(c.created_at).getTime();
    if (createdAtTime >= thirtyDaysAgo) {
      const cLabel = (c.issue_label || '').toLowerCase().trim();
      if (cLabel && labelNorm && (cLabel === labelNorm || cLabel.includes(labelNorm) || labelNorm.includes(cLabel))) {
        count++;
      } else if (c.category === category) {
        count++;
      }
    }
  }

  // Minimum frequency is 1 (the complaint itself)
  return Math.max(count + 1, 1);
}

/**
 * Analyzes an individual complaint locally without calling Gemini API (PRD Final).
 * Determines issue label, category mapping, severity, service impact, and follow-up SOP recommendations
 * based on transparent, objective Dindukcapil operational rules.
 */
export async function analyzeComplaintWithAI(
  category: ComplaintCategory,
  description: string,
  allComplaints: Complaint[]
): Promise<AIAnalysisResponse> {
  const sanitized = sanitizeComplaintText(description);

  // Pure local deterministic rule-based analysis
  const localAnalysis = analyzeComplaintDeterministically(category, sanitized);

  return {
    summary: localAnalysis.summary,
    suggested_category: localAnalysis.suggested_category,
    sentiment: localAnalysis.sentiment,
    severity: localAnalysis.severity,
    service_impact: localAnalysis.service_impact,
    primary_issue_label: localAnalysis.primary_issue_label,
    follow_up_recommendation: localAnalysis.follow_up_recommendation,
    limitation_note: localAnalysis.limitation_note || null,
    source: 'analisis_lokal_terstandar',
  };
}

/**
 * Analyzes aggregate patterns and recommendations directly from stored database complaints
 * without calling external LLM APIs (PRD Final).
 * Zero hallucination — strictly calculates facts, counts, recurring issues, and SOP recommendations.
 */
export async function analyzeTrendPatternsWithAI(
  complaints: Complaint[],
  periodName: string
): Promise<TrendAnalysisReport> {
  const summary = generateLocalRecommendations(complaints, periodName);

  const recurring_issues = summary.recommendations.map((rec) => ({
    issue: rec.masalah,
    category: rec.kategori,
    observed_frequency: rec.tingkatUrgensi,
    impact_assessment: rec.dataPendukung,
  }));

  const inferred_root_causes = summary.recommendations.map((rec) => ({
    area: `Bidang ${rec.kategori}`,
    indication: rec.alasan,
    verification_needed: `Verifikasi catatan berkas pada loket layanan dan audit durasi TTE pada sistem SIAK.`,
  }));

  const policy_recommendations = summary.recommendations.map((rec) => ({
    title: rec.masalah,
    action: rec.saranPerbaikan.join(' '),
    target_unit:
      rec.kategori === 'KTP-el' || rec.kategori === 'IKD'
        ? 'Bidang Pelayanan Pendaftaran Penduduk & PIAK'
        : rec.kategori === 'Kartu Keluarga' || rec.kategori === 'Pindah Datang'
        ? 'Bidang Pelayanan Pendaftaran Penduduk'
        : 'Bidang Pelayanan Pencatatan Sipil',
  }));

  const total = complaints.length;
  const highPriority = complaints.filter((c) => c.priority_level === 'tinggi').length;
  const executive_summary =
    total === 0
      ? `Pada periode ${periodName}, belum terdapat catatan pengaduan yang terdaftar.`
      : `Pada periode ${periodName}, tercatat total ${total} pengaduan kependudukan aktual dengan ${highPriority} pengaduan (${Math.round(
          (highPriority / total) * 100
        )}%) berstatus Prioritas Tinggi. Kategori paling dominan adalah ${
          summary.topCategory ? summary.topCategory.category : '-'
        } (${summary.topCategory ? summary.topCategory.count : 0} laporan).`;

  return {
    executive_summary,
    recurring_issues,
    inferred_root_causes,
    policy_recommendations,
    data_limitation_statement: summary.dataLimitationNotice,
    source: 'analisis_database_lokal',
    analyzed_at: new Date().toISOString(),
  };
}
