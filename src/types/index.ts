export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'SECRETARY' 
  | 'TREASURER' 
  | 'MEMBERSHIP_ADMIN'
  | 'DIRECTORY_ADMIN'
  | 'EVENTS_ATTENDANCE_ADMIN'
  | 'PUBLICITY' 
  | 'CHAPTER_ADMIN' 
  | 'CUSTOM_STAFF'
  | 'ALUMNI'
  | 'USER';

/** Provenance of a registry record: who physically entered the data. */
export interface RegisteredByInfo {
  name: string;
  alumniNumber?: string;
  uid?: string;
  email?: string;
  registeredAt: string;
}

export type RegistrationMode = 'SELF' | 'ASSISTED';

export type ApplicationStatus = 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'NEEDS_CORRECTION'
  | 'SUSPENDED';

export type MembershipStatus = 
  | 'ACTIVE' 
  | 'APPROVED' 
  | 'PENDING' 
  | 'DISAPPROVED' 
  | 'REJECTED' 
  | 'SUSPENDED' 
  | 'INACTIVE'
  | 'DECEASED';

export interface OLevelHistory {
  yearJoined: number;
  yearCompleted: number;
  campus: string;
  class: string;
  stream: string;
  house?: string;
}

export interface ALevelHistory {
  yearJoined: number;
  yearCompleted: number;
  campus: string;
  class: string;
  combination: string;
  house?: string;
}

export interface MASSHSchoolHistory {
  attendedOLevel: boolean;
  oLevel?: OLevelHistory;
  attendedALevel: boolean;
  aLevel?: ALevelHistory;
}

export interface PrivacySettings {
  showName: boolean;
  showNickname: boolean;
  showProfession: boolean;
  showOrganisation: boolean;
  showCountry: boolean;
  showPhone: boolean;  // Default: false
  showEmail: boolean;  // Default: false
}

export interface AlumniProfile {
  internalId: string;
  alumniNumber: string; // e.g. "MA. 0001"
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  nickname?: string; // Explicitly: "Nickname at School"
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  photoUrl?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address?: string;
  linkedIn?: string;
  socialLink?: string;
  currentInstitution?: string;
  programme?: string;
  highestQualification?: string;
  occupation?: string;
  organisation?: string;
  position?: string;
  bio?: string;
  schoolHistory: MASSHSchoolHistory;
  privacySettings: PrivacySettings;
  membershipStatus: MembershipStatus;
  disapprovalReason?: string;
  statusHistory?: Array<{ status: MembershipStatus; changedAt: string; changedBy: string; reason?: string }>;
  numberChangeHistory?: Array<{ previousNumber: string; newNumber: string; changedAt: string; changedBy: string; reason?: string }>;
  membershipPaidUntilYear?: number;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string;
  verifiedBy: string;
  applicationId: string;
  registrationMode?: RegistrationMode;
  registeredBy?: RegisteredByInfo;
  /** False when the person has no phone/email yet; record exists but login is not active. */
  accountActivated?: boolean;
  /** Nationality as printed on the Membership ID card (distinct from country of residence). */
  nationality?: string;
  /** Holder's signature image (data URL) for the Membership ID card. */
  signatureUrl?: string;
}

export interface AlumniApplication {
  id: string;
  referenceId?: string; // e.g. "MOSA-2026-00125"
  firstName: string;
  middleName?: string;
  lastName: string;
  nickname?: string; // Explicitly: "Nickname at School"
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  photoUrl?: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address?: string;
  linkedIn?: string;
  socialLink?: string;
  currentInstitution?: string;
  programme?: string;
  highestQualification?: string;
  occupation?: string;
  organisation?: string;
  position?: string;
  bio?: string;
  schoolHistory: MASSHSchoolHistory;
  selectedChapterId?: string;
  privacySettings: PrivacySettings;
  status: ApplicationStatus;
  reviewNotes?: string;
  correctionReason?: string;
  correctionHistory?: Array<{ requestedAt: string; requestedBy: string; reason: string; resubmittedAt?: string }>;
  declarationAccepted?: boolean;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  assignedAlumniNumber?: string;
  password?: string;
  registrationMode?: RegistrationMode;
  registeredBy?: RegisteredByInfo;
  accountActivated?: boolean;
  cohortYear?: string;
  exitYear?: string;
  existingAlumniNumber?: string;
}

export interface SystemSettings {
  nextAlumniNumber: number;
  nextApplicationNumber?: number;
  prefix: string; // "MA. "
  padDigits: number; // 4
  systemName: string;
  schoolName: string;
  establishedYear: number;
  mobileMoneySettings?: {
    mtnNumber: string;
    mtnName: string;
    airtelNumber: string;
    airtelName: string;
    instructions: string;
  };
  allowManualMANumberAssignment?: boolean;
  autoApproveRegistrations?: boolean;
  allowSelfAssignedAlumniNumber?: boolean; // When false, members cannot claim or self-assign numbers during registration
  usedMANumbersRegistry?: string[];
  fieldPermissions?: Record<string, { viewRoles: UserRole[]; editRoles: UserRole[] }>;
  moduleSettings?: ModuleSettings;
}

export interface ModuleSettings {
  home: boolean;
  about: boolean;
  membership: boolean;
  directory: boolean;
  news: boolean;
  events: boolean;
  gallery: boolean;
  documents: boolean;
  contact: boolean;
  giving: boolean;
  chapters: boolean;
  attendance: boolean;
  opportunities?: boolean;
  elections?: boolean;
}

// ==========================================
// ROLE-BASED PERMISSIONS
// ==========================================
export type PermissionModule =
  | 'REGISTRY'
  | 'ATTENDANCE'
  | 'FINANCE'
  | 'COMMUNICATIONS'
  | 'EVENTS'
  | 'CHAPTERS'
  | 'DOCUMENTS'
  | 'OPPORTUNITIES'
  | 'ELECTIONS'
  | 'SETTINGS'
  | 'USERS'
  | 'AUDIT'
  | 'REPORTS'
  | 'OVERVIEW'
  | 'VERIFICATION'
  | 'NUMBERS'
  | 'LEADERSHIP'
  | 'PERMISSIONS'
  | 'WELCOME_PAGE'
  | 'EXPORTS'
  | 'SECURITY';

export type PermissionAction =
  | 'VIEW'
  | 'ADD'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'VERIFY'
  | 'EXPORT'
  | 'PUBLISH'
  | 'MANAGE'
  | 'CONFIGURE';

export type ModulePermissions = Partial<Record<PermissionModule, PermissionAction[]>>;
export type RolePermissionMatrix = Partial<Record<UserRole, ModulePermissions>>;

export interface AuthSettings {
  allowEmailPassword: boolean;
  allowPhonePassword: boolean;
  allowPhoneOtp: boolean;
  allowMANumberPassword: boolean;
}

// ==========================================
// SMART MEETING ATTENDANCE
// ==========================================
export type MeetingAttendanceState = 'CLOSED' | 'OPEN' | 'CHECKIN_CLOSED' | 'FINALIZED';

export type AttendeeType =
  | 'ALUMNI_MEMBER'
  | 'PENDING_ALUMNI'
  | 'GUEST'
  | 'NON_ALUMNUS'
  | 'INVITED_OFFICIAL'
  | 'OTHER';

export type AttendanceSource = 'SELF' | 'ASSISTED' | 'SECRETARY' | 'ADMIN' | 'QR' | 'GUEST' | 'IMPORTED';

export type AttendanceRecordStatus = 'PENDING' | 'VERIFIED' | 'REMOVED';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string;
  city?: string;
  country?: string;
  expectedAttendance: number;
  maxAttendance?: number;
  chapterId?: string;
  attendanceRequirement: 'MEMBERS_ONLY' | 'MEMBERS_AND_GUESTS';
  attendanceState: MeetingAttendanceState;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  openedAt?: string;
  openedBy?: string;
  checkInClosedAt?: string;
  checkInClosedBy?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  reopenHistory?: Array<{ at: string; by: string; reason: string }>;
}

export interface MeetingAttendanceRecord {
  id: string;
  meetingId: string;
  attendeeType: AttendeeType;
  source: AttendanceSource;
  status: AttendanceRecordStatus;
  fullName: string;
  alumniId?: string;
  alumniNumber?: string;
  chapterId?: string;
  // Guest / non-alumnus details
  category?: string;
  organisation?: string;
  position?: string;
  phone?: string;
  relationship?: string;
  registeredAt: string;
  addedBy?: string;
  isLate?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  removedBy?: string;
  removedAt?: string;
  removalReason?: string;
}

export interface MOSADocument {
  id: string;
  title: string;
  category: 'CONSTITUTION' | 'CIRCULAR' | 'AGM_REPORT' | 'FINANCIAL_REPORT' | 'MEMBERSHIP_FORM' | 'OTHER';
  description?: string;
  fileSize: string;
  publishedDate: string;
  downloadUrl?: string;
  fileType?: string;
  isRestrictedToMembers?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  affectedRecord: string;
  timestamp: string;
  metadata?: Record<string, any>;
  details?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  alumniId?: string;
  alumniNumber?: string;
  photoUrl?: string;
  phone?: string;
  /** For CHAPTER_ADMIN: chapters this administrator may access. */
  chapterIds?: string[];
  active?: boolean;
  assignedPermissions?: PermissionModule[];
  roleTitle?: string;
  alumniOnboardingDecision?: 'PENDING' | 'SKIPPED' | 'SUBMITTED' | 'COMPLETED';
  mustChangePassword?: boolean;
  officeId?: string;
  officeTitle?: string;
  appointmentStatus?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  appointmentStartDate?: string;
  appointmentEndDate?: string;
  granularPermissions?: Partial<Record<PermissionModule, PermissionAction[]>>;
}

export type ChapterStatus = 'ACTIVE' | 'INACTIVE';

export interface Chapter {
  id: string;
  name: string; // e.g. "Makerere University Mandela Old Students Association"
  code: string; // e.g. "MUMASA"
  institution: string; // e.g. "Makerere University"
  location: string; // e.g. "Kampala"
  country: string; // e.g. "Uganda"
  status: ChapterStatus;
  chapterType?: string; // e.g. "UNIVERSITY" | "REGIONAL" | "DIASPORA" | "PROFESSIONAL"
  description: string;
  adminEmails: string[];
  leaderName?: string;
  leaderContact?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterMember {
  id: string;
  chapterId: string;
  alumniId: string;
  alumniNumber: string; // "MA. 0001"
  alumniName: string;
  alumniEmail: string;
  roleInChapter: 'MEMBER' | 'LEADER' | 'COORDINATOR';
  joinedAt: string;
  status: 'ACTIVE' | 'FORMER';
}

export type EventType =
  | 'ANNUAL_CONVENTION'
  | 'REUNION'
  | 'GENERAL_MEETING'
  | 'FUNDRAISING'
  | 'CAREER'
  | 'MENTORSHIP'
  | 'CHAPTER_EVENT'
  | 'OTHER';

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type EventRegistrationRequirement = 'OPEN' | 'REGISTRATION_REQUIRED' | 'INVITE_ONLY';

export interface MOSAEvent {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  registrationDeadline?: string;
  registrationRequirement: EventRegistrationRequirement;
  eventImage?: string;
  status: EventStatus;
  chapterId?: string; // Optional affiliation
  registeredCount: number;
  attendedCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  alumniId: string;
  alumniNumber: string;
  alumniName: string;
  alumniEmail: string;
  registeredAt: string;
  qrCheckInToken: string; // Deterministic verifiable token
  status: 'REGISTERED' | 'CANCELLED';
}

export interface EventAttendance {
  id: string;
  eventId: string;
  alumniId: string;
  alumniNumber: string;
  alumniName: string;
  checkedInAt: string;
  checkedInBy: string;
  checkInMethod: 'QR_SCAN' | 'MANUAL_ADMIN';
}

// ==========================================
// PHASE 5: PAYMENTS & DONATIONS (Section 14 & 22)
// ==========================================

export type PaymentCategory = 
  | 'ANNUAL_MEMBERSHIP' 
  | 'EVENT_TICKET' 
  | 'PROJECT_DONATION' 
  | 'WELFARE_CONTRIBUTION' 
  | 'OTHER';

export type PaymentMethod = 
  | 'MTN_MOMO' 
  | 'AIRTEL_MONEY' 
  | 'BANK_TRANSFER' 
  | 'CASH_OFFICE' 
  | 'ONLINE_CARD';

export type PaymentStatus = 
  | 'PENDING_VERIFICATION' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'REFUNDED';

export interface PaymentTransaction {
  id: string;
  receiptNumber?: string; // e.g. "MOSA-RCP-2026-0001"
  alumniId: string;
  alumniNumber: string; // e.g. "MA. 0001"
  alumniName: string;
  alumniEmail: string;
  alumniPhone?: string;
  category: PaymentCategory;
  campaignId?: string; // If project donation
  campaignTitle?: string;
  eventId?: string; // If event ticket
  eventTitle?: string;
  subscriptionYear?: number; // e.g. 2026 for annual membership dues
  amount: number; // UGX
  currency: string; // "UGX"
  paymentMethod: PaymentMethod;
  transactionReference: string; // MTN MoMo ID, Airtel ID, Bank slip number
  payerPhoneOrAccount?: string;
  proofAttachmentUrl?: string;
  notes?: string;
  status: PaymentStatus;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export type CampaignCategory = 
  | 'INFRASTRUCTURE' 
  | 'BURSARY' 
  | 'ACADEMIC' 
  | 'SPORTS' 
  | 'WELFARE';

export type CampaignStatus = 'ACTIVE' | 'GOAL_REACHED' | 'CLOSED';

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number; // UGX
  raisedAmount: number; // UGX
  donorCount: number;
  category: CampaignCategory;
  status: CampaignStatus;
  coverImage?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  paymentInstructions?: string;
  isFeatured?: boolean;
}

export interface SecretariatContact {
  id: string;
  name: string;
  title: string;
  publishedPhone: string;
  whatsAppNumber: string;
  email?: string;
  officeCategory?: string;
  status: 'ACTIVE' | 'INACTIVE';
  displayOrder?: number;
  notes?: string;
  updatedAt?: string;
}

export interface LegacyAlumniRecord {
  id: string;
  membershipNumber: string;
  alumniNumber?: string; // Alias or compatibility
  fullName: string;
  cohortYear?: string | number;
  level?: 'O_LEVEL' | 'A_LEVEL' | 'BOTH';
  phone?: string;
  email?: string;
  physicalRegisterPage?: string;
  verifiedStatus: 'TRUSTED' | 'FLAGGED' | 'LINKED' | 'VERIFIED';
  linkedUserId?: string;
  linkedAlumniId?: string;
  linkedDate?: string;
  verifiedDate?: string;
  importedAt?: string;
  notes?: string;
}

// ==========================================
// PHASE 6: COMMUNICATIONS & ANNOUNCEMENTS (Section 15 & 22)
// ==========================================

export type AnnouncementCategory = 
  | 'GENERAL' 
  | 'CIRCULAR' 
  | 'NEWSLETTER' 
  | 'EVENT_ALERT' 
  | 'WELFARE_NOTICE' 
  | 'ACADEMIC_EXCELLENCE' 
  | 'OBITUARY';

export type AudienceScope = 
  | 'ALL_ALUMNI' 
  | 'CHAPTER_ONLY' 
  | 'COHORT_RANGE' 
  | 'ACTIVE_MEMBERS_ONLY';

export type DeliveryChannel = 'PORTAL_FEED' | 'SMS_BROADCAST' | 'EMAIL_DIGEST';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: AnnouncementCategory;
  audienceScope: AudienceScope;
  targetChapterId?: string;
  targetChapterCode?: string;
  targetYearStart?: number;
  targetYearEnd?: number;
  isPinned: boolean;
  coverImage?: string;
  channels: DeliveryChannel[];
  viewsCount: number;
  smsRecipientsCount?: number;
  emailRecipientsCount?: number;
  publishedAt: string;
  publishedBy: string;
  authorName: string;
  authorRole: string;
}

export interface AlumniNotification {
  id: string;
  alumniId: string;
  title: string;
  message: string;
  type: 
    | 'ANNOUNCEMENT' 
    | 'DUES_REMINDER' 
    | 'EVENT_INVITE' 
    | 'EVENT_ANNOUNCED'
    | 'EVENT'
    | 'PAYMENT_VERIFIED' 
    | 'SYSTEM' 
    | 'MEMBERSHIP' 
    | 'MEMBERSHIP_APPROVED' 
    | 'ATTENDANCE_OPEN' 
    | 'REGISTRY_UPDATED' 
    | string;
  linkTab?: 
    | 'directory' 
    | 'chapters' 
    | 'events' 
    | 'payments' 
    | 'admin' 
    | 'my-profile' 
    | 'attendance' 
    | 'membership' 
    | 'news' 
    | 'home' 
    | string;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// PHASE 7: ANALYTICS & REPORTING (Section 16 & 22)
// ==========================================

export interface SystemAnalytics {
  totalRegistered: number;
  totalVerified: number;
  verificationRate: number; // e.g. 85.5%
  levelsBreakdown: {
    oLevelOnly: number;
    aLevelOnly: number;
    bothLevels: number;
  };
  cohortBreakdown: {
    pioneers1997_2005: number;
    years2006_2015: number;
    years2016_2020: number;
    years2021_present: number;
  };
  genderBreakdown: {
    male: number;
    female: number;
    other: number;
  };
  duesCompliance: {
    activePaidCount: number;
    dueCount: number;
    complianceRate: number; // %
  };
  finances: {
    totalVerifiedUGX: number;
    duesCollectedUGX: number;
    campaignsRaisedUGX: number;
    eventRevenueUGX: number;
  };
  chapters: {
    totalChapters: number;
    totalChapterMemberships: number;
    distribution: Array<{ code: string; name: string; institution: string; memberCount: number }>;
  };
  events: {
    totalEvents: number;
    totalRegistrations: number;
    totalAttendees: number;
    averageAttendanceRate: number; // %
  };
  topLocations: Array<{ location: string; count: number }>;
  topProfessions: Array<{ profession: string; count: number }>;
}

export type PhotoCategory = 'FOUNDATION' | 'ACADEMICS' | 'CAMPUS_LIFE' | 'VIP_VISIT' | 'ALUMNI_COMMUNITY';

export interface CampusPhoto {
  id: string;
  title: string;
  caption: string;
  category: PhotoCategory;
  imageUrl: string;
  date?: string;
  location?: string;
  uploadedBy?: string;
  featured?: boolean;
}

// ==========================================
// DYNAMIC WEBSITE CONTENT MANAGEMENT (CMS)
// ==========================================

export interface HomeContent {
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroHighlightWord: string;
  statsHeritageText: string;
  statsHeritageSub: string;
  statsVerifiedText: string;
  statsVerifiedSub: string;
  welcomeTitle: string;
  welcomeHeadline: string;
  welcomeBody: string;
  welcomeAuthor: string;
  welcomeLocation: string;
}

export interface AboutMilestone {
  year: string;
  title: string;
  description: string;
}

export interface ExecutiveLeader {
  role: string;
  name: string;
  cohort: string;
  profession: string;
}

export interface AboutContent {
  tagline: string;
  title: string;
  subtitle: string;
  profileBadge: string;
  profileTitle: string;
  profileParagraph1: string;
  profileParagraph2: string;
  motto: string;
  colors: string;
  milestones: AboutMilestone[];
  leaders: ExecutiveLeader[];
}

export interface MembershipTier {
  title: string;
  target: string;
  description: string;
  benefits: string[];
  badge: string;
}

export interface MembershipContent {
  tagline: string;
  title: string;
  subtitle: string;
  explainerTitle: string;
  explainerBody: string;
  sampleNumber: string;
  tiers: MembershipTier[];
}

export interface DirectoryContent {
  tagline: string;
  title: string;
  description: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContactContent {
  tagline: string;
  title: string;
  subtitle: string;
  campusAddress: string;
  poBox: string;
  phoneNumbers: string[];
  emails: string[];
  workingHours: string;
  faqs: FaqItem[];
}

export interface WebsiteContent {
  home: HomeContent;
  about: AboutContent;
  membership: MembershipContent;
  directory: DirectoryContent;
  contact: ContactContent;
}

// ==========================================
// OPPORTUNITIES HUB & MENTORSHIP
// ==========================================

export type OpportunityType = 
  | 'JOB' 
  | 'INTERNSHIP' 
  | 'SCHOLARSHIP' 
  | 'FELLOWSHIP' 
  | 'MENTORSHIP' 
  | 'TRAINING' 
  | 'ENTREPRENEURSHIP' 
  | 'VOLUNTEER' 
  | 'NETWORKING' 
  | 'OTHER';

export type OpportunityStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'EXPIRED' 
  | 'ARCHIVED' 
  | 'REJECTED';

export type WorkplaceType = 'REMOTE' | 'ON_SITE' | 'HYBRID';

export interface OpportunityItem {
  id: string;
  title: string;
  type: OpportunityType;
  organisation: string;
  description: string;
  requirements?: string;
  skills?: string[];
  location: string;
  country: string;
  workplaceType: WorkplaceType;
  deadline: string;
  startDate?: string;
  closingDate?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  externalUrl?: string;
  applicationInstructions?: string;
  postedBy: {
    name: string;
    email?: string;
    alumniNumber?: string;
    alumniId?: string;
    role?: string;
  };
  chapterId?: string;
  chapterCode?: string;
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'CHAPTER_ONLY';
  status: OpportunityStatus;
  createdAt: string;
  publishedAt?: string;
  approvedBy?: string;
  reviewNotes?: string;
  viewsCount: number;
  applicationsCount: number;
}

export interface MentorProfile {
  id: string;
  alumniId: string;
  alumniNumber: string;
  fullName: string;
  photoUrl?: string;
  email: string;
  phone?: string;
  professionalField: string;
  areasOfExpertise: string[];
  skills: string[];
  yearsExperience: number;
  currentRole: string;
  organisation: string;
  bio: string;
  mentorshipAreas: string[];
  preferredMenteeInterests: string[];
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  maxMentees: number;
  currentMenteesCount: number;
  location: string;
  format: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAlumniNumber: string;
  menteeAlumniId: string;
  menteeAlumniNumber: string;
  menteeName: string;
  menteeEmail: string;
  menteePhone?: string;
  fieldOrTopic: string;
  message: string;
  preferredFormat: 'ONLINE' | 'IN_PERSON' | 'HYBRID';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  requestedAt: string;
  respondedAt?: string;
  responseNote?: string;
}

// ==========================================
// ELECTIONS & DIGITAL VOTING
// ==========================================

export type ElectionStatus = 
  | 'UPCOMING' 
  | 'NOMINATIONS_OPEN' 
  | 'VOTING_ACTIVE' 
  | 'TALLYING' 
  | 'CONCLUDED' 
  | 'CANCELLED';

export interface ElectionPosition {
  id: string;
  title: string;
  description: string;
  maxSelect: number;
  order: number;
}

export interface Candidate {
  id: string;
  electionId: string;
  positionId: string;
  alumniId: string;
  alumniNumber: string;
  fullName: string;
  cohort: string;
  profession?: string;
  photoUrl?: string;
  manifesto: string;
  seconderName?: string;
  seconderAlumniNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'DISQUALIFIED';
  votesCount: number;
  nominatedAt: string;
}

export interface BallotVote {
  id: string;
  electionId: string;
  voterAlumniId: string;
  voterAlumniNumber: string;
  positionId: string;
  candidateId: string;
  verificationToken: string;
  castAt: string;
}

export interface ElectionCycle {
  id: string;
  title: string;
  theme: string;
  description: string;
  term: string; // e.g. "2026 - 2028"
  status: ElectionStatus;
  nominationDeadline: string;
  votingStartDate: string;
  votingEndDate: string;
  eligibleVotersCount: number;
  totalBallotsCast: number;
  quorumRequiredPercentage: number;
  certifiedBy?: string;
  certifiedAt?: string;
  declarationSummary?: string;
  positions: ElectionPosition[];
  createdAt: string;
}

// ==========================================
// OUTBOUND COMMUNICATION CHANNELS (SMS / WHATSAPP / EMAIL)
// ==========================================

export type BroadcastChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'MULTICHANNEL';

export type BroadcastScope = 'ALL_ALUMNI' | 'COHORT' | 'VERIFIED_ONLY' | 'CHAPTER';

export interface BroadcastAudienceFilter {
  scope: BroadcastScope;
  cohortYear?: number;
  chapterId?: string;
  membershipStatus?: string;
}

export type BroadcastStatus = 'DRAFT' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';

export interface BroadcastDeliverySummary {
  sent: number;
  delivered: number;
  failed: number;
}

export interface BroadcastRecipientLog {
  id: string;
  broadcastId: string;
  recipientName: string;
  recipientAlumniNumber: string;
  recipientContact: string; // Phone or Email
  channel: BroadcastChannel;
  status: 'DELIVERED' | 'QUEUED' | 'FAILED';
  gatewayResponseCode: string;
  deliveredAt?: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  channel: BroadcastChannel;
  senderName: string;
  senderRole: string;
  senderContact: string;
  content: string;
  templateVariables: string[];
  targetAudience: BroadcastAudienceFilter;
  recipientCount: number;
  status: BroadcastStatus;
  estimatedCostUgx?: number;
  deliverySummary: BroadcastDeliverySummary;
  createdAt: string;
  sentAt?: string;
  gatewayProvider: string;
  logs?: BroadcastRecipientLog[];
}

// ==========================================
// OFFICIAL MOSA MEMBERSHIP ID CARD
// ==========================================

/** Lifecycle status of an issued card record. */
export type MembershipCardStatus =
  | 'ISSUED'      // Active card (valid if not expired and membership in good standing)
  | 'SUSPENDED'   // Temporarily invalid; can be reinstated
  | 'REVOKED'     // Permanently invalid; a reissue is required
  | 'SUPERSEDED'; // Replaced by a reissued card; old validation number is retired forever

/** Computed, member-facing card state. */
export type MembershipCardDisplayStatus =
  | 'NOT_ELIGIBLE'        // Membership not approved / suspended / disapproved
  | 'AWAITING_DETAILS'    // Required card fields missing from the registry
  | 'AWAITING_CORRECTION' // Open correction request or details changed since issuance
  | 'PENDING'             // Eligible and complete, awaiting issuance by the Secretariat
  | 'VALID'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED';

export type CardFieldKey =
  | 'surname'
  | 'givenName'
  | 'nationality'
  | 'sex'
  | 'entryYear'
  | 'departureYear'
  | 'photo';

/** Personal details exactly as printed on a card at the moment of issuance. */
export interface CardDetailsSnapshot {
  surname: string;
  givenName: string;
  nationality: string;
  sex: string;
  cohortYear: string;
  entryYear: string;
  departureYear: string;
  alumniNumber: string;
}

export interface MembershipCardRecord {
  id: string;
  alumniId: string;
  alumniNumber: string;
  /** Printed, human-readable unique validation number (never reused). */
  validationNumber: string;
  /** Opaque high-entropy token embedded in the QR verification link. */
  verificationToken: string;
  status: MembershipCardStatus;
  /** 1 = original issue, 2+ = reissues. */
  issueNumber: number;
  issuedAt: string;
  issuedBy: string;
  expiresAt?: string;
  reissueReason?: string;
  previousCardId?: string;
  replacedByCardId?: string;
  supersededAt?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  snapshot: CardDetailsSnapshot;
  history: Array<{ at: string; by: string; action: string; note?: string }>;
}

export interface CardSignatory {
  title: string;
  name?: string;
  signatureDataUrl?: string;
}

/** Official card configuration, editable only by authorised administrators. */
export interface MembershipCardSettings {
  headingText: string;
  cardTitle: string;
  ownershipStatement: string;
  associationName: string;
  phoneNumbers: string[];
  email: string;
  website: string;
  chairmanMosa: CardSignatory;
  chairmanBog: CardSignatory;
  /** Official crest image (data URL). A drawn emblem is used when absent. */
  crestDataUrl?: string;
  /** 0 = card does not expire. */
  validityYears: number;
  /** Which school year the printed "Cohort year" represents. */
  cohortYearBasis: 'ENTRY' | 'COMPLETION';
  /** Base URL used in QR codes; defaults to the current site origin. */
  verificationBaseUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CardCorrectionRequest {
  id: string;
  alumniId: string;
  alumniNumber: string;
  alumniName: string;
  fields: Array<{ field: CardFieldKey; currentValue: string; requestedValue: string }>;
  note?: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

/** Minimal public verification payload — never contains private member data. */
export interface CardVerificationResult {
  found: boolean;
  valid: boolean;
  state: 'VALID' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'SUPERSEDED' | 'MEMBERSHIP_INACTIVE' | 'DETAILS_OUTDATED' | 'NOT_FOUND';
  message: string;
  memberName?: string;
  alumniNumber?: string;
  validationNumber?: string;
  issuedAt?: string;
  expiresAt?: string;
}

// ==========================================
// LEADERSHIP OFFICES & GRANULAR PERMISSIONS
// ==========================================

export type OfficeCategory = 'EXECUTIVE' | 'SECRETARIAT' | 'COMMITTEE' | 'REGIONAL' | 'SPECIAL';

export interface LeadershipOffice {
  id: string;
  title: string;
  description: string;
  category: OfficeCategory;
  assignedAlumniId?: string;
  assignedAlumniNumber?: string;
  assignedAlumniName?: string;
  assignedEmail?: string;
  appointmentStartDate?: string;
  appointmentEndDate?: string;
  status: 'ACTIVE' | 'VACANT' | 'SUSPENDED' | 'EXPIRED';
  modules: PermissionModule[];
  granularPermissions: Partial<Record<PermissionModule, PermissionAction[]>>;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

// ==========================================
// MOSA WELCOME PAGE MANAGEMENT
// ==========================================

export interface CarouselImageItem {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  isFeatured?: boolean;
  order: number;
}

export interface WelcomePageConfig {
  heroTitle: string; // e.g. "WELCOME TO MOSA"
  slogan: string; // e.g. "PROUDLY MANDELIAN"
  subtitle: string; // e.g. "One family. One legacy. A lifetime of connection."
  introMessage: string; // Concise community introductory text
  heroImageUrl?: string;
  carouselImages?: CarouselImageItem[];
  carouselIntervalSeconds?: number;
  draftHeroTitle?: string;
  draftSlogan?: string;
  draftSubtitle?: string;
  draftIntroMessage?: string;
  draftHeroImageUrl?: string;
  draftCarouselImages?: CarouselImageItem[];
  draftCarouselIntervalSeconds?: number;
  hasUnpublishedDraft?: boolean;
  lastPublishedAt?: string;
  lastPublishedBy?: string;

  // Association Social Handles & Official Contacts (managed by Admin)
  socialX?: string; // e.g. "https://x.com/mosa_massh" or "@mosa_massh"
  socialLinkedIn?: string; // e.g. "https://linkedin.com/company/mosa-massh"
  socialGmail?: string; // e.g. "secretariat@massh.ac.ug"
  socialTikTok?: string; // e.g. "https://tiktok.com/@mosa_massh"
  officialPhone?: string; // e.g. "+256 782 123456"
  officialWhatsApp?: string; // e.g. "256782123456"
  officialAddress?: string; // e.g. "Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda"
  officialWebsite?: string; // e.g. "https://mtech-46634.web.app"

  // Draft handles & contacts
  draftSocialX?: string;
  draftSocialLinkedIn?: string;
  draftSocialGmail?: string;
  draftSocialTikTok?: string;
  draftOfficialPhone?: string;
  draftOfficialWhatsApp?: string;
  draftOfficialAddress?: string;
  draftOfficialWebsite?: string;
}

// ==========================================
// MEMBER DATA EXPORTS
// ==========================================

export interface MemberExportFilter {
  statusScope: 'ALL' | 'VERIFIED' | 'PENDING' | 'UNREGISTERED';
  cohortYear?: number | 'ALL';
  officeId?: string | 'ALL';
  searchTerm?: string;
}

export interface MemberPdfExportResult {
  filename: string;
  doc: any;
}

// ==========================================
// SECRETARIAT OFFICIAL CONTACTS
// ==========================================

export interface SecretariatContact {
  id: string;
  name: string;
  title: string;
  publishedPhone: string;
  whatsAppNumber?: string;
  email?: string;
  officeCategory?: OfficeCategory;
  status: 'ACTIVE' | 'INACTIVE';
  displayOrder?: number;
  notes?: string;
  updatedAt?: string;
}

// ==========================================
// LEGACY ALUMNI REGISTRY
// ==========================================

export interface LegacyAlumniRecord {
  id?: string;
  fullName: string;
  membershipNumber: string;
  cohortYear?: number | string;
  phone?: string;
  email?: string;
  profession?: string;
  chapter?: string;
  notes?: string;
  importedAt?: string;
  verifiedStatus?: string;
  [key: string]: any;
}
