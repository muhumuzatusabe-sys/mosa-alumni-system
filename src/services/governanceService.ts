/**
 * MOSA Governance Service
 *
 * - Role-based, module-level permissions (Super Admin controls the boundaries)
 * - Administrator / staff account management
 * - Authentication strategy settings
 * - Smart Meeting Attendance (self, assisted, guest, verification, finalization, reports)
 *
 * Note: in the local demo mode these rules are enforced in this service layer. When a
 * Firestore backend is connected the same rules must be mirrored in Firestore Security Rules.
 */
import {
  AuthUser,
  UserRole,
  PermissionModule,
  PermissionAction,
  ModulePermissions,
  RolePermissionMatrix,
  AuthSettings,
  Meeting,
  MeetingAttendanceRecord,
  MeetingAttendanceState,
  AttendeeType,
  AttendanceSource,
  AlumniProfile,
  AlumniApplication,
} from '../types';
import { dataService } from './dataService';

const KEYS = {
  ROLE_MATRIX: 'mosa_role_permissions',
  USERS: 'mosa_users',
  AUTH: 'mosa_auth_settings',
  MEETINGS: 'mosa_meetings',
  ATTENDANCE: 'mosa_meeting_attendance',
  APPLICATIONS: 'mosa_applications',
};

const mem: Record<string, string> = {};
const store = {
  get(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return mem[key] ?? null;
  },
  set(key: string, val: string) {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, val); } catch {}
    }
    mem[key] = val;
  },
};

const readJSON = <T,>(key: string, fallback: T): T => {
  const raw = store.get(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ==========================================
// PERMISSIONS
// ==========================================
export const PERMISSION_MODULES: Array<{ key: PermissionModule; label: string }> = [
  { key: 'REGISTRY', label: 'Alumni Registry' },
  { key: 'ATTENDANCE', label: 'Meeting Attendance' },
  { key: 'FINANCE', label: 'Contributions & Finance' },
  { key: 'COMMUNICATIONS', label: 'Announcements & News' },
  { key: 'EVENTS', label: 'Events' },
  { key: 'OPPORTUNITIES', label: 'Opportunities & Mentorship' },
  { key: 'ELECTIONS', label: 'Elections & Voting' },
  { key: 'CHAPTERS', label: 'Chapters' },
  { key: 'DOCUMENTS', label: 'Documents' },
  { key: 'REPORTS', label: 'Reports & Exports' },
  { key: 'SETTINGS', label: 'System Settings' },
  { key: 'USERS', label: 'Administrators & Roles' },
  { key: 'AUDIT', label: 'Audit Logs' },
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  'VIEW', 'ADD', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY', 'EXPORT', 'PUBLISH', 'MANAGE', 'CONFIGURE',
];

export const ADMIN_ROLES: Array<{ key: UserRole; label: string; description: string }> = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full control. Manages administrators, roles, permissions and system settings.' },
  { key: 'SECRETARY', label: 'Secretary / Registry Administrator', description: 'Alumni registry, applications, MA numbers, verification and meeting attendance.' },
  { key: 'TREASURER', label: 'Treasurer / Finance', description: 'Voluntary contributions, verified payments, campaigns and financial reports.' },
  { key: 'MEMBERSHIP_ADMIN', label: 'Membership & Verification', description: 'Applications queue, credential review, approval/rejections, and MA verification.' },
  { key: 'DIRECTORY_ADMIN', label: 'Alumni Directory Manager', description: 'Alumni records, directory moderation, cohort cohorts & chapter networks.' },
  { key: 'EVENTS_ATTENDANCE_ADMIN', label: 'Events & Attendance Manager', description: 'Assemblies, reunions, meeting roll calls, check-in & attendance reports.' },
  { key: 'PUBLICITY', label: 'Communications / Publicity', description: 'Official announcements, circulars, news and media.' },
  { key: 'CHAPTER_ADMIN', label: 'Chapter Administrator', description: 'Regional and university chapter membership and coordination.' },
  { key: 'CUSTOM_STAFF', label: 'Custom Administrative Role', description: 'Tailored permissions configured specifically by the Super Administrator.' },
];

const DEFAULT_MATRIX: RolePermissionMatrix = {
  SECRETARY: {
    REGISTRY: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'REJECT', 'VERIFY', 'EXPORT'],
    ATTENDANCE: ['VIEW', 'ADD', 'EDIT', 'VERIFY', 'REJECT', 'APPROVE', 'EXPORT', 'MANAGE'],
    EVENTS: ['VIEW'],
    CHAPTERS: ['VIEW'],
    DOCUMENTS: ['VIEW', 'ADD'],
    REPORTS: ['VIEW', 'EXPORT'],
  },
  TREASURER: {
    FINANCE: ['VIEW', 'ADD', 'EDIT', 'VERIFY', 'REJECT', 'EXPORT', 'CONFIGURE', 'MANAGE'],
    REPORTS: ['VIEW', 'EXPORT'],
    DOCUMENTS: ['VIEW'],
  },
  MEMBERSHIP_ADMIN: {
    REGISTRY: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'REJECT', 'VERIFY', 'EXPORT'],
    REPORTS: ['VIEW', 'EXPORT'],
    DOCUMENTS: ['VIEW'],
  },
  DIRECTORY_ADMIN: {
    REGISTRY: ['VIEW', 'EDIT', 'EXPORT'],
    CHAPTERS: ['VIEW', 'EDIT'],
  },
  EVENTS_ATTENDANCE_ADMIN: {
    EVENTS: ['VIEW', 'ADD', 'EDIT', 'PUBLISH', 'MANAGE'],
    ATTENDANCE: ['VIEW', 'ADD', 'EDIT', 'VERIFY', 'REJECT', 'APPROVE', 'EXPORT', 'MANAGE'],
  },
  PUBLICITY: {
    COMMUNICATIONS: ['VIEW', 'ADD', 'EDIT', 'PUBLISH', 'MANAGE'],
    EVENTS: ['VIEW', 'ADD', 'EDIT', 'PUBLISH'],
    DOCUMENTS: ['VIEW'],
  },
  CHAPTER_ADMIN: {
    CHAPTERS: ['VIEW', 'EDIT'],
    COMMUNICATIONS: ['VIEW', 'ADD'],
    ATTENDANCE: ['VIEW', 'ADD'],
  },
  CUSTOM_STAFF: {
    REGISTRY: ['VIEW'],
    COMMUNICATIONS: ['VIEW'],
  },
  ALUMNI: {},
  USER: {},
};

export const isStaffRole = (role?: UserRole | null): boolean =>
  !!role && role !== 'ALUMNI' && role !== 'USER';

// ==========================================
// ATTENDANCE LABELS
// ==========================================
export const ATTENDEE_TYPE_LABELS: Record<AttendeeType, string> = {
  ALUMNI_MEMBER: 'Alumni Member',
  PENDING_ALUMNI: 'Pending Alumni',
  GUEST: 'Guest',
  NON_ALUMNUS: 'Non-Alumnus',
  INVITED_OFFICIAL: 'Invited Official',
  OTHER: 'Other',
};

export const ATTENDANCE_STATE_LABELS: Record<MeetingAttendanceState, string> = {
  CLOSED: 'Closed',
  OPEN: 'Open',
  CHECKIN_CLOSED: 'Check-in Closed',
  FINALIZED: 'Finalized',
};

export interface AttendanceStats {
  registered: number;
  verified: number;
  pending: number;
  removed: number;
  expected: number;
  present: number;
  byType: Record<AttendeeType, number>;
  bySource: Partial<Record<AttendanceSource, number>>;
  late: number;
  attendancePercentage: number;
}

export const governanceService = {
  // ------------------------------------------
  // Permissions
  // ------------------------------------------
  getRoleMatrix(): RolePermissionMatrix {
    const saved = readJSON<RolePermissionMatrix>(KEYS.ROLE_MATRIX, {});
    return { ...DEFAULT_MATRIX, ...saved };
  },

  async updateRolePermissions(role: UserRole, perms: ModulePermissions, actor: AuthUser): Promise<void> {
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
      throw new Error('Only a Super Admin can change role permissions.');
    }
    if (role === 'SUPER_ADMIN') throw new Error('Super Admin permissions cannot be restricted.');
    const matrix = this.getRoleMatrix();
    matrix[role] = perms;
    store.set(KEYS.ROLE_MATRIX, JSON.stringify(matrix));
    await dataService.logAudit({
      action: 'ROLE_PERMISSIONS_UPDATED',
      performedBy: actor.email,
      affectedRecord: role,
      metadata: perms as Record<string, any>,
    });
  },

  can(user: AuthUser | null | undefined, module: PermissionModule, action: PermissionAction = 'VIEW'): boolean {
    if (!user) return false;
    // Super Admin has unrestricted authority across all modules
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;

    // Check granular permissions assigned directly to this user or office
    if (user.granularPermissions?.[module]) {
      const actions = user.granularPermissions[module] || [];
      if (actions.includes(action) || actions.includes('MANAGE') || (action === 'VIEW' && actions.length > 0)) {
        return true;
      }
    }

    // Check custom assignedPermissions if user has explicit modular overrides
    if (user.assignedPermissions && user.assignedPermissions.includes(module)) {
      if (action === 'VIEW') return true;
    }

    const perms = this.getRoleMatrix()[user.role]?.[module] || [];
    return perms.includes(action) || perms.includes('MANAGE');
  },

  // ------------------------------------------
  // Administrator accounts
  // ------------------------------------------
  getStaffAccounts(): AuthUser[] {
    const users = readJSON<AuthUser[]>(KEYS.USERS, []);
    return users.filter(u => isStaffRole(u.role));
  },

  /** Make sure the role demo accounts exist even on installs created before roles were introduced. */
  ensureSeedStaff(): void {
    const users = readJSON<AuthUser[]>(KEYS.USERS, []);
    const seeds: AuthUser[] = [
      { uid: 'staff-secretary-01', email: 'secretary@massh.ac.ug', role: 'SECRETARY', displayName: 'MOSA Secretary General', active: true },
      { uid: 'staff-treasurer-01', email: 'treasurer@massh.ac.ug', role: 'TREASURER', displayName: 'MOSA Honorary Treasurer', active: true },
      { uid: 'staff-publicity-01', email: 'publicity@massh.ac.ug', role: 'PUBLICITY', displayName: 'MOSA Publicity Secretary', active: true },
    ];
    let changed = false;
    seeds.forEach(s => {
      if (!users.some(u => u.email.toLowerCase() === s.email)) { users.push(s); changed = true; }
    });
    if (changed || users.length === 0) store.set(KEYS.USERS, JSON.stringify(users));
  },

  async saveStaffAccount(
    account: { 
      uid?: string; 
      email: string; 
      displayName: string; 
      role: UserRole; 
      chapterIds?: string[]; 
      active?: boolean; 
      phone?: string;
      alumniId?: string;
      alumniNumber?: string;
      photoUrl?: string;
      assignedPermissions?: PermissionModule[];
      roleTitle?: string;
    },
    actor: AuthUser
  ): Promise<AuthUser> {
    if (!this.can(actor, 'USERS', 'MANAGE')) throw new Error('You are not permitted to manage administrators.');
    if (account.role === 'ALUMNI') throw new Error('Choose an administrative role.');
    const users = readJSON<AuthUser[]>(KEYS.USERS, []);
    const email = account.email.trim().toLowerCase();
    const existingIdx = users.findIndex(u => (account.uid && u.uid === account.uid) || u.email.toLowerCase() === email);
    const record: AuthUser = {
      ...(existingIdx >= 0 ? users[existingIdx] : {}),
      uid: account.uid || (existingIdx >= 0 ? users[existingIdx].uid : uid('staff')),
      email,
      displayName: account.displayName.trim(),
      role: account.role,
      chapterIds: account.role === 'CHAPTER_ADMIN' ? account.chapterIds || [] : undefined,
      active: account.active !== false,
      phone: account.phone,
      alumniId: account.alumniId,
      alumniNumber: account.alumniNumber,
      photoUrl: account.photoUrl,
      assignedPermissions: account.assignedPermissions,
      roleTitle: account.roleTitle,
    };
    if (existingIdx >= 0) users[existingIdx] = record; else users.push(record);
    store.set(KEYS.USERS, JSON.stringify(users));
    await dataService.logAudit({
      action: existingIdx >= 0 ? 'ADMIN_ACCOUNT_UPDATED' : 'ADMIN_ACCOUNT_CREATED',
      performedBy: actor.email,
      affectedRecord: record.uid,
      metadata: { email: record.email, role: record.role, active: record.active, alumniNumber: record.alumniNumber },
    });
    return record;
  },

  // ------------------------------------------
  // Authentication strategy
  // ------------------------------------------
  getAuthSettings(): AuthSettings {
    return {
      allowEmailPassword: true,
      allowPhonePassword: true,
      allowPhoneOtp: false,
      allowMANumberPassword: false,
      ...readJSON<Partial<AuthSettings>>(KEYS.AUTH, {}),
    };
  },

  async updateAuthSettings(settings: AuthSettings, actor: AuthUser): Promise<void> {
    if (!this.can(actor, 'SETTINGS', 'CONFIGURE')) throw new Error('Not permitted.');
    store.set(KEYS.AUTH, JSON.stringify(settings));
    await dataService.logAudit({
      action: 'AUTH_STRATEGY_UPDATED',
      performedBy: actor.email,
      affectedRecord: 'auth_settings',
      metadata: settings as unknown as Record<string, any>,
    });
  },

  // ------------------------------------------
  // Meetings
  // ------------------------------------------
  getMeetings(): Meeting[] {
    const list = readJSON<Meeting[]>(KEYS.MEETINGS, []);
    return [...list].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  },

  getMeeting(id: string): Meeting | undefined {
    return this.getMeetings().find(m => m.id === id);
  },

  saveMeetings(list: Meeting[]) {
    store.set(KEYS.MEETINGS, JSON.stringify(list));
  },

  async createMeeting(
    data: Omit<Meeting, 'id' | 'attendanceState' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    actor: AuthUser
  ): Promise<Meeting> {
    if (!this.can(actor, 'ATTENDANCE', 'ADD')) throw new Error('You are not permitted to create meetings.');
    const now = new Date().toISOString();
    const meeting: Meeting = {
      ...data,
      id: uid('mtg'),
      attendanceState: 'CLOSED', // never opens automatically
      createdBy: actor.email,
      createdAt: now,
      updatedAt: now,
    };
    const list = readJSON<Meeting[]>(KEYS.MEETINGS, []);
    list.push(meeting);
    this.saveMeetings(list);
    await dataService.logAudit({ action: 'MEETING_CREATED', performedBy: actor.email, affectedRecord: meeting.id, metadata: { title: meeting.title, date: meeting.date } });
    await this.notifyAllMembers('New MOSA meeting scheduled', `${meeting.title} on ${meeting.date} at ${meeting.venue}.`);
    return meeting;
  },

  async changeAttendanceState(
    meetingId: string,
    target: MeetingAttendanceState,
    actor: AuthUser,
    reason?: string
  ): Promise<Meeting> {
    const list = readJSON<Meeting[]>(KEYS.MEETINGS, []);
    const idx = list.findIndex(m => m.id === meetingId);
    if (idx < 0) throw new Error('Meeting not found.');
    const m = { ...list[idx] };
    const now = new Date().toISOString();

    if (m.attendanceState === 'FINALIZED') {
      // Only Super Admin may reopen, and reopening must carry a reason
      if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
        throw new Error('Finalized attendance can only be reopened by a Super Admin.');
      }
      if (!reason || !reason.trim()) throw new Error('A reason is required to reopen finalized attendance.');
      m.reopenHistory = [...(m.reopenHistory || []), { at: now, by: actor.email, reason: reason.trim() }];
    } else if (!this.can(actor, 'ATTENDANCE', 'MANAGE')) {
      throw new Error('You are not permitted to control attendance.');
    }

    if (target === 'OPEN') { m.openedAt = now; m.openedBy = actor.email; }
    if (target === 'CHECKIN_CLOSED') { m.checkInClosedAt = now; m.checkInClosedBy = actor.email; }
    if (target === 'FINALIZED') { m.finalizedAt = now; m.finalizedBy = actor.email; }
    m.attendanceState = target;
    m.updatedAt = now;
    list[idx] = m;
    this.saveMeetings(list);

    await dataService.logAudit({
      action: `ATTENDANCE_${target}`,
      performedBy: actor.email,
      affectedRecord: meetingId,
      metadata: { title: m.title, reason },
    });

    if (target === 'OPEN') {
      await this.notifyAllMembers('Attendance is now open', `Register your attendance for ${m.title}.`);
    }
    if (target === 'FINALIZED') {
      const verified = this.getAttendance(meetingId).filter(r => r.status === 'VERIFIED' && r.alumniId);
      for (const r of verified) {
        await dataService.sendNotification({
          alumniId: r.alumniId!,
          title: 'Attendance finalized',
          message: `Your attendance for ${m.title} is now part of the official record.`,
          type: 'SYSTEM',
          linkTab: 'my-profile',
        });
      }
    }
    return m;
  },

  async setMeetingState(
    meetingId: string,
    target: MeetingAttendanceState,
    actor: AuthUser,
    reason?: string
  ): Promise<Meeting> {
    return this.changeAttendanceState(meetingId, target, actor, reason);
  },

  async reopenFinalized(
    meetingId: string,
    actor: AuthUser,
    reason: string
  ): Promise<Meeting> {
    return this.changeAttendanceState(meetingId, 'OPEN', actor, reason);
  },

  // ------------------------------------------
  // Attendance records
  // ------------------------------------------
  getAllAttendance(): MeetingAttendanceRecord[] {
    return readJSON<MeetingAttendanceRecord[]>(KEYS.ATTENDANCE, []);
  },

  getAttendance(meetingId: string): MeetingAttendanceRecord[] {
    return this.getAllAttendance()
      .filter(r => r.meetingId === meetingId)
      .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  },

  saveAttendance(list: MeetingAttendanceRecord[]) {
    store.set(KEYS.ATTENDANCE, JSON.stringify(list));
  },

  isLate(meeting: Meeting, at: string): boolean {
    const start = new Date(`${meeting.date}T${meeting.startTime || '00:00'}:00`);
    // Arrivals more than 30 minutes after the start time are flagged as late
    return new Date(at).getTime() > start.getTime() + 30 * 60 * 1000;
  },

  assertWritable(meeting: Meeting | undefined, allowCheckInClosed: boolean) {
    if (!meeting) throw new Error('Meeting not found.');
    if (meeting.attendanceState === 'FINALIZED') throw new Error('Attendance is finalized and cannot be modified.');
    if (meeting.attendanceState === 'CLOSED') throw new Error('Attendance has not been opened for this meeting.');
    if (meeting.attendanceState === 'CHECKIN_CLOSED' && !allowCheckInClosed) {
      throw new Error('Check-in is closed. Please see the Secretary.');
    }
  },

  /** Member registers their own attendance. They can never mark themselves verified. */
  async selfRegister(meetingId: string, user: AuthUser): Promise<MeetingAttendanceRecord> {
    const meeting = this.getMeeting(meetingId);
    this.assertWritable(meeting, false);

    // Resolve alumni identity:
    // 1. Direct user.alumniId
    // 2. Lookup by email in alumni list
    // 3. Lookup by alumniNumber in alumni list
    // 4. Fallback to user.uid / displayName
    let resolvedAlumniId = user.alumniId;
    let resolvedAlumniNumber = user.alumniNumber;
    let resolvedFullName = user.displayName;

    const alumni = await dataService.getAlumniList();
    let profile = resolvedAlumniId ? alumni.find(a => a.internalId === resolvedAlumniId) : undefined;
    if (!profile && user.email) {
      profile = alumni.find(a => a.email && a.email.toLowerCase() === user.email.toLowerCase());
      if (profile) {
        resolvedAlumniId = profile.internalId;
        resolvedAlumniNumber = profile.alumniNumber;
        resolvedFullName = `${profile.firstName} ${profile.lastName}`;
      }
    }
    if (!profile && resolvedAlumniNumber) {
      profile = alumni.find(a => a.alumniNumber.toUpperCase() === resolvedAlumniNumber?.toUpperCase());
      if (profile) {
        resolvedAlumniId = profile.internalId;
        resolvedFullName = `${profile.firstName} ${profile.lastName}`;
      }
    }

    if (!resolvedAlumniId && !user.uid) {
      throw new Error('Please sign in or register to self-register attendance.');
    }

    const all = this.getAllAttendance();
    const dup = all.find(r =>
      r.meetingId === meetingId &&
      r.status !== 'REMOVED' &&
      ((resolvedAlumniId && r.alumniId === resolvedAlumniId) ||
       (user.email && r.phone?.toLowerCase() === user.email.toLowerCase()) ||
       (resolvedAlumniNumber && r.alumniNumber && r.alumniNumber.toUpperCase() === resolvedAlumniNumber.toUpperCase()))
    );
    if (dup) throw new Error('You have already registered attendance for this meeting.');
    const active = all.filter(r => r.meetingId === meetingId && r.status !== 'REMOVED').length;
    if (meeting!.maxAttendance && active >= meeting!.maxAttendance) throw new Error('This meeting has reached maximum attendance.');

    const now = new Date().toISOString();
    const rec: MeetingAttendanceRecord = {
      id: uid('att'),
      meetingId,
      attendeeType: 'ALUMNI_MEMBER',
      source: 'SELF',
      status: 'PENDING',
      fullName: profile ? `${profile.firstName} ${profile.lastName}` : (resolvedFullName || user.displayName),
      alumniId: resolvedAlumniId || user.alumniId || user.uid,
      alumniNumber: profile?.alumniNumber || resolvedAlumniNumber || user.alumniNumber,
      registeredAt: now,
      isLate: this.isLate(meeting!, now),
    };
    all.push(rec);
    this.saveAttendance(all);
    await dataService.logAudit({ action: 'ATTENDANCE_SELF_REGISTERED', performedBy: user.email, affectedRecord: rec.id, metadata: { meetingId, alumniNumber: rec.alumniNumber } });
    return rec;
  },

  /** An authenticated member assists an alumnus in person who has no phone or internet */
  async assistedMemberRegister(
    meetingId: string,
    details: { fullName: string; alumniNumber?: string; phone?: string; notes?: string },
    actor: AuthUser
  ): Promise<MeetingAttendanceRecord> {
    const meeting = this.getMeeting(meetingId);
    this.assertWritable(meeting, false);
    if (!details.fullName.trim()) throw new Error('Full name is required.');

    const all = this.getAllAttendance();
    const cleanName = details.fullName.trim().toLowerCase();
    const cleanNum = details.alumniNumber?.trim().toUpperCase();

    // Prevent duplicate:
    const dup = all.find(r =>
      r.meetingId === meetingId &&
      r.status !== 'REMOVED' &&
      ((cleanNum && r.alumniNumber && r.alumniNumber.toUpperCase() === cleanNum) ||
       (r.fullName.toLowerCase() === cleanName && !cleanNum))
    );
    if (dup) throw new Error(`${details.fullName} is already registered on the attendance list.`);

    const now = new Date().toISOString();
    const rec: MeetingAttendanceRecord = {
      id: uid('att'),
      meetingId,
      attendeeType: 'ALUMNI_MEMBER',
      source: 'ASSISTED',
      status: 'PENDING', // Will be verified by Secretary
      fullName: details.fullName.trim(),
      alumniNumber: details.alumniNumber?.trim() || undefined,
      phone: details.phone?.trim() || undefined,
      addedBy: actor.displayName ? `${actor.displayName} (${actor.email})` : actor.email,
      registeredAt: now,
      isLate: this.isLate(meeting!, now),
    };
    all.push(rec);
    this.saveAttendance(all);
    await dataService.logAudit({
      action: 'ATTENDANCE_MEMBER_ASSISTED',
      performedBy: actor.email,
      affectedRecord: rec.id,
      metadata: { meetingId, attendeeName: rec.fullName, alumniNumber: rec.alumniNumber }
    });
    return rec;
  },

  /** Secretary adds an existing registry member (no phone required on the member's side). */
  async addRegistryMember(meetingId: string, alumnus: AlumniProfile, actor: AuthUser): Promise<MeetingAttendanceRecord> {
    if (!this.can(actor, 'ATTENDANCE', 'ADD')) throw new Error('Not permitted to add attendees.');
    const meeting = this.getMeeting(meetingId);
    this.assertWritable(meeting, true);
    const all = this.getAllAttendance();
    const existing = all.find(r => r.meetingId === meetingId && r.alumniId === alumnus.internalId);
    if (existing && existing.status !== 'REMOVED') throw new Error(`${alumnus.firstName} ${alumnus.lastName} is already on the attendance list.`);
    const now = new Date().toISOString();
    const rec: MeetingAttendanceRecord = {
      id: uid('att'),
      meetingId,
      attendeeType: alumnus.membershipStatus === 'PENDING' ? 'PENDING_ALUMNI' : 'ALUMNI_MEMBER',
      source: 'ASSISTED',
      status: 'VERIFIED', // added in person by the Secretary
      fullName: `${alumnus.firstName} ${alumnus.lastName}`,
      alumniId: alumnus.internalId,
      alumniNumber: alumnus.alumniNumber,
      registeredAt: now,
      addedBy: actor.email,
      verifiedBy: actor.email,
      verifiedAt: now,
      isLate: this.isLate(meeting!, now),
    };
    all.push(rec);
    this.saveAttendance(all);
    await dataService.logAudit({ action: 'ATTENDANCE_ASSISTED_ADDED', performedBy: actor.email, affectedRecord: rec.id, metadata: { meetingId, alumniNumber: alumnus.alumniNumber } });
    return rec;
  },

  /**
   * Secretary adds a guest / non-alumnus. By default this creates ONLY an attendance record.
   * If createRegistryProfile is true, a PENDING registry application is opened for verification.
   */
  async addGuest(
    meetingId: string,
    guest: { fullName: string; attendeeType: AttendeeType; organisation?: string; position?: string; phone?: string; relationship?: string; category?: string },
    actor: AuthUser,
    createRegistryProfile = false
  ): Promise<MeetingAttendanceRecord> {
    if (!this.can(actor, 'ATTENDANCE', 'ADD')) throw new Error('Not permitted to add attendees.');
    const meeting = this.getMeeting(meetingId);
    this.assertWritable(meeting, true);
    if (!guest.fullName.trim()) throw new Error('Name is required.');
    const now = new Date().toISOString();

    let attendeeType = guest.attendeeType;
    if (createRegistryProfile) {
      const parts = guest.fullName.trim().split(/\s+/);
      const apps = readJSON<AlumniApplication[]>(KEYS.APPLICATIONS, []);
      const app: AlumniApplication = {
        id: uid('app'),
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || '-',
        gender: 'Other',
        dateOfBirth: '',
        phone: guest.phone || '',
        email: '',
        country: 'Uganda',
        city: meeting?.city || '',
        organisation: guest.organisation,
        position: guest.position,
        schoolHistory: { attendedOLevel: false, attendedALevel: false },
        privacySettings: { showName: true, showNickname: false, showProfession: false, showOrganisation: false, showCountry: false, showPhone: false, showEmail: false },
        status: 'PENDING',
        reviewNotes: `Opened from meeting attendance (${meeting?.title}). School history to be completed during verification.`,
        submittedAt: now,
        updatedAt: now,
        registrationMode: 'ASSISTED',
        registeredBy: { name: actor.displayName, email: actor.email, uid: actor.uid, registeredAt: now },
        accountActivated: false,
      };
      apps.unshift(app);
      store.set(KEYS.APPLICATIONS, JSON.stringify(apps));
      attendeeType = 'PENDING_ALUMNI';
      await dataService.logAudit({ action: 'REGISTRY_PROFILE_OPENED_FROM_ATTENDANCE', performedBy: actor.email, affectedRecord: app.id, metadata: { meetingId, name: guest.fullName } });
    }

    const rec: MeetingAttendanceRecord = {
      id: uid('att'),
      meetingId,
      attendeeType,
      source: 'GUEST',
      status: 'VERIFIED',
      fullName: guest.fullName.trim(),
      organisation: guest.organisation,
      position: guest.position,
      phone: guest.phone,
      relationship: guest.relationship,
      category: guest.category,
      registeredAt: now,
      addedBy: actor.email,
      verifiedBy: actor.email,
      verifiedAt: now,
      isLate: this.isLate(meeting!, now),
    };
    const all = this.getAllAttendance();
    all.push(rec);
    this.saveAttendance(all);
    await dataService.logAudit({ action: 'ATTENDANCE_GUEST_ADDED', performedBy: actor.email, affectedRecord: rec.id, metadata: { meetingId, name: rec.fullName, type: attendeeType } });
    return rec;
  },

  /** Verify / keep pending / remove one or many records. Removal requires a reason. */
  async setStatus(
    meetingId: string,
    recordIds: string[],
    status: 'VERIFIED' | 'PENDING' | 'REMOVED',
    actor: AuthUser,
    reason?: string
  ): Promise<number> {
    const needed: PermissionAction = status === 'REMOVED' ? 'REJECT' : 'VERIFY';
    if (!this.can(actor, 'ATTENDANCE', needed)) throw new Error('Not permitted.');
    const meeting = this.getMeeting(meetingId);
    if (!meeting) throw new Error('Meeting not found.');
    if (meeting.attendanceState === 'FINALIZED') throw new Error('Attendance is finalized and cannot be modified.');
    if (status === 'REMOVED' && !reason?.trim()) throw new Error('Please record a reason for removal.');

    const now = new Date().toISOString();
    const ids = new Set(recordIds);
    const all = this.getAllAttendance();
    let count = 0;
    const touched: MeetingAttendanceRecord[] = [];
    all.forEach((r, i) => {
      if (r.meetingId !== meetingId || !ids.has(r.id) || r.status === status) return;
      const next: MeetingAttendanceRecord = { ...r, status };
      if (status === 'VERIFIED') { next.verifiedBy = actor.email; next.verifiedAt = now; next.removedBy = undefined; next.removedAt = undefined; next.removalReason = undefined; }
      if (status === 'REMOVED') { next.removedBy = actor.email; next.removedAt = now; next.removalReason = reason!.trim(); }
      if (status === 'PENDING') { next.verifiedBy = undefined; next.verifiedAt = undefined; }
      all[i] = next;
      touched.push(next);
      count++;
    });
    this.saveAttendance(all);

    await dataService.logAudit({
      action: count > 1 ? `ATTENDANCE_BULK_${status}` : `ATTENDANCE_${status}`,
      performedBy: actor.email,
      affectedRecord: meetingId,
      metadata: { count, reason, recordIds: recordIds.slice(0, 50) },
    });

    for (const r of touched) {
      if (!r.alumniId || status === 'PENDING') continue;
      await dataService.sendNotification({
        alumniId: r.alumniId,
        title: status === 'VERIFIED' ? 'Attendance verified' : 'Attendance not confirmed',
        message: status === 'VERIFIED'
          ? `Your attendance for ${meeting.title} has been verified.`
          : `Your attendance for ${meeting.title} was not confirmed. Please contact the Secretary if you believe this is an error.`,
        type: 'SYSTEM',
        linkTab: 'my-profile',
      });
    }
    return count;
  },

  getStats(meetingId: string): AttendanceStats {
    const meeting = this.getMeeting(meetingId);
    const recs = this.getAttendance(meetingId);
    const byType = { ALUMNI_MEMBER: 0, PENDING_ALUMNI: 0, GUEST: 0, NON_ALUMNUS: 0, INVITED_OFFICIAL: 0, OTHER: 0 } as Record<AttendeeType, number>;
    const bySource: Partial<Record<AttendanceSource, number>> = {};
    let verified = 0, pending = 0, removed = 0, late = 0;
    recs.forEach(r => {
      if (r.status === 'VERIFIED') verified++;
      if (r.status === 'PENDING') pending++;
      if (r.status === 'REMOVED') { removed++; return; }
      byType[r.attendeeType]++;
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      if (r.isLate) late++;
    });
    const expected = meeting?.expectedAttendance || 0;
    return {
      registered: recs.length - removed,
      verified,
      pending,
      removed,
      expected,
      present: verified,
      byType,
      bySource,
      late,
      attendancePercentage: expected ? Math.round((verified / expected) * 100) : 0,
    };
  },

  /** Participation summary for a member profile. Counts verified attendance only. */
  getMemberParticipation(alumniId: string): { meetingsAttended: number; totalMeetings: number; attendanceRate: number; history: Array<{ meeting: Meeting; record: MeetingAttendanceRecord }> } {
    const meetings = this.getMeetings().filter(m => m.attendanceState === 'FINALIZED' || m.attendanceState === 'CHECKIN_CLOSED');
    const recs = this.getAllAttendance().filter(r => r.alumniId === alumniId && r.status === 'VERIFIED');
    const history = recs
      .map(r => ({ record: r, meeting: this.getMeeting(r.meetingId)! }))
      .filter(h => !!h.meeting)
      .sort((a, b) => b.meeting.date.localeCompare(a.meeting.date));
    const attended = new Set(recs.map(r => r.meetingId)).size;
    return {
      meetingsAttended: attended,
      totalMeetings: meetings.length,
      attendanceRate: meetings.length ? Math.round((Math.min(attended, meetings.length) / meetings.length) * 100) : 0,
      history,
    };
  },

  async getAbsentMembers(meetingId: string): Promise<AlumniProfile[]> {
    const present = new Set(this.getAttendance(meetingId).filter(r => r.status === 'VERIFIED' && r.alumniId).map(r => r.alumniId));
    const alumni = await dataService.getAlumniList();
    return alumni.filter(a => (a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED') && !present.has(a.internalId));
  },

  // ------------------------------------------
  // Reports & export
  // ------------------------------------------
  toCSV(meetingId: string): string {
    const meeting = this.getMeeting(meetingId);
    const rows = this.getAttendance(meetingId);
    const esc = (v: any) => {
      const s = v === undefined || v === null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Meeting', 'Date', 'Name', 'MA Number', 'Person Type', 'Source', 'Status', 'Registered At', 'Late', 'Organisation', 'Position', 'Added By', 'Verified By', 'Removed By', 'Removal Reason'];
    const body = rows.map(r => [
      meeting?.title, meeting?.date, r.fullName, r.alumniNumber, ATTENDEE_TYPE_LABELS[r.attendeeType], r.source, r.status,
      new Date(r.registeredAt).toLocaleString(), r.isLate ? 'Yes' : 'No', r.organisation, r.position, r.addedBy, r.verifiedBy, r.removedBy, r.removalReason,
    ].map(esc).join(','));
    return [header.join(','), ...body].join('\n');
  },

  // ------------------------------------------
  // Helpers
  // ------------------------------------------
  async notifyAllMembers(title: string, message: string) {
    try {
      const alumni = await dataService.getAlumniList();
      for (const a of alumni) {
        if (a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED') {
          await dataService.sendNotification({ alumniId: a.internalId, title, message, type: 'EVENT_INVITE', linkTab: 'events' });
        }
      }
    } catch (e) {
      console.warn('Notification broadcast failed', e);
    }
  },
};
