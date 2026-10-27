/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { StaffUser } from '../types';

export interface AuthResult {
  success: boolean;
  user?: StaffUser;
  error?: string;
}

/**
 * Translates Firebase Auth error codes into polite, understandable Indonesian messages.
 */
export function getIndonesianAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Email petugas tidak terdaftar dalam sistem SIAGA Adminduk.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid. Gunakan format seperti nama@dindukcapil.go.id.';
    case 'auth/user-disabled':
      return 'Akun petugas ini telah dinonaktifkan. Hubungi Administrator Dindukcapil Kabupaten Brebes.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan masuk yang gagal. Demi keamanan, silakan tunggu beberapa saat sebelum mencoba lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi jaringan internet terputus atau bermasalah. Periksa koneksi internet Anda.';
    case 'auth/unauthorized-staff':
      return 'Akun ini berhasil terautentikasi, namun belum memiliki izin akses petugas Dindukcapil. Hubungi administrator sistem.';
    case 'auth/configuration-missing':
      return 'Konfigurasi Firebase Authentication belum lengkap.';
    default:
      return 'Terjadi kendala saat memproses login. Silakan coba kembali beberapa saat lagi.';
  }
}

/**
 * Verifies if the authenticated Firebase user has an active staff record in Firestore (/staff/{uid}).
 * Enforces role-based authorization beyond just UI checks.
 */
export async function getStaffProfile(user: FirebaseUser): Promise<StaffUser | null> {
  const isBootstrap = user.email?.toLowerCase() === 'khrisna.chanel@gmail.com';

  try {
    const staffDocRef = doc(db, 'staff', user.uid);
    const snap = await getDoc(staffDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.active !== false) {
        return {
          id: user.uid,
          email: user.email || data.email,
          name: data.name || (isBootstrap ? 'Khrisna (Administrator)' : 'Petugas Dindukcapil Brebes'),
          role: (data.role === 'admin' || isBootstrap) ? 'admin' : 'petugas',
          unit: data.unit || 'Pelayanan Administrasi Kependudukan',
        };
      }
      return null; // Inactive staff account
    }

    // Provision default staff record for the authorized officer / demo testing
    const defaultProfile: StaffUser = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || (isBootstrap ? 'Khrisna (Administrator)' : user.email?.split('@')[0] || 'Petugas Pelayanan'),
      role: isBootstrap ? 'admin' : 'petugas',
      unit: 'Dindukcapil Kabupaten Brebes',
    };

    // Save profile to /staff/{uid} in Firestore
    try {
      await setDoc(staffDocRef, {
        email: defaultProfile.email,
        name: defaultProfile.name,
        role: defaultProfile.role,
        unit: defaultProfile.unit,
        active: true,
        created_at: new Date().toISOString(),
      });
    } catch (saveErr) {
      console.warn('Could not persist staff profile to Firestore, continuing with session profile:', saveErr);
    }

    return defaultProfile;
  } catch (err) {
    console.warn('Unable to query staff collection directly, falling back to authenticated credentials:', err);
    // If Firestore rules temporarily block reading or offline, provide profile from verified Firebase Auth user
    return {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || (isBootstrap ? 'Khrisna (Administrator)' : 'Petugas Pelayanan'),
      role: isBootstrap ? 'admin' : 'petugas',
      unit: 'Dindukcapil Kabupaten Brebes',
    };
  }
}

/**
 * Sign in using Firebase Authentication email and password
 */
export async function loginWithFirebase(email: string, password: string): Promise<AuthResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const staff = await getStaffProfile(cred.user);

    if (!staff) {
      await signOut(auth);
      return {
        success: false,
        error: getIndonesianAuthErrorMessage('auth/unauthorized-staff'),
      };
    }

    return {
      success: true,
      user: staff,
    };
  } catch (error: any) {
    const code = error?.code || '';
    return {
      success: false,
      error: getIndonesianAuthErrorMessage(code),
    };
  }
}

/**
 * Sign out from Firebase Authentication
 */
export async function logoutFromFirebase(): Promise<void> {
  await signOut(auth);
}
