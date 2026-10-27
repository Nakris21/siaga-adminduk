/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ComplaintCategory =
  | 'KTP-el'
  | 'Kartu Keluarga'
  | 'Akta Kelahiran'
  | 'Akta Kematian'
  | 'IKD'
  | 'Pindah Datang'
  | 'Lainnya';

export type ComplaintStatus = 'baru' | 'diproses' | 'selesai';

export type AIAnalysisStatus = 'belum_diproses' | 'diproses' | 'berhasil' | 'gagal';

export type AISentiment = 'negatif' | 'netral' | 'positif';

export type PriorityLevel = 'tinggi' | 'sedang' | 'rendah';

export type ComplaintSource = 'form' | 'simulasi' | 'impor';

export interface Complaint {
  id: string;
  ticket_number: string;
  created_at: string; // ISO 8601 string
  category: ComplaintCategory;
  description: string;
  name: string;
  phone: string;
  email?: string;
  status: ComplaintStatus;
  response?: string;
  response_updated_at?: string;
  ai_analysis_status: AIAnalysisStatus;
  ai_summary?: string;
  ai_topic?: string;
  ai_sentiment?: AISentiment;
  severity: number; // 1 - 5
  service_impact: number; // 1 - 5
  issue_label: string;
  frequency_30d: number; // Count of similar issues in last 30 days
  priority_score: number; // Calculated by application formula: (severity*8)+(impact*6)+(freq*6)
  priority_level: PriorityLevel;
  source: ComplaintSource;
  ai_recommendation?: string;
  ai_limitation_note?: string;
  ai_verified_by?: string;
  ai_source?: string;
  ai_analyzed_at?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  suggested_category: ComplaintCategory;
  sentiment: AISentiment;
  severity: number;
  service_impact: number;
  primary_issue_label: string;
  follow_up_recommendation: string;
  limitation_note: string | null;
  source: string;
}

export interface TrendAnalysisReport {
  executive_summary: string;
  recurring_issues: {
    issue: string;
    category: string;
    observed_frequency: string;
    impact_assessment: string;
  }[];
  inferred_root_causes: {
    area: string;
    indication: string;
    verification_needed: string;
  }[];
  policy_recommendations: {
    title: string;
    action: string;
    target_unit: string;
  }[];
  data_limitation_statement: string;
  source: string;
  analyzed_at: string;
}

export type DocumentType = 'peraturan' | 'standar_pelayanan' | 'sop' | 'faq_resmi' | 'lainnya';

export interface ReferenceDoc {
  id: string;
  title: string;
  document_type: DocumentType;
  document_number?: string;
  document_date?: string;
  year?: string;
  summary?: string;
  source_url?: string;
  section?: string;
  text: string;
  active: boolean;
  updated_at: string;
  verified_by?: string;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'petugas';
  unit: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  citations?: {
    title: string;
    documentNumber?: string;
    section?: string;
  }[];
  isFallback?: boolean;
}

export type ActiveNavTab =
  | 'konsultasi'
  | 'pengaduan'
  | 'cek-status'
  | 'dashboard'
  | 'analisis-ai'
  | 'daftar-pengaduan'
  | 'referensi'
  | 'login'
  | 'arsip-teknis';
