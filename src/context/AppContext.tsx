/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Complaint,
  ReferenceDoc,
  StaffUser,
  ChatMessage,
  ActiveNavTab,
  ComplaintCategory,
} from '../types';
import { appDataStore } from '../data/storage';
import { generateTicketNumber } from '../logic/ticket';
import { validateComplaintForm } from '../logic/validation';
import { processConsultationQuestion, analyzeComplaintContent } from '../logic/aiSimulation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  loginWithFirebase,
  logoutFromFirebase,
  getStaffProfile,
  AuthResult,
} from '../lib/authService';
import { analyzeComplaintWithAI, countSimilarComplaints30d } from '../lib/aiAnalysisService';
import { calculatePriorityScore } from '../logic/scoring';

interface AppContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  complaints: Complaint[];
  references: ReferenceDoc[];
  currentUser: StaffUser | null;
  isAuthChecking: boolean;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  toast: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  checkTicketNumber: string;
  setCheckTicketNumber: (ticket: string) => void;
  getPublicComplaintByTicket: (ticket: string) => Complaint | null;
  submitComplaint: (data: {
    category: ComplaintCategory;
    description: string;
    name: string;
    phone: string;
    email?: string;
  }) => Promise<{ success: boolean; ticketNumber?: string; error?: string }>;
  updateComplaintStatus: (
    id: string,
    status: Complaint['status'],
    response?: string
  ) => Promise<boolean>;
  triggerAIAnalysisForComplaint: (id: string) => Promise<boolean>;
  adjustComplaintAssessment: (
    id: string,
    severity: number,
    serviceImpact: number,
    issueLabel?: string
  ) => Promise<boolean>;
  isAnalyzingComplaintId: string | null;
  toggleReferenceActive: (id: string) => Promise<boolean>;
  saveReferenceDoc: (doc: Partial<ReferenceDoc> & { title: string; text: string; document_type: ReferenceDoc['document_type'] }) => Promise<boolean>;
  deleteReferenceDoc: (id: string) => Promise<boolean>;
  loginStaff: (email: string, password: string) => Promise<AuthResult>;
  logoutStaff: () => Promise<void>;
  sendChatMessage: (text: string) => void;
  clearChat: () => void;
  resetAllData: () => Promise<void>;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveNavTab>('konsultasi');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [references, setReferences] = useState<ReferenceDoc[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [checkTicketNumber, setCheckTicketNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isAnalyzingComplaintId, setIsAnalyzingComplaintId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Halo! Saya asisten virtual SIAGA Adminduk. Saya dapat membantu memberikan informasi persyaratan dan prosedur administrasi kependudukan berdasarkan referensi regulasi resmi yang aktif.\n\nSilakan pilih topik cepat di bawah atau ketikkan pertanyaan Anda.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial load data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [complaintsData, referencesData] = await Promise.all([
          appDataStore.getComplaints(),
          appDataStore.getReferences(),
        ]);
        setComplaints(complaintsData);
        setReferences(referencesData);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Gagal memuat data dari penyimpanan.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Real-time Firebase Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthChecking(true);
      if (firebaseUser) {
        try {
          const profile = await getStaffProfile(firebaseUser);
          setCurrentUser(profile);
        } catch (e) {
          console.error('Failed to get staff profile:', e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const setActiveTab = (tab: ActiveNavTab) => {
    // Route protection: prevent unauthenticated users from opening staff-only tabs
    const staffTabs: ActiveNavTab[] = ['dashboard', 'daftar-pengaduan', 'referensi'];
    if (staffTabs.includes(tab) && !currentUser && !isAuthChecking) {
      showToast('Akses dibatasi. Silakan login terlebih dahulu sebagai petugas.', 'info');
      setActiveTabState('login');
      return;
    }
    setActiveTabState(tab);
  };

  const submitComplaint = async (data: {
    category: ComplaintCategory;
    description: string;
    name: string;
    phone: string;
    email?: string;
  }) => {
    // Validation check (FR-05, FR-15)
    const validation = validateComplaintForm(data);
    if (!validation.isValid) {
      const firstError = (Object.values(validation.errors)[0] as string) || 'Isian data belum lengkap.';
      return { success: false, error: firstError };
    }

    try {
      const ticketNumber = generateTicketNumber();

      // Perform AI Analysis (Gemini-backed with fallback)
      let aiResult;
      try {
        aiResult = await analyzeComplaintWithAI(data.category, data.description, complaints);
      } catch (e) {
        console.warn('Initial AI analysis fallback triggered:', e);
        aiResult = analyzeComplaintContent(data.category, data.description, complaints);
      }

      const issueLabel = (aiResult as any).primary_issue_label || (aiResult as any).issue_label || 'Permasalahan Administrasi Umum';
      const severity = Number(aiResult.severity) || 3;
      const serviceImpact = Number((aiResult as any).service_impact) || 3;

      // Deterministic frequency calculation in application code (PRD FR-08)
      const frequency30d = countSimilarComplaints30d(issueLabel, data.category, complaints);

      // Deterministic priority score calculation in application code (PRD FR-08)
      const priorityCalc = calculatePriorityScore(severity, serviceImpact, frequency30d);

      const newComplaint: Complaint = {
        id: `cmp-${Date.now()}`,
        ticket_number: ticketNumber,
        created_at: new Date().toISOString(),
        category: data.category,
        description: data.description.trim(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        status: 'baru',
        ai_analysis_status: 'berhasil',
        ai_summary: (aiResult as any).summary || (aiResult as any).ai_summary,
        ai_topic: (aiResult as any).suggested_category || (aiResult as any).ai_topic || data.category,
        ai_sentiment: (aiResult as any).sentiment || (aiResult as any).ai_sentiment || 'negatif',
        severity,
        service_impact: serviceImpact,
        issue_label: issueLabel,
        frequency_30d: frequency30d,
        priority_score: priorityCalc.score,
        priority_level: priorityCalc.level,
        ai_recommendation: (aiResult as any).follow_up_recommendation,
        ai_limitation_note: (aiResult as any).limitation_note || undefined,
        ai_source: (aiResult as any).source || 'gemini',
        ai_analyzed_at: new Date().toISOString(),
        source: 'form',
      };

      const saved = await appDataStore.saveComplaint(newComplaint);
      setComplaints((prev) => [saved, ...prev]);
      showToast(`Pengaduan berhasil diajukan dengan nomor tiket ${ticketNumber}`, 'success');

      return { success: true, ticketNumber };
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      return {
        success: false,
        error: 'Terjadi kesalahan sistem saat menyimpan pengaduan. Silakan coba kembali.',
      };
    }
  };

  const triggerAIAnalysisForComplaint = async (id: string): Promise<boolean> => {
    const target = complaints.find((c) => c.id === id);
    if (!target) return false;

    setIsAnalyzingComplaintId(id);
    try {
      const aiResult = await analyzeComplaintWithAI(target.category, target.description, complaints);

      // Deterministic frequency calculation in application code (PRD FR-08)
      const freq30d = countSimilarComplaints30d(
        aiResult.primary_issue_label,
        target.category,
        complaints,
        id
      );

      // Deterministic priority calculation in application code (PRD FR-08)
      const priorityResult = calculatePriorityScore(
        aiResult.severity,
        aiResult.service_impact,
        freq30d
      );

      const updates: Partial<Complaint> = {
        ai_analysis_status: 'berhasil',
        ai_summary: aiResult.summary,
        ai_topic: aiResult.suggested_category,
        ai_sentiment: aiResult.sentiment,
        severity: aiResult.severity,
        service_impact: aiResult.service_impact,
        issue_label: aiResult.primary_issue_label,
        frequency_30d: freq30d,
        priority_score: priorityResult.score,
        priority_level: priorityResult.level,
        ai_recommendation: aiResult.follow_up_recommendation,
        ai_limitation_note: aiResult.limitation_note || undefined,
        ai_source: aiResult.source,
        ai_analyzed_at: new Date().toISOString(),
      };

      const updated = await appDataStore.updateComplaint(id, updates);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Analisis AI berhasil diperbarui untuk tiket ini.', 'success');
      return true;
    } catch (err) {
      console.error('Failed to analyze complaint with AI:', err);
      showToast('Gagal memproses analisis AI untuk pengaduan ini.', 'error');
      return false;
    } finally {
      setIsAnalyzingComplaintId(null);
    }
  };

  const adjustComplaintAssessment = async (
    id: string,
    severity: number,
    serviceImpact: number,
    issueLabel?: string
  ): Promise<boolean> => {
    const target = complaints.find((c) => c.id === id);
    if (!target) return false;

    try {
      const finalLabel = issueLabel || target.issue_label || 'Permasalahan Administrasi';
      const freq30d = countSimilarComplaints30d(finalLabel, target.category, complaints, id);
      const priorityResult = calculatePriorityScore(severity, serviceImpact, freq30d);

      const updates: Partial<Complaint> = {
        severity,
        service_impact: serviceImpact,
        issue_label: finalLabel,
        frequency_30d: freq30d,
        priority_score: priorityResult.score,
        priority_level: priorityResult.level,
        ai_verified_by: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Petugas Verifikator',
      };

      const updated = await appDataStore.updateComplaint(id, updates);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Penilaian keparahan & dampak berhasil diverifikasi petugas.', 'success');
      return true;
    } catch (err) {
      console.error('Failed to adjust assessment:', err);
      showToast('Gagal memperbarui verifikasi penilaian.', 'error');
      return false;
    }
  };

  const updateComplaintStatus = async (
    id: string,
    status: Complaint['status'],
    response?: string
  ): Promise<boolean> => {
    try {
      const updates: Partial<Complaint> = {
        status,
        ...(response !== undefined ? { response, response_updated_at: new Date().toISOString() } : {}),
      };
      const updated = await appDataStore.updateComplaint(id, updates);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Status pengaduan dan tanggapan berhasil diperbarui.', 'success');
      return true;
    } catch (err) {
      console.error('Failed to update complaint:', err);
      showToast('Gagal memperbarui pengaduan.', 'error');
      return false;
    }
  };

  const toggleReferenceActive = async (id: string): Promise<boolean> => {
    try {
      const target = references.find((r) => r.id === id);
      if (!target) return false;
      const updated = await appDataStore.updateReference(id, { active: !target.active });
      setReferences((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast(
        `Referensi "${updated.title}" kini ${updated.active ? 'Aktif' : 'Nonaktif'}.`,
        'info'
      );
      return true;
    } catch (err) {
      console.error('Failed to toggle reference:', err);
      showToast('Gagal memperbarui status referensi.', 'error');
      return false;
    }
  };

  const saveReferenceDoc = async (
    doc: Partial<ReferenceDoc> & { title: string; text: string; document_type: ReferenceDoc['document_type'] }
  ): Promise<boolean> => {
    try {
      if (doc.id) {
        const updated = await appDataStore.updateReference(doc.id, doc);
        setReferences((prev) => prev.map((r) => (r.id === doc.id ? updated : r)));
        showToast('Dokumen referensi berhasil diperbarui.', 'success');
      } else {
        const newDoc: ReferenceDoc = {
          id: `ref-${Date.now()}`,
          title: doc.title,
          document_type: doc.document_type,
          document_number: doc.document_number,
          document_date: doc.document_date,
          section: doc.section,
          text: doc.text,
          active: doc.active !== undefined ? doc.active : true,
          updated_at: new Date().toISOString(),
          verified_by: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Petugas Verifikator',
        };
        const saved = await appDataStore.saveReference(newDoc);
        setReferences((prev) => [saved, ...prev]);
        showToast('Dokumen referensi baru berhasil ditambahkan.', 'success');
      }
      return true;
    } catch (err) {
      console.error('Failed to save reference:', err);
      showToast('Gagal menyimpan dokumen referensi.', 'error');
      return false;
    }
  };

  const deleteReferenceDoc = async (id: string): Promise<boolean> => {
    try {
      await appDataStore.deleteReference(id);
      setReferences((prev) => prev.filter((r) => r.id !== id));
      showToast('Dokumen referensi telah dihapus.', 'info');
      return true;
    } catch (err) {
      console.error('Failed to delete reference:', err);
      showToast('Gagal menghapus referensi.', 'error');
      return false;
    }
  };

  const loginStaff = async (email: string, password: string): Promise<AuthResult> => {
    const result = await loginWithFirebase(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      showToast(`Berhasil masuk sebagai ${result.user.name} (${result.user.role.toUpperCase()})`, 'success');
      setActiveTabState('dashboard');
    }
    return result;
  };

  const logoutStaff = async () => {
    try {
      await logoutFromFirebase();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    showToast('Sesi autentikasi petugas telah diakhiri.', 'info');
    setActiveTabState('login');
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Simulate AI response grounded strictly on active references (FR-02)
    setTimeout(() => {
      const response = processConsultationQuestion(text, references);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        isFallback: response.isFallback,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    }, 400);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 'msg-welcome-new',
        sender: 'ai',
        text: 'Percakapan baru dimulai. Silakan ajukan pertanyaan seputar administrasi kependudukan (KTP-el, Kartu Keluarga, Akta Kelahiran, IKD, dll).',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const getPublicComplaintByTicket = (ticket: string): Complaint | null => {
    if (!ticket || !ticket.trim()) return null;
    const cleanTicket = ticket.trim().toUpperCase();
    return complaints.find((c) => c.ticket_number.toUpperCase() === cleanTicket) || null;
  };

  const resetAllData = async () => {
    setIsLoading(true);
    await appDataStore.resetToDummyData();
    const [c, r] = await Promise.all([appDataStore.getComplaints(), appDataStore.getReferences()]);
    setComplaints(c);
    setReferences(r);
    setIsLoading(false);
    showToast('Data berhasil diatur ulang ke data awal dummy anonim.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        complaints,
        references,
        currentUser,
        isAuthChecking,
        chatMessages,
        isLoading,
        toast,
        showToast,
        checkTicketNumber,
        setCheckTicketNumber,
        getPublicComplaintByTicket,
        submitComplaint,
        updateComplaintStatus,
        triggerAIAnalysisForComplaint,
        adjustComplaintAssessment,
        isAnalyzingComplaintId,
        toggleReferenceActive,
        saveReferenceDoc,
        deleteReferenceDoc,
        loginStaff,
        logoutStaff,
        sendChatMessage,
        clearChat,
        resetAllData,
        selectedComplaintId,
        setSelectedComplaintId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
