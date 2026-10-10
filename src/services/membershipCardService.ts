/**
 * Official MOSA Digital Membership ID Card Service
 * Mandela Old Students Association (MOSA) - Mandela Secondary School Hoima (MASSH)
 * 
 * Enforces:
 * 1. Strict visual reproduction of "MOSA - IDs-3.pdf" template.
 * 2. Automatic personalization from existing registry records.
 * 3. Unique validation numbers & lifecycle management (issuance, reissue, suspend, revoke).
 * 4. Minimal public QR verification (zero private data leakage).
 * 5. High-resolution print-ready vector PDF generation via jsPDF & QRCode.
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  AlumniProfile,
  AuthUser,
  CardCorrectionRequest,
  CardDetailsSnapshot,
  CardVerificationResult,
  MembershipCardDisplayStatus,
  MembershipCardRecord,
  MembershipCardSettings,
  MembershipStatus,
} from '../types';
import { dataService } from './dataService';
import {
  MOSA_COLORS,
  getMosaCrestSvg,
  getMosaSignatureSvg,
  svgToDataUrl,
} from '../utils/mosaCrest';

const STORAGE_KEYS = {
  SETTINGS: 'mosa_membership_card_settings',
  CARDS: 'mosa_membership_cards',
  VALIDATION_REGISTRY: 'mosa_card_validation_registry',
  CORRECTIONS: 'mosa_card_corrections',
};

// Safe storage access (local storage with in-memory fallback)
const memStore: Record<string, string> = {};
const storage = {
  get: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return memStore[key] || null;
  },
  set: (key: string, val: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, val); } catch {}
    }
    memStore[key] = val;
  },
};

/**
 * Approved default template settings directly derived from "MOSA - IDs-3.pdf"
 */
export const DEFAULT_CARD_SETTINGS: MembershipCardSettings = {
  headingText: 'MANDELA OLD STUDENTS\nASSOCIATION (MOSA)',
  cardTitle: 'Membership ID Card',
  ownershipStatement: 'This is property of:',
  associationName: 'Mandela Old Students Association (MOSA)',
  phoneNumbers: ['+256 772 411921', '+256 706599793', '+256 773432413'],
  email: 'mosaalumni31@gmail.com',
  website: 'mandelassalumni.com',
  chairmanMosa: {
    title: 'Chairman MOSA',
    name: 'Chairman MOSA',
    signatureDataUrl: svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 120, 48)),
  },
  chairmanBog: {
    title: 'Chairman BOG Massh',
    name: 'Chairman BOG MASSH',
    signatureDataUrl: svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 120, 48)),
  },
  crestDataUrl: svgToDataUrl(getMosaCrestSvg(140)),
  validityYears: 0, // 0 = Permanent / Non-expiring by default
  cohortYearBasis: 'ENTRY',
  verificationBaseUrl: '',
};

export const membershipCardService = {
  // ==========================================
  // 1. SETTINGS & CONFIGURATION
  // ==========================================
  async getCardSettings(): Promise<MembershipCardSettings> {
    const raw = storage.get(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_CARD_SETTINGS));
      return { ...DEFAULT_CARD_SETTINGS };
    }
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CARD_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_CARD_SETTINGS };
    }
  },

  async updateCardSettings(
    updates: Partial<MembershipCardSettings>,
    adminUser: AuthUser
  ): Promise<MembershipCardSettings> {
    const current = await this.getCardSettings();
    const updated: MembershipCardSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser.displayName || adminUser.email,
    };
    storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    await dataService.logAudit({
      action: 'MEMBERSHIP_ID_SETTINGS_UPDATED',
      performedBy: adminUser.email,
      affectedRecord: 'CARD_SETTINGS',
      metadata: { updatedFields: Object.keys(updates) },
    });

    return updated;
  },

  // ==========================================
  // 2. DATA RETRIEVAL & STATUS COMPUTATION
  // ==========================================
  async getAllCards(): Promise<MembershipCardRecord[]> {
    const raw = storage.get(STORAGE_KEYS.CARDS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async getCardForAlumnus(alumniIdOrNumber: string): Promise<MembershipCardRecord | null> {
    const cards = await this.getAllCards();
    const query = alumniIdOrNumber.trim().toUpperCase();
    const normalize = (s: string) => s.replace(/[\s\-\.]/g, '').toUpperCase();
    const normQ = normalize(query);

    // Find active issued card first, then most recent record
    const matches = cards.filter(c =>
      c.alumniId === alumniIdOrNumber ||
      normalize(c.alumniNumber) === normQ ||
      c.validationNumber.toUpperCase() === query
    );

    if (matches.length === 0) return null;

    // Prioritize active ISSUED card
    const active = matches.find(c => c.status === 'ISSUED');
    if (active) return active;

    // Otherwise return newest
    return matches.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
  },

  async getCardHistory(alumniId: string): Promise<MembershipCardRecord[]> {
    const cards = await this.getAllCards();
    return cards
      .filter(c => c.alumniId === alumniId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  },

  /**
   * Builds the exact personal snapshot from the member's registry record.
   */
  buildCardSnapshot(alumnus: AlumniProfile, settings: MembershipCardSettings): CardDetailsSnapshot {
    const surname = (alumnus.lastName || '').trim().toUpperCase();
    const givenName = [alumnus.firstName, alumnus.middleName]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toUpperCase();

    const nationality = (alumnus.nationality || alumnus.country || 'UGANDAN').trim().toUpperCase();
    const sex = (alumnus.gender || 'MALE').trim().toUpperCase();

    const entryYearNum =
      alumnus.schoolHistory?.oLevel?.yearJoined ||
      alumnus.schoolHistory?.aLevel?.yearJoined ||
      1997;
    const departureYearNum =
      alumnus.schoolHistory?.aLevel?.yearCompleted ||
      alumnus.schoolHistory?.oLevel?.yearCompleted ||
      2001;

    const cohortYearNum = settings.cohortYearBasis === 'COMPLETION' ? departureYearNum : entryYearNum;

    return {
      surname: surname || 'ALUMNI',
      givenName: givenName || 'MEMBER',
      nationality,
      sex,
      cohortYear: cohortYearNum.toString(),
      entryYear: entryYearNum.toString(),
      departureYear: departureYearNum.toString(),
      alumniNumber: alumnus.alumniNumber || 'MA. 0000',
    };
  },

  /**
   * Checks if required fields for card printing are present.
   */
  validateMemberCompleteness(alumnus: AlumniProfile): { complete: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!alumnus.lastName?.trim()) missing.push('Surname');
    if (!alumnus.firstName?.trim()) missing.push('Given Name');
    if (!alumnus.alumniNumber?.trim()) missing.push('MA Membership Number');
    const hasHistory =
      alumnus.schoolHistory?.oLevel?.yearJoined ||
      alumnus.schoolHistory?.aLevel?.yearJoined ||
      alumnus.schoolHistory?.oLevel?.yearCompleted ||
      alumnus.schoolHistory?.aLevel?.yearCompleted;
    if (!hasHistory) missing.push('School Years (Entry / Departure)');

    return { complete: missing.length === 0, missing };
  },

  /**
   * Computes the member-facing card display status.
   */
  computeCardDisplayStatus(
    alumnus: AlumniProfile | null,
    card: MembershipCardRecord | null,
    openCorrectionsCount = 0
  ): MembershipCardDisplayStatus {
    if (!alumnus) return 'NOT_ELIGIBLE';

    // Check membership eligibility: must be ACTIVE or APPROVED
    const isEligible = alumnus.membershipStatus === 'ACTIVE' || alumnus.membershipStatus === 'APPROVED';
    if (!isEligible) {
      if (card && card.status === 'SUSPENDED') return 'SUSPENDED';
      if (card && card.status === 'REVOKED') return 'REVOKED';
      return 'NOT_ELIGIBLE';
    }

    const { complete } = this.validateMemberCompleteness(alumnus);
    if (!complete) return 'AWAITING_DETAILS';

    if (openCorrectionsCount > 0) return 'AWAITING_CORRECTION';

    if (!card) return 'PENDING';

    if (card.status === 'SUSPENDED') return 'SUSPENDED';
    if (card.status === 'REVOKED') return 'REVOKED';

    if (card.expiresAt) {
      const expDate = new Date(card.expiresAt);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        return 'EXPIRED';
      }
    }

    // Check if member updated critical details after issuance
    const currentSurname = (alumnus.lastName || '').trim().toUpperCase();
    const currentGiven = [alumnus.firstName, alumnus.middleName].filter(Boolean).join(' ').trim().toUpperCase();
    if (card.snapshot) {
      if (card.snapshot.surname !== currentSurname || card.snapshot.givenName !== currentGiven) {
        return 'AWAITING_CORRECTION';
      }
    }

    return 'VALID';
  },

  // ==========================================
  // 3. CARD LIFECYCLE (ISSUE, REISSUE, REVOKE)
  // ==========================================
  /**
   * Generates a unique, tamper-resistant validation number (e.g. MOSA-VAL-849201).
   */
  generateValidationNumber(): string {
    const rawRegistry = storage.get(STORAGE_KEYS.VALIDATION_REGISTRY);
    const used: string[] = rawRegistry ? JSON.parse(rawRegistry) : [];

    let candidate = '';
    do {
      // 6-digit numeric validation sequence
      const num = Math.floor(100000 + Math.random() * 900000);
      candidate = `MOSA-VAL-${num}`;
    } while (used.includes(candidate));

    used.push(candidate);
    storage.set(STORAGE_KEYS.VALIDATION_REGISTRY, JSON.stringify(used));
    return candidate;
  },

  /**
   * Generates a high-entropy verification token embedded in QR links.
   */
  generateVerificationToken(): string {
    const rand = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    return `TKN-${Date.now().toString(36)}-${rand.toUpperCase()}`;
  },

  /**
   * Issues an official membership ID card for an eligible alumnus.
   */
  async issueCard(
    alumnus: AlumniProfile,
    adminUser: AuthUser
  ): Promise<{ success: boolean; card?: MembershipCardRecord; error?: string }> {
    try {
      // 1. Eligibility check
      const isEligible = alumnus.membershipStatus === 'ACTIVE' || alumnus.membershipStatus === 'APPROVED';
      if (!isEligible) {
        return {
          success: false,
          error: `Member "${alumnus.alumniNumber}" is currently ${alumnus.membershipStatus} and not eligible for an official membership card.`,
        };
      }

      // 2. Check if active card already exists (anti-duplicate)
      const existing = await this.getCardForAlumnus(alumnus.internalId);
      if (existing && existing.status === 'ISSUED') {
        return {
          success: false,
          error: `An active membership ID card (${existing.validationNumber}) already exists for ${alumnus.alumniNumber}. Use the Reissue action to issue an updated card.`,
        };
      }

      const settings = await this.getCardSettings();
      const snapshot = this.buildCardSnapshot(alumnus, settings);
      const validationNumber = this.generateValidationNumber();
      const verificationToken = this.generateVerificationToken();
      const now = new Date().toISOString();

      let expiresAt: string | undefined = undefined;
      if (settings.validityYears > 0) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + settings.validityYears);
        expiresAt = d.toISOString();
      }

      const newCard: MembershipCardRecord = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        validationNumber,
        verificationToken,
        status: 'ISSUED',
        issueNumber: 1,
        issuedAt: now,
        issuedBy: adminUser.displayName || adminUser.email,
        expiresAt,
        snapshot,
        history: [
          {
            at: now,
            by: adminUser.displayName || adminUser.email,
            action: 'INITIAL_ISSUANCE',
            note: `Official ID card issued with Validation No. ${validationNumber}`,
          },
        ],
      };

      const allCards = await this.getAllCards();
      allCards.unshift(newCard);
      storage.set(STORAGE_KEYS.CARDS, JSON.stringify(allCards));

      // Audit log
      await dataService.logAudit({
        action: 'MEMBERSHIP_ID_CARD_ISSUED',
        performedBy: adminUser.email,
        affectedRecord: alumnus.alumniNumber,
        metadata: {
          validationNumber,
          alumniId: alumnus.internalId,
          alumniNumber: alumnus.alumniNumber,
          issueNumber: 1,
        },
      });

      // Member notification
      await dataService.sendNotification({
        alumniId: alumnus.internalId,
        title: 'Official Membership ID Card Issued',
        message: `Your official MOSA Digital Membership ID Card (Validation No. ${validationNumber}) has been issued by the Secretariat and is ready for download.`,
        type: 'MEMBERSHIP',
        linkTab: 'my-profile',
      });

      return { success: true, card: newCard };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to issue card' };
    }
  },

  /**
   * Reissues a membership card, securely retiring the previous validation number.
   */
  async reissueCard(
    alumnus: AlumniProfile,
    reissueReason: string,
    adminUser: AuthUser
  ): Promise<{ success: boolean; card?: MembershipCardRecord; oldCard?: MembershipCardRecord; error?: string }> {
    try {
      if (!reissueReason?.trim()) {
        return { success: false, error: 'A justification / reason is mandatory for official card reissuance.' };
      }

      const isEligible = alumnus.membershipStatus === 'ACTIVE' || alumnus.membershipStatus === 'APPROVED';
      if (!isEligible) {
        return { success: false, error: 'Member is not eligible for card reissuance due to inactive status.' };
      }

      const allCards = await this.getAllCards();
      const oldCard = allCards.find(c => c.alumniId === alumnus.internalId && c.status === 'ISSUED');

      const settings = await this.getCardSettings();
      const snapshot = this.buildCardSnapshot(alumnus, settings);
      const newValNumber = this.generateValidationNumber();
      const newVerToken = this.generateVerificationToken();
      const now = new Date().toISOString();

      let expiresAt: string | undefined = undefined;
      if (settings.validityYears > 0) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + settings.validityYears);
        expiresAt = d.toISOString();
      }

      const issueNum = (oldCard?.issueNumber || 0) + 1;
      const newCardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      // Update old card to SUPERSEDED
      if (oldCard) {
        oldCard.status = 'SUPERSEDED';
        oldCard.supersededAt = now;
        oldCard.replacedByCardId = newCardId;
        oldCard.history.push({
          at: now,
          by: adminUser.displayName || adminUser.email,
          action: 'SUPERSEDED_BY_REISSUE',
          note: `Reissued as ${newValNumber}. Reason: ${reissueReason}`,
        });
      }

      const newCard: MembershipCardRecord = {
        id: newCardId,
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        validationNumber: newValNumber,
        verificationToken: newVerToken,
        status: 'ISSUED',
        issueNumber: issueNum,
        issuedAt: now,
        issuedBy: adminUser.displayName || adminUser.email,
        expiresAt,
        reissueReason,
        previousCardId: oldCard?.id,
        snapshot,
        history: [
          {
            at: now,
            by: adminUser.displayName || adminUser.email,
            action: 'REISSUANCE',
            note: `Reissued (Issue #${issueNum}). Reason: ${reissueReason}. Replaces ${oldCard?.validationNumber || 'none'}.`,
          },
        ],
      };

      allCards.unshift(newCard);
      storage.set(STORAGE_KEYS.CARDS, JSON.stringify(allCards));

      await dataService.logAudit({
        action: 'MEMBERSHIP_ID_CARD_REISSUED',
        performedBy: adminUser.email,
        affectedRecord: alumnus.alumniNumber,
        metadata: {
          newValidationNumber: newValNumber,
          oldValidationNumber: oldCard?.validationNumber,
          issueNumber: issueNum,
          reissueReason,
        },
      });

      await dataService.sendNotification({
        alumniId: alumnus.internalId,
        title: 'Membership ID Card Reissued',
        message: `An updated MOSA Membership ID Card (Validation No. ${newValNumber}) has been reissued for you. Previous validation numbers are now void.`,
        type: 'MEMBERSHIP',
        linkTab: 'my-profile',
      });

      return { success: true, card: newCard, oldCard };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reissue card' };
    }
  },

  /**
   * Suspends a card without modifying the member's underlying alumni record.
   */
  async suspendCard(
    cardId: string,
    reason: string,
    adminUser: AuthUser
  ): Promise<{ success: boolean; card?: MembershipCardRecord; error?: string }> {
    try {
      const allCards = await this.getAllCards();
      const card = allCards.find(c => c.id === cardId);
      if (!card) return { success: false, error: 'Card record not found' };

      const now = new Date().toISOString();
      card.status = 'SUSPENDED';
      card.suspendedAt = now;
      card.suspendedBy = adminUser.displayName || adminUser.email;
      card.suspensionReason = reason || 'Suspended by administration';
      card.history.push({
        at: now,
        by: adminUser.displayName || adminUser.email,
        action: 'CARD_SUSPENDED',
        note: reason,
      });

      storage.set(STORAGE_KEYS.CARDS, JSON.stringify(allCards));

      await dataService.logAudit({
        action: 'MEMBERSHIP_ID_CARD_SUSPENDED',
        performedBy: adminUser.email,
        affectedRecord: card.alumniNumber,
        metadata: { validationNumber: card.validationNumber, reason },
      });

      return { success: true, card };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Reinstates a suspended card.
   */
  async reinstateCard(
    cardId: string,
    adminUser: AuthUser
  ): Promise<{ success: boolean; card?: MembershipCardRecord; error?: string }> {
    try {
      const allCards = await this.getAllCards();
      const card = allCards.find(c => c.id === cardId);
      if (!card) return { success: false, error: 'Card record not found' };

      const now = new Date().toISOString();
      card.status = 'ISSUED';
      card.suspendedAt = undefined;
      card.suspendedBy = undefined;
      card.suspensionReason = undefined;
      card.history.push({
        at: now,
        by: adminUser.displayName || adminUser.email,
        action: 'CARD_REINSTATED',
        note: 'Reinstated to active valid status by administration',
      });

      storage.set(STORAGE_KEYS.CARDS, JSON.stringify(allCards));

      await dataService.logAudit({
        action: 'MEMBERSHIP_ID_CARD_REINSTATED',
        performedBy: adminUser.email,
        affectedRecord: card.alumniNumber,
        metadata: { validationNumber: card.validationNumber },
      });

      return { success: true, card };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Revokes a card permanently.
   */
  async revokeCard(
    cardId: string,
    reason: string,
    adminUser: AuthUser
  ): Promise<{ success: boolean; card?: MembershipCardRecord; error?: string }> {
    try {
      const allCards = await this.getAllCards();
      const card = allCards.find(c => c.id === cardId);
      if (!card) return { success: false, error: 'Card record not found' };

      const now = new Date().toISOString();
      card.status = 'REVOKED';
      card.revokedAt = now;
      card.revokedBy = adminUser.displayName || adminUser.email;
      card.revocationReason = reason || 'Revoked by administration';
      card.history.push({
        at: now,
        by: adminUser.displayName || adminUser.email,
        action: 'CARD_REVOKED',
        note: reason,
      });

      storage.set(STORAGE_KEYS.CARDS, JSON.stringify(allCards));

      await dataService.logAudit({
        action: 'MEMBERSHIP_ID_CARD_REVOKED',
        performedBy: adminUser.email,
        affectedRecord: card.alumniNumber,
        metadata: { validationNumber: card.validationNumber, reason },
      });

      return { success: true, card };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Bulk issues cards for selected eligible alumni.
   */
  async bulkIssueCards(
    alumniList: AlumniProfile[],
    adminUser: AuthUser
  ): Promise<{ issued: MembershipCardRecord[]; skipped: Array<{ alumnus: AlumniProfile; reason: string }> }> {
    const issued: MembershipCardRecord[] = [];
    const skipped: Array<{ alumnus: AlumniProfile; reason: string }> = [];

    for (const a of alumniList) {
      const isEligible = a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED';
      if (!isEligible) {
        skipped.push({ alumnus: a, reason: `Status is ${a.membershipStatus} (must be ACTIVE or APPROVED)` });
        continue;
      }

      const { complete, missing } = this.validateMemberCompleteness(a);
      if (!complete) {
        skipped.push({ alumnus: a, reason: `Incomplete record: Missing ${missing.join(', ')}` });
        continue;
      }

      const existing = await this.getCardForAlumnus(a.internalId);
      if (existing && existing.status === 'ISSUED') {
        skipped.push({ alumnus: a, reason: `Already has active card ${existing.validationNumber}` });
        continue;
      }

      const res = await this.issueCard(a, adminUser);
      if (res.success && res.card) {
        issued.push(res.card);
      } else {
        skipped.push({ alumnus: a, reason: res.error || 'Issuance failed' });
      }
    }

    return { issued, skipped };
  },

  // ==========================================
  // 4. CORRECTION REQUESTS
  // ==========================================
  async getCorrectionRequests(alumniId?: string): Promise<CardCorrectionRequest[]> {
    const raw = storage.get(STORAGE_KEYS.CORRECTIONS);
    const list: CardCorrectionRequest[] = raw ? JSON.parse(raw) : [];
    if (alumniId) {
      return list.filter(c => c.alumniId === alumniId);
    }
    return list;
  },

  async submitCorrectionRequest(
    data: Omit<CardCorrectionRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<CardCorrectionRequest> {
    const all = await this.getCorrectionRequests();
    const newReq: CardCorrectionRequest = {
      ...data,
      id: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    all.unshift(newReq);
    storage.set(STORAGE_KEYS.CORRECTIONS, JSON.stringify(all));

    await dataService.logAudit({
      action: 'CARD_CORRECTION_REQUESTED',
      performedBy: data.alumniNumber,
      affectedRecord: data.alumniNumber,
      metadata: { fields: data.fields.map(f => f.field) },
    });

    return newReq;
  },

  async resolveCorrectionRequest(
    id: string,
    resolution: 'RESOLVED' | 'REJECTED',
    adminUser: AuthUser,
    note?: string
  ): Promise<void> {
    const all = await this.getCorrectionRequests();
    const target = all.find(c => c.id === id);
    if (!target) return;

    target.status = resolution;
    target.resolvedAt = new Date().toISOString();
    target.resolvedBy = adminUser.displayName || adminUser.email;
    target.resolutionNote = note;

    storage.set(STORAGE_KEYS.CORRECTIONS, JSON.stringify(all));

    await dataService.sendNotification({
      alumniId: target.alumniId,
      title: `Card Correction Request ${resolution}`,
      message: `Your requested correction for membership ID card details has been ${resolution.toLowerCase()} by ${adminUser.displayName || 'administration'}.${note ? ` Note: ${note}` : ''}`,
      type: 'MEMBERSHIP',
      linkTab: 'my-profile',
    });
  },

  // ==========================================
  // 5. PUBLIC QR VERIFICATION (SECURE)
  // ==========================================
  /**
   * Public card verification. Discloses ONLY approved non-sensitive verification details:
   * Member name, MA number, validation number, status, issue date.
   * NEVER exposes phone, email, date of birth, home address.
   */
  async verifyCard(queryTokenOrValNum: string): Promise<CardVerificationResult> {
    const clean = queryTokenOrValNum.trim().toUpperCase();
    if (!clean) {
      return {
        found: false,
        valid: false,
        state: 'NOT_FOUND',
        message: 'No verification token or card validation number provided.',
      };
    }

    const allCards = await this.getAllCards();
    const card = allCards.find(c =>
      c.verificationToken.toUpperCase() === clean ||
      c.validationNumber.toUpperCase() === clean ||
      c.validationNumber.toUpperCase().replace(/[\s\-]/g, '') === clean.replace(/[\s\-]/g, '')
    );

    if (!card) {
      return {
        found: false,
        valid: false,
        state: 'NOT_FOUND',
        message: `No issued MOSA membership ID card found matching "${queryTokenOrValNum}". Please verify with the MOSA Secretariat.`,
      };
    }

    // Retrieve corresponding member from registry
    const alumnus = await dataService.getAlumniById(card.alumniId);
    const memberName = card.snapshot
      ? `${card.snapshot.givenName} ${card.snapshot.surname}`
      : alumnus?.fullName || alumnus?.firstName + ' ' + alumnus?.lastName;

    if (card.status === 'SUPERSEDED') {
      return {
        found: true,
        valid: false,
        state: 'SUPERSEDED',
        memberName,
        alumniNumber: card.alumniNumber,
        validationNumber: card.validationNumber,
        issuedAt: card.issuedAt,
        message: `This card (Validation No. ${card.validationNumber}) has been SUPERSEDED by an authorized reissuance and is no longer valid.`,
      };
    }

    if (card.status === 'REVOKED') {
      return {
        found: true,
        valid: false,
        state: 'REVOKED',
        memberName,
        alumniNumber: card.alumniNumber,
        validationNumber: card.validationNumber,
        issuedAt: card.issuedAt,
        message: `This card has been REVOKED by the MOSA Secretariat. ${card.revocationReason ? `Reason: ${card.revocationReason}` : ''}`,
      };
    }

    if (card.status === 'SUSPENDED') {
      return {
        found: true,
        valid: false,
        state: 'SUSPENDED',
        memberName,
        alumniNumber: card.alumniNumber,
        validationNumber: card.validationNumber,
        issuedAt: card.issuedAt,
        message: `This card is currently SUSPENDED pending review.`,
      };
    }

    if (card.expiresAt && new Date(card.expiresAt).getTime() < Date.now()) {
      return {
        found: true,
        valid: false,
        state: 'EXPIRED',
        memberName,
        alumniNumber: card.alumniNumber,
        validationNumber: card.validationNumber,
        issuedAt: card.issuedAt,
        expiresAt: card.expiresAt,
        message: `This card EXPIRED on ${new Date(card.expiresAt).toLocaleDateString()}.`,
      };
    }

    if (alumnus && alumnus.membershipStatus !== 'ACTIVE' && alumnus.membershipStatus !== 'APPROVED') {
      return {
        found: true,
        valid: false,
        state: 'MEMBERSHIP_INACTIVE',
        memberName,
        alumniNumber: card.alumniNumber,
        validationNumber: card.validationNumber,
        message: `The underlying membership record is ${alumnus.membershipStatus}.`,
      };
    }

    return {
      found: true,
      valid: true,
      state: 'VALID',
      memberName,
      alumniNumber: card.alumniNumber,
      validationNumber: card.validationNumber,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
      message: `Official Authenticated MOSA Membership ID Card. Member is in good standing with Mandela Old Students Association (MASSH, Est. 1997).`,
    };
  },

  // ==========================================
  // 6. GENUINE PRINT-READY PDF GENERATION (JSPDF)
  // ==========================================
  /**
   * Generates a genuine print-ready PDF document matching "MOSA - IDs-3.pdf" exactly.
   * Standard ID-1 CR80 credit card dimensions: 85.6 mm × 53.98 mm.
   */
  async generateCardPdf(
    alumnus: AlumniProfile,
    card: MembershipCardRecord,
    settings: MembershipCardSettings,
    mode: 'DUPLEX' | 'SIDE_BY_SIDE' = 'DUPLEX'
  ): Promise<jsPDF> {
    const snapshot = card.snapshot || this.buildCardSnapshot(alumnus, settings);

    // Generate verified QR code data URL
    const baseUrl = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://mandelassalumni.com';
    const qrTargetUrl = `${baseUrl}/?verify-card=${encodeURIComponent(card.verificationToken)}`;
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      margin: 1,
      width: 250,
      color: { dark: '#0B203E', light: '#FFFFFF' },
    });

    // Helper: format date like template "05 SEPT 19XX"
    const formatDate = (isoDate?: string) => {
      if (!isoDate) return '05 SEPT 2026';
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const issueDateStr = formatDate(card.issuedAt);

    if (mode === 'SIDE_BY_SIDE') {
      // 175 mm × 56 mm sheet containing Front and Back side-by-side with cutting guide
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [175, 56],
      });

      await this.drawCardFrontOnDoc(doc, 2, 1, 85.6, 53.98, snapshot, alumnus, settings, issueDateStr);
      // Cut guide
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(88.8, 0, 88.8, 56);
      doc.setLineDashPattern([], 0);

      await this.drawCardBackOnDoc(doc, 90, 1, 85.6, 53.98, snapshot, settings, qrDataUrl);
      return doc;
    }

    // Default DUPLEX mode: Page 1 Front (85.6 × 54 mm), Page 2 Back (85.6 × 54 mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98],
    });

    // PAGE 1: FRONT
    await this.drawCardFrontOnDoc(doc, 0, 0, 85.6, 53.98, snapshot, alumnus, settings, issueDateStr);

    // PAGE 2: BACK
    doc.addPage([85.6, 53.98], 'landscape');
    await this.drawCardBackOnDoc(doc, 0, 0, 85.6, 53.98, snapshot, settings, qrDataUrl);

    return doc;
  },

  /**
   * Draws the front of the ID card on a jsPDF instance at given coordinates.
   */
  async drawCardFrontOnDoc(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    snapshot: CardDetailsSnapshot,
    alumnus: AlumniProfile,
    settings: MembershipCardSettings,
    issueDateStr: string
  ): Promise<void> {
    // 1. Pale cream background
    doc.setFillColor(243, 246, 232); // #F3F6E8
    doc.rect(x, y, w, h, 'F');

    // 2. Left Navy Arc Sweep & Lime Accent Ring
    // Outer lime circle arc
    doc.setFillColor(210, 224, 56); // #D2E038 lime
    doc.circle(x - 5, y + h / 2, 28, 'F');

    // Inner deep navy circle sweep
    doc.setFillColor(11, 32, 62); // #0B203E
    doc.circle(x - 6, y + h / 2, 26, 'F');

    // 3. Member Photo (Circular with gold/yellow border)
    const photoCenterX = x + 18;
    const photoCenterY = y + h / 2;
    const photoRadius = 12;

    // Outer photo yellow accent ring
    doc.setDrawColor(210, 224, 56);
    doc.setLineWidth(1.2);
    doc.circle(photoCenterX, photoCenterY, photoRadius + 1, 'S');

    // Photo placeholder or image
    let photoAdded = false;
    if (alumnus.photoUrl && alumnus.photoUrl.startsWith('data:image')) {
      try {
        // Draw photo cropped square / circle representation
        doc.addImage(alumnus.photoUrl, 'JPEG', photoCenterX - photoRadius, photoCenterY - photoRadius, photoRadius * 2, photoRadius * 2);
        photoAdded = true;
      } catch {
        photoAdded = false;
      }
    }

    if (!photoAdded) {
      // Clean avatar placeholder circle
      doc.setFillColor(180, 205, 230);
      doc.circle(photoCenterX, photoCenterY, photoRadius, 'F');
      // Silhouette head & shoulders
      doc.setFillColor(11, 32, 62);
      doc.circle(photoCenterX, photoCenterY - 2, 4.5, 'F');
      doc.ellipse(photoCenterX, photoCenterY + 9, 8, 5, 'F');
    }

    // 4. Header: Mandela Old Students Association (MOSA)
    const textStartX = x + 35;
    doc.setTextColor(11, 32, 62); // Navy
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('MANDELA OLD STUDENTS', textStartX + 12, y + 6.5, { align: 'center' });
    doc.text('ASSOCIATION (MOSA)', textStartX + 12, y + 10.2, { align: 'center' });

    // 5. "Membership ID Card" Green Pill Badge
    doc.setFillColor(84, 140, 78); // #548C4E Green
    doc.roundedRect(textStartX + 1, y + 12, 24, 3.8, 1.6, 1.6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text('Membership ID Card', textStartX + 13, y + 14.7, { align: 'center' });

    // 6. Top Right School Crest
    try {
      const crestUrl = settings.crestDataUrl || svgToDataUrl(getMosaCrestSvg(120));
      doc.addImage(crestUrl, 'PNG', x + w - 15.5, y + 3, 12.5, 12.5);
    } catch {
      // Fallback seal circle
      doc.setDrawColor(78, 135, 70);
      doc.setLineWidth(0.8);
      doc.circle(x + w - 9, y + 9, 6, 'S');
    }

    // 7. Personal Data Fields Grid
    const fX = textStartX - 1;
    let currY = y + 19.5;

    // Surname
    doc.setTextColor(90, 104, 116); // Label gray
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.text('Surname:', fX, currY);
    currY += 3.2;
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(snapshot.surname, fX, currY);
    currY += 4.2;

    // Given Name
    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.text('Given Name:', fX, currY);
    currY += 3.2;
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(snapshot.givenName, fX, currY);
    currY += 4.5;

    // Row: Nationality & Sex
    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Nationality:', fX, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(snapshot.nationality, fX + 11.5, currY);

    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Sex:', fX + 27, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(snapshot.sex, fX + 32, currY);
    currY += 3.8;

    // Row: Cohort year & MA No.
    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Cohort year:', fX, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(snapshot.cohortYear, fX + 13, currY);

    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('MA No.', fX + 23.5, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text(snapshot.alumniNumber, fX + 31.5, currY);
    currY += 3.8;

    // Row: Entry year & Departure year
    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Entry year:', fX, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(snapshot.entryYear, fX + 11.5, currY);

    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.text('Departure year:', fX + 21, currY);
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(snapshot.departureYear, fX + 37, currY);
    currY += 4.2;

    // Row: Issue Date & Holder's Signature
    doc.setTextColor(90, 104, 116);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.text('Issue Date:', fX, currY);

    doc.text("Holder's", fX + 21, currY);
    doc.text('Signature', fX + 21, currY + 2.5);

    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    doc.text(issueDateStr, fX, currY + 3.2);

    // Holder's signature stroke
    const sigUrl = alumnus.signatureUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 80, 32));
    try {
      doc.addImage(sigUrl, 'PNG', fX + 31, currY - 2.5, 13, 6);
    } catch {
      doc.setDrawColor(19, 50, 86);
      doc.line(fX + 31, currY + 2.5, fX + 43, currY + 2.5);
    }
  },

  /**
   * Draws the back of the ID card on a jsPDF instance.
   */
  async drawCardBackOnDoc(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    snapshot: CardDetailsSnapshot,
    settings: MembershipCardSettings,
    qrDataUrl: string
  ): Promise<void> {
    // 1. Pale cream background
    doc.setFillColor(243, 246, 232); // #F3F6E8
    doc.rect(x, y, w, h, 'F');

    // 2. Top statement: "This is property of:"
    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(settings.ownershipStatement || 'This is property of:', x + w / 2, y + 5.5, { align: 'center' });

    // 3. Center Navy Banner across card
    const bannerY = y + 8.5;
    const bannerH = 14.5;
    doc.setFillColor(11, 32, 62); // #0B203E deep navy
    doc.rect(x, bannerY, w, bannerH, 'F');

    // Banner Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(settings.associationName || 'Mandela Old Students Association (MOSA)', x + w / 2, bannerY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.text(`Tel: ${settings.phoneNumbers.join(', ')}`, x + w / 2, bannerY + 7.2, { align: 'center' });
    doc.text(`Email: ${settings.email}`, x + w / 2, bannerY + 10.2, { align: 'center' });
    doc.text(`Website: ${settings.website}`, x + w / 2, bannerY + 13.2, { align: 'center' });

    // 4. Bottom Area: Authorisation Signatures on Left
    const sigStartY = y + 26;

    // Chairman MOSA signature
    try {
      const sig1 = settings.chairmanMosa.signatureDataUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 80, 30));
      doc.addImage(sig1, 'PNG', x + 16, sigStartY, 14, 5.5);
    } catch {}

    doc.setDrawColor(11, 32, 62);
    doc.setLineWidth(0.3);
    doc.line(x + 10, sigStartY + 6, x + 36, sigStartY + 6);

    doc.setTextColor(11, 32, 62);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(settings.chairmanMosa.title || 'Chairman MOSA', x + 23, sigStartY + 8.8, { align: 'center' });

    // Chairman BOG Massh signature
    const sig2Y = sigStartY + 11.5;
    try {
      const sig2 = settings.chairmanBog.signatureDataUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 80, 30));
      doc.addImage(sig2, 'PNG', x + 16, sig2Y, 14, 5.5);
    } catch {}

    doc.line(x + 10, sig2Y + 6, x + 36, sig2Y + 6);
    doc.text(settings.chairmanBog.title || 'Chairman BOG Massh', x + 23, sig2Y + 8.8, { align: 'center' });

    // 5. Validated Scannable QR Code on Right
    const qrSize = 17;
    const qrX = x + w - 28;
    const qrY = y + 27;

    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {}

    // Green Corner Brackets [ ] around QR
    doc.setDrawColor(88, 145, 82); // #589152 green
    doc.setLineWidth(0.6);
    const bracketLen = 3;

    // Top-left corner
    doc.line(qrX - 1.5, qrY - 1.5, qrX - 1.5 + bracketLen, qrY - 1.5);
    doc.line(qrX - 1.5, qrY - 1.5, qrX - 1.5, qrY - 1.5 + bracketLen);

    // Top-right corner
    doc.line(qrX + qrSize + 1.5, qrY - 1.5, qrX + qrSize + 1.5 - bracketLen, qrY - 1.5);
    doc.line(qrX + qrSize + 1.5, qrY - 1.5, qrX + qrSize + 1.5, qrY - 1.5 + bracketLen);

    // Bottom-left corner
    doc.line(qrX - 1.5, qrY + qrSize + 1.5, qrX - 1.5 + bracketLen, qrY + qrSize + 1.5);
    doc.line(qrX - 1.5, qrY + qrSize + 1.5, qrX - 1.5, qrY + qrSize + 1.5 - bracketLen);

    // Bottom-right corner
    doc.line(qrX + qrSize + 1.5, qrY + qrSize + 1.5, qrX + qrSize + 1.5 - bracketLen, qrY + qrSize + 1.5);
    doc.line(qrX + qrSize + 1.5, qrY + qrSize + 1.5, qrX + qrSize + 1.5, qrY + qrSize + 1.5 - bracketLen);
  },

  /**
   * Generates a bulk PDF containing all selected cards.
   */
  async generateBulkCardsPdf(
    items: Array<{ alumnus: AlumniProfile; card: MembershipCardRecord }>,
    settings: MembershipCardSettings
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98],
    });

    for (let i = 0; i < items.length; i++) {
      const { alumnus, card } = items[i];
      if (i > 0) {
        doc.addPage([85.6, 53.98], 'landscape');
      }

      const snapshot = card.snapshot || this.buildCardSnapshot(alumnus, settings);
      const baseUrl = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://mandelassalumni.com';
      const qrTargetUrl = `${baseUrl}/?verify-card=${encodeURIComponent(card.verificationToken)}`;
      const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        margin: 1,
        width: 250,
        color: { dark: '#0B203E', light: '#FFFFFF' },
      });

      const issueDateStr = new Date(card.issuedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();

      // Front
      await this.drawCardFrontOnDoc(doc, 0, 0, 85.6, 53.98, snapshot, alumnus, settings, issueDateStr);

      // Back
      doc.addPage([85.6, 53.98], 'landscape');
      await this.drawCardBackOnDoc(doc, 0, 0, 85.6, 53.98, snapshot, settings, qrDataUrl);
    }

    return doc;
  },
};
