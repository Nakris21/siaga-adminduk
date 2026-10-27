/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationErrors {
  category?: string;
  description?: string;
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Validates Indonesian phone numbers (08... or +628..., 9-14 digits following prefix)
 */
export function validateIndonesianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validates standard email address
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates complaint form submission (FR-05)
 */
export function validateComplaintForm(data: {
  category: string;
  description: string;
  name: string;
  phone: string;
  email?: string;
}): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  if (!data.category || data.category.trim() === '') {
    errors.category = 'Pilih salah satu kategori administrasi kependudukan.';
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.description = `Uraian pengaduan wajib diisi minimal 20 karakter (saat ini ${data.description ? data.description.trim().length : 0} karakter).`;
  }

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nama pelapor wajib diisi lengkap minimal 2 karakter.';
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.phone = 'Nomor WhatsApp / telepon aktif wajib diisi.';
  } else if (!validateIndonesianPhone(data.phone)) {
    errors.phone = 'Format nomor HP tidak valid. Gunakan format seperti 08123456789 atau +628123456789.';
  }

  if (data.email && data.email.trim() !== '' && !validateEmail(data.email)) {
    errors.email = 'Format alamat email tidak valid.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Masks 16-digit NIK or Family Card (KK) patterns from text before transmission (FR-03)
 */
export function maskSensitiveIdentifiers(text: string): {
  maskedText: string;
  detectedCount: number;
} {
  // Regex for 16 consecutive digits (standard Indonesian NIK & No KK)
  const idRegex = /\b\d{16}\b/g;
  const matches = text.match(idRegex) || [];
  const detectedCount = matches.length;

  const maskedText = text.replace(idRegex, (match) => {
    return `${match.slice(0, 4)}********${match.slice(12)}`;
  });

  return { maskedText, detectedCount };
}
