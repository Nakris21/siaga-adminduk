/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Complaint, ReferenceDoc } from '../types';
import { INITIAL_DUMMY_COMPLAINTS } from './dummyComplaints';
import { INITIAL_DUMMY_REFERENCES } from './dummyReferences';

const COMPLAINTS_KEY = 'siaga_adminduk_complaints_v1';
const REFERENCES_KEY = 'siaga_adminduk_references_v1';

/**
 * Repository interface for data access.
 * Separating data access from UI and business logic makes it seamless to swap
 * LocalSimulatedStore with Cloud Firestore in Phase 2.
 */
export interface IAppDataStore {
  getComplaints(): Promise<Complaint[]>;
  saveComplaint(complaint: Complaint): Promise<Complaint>;
  updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint>;
  getReferences(): Promise<ReferenceDoc[]>;
  saveReference(reference: ReferenceDoc): Promise<ReferenceDoc>;
  updateReference(id: string, updates: Partial<ReferenceDoc>): Promise<ReferenceDoc>;
  deleteReference(id: string): Promise<boolean>;
  resetToDummyData(): Promise<void>;
}

export class LocalSimulatedStore implements IAppDataStore {
  private complaintsCache: Complaint[] | null = null;
  private referencesCache: ReferenceDoc[] | null = null;

  async getComplaints(): Promise<Complaint[]> {
    if (this.complaintsCache) return this.complaintsCache;

    try {
      const stored = localStorage.getItem(COMPLAINTS_KEY);
      if (stored) {
        this.complaintsCache = JSON.parse(stored);
        return this.complaintsCache || [];
      }
    } catch {
      // Ignore localStorage errors
    }

    this.complaintsCache = [...INITIAL_DUMMY_COMPLAINTS];
    this.persistComplaints();
    return this.complaintsCache;
  }

  async saveComplaint(complaint: Complaint): Promise<Complaint> {
    const list = await this.getComplaints();
    const updated = [complaint, ...list];
    this.complaintsCache = updated;
    this.persistComplaints();
    return complaint;
  }

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    const list = await this.getComplaints();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Pengaduan dengan ID ${id} tidak ditemukan.`);
    }

    const updatedItem = {
      ...list[index],
      ...updates,
    };
    list[index] = updatedItem;
    this.complaintsCache = [...list];
    this.persistComplaints();
    return updatedItem;
  }

  async getReferences(): Promise<ReferenceDoc[]> {
    if (this.referencesCache) return this.referencesCache;

    try {
      const stored = localStorage.getItem(REFERENCES_KEY);
      if (stored) {
        this.referencesCache = JSON.parse(stored);
        return this.referencesCache || [];
      }
    } catch {
      // Ignore localStorage errors
    }

    this.referencesCache = [...INITIAL_DUMMY_REFERENCES];
    this.persistReferences();
    return this.referencesCache;
  }

  async saveReference(reference: ReferenceDoc): Promise<ReferenceDoc> {
    const list = await this.getReferences();
    const updated = [reference, ...list];
    this.referencesCache = updated;
    this.persistReferences();
    return reference;
  }

  async updateReference(id: string, updates: Partial<ReferenceDoc>): Promise<ReferenceDoc> {
    const list = await this.getReferences();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Dokumen referensi dengan ID ${id} tidak ditemukan.`);
    }

    const updatedItem = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updatedItem;
    this.referencesCache = [...list];
    this.persistReferences();
    return updatedItem;
  }

  async deleteReference(id: string): Promise<boolean> {
    const list = await this.getReferences();
    this.referencesCache = list.filter((r) => r.id !== id);
    this.persistReferences();
    return true;
  }

  async resetToDummyData(): Promise<void> {
    this.complaintsCache = [...INITIAL_DUMMY_COMPLAINTS];
    this.referencesCache = [...INITIAL_DUMMY_REFERENCES];
    this.persistComplaints();
    this.persistReferences();
  }

  private persistComplaints() {
    try {
      if (this.complaintsCache) {
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(this.complaintsCache));
      }
    } catch {
      // Safe fallback if quota exceeded
    }
  }

  private persistReferences() {
    try {
      if (this.referencesCache) {
        localStorage.setItem(REFERENCES_KEY, JSON.stringify(this.referencesCache));
      }
    } catch {
      // Safe fallback if quota exceeded
    }
  }
}

// Single instance export for Phase 1
export const appDataStore: IAppDataStore = new LocalSimulatedStore();
