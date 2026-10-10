/**
 * Offline Pass Storage Utility for MOSA Digital Membership Cards.
 * Stores verified cryptographic pass credentials in localStorage/IndexedDB
 * so alumni can present their digital ID even with zero internet connectivity.
 */

export interface OfflinePassData {
  alumniId: string;
  fullName: string;
  alumniNumber: string;
  cohort: string;
  category: string;
  photoUrl?: string;
  verificationToken: string;
  qrPayload: string;
  issuedAt: string;
  cachedAt: string;
  isValidated: boolean;
}

const STORAGE_KEY = 'mosa_offline_cached_pass';

export const offlinePassStorage = {
  savePass(pass: Omit<OfflinePassData, 'cachedAt'>): void {
    try {
      const data: OfflinePassData = {
        ...pass,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save offline pass to local storage:', e);
    }
  },

  getPass(): OfflinePassData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as OfflinePassData;
    } catch {
      return null;
    }
  },

  clearPass(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  isPassAvailable(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
  }
};
