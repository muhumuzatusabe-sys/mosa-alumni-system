import {
  UserRole,
  AlumniApplication,
  AlumniProfile,
  ApplicationStatus,
  AuditLog,
  AuthUser,
  SystemSettings,
  Chapter,
  ChapterMember,
  ChapterStatus,
  MembershipStatus,
  MOSAEvent,
  EventRegistration,
  EventAttendance,
  EventType,
  EventStatus,
  EventRegistrationRequirement,
  PaymentCategory,
  PaymentMethod,
  PaymentStatus,
  PaymentTransaction,
  DonationCampaign,
  CampaignCategory,
  CampaignStatus,
  Announcement,
  AnnouncementCategory,
  AudienceScope,
  DeliveryChannel,
  AlumniNotification,
  SystemAnalytics,
  CampusPhoto,
  PhotoCategory,
  MOSADocument,
  ModuleSettings,
  WebsiteContent,
  HomeContent,
  AboutContent,
  MembershipContent,
  DirectoryContent,
  ContactContent,
  OpportunityItem,
  OpportunityType,
  OpportunityStatus,
  WorkplaceType,
  MentorProfile,
  MentorshipRequest,
  ElectionCycle,
  ElectionPosition,
  Candidate,
  BallotVote,
  ElectionStatus,
  BroadcastMessage,
  BroadcastChannel,
  BroadcastAudienceFilter,
  BroadcastRecipientLog,
  BroadcastStatus,
  LeadershipOffice,
  WelcomePageConfig,
  CarouselImageItem,
  MemberExportFilter,
  MemberPdfExportResult,
  SecretariatContact,
  LegacyAlumniRecord,
} from '../types';
import { emailService } from './emailService';
import { jsPDF } from 'jspdf';
import { db, auth, isFirebaseConfigured } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  SETTINGS: 'mosa_settings',
  APPLICATIONS: 'mosa_applications',
  ALUMNI: 'mosa_alumni',
  USERS: 'mosa_users',
  AUDIT_LOGS: 'mosa_audit_logs',
  CURRENT_USER: 'mosa_current_user',
  CHAPTERS: 'mosa_chapters',
  CHAPTER_MEMBERS: 'mosa_chapter_members',
  EVENTS: 'mosa_events',
  EVENT_REGISTRATIONS: 'mosa_event_registrations',
  EVENT_ATTENDANCE: 'mosa_event_attendance',
  PAYMENTS: 'mosa_payments',
  CAMPAIGNS: 'mosa_campaigns',
  ANNOUNCEMENTS: 'mosa_announcements',
  NOTIFICATIONS: 'mosa_notifications',
  PHOTOS: 'mosa_photos',
  DOCUMENTS: 'mosa_documents',
  CMS_CONTENT: 'mosa_cms_content',
  OPPORTUNITIES: 'mosa_opportunities',
  MENTORS: 'mosa_mentors',
  MENTORSHIP_REQUESTS: 'mosa_mentorship_requests',
  ELECTIONS: 'mosa_elections',
  CANDIDATES: 'mosa_candidates',
  BALLOTS: 'mosa_ballots',
  BROADCASTS: 'mosa_broadcasts',
  BROADCAST_LOGS: 'mosa_broadcast_logs',
  CREDENTIALS: 'mosa_user_credentials',
  WELCOME_PAGE: 'mosa_welcome_page',
  LEADERSHIP_OFFICES: 'mosa_leadership_offices',
  ADMIN_LOCKOUTS: 'mosa_admin_lockouts',
  SECRETARIAT_CONTACTS: 'mosa_secretariat_contacts',
  LEGACY_ALUMNI: 'mosa_legacy_alumni',
};

const memoryStore: Record<string, string> = {};
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return memoryStore[key] || null;
  },
  setItem: (key: string, val: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, val); } catch {}
    }
    memoryStore[key] = val;
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(key); } catch {}
    }
    delete memoryStore[key];
  },
};

// Default initial state
const defaultSettings: SystemSettings = {
  nextAlumniNumber: 1, // Clean baseline starts at 1 (MA. 0001)
  nextApplicationNumber: 1,
  prefix: 'MA. ',
  padDigits: 4,
  systemName: 'MOSA Alumni Management System',
  schoolName: 'Mandela Secondary School Hoima (MASSH)',
  establishedYear: 1997,
  usedMANumbersRegistry: [],
  mobileMoneySettings: {
    mtnNumber: '0782 123456',
    mtnName: 'Mandela Old Students Association',
    airtelNumber: '0701 654321',
    airtelName: 'MOSA National Treasury',
    instructions: 'Enter your Alumni Number (e.g. MA. 0001) or Application Reference (e.g. MOSA-2026-00001) as the transaction reason.',
  },
  allowManualMANumberAssignment: true,
  autoApproveRegistrations: true, // System always autoverifies unless admin explicitly stops/toggles it OFF
  allowSelfAssignedAlumniNumber: false, // Paused by default: members cannot self-assign numbers unless admin toggles it ON
  moduleSettings: {
    home: true,
    about: true,
    membership: true,
    directory: true,
    news: true,
    events: true,
    gallery: true,
    documents: true,
    contact: true,
    giving: true,
    chapters: true,
    attendance: true,
    opportunities: true,
    elections: true,
  },
};

const defaultWebsiteContent: WebsiteContent = {
  home: {
    badgeText: 'MANDELA SECONDARY SCHOOL HOIMA (MASSH) • EST. 1997',
    heroTitle: 'Connecting Generations of MASSH Alumni Across the Globe.',
    heroSubtitle: 'Welcome to the MASSH ALUMNI PORTAL, the official digital platform of the Mandela Old Students Association (MOSA). Reconnect with classmates, access your official membership registry, join university chapters, and support our alma mater in Hoima.',
    heroHighlightWord: 'MASSH Alumni',
    statsHeritageText: '1997 – Present',
    statsHeritageSub: '27+ Years of Heritage',
    statsVerifiedText: '100% Verified',
    statsVerifiedSub: 'MASSH Official Registry',
    welcomeTitle: 'Message from the National Executive Committee',
    welcomeHeadline: '"Upholding our Alma Mater’s Legacy with Pride and Purpose"',
    welcomeBody: 'Since its founding in 1997, Mandela Secondary School Hoima has nurtured leaders, doctors, engineers, educators, entrepreneurs, and public servants who are shaping communities across Uganda and beyond. MOSA provides the digital bridge that binds our fraternity together. Make sure your profile is registered and verified so you never miss an opportunity to collaborate.',
    welcomeAuthor: 'MOSA National Secretariat',
    welcomeLocation: 'Mandela Secondary School Hoima, Bunyoro Sub-Region',
  },
  about: {
    tagline: 'OUR ROOTS & LEGACY',
    title: 'About Mandela Old Students Association',
    subtitle: 'Uniting generations of Mandela Secondary School Hoima (MASSH) graduates to preserve our heritage, empower alumni, and invest in our alma mater.',
    profileBadge: 'Alma Mater Profile',
    profileTitle: 'Mandela Secondary School Hoima (MASSH)',
    profileParagraph1: 'Mandela Secondary School Hoima was founded in 1997 in Hoima City, Uganda. Named in honour of the legendary statesman Nelson Mandela, the school has consistently championed academic diligence, moral integrity, leadership, and community service.',
    profileParagraph2: 'Offering both O-Level (UCE) and A-Level (UACE) curricula, MASSH has graduated thousands of professionals serving with distinction across Africa and internationally.',
    motto: '"Caring to Achieve"',
    colors: 'Navy Blue & Gold',
    milestones: [
      {
        year: '1997',
        title: 'Foundation of Mandela Secondary School Hoima',
        description: 'Established in the heart of Hoima City with a bold vision to provide holistic, disciplined, and rigorous secondary education in the Bunyoro sub-region.',
      },
      {
        year: '2001',
        title: 'First O-Level Graduating Cohort',
        description: 'The pioneer Senior Four class sat national UCE examinations, achieving exceptional distinctions and setting a high benchmark for academic excellence.',
      },
      {
        year: '2005',
        title: 'A-Level Expansion & First S6 Cohort',
        description: 'MASSH introduced Advanced Level studies (Sciences and Arts), promptly producing top university qualifiers for Makerere, Mbarara, and Kyambogo.',
      },
      {
        year: '2015',
        title: 'Inauguration of MOSA University Chapters',
        description: 'Alumni across major Ugandan universities formalised institutional chapters, providing mentorship and brotherly support for incoming freshmen.',
      },
      {
        year: '2022',
        title: 'Silver Jubilee Celebration (25 Years)',
        description: 'The school celebrated a quarter century of impactful service, commissioning new laboratory facilities and alumni-funded scholarship funds.',
      },
      {
        year: '2026',
        title: 'Launch of Unified MOSA Digital Platform',
        description: 'Commissioning of the permanent official membership registry, digital credentialing, and automated alumni verification system.',
      },
    ],
    leaders: [
      {
        role: 'Association President',
        name: 'Dr. Raymond Byaruhanga',
        cohort: 'Class of 2004 (S6 PCM)',
        profession: 'Senior Consultant & Healthcare Executive',
      },
      {
        role: 'Vice President',
        name: 'Hon. Brenda Kyaligonza',
        cohort: 'Class of 2007 (S6 HEL)',
        profession: 'Legal Practitioner & Policy Advisor',
      },
      {
        role: 'Secretary General',
        name: 'Eng. Patrick Isingoma',
        cohort: 'Class of 2010 (S6 PEM)',
        profession: 'Civil & Environmental Engineer',
      },
      {
        role: 'Honorary Treasurer',
        name: 'Sarah Mbabazi, CPA',
        cohort: 'Class of 2012 (S6 BCM)',
        profession: 'Senior Auditor & Financial Risk Analyst',
      },
      {
        role: 'Publicity & ICT Secretary',
        name: 'Muhammad K. Zatusave',
        cohort: 'Class of 2018 (S6 PCM/ICT)',
        profession: 'Infrastructure Engineer & Tech Lead',
      },
      {
        role: 'Welfare & Mobilisation Lead',
        name: 'Julian Atuhaire',
        cohort: 'Class of 2015 (S6 DEG)',
        profession: 'Educationist & Community Development Specialist',
      },
    ],
  },
  membership: {
    tagline: 'OFFICIAL MOSA MEMBERSHIP',
    title: 'Membership Structure & Numbering',
    subtitle: 'Every student who passed through the gates of Mandela Secondary School Hoima is entitled to a permanent, officially authenticated alumni number.',
    explainerTitle: 'How Your Alumni Number Works',
    explainerBody: 'When you submit your membership registration, the system validates your MASSH completion credentials and automatically allocates your official sequential membership number (e.g. MA. 0001 or MOSA-000001).',
    sampleNumber: 'MA. 0042',
    tiers: [
      {
        title: 'Ordinary Member',
        target: 'All Former MASSH Students',
        description: 'Automatic membership granted to all students who completed O-Level or A-Level at Mandela Secondary School Hoima.',
        benefits: [
          'Permanent unique official membership number',
          'Inclusion in the global verified alumni directory',
          'Right to attend MOSA Annual General Meetings (AGM)',
          'Participation in sports galas, dinners, and homecomings',
          'Access to university and regional campus chapters',
        ],
        badge: 'STANDARD',
      },
      {
        title: 'Life Member',
        target: 'Distinguished Alumni & Benefactors',
        description: 'Conferred upon alumni who make a lifetime endowment to the MOSA Education Trust or scholarship fund.',
        benefits: [
          'Gold digital & physical permanent ID credential',
          'Permanent citation in the MASSH Heritage Roll of Honour',
          'Special invitation to executive roundtables & school assemblies',
          'Full voting and executive nomination rights',
          'Dedicated VIP seating at all official functions',
        ],
        badge: 'HONOUR ROLL',
      },
      {
        title: 'Student Member',
        target: 'Current S.4 & S.6 Candidates',
        description: 'Transitional membership for graduating candidates preparing to cross into higher institutions and the corporate world.',
        benefits: [
          'Career mentorship by established alumni in their desired fields',
          'Orientation and link-up with university chapter leaders',
          'Priority transition to full alumni status upon result release',
          'Participation in pre-university career preparation workshops',
        ],
        badge: 'CANDIDATES',
      },
    ],
  },
  directory: {
    tagline: 'Official Mandela Old Students Association Registry • Motto: Caring to Achieve',
    title: 'Welcome to the MOSA Alumni Network',
    description: 'Connecting former students of Mandela Secondary School Hoima (MASSH), established in 1997. Find your classmates, verify alumni credentials with official MA. XXXX numbers, and celebrate our institutional heritage.',
  },
  contact: {
    tagline: 'NATIONAL SECRETARIAT',
    title: 'Contact MOSA & Alma Mater',
    subtitle: 'Reach out to the Mandela Old Students Association Secretariat, executive committee, or campus coordinators in Hoima.',
    campusAddress: 'Mandela Secondary School Hoima (MASSH), Main Campus, Hoima City, Bunyoro Sub-Region, Uganda',
    poBox: 'P.O. Box 284, Hoima City, Uganda',
    phoneNumbers: ['+256 772 411921', '+256 706599793', '+256 773432413'],
    emails: ['mosaalumni31@gmail.com'],
    workingHours: 'Monday – Friday: 8:00 AM – 5:00 PM EAT | Saturday: 9:00 AM – 1:00 PM EAT',
    faqs: [
      {
        q: 'How do I obtain my permanent alumni number?',
        a: 'Simply click "Register as Member" in the portal. Once you submit your academic details (O-Level / A-Level years at MASSH) and upload your portrait photograph, your unique sequential membership number (e.g. MA. 0001 or MOSA-000001) will be generated automatically and instantly issued to you.',
      },
      {
        q: 'Can employers or university registrars verify my membership?',
        a: 'Yes. The portal provides a real-time Public Verification Desk. Anyone with your membership number can check its validity against the official MASSH registry without logging into the platform.',
      },
      {
        q: 'What if I need to update my details or photograph after registration?',
        a: 'You can log in to your Member Profile at any time to update your bio, occupation, contact numbers, and social links. You can also generate an updated digital ID card.',
      },
      {
        q: 'How do I join or start a MOSA chapter at my university or city?',
        a: 'Check the Chapters directory on this platform to connect with existing institutional chapters. If your university does not yet have an accredited chapter, submit an inquiry using the contact form below.',
      },
    ],
  },
};

const defaultSeedDocuments: MOSADocument[] = [];

const defaultSeedOpportunities: OpportunityItem[] = [];

const defaultSeedMentors: MentorProfile[] = [];

const defaultSeedElections: ElectionCycle[] = [];

const defaultSeedCandidates: Candidate[] = [];

const defaultSeedUsers: AuthUser[] = [
  {
    uid: 'admin-super-01',
    email: 'admin@massh.ac.ug',
    role: 'SUPER_ADMIN',
    displayName: 'Head of ICT / MOSA Admin',
    mustChangePassword: false,
  },
  {
    uid: 'admin-super-02',
    email: 'superadmin@mosa.org',
    role: 'SUPER_ADMIN',
    displayName: 'Executive Super Admin',
    mustChangePassword: false,
  },
  { uid: 'staff-secretary-01', email: 'secretary@massh.ac.ug', role: 'SECRETARY', displayName: 'MOSA Secretary General', active: true, officeId: 'off-registry', officeTitle: 'Membership, Registry & Verification' },
  { uid: 'staff-treasurer-01', email: 'treasurer@massh.ac.ug', role: 'TREASURER', displayName: 'MOSA Honorary Treasurer', active: true, officeId: 'off-treasury', officeTitle: 'Honorary Treasury & Finance' },
  { uid: 'staff-publicity-01', email: 'publicity@massh.ac.ug', role: 'PUBLICITY', displayName: 'MOSA Publicity Secretary', active: true, officeId: 'off-comms', officeTitle: 'Communications, Media & Heritage' },
];

const defaultSeedOffices: LeadershipOffice[] = [
  {
    id: 'off-treasury',
    title: 'Honorary Treasury & Finance',
    description: 'Management of voluntary alumni contributions, audited accounts, verified receipts, and financial reporting.',
    category: 'EXECUTIVE',
    assignedEmail: 'treasurer@massh.ac.ug',
    appointmentStartDate: '2026-01-01',
    appointmentEndDate: '2028-12-31',
    status: 'ACTIVE',
    modules: ['FINANCE', 'REPORTS', 'DOCUMENTS'],
    granularPermissions: {
      FINANCE: ['VIEW', 'ADD', 'EDIT', 'VERIFY', 'EXPORT', 'MANAGE'],
      REPORTS: ['VIEW', 'EXPORT'],
      DOCUMENTS: ['VIEW', 'ADD']
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin@massh.ac.ug'
  },
  {
    id: 'off-registry',
    title: 'Membership, Registry & Verification',
    description: 'Custodian of the alumni register, membership application verification, and MA sequence integrity.',
    category: 'SECRETARIAT',
    assignedEmail: 'secretary@massh.ac.ug',
    appointmentStartDate: '2026-01-01',
    appointmentEndDate: '2028-12-31',
    status: 'ACTIVE',
    modules: ['REGISTRY', 'VERIFICATION', 'NUMBERS', 'DOCUMENTS', 'REPORTS'],
    granularPermissions: {
      REGISTRY: ['VIEW', 'ADD', 'EDIT', 'APPROVE', 'VERIFY', 'EXPORT'],
      VERIFICATION: ['VIEW', 'APPROVE', 'REJECT', 'VERIFY'],
      NUMBERS: ['VIEW', 'ADD', 'EDIT', 'VERIFY'],
      DOCUMENTS: ['VIEW', 'ADD']
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin@massh.ac.ug'
  },
  {
    id: 'off-events',
    title: 'Events, Conventions & Meeting Attendance',
    description: 'Planning reunions, annual conventions, roll calls, and meeting quorum management.',
    category: 'COMMITTEE',
    status: 'VACANT',
    modules: ['EVENTS', 'ATTENDANCE', 'REPORTS'],
    granularPermissions: {
      EVENTS: ['VIEW', 'ADD', 'EDIT', 'PUBLISH', 'MANAGE'],
      ATTENDANCE: ['VIEW', 'ADD', 'EDIT', 'VERIFY', 'EXPORT', 'MANAGE']
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin@massh.ac.ug'
  },
  {
    id: 'off-comms',
    title: 'Communications, Media & Heritage',
    description: 'Official circulars, newsletters, press briefings, and digital heritage archive.',
    category: 'COMMITTEE',
    assignedEmail: 'publicity@massh.ac.ug',
    status: 'ACTIVE',
    modules: ['COMMUNICATIONS', 'WELCOME_PAGE', 'DOCUMENTS'],
    granularPermissions: {
      COMMUNICATIONS: ['VIEW', 'ADD', 'EDIT', 'PUBLISH', 'MANAGE'],
      WELCOME_PAGE: ['VIEW', 'EDIT', 'PUBLISH']
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin@massh.ac.ug'
  },
  {
    id: 'off-alumni-relations',
    title: 'Alumni Relations & Chapter Networks',
    description: 'Coordination between regional, diaspora, and university chapters across Uganda and worldwide.',
    category: 'REGIONAL',
    status: 'VACANT',
    modules: ['CHAPTERS', 'REGISTRY', 'OPPORTUNITIES'],
    granularPermissions: {
      CHAPTERS: ['VIEW', 'ADD', 'EDIT', 'MANAGE'],
      REGISTRY: ['VIEW'],
      OPPORTUNITIES: ['VIEW', 'ADD', 'APPROVE']
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin@massh.ac.ug'
  }
];

export const defaultCarouselImages: CarouselImageItem[] = [
  {
    id: 'img-flag',
    url: '/images/massh-flag-unveiling-ceremony.jpg',
    title: 'Flag Unveiling & Assembly',
    caption: 'Mandela Secondary School Hoima official assembly ceremony',
    isFeatured: true,
    order: 1
  },
  {
    id: 'img-gate',
    url: '/images/massh-gate-welcoming.jpg',
    title: 'Campus Main Gate',
    caption: 'Welcoming generations of proud Mandelians since 1997',
    isFeatured: false,
    order: 2
  },
  {
    id: 'img-courtyard',
    url: '/images/massh-courtyard-briefing.jpg',
    title: 'Alumni Gathering',
    caption: 'Courtyard briefing and reunion networking',
    isFeatured: false,
    order: 3
  },
  {
    id: 'img-handover',
    url: '/images/massh-official-handover.jpg',
    title: 'Secretariat Leadership',
    caption: 'Official executive handover and leadership stewardship',
    isFeatured: false,
    order: 4
  },
  {
    id: 'img-foundation',
    url: '/images/massh-foundation-stone-unveiled.jpg',
    title: 'School Heritage',
    caption: 'Historic foundation stone commemorating MASSH founding',
    isFeatured: false,
    order: 5
  },
  {
    id: 'img-lab',
    url: '/images/massh-science-lab-inspection.jpg',
    title: 'Academic Excellence',
    caption: 'State-of-the-art science laboratories and student innovation',
    isFeatured: false,
    order: 6
  }
];

const defaultWelcomePageConfig: WelcomePageConfig = {
  heroTitle: 'WELCOME TO MOSA',
  slogan: 'PROUDLY MANDELIAN',
  subtitle: 'One family. One legacy. A lifetime of connection.',
  introMessage: 'Connecting generations of Mandela Secondary School Hoima alumni across Uganda and the world.',
  heroImageUrl: '/images/massh-flag-unveiling-ceremony.jpg',
  carouselImages: defaultCarouselImages,
  carouselIntervalSeconds: 6,
  hasUnpublishedDraft: false,
  lastPublishedAt: '2026-10-01T00:00:00.000Z',
  lastPublishedBy: 'admin@massh.ac.ug',
  socialX: 'https://x.com/Masshalumni',
  socialLinkedIn: 'https://linkedin.com/company/mosa-massh',
  socialGmail: 'mosaalumni31@gmail.com',
  socialTikTok: 'https://tiktok.com/@mosa_massh',
  officialPhone: '+256 772 411921',
  officialWhatsApp: '256772411921',
  officialAddress: 'Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda',
  officialWebsite: 'https://mtech-46634.web.app',
};

const defaultSeedAlumni: AlumniProfile[] = [];

const defaultSeedApplications: AlumniApplication[] = [];

const defaultSeedAuditLogs: AuditLog[] = [];

export const defaultSeedChapters: Chapter[] = [
  {
    id: 'chap-01',
    name: 'Makerere University Mandela Old Students Association',
    code: 'MUMASA',
    institution: 'Makerere University',
    location: 'Kampala',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'The pioneering university chapter uniting Mandela alumni pursuing undergraduate and postgraduate degrees and careers at Makerere University.',
    adminEmails: ['mumasa@massh.ac.ug'],
    leaderName: 'MUMASA Executive Team',
    leaderContact: '+256 782 111222',
    memberCount: 142,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-02',
    name: 'Kyambogo University Mandela Old Students Association',
    code: 'KYUMASA',
    institution: 'Kyambogo University',
    location: 'Kampala',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'Kyambogo University alumni chapter advancing technological, educational, and vocational leadership among Mandela graduates.',
    adminEmails: ['kyumasa@massh.ac.ug'],
    leaderName: 'KYUMASA Executive Team',
    leaderContact: '+256 701 333444',
    memberCount: 98,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-03',
    name: 'Mbarara University Mandela Old Students Association',
    code: 'MBUMASA',
    institution: 'Mbarara University of Science & Technology (MUST)',
    location: 'Mbarara',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'Mandela alumni at MUST and Western Uganda science, medical, and engineering hubs.',
    adminEmails: ['mbumasa@massh.ac.ug'],
    leaderName: 'MBUMASA Executive Team',
    leaderContact: '+256 772 555666',
    memberCount: 64,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-04',
    name: 'Gulu University Mandela Old Students Association',
    code: 'GUMASA',
    institution: 'Gulu University',
    location: 'Gulu City',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'Northern Uganda hub connecting Mandela alumni across Northern region institutions and development sectors.',
    adminEmails: ['gumasa@massh.ac.ug'],
    leaderName: 'GUMASA Executive Team',
    leaderContact: '+256 784 777888',
    memberCount: 41,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-05',
    name: 'Nkumba University Mandela Old Students Association',
    code: 'NKUMASA',
    institution: 'Nkumba University',
    location: 'Entebbe / Wakiso',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'Mandela alumni chapter across Greater Entebbe, aviation, business, and administrative disciplines at Nkumba University.',
    adminEmails: ['nkumasa@massh.ac.ug'],
    leaderName: 'NKUMASA Executive Team',
    leaderContact: '+256 702 999000',
    memberCount: 36,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-06',
    name: 'Makerere University Business School Chapter',
    code: 'MUBSMASA',
    institution: 'Makerere University Business School (MUBS)',
    location: 'Kampala (Nakawa)',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'UNIVERSITY',
    description: 'Business, finance, corporate entrepreneurship, and economics network for Mandela alumni at MUBS Nakawa.',
    adminEmails: ['mubs@massh.ac.ug'],
    leaderName: 'MUBSMASA Executive Team',
    leaderContact: '+256 782 222333',
    memberCount: 87,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-00',
    name: 'Bunyoro / Hoima Mother Chapter',
    code: 'HOMASA',
    institution: 'MASSH Hoima Main Campus & Bunyoro Region',
    location: 'Hoima City',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'REGIONAL',
    description: 'The foundation and home base chapter anchored at the parent school in Hoima City, coordinating community outreach and school mentorship.',
    adminEmails: ['bunyoro@massh.ac.ug'],
    leaderName: 'Hoima Regional Secretariat',
    leaderContact: '+256 772 000111',
    memberCount: 312,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-07',
    name: 'Kampala Metropolitan Chapter',
    code: 'KAMPALA',
    institution: 'Greater Kampala Metropolitan Area',
    location: 'Kampala',
    country: 'Uganda',
    status: 'ACTIVE',
    chapterType: 'REGIONAL',
    description: 'Metropolitan hub for corporate executives, legal practitioners, civil servants, and alumni entrepreneurs working in Greater Kampala.',
    adminEmails: ['kampala@massh.ac.ug'],
    leaderName: 'Kampala Metropolitan Lead',
    leaderContact: '+256 701 888999',
    memberCount: 225,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'chap-08',
    name: 'MOSA International Diaspora Chapter',
    code: 'DIASPORA',
    institution: 'International Diaspora Community',
    location: 'Global (UK, USA, Canada, Europe, Middle East)',
    country: 'International',
    status: 'ACTIVE',
    chapterType: 'DIASPORA',
    description: 'Global network representing Mandela alumni across the diaspora, facilitating international partnerships, scholarships, and diaspora giving.',
    adminEmails: ['diaspora@massh.ac.ug'],
    leaderName: 'Diaspora Global Coordinator',
    leaderContact: '+44 7700 900123',
    memberCount: 73,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  }
];

const defaultSeedChapterMembers: ChapterMember[] = [];

const defaultSeedEvents: MOSAEvent[] = [];

const defaultSeedEventRegistrations: EventRegistration[] = [];

const defaultSeedEventAttendance: EventAttendance[] = [];

const defaultSeedCampaigns: DonationCampaign[] = [];

const defaultSeedPayments: PaymentTransaction[] = [];

const defaultSeedAnnouncements: Announcement[] = [];

const defaultSeedNotifications: AlumniNotification[] = [];

const defaultSeedPhotos: CampusPhoto[] = [];

const defaultSeedSecretariatContacts: SecretariatContact[] = [
  {
    id: 'sec-01',
    name: 'MOSA National Secretariat',
    title: 'National Executive Secretariat',
    publishedPhone: '+256 782 123456',
    whatsAppNumber: '256782123456',
    email: 'secretariat@massh.ac.ug',
    officeCategory: 'EXECUTIVE',
    status: 'ACTIVE',
    displayOrder: 1,
    notes: 'National Executive Secretariat Office, MASSH Hoima Main Campus'
  },
  {
    id: 'sec-02',
    name: 'MOSA Secretary General Office',
    title: 'Secretary General',
    publishedPhone: '+256 701 234567',
    whatsAppNumber: '256701234567',
    email: 'secretary@massh.ac.ug',
    officeCategory: 'SECRETARIAT',
    status: 'ACTIVE',
    displayOrder: 2,
    notes: 'Official correspondence and alumni registry records'
  },
  {
    id: 'sec-03',
    name: 'MOSA Honorary Treasury',
    title: 'Honorary Treasurer',
    publishedPhone: '+256 782 345678',
    whatsAppNumber: '256782345678',
    email: 'treasurer@massh.ac.ug',
    officeCategory: 'EXECUTIVE',
    status: 'ACTIVE',
    displayOrder: 3,
    notes: 'National treasury, contributions and project funds'
  },
  {
    id: 'sec-04',
    name: 'MOSA Publicity & Media Desk',
    title: 'Publicity & Mobilisation Secretary',
    publishedPhone: '+256 752 456789',
    whatsAppNumber: '256752456789',
    email: 'publicity@massh.ac.ug',
    officeCategory: 'SECRETARIAT',
    status: 'ACTIVE',
    displayOrder: 4,
    notes: 'Media relations, public communications and cohort mobilisation'
  }
];

const defaultSeedLegacyAlumni: LegacyAlumniRecord[] = [];

const defaultSeedBroadcasts: BroadcastMessage[] = [];

const CLEAN_BASELINE_KEY = 'mosa_clean_baseline_2026';

// Helper to initialize local storage with clean baseline
function initLocalStore() {
  const needsBaselineSanitize = safeStorage.getItem(CLEAN_BASELINE_KEY) !== 'v2';

  if (!safeStorage.getItem(STORAGE_KEYS.SETTINGS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.USERS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultSeedUsers));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ALUMNI) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(defaultSeedAlumni));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(defaultSeedApplications));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultSeedAuditLogs));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CHAPTERS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(defaultSeedChapters));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify(defaultSeedChapterMembers));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENTS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(defaultSeedEvents));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(defaultSeedEventRegistrations));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENT_ATTENDANCE) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.EVENT_ATTENDANCE, JSON.stringify(defaultSeedEventAttendance));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CAMPAIGNS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(defaultSeedCampaigns));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.PAYMENTS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(defaultSeedPayments));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultSeedAnnouncements));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultSeedNotifications));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.PHOTOS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(defaultSeedPhotos));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.BROADCASTS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(defaultSeedBroadcasts));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.DOCUMENTS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(defaultSeedDocuments));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.OPPORTUNITIES) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(defaultSeedOpportunities));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.MENTORS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(defaultSeedMentors));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ELECTIONS) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(defaultSeedElections));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CANDIDATES) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(defaultSeedCandidates));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.WELCOME_PAGE)) {
    safeStorage.setItem(STORAGE_KEYS.WELCOME_PAGE, JSON.stringify(defaultWelcomePageConfig));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.LEADERSHIP_OFFICES)) {
    safeStorage.setItem(STORAGE_KEYS.LEADERSHIP_OFFICES, JSON.stringify(defaultSeedOffices));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.SECRETARIAT_CONTACTS)) {
    safeStorage.setItem(STORAGE_KEYS.SECRETARIAT_CONTACTS, JSON.stringify(defaultSeedSecretariatContacts));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.LEGACY_ALUMNI) || needsBaselineSanitize) {
    safeStorage.setItem(STORAGE_KEYS.LEGACY_ALUMNI, JSON.stringify(defaultSeedLegacyAlumni));
  }

  // Clear credentials when baseline sanitizing so old demo users don't linger
  if (needsBaselineSanitize) {
    safeStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    safeStorage.setItem(CLEAN_BASELINE_KEY, 'v2');
  }
}

initLocalStore();

export const dataService = {
  // Format membership number, e.g. MA. 0001
  formatAlumniNumber(num: number, prefix = 'MA. ', pad = 4): string {
    return `${prefix}${String(num).padStart(pad, '0')}`;
  },

  // Normalize acceptable formatting consistently (e.g. ma.0001, MA-0001, 0001 -> MA. 0001)
  normalizeAlumniNumber(input: string, prefix = 'MA. ', pad = 4): string {
    if (!input) return '';
    const trimmed = input.trim();
    const digitMatch = trimmed.match(/\d+/);
    if (!digitMatch) return trimmed.toUpperCase();
    const num = parseInt(digitMatch[0], 10);
    return `${prefix}${String(num).padStart(pad, '0')}`;
  },

  // Check duplicate applicant
  async checkDuplicate(email: string, phone: string): Promise<{ isDuplicate: boolean; reason?: string }> {
    const apps = await this.getApplications();
    const alumniList = await this.getAlumniList();

    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedPhone = (phone || '').replace(/[\s\-\(\)]/g, '');
    // Phone and email are optional (members without a phone may be registered).
    // Blank values must never be considered duplicates of each other.
    const emailMatches = (v?: string) => !!normalizedEmail && (v || '').trim().toLowerCase() === normalizedEmail;
    const phoneMatches = (v?: string) => !!normalizedPhone && (v || '').replace(/[\s\-\(\)]/g, '') === normalizedPhone;

    for (const a of alumniList) {
      if (emailMatches(a.email)) {
        return { isDuplicate: true, reason: `An alumni profile with email "${email}" already exists with Alumni No: ${a.alumniNumber}.` };
      }
      if (phoneMatches(a.phone)) {
        return { isDuplicate: true, reason: `An alumni profile with phone "${phone}" already exists with Alumni No: ${a.alumniNumber}.` };
      }
    }

    for (const app of apps) {
      if (app.status !== 'REJECTED') {
        if (emailMatches(app.email)) {
          return { isDuplicate: true, reason: `An existing application with email "${email}" is currently ${app.status.replace('_', ' ')}.` };
        }
        if (phoneMatches(app.phone)) {
          return { isDuplicate: true, reason: `An existing application with phone "${phone}" is currently ${app.status.replace('_', ' ')}.` };
        }
      }
    }

    return { isDuplicate: false };
  },

  // Submit Application with Automatic Membership Approval & Number Assignment
  async submitApplication(appData: Omit<AlumniApplication, 'id' | 'status' | 'submittedAt' | 'updatedAt'>): Promise<{ 
    success: boolean; 
    id?: string; 
    referenceId?: string; 
    alumniNumber?: string; 
    alumnus?: AlumniProfile; 
    error?: string 
  }> {
    try {
      // Enforcement: Alumni registration requires authenticated user account
      const activeUser = this.getCurrentUser();
      if (!activeUser && !appData.registeredBy) {
        return { 
          success: false, 
          error: 'Authentication required. Please create an account or log in before registering as an alumnus.' 
        };
      }

      const dupCheck = await this.checkDuplicate(appData.email, appData.phone);
      if (dupCheck.isDuplicate) {
        return { success: false, error: dupCheck.reason };
      }

      const id = `app-${Date.now()}`;
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();

      // Generate Reference ID (e.g. MOSA-2026-00001)
      const settingsRaw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings: SystemSettings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;
      const appSeq = settings.nextApplicationNumber || 1;
      const referenceId = `MOSA-${currentYear}-${String(appSeq).padStart(5, '0')}`;
      settings.nextApplicationNumber = appSeq + 1;

      const isAutoApprove = settings.autoApproveRegistrations !== false;
      let generatedNumber: string | undefined;
      let newProfile: AlumniProfile | undefined;

      if (isAutoApprove) {
        const prefix = settings.prefix || 'MA. ';
        const pad = settings.padDigits || 4;

        // Anti-collision set from permanent ledger & active directory
        const usedRegistry = new Set<string>((settings.usedMANumbersRegistry || []).map(s => this.normalizeAlumniNumber(s)));
        const existingAlumni = await this.getAlumniList();
        existingAlumni.forEach(a => usedRegistry.add(this.normalizeAlumniNumber(a.alumniNumber)));

        // Phase 3: Check if applicant has an existing legacy number from physical register (if self-assignment is enabled by admin)
        const canSelfAssign = settings.allowSelfAssignedAlumniNumber === true;
        if (canSelfAssign && appData.existingAlumniNumber && appData.existingAlumniNumber.trim()) {
          const normExisting = this.normalizeAlumniNumber(appData.existingAlumniNumber, prefix, pad);
          // Check if already claimed by another active registered alumnus
          const alreadyLinked = existingAlumni.find(a => this.normalizeAlumniNumber(a.alumniNumber) === normExisting);
          if (alreadyLinked) {
            return {
              success: false,
              error: `The existing membership number "${normExisting}" is already linked to another registered alumnus account. Please contact the MOSA Secretariat if this number belongs to you.`
            };
          }

          // Check authoritative physical legacy register
          const legacyList = await this.getLegacyAlumni();
          const legacyMatch = legacyList.find(l => this.normalizeAlumniNumber(l.membershipNumber) === normExisting);
          if (legacyMatch) {
            const submittedName = [appData.firstName, appData.middleName, appData.lastName].filter(Boolean).join(' ').toLowerCase();
            const legacyName = legacyMatch.fullName.toLowerCase();
            const nameWords = submittedName.split(/\s+/).filter(w => w.length > 2);
            const matchesName = nameWords.some(w => legacyName.includes(w));
            
            if (matchesName || !legacyMatch.fullName) {
              generatedNumber = normExisting;
              legacyMatch.verifiedStatus = 'LINKED';
              legacyMatch.linkedDate = now;
              await this.saveLegacyAlumniRecord(legacyMatch);
            } else {
              return {
                success: false,
                error: `The existing number "${normExisting}" is recorded under a different name in the physical register. Please verify your details or leave the field blank to receive a new permanent number.`
              };
            }
          } else {
            // Not in imported physical register book, but verified unique
            generatedNumber = normExisting;
          }
        }

        // If no existing number, generate unique sequential number
        if (!generatedNumber) {
          let currentCounter = settings.nextAlumniNumber || 1;
          generatedNumber = this.formatAlumniNumber(currentCounter, prefix, pad);
          while (usedRegistry.has(this.normalizeAlumniNumber(generatedNumber))) {
            currentCounter += 1;
            generatedNumber = this.formatAlumniNumber(currentCounter, prefix, pad);
          }
          settings.nextAlumniNumber = currentCounter + 1;
        }

        if (!settings.usedMANumbersRegistry) settings.usedMANumbersRegistry = [];
        if (!settings.usedMANumbersRegistry.some(r => this.normalizeAlumniNumber(r) === this.normalizeAlumniNumber(generatedNumber!))) {
          settings.usedMANumbersRegistry.push(generatedNumber);
        }

        const alumniId = `alumni-${Date.now()}`;
        const fullName = [appData.firstName, appData.middleName, appData.lastName].filter(Boolean).join(' ');
        newProfile = {
          internalId: alumniId,
          alumniNumber: generatedNumber,
          firstName: appData.firstName,
          middleName: appData.middleName,
          lastName: appData.lastName,
          fullName,
          nickname: appData.nickname,
          gender: appData.gender,
          dateOfBirth: appData.dateOfBirth,
          photoUrl: appData.photoUrl,
          phone: appData.phone,
          email: appData.email,
          country: appData.country,
          city: appData.city,
          address: appData.address,
          linkedIn: appData.linkedIn,
          socialLink: appData.socialLink,
          currentInstitution: appData.currentInstitution,
          programme: appData.programme,
          highestQualification: appData.highestQualification,
          occupation: appData.occupation,
          organisation: appData.organisation,
          position: appData.position,
          bio: appData.bio,
          schoolHistory: appData.schoolHistory,
          privacySettings: appData.privacySettings,
          membershipStatus: 'ACTIVE',
          statusHistory: [
            {
              status: 'ACTIVE',
              changedAt: now,
              changedBy: 'SYSTEM_AUTO_APPROVAL',
              reason: 'Automatic membership approval upon registration submission',
            }
          ],
          numberChangeHistory: [],
          membershipPaidUntilYear: new Date().getFullYear(),
          createdAt: now,
          updatedAt: now,
          verifiedAt: now,
          verifiedBy: 'SYSTEM_AUTO_APPROVAL',
          applicationId: id,
          registrationMode: appData.registrationMode || 'SELF',
          registeredBy: appData.registeredBy,
          accountActivated: !!(appData.email || appData.phone),
        };

        // Save alumni record
        if (isFirebaseConfigured() && db) {
          await setDoc(doc(db, 'alumni', alumniId), newProfile);
        } else {
          const alumniList = await this.getAlumniList();
          alumniList.push(newProfile);
          safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(alumniList));
        }

        // Update or create AuthUser
        const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const userIdx = users.findIndex(u => !!appData.email && u.email.toLowerCase() === appData.email.toLowerCase());
        if (userIdx !== -1) {
          users[userIdx].role = 'ALUMNI';
          users[userIdx].alumniId = alumniId;
          users[userIdx].alumniNumber = generatedNumber;
          users[userIdx].displayName = fullName;
          users[userIdx].phone = appData.phone || users[userIdx].phone;
          users[userIdx].photoUrl = appData.photoUrl || users[userIdx].photoUrl;
          users[userIdx].alumniOnboardingDecision = 'COMPLETED';
          safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        } else if (appData.email || appData.phone) {
          users.push({
            uid: `user-${alumniId}`,
            email: appData.email,
            displayName: fullName,
            role: 'ALUMNI',
            alumniId,
            alumniNumber: generatedNumber,
            photoUrl: appData.photoUrl,
            phone: appData.phone,
            alumniOnboardingDecision: 'COMPLETED',
          });
          safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }

        // Synchronize active logged in session
        const currentAuthRaw = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (currentAuthRaw) {
          try {
            const curr = JSON.parse(currentAuthRaw);
            if (curr.email && appData.email && curr.email.toLowerCase() === appData.email.toLowerCase()) {
              curr.role = 'ALUMNI';
              curr.alumniId = alumniId;
              curr.alumniNumber = generatedNumber;
              curr.displayName = fullName;
              curr.alumniOnboardingDecision = 'COMPLETED';
              safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(curr));
            }
          } catch {}
        }
      }

      // Persist updated settings (counter + used registry)
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

      const newApp: AlumniApplication = {
        ...appData,
        id,
        referenceId: appData.referenceId || referenceId,
        status: isAutoApprove ? 'APPROVED' : 'PENDING',
        assignedAlumniNumber: generatedNumber,
        reviewedAt: isAutoApprove ? now : undefined,
        reviewedBy: isAutoApprove ? 'SYSTEM_AUTO_APPROVAL' : undefined,
        submittedAt: now,
        updatedAt: now,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'applications', id), newApp);
      } else {
        const apps = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
        apps.unshift(newApp);
        safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      }

      // Update logged-in AuthUser's onboarding decision so they don't get prompted repeatedly
      const currentSessionUser = this.getCurrentUser();
      const applicantEmail = (appData.email || '').toLowerCase().trim();
      if (currentSessionUser && (currentSessionUser.email.toLowerCase() === applicantEmail || appData.registrationMode === 'SELF')) {
        currentSessionUser.alumniOnboardingDecision = 'COMPLETED';
        if (newProfile?.internalId) {
          currentSessionUser.alumniId = newProfile.internalId;
          currentSessionUser.alumniNumber = generatedNumber;
          currentSessionUser.role = 'ALUMNI';
        }
        safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentSessionUser));
      }

      const storedUsers: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const userIdx = storedUsers.findIndex(u => !!applicantEmail && u.email.toLowerCase() === applicantEmail);
      if (userIdx !== -1) {
        storedUsers[userIdx].alumniOnboardingDecision = 'COMPLETED';
        if (newProfile?.internalId) {
          storedUsers[userIdx].alumniId = newProfile.internalId;
          storedUsers[userIdx].alumniNumber = generatedNumber;
          storedUsers[userIdx].role = 'ALUMNI';
        }
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(storedUsers));
      }

      // Record audit log
      await this.logAudit({
        action: 'APPLICATION_SUBMITTED',
        performedBy: appData.email,
        affectedRecord: id,
        metadata: {
          applicantName: `${appData.firstName} ${appData.lastName}`,
          email: appData.email,
          phone: appData.phone,
          referenceId: newApp.referenceId,
          autoApproved: isAutoApprove,
          assignedAlumniNumber: generatedNumber,
        },
      });

      if (isAutoApprove && generatedNumber && newProfile) {
        await this.logAudit({
          action: 'AUTO_MEMBERSHIP_APPROVED',
          performedBy: 'SYSTEM',
          affectedRecord: generatedNumber,
          metadata: {
            applicantName: `${appData.firstName} ${appData.lastName}`,
            email: appData.email,
            referenceId: newApp.referenceId,
            assignedAlumniNumber: generatedNumber,
          },
        });

        // Welcome notification
        await this.sendNotification({
          alumniId: newProfile.internalId,
          title: 'Membership Approved & Number Assigned!',
          message: `Welcome to MOSA! Your membership has been automatically approved. Your official membership number is ${generatedNumber}.`,
          type: 'MEMBERSHIP',
          linkTab: 'my-profile'
        });
      }

      return { 
        success: true, 
        id, 
        referenceId: newApp.referenceId,
        alumniNumber: generatedNumber,
        alumnus: newProfile,
      };
    } catch (err: any) {
      console.error('Error submitting application:', err);
      return { success: false, error: err.message || 'Failed to submit application' };
    }
  },

  // Get Applications
  async getApplications(statusFilter?: ApplicationStatus): Promise<AlumniApplication[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'applications');
        const q = statusFilter 
          ? query(colRef, where('status', '==', statusFilter), orderBy('submittedAt', 'desc'))
          : query(colRef, orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as AlumniApplication);
      } catch (e) {
        console.warn('Firebase read failed, using local storage:', e);
      }
    }
    const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    if (statusFilter) {
      return apps.filter(a => a.status === statusFilter);
    }
    return apps;
  },

  async getApplicationById(id: string): Promise<AlumniApplication | null> {
    const apps = await this.getApplications();
    return apps.find(a => a.id === id) || null;
  },

  // Update Application Status (e.g. Under Review, Needs Correction, Rejected)
  async updateApplicationStatus(id: string, status: ApplicationStatus, notes?: string, adminEmail = 'admin@massh.ac.ug'): Promise<void> {
    const now = new Date().toISOString();
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'applications', id);
        await updateDoc(docRef, {
          status,
          reviewNotes: notes || '',
          reviewedAt: now,
          reviewedBy: adminEmail,
          updatedAt: now,
        });
      } catch (e) {
        console.warn('Firebase update failed, updating local storage:', e);
      }
    }

    const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx].status = status;
      if (notes) apps[idx].reviewNotes = notes;
      apps[idx].reviewedAt = now;
      apps[idx].reviewedBy = adminEmail;
      apps[idx].updatedAt = now;
      safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    }

    await this.logAudit({
      action: `APPLICATION_${status}`,
      performedBy: adminEmail,
      affectedRecord: id,
      metadata: { status, reviewNotes: notes },
    });
  },

  // Request Correction on Application
  async requestCorrection(applicationId: string, reason: string, adminEmail = 'admin@massh.ac.ug'): Promise<{ success: boolean; error?: string }> {
    const app = await this.getApplicationById(applicationId);
    if (!app) return { success: false, error: 'Application record not found.' };

    const now = new Date().toISOString();
    const historyItem = {
      requestedAt: now,
      requestedBy: adminEmail,
      reason,
    };

    const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      apps[idx].status = 'NEEDS_CORRECTION';
      apps[idx].correctionReason = reason;
      apps[idx].correctionHistory = [...(apps[idx].correctionHistory || []), historyItem];
      apps[idx].updatedAt = now;
      safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    }

    // Trigger in-app notification to the applicant
    await this.sendNotification({
      alumniId: applicationId,
      title: 'Correction Requested on Your MOSA Application',
      message: `The MOSA Secretariat has reviewed your application and requested the following update: "${reason}". Please review and resubmit.`,
      type: 'SYSTEM',
    });

    await this.logAudit({
      action: 'APPLICATION_NEEDS_CORRECTION',
      performedBy: adminEmail,
      affectedRecord: applicationId,
      metadata: { reason, applicantEmail: app.email },
    });

    return { success: true };
  },

  // Resubmit Application after correction
  async resubmitApplication(applicationId: string, updatedData: Partial<AlumniApplication>): Promise<{ success: boolean; error?: string }> {
    const app = await this.getApplicationById(applicationId);
    if (!app) return { success: false, error: 'Application record not found.' };

    const now = new Date().toISOString();
    const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      apps[idx] = {
        ...apps[idx],
        ...updatedData,
        status: 'PENDING',
        updatedAt: now,
      };
      if (apps[idx].correctionHistory && apps[idx].correctionHistory!.length > 0) {
        const lastIdx = apps[idx].correctionHistory!.length - 1;
        apps[idx].correctionHistory![lastIdx].resubmittedAt = now;
      }
      safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    }

    await this.logAudit({
      action: 'APPLICATION_RESUBMITTED',
      performedBy: app.email,
      affectedRecord: applicationId,
      metadata: { applicantName: `${app.firstName} ${app.lastName}`, referenceId: app.referenceId },
    });

    return { success: true };
  },

  // ATOMIC MA NUMBER GENERATION & APPROVAL (With Automatic or Safe Manual Assignment)
  async approveApplicationAndGenerateMA(
    applicationId: string, 
    adminEmail = 'admin@massh.ac.ug', 
    notes?: string,
    manualNumber?: string
  ): Promise<{ success: boolean; alumniNumber?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const app = await this.getApplicationById(applicationId);
      if (!app) {
        return { success: false, error: 'Application record not found.' };
      }
      if (app.status === 'APPROVED' && app.assignedAlumniNumber) {
        return { success: false, error: `Application is already approved with ${app.assignedAlumniNumber}.` };
      }

      let generatedNumber = '';

      // Settings & Used registry
      const settingsRaw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings: SystemSettings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;
      const usedRegistry = new Set(settings.usedMANumbersRegistry || ['MA. 0001', 'MA. 0002']);

      const alumniList: AlumniProfile[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.ALUMNI) || '[]');
      alumniList.forEach(a => usedRegistry.add(a.alumniNumber));

      if (manualNumber && manualNumber.trim()) {
        const cleaned = manualNumber.trim();
        // Enforce format MA. X, MA.-X, etc. supporting 1-6 digits
        if (!/^MA[\.\-\s]\s*\d{1,6}$/i.test(cleaned)) {
          return { success: false, error: `Invalid number format. Manual number must match format with MA prefix (e.g. MA. 1, MA. 01, MA. 001, or MA. 0001).` };
        }
        if (usedRegistry.has(cleaned)) {
          return { success: false, error: `Alumni number "${cleaned}" has already been assigned or reserved and can never be reused.` };
        }
        generatedNumber = cleaned;
      } else {
        // Safe automatic generator skipping any reserved/manual numbers
        let currentCounter = settings.nextAlumniNumber || 1;
        while (usedRegistry.has(this.formatAlumniNumber(currentCounter, settings.prefix || 'MA. ', settings.padDigits || 4))) {
          currentCounter++;
        }
        generatedNumber = this.formatAlumniNumber(currentCounter, settings.prefix || 'MA. ', settings.padDigits || 4);
        settings.nextAlumniNumber = currentCounter + 1;
      }

      // Mark permanently used
      usedRegistry.add(generatedNumber);
      settings.usedMANumbersRegistry = Array.from(usedRegistry);
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

      const alumniInternalId = `alumni-${Date.now()}`;
      const newProfile: AlumniProfile = {
        internalId: alumniInternalId,
        alumniNumber: generatedNumber,
        firstName: app.firstName,
        middleName: app.middleName,
        lastName: app.lastName,
        nickname: app.nickname,
        gender: app.gender,
        dateOfBirth: app.dateOfBirth,
        photoUrl: app.photoUrl,
        phone: app.phone,
        email: app.email,
        country: app.country,
        city: app.city,
        address: app.address,
        linkedIn: app.linkedIn,
        socialLink: app.socialLink,
        currentInstitution: app.currentInstitution,
        programme: app.programme,
        highestQualification: app.highestQualification,
        occupation: app.occupation,
        organisation: app.organisation,
        position: app.position,
        bio: app.bio,
        schoolHistory: app.schoolHistory,
        privacySettings: app.privacySettings,
        membershipStatus: 'ACTIVE',
        createdAt: app.submittedAt || now,
        updatedAt: now,
        verifiedAt: now,
        verifiedBy: adminEmail,
        applicationId: app.id,
      };

      alumniList.unshift(newProfile);
      safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(alumniList));

      // Update application
      const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
      const idx = apps.findIndex(a => a.id === applicationId);
      if (idx !== -1) {
        apps[idx].status = 'APPROVED';
        apps[idx].assignedAlumniNumber = generatedNumber;
        apps[idx].reviewedAt = now;
        apps[idx].reviewedBy = adminEmail;
        apps[idx].reviewNotes = notes || 'Verified and approved by MOSA administration.';
        apps[idx].updatedAt = now;
        safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      }

      // Create user login account for the approved alumnus
      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      if (!users.some(u => u.email.toLowerCase() === app.email.toLowerCase())) {
        users.push({
          uid: `user-${Date.now()}`,
          email: app.email,
          role: 'ALUMNI',
          displayName: `${app.firstName} ${app.lastName}`,
          alumniId: alumniInternalId,
          alumniNumber: generatedNumber,
        });
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // If chapter was selected, join chapter automatically
      if (app.selectedChapterId) {
        await this.joinChapter(app.selectedChapterId, newProfile);
      }

      // Record audit log
      await this.logAudit({
        action: 'APPLICATION_APPROVED',
        performedBy: adminEmail,
        affectedRecord: applicationId,
        metadata: {
          assignedAlumniNumber: generatedNumber,
          applicantName: `${app.firstName} ${app.lastName}`,
          alumniInternalId,
          notes,
          manualAssignment: !!manualNumber,
        },
      });

      await this.logAudit({
        action: 'MA_NUMBER_ASSIGNED',
        performedBy: adminEmail,
        affectedRecord: generatedNumber,
        metadata: {
          alumniNumber: generatedNumber,
          applicantName: `${app.firstName} ${app.lastName}`,
          applicationId,
        },
      });

      return { success: true, alumniNumber: generatedNumber };
    } catch (err: any) {
      console.error('Error in approving application:', err);
      return { success: false, error: err.message || 'Failed to approve application' };
    }
  },

  // ==========================================
  // PUBLIC ALUMNI VERIFICATION (Inspired by PLU Verification Desk)
  // ==========================================
  async verifyAlumnusByNumber(queryNumber: string): Promise<{
    found: boolean;
    verified: boolean;
    isValidMember?: boolean;
    alumnus?: AlumniProfile;
    alumniNumber?: string;
    fullName?: string;
    membershipStatus?: MembershipStatus;
    verifiedAt?: string;
    verifiedYear?: number;
    completionYear?: number;
    message?: string;
  }> {
    const raw = queryNumber.trim().toUpperCase();
    if (!raw) {
      return { found: false, verified: false, message: 'Please enter an alumni number.' };
    }

    const cleanDigits = raw.replace(/\D/g, '');
    const alumni = await this.getAlumniList();

    const match = alumni.find(a => {
      const aNum = a.alumniNumber.toUpperCase().trim();
      if (aNum === raw) return true;
      if (aNum.replace(/[\s\-\.]/g, '') === raw.replace(/[\s\-\.]/g, '')) return true;
      const aDigits = aNum.replace(/\D/g, '');
      if (cleanDigits && aDigits && cleanDigits === aDigits) return true;
      if (cleanDigits && aDigits && parseInt(cleanDigits, 10) === parseInt(aDigits, 10)) return true;
      return false;
    });

    if (!match) {
      return {
        found: false,
        verified: false,
        message: `No verified alumni record found matching "${queryNumber}". Please check the number or contact the MOSA Secretariat.`
      };
    }

    const isVerified = match.membershipStatus === 'ACTIVE' || match.membershipStatus === 'APPROVED';
    const completionYear = match.schoolHistory?.aLevel?.yearCompleted || match.schoolHistory?.oLevel?.yearCompleted;

    let message = '';
    if (isVerified) {
      message = `Official Verified Member of Mandela Old Students Association (MASSH, Est. 1997).`;
    } else if (match.membershipStatus === 'DISAPPROVED' || match.membershipStatus === 'REJECTED') {
      message = `Record located for ${match.alumniNumber}, but membership was DISAPPROVED by administration. ${match.disapprovalReason ? `Reason: ${match.disapprovalReason}` : ''}`;
    } else if (match.membershipStatus === 'SUSPENDED') {
      message = `Record located for ${match.alumniNumber}, but membership is currently SUSPENDED.`;
    } else {
      message = `Record located for ${match.alumniNumber}, but membership status is currently ${match.membershipStatus}.`;
    }

    return {
      found: true,
      verified: isVerified,
      isValidMember: isVerified,
      alumnus: match,
      alumniNumber: match.alumniNumber,
      fullName: match.fullName || [match.firstName, match.middleName, match.lastName].filter(Boolean).join(' '),
      membershipStatus: match.membershipStatus,
      verifiedAt: match.verifiedAt,
      verifiedYear: match.verifiedAt ? new Date(match.verifiedAt).getFullYear() : undefined,
      completionYear,
      message,
    };
  },

  // Alumni Directory & Profiles
  async getAlumniList(): Promise<AlumniProfile[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'alumni');
        const snap = await getDocs(query(colRef, orderBy('alumniNumber', 'asc')));
        const remoteList = snap.docs.map(d => d.data() as AlumniProfile);
        if (remoteList.length > 0) return remoteList;
      } catch (e) {
        console.warn('Firebase alumni fetch failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.ALUMNI);
    let list: AlumniProfile[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch {}
    }
    if (list.length === 0) {
      list = [...defaultSeedAlumni];
      safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(list));
    } else {
      let addedSeed = false;
      for (const seed of defaultSeedAlumni) {
        if (!list.some(a => a.internalId === seed.internalId || a.alumniNumber === seed.alumniNumber)) {
          list.push(seed);
          addedSeed = true;
        }
      }
      if (addedSeed) {
        safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(list));
      }
    }

    // Ensure all profiles have fullName populated
    list.forEach(a => {
      if (!a.fullName) {
        a.fullName = [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ');
      }
    });

    return list;
  },

  async getAlumniByNumber(alumniNumber: string): Promise<AlumniProfile | null> {
    const list = await this.getAlumniList();
    const cleanQuery = alumniNumber.trim().toUpperCase().replace(/\s+/g, ' ');
    return list.find(a => a.alumniNumber.toUpperCase().replace(/\s+/g, ' ') === cleanQuery) || null;
  },

  async getAlumniById(id: string): Promise<AlumniProfile | null> {
    const list = await this.getAlumniList();
    return list.find(a => a.internalId === id) || null;
  },

  async updateAlumniProfile(id: string, updates: Partial<AlumniProfile>, editorEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const list = await this.getAlumniList();
      const current = list.find(a => a.internalId === id);
      if (!current) return { success: false, error: 'Alumni record not found' };

      // Enforce Section 18 rule: Alumni cannot modify their alumniNumber, verifiedAt, or verifiedBy
      const safeUpdates: Partial<AlumniProfile> = {
        ...updates,
        internalId: current.internalId,
        alumniNumber: current.alumniNumber,
        verifiedAt: current.verifiedAt,
        verifiedBy: current.verifiedBy,
        updatedAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'alumni', id), safeUpdates);
      }

      const localList: AlumniProfile[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.ALUMNI) || '[]');
      const idx = localList.findIndex(a => a.internalId === id);
      if (idx !== -1) {
        localList[idx] = { ...localList[idx], ...safeUpdates };
        safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(localList));
      }

      await this.logAudit({
        action: 'ALUMNI_PROFILE_UPDATED',
        performedBy: editorEmail || current.email,
        affectedRecord: current.alumniNumber,
        metadata: { updatedFields: Object.keys(updates) },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Manual Membership Number Assignment by Admin
  async updateAlumniMembershipNumber(
    idOrNumber: string,
    newNumber: string,
    changedBy: string,
    reason?: string
  ): Promise<{ success: boolean; alumnus?: AlumniProfile; error?: string }> {
    try {
      const list = await this.getAlumniList();
      const normalize = (val: string) => val.replace(/[\s\-\.]/g, '').toUpperCase();
      const normTarget = normalize(idOrNumber);
      const alumnus = list.find(a => a.internalId === idOrNumber || normalize(a.alumniNumber) === normTarget);
      if (!alumnus) {
        return { success: false, error: `Alumni member not found for "${idOrNumber}".` };
      }

      const formattedNew = newNumber.trim();
      if (!formattedNew) {
        return { success: false, error: 'New membership number cannot be empty.' };
      }

      const normNew = normalize(formattedNew);

      // Check anti-collision against other members
      const collisionMember = list.find(a => 
        a.internalId !== alumnus.internalId && 
        normalize(a.alumniNumber) === normNew
      );
      if (collisionMember) {
        return { 
          success: false, 
          error: `Membership number "${formattedNew}" is already assigned to ${collisionMember.fullName || `${collisionMember.firstName} ${collisionMember.lastName}`} and cannot be reused.` 
        };
      }

      // Check anti-collision against used registry
      const settings = await this.getSystemSettings();
      const usedRegistryNorm = new Set((settings.usedMANumbersRegistry || []).map(normalize));
      usedRegistryNorm.delete(normalize(alumnus.alumniNumber));
      (alumnus.numberChangeHistory || []).forEach(h => {
        usedRegistryNorm.delete(normalize(h.previousNumber));
      });
      if (usedRegistryNorm.has(normNew)) {
        return {
          success: false,
          error: `Membership number "${formattedNew}" is already registered in the official MOSA number registry and cannot be assigned.`
        };
      }

      const previousNumber = alumnus.alumniNumber;
      const now = new Date().toISOString();

      // Update history
      const numberHistory = alumnus.numberChangeHistory || [];
      numberHistory.push({
        previousNumber,
        newNumber: formattedNew,
        changedAt: now,
        changedBy,
        reason: reason || 'Manual number assignment by administrator',
      });

      alumnus.alumniNumber = formattedNew;
      alumnus.numberChangeHistory = numberHistory;
      alumnus.updatedAt = now;

      // Update in storage
      const localList = await this.getAlumniList();
      const idx = localList.findIndex(a => a.internalId === alumnus.internalId);
      if (idx !== -1) {
        localList[idx] = alumnus;
        safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(localList));
      }
      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'alumni', alumnus.internalId), {
            alumniNumber: formattedNew,
            numberChangeHistory: numberHistory,
            updatedAt: now,
          });
        } catch (e) {
          console.warn('Firebase update failed:', e);
        }
      }

      // Register new number in permanent used numbers registry ledger (previous numbers remain permanently reserved)
      const usedSet = new Set((settings.usedMANumbersRegistry || []).map(n => n.trim().toUpperCase()));
      usedSet.add(previousNumber.trim().toUpperCase());
      usedSet.add(formattedNew.toUpperCase());
      settings.usedMANumbersRegistry = Array.from(usedSet);
      await this.updateSystemSettings({ usedMANumbersRegistry: settings.usedMANumbersRegistry });

      // Update AuthUser
      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const uIdx = users.findIndex(u => u.alumniId === alumnus.internalId || u.email.toLowerCase() === alumnus.email.toLowerCase());
      if (uIdx !== -1) {
        users[uIdx].alumniNumber = formattedNew;
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // Audit Log
      await this.logAudit({
        action: 'MEMBERSHIP_NUMBER_CHANGED',
        performedBy: changedBy,
        affectedRecord: formattedNew,
        metadata: {
          alumnusId: alumnus.internalId,
          alumnusName: `${alumnus.firstName} ${alumnus.lastName}`,
          previousNumber,
          newNumber: formattedNew,
          reason: reason || 'Manual administrative update',
        },
      });

      // Notification
      await this.sendNotification({
        alumniId: alumnus.internalId,
        title: 'Membership Number Updated',
        message: `Your MOSA membership number has been updated to ${formattedNew} by ${changedBy}. Reason: ${reason || 'Official administrative update'}.`,
        type: 'MEMBERSHIP',
        linkTab: 'my-profile'
      });

      return { success: true, alumnus };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update membership number' };
    }
  },

  // Status Management (ACTIVE/Approved, PENDING, DISAPPROVED, SUSPENDED)
  async updateMemberStatus(
    idOrNumber: string,
    newStatus: MembershipStatus,
    changedBy: string,
    reason?: string
  ): Promise<{ success: boolean; alumnus?: AlumniProfile; error?: string }> {
    try {
      const list = await this.getAlumniList();
      const normalize = (val: string) => val.replace(/[\s\-\.]/g, '').toUpperCase();
      const normTarget = normalize(idOrNumber);
      const alumnus = list.find(a => a.internalId === idOrNumber || normalize(a.alumniNumber) === normTarget);
      if (!alumnus) {
        return { success: false, error: `Alumni member not found for "${idOrNumber}".` };
      }

      const previousStatus = alumnus.membershipStatus;
      const now = new Date().toISOString();

      const statusHistory = alumnus.statusHistory || [];
      statusHistory.push({
        status: newStatus,
        changedAt: now,
        changedBy,
        reason: reason || `Status changed from ${previousStatus} to ${newStatus}`,
      });

      alumnus.membershipStatus = newStatus;
      alumnus.statusHistory = statusHistory;
      alumnus.updatedAt = now;

      if (newStatus === 'DISAPPROVED' || newStatus === 'REJECTED') {
        alumnus.disapprovalReason = reason || 'Disapproved by administration';
      } else if (newStatus === 'ACTIVE' || newStatus === 'APPROVED') {
        alumnus.disapprovalReason = undefined;
      }

      // Update in storage
      const localList = await this.getAlumniList();
      const idx = localList.findIndex(a => a.internalId === alumnus.internalId);
      if (idx !== -1) {
        localList[idx] = alumnus;
        safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(localList));
      }
      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'alumni', alumnus.internalId), {
            membershipStatus: newStatus,
            disapprovalReason: alumnus.disapprovalReason || null,
            statusHistory,
            updatedAt: now,
          });
        } catch (e) {
          console.warn('Firebase update failed:', e);
        }
      }

      // Update linked application if exists
      if (alumnus.applicationId) {
        const apps: AlumniApplication[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
        const appIdx = apps.findIndex(a => a.id === alumnus.applicationId);
        if (appIdx !== -1) {
          if (newStatus === 'DISAPPROVED' || newStatus === 'REJECTED') {
            apps[appIdx].status = 'REJECTED';
            apps[appIdx].reviewNotes = reason || 'Disapproved by administration';
          } else if (newStatus === 'ACTIVE' || newStatus === 'APPROVED') {
            apps[appIdx].status = 'APPROVED';
          } else if (newStatus === 'SUSPENDED') {
            apps[appIdx].status = 'SUSPENDED';
          }
          apps[appIdx].updatedAt = now;
          safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
        }
      }

      // Audit Log
      const isDisapproval = newStatus === 'DISAPPROVED' || newStatus === 'REJECTED';
      await this.logAudit({
        action: isDisapproval ? 'MEMBER_DISAPPROVED' : 'MEMBER_STATUS_CHANGED',
        performedBy: changedBy,
        affectedRecord: alumnus.alumniNumber,
        metadata: {
          alumnusId: alumnus.internalId,
          alumnusName: `${alumnus.firstName} ${alumnus.lastName}`,
          previousStatus,
          newStatus,
          reason: reason || (isDisapproval ? 'Administrative disapproval' : 'Status update'),
        },
      });

      // Notification
      await this.sendNotification({
        alumniId: alumnus.internalId,
        title: isDisapproval ? 'Membership Disapproved' : `Membership Status: ${newStatus}`,
        message: isDisapproval
          ? `Your MOSA membership status has been set to Disapproved by ${changedBy}. Reason: ${reason || 'Credentials not verified'}.`
          : `Your MOSA membership status is now ${newStatus}. ${reason ? `Note: ${reason}` : ''}`,
        type: 'MEMBERSHIP',
        linkTab: 'my-profile'
      });

      return { success: true, alumnus };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update member status' };
    }
  },

  // Admin Disapproval / Rejection Helper
  async disapproveAlumnus(
    idOrNumber: string,
    reason: string,
    adminEmail: string
  ): Promise<{ success: boolean; alumnus?: AlumniProfile; error?: string }> {
    return this.updateMemberStatus(idOrNumber, 'DISAPPROVED', adminEmail, reason);
  },

  // Powerful Alumni Search
  async searchAlumni(
    searchQuery: string,
    filters?: {
      level?: 'ALL' | 'O_LEVEL' | 'A_LEVEL' | 'BOTH';
      year?: string;
      campus?: string;
    }
  ): Promise<AlumniProfile[]> {
    const all = await this.getAlumniList();
    const q = searchQuery.trim().toLowerCase();

    return all.filter(alumnus => {
      // 1. Text Search (Includes Nickname, e.g. "Bulldozer")
      if (q) {
        const matchesNumber = alumnus.alumniNumber.toLowerCase().includes(q);
        const matchesName = `${alumnus.firstName} ${alumnus.middleName || ''} ${alumnus.lastName}`.toLowerCase().includes(q);
        const matchesNickname = alumnus.nickname ? alumnus.nickname.toLowerCase().includes(q) : false;
        const matchesOccupation = alumnus.occupation ? alumnus.occupation.toLowerCase().includes(q) : false;
        const matchesOrganisation = alumnus.organisation ? alumnus.organisation.toLowerCase().includes(q) : false;
        const matchesCity = alumnus.city ? alumnus.city.toLowerCase().includes(q) : false;
        const matchesCountry = alumnus.country ? alumnus.country.toLowerCase().includes(q) : false;
        const matchesOClass = alumnus.schoolHistory.oLevel ? `${alumnus.schoolHistory.oLevel.class} ${alumnus.schoolHistory.oLevel.stream}`.toLowerCase().includes(q) : false;
        const matchesAComb = alumnus.schoolHistory.aLevel ? `${alumnus.schoolHistory.aLevel.combination}`.toLowerCase().includes(q) : false;

        const matchesAny = matchesNumber || matchesName || matchesNickname || matchesOccupation || matchesOrganisation || matchesCity || matchesCountry || matchesOClass || matchesAComb;
        if (!matchesAny) return false;
      }

      // 2. Level filter
      if (filters?.level && filters.level !== 'ALL') {
        const hasO = alumnus.schoolHistory.attendedOLevel;
        const hasA = alumnus.schoolHistory.attendedALevel;
        if (filters.level === 'O_LEVEL' && !hasO) return false;
        if (filters.level === 'A_LEVEL' && !hasA) return false;
        if (filters.level === 'BOTH' && (!hasO || !hasA)) return false;
      }

      // 3. Year filter
      if (filters?.year) {
        const y = parseInt(filters.year, 10);
        const oMatch = alumnus.schoolHistory.oLevel && (alumnus.schoolHistory.oLevel.yearCompleted === y || alumnus.schoolHistory.oLevel.yearJoined === y);
        const aMatch = alumnus.schoolHistory.aLevel && (alumnus.schoolHistory.aLevel.yearCompleted === y || alumnus.schoolHistory.aLevel.yearJoined === y);
        if (!oMatch && !aMatch) return false;
      }

      // 4. Campus filter
      if (filters?.campus && filters.campus !== 'ALL') {
        const oCamp = alumnus.schoolHistory.oLevel?.campus;
        const aCamp = alumnus.schoolHistory.aLevel?.campus;
        if (oCamp !== filters.campus && aCamp !== filters.campus) return false;
      }

      return true;
    });
  },

  // Audit Logging
  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseConfigured() && db) {
      try {
        await addDoc(collection(db, 'audit_logs'), newLog);
      } catch (e) {
        console.warn('Failed to write audit log to Firebase:', e);
      }
    }

    const logs: AuditLog[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    logs.unshift(newLog);
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 300))); // Keep last 300
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
        return snap.docs.map(d => d.data() as AuditLog);
      } catch (e) {
        console.warn('Failed to read audit logs from Firebase:', e);
      }
    }
    return JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  },

  // Activity & Audit History Management Controls
  async deleteAuditLog(id: string, actorEmail: string): Promise<boolean> {
    const logs: AuditLog[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const target = logs.find(l => l.id === id);
    const updated = logs.filter(l => l.id !== id);
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'audit_logs', id));
      } catch (e) {
        console.warn('Failed to delete audit log in Firebase:', e);
      }
    }

    if (target) {
      await this.logAudit({
        action: 'AUDIT_LOG_DELETED',
        performedBy: actorEmail,
        affectedRecord: id,
        metadata: { deletedAction: target.action, deletedTarget: target.affectedRecord }
      });
    }
    return true;
  },

  async deleteAuditLogs(ids: string[], actorEmail: string): Promise<{ deletedCount: number }> {
    const idSet = new Set(ids);
    const logs: AuditLog[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const countBefore = logs.length;
    const updated = logs.filter(l => !idSet.has(l.id));
    const deletedCount = countBefore - updated.length;
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    if (isFirebaseConfigured() && db) {
      for (const id of ids) {
        try {
          await deleteDoc(doc(db, 'audit_logs', id));
        } catch (e) {
          console.warn('Firebase batch delete error:', e);
        }
      }
    }

    await this.logAudit({
      action: 'AUDIT_LOGS_BULK_DELETED',
      performedBy: actorEmail,
      affectedRecord: `BATCH_${ids.length}_RECORDS`,
      metadata: { deletedCount, requestedCount: ids.length }
    });

    return { deletedCount };
  },

  async pruneAuditLogs(actorEmail: string, olderThanDays?: number, actionType?: string): Promise<{ deletedCount: number }> {
    const logs: AuditLog[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const countBefore = logs.length;
    const now = Date.now();

    const updated = logs.filter(l => {
      // Check action filter
      if (actionType && actionType !== 'ALL' && l.action !== actionType) {
        return true; // Keep
      }
      // Check date filter
      if (olderThanDays !== undefined && olderThanDays > 0) {
        const logTime = new Date(l.timestamp).getTime();
        const ageInDays = (now - logTime) / (1000 * 60 * 60 * 24);
        if (ageInDays > olderThanDays) {
          return false; // Prune (delete)
        }
        return true; // Keep
      }
      // If olderThanDays is 0 or undefined, delete matching records
      return false;
    });

    const deletedCount = countBefore - updated.length;
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    await this.logAudit({
      action: 'AUDIT_LOGS_PRUNED',
      performedBy: actorEmail,
      affectedRecord: `PRUNED_${deletedCount}_RECORDS`,
      metadata: { deletedCount, olderThanDays, actionType }
    });

    return { deletedCount };
  },

  exportAuditLogs(format: 'csv' | 'json', logsToExport?: AuditLog[]): string {
    const logs: AuditLog[] = logsToExport || JSON.parse(safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    // CSV export
    const headers = ['ID', 'Timestamp', 'Action', 'Performed By', 'Affected Record', 'Metadata'];
    const rows = logs.map((l: AuditLog) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.performedBy}"`,
      `"${(l.affectedRecord || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
  },

  // Purge all residual test and demo entries to establish clean production baseline
  async purgeDemoData(actorEmail = 'admin@massh.ac.ug'): Promise<{ success: boolean; message: string }> {
    safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.EVENT_ATTENDANCE, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.LEGACY_ALUMNI, JSON.stringify([]));
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultSeedUsers));
    safeStorage.removeItem(STORAGE_KEYS.CREDENTIALS);

    await this.logAudit({
      action: 'SYSTEM_PURGE_DEMO_DATA',
      performedBy: actorEmail,
      affectedRecord: 'ALL_MODULES_RESET_TO_BASELINE',
      metadata: { timestamp: new Date().toISOString(), cleanBaseline: true }
    });

    return { success: true, message: 'All test and demo entries have been successfully purged. System baseline reset.' };
  },

  // Settings
  async getSystemSettings(): Promise<SystemSettings> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'system'));
        if (snap.exists()) {
          return snap.data() as SystemSettings;
        }
      } catch (e) {
        console.warn('Failed to get settings from Firebase:', e);
      }
    }
    return JSON.parse(safeStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(defaultSettings));
  },

  async updateSystemSettings(updates: Partial<SystemSettings>): Promise<{ success: boolean; settings?: SystemSettings; error?: string }> {
    try {
      const current = await this.getSystemSettings();

      // Validate nextAlumniNumber if specified
      if (updates.nextAlumniNumber !== undefined) {
        const nextNum = Number(updates.nextAlumniNumber);
        if (isNaN(nextNum) || nextNum < 1) {
          return { success: false, error: 'Next allocation sequence number must be a valid positive integer.' };
        }

        const prefix = updates.prefix || current.prefix || 'MA. ';
        const pad = updates.padDigits || current.padDigits || 4;
        const candidateFormatted = this.formatAlumniNumber(nextNum, prefix, pad);
        
        // Check collision against permanent ledger
        const usedRegistry = (current.usedMANumbersRegistry || []).map(n => this.normalizeAlumniNumber(n));
        const alumniList = await this.getAlumniList();
        const activeNumbers = alumniList.map(a => this.normalizeAlumniNumber(a.alumniNumber));
        
        const normCandidate = this.normalizeAlumniNumber(candidateFormatted);
        if (usedRegistry.includes(normCandidate) || activeNumbers.includes(normCandidate)) {
          return {
            success: false,
            error: `Starting number "${candidateFormatted}" has already been allocated in this sequence. Please choose a starting number that does not conflict with existing records.`
          };
        }
      }

      const updated: SystemSettings = { ...current, ...updates };
      if (isFirebaseConfigured() && db) {
        try {
          await setDoc(doc(db, 'settings', 'system'), updated, { merge: true });
        } catch (e) {
          console.warn('Failed to update settings in Firebase:', e);
        }
      }
      safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return { success: true, settings: updated };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // CREDENTIAL & PASSWORD MANAGEMENT
  getUserCredentials(): Record<string, { email: string; password: string; role: UserRole; displayName: string; alumniId?: string; alumniNumber?: string; updatedAt: string }> {
    const raw = safeStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    // Seed initial credentials
    const seeded: Record<string, any> = {
      'admin@massh.ac.ug': {
        email: 'admin@massh.ac.ug',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        displayName: 'Head of ICT / MOSA Admin',
        updatedAt: new Date().toISOString()
      },
      'superadmin@mosa.org': {
        email: 'superadmin@mosa.org',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        displayName: 'Executive Super Admin',
        updatedAt: new Date().toISOString()
      },
      'secretary@massh.ac.ug': {
        email: 'secretary@massh.ac.ug',
        password: 'admin123',
        role: 'SECRETARY',
        displayName: 'MOSA Secretary General',
        updatedAt: new Date().toISOString()
      },
      'treasurer@massh.ac.ug': {
        email: 'treasurer@massh.ac.ug',
        password: 'admin123',
        role: 'TREASURER',
        displayName: 'MOSA Honorary Treasurer',
        updatedAt: new Date().toISOString()
      },
      'publicity@massh.ac.ug': {
        email: 'publicity@massh.ac.ug',
        password: 'admin123',
        role: 'PUBLICITY',
        displayName: 'MOSA Publicity Secretary',
        updatedAt: new Date().toISOString()
      }
    };
    safeStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(seeded));
    return seeded;
  },

  saveUserCredential(cred: { email: string; password: string; role: UserRole; displayName: string; alumniId?: string; alumniNumber?: string }) {
    const all = this.getUserCredentials();
    all[cred.email.toLowerCase()] = {
      ...cred,
      email: cred.email.toLowerCase(),
      updatedAt: new Date().toISOString()
    };
    safeStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(all));
  },

  async checkEmailStatus(email: string): Promise<{ 
    found: boolean; 
    isAlumnus: boolean; 
    isAdmin: boolean; 
    hasPassword: boolean; 
    alumnus?: AlumniProfile; 
    displayName?: string;
    alumniNumber?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { found: false, isAlumnus: false, isAdmin: false, hasPassword: false };
    }

    const creds = this.getUserCredentials();
    const cred = creds[cleanEmail];

    // Check admin / staff accounts
    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));
    const matchedAdmin = users.find(u => u.email?.toLowerCase() === cleanEmail);

    if (matchedAdmin || cleanEmail === 'admin@massh.ac.ug') {
      return {
        found: true,
        isAlumnus: false,
        isAdmin: true,
        hasPassword: !!cred?.password,
        displayName: matchedAdmin?.displayName || 'MOSA Administrator'
      };
    }

    // Check alumni registry
    const alumniList = await this.getAlumniList();
    const alumnus = alumniList.find(a => !!a.email && a.email.toLowerCase() === cleanEmail);

    if (alumnus) {
      return {
        found: true,
        isAlumnus: true,
        isAdmin: false,
        hasPassword: !!cred?.password,
        alumnus,
        displayName: `${alumnus.firstName} ${alumnus.lastName}`,
        alumniNumber: alumnus.alumniNumber
      };
    }

    return { found: false, isAlumnus: false, isAdmin: false, hasPassword: false };
  },

  async createAlumniPassword(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const alumniList = await this.getAlumniList();
    const alumnus = alumniList.find(a => !!a.email && a.email.toLowerCase() === cleanEmail);

    if (!alumnus) {
      return { 
        success: false, 
        error: `No registered alumnus found with email "${cleanEmail}". Please register first in the Alumni Registry.` 
      };
    }

    // Save linked credential permanently
    const displayName = `${alumnus.firstName} ${alumnus.lastName}`;
    this.saveUserCredential({
      email: cleanEmail,
      password: password,
      role: 'ALUMNI',
      displayName,
      alumniId: alumnus.internalId,
      alumniNumber: alumnus.alumniNumber
    });

    // Mark account activated in alumni registry
    alumnus.accountActivated = true;
    alumnus.updatedAt = new Date().toISOString();
    safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(alumniList));

    const alumniUser: AuthUser = {
      uid: `user-${alumnus.internalId}`,
      email: alumnus.email,
      role: 'ALUMNI',
      displayName,
      alumniId: alumnus.internalId,
      alumniNumber: alumnus.alumniNumber,
      photoUrl: alumnus.photoUrl,
      phone: alumnus.phone,
    };
    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(alumniUser));

    await this.logAudit({
      action: 'PASSWORD_CREATED',
      performedBy: alumniUser.email,
      affectedRecord: alumniUser.uid,
      metadata: { role: 'ALUMNI', alumniNumber: alumnus.alumniNumber, action: 'Permanent password linked to email' },
    });

    return { success: true, user: alumniUser };
  },

  // OTP-based Email Verification to prevent fake email registration
  async sendRegistrationOtp(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const creds = this.getUserCredentials();
    if (creds[cleanEmail]) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    // Generate secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save locally
    const otps = JSON.parse(safeStorage.getItem('mosa_registration_otps') || '{}');
    otps[cleanEmail] = { code, expiresAt };
    safeStorage.setItem('mosa_registration_otps', JSON.stringify(otps));

    // Save to Firestore if configured
    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'email_verifications', cleanEmail), {
          code,
          expiresAt,
          createdAt: Date.now()
        });
      } catch (err) {
        console.warn('Firestore email_verifications write fallback:', err);
      }
    }

    // Dispatch real email via official emailService
    try {
      await emailService.sendVerificationEmail(cleanEmail, code);
    } catch (mailErr) {
      console.warn('Email dispatch warning:', mailErr);
    }

    // Try sending verification code email via Firebase if available
    if (isFirebaseConfigured() && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (err) {
        // Silent catch
      }
    }

    return { success: true, code };
  },

  async verifyRegistrationOtp(email: string, inputCode: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = inputCode.trim();

    if (!cleanCode) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    // Check Firestore first if configured
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, 'email_verifications', cleanEmail));
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.code === cleanCode) {
            if (Date.now() > (data.expiresAt || 0)) {
              return { success: false, error: 'Verification code has expired. Please request a new code.' };
            }
            return { success: true };
          }
        }
      } catch (err) {
        console.warn('Firestore email verification check fallback:', err);
      }
    }

    // Fallback to local storage
    const otps = JSON.parse(safeStorage.getItem('mosa_registration_otps') || '{}');
    const record = otps[cleanEmail];
    if (!record) {
      return { success: false, error: 'No verification code was sent for this email. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (record.code !== cleanCode) {
      return { success: false, error: 'Invalid verification code. Please check your email and enter the correct 6-digit code.' };
    }

    return { success: true };
  },

  // Account Creation (Phase 2 Auth Gate)
  async createAccount(
    email: string,
    password: string,
    otpCode?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Verify OTP if supplied or check recorded verification
    if (otpCode) {
      const otpCheck = await this.verifyRegistrationOtp(cleanEmail, otpCode);
      if (!otpCheck.success) {
        return { success: false, error: otpCheck.error || 'Email verification failed.' };
      }
    }

    const creds = this.getUserCredentials();
    if (creds[cleanEmail]) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    // Try Firebase Authentication if configured
    let firebaseUid = '';
    if (isFirebaseConfigured() && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        firebaseUid = userCredential.user?.uid || '';
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          return { success: false, error: 'An account with this email address already exists. Please log in.' };
        }
        if (err.code === 'auth/weak-password') {
          return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
        }
        console.warn('Firebase user creation failed, fallback to local:', err);
      }
    }

    // Check if email matches an existing alumnus record in the registry
    const alumniList = await this.getAlumniList();
    const existingAlumnus = alumniList.find(a => !!a.email && a.email.toLowerCase() === cleanEmail);

    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));

    const newUser: AuthUser = {
      uid: firebaseUid || `usr-${Date.now()}`,
      email: cleanEmail,
      role: existingAlumnus ? 'ALUMNI' : 'USER',
      displayName: existingAlumnus ? (existingAlumnus.fullName || `${existingAlumnus.firstName} ${existingAlumnus.lastName}`.trim()) : '',
      alumniId: existingAlumnus?.internalId,
      alumniNumber: existingAlumnus?.alumniNumber,
      photoUrl: existingAlumnus?.photoUrl,
      phone: existingAlumnus?.phone,
      alumniOnboardingDecision: existingAlumnus ? 'COMPLETED' : 'PENDING',
    };

    // Save to users list
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      users[existingIdx] = { ...users[existingIdx], ...newUser };
    } else {
      users.push(newUser);
    }
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Save credentials (secured store)
    this.saveUserCredential({
      email: cleanEmail,
      password: password,
      role: newUser.role,
      displayName: newUser.displayName,
      alumniId: newUser.alumniId,
      alumniNumber: newUser.alumniNumber,
    });

    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

    await this.logAudit({
      action: 'USER_REGISTERED',
      performedBy: cleanEmail,
      affectedRecord: newUser.uid,
      metadata: { role: newUser.role, onboardingDecision: newUser.alumniOnboardingDecision },
    });

    return { success: true, user: newUser };
  },

  async skipAlumniOnboarding(userId: string): Promise<void> {
    const user = this.getCurrentUser();
    if (user && (user.uid === userId || !userId)) {
      user.alumniOnboardingDecision = 'SKIPPED';
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const idx = users.findIndex(u => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
      if (idx !== -1) {
        users[idx].alumniOnboardingDecision = 'SKIPPED';
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }
  },

  async completeAlumniOnboarding(userId: string, alumniId?: string, alumniNumber?: string): Promise<void> {
    const user = this.getCurrentUser();
    if (user && (user.uid === userId || !userId)) {
      user.alumniOnboardingDecision = 'COMPLETED';
      if (alumniId) user.alumniId = alumniId;
      if (alumniNumber) {
        user.alumniNumber = alumniNumber;
        user.role = 'ALUMNI';
      }
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const idx = users.findIndex(u => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
      if (idx !== -1) {
        users[idx].alumniOnboardingDecision = 'COMPLETED';
        if (alumniId) users[idx].alumniId = alumniId;
        if (alumniNumber) {
          users[idx].alumniNumber = alumniNumber;
          users[idx].role = 'ALUMNI';
        }
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (isFirebaseConfigured() && auth && cleanEmail) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (err) {
        console.warn('Firebase sendPasswordResetEmail error:', err);
      }
    }
    return {
      success: true,
      message: 'If an account exists for this email address, password reset instructions have been dispatched.'
    };
  },

  async getApplicationByEmail(email: string): Promise<AlumniApplication | null> {
    const cleanEmail = email.trim().toLowerCase();
    const apps = await this.getApplications();
    return apps.find(a => a.email.toLowerCase() === cleanEmail) || null;
  },

  // Enhanced Login with separate Admin & Member Password protection
  async login(
    email: string, 
    password?: string, 
    portal: 'alumni' | 'admin' = 'alumni'
  ): Promise<{ 
    success: boolean; 
    user?: AuthUser; 
    error?: string; 
    needsPasswordCreation?: boolean;
    alumnusName?: string;
    alumniNumber?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const creds = this.getUserCredentials();
    const userCred = creds[cleanEmail];

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }

    // ----------------------------------------------------
    // PORTAL 1: ADMINISTRATIVE SIGN IN
    // ----------------------------------------------------
    if (portal === 'admin') {
      // Check lockout status
      const lockouts: Record<string, { failedAttempts: number; lockedUntil?: number }> = 
        JSON.parse(safeStorage.getItem(STORAGE_KEYS.ADMIN_LOCKOUTS) || '{}');
      const accountLockout = lockouts[cleanEmail];
      const now = Date.now();

      if (accountLockout?.lockedUntil && accountLockout.lockedUntil > now) {
        const remainingMinutes = Math.ceil((accountLockout.lockedUntil - now) / 60000);
        return { 
          success: false, 
          error: `Administrative account temporarily locked due to excessive failed attempts. Please wait ${remainingMinutes} minute(s) before retrying.` 
        };
      }

      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));
      const matchedAdmin = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

      const isRecognizedAdmin = matchedAdmin || cleanEmail === 'admin@massh.ac.ug' || cleanEmail === 'superadmin@mosa.org';
      if (!isRecognizedAdmin) {
        return { 
          success: false, 
          error: 'This email is not authorized for administrative access. Please use Member Sign In.' 
        };
      }

      if (matchedAdmin && matchedAdmin.active === false) {
        return { success: false, error: 'This administrative account has been deactivated.' };
      }

      // Check Admin Password
      const expectedPassword = userCred?.password || 'admin123';
      if (!password || password !== expectedPassword) {
        const failedAttempts = (accountLockout?.failedAttempts || 0) + 1;
        const isLocked = failedAttempts >= 5;
        lockouts[cleanEmail] = {
          failedAttempts,
          lockedUntil: isLocked ? now + 5 * 60 * 1000 : undefined,
        };
        safeStorage.setItem(STORAGE_KEYS.ADMIN_LOCKOUTS, JSON.stringify(lockouts));

        if (isLocked) {
          return {
            success: false,
            error: 'Administrative account locked for 5 minutes due to 5 consecutive failed login attempts.'
          };
        }

        return { 
          success: false, 
          error: `Incorrect administrator password. (Attempt ${failedAttempts} of 5 before security lockout)` 
        };
      }

      // Successful login clears failed attempt counters
      if (lockouts[cleanEmail]) {
        delete lockouts[cleanEmail];
        safeStorage.setItem(STORAGE_KEYS.ADMIN_LOCKOUTS, JSON.stringify(lockouts));
      }

      const isInitialPassword = !userCred?.password || userCred.password === 'admin123';
      const adminUser: AuthUser = {
        ...(matchedAdmin || {
          uid: cleanEmail === 'superadmin@mosa.org' ? 'admin-super-02' : 'admin-super-01',
          email: cleanEmail,
          role: 'SUPER_ADMIN',
          displayName: cleanEmail === 'superadmin@mosa.org' ? 'Executive Super Admin' : 'Head of ICT / MOSA Admin',
        }),
        mustChangePassword: matchedAdmin?.mustChangePassword ?? isInitialPassword
      };

      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
      await this.logAudit({
        action: 'ADMIN_LOGIN',
        performedBy: adminUser.email,
        affectedRecord: adminUser.uid,
        metadata: { role: adminUser.role, mustChangePassword: adminUser.mustChangePassword },
      });

      return { success: true, user: adminUser };
    }

    // ----------------------------------------------------
    // PORTAL 2: ALUMNI & MEMBER SIGN IN
    // ----------------------------------------------------
    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let matchedUser = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      const alumniList = await this.getAlumniList();
      const matchedAlumnus = alumniList.find(a => a.email && a.email.toLowerCase() === cleanEmail);
      if (matchedAlumnus) {
        matchedUser = {
          uid: matchedAlumnus.internalId,
          email: matchedAlumnus.email,
          displayName: matchedAlumnus.fullName || cleanEmail,
          role: 'ALUMNI',
          alumniId: matchedAlumnus.internalId,
          alumniNumber: matchedAlumnus.alumniNumber,
        };
      }
    }

    if (!matchedUser) {
      const app = await this.getApplicationByEmail(cleanEmail);
      if (app) {
        return {
          success: false,
          error: `Your application (${(app as any).applicationNumber || app.id || 'Pending'}) is currently under Secretariat review. You will receive an email once approved.`,
        };
      }
      return {
        success: false,
        error: 'No registered member account was found with this email address. Please register or verify your credentials.',
      };
    }

    if (userCred?.password) {
      if (!password || password !== userCred.password) {
        return { success: false, error: 'Incorrect member password. Please check your credentials.' };
      }
    }

    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matchedUser));
    await this.logAudit({
      action: 'MEMBER_LOGIN',
      performedBy: matchedUser.email,
      affectedRecord: matchedUser.uid,
      metadata: { role: matchedUser.role, alumniNumber: matchedUser.alumniNumber },
    });

    return { 
      success: true, 
      user: matchedUser,
      alumnusName: matchedUser.displayName,
      alumniNumber: matchedUser.alumniNumber,
    };
  },
  // ----------------------------------------------------
  // DEDICATED PASSWORD-ONLY ADMIN & SUPER ADMIN ACCESS
  // ----------------------------------------------------
  getAdminPasswords(): { adminPass: string; superAdminPass: string } {
    const raw = safeStorage.getItem('mosa_admin_passwords');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          adminPass: parsed.adminPass || 'admin123',
          superAdminPass: parsed.superAdminPass || 'superadmin123',
        };
      } catch {}
    }
    return {
      adminPass: 'admin123',
      superAdminPass: 'superadmin123',
    };
  },

  setAdminPasswords(passwords: { adminPass?: string; superAdminPass?: string }): void {
    const current = this.getAdminPasswords();
    const updated = {
      adminPass: passwords.adminPass?.trim() || current.adminPass,
      superAdminPass: passwords.superAdminPass?.trim() || current.superAdminPass,
    };
    safeStorage.setItem('mosa_admin_passwords', JSON.stringify(updated));
  },

  async verifyAdminPasswordOnly(password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const { adminPass, superAdminPass } = this.getAdminPasswords();
    const input = password ? password.trim() : '';

    if (!input) {
      return { success: false, error: 'Please enter the administrative password.' };
    }

    // Direct Super Admin Password entry
    if (input === superAdminPass) {
      const superUser: AuthUser = {
        uid: 'superadmin-master',
        email: 'superadmin@massh.ac.ug',
        displayName: 'Executive Super Admin',
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
      };
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(superUser));
      await this.logAudit({
        action: 'SUPER_ADMIN_LOGIN',
        performedBy: 'superadmin@massh.ac.ug',
        affectedRecord: 'superadmin-master',
        metadata: { role: 'SUPER_ADMIN' },
      });
      return { success: true, user: superUser };
    }

    // Standard Executive Admin Password entry
    if (input === adminPass) {
      const adminUser: AuthUser = {
        uid: 'admin-exec',
        email: 'admin@massh.ac.ug',
        displayName: 'Executive Administrator',
        role: 'ADMIN',
        mustChangePassword: false,
      };
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
      await this.logAudit({
        action: 'ADMIN_LOGIN',
        performedBy: 'admin@massh.ac.ug',
        affectedRecord: 'admin-exec',
        metadata: { role: 'ADMIN' },
      });
      return { success: true, user: adminUser };
    }

    return { 
      success: false, 
      error: 'Incorrect administrator password. Please check and try again.' 
    };
  },

  async elevateToSuperAdmin(password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const { superAdminPass } = this.getAdminPasswords();
    const input = password ? password.trim() : '';

    if (!input) {
      return { success: false, error: 'Please enter the Super Admin password.' };
    }

    if (input !== superAdminPass) {
      return { success: false, error: 'Invalid Super Admin password. Elevation denied.' };
    }

    const current = this.getCurrentUser();
    const elevatedUser: AuthUser = {
      ...(current || {
        uid: 'superadmin-master',
        email: 'superadmin@massh.ac.ug',
      }),
      displayName: current?.displayName || 'Executive Super Admin',
      role: 'SUPER_ADMIN',
      mustChangePassword: false,
    };

    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(elevatedUser));
    await this.logAudit({
      action: 'ELEVATE_SUPER_ADMIN',
      performedBy: elevatedUser.email,
      affectedRecord: elevatedUser.uid,
      metadata: { role: 'SUPER_ADMIN' },
    });

    return { success: true, user: elevatedUser };
  },

  async downgradeToStandardAdmin(): Promise<{ success: boolean; user: AuthUser }> {
    const current = this.getCurrentUser();
    const downgradedUser: AuthUser = {
      ...(current || {
        uid: 'admin-exec',
        email: 'admin@massh.ac.ug',
      }),
      displayName: 'Executive Administrator',
      role: 'ADMIN',
      mustChangePassword: false,
    };

    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(downgradedUser));
    await this.logAudit({
      action: 'DOWNGRADE_TO_ADMIN',
      performedBy: downgradedUser.email,
      affectedRecord: downgradedUser.uid,
      metadata: { role: 'ADMIN' },
    });

    return { success: true, user: downgradedUser };
  },

  async setAdminPassword(newPassword: string, adminEmail = 'admin@massh.ac.ug'): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Admin password must be at least 4 characters long.' };
    }
    const creds = this.getUserCredentials();
    creds[adminEmail.toLowerCase()] = {
      ...(creds[adminEmail.toLowerCase()] || {}),
      email: adminEmail.toLowerCase(),
      password: newPassword,
      role: 'SUPER_ADMIN',
      displayName: 'Head of ICT / MOSA Admin',
      updatedAt: new Date().toISOString()
    };
    safeStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
    await this.logAudit({
      action: 'ADMIN_PASSWORD_UPDATED',
      performedBy: adminEmail,
      affectedRecord: 'admin-password',
      metadata: { action: 'Admin password updated' }
    });
    return { success: true };
  },

  getCurrentUser(): AuthUser | null {
    const raw = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout(): void {
    const cur = this.getCurrentUser();
    if (cur) {
      this.logAudit({
        action: 'USER_LOGOUT',
        performedBy: cur.email,
        affectedRecord: cur.uid,
      });
    }
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // CHAPTER MANAGEMENT (Phase 3)
  async getChapters(statusFilter?: ChapterStatus): Promise<Chapter[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'chapters');
        const q = statusFilter
          ? query(colRef, where('status', '==', statusFilter), orderBy('name', 'asc'))
          : query(colRef, orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Chapter);
      } catch (e) {
        console.warn('Firebase read chapters failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.CHAPTERS);
    let chapters: Chapter[] = [];
    if (raw) {
      try { chapters = JSON.parse(raw); } catch {}
    }
    if (chapters.length === 0 || !chapters.some(c => c.code === 'MUMASA')) {
      const existingIds = new Set(chapters.map(c => c.id));
      const missing = defaultSeedChapters.filter(c => !existingIds.has(c.id));
      chapters = [...chapters, ...missing];
      if (chapters.length === 0) {
        chapters = [...defaultSeedChapters];
      }
      safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
    }
    if (statusFilter) {
      return chapters.filter(c => c.status === statusFilter);
    }
    return chapters;
  },

  async getChapterById(id: string): Promise<Chapter | null> {
    const chapters = await this.getChapters();
    return chapters.find(c => c.id === id) || null;
  },

  async createChapter(
    chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const id = `chap-${Date.now()}`;
      const newChapter: Chapter = {
        ...chapterData,
        id,
        memberCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'chapters', id), newChapter);
      }

      const chapters = await this.getChapters();
      chapters.push(newChapter);
      safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));

      await this.logAudit({
        action: 'CHAPTER_CREATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { chapterName: newChapter.name, code: newChapter.code, institution: newChapter.institution },
      });

      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create chapter' };
    }
  },

  async updateChapter(
    id: string,
    updates: Partial<Chapter>,
    editorEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      const chapters = await this.getChapters();
      const idx = chapters.findIndex(c => c.id === id);
      if (idx === -1) return { success: false, error: 'Chapter not found' };

      const updatedChapter = { ...chapters[idx], ...updates, updatedAt: now };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'chapters', id), updatedChapter);
      }

      chapters[idx] = updatedChapter;
      safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));

      await this.logAudit({
        action: 'CHAPTER_UPDATED',
        performedBy: editorEmail,
        affectedRecord: id,
        metadata: { updatedFields: Object.keys(updates) },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async toggleChapterStatus(id: string, status: ChapterStatus, editorEmail = 'admin@massh.ac.ug'): Promise<void> {
    await this.updateChapter(id, { status }, editorEmail);
  },

  async getChapterMembers(chapterId: string): Promise<ChapterMember[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'chapter_members');
        const q = query(colRef, where('chapterId', '==', chapterId), where('status', '==', 'ACTIVE'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as ChapterMember);
      } catch (e) {
        console.warn('Firebase get chapter members failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS);
    let members: ChapterMember[] = [];
    if (raw) {
      try { members = JSON.parse(raw); } catch {}
    }
    if (members.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify(defaultSeedChapterMembers));
      members = [...defaultSeedChapterMembers];
    }
    return members.filter(m => m.chapterId === chapterId && m.status === 'ACTIVE');
  },

  async getAlumnusChapters(alumniId: string): Promise<Chapter[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS);
    let members: ChapterMember[] = [];
    if (raw) {
      try { members = JSON.parse(raw); } catch {}
    }
    if (members.length === 0) {
      members = defaultSeedChapterMembers;
    }
    const myChapterIds = members
      .filter(m => m.alumniId === alumniId && m.status === 'ACTIVE')
      .map(m => m.chapterId);
    
    const allChapters = await this.getChapters();
    return allChapters.filter(c => myChapterIds.includes(c.id));
  },

  async joinChapter(chapterId: string, alumnus: AlumniProfile): Promise<{ success: boolean; error?: string }> {
    try {
      const chapter = await this.getChapterById(chapterId);
      if (!chapter) return { success: false, error: 'Chapter not found' };
      if (chapter.status !== 'ACTIVE') return { success: false, error: 'Cannot join an inactive chapter' };

      const raw = safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS);
      let members: ChapterMember[] = [];
      if (raw) {
        try { members = JSON.parse(raw); } catch {}
      }
      if (members.length === 0) {
        members = [...defaultSeedChapterMembers];
      }

      // Check if already an active member
      const existing = members.find(m => m.chapterId === chapterId && m.alumniId === alumnus.internalId && m.status === 'ACTIVE');
      if (existing) {
        return { success: false, error: 'You are already an active member of this chapter' };
      }

      const newMember: ChapterMember = {
        id: `cm-${Date.now()}`,
        chapterId,
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        alumniName: `${alumnus.firstName} ${alumnus.lastName}`,
        alumniEmail: alumnus.email,
        roleInChapter: 'MEMBER',
        joinedAt: new Date().toISOString(),
        status: 'ACTIVE',
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'chapter_members', newMember.id), newMember);
      }

      members.push(newMember);
      safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify(members));

      // Update chapter member count
      const updatedCount = members.filter(m => m.chapterId === chapterId && m.status === 'ACTIVE').length;
      await this.updateChapter(chapterId, { memberCount: updatedCount }, alumnus.email);

      await this.logAudit({
        action: 'CHAPTER_MEMBER_JOINED',
        performedBy: alumnus.email,
        affectedRecord: chapterId,
        metadata: {
          alumnusName: `${alumnus.firstName} ${alumnus.lastName}`,
          alumniNumber: alumnus.alumniNumber,
          chapterName: chapter.name,
        },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to join chapter' };
    }
  },

  async leaveChapter(chapterId: string, alumniId: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS);
      let members: ChapterMember[] = [];
      if (raw) {
        try { members = JSON.parse(raw); } catch {}
      }

      const idx = members.findIndex(m => m.chapterId === chapterId && m.alumniId === alumniId && m.status === 'ACTIVE');
      if (idx === -1) return { success: false, error: 'Membership record not found' };

      members[idx].status = 'FORMER';
      safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify(members));

      const updatedCount = members.filter(m => m.chapterId === chapterId && m.status === 'ACTIVE').length;
      await this.updateChapter(chapterId, { memberCount: updatedCount }, userEmail || 'system');

      await this.logAudit({
        action: 'CHAPTER_MEMBER_LEFT',
        performedBy: userEmail || alumniId,
        affectedRecord: chapterId,
        metadata: { alumniId },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async assignChapterAdmin(
    chapterId: string,
    adminEmailToAssign: string,
    performingAdminEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const chapter = await this.getChapterById(chapterId);
      if (!chapter) return { success: false, error: 'Chapter not found' };

      const cleanEmail = adminEmailToAssign.trim().toLowerCase();
      const currentAdmins = chapter.adminEmails || [];
      if (currentAdmins.map(e => e.toLowerCase()).includes(cleanEmail)) {
        return { success: false, error: `${adminEmailToAssign} is already an administrator for this chapter` };
      }

      const updatedAdmins = [...currentAdmins, cleanEmail];
      await this.updateChapter(chapterId, { adminEmails: updatedAdmins }, performingAdminEmail);

      // Also elevate user role in users collection to CHAPTER_ADMIN if currently ALUMNI
      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const userIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (userIdx !== -1 && users[userIdx].role === 'ALUMNI') {
        users[userIdx].role = 'CHAPTER_ADMIN';
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      await this.logAudit({
        action: 'CHAPTER_ADMIN_ASSIGNED',
        performedBy: performingAdminEmail,
        affectedRecord: chapterId,
        metadata: { assignedAdmin: cleanEmail, chapterCode: chapter.code },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // EVENT MANAGEMENT & ATTENDANCE (Phase 4)
  async getEvents(statusFilter?: EventStatus, typeFilter?: EventType): Promise<MOSAEvent[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'events');
        const q = statusFilter
          ? query(colRef, where('status', '==', statusFilter), orderBy('date', 'asc'))
          : query(colRef, orderBy('date', 'asc'));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data() as MOSAEvent);
        if (typeFilter) return docs.filter(e => e.eventType === typeFilter);
        return docs;
      } catch (e) {
        console.warn('Firebase read events failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.EVENTS);
    let events: MOSAEvent[] = [];
    if (raw) {
      try { events = JSON.parse(raw); } catch {}
    }
    if (events.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(defaultSeedEvents));
      events = [...defaultSeedEvents];
    }
    return events.filter(e => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (typeFilter && e.eventType !== typeFilter) return false;
      return true;
    });
  },

  async getEventById(id: string): Promise<MOSAEvent | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
  },

  async createEvent(
    eventData: Omit<MOSAEvent, 'id' | 'createdAt' | 'updatedAt' | 'registeredCount' | 'attendedCount'>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const id = `evt-${Date.now()}`;
      const newEvent: MOSAEvent = {
        ...eventData,
        id,
        registeredCount: 0,
        attendedCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'events', id), newEvent);
      }

      const events = await this.getEvents();
      events.unshift(newEvent);
      safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

      await this.logAudit({
        action: 'EVENT_CREATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { title: newEvent.title, date: newEvent.date, venue: newEvent.venue },
      });

      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create event' };
    }
  },

  async updateEvent(
    id: string,
    updates: Partial<MOSAEvent>,
    editorEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      const events = await this.getEvents();
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) return { success: false, error: 'Event not found' };

      const updated = { ...events[idx], ...updates, updatedAt: now };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'events', id), updated);
      }

      events[idx] = updated;
      safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

      await this.logAudit({
        action: 'EVENT_UPDATED',
        performedBy: editorEmail,
        affectedRecord: id,
        metadata: { updatedFields: Object.keys(updates) },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async cancelEvent(id: string, adminEmail = 'admin@massh.ac.ug'): Promise<{ success: boolean; error?: string }> {
    return this.updateEvent(id, { status: 'CANCELLED' }, adminEmail);
  },

  async deleteEvent(id: string, adminEmail = 'admin@massh.ac.ug'): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured() && db) {
        await deleteDoc(doc(db, 'events', id));
      }
      const events = await this.getEvents();
      const updated = events.filter(e => e.id !== id);
      safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));

      await this.logAudit({
        action: 'EVENT_DELETED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { eventId: id },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete event' };
    }
  },

  generateQRToken(eventId: string, alumniNumber: string): string {
    const raw = `${eventId}::${alumniNumber}::${Date.now()}`;
    return `QR-${btoa(raw).replace(/=+$/, '')}`;
  },

  async registerForEvent(
    eventId: string,
    alumnus: AlumniProfile
  ): Promise<{ success: boolean; registration?: EventRegistration; error?: string }> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return { success: false, error: 'Event not found' };
      if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
        return { success: false, error: `Cannot register for a ${event.status.toLowerCase()} event` };
      }

      const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
      let regs: EventRegistration[] = [];
      if (raw) {
        try { regs = JSON.parse(raw); } catch {}
      }
      if (regs.length === 0) {
        regs = [...defaultSeedEventRegistrations];
      }

      // Check existing active registration
      const existing = regs.find(r => r.eventId === eventId && r.alumniId === alumnus.internalId && r.status === 'REGISTERED');
      if (existing) {
        return { success: false, error: 'You are already registered for this event', registration: existing };
      }

      const qrCheckInToken = this.generateQRToken(eventId, alumnus.alumniNumber);
      const newReg: EventRegistration = {
        id: `reg-${Date.now()}`,
        eventId,
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        alumniName: `${alumnus.firstName} ${alumnus.lastName}`,
        alumniEmail: alumnus.email,
        registeredAt: new Date().toISOString(),
        qrCheckInToken,
        status: 'REGISTERED',
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'event_registrations', newReg.id), newReg);
      }

      regs.push(newReg);
      safeStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(regs));

      // Update registered count on event
      const activeCount = regs.filter(r => r.eventId === eventId && r.status === 'REGISTERED').length;
      await this.updateEvent(eventId, { registeredCount: activeCount }, alumnus.email);

      await this.logAudit({
        action: 'EVENT_REGISTRATION',
        performedBy: alumnus.email,
        affectedRecord: eventId,
        metadata: {
          alumnusName: `${alumnus.firstName} ${alumnus.lastName}`,
          alumniNumber: alumnus.alumniNumber,
          eventTitle: event.title,
          token: qrCheckInToken,
        },
      });

      return { success: true, registration: newReg };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed' };
    }
  },

  async cancelEventRegistration(eventId: string, alumniId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
      let regs: EventRegistration[] = [];
      if (raw) {
        try { regs = JSON.parse(raw); } catch {}
      }

      const idx = regs.findIndex(r => r.eventId === eventId && r.alumniId === alumniId && r.status === 'REGISTERED');
      if (idx === -1) return { success: false, error: 'Registration not found' };

      regs[idx].status = 'CANCELLED';
      safeStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(regs));

      const activeCount = regs.filter(r => r.eventId === eventId && r.status === 'REGISTERED').length;
      await this.updateEvent(eventId, { registeredCount: activeCount });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'event_registrations');
        const q = query(colRef, where('eventId', '==', eventId), where('status', '==', 'REGISTERED'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as EventRegistration);
      } catch (e) {
        console.warn('Firebase read event registrations failed:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
    let regs: EventRegistration[] = [];
    if (raw) {
      try { regs = JSON.parse(raw); } catch {}
    }
    if (regs.length === 0) {
      regs = [...defaultSeedEventRegistrations];
    }
    return regs.filter(r => r.eventId === eventId && r.status === 'REGISTERED');
  },

  async getAlumnusRegistrations(alumniId: string): Promise<EventRegistration[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
    let regs: EventRegistration[] = [];
    if (raw) {
      try { regs = JSON.parse(raw); } catch {}
    }
    if (regs.length === 0) {
      regs = [...defaultSeedEventRegistrations];
    }
    return regs.filter(r => r.alumniId === alumniId && r.status === 'REGISTERED');
  },

  // ATTENDANCE CHECK-IN (Section 13)
  async checkInAttendee(
    eventId: string,
    alumniNumber: string,
    checkedInBy = 'admin@massh.ac.ug',
    method: 'QR_SCAN' | 'MANUAL_ADMIN' = 'MANUAL_ADMIN'
  ): Promise<{ success: boolean; attendance?: EventAttendance; error?: string }> {
    try {
      const cleanNum = alumniNumber.trim().toUpperCase().replace(/\s+/g, ' ');
      const alumni = await this.getAlumniByNumber(cleanNum);
      if (!alumni) {
        return { success: false, error: `No verified alumni profile found for number "${alumniNumber}"` };
      }

      const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_ATTENDANCE);
      let attendanceList: EventAttendance[] = [];
      if (raw) {
        try { attendanceList = JSON.parse(raw); } catch {}
      }

      // Check if already checked in
      const alreadyCheckedIn = attendanceList.some(a => a.eventId === eventId && a.alumniNumber.toUpperCase().replace(/\s+/g, ' ') === cleanNum);
      if (alreadyCheckedIn) {
        return { success: false, error: `Alumnus ${cleanNum} (${alumni.firstName} ${alumni.lastName}) is ALREADY checked in for this event!` };
      }

      const now = new Date().toISOString();
      const newAttendance: EventAttendance = {
        id: `att-${Date.now()}`,
        eventId,
        alumniId: alumni.internalId,
        alumniNumber: alumni.alumniNumber,
        alumniName: `${alumni.firstName} ${alumni.lastName}`,
        checkedInAt: now,
        checkedInBy,
        checkInMethod: method,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'event_attendance', newAttendance.id), newAttendance);
      }

      attendanceList.push(newAttendance);
      safeStorage.setItem(STORAGE_KEYS.EVENT_ATTENDANCE, JSON.stringify(attendanceList));

      // Update attendedCount on event
      const attendedCount = attendanceList.filter(a => a.eventId === eventId).length;
      await this.updateEvent(eventId, { attendedCount }, checkedInBy);

      await this.logAudit({
        action: 'EVENT_ATTENDANCE_CHECKIN',
        performedBy: checkedInBy,
        affectedRecord: eventId,
        metadata: {
          alumnusNumber: alumni.alumniNumber,
          alumniName: `${alumni.firstName} ${alumni.lastName}`,
          method,
          checkedInAt: now,
        },
      });

      return { success: true, attendance: newAttendance };
    } catch (e: any) {
      return { success: false, error: e.message || 'Check-in failed' };
    }
  },

  async getEventAttendance(eventId: string): Promise<EventAttendance[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'event_attendance');
        const q = query(colRef, where('eventId', '==', eventId), orderBy('checkedInAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as EventAttendance);
      } catch (e) {
        console.warn('Firebase read event attendance failed:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_ATTENDANCE);
    let list: EventAttendance[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch {}
    }
    return list.filter(a => a.eventId === eventId);
  },

  // QR TOKEN DECODER & CHECK-IN VERIFIER
  async verifyAndCheckInByQR(
    qrToken: string,
    checkedInBy = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; attendeeName?: string; alumniNumber?: string; eventTitle?: string; error?: string }> {
    try {
      const cleanToken = qrToken.trim();
      if (!cleanToken) return { success: false, error: 'Empty QR code token' };

      // Look up registration matching this token
      const raw = safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS);
      let regs: EventRegistration[] = [];
      if (raw) {
        try { regs = JSON.parse(raw); } catch {}
      }
      if (regs.length === 0) regs = defaultSeedEventRegistrations;

      const matchedReg = regs.find(r => r.qrCheckInToken === cleanToken && r.status === 'REGISTERED');
      if (!matchedReg) {
        return { success: false, error: 'Invalid or unrecognized QR check-in pass. No matching active registration found.' };
      }

      const event = await this.getEventById(matchedReg.eventId);

      // Perform check-in
      const res = await this.checkInAttendee(matchedReg.eventId, matchedReg.alumniNumber, checkedInBy, 'QR_SCAN');
      if (!res.success) {
        return { success: false, error: res.error };
      }

      return {
        success: true,
        attendeeName: matchedReg.alumniName,
        alumniNumber: matchedReg.alumniNumber,
        eventTitle: event?.title || 'MOSA Event',
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'QR Check-in verification failed' };
    }
  },

  // ==========================================
  // PHASE 5: PAYMENTS & DONATIONS (Section 14 & 22)
  // ==========================================

  // DONATION CAMPAIGNS
  async getDonationCampaigns(statusFilter?: CampaignStatus): Promise<DonationCampaign[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'donation_campaigns');
        const q = statusFilter
          ? query(colRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
          : query(colRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as DonationCampaign);
      } catch (e) {
        console.warn('Firebase read campaigns failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    let campaigns: DonationCampaign[] = [];
    if (raw) {
      try { campaigns = JSON.parse(raw); } catch {}
    }
    if (campaigns.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(defaultSeedCampaigns));
      campaigns = [...defaultSeedCampaigns];
    }
    return campaigns.filter(c => !statusFilter || c.status === statusFilter);
  },

  async getDonationCampaignById(id: string): Promise<DonationCampaign | null> {
    const campaigns = await this.getDonationCampaigns();
    return campaigns.find(c => c.id === id) || null;
  },

  async createDonationCampaign(
    campaignData: Omit<DonationCampaign, 'id' | 'createdAt' | 'raisedAmount' | 'donorCount' | 'createdBy'>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const id = `camp-${Date.now()}`;
      const newCampaign: DonationCampaign = {
        ...campaignData,
        id,
        raisedAmount: 0,
        donorCount: 0,
        createdAt: now,
        createdBy: adminEmail,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'donation_campaigns', id), newCampaign);
      }

      const campaigns = await this.getDonationCampaigns();
      campaigns.unshift(newCampaign);
      safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));

      await this.logAudit({
        action: 'CAMPAIGN_CREATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { title: newCampaign.title, targetAmount: newCampaign.targetAmount },
      });

      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create campaign' };
    }
  },

  async updateDonationCampaign(
    id: string,
    updates: Partial<DonationCampaign>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const campaigns = await this.getDonationCampaigns();
      const idx = campaigns.findIndex(c => c.id === id);
      if (idx === -1) return { success: false, error: 'Campaign not found' };

      const updated = { ...campaigns[idx], ...updates };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'donation_campaigns', id), updated);
      }

      campaigns[idx] = updated;
      safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));

      await this.logAudit({
        action: 'CAMPAIGN_UPDATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { updatedFields: Object.keys(updates) },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // PAYMENTS & TRANSACTIONS
  async getPayments(statusFilter?: PaymentStatus, categoryFilter?: PaymentCategory): Promise<PaymentTransaction[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'payments');
        const q = query(colRef, orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data() as PaymentTransaction);
        return docs.filter(p => {
          if (statusFilter && p.status !== statusFilter) return false;
          if (categoryFilter && p.category !== categoryFilter) return false;
          return true;
        });
      } catch (e) {
        console.warn('Firebase read payments failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.PAYMENTS);
    let payments: PaymentTransaction[] = [];
    if (raw) {
      try { payments = JSON.parse(raw); } catch {}
    }
    if (payments.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(defaultSeedPayments));
      payments = [...defaultSeedPayments];
    }
    return payments.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      return true;
    });
  },

  async getAlumnusPayments(alumniId: string): Promise<PaymentTransaction[]> {
    const all = await this.getPayments();
    return all.filter(p => p.alumniId === alumniId);
  },

  async getPaymentById(id: string): Promise<PaymentTransaction | null> {
    const all = await this.getPayments();
    return all.find(p => p.id === id) || null;
  },

  // Submit payment (Alumnus or Donor)
  async submitPayment(
    paymentData: Omit<PaymentTransaction, 'id' | 'status' | 'submittedAt'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const id = `pay-${Date.now()}`;
      const newPayment: PaymentTransaction = {
        ...paymentData,
        id,
        status: 'PENDING_VERIFICATION',
        submittedAt: now,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'payments', id), newPayment);
      }

      const payments = await this.getPayments();
      payments.unshift(newPayment);
      safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

      await this.logAudit({
        action: 'PAYMENT_SUBMITTED',
        performedBy: paymentData.alumniEmail,
        affectedRecord: id,
        metadata: {
          alumniNumber: paymentData.alumniNumber,
          category: paymentData.category,
          amount: paymentData.amount,
          method: paymentData.paymentMethod,
          reference: paymentData.transactionReference,
        },
      });

      // ==============================================================
      // PLATFORM-WIDE NOTIFICATION: ALL MEMBERS ARE NOTIFIED OF DONATION
      // Also triggers device/push notification on installed PWA application
      // ==============================================================
      const isDonation = paymentData.category === 'PROJECT_DONATION';
      const formattedAmount = `UGX ${(paymentData.amount || 0).toLocaleString()}`;
      const donorIdentifier = paymentData.alumniNumber || paymentData.alumniEmail || 'A generous Mandelian';

      // 1. Send platform-wide broadcast notification to all members
      let campaignTitle = 'MASSH Legacy & Development Projects';
      if (paymentData.campaignId) {
        try {
          const campaign = await this.getDonationCampaignById(paymentData.campaignId);
          if (campaign?.title) campaignTitle = campaign.title;
        } catch (e) {}
      }

      const notifTitle = isDonation
        ? `New Donation: ${formattedAmount} Contributed!`
        : `New Contribution: ${formattedAmount}`;

      const notifMessage = isDonation
        ? `Mandela alumnus (${donorIdentifier}) has contributed ${formattedAmount} towards "${campaignTitle}". Thank you for supporting Mandela Secondary School Hoima!`
        : `Member (${donorIdentifier}) has submitted ${formattedAmount} for MOSA annual dues.`;

      // Broadcast to 'all' so every member sees it in their notification desk & unread bell
      await this.sendNotification({
        alumniId: 'all',
        title: notifTitle,
        message: notifMessage,
        type: isDonation ? 'DONATION_RECEIVED' : 'PAYMENT_SUBMITTED',
        linkTab: 'payments',
        targetId: id,
      });

      return { success: true, id };
    } catch (e: any) {
      return { success: false, error: e.message || 'Payment submission failed' };
    }
  },

  // MOSA Treasurer / Finance Admin Verification
  async verifyPayment(
    paymentId: string,
    adminEmail = 'admin@massh.ac.ug',
    notes?: string
  ): Promise<{ success: boolean; receiptNumber?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const payments = await this.getPayments();
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx === -1) return { success: false, error: 'Payment record not found' };

      const payment = payments[idx];
      if (payment.status === 'VERIFIED') {
        return { success: false, error: `Payment is already verified with receipt ${payment.receiptNumber}` };
      }

      // Generate sequential receipt number: MOSA-RCP-2026-0001
      const year = new Date().getFullYear();
      const verifiedList = payments.filter(p => p.status === 'VERIFIED');
      const nextReceiptSeq = verifiedList.length + 1;
      const receiptNumber = `MOSA-RCP-${year}-${String(nextReceiptSeq).padStart(4, '0')}`;

      const updatedPayment: PaymentTransaction = {
        ...payment,
        status: 'VERIFIED',
        receiptNumber,
        verifiedAt: now,
        verifiedBy: adminEmail,
        notes: notes ? `${payment.notes || ''} [Verified note: ${notes}]`.trim() : payment.notes,
      };

      // 1. Update Payment record
      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'payments', paymentId), updatedPayment as any);
      }
      payments[idx] = updatedPayment;
      safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

      // 2. If ANNUAL_MEMBERSHIP, update Alumnus Profile dues status to ACTIVE
      if (payment.category === 'ANNUAL_MEMBERSHIP') {
        const subYear = payment.subscriptionYear || year;
        const alumniList = await this.getAlumniList();
        const aIdx = alumniList.findIndex(a => a.internalId === payment.alumniId || a.alumniNumber === payment.alumniNumber);
        if (aIdx !== -1) {
          alumniList[aIdx].membershipStatus = 'ACTIVE';
          alumniList[aIdx].membershipPaidUntilYear = subYear;
          alumniList[aIdx].updatedAt = now;

          if (isFirebaseConfigured() && db) {
            try {
              await updateDoc(doc(db, 'alumni', alumniList[aIdx].internalId), {
                membershipStatus: 'ACTIVE',
                membershipPaidUntilYear: subYear,
                updatedAt: now,
              });
            } catch (e) {
              console.warn('Firebase update alumni membership failed:', e);
            }
          }
          safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(alumniList));
        }
      }

      // 3. If PROJECT_DONATION and linked to a campaign, increment raisedAmount and donorCount
      if (payment.category === 'PROJECT_DONATION' && payment.campaignId) {
        const campaign = await this.getDonationCampaignById(payment.campaignId);
        if (campaign) {
          const newRaised = (campaign.raisedAmount || 0) + payment.amount;
          const newDonors = (campaign.donorCount || 0) + 1;
          const newStatus: CampaignStatus = newRaised >= campaign.targetAmount ? 'GOAL_REACHED' : campaign.status;

          await this.updateDonationCampaign(payment.campaignId, {
            raisedAmount: newRaised,
            donorCount: newDonors,
            status: newStatus,
          }, adminEmail);
        }
      }

      // 4. Log Audit
      await this.logAudit({
        action: 'PAYMENT_VERIFIED',
        performedBy: adminEmail,
        affectedRecord: paymentId,
        metadata: {
          receiptNumber,
          alumniNumber: payment.alumniNumber,
          category: payment.category,
          amount: payment.amount,
        },
      });

      // 5. Broadcast Verified Donation Celebration Across Entire Platform
      if (payment.category === 'PROJECT_DONATION') {
        const formattedAmount = `UGX ${(payment.amount || 0).toLocaleString()}`;
        const donorIdentifier = payment.alumniNumber || 'A fellow alumnus';
        await this.sendNotification({
          alumniId: 'all',
          title: `Verified Donation: ${formattedAmount}`,
          message: `Official receipt ${receiptNumber} has been verified for ${donorIdentifier} contributing ${formattedAmount} to MASSH alumni initiatives.`,
          type: 'PAYMENT_VERIFIED',
          linkTab: 'payments',
          targetId: paymentId,
        });
      }

      return { success: true, receiptNumber };
    } catch (e: any) {
      return { success: false, error: e.message || 'Payment verification failed' };
    }
  },

  // Reject invalid payment reference
  async rejectPayment(
    paymentId: string,
    rejectionReason: string,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      const payments = await this.getPayments();
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx === -1) return { success: false, error: 'Payment not found' };

      const updated = {
        ...payments[idx],
        status: 'REJECTED' as PaymentStatus,
        rejectionReason,
        verifiedAt: now,
        verifiedBy: adminEmail,
      };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'payments', paymentId), updated);
      }

      payments[idx] = updated;
      safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

      await this.logAudit({
        action: 'PAYMENT_REJECTED',
        performedBy: adminEmail,
        affectedRecord: paymentId,
        metadata: { rejectionReason, alumniNumber: payments[idx].alumniNumber },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // Financial Analytics & Statistics
  async getFinancialSummary(): Promise<{
    totalVerifiedAmount: number;
    totalPendingAmount: number;
    verifiedCount: number;
    pendingCount: number;
    categoryBreakdown: Record<PaymentCategory, number>;
    methodBreakdown: Record<PaymentMethod, number>;
  }> {
    const all = await this.getPayments();
    let totalVerifiedAmount = 0;
    let totalPendingAmount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;

    const categoryBreakdown: Record<PaymentCategory, number> = {
      ANNUAL_MEMBERSHIP: 0,
      EVENT_TICKET: 0,
      PROJECT_DONATION: 0,
      WELFARE_CONTRIBUTION: 0,
      OTHER: 0,
    };

    const methodBreakdown: Record<PaymentMethod, number> = {
      MTN_MOMO: 0,
      AIRTEL_MONEY: 0,
      BANK_TRANSFER: 0,
      CASH_OFFICE: 0,
      ONLINE_CARD: 0,
    };

    all.forEach(p => {
      if (p.status === 'VERIFIED') {
        totalVerifiedAmount += p.amount;
        verifiedCount++;
        if (categoryBreakdown[p.category] !== undefined) {
          categoryBreakdown[p.category] += p.amount;
        }
        if (methodBreakdown[p.paymentMethod] !== undefined) {
          methodBreakdown[p.paymentMethod] += p.amount;
        }
      } else if (p.status === 'PENDING_VERIFICATION') {
        totalPendingAmount += p.amount;
        pendingCount++;
      }
    });

    return {
      totalVerifiedAmount,
      totalPendingAmount,
      verifiedCount,
      pendingCount,
      categoryBreakdown,
      methodBreakdown,
    };
  },

  // ==========================================
  // PHASE 6: COMMUNICATIONS & ANNOUNCEMENTS (Section 15 & 22)
  // ==========================================

  async getAnnouncements(
    filterCategory?: AnnouncementCategory,
    filterScope?: AudienceScope,
    filterChapterId?: string
  ): Promise<Announcement[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const colRef = collection(db, 'announcements');
        const q = query(colRef, orderBy('publishedAt', 'desc'));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data() as Announcement);
        return docs.filter(a => {
          if (filterCategory && a.category !== filterCategory) return false;
          if (filterScope && a.audienceScope !== filterScope) return false;
          if (filterChapterId && a.targetChapterId !== filterChapterId) return false;
          return true;
        });
      } catch (e) {
        console.warn('Firebase read announcements failed, fallback to local:', e);
      }
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    let announcements: Announcement[] = [];
    if (raw) {
      try { announcements = JSON.parse(raw); } catch {}
    }
    if (announcements.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultSeedAnnouncements));
      announcements = [...defaultSeedAnnouncements];
    }
    return announcements.filter(a => {
      if (filterCategory && a.category !== filterCategory) return false;
      if (filterScope && a.audienceScope !== filterScope) return false;
      if (filterChapterId && a.targetChapterId !== filterChapterId) return false;
      return true;
    }).sort((a, b) => {
      // Pinned items first, then most recent
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  },

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const list = await this.getAnnouncements();
    return list.find(a => a.id === id) || null;
  },

  async incrementAnnouncementViews(id: string): Promise<void> {
    const list = await this.getAnnouncements();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].viewsCount = (list[idx].viewsCount || 0) + 1;
      safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'announcements', id), { viewsCount: list[idx].viewsCount });
        } catch (e) {
          console.warn('Firebase increment views failed:', e);
        }
      }
    }
  },

  async createAnnouncement(
    announcementData: Omit<Announcement, 'id' | 'publishedAt' | 'viewsCount' | 'smsRecipientsCount' | 'emailRecipientsCount'>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; id?: string; smsCount?: number; emailCount?: number; error?: string }> {
    try {
      const now = new Date().toISOString();
      const id = `ann-${Date.now()}`;

      // Calculate audience reach
      const alumni = await this.getAlumniList();
      let targetedAlumni = alumni;

      if (announcementData.audienceScope === 'CHAPTER_ONLY' && announcementData.targetChapterId) {
        const chapterMembers = await this.getChapterMembers(announcementData.targetChapterId);
        const memberIds = new Set(chapterMembers.map(m => m.alumniId));
        targetedAlumni = alumni.filter(a => memberIds.has(a.internalId));
      } else if (announcementData.audienceScope === 'ACTIVE_MEMBERS_ONLY') {
        targetedAlumni = alumni.filter(a => a.membershipStatus === 'ACTIVE');
      } else if (announcementData.audienceScope === 'COHORT_RANGE' && announcementData.targetYearStart && announcementData.targetYearEnd) {
        targetedAlumni = alumni.filter(a => {
          const y = a.schoolHistory.aLevel?.yearCompleted || a.schoolHistory.oLevel?.yearCompleted || 2000;
          return y >= announcementData.targetYearStart! && y <= announcementData.targetYearEnd!;
        });
      }

      const smsRecipientsCount = announcementData.channels.includes('SMS_BROADCAST') ? targetedAlumni.length : 0;
      const emailRecipientsCount = announcementData.channels.includes('EMAIL_DIGEST') ? targetedAlumni.length : 0;

      const newAnnouncement: Announcement = {
        ...announcementData,
        id,
        publishedAt: now,
        viewsCount: 0,
        smsRecipientsCount,
        emailRecipientsCount,
        publishedBy: adminEmail,
      };

      if (isFirebaseConfigured() && db) {
        await setDoc(doc(db, 'announcements', id), newAnnouncement);
      }

      const announcements = await this.getAnnouncements();
      announcements.unshift(newAnnouncement);
      safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));

      // Generate in-app notifications for targeted alumni
      const rawNotifs = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      let notifs: AlumniNotification[] = [];
      if (rawNotifs) {
        try { notifs = JSON.parse(rawNotifs); } catch {}
      }

      targetedAlumni.forEach(alumnus => {
        notifs.unshift({
          id: `notif-${Date.now()}-${alumnus.internalId}`,
          alumniId: alumnus.internalId,
          title: `Announcement: ${newAnnouncement.title}`,
          message: newAnnouncement.summary || newAnnouncement.content.slice(0, 120) + '...',
          type: 'ANNOUNCEMENT',
          linkTab: 'admin',
          isRead: false,
          createdAt: now,
        });
      });
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 200)));

      await this.logAudit({
        action: 'ANNOUNCEMENT_CREATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: {
          title: newAnnouncement.title,
          category: newAnnouncement.category,
          audienceScope: newAnnouncement.audienceScope,
          smsSent: smsRecipientsCount,
          emailSent: emailRecipientsCount,
        },
      });

      return { success: true, id, smsCount: smsRecipientsCount, emailCount: emailRecipientsCount };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create announcement' };
    }
  },

  async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const announcements = await this.getAnnouncements();
      const idx = announcements.findIndex(a => a.id === id);
      if (idx === -1) return { success: false, error: 'Announcement not found' };

      const updated = { ...announcements[idx], ...updates };

      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'announcements', id), updated as any);
      }

      announcements[idx] = updated;
      safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));

      await this.logAudit({
        action: 'ANNOUNCEMENT_UPDATED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { updatedFields: Object.keys(updates) },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async togglePinAnnouncement(
    id: string,
    isPinned: boolean,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateAnnouncement(id, { isPinned }, adminEmail);
  },

  async deleteAnnouncement(
    id: string,
    adminEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const announcements = await this.getAnnouncements();
      const filtered = announcements.filter(a => a.id !== id);
      safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));

      if (isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, 'announcements', id));
        } catch (e) {
          console.warn('Firebase delete announcement failed:', e);
        }
      }

      await this.logAudit({
        action: 'ANNOUNCEMENT_DELETED',
        performedBy: adminEmail,
        affectedRecord: id,
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  isUserRegisteredAlumni(user?: AuthUser | null): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    if (user.role !== 'ALUMNI' && user.role !== 'USER') return true; // staff roles
    if (user.role === 'ALUMNI') return true;
    if (user.alumniNumber && user.alumniNumber.trim() !== '') return true;
    if (user.alumniId && user.alumniId.trim() !== '') return true;
    return false;
  },

  // NOTIFICATION CENTER
  async getAlumniNotifications(alumniId: string): Promise<AlumniNotification[]> {
    if (!alumniId || alumniId.trim() === '' || alumniId === 'guest') {
      return [];
    }
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs: AlumniNotification[] = [];
    if (raw) {
      try { notifs = JSON.parse(raw); } catch {}
    }
    if (notifs.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultSeedNotifications));
      notifs = [...defaultSeedNotifications];
    }
    const userNotifs = notifs.filter(n => n.alumniId === alumniId || n.alumniId === 'all');
    if (userNotifs.length > 0) {
      return userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // If specific alumniId has no dedicated notifications, only return general broadcasts if it's a valid ID
    const generalBroadcasts = notifs.filter(n => n.alumniId === 'all');
    return generalBroadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async sendNotification(notification: Omit<AlumniNotification, 'id' | 'createdAt' | 'isRead'>): Promise<AlumniNotification> {
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs: AlumniNotification[] = [];
    if (raw) {
      try { notifs = JSON.parse(raw); } catch {}
    }
    const newNotif: AlumniNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    notifs.unshift(newNotif);
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));

    // ==============================================================
    // TRIGGER OS / INSTALLED PWA APP DEVICE NOTIFICATION
    // Reserved strictly for registered alumni and verified staff
    // ==============================================================
    try {
      const activeUser = this.getCurrentUser();
      if (!this.isUserRegisteredAlumni(activeUser)) {
        return newNotif;
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          // If service worker is ready, use showNotification for full installed PWA banner
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(newNotif.title, {
                body: newNotif.message,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                data: { url: `/?tab=${newNotif.linkTab || 'home'}` },
              });
            }).catch(() => {
              new Notification(newNotif.title, { body: newNotif.message, icon: '/favicon.svg' });
            });
          } else {
            new Notification(newNotif.title, { body: newNotif.message, icon: '/favicon.svg' });
          }
        }
      }
    } catch (pushErr) {
      console.warn('Device notification trigger failed:', pushErr);
    }

    return newNotif;
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs: AlumniNotification[] = [];
    if (raw) {
      try { notifs = JSON.parse(raw); } catch {}
    }
    if (notifs.length === 0) {
      notifs = [...defaultSeedNotifications];
    }
    const idx = notifs.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      notifs[idx].isRead = true;
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    }
  },

  async markAllNotificationsAsRead(alumniId: string): Promise<void> {
    const raw = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs: AlumniNotification[] = [];
    if (raw) {
      try { notifs = JSON.parse(raw); } catch {}
    }
    if (notifs.length === 0) {
      notifs = [...defaultSeedNotifications];
    }
    notifs.forEach(n => {
      if (n.alumniId === alumniId) n.isRead = true;
    });
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  // ==========================================
  // PHASE 7: ANALYTICS & REPORTING (Section 16 & 22)
  // ==========================================

  async getSystemAnalytics(): Promise<SystemAnalytics> {
    const [alumni, applications, chapters, events, payments] = await Promise.all([
      this.getAlumniList(),
      this.getApplications(),
      this.getChapters(),
      this.getEvents(),
      this.getPayments(),
    ]);

    const totalVerified = alumni.length;
    // Total applicants registered in system (all applications + verified alumni if not captured)
    const totalRegistered = Math.max(applications.length, totalVerified);
    const verificationRate = totalRegistered > 0 ? Math.round((totalVerified / totalRegistered) * 100) : 100;

    // School Levels Breakdown
    let oLevelOnly = 0;
    let aLevelOnly = 0;
    let bothLevels = 0;

    alumni.forEach(a => {
      const o = a.schoolHistory?.attendedOLevel;
      const adv = a.schoolHistory?.attendedALevel;
      if (o && adv) bothLevels++;
      else if (o && !adv) oLevelOnly++;
      else if (!o && adv) aLevelOnly++;
      else bothLevels++; // fallback default
    });

    // Cohorts Breakdown (Pioneers 1997-2005 vs subsequent cohorts)
    let pioneers1997_2005 = 0;
    let years2006_2015 = 0;
    let years2016_2020 = 0;
    let years2021_present = 0;

    alumni.forEach(a => {
      const year = a.schoolHistory?.aLevel?.yearCompleted || a.schoolHistory?.oLevel?.yearCompleted || 2005;
      if (year <= 2005) pioneers1997_2005++;
      else if (year <= 2015) years2006_2015++;
      else if (year <= 2020) years2016_2020++;
      else years2021_present++;
    });

    // Gender Breakdown
    let male = 0;
    let female = 0;
    let other = 0;

    alumni.forEach(a => {
      if (a.gender === 'Male') male++;
      else if (a.gender === 'Female') female++;
      else other++;
    });

    // Dues Compliance
    const currentYear = new Date().getFullYear();
    let activePaidCount = 0;
    alumni.forEach(a => {
      if (a.membershipStatus === 'ACTIVE' && (a.membershipPaidUntilYear || 0) >= currentYear) {
        activePaidCount++;
      }
    });
    const dueCount = Math.max(0, totalVerified - activePaidCount);
    const complianceRate = totalVerified > 0 ? Math.round((activePaidCount / totalVerified) * 100) : 0;

    // Finances Breakdown
    let totalVerifiedUGX = 0;
    let duesCollectedUGX = 0;
    let campaignsRaisedUGX = 0;
    let eventRevenueUGX = 0;

    payments.forEach(p => {
      if (p.status === 'VERIFIED') {
        totalVerifiedUGX += p.amount;
        if (p.category === 'ANNUAL_MEMBERSHIP') duesCollectedUGX += p.amount;
        else if (p.category === 'PROJECT_DONATION') campaignsRaisedUGX += p.amount;
        else if (p.category === 'EVENT_TICKET') eventRevenueUGX += p.amount;
      }
    });

    // Chapters Distribution
    const totalChapters = chapters.length;
    let totalChapterMemberships = 0;
    const distribution = chapters.map(c => {
      totalChapterMemberships += c.memberCount || 0;
      return {
        code: c.code,
        name: c.name,
        institution: c.institution,
        memberCount: c.memberCount || 0,
      };
    }).sort((a, b) => b.memberCount - a.memberCount);

    // Events Analytics
    const totalEvents = events.length;
    let totalRegistrations = 0;
    let totalAttendees = 0;
    events.forEach(e => {
      totalRegistrations += e.registeredCount || 0;
      totalAttendees += e.attendedCount || 0;
    });
    const averageAttendanceRate = totalRegistrations > 0 ? Math.round((totalAttendees / totalRegistrations) * 100) : 0;

    // Top Locations
    const locMap: Record<string, number> = {};
    alumni.forEach(a => {
      const loc = a.city ? `${a.city}, ${a.country}` : a.country || 'Uganda';
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    const topLocations = Object.entries(locMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Professions
    const profMap: Record<string, number> = {};
    alumni.forEach(a => {
      const prof = a.occupation || 'Professional';
      profMap[prof] = (profMap[prof] || 0) + 1;
    });
    const topProfessions = Object.entries(profMap)
      .map(([profession, count]) => ({ profession, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRegistered,
      totalVerified,
      verificationRate,
      levelsBreakdown: { oLevelOnly, aLevelOnly, bothLevels },
      cohortBreakdown: { pioneers1997_2005, years2006_2015, years2016_2020, years2021_present },
      genderBreakdown: { male, female, other },
      duesCompliance: { activePaidCount, dueCount, complianceRate },
      finances: { totalVerifiedUGX, duesCollectedUGX, campaignsRaisedUGX, eventRevenueUGX },
      chapters: { totalChapters, totalChapterMemberships, distribution },
      events: { totalEvents, totalRegistrations, totalAttendees, averageAttendanceRate },
      topLocations,
      topProfessions,
    };
  },

  // ==========================================
  // CAMPUS & HERITAGE PHOTOS
  // ==========================================
  async getCampusPhotos(category?: PhotoCategory): Promise<CampusPhoto[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.PHOTOS);
    let photos: CampusPhoto[] = raw ? JSON.parse(raw) : defaultSeedPhotos;
    if (category) {
      photos = photos.filter(p => p.category === category);
    }
    return photos;
  },

  async addCampusPhoto(photo: Omit<CampusPhoto, 'id'>): Promise<CampusPhoto> {
    const photos = await this.getCampusPhotos();
    const newPhoto: CampusPhoto = {
      ...photo,
      id: `photo-${Date.now()}`,
    };
    photos.unshift(newPhoto);
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    return newPhoto;
  },

  async deleteCampusPhoto(id: string): Promise<boolean> {
    const photos = await this.getCampusPhotos();
    const updated = photos.filter(p => p.id !== id);
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    return true;
  },

  async updateCampusPhoto(id: string, updates: Partial<CampusPhoto>): Promise<boolean> {
    const photos = await this.getCampusPhotos();
    const idx = photos.findIndex(p => p.id === id);
    if (idx === -1) return false;
    photos[idx] = { ...photos[idx], ...updates };
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    return true;
  },

  // ==========================================
  // OFFICIAL MOSA DOCUMENTS & DOWNLOADS
  // ==========================================
  async getDocuments(): Promise<MOSADocument[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    let docs: MOSADocument[] = raw ? JSON.parse(raw) : defaultSeedDocuments;
    if (!docs || docs.length === 0) {
      docs = [...defaultSeedDocuments];
      safeStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    }
    return docs;
  },

  async addDocument(docData: Omit<MOSADocument, 'id' | 'publishedDate'>, adminEmail = 'admin@massh.ac.ug'): Promise<MOSADocument> {
    const docs = await this.getDocuments();
    const newDoc: MOSADocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      publishedDate: new Date().toISOString().split('T')[0],
    };
    docs.unshift(newDoc);
    safeStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

    await this.logAudit({
      action: 'DOCUMENT_UPLOADED',
      performedBy: adminEmail,
      affectedRecord: newDoc.id,
      metadata: { title: newDoc.title, category: newDoc.category },
    });

    return newDoc;
  },

  async deleteDocument(id: string, adminEmail = 'admin@massh.ac.ug'): Promise<boolean> {
    const docs = await this.getDocuments();
    const target = docs.find(d => d.id === id);
    const updated = docs.filter(d => d.id !== id);
    safeStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));

    if (target) {
      await this.logAudit({
        action: 'DOCUMENT_DELETED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { title: target.title },
      });
    }

    return true;
  },

  // ==========================================
  // FEATURE TOGGLES & MODULE CONTROLS
  // ==========================================
  async getModuleSettings(): Promise<ModuleSettings> {
    const settings = await this.getSystemSettings();
    // Merge with defaults so newly introduced modules (e.g. attendance) are available on older installs
    return { ...defaultSettings.moduleSettings!, ...(settings.moduleSettings || {}) };
  },

  async updateModuleSettings(updates: Partial<ModuleSettings>, adminEmail = 'admin@massh.ac.ug'): Promise<ModuleSettings> {
    const settings = await this.getSystemSettings();
    const currentModules = settings.moduleSettings || defaultSettings.moduleSettings!;
    const updatedModules: ModuleSettings = { ...currentModules, ...updates };

    await this.updateSystemSettings({ moduleSettings: updatedModules });

    await this.logAudit({
      action: 'FEATURE_MODULES_CONFIGURED',
      performedBy: adminEmail,
      affectedRecord: 'system_modules',
      metadata: updates,
    });

    return updatedModules;
  },

  // ==========================================
  // DYNAMIC WEBSITE CONTENT MANAGEMENT (CMS)
  // ==========================================
  async getWebsiteContent(): Promise<WebsiteContent> {
    const raw = safeStorage.getItem(STORAGE_KEYS.CMS_CONTENT);
    if (!raw) {
      safeStorage.setItem(STORAGE_KEYS.CMS_CONTENT, JSON.stringify(defaultWebsiteContent));
      return JSON.parse(JSON.stringify(defaultWebsiteContent));
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        home: { ...defaultWebsiteContent.home, ...(parsed.home || {}) },
        about: {
          ...defaultWebsiteContent.about,
          ...(parsed.about || {}),
          milestones: parsed.about?.milestones || defaultWebsiteContent.about.milestones,
          leaders: parsed.about?.leaders || defaultWebsiteContent.about.leaders,
        },
        membership: {
          ...defaultWebsiteContent.membership,
          ...(parsed.membership || {}),
          tiers: parsed.membership?.tiers || defaultWebsiteContent.membership.tiers,
        },
        directory: { ...defaultWebsiteContent.directory, ...(parsed.directory || {}) },
        contact: {
          ...defaultWebsiteContent.contact,
          ...(parsed.contact || {}),
          phoneNumbers: parsed.contact?.phoneNumbers || defaultWebsiteContent.contact.phoneNumbers,
          emails: parsed.contact?.emails || defaultWebsiteContent.contact.emails,
          faqs: parsed.contact?.faqs || defaultWebsiteContent.contact.faqs,
        },
      };
    } catch {
      return JSON.parse(JSON.stringify(defaultWebsiteContent));
    }
  },

  async updateWebsiteContent(updates: Partial<WebsiteContent>, adminEmail = 'admin@massh.ac.ug'): Promise<WebsiteContent> {
    const current = await this.getWebsiteContent();
    const updated: WebsiteContent = {
      home: updates.home ? { ...current.home, ...updates.home } : current.home,
      about: updates.about ? { ...current.about, ...updates.about } : current.about,
      membership: updates.membership ? { ...current.membership, ...updates.membership } : current.membership,
      directory: updates.directory ? { ...current.directory, ...updates.directory } : current.directory,
      contact: updates.contact ? { ...current.contact, ...updates.contact } : current.contact,
    };

    safeStorage.setItem(STORAGE_KEYS.CMS_CONTENT, JSON.stringify(updated));

    await this.logAudit({
      action: 'WEBSITE_CONTENT_UPDATED',
      performedBy: adminEmail,
      affectedRecord: 'cms_content',
      metadata: { updatedSections: Object.keys(updates) },
    });

    return updated;
  },

  async resetWebsiteContent(section?: keyof WebsiteContent, adminEmail = 'admin@massh.ac.ug'): Promise<WebsiteContent> {
    const current = await this.getWebsiteContent();
    let updated: WebsiteContent;
    if (section && defaultWebsiteContent[section]) {
      updated = {
        ...current,
        [section]: JSON.parse(JSON.stringify(defaultWebsiteContent[section])),
      };
    } else {
      updated = JSON.parse(JSON.stringify(defaultWebsiteContent));
    }
    safeStorage.setItem(STORAGE_KEYS.CMS_CONTENT, JSON.stringify(updated));

    await this.logAudit({
      action: 'WEBSITE_CONTENT_RESET',
      performedBy: adminEmail,
      affectedRecord: 'cms_content',
      metadata: { section: section || 'ALL' },
    });

    return updated;
  },

  // ==========================================
  // OPPORTUNITIES HUB & POSTINGS
  // ==========================================
  async getOpportunities(filter?: {
    type?: string;
    workplace?: string;
    status?: string;
    search?: string;
    chapterId?: string;
  }): Promise<OpportunityItem[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
    let items: OpportunityItem[] = raw ? JSON.parse(raw) : defaultSeedOpportunities;
    if (!items || items.length === 0) {
      items = [...defaultSeedOpportunities];
      safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(items));
    }

    if (!filter) return items;

    return items.filter(item => {
      if (filter.type && filter.type !== 'ALL' && item.type !== filter.type) return false;
      if (filter.workplace && filter.workplace !== 'ALL' && item.workplaceType !== filter.workplace) return false;
      if (filter.status && filter.status !== 'ALL' && item.status !== filter.status) return false;
      if (filter.chapterId && item.chapterId !== filter.chapterId) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.organisation.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          (item.skills && item.skills.some(s => s.toLowerCase().includes(q)));
        if (!matches) return false;
      }
      return true;
    });
  },

  async getOpportunityById(id: string): Promise<OpportunityItem | null> {
    const items = await this.getOpportunities();
    const item = items.find(o => o.id === id) || null;
    if (item) {
      item.viewsCount = (item.viewsCount || 0) + 1;
      safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(items));
    }
    return item;
  },

  async createOpportunity(
    oppData: Partial<OpportunityItem>,
    user: AuthUser
  ): Promise<OpportunityItem> {
    const items = await this.getOpportunities();
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PUBLICITY' || user.role === 'SECRETARY';
    
    // Auto-approve if posted by Admin/Staff, otherwise pending review for regular alumni
    const initialStatus: OpportunityStatus = isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';

    const newOpp: OpportunityItem = {
      id: `opp-${Date.now()}`,
      title: oppData.title || 'Untitled Opportunity',
      type: oppData.type || 'JOB',
      organisation: oppData.organisation || 'Independent',
      description: oppData.description || '',
      requirements: oppData.requirements || '',
      skills: oppData.skills || [],
      location: oppData.location || 'Uganda',
      country: oppData.country || 'Uganda',
      workplaceType: oppData.workplaceType || 'ON_SITE',
      deadline: oppData.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      startDate: oppData.startDate,
      closingDate: oppData.closingDate,
      contactPerson: oppData.contactPerson,
      contactEmail: oppData.contactEmail,
      contactPhone: oppData.contactPhone,
      externalUrl: oppData.externalUrl,
      applicationInstructions: oppData.applicationInstructions,
      postedBy: {
        name: user.displayName || 'MOSA Member',
        email: user.email,
        alumniNumber: user.alumniNumber,
        alumniId: user.alumniId,
        role: user.role,
      },
      chapterId: oppData.chapterId,
      chapterCode: oppData.chapterCode,
      visibility: oppData.visibility || 'PUBLIC',
      status: initialStatus,
      createdAt: new Date().toISOString().split('T')[0],
      publishedAt: initialStatus === 'PUBLISHED' ? new Date().toISOString().split('T')[0] : undefined,
      viewsCount: 0,
      applicationsCount: 0,
    };

    items.unshift(newOpp);
    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(items));

    await this.logAudit({
      action: 'OPPORTUNITY_CREATED',
      performedBy: user.email,
      affectedRecord: newOpp.id,
      metadata: { title: newOpp.title, type: newOpp.type, status: newOpp.status },
    });

    return newOpp;
  },

  async updateOpportunity(
    id: string,
    updates: Partial<OpportunityItem>,
    actorEmail = 'admin@massh.ac.ug'
  ): Promise<OpportunityItem | null> {
    const items = await this.getOpportunities();
    const idx = items.findIndex(o => o.id === id);
    if (idx === -1) return null;

    items[idx] = { ...items[idx], ...updates };
    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(items));

    await this.logAudit({
      action: 'OPPORTUNITY_UPDATED',
      performedBy: actorEmail,
      affectedRecord: id,
      metadata: updates,
    });

    return items[idx];
  },

  async setOpportunityStatus(
    id: string,
    status: OpportunityStatus,
    adminEmailOrNotes = 'admin@massh.ac.ug',
    notes?: string
  ): Promise<OpportunityItem | null> {
    const items = await this.getOpportunities();
    const idx = items.findIndex(o => o.id === id);
    if (idx === -1) return null;

    let adminEmail = 'admin@massh.ac.ug';
    let reviewNotes = notes;

    if (adminEmailOrNotes.includes('@')) {
      adminEmail = adminEmailOrNotes;
    } else {
      reviewNotes = adminEmailOrNotes;
    }

    items[idx].status = status;
    if (reviewNotes) items[idx].reviewNotes = reviewNotes;
    if (status === 'PUBLISHED') {
      items[idx].publishedAt = new Date().toISOString().split('T')[0];
      items[idx].approvedBy = adminEmail;
    }

    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(items));

    await this.logAudit({
      action: `OPPORTUNITY_STATUS_${status}`,
      performedBy: adminEmail,
      affectedRecord: id,
      metadata: { status, reviewNotes },
    });

    return items[idx];
  },

  async deleteOpportunity(id: string, adminEmail = 'admin@massh.ac.ug'): Promise<boolean> {
    const items = await this.getOpportunities();
    const target = items.find(o => o.id === id);
    const updated = items.filter(o => o.id !== id);
    safeStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(updated));

    if (target) {
      await this.logAudit({
        action: 'OPPORTUNITY_DELETED',
        performedBy: adminEmail,
        affectedRecord: id,
        metadata: { title: target.title },
      });
    }
    return true;
  },

  // ==========================================
  // MENTORSHIP NETWORK
  // ==========================================
  async getMentorProfiles(filter?: {
    field?: string;
    format?: string;
    search?: string;
  }): Promise<MentorProfile[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.MENTORS);
    let items: MentorProfile[] = raw ? JSON.parse(raw) : defaultSeedMentors;
    if (!items || items.length === 0) {
      items = [...defaultSeedMentors];
      safeStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(items));
    }

    if (!filter) return items;

    return items.filter(m => {
      if (filter.field && filter.field !== 'ALL' && m.professionalField !== filter.field) return false;
      if (filter.format && filter.format !== 'ALL' && m.format !== filter.format) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches =
          m.fullName.toLowerCase().includes(q) ||
          m.professionalField.toLowerCase().includes(q) ||
          m.organisation.toLowerCase().includes(q) ||
          m.areasOfExpertise.some(e => e.toLowerCase().includes(q)) ||
          m.mentorshipAreas.some(a => a.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  },

  async saveMentorProfile(
    profileData: Partial<MentorProfile>,
    user: AuthUser
  ): Promise<MentorProfile> {
    const mentors = await this.getMentorProfiles();
    const existingIdx = mentors.findIndex(m => m.alumniId === (user.alumniId || profileData.alumniId));

    if (existingIdx !== -1) {
      mentors[existingIdx] = { ...mentors[existingIdx], ...profileData };
      safeStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors));
      return mentors[existingIdx];
    }

    const newMentor: MentorProfile = {
      id: `mentor-${Date.now()}`,
      alumniId: user.alumniId || 'alumni-temp',
      alumniNumber: user.alumniNumber || 'MA. PENDING',
      fullName: user.displayName || 'Alumni Mentor',
      photoUrl: user.photoUrl,
      email: user.email,
      phone: user.phone,
      professionalField: profileData.professionalField || 'General Professional',
      areasOfExpertise: profileData.areasOfExpertise || [],
      skills: profileData.skills || [],
      yearsExperience: profileData.yearsExperience || 5,
      currentRole: profileData.currentRole || 'Professional',
      organisation: profileData.organisation || 'Enterprise',
      bio: profileData.bio || 'MASSH Alumni mentor dedicated to student success.',
      mentorshipAreas: profileData.mentorshipAreas || ['Career Guidance'],
      preferredMenteeInterests: profileData.preferredMenteeInterests || [],
      availability: profileData.availability || 'AVAILABLE',
      maxMentees: profileData.maxMentees || 4,
      currentMenteesCount: 0,
      location: profileData.location || 'Uganda',
      format: profileData.format || 'HYBRID',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    mentors.unshift(newMentor);
    safeStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(mentors));

    await this.logAudit({
      action: 'MENTOR_PROFILE_REGISTERED',
      performedBy: user.email,
      affectedRecord: newMentor.id,
      metadata: { fullName: newMentor.fullName, field: newMentor.professionalField },
    });

    return newMentor;
  },

  async getMentorshipRequests(filter?: {
    mentorId?: string;
    menteeAlumniId?: string;
  }): Promise<MentorshipRequest[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.MENTORSHIP_REQUESTS);
    const items: MentorshipRequest[] = raw ? JSON.parse(raw) : [];

    if (!filter) return items;

    return items.filter(r => {
      if (filter.mentorId && r.mentorId !== filter.mentorId) return false;
      if (filter.menteeAlumniId && r.menteeAlumniId !== filter.menteeAlumniId) return false;
      return true;
    });
  },

  async submitMentorshipRequest(
    reqData: Partial<MentorshipRequest>,
    user: AuthUser
  ): Promise<MentorshipRequest> {
    const requests = await this.getMentorshipRequests();
    const newReq: MentorshipRequest = {
      id: `mreq-${Date.now()}`,
      mentorId: reqData.mentorId || '',
      mentorName: reqData.mentorName || 'Mentor',
      mentorAlumniNumber: reqData.mentorAlumniNumber || '',
      menteeAlumniId: user.alumniId || 'alumni-temp',
      menteeAlumniNumber: user.alumniNumber || 'MA. PENDING',
      menteeName: user.displayName || 'Mentee',
      menteeEmail: user.email,
      menteePhone: user.phone,
      fieldOrTopic: reqData.fieldOrTopic || 'General Career Guidance',
      message: reqData.message || '',
      preferredFormat: reqData.preferredFormat || 'ONLINE',
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0],
    };

    requests.unshift(newReq);
    safeStorage.setItem(STORAGE_KEYS.MENTORSHIP_REQUESTS, JSON.stringify(requests));

    // Also notify mentor
    await this.sendNotification({
      alumniId: reqData.mentorId || 'alumni-0001',
      title: 'New Mentorship Request',
      message: `${user.displayName} (${user.alumniNumber || 'Alumnus'}) has requested your mentorship in ${newReq.fieldOrTopic}.`,
      type: 'SYSTEM',
      linkTab: 'opportunities',
    });

    return newReq;
  },

  async respondToMentorshipRequest(
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED',
    responseNote?: string
  ): Promise<MentorshipRequest | null> {
    const requests = await this.getMentorshipRequests();
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return null;

    requests[idx].status = status;
    requests[idx].respondedAt = new Date().toISOString().split('T')[0];
    requests[idx].responseNote = responseNote;

    safeStorage.setItem(STORAGE_KEYS.MENTORSHIP_REQUESTS, JSON.stringify(requests));

    // Notify mentee
    await this.sendNotification({
      alumniId: requests[idx].menteeAlumniId,
      title: `Mentorship Request ${status === 'ACCEPTED' ? 'Accepted!' : 'Declined'}`,
      message: `${requests[idx].mentorName} has ${status.toLowerCase()} your mentorship request.${responseNote ? ` Note: "${responseNote}"` : ''}`,
      type: 'SYSTEM',
      linkTab: 'opportunities',
    });

    return requests[idx];
  },

  // ==========================================
  // ELECTIONS & DIGITAL SECRET VOTING
  // ==========================================
  async getElectionCycles(): Promise<ElectionCycle[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.ELECTIONS);
    let items: ElectionCycle[] = raw ? JSON.parse(raw) : defaultSeedElections;
    if (!items || items.length === 0) {
      items = [...defaultSeedElections];
      safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(items));
    }
    return items;
  },

  async getElectionById(id: string): Promise<ElectionCycle | null> {
    const elections = await this.getElectionCycles();
    return elections.find(e => e.id === id) || null;
  },

  async getCandidates(electionId: string, positionId?: string): Promise<Candidate[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.CANDIDATES);
    let items: Candidate[] = raw ? JSON.parse(raw) : defaultSeedCandidates;
    if (!items || items.length === 0) {
      items = [...defaultSeedCandidates];
      safeStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(items));
    }

    return items.filter(c => {
      if (c.electionId !== electionId) return false;
      if (positionId && c.positionId !== positionId) return false;
      return true;
    });
  },

  async nominateCandidate(
    nomData: Partial<Candidate>,
    user: AuthUser
  ): Promise<Candidate> {
    const candidates = await this.getCandidates(nomData.electionId || 'elec-2026');
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      electionId: nomData.electionId || 'elec-2026',
      positionId: nomData.positionId || 'pos-pres',
      alumniId: nomData.alumniId || user.alumniId || 'alumni-0001',
      alumniNumber: nomData.alumniNumber || user.alumniNumber || 'MA. 0001',
      fullName: nomData.fullName || user.displayName || 'Nominee',
      cohort: nomData.cohort || 'MASSH Alumni',
      profession: nomData.profession,
      photoUrl: nomData.photoUrl || user.photoUrl,
      manifesto: nomData.manifesto || 'Committed to service and transparency for MOSA.',
      seconderName: nomData.seconderName,
      seconderAlumniNumber: nomData.seconderAlumniNumber,
      status: 'APPROVED',
      votesCount: 0,
      nominatedAt: new Date().toISOString().split('T')[0],
    };

    candidates.push(newCand);
    safeStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));

    await this.logAudit({
      action: 'CANDIDATE_NOMINATED',
      performedBy: user.email,
      affectedRecord: newCand.id,
      metadata: { candidate: newCand.fullName, positionId: newCand.positionId },
    });

    return newCand;
  },

  async castSecretBallot(
    electionId: string,
    selections: Record<string, string>, // positionId -> candidateId
    voter: AuthUser
  ): Promise<{ success: boolean; receiptToken: string; message: string }> {
    if (!voter.alumniId && !voter.alumniNumber) {
      throw new Error('Only registered verified alumni with a valid MA number may vote.');
    }

    const voterId = voter.alumniId || voter.uid;
    const voterNumber = voter.alumniNumber || 'MA. VOTE';

    // Check if voter already cast ballot for this election
    const rawBallots = safeStorage.getItem(STORAGE_KEYS.BALLOTS);
    const ballots: BallotVote[] = rawBallots ? JSON.parse(rawBallots) : [];

    const alreadyVoted = ballots.some(b => b.electionId === electionId && (b.voterAlumniId === voterId || b.voterAlumniNumber === voterNumber));
    if (alreadyVoted) {
      throw new Error('You have already cast your ballot in this election. Constitutional rule: exactly one secret ballot per verified member.');
    }

    // Generate cryptographic-style receipt verification token
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const token = `VOTE-${new Date().getFullYear()}-${voterNumber.replace(/[^a-zA-Z0-9]/g, '')}-${randomHex}`;

    // Record secret votes & increment candidate tallies
    const candidates = await this.getCandidates(electionId);

    Object.entries(selections).forEach(([posId, candId]) => {
      ballots.push({
        id: `ballot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        electionId,
        voterAlumniId: voterId,
        voterAlumniNumber: voterNumber,
        positionId: posId,
        candidateId: candId,
        verificationToken: token,
        castAt: new Date().toISOString(),
      });

      const cand = candidates.find(c => c.id === candId);
      if (cand) {
        cand.votesCount = (cand.votesCount || 0) + 1;
      }
    });

    safeStorage.setItem(STORAGE_KEYS.BALLOTS, JSON.stringify(ballots));
    safeStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));

    // Update election cycle total ballots
    const elections = await this.getElectionCycles();
    const elecIdx = elections.findIndex(e => e.id === electionId);
    if (elecIdx !== -1) {
      elections[elecIdx].totalBallotsCast = (elections[elecIdx].totalBallotsCast || 0) + 1;
      safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(elections));
    }

    await this.logAudit({
      action: 'BALLOT_CAST',
      performedBy: voter.email,
      affectedRecord: electionId,
      metadata: { receiptToken: token, positionsVotedCount: Object.keys(selections).length },
    });

    return {
      success: true,
      receiptToken: token,
      message: 'Your official secret ballot has been securely tallied and certified.',
    };
  },

  async hasVotedInElection(electionId: string, voter: AuthUser | null): Promise<boolean> {
    if (!voter) return false;
    const voterId = voter.alumniId || voter.uid;
    const voterNumber = voter.alumniNumber || '';
    const rawBallots = safeStorage.getItem(STORAGE_KEYS.BALLOTS);
    const ballots: BallotVote[] = rawBallots ? JSON.parse(rawBallots) : [];

    return ballots.some(b => b.electionId === electionId && (b.voterAlumniId === voterId || (voterNumber && b.voterAlumniNumber === voterNumber)));
  },

  async getVoterReceiptTokens(electionId: string, voter: AuthUser | null): Promise<string[]> {
    if (!voter) return [];
    const voterId = voter.alumniId || voter.uid;
    const voterNumber = voter.alumniNumber || '';
    const rawBallots = safeStorage.getItem(STORAGE_KEYS.BALLOTS);
    const ballots: BallotVote[] = rawBallots ? JSON.parse(rawBallots) : [];

    const myVotes = ballots.filter(b => b.electionId === electionId && (b.voterAlumniId === voterId || (voterNumber && b.voterAlumniNumber === voterNumber)));
    return Array.from(new Set(myVotes.map(v => v.verificationToken)));
  },

  async updateElectionCycle(cycleData: Partial<ElectionCycle> & { id: string }): Promise<ElectionCycle | null> {
    const elections = await this.getElectionCycles();
    const idx = elections.findIndex(e => e.id === cycleData.id);
    if (idx === -1) return null;

    elections[idx] = { ...elections[idx], ...cycleData };
    safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(elections));

    await this.logAudit({
      action: 'ELECTION_UPDATED',
      performedBy: 'admin@massh.ac.ug',
      affectedRecord: cycleData.id,
      metadata: cycleData,
    });

    return elections[idx];
  },

  async certifyElection(
    electionId: string,
    adminEmail = 'admin@massh.ac.ug',
    summary?: string
  ): Promise<ElectionCycle | null> {
    const elections = await this.getElectionCycles();
    const idx = elections.findIndex(e => e.id === electionId);
    if (idx === -1) return null;

    elections[idx].status = 'CONCLUDED';
    elections[idx].certifiedAt = new Date().toISOString();
    elections[idx].certifiedBy = adminEmail;
    elections[idx].declarationSummary = summary || 'Official certified declaration of election results by the MOSA Electoral Commission.';

    safeStorage.setItem(STORAGE_KEYS.ELECTIONS, JSON.stringify(elections));

    await this.logAudit({
      action: 'ELECTION_CERTIFIED',
      performedBy: adminEmail,
      affectedRecord: electionId,
      metadata: { status: 'CONCLUDED' },
    });

    return elections[idx];
  },

  // ==========================================
  // OUTBOUND COMMUNICATION CHANNELS (SMS/WHATSAPP/EMAIL)
  // ==========================================
  async getBroadcasts(): Promise<BroadcastMessage[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.BROADCASTS);
    let items: BroadcastMessage[] = raw ? JSON.parse(raw) : defaultSeedBroadcasts;
    if (!items || items.length === 0) {
      items = [...defaultSeedBroadcasts];
      safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(items));
    }
    return items;
  },

  previewInterpolatedMessage(template: string, sample: Partial<AlumniProfile> & { cohort?: string; chapter?: string }): string {
    let result = template;
    const name = sample.fullName || (sample.firstName ? `${sample.firstName} ${sample.lastName || ''}`.trim() : 'Alumnus');
    const num = sample.alumniNumber || 'MA. 0001';
    const cohort = sample.cohort || 
      (sample.schoolHistory?.aLevel?.yearCompleted ? `Class of ${sample.schoolHistory.aLevel.yearCompleted}` :
       sample.schoolHistory?.oLevel?.yearCompleted ? `Class of ${sample.schoolHistory.oLevel.yearCompleted}` : 'Class of 2012');
    const chapter = sample.chapter || 'Kampala Metropolitan Chapter';

    result = result.replace(/\{\{fullName\}\}/g, name);
    result = result.replace(/\{\{name\}\}/g, name);
    result = result.replace(/\{\{alumniNumber\}\}/g, num);
    result = result.replace(/\{\{cohort\}\}/g, cohort);
    result = result.replace(/\{\{chapter\}\}/g, chapter);
    return result;
  },

  async calculateTargetAudience(filter: BroadcastAudienceFilter): Promise<AlumniProfile[]> {
    const allAlumni = await this.getAlumniList();
    return allAlumni.filter(a => {
      if (filter.scope === 'ALL_ALUMNI') return true;
      if (filter.scope === 'VERIFIED_ONLY') {
        return a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED';
      }
      if (filter.scope === 'COHORT' && filter.cohortYear) {
        const oYear = a.schoolHistory?.oLevel?.yearCompleted;
        const aYear = a.schoolHistory?.aLevel?.yearCompleted;
        const rawCohort = (a as unknown as { cohort?: string }).cohort;
        return (rawCohort && rawCohort.includes(String(filter.cohortYear))) || aYear === filter.cohortYear || oYear === filter.cohortYear;
      }
      if (filter.scope === 'CHAPTER' && filter.chapterId) {
        const rawChapter = a as unknown as { chapterId?: string; chapter?: string };
        return rawChapter.chapterId === filter.chapterId || rawChapter.chapter === filter.chapterId;
      }
      return true;
    });
  },

  async createBroadcast(
    data: Partial<BroadcastMessage>,
    user: AuthUser
  ): Promise<BroadcastMessage> {
    const items = await this.getBroadcasts();
    const audience = await this.calculateTargetAudience(data.targetAudience || { scope: 'ALL_ALUMNI' });

    let costPerUnit = 0;
    if (data.channel === 'SMS') costPerUnit = 30;
    else if (data.channel === 'WHATSAPP') costPerUnit = 50;
    else if (data.channel === 'MULTICHANNEL') costPerUnit = 80;

    const newBroadcast: BroadcastMessage = {
      id: `bcast-${Date.now()}`,
      title: data.title || 'Untitled Circular',
      channel: data.channel || 'SMS',
      senderName: user.displayName || 'MOSA Secretariat',
      senderRole: user.role || 'ADMIN',
      senderContact: user.email || 'secretariat@massh.ac.ug',
      content: data.content || '',
      templateVariables: ['fullName', 'alumniNumber', 'cohort'],
      targetAudience: data.targetAudience || { scope: 'ALL_ALUMNI' },
      recipientCount: audience.length > 0 ? audience.length : 120,
      status: 'DRAFT',
      estimatedCostUgx: (audience.length > 0 ? audience.length : 120) * costPerUnit,
      deliverySummary: {
        sent: 0,
        delivered: 0,
        failed: 0,
      },
      createdAt: new Date().toISOString(),
      gatewayProvider: data.channel === 'SMS' 
        ? 'MTN Uganda Bulk SMS Gateway (Shortcode: MOSA-MASSH)'
        : data.channel === 'WHATSAPP'
          ? 'Meta WhatsApp Cloud Business API'
          : 'AWS SES Dedicated SMTP Cluster',
    };

    items.unshift(newBroadcast);
    safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(items));

    await this.logAudit({
      action: 'BROADCAST_CREATED',
      performedBy: user.email,
      affectedRecord: newBroadcast.id,
      metadata: { title: newBroadcast.title, channel: newBroadcast.channel },
    });

    return newBroadcast;
  },

  async sendBroadcast(
    id: string,
    actorEmail = 'admin@massh.ac.ug'
  ): Promise<BroadcastMessage | null> {
    const items = await this.getBroadcasts();
    const idx = items.findIndex(b => b.id === id);
    if (idx === -1) return null;

    const b = items[idx];
    b.status = 'SENT';
    b.sentAt = new Date().toISOString();
    
    const total = b.recipientCount || 100;
    const delivered = Math.floor(total * 0.98);
    const failed = total - delivered;

    b.deliverySummary = {
      sent: total,
      delivered,
      failed
    };

    safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(items));

    await this.logAudit({
      action: 'BROADCAST_SENT',
      performedBy: actorEmail,
      affectedRecord: id,
      metadata: { channel: b.channel, recipients: total, delivered },
    });

    return b;
  },

  // ==========================================
  // SUPER ADMIN PASSWORD MANAGEMENT
  // ==========================================
  async changeSuperAdminPassword(
    newPassword: string, 
    currentPassword: string, 
    actorEmail = 'admin@massh.ac.ug'
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = actorEmail.trim().toLowerCase();
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New administrator password must be at least 8 characters long.' };
    }
    
    const creds = this.getUserCredentials();
    const existing = creds[cleanEmail];
    const expectedCurrent = existing?.password || 'admin123';
    if (currentPassword !== expectedCurrent) {
      return { success: false, error: 'Current administrator password is incorrect.' };
    }

    creds[cleanEmail] = {
      ...(existing || {}),
      email: cleanEmail,
      password: newPassword,
      role: 'SUPER_ADMIN',
      updatedAt: new Date().toISOString()
    };
    safeStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));

    // Update users store
    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));
    const userIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (userIdx !== -1) {
      users[userIdx].mustChangePassword = false;
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Update current user session
    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === cleanEmail) {
      current.mustChangePassword = false;
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
    }

    await this.logAudit({
      action: 'SUPER_ADMIN_PASSWORD_CHANGED',
      performedBy: cleanEmail,
      affectedRecord: cleanEmail,
      metadata: { action: 'Initial administrator credentials replaced with secured password' }
    });

    return { success: true };
  },

  // ==========================================
  // WELCOME PAGE CONTENT MANAGEMENT
  // ==========================================
  async getWelcomePageConfig(): Promise<WelcomePageConfig> {
    const raw = safeStorage.getItem(STORAGE_KEYS.WELCOME_PAGE);
    if (!raw) return defaultWelcomePageConfig;
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed.socialGmail === 'masshalumni@gmail.com' || 
        parsed.officialPhone?.includes('782 123456') ||
        parsed.officialWebsite?.includes('mandelassalumni')
      ) {
        parsed.socialGmail = defaultWelcomePageConfig.socialGmail;
        parsed.officialPhone = defaultWelcomePageConfig.officialPhone;
        parsed.officialWhatsApp = defaultWelcomePageConfig.officialWhatsApp;
        parsed.officialWebsite = defaultWelcomePageConfig.officialWebsite;
        safeStorage.setItem(STORAGE_KEYS.WELCOME_PAGE, JSON.stringify({ ...defaultWelcomePageConfig, ...parsed }));
      }
      return { ...defaultWelcomePageConfig, ...parsed };
    } catch {
      return defaultWelcomePageConfig;
    }
  },

  async saveWelcomePageDraft(
    draft: Partial<WelcomePageConfig>, 
    actor: AuthUser
  ): Promise<{ success: boolean; config: WelcomePageConfig }> {
    const current = await this.getWelcomePageConfig();
    const updated: WelcomePageConfig = {
      ...current,
      draftHeroTitle: draft.draftHeroTitle ?? draft.heroTitle ?? current.draftHeroTitle ?? current.heroTitle,
      draftSlogan: draft.draftSlogan ?? draft.slogan ?? current.draftSlogan ?? current.slogan,
      draftSubtitle: draft.draftSubtitle ?? draft.subtitle ?? current.draftSubtitle ?? current.subtitle,
      draftIntroMessage: draft.draftIntroMessage ?? draft.introMessage ?? current.draftIntroMessage ?? current.introMessage,
      draftHeroImageUrl: draft.draftHeroImageUrl ?? draft.heroImageUrl ?? current.draftHeroImageUrl ?? current.heroImageUrl,
      draftCarouselImages: draft.draftCarouselImages ?? draft.carouselImages ?? current.draftCarouselImages ?? current.carouselImages,
      draftCarouselIntervalSeconds: draft.draftCarouselIntervalSeconds ?? draft.carouselIntervalSeconds ?? current.draftCarouselIntervalSeconds ?? current.carouselIntervalSeconds ?? 6,
      draftSocialX: draft.draftSocialX ?? draft.socialX ?? current.draftSocialX ?? current.socialX,
      draftSocialLinkedIn: draft.draftSocialLinkedIn ?? draft.socialLinkedIn ?? current.draftSocialLinkedIn ?? current.socialLinkedIn,
      draftSocialGmail: draft.draftSocialGmail ?? draft.socialGmail ?? current.draftSocialGmail ?? current.socialGmail,
      draftSocialTikTok: draft.draftSocialTikTok ?? draft.socialTikTok ?? current.draftSocialTikTok ?? current.socialTikTok,
      draftOfficialPhone: draft.draftOfficialPhone ?? draft.officialPhone ?? current.draftOfficialPhone ?? current.officialPhone,
      draftOfficialWhatsApp: draft.draftOfficialWhatsApp ?? draft.officialWhatsApp ?? current.draftOfficialWhatsApp ?? current.officialWhatsApp,
      draftOfficialAddress: draft.draftOfficialAddress ?? draft.officialAddress ?? current.draftOfficialAddress ?? current.officialAddress,
      draftOfficialWebsite: draft.draftOfficialWebsite ?? draft.officialWebsite ?? current.draftOfficialWebsite ?? current.officialWebsite,
      hasUnpublishedDraft: true,
    };
    safeStorage.setItem(STORAGE_KEYS.WELCOME_PAGE, JSON.stringify(updated));

    await this.logAudit({
      action: 'WELCOME_PAGE_DRAFT_SAVED',
      performedBy: actor.email,
      affectedRecord: 'welcome-page-config',
      metadata: { draftTitle: updated.draftHeroTitle }
    });

    return { success: true, config: updated };
  },

  async publishWelcomePage(
    actor: AuthUser
  ): Promise<{ success: boolean; config: WelcomePageConfig }> {
    const current = await this.getWelcomePageConfig();
    const published: WelcomePageConfig = {
      ...current,
      heroTitle: current.draftHeroTitle || current.heroTitle,
      slogan: current.draftSlogan || current.slogan,
      subtitle: current.draftSubtitle || current.subtitle,
      introMessage: current.draftIntroMessage || current.introMessage,
      heroImageUrl: current.draftHeroImageUrl || current.heroImageUrl,
      carouselImages: current.draftCarouselImages || current.carouselImages,
      carouselIntervalSeconds: current.draftCarouselIntervalSeconds || current.carouselIntervalSeconds || 6,
      socialX: current.draftSocialX ?? current.socialX,
      socialLinkedIn: current.draftSocialLinkedIn ?? current.socialLinkedIn,
      socialGmail: current.draftSocialGmail ?? current.socialGmail,
      socialTikTok: current.draftSocialTikTok ?? current.socialTikTok,
      officialPhone: current.draftOfficialPhone ?? current.officialPhone,
      officialWhatsApp: current.draftOfficialWhatsApp ?? current.officialWhatsApp,
      officialAddress: current.draftOfficialAddress ?? current.officialAddress,
      officialWebsite: current.draftOfficialWebsite ?? current.officialWebsite,
      hasUnpublishedDraft: false,
      lastPublishedAt: new Date().toISOString(),
      lastPublishedBy: actor.email,
    };
    safeStorage.setItem(STORAGE_KEYS.WELCOME_PAGE, JSON.stringify(published));

    await this.logAudit({
      action: 'WELCOME_PAGE_PUBLISHED',
      performedBy: actor.email,
      affectedRecord: 'welcome-page-config',
      metadata: { publishedTitle: published.heroTitle, publishedAt: published.lastPublishedAt }
    });

    return { success: true, config: published };
  },

  async revertWelcomePageToDefault(
    actor: AuthUser
  ): Promise<{ success: boolean; config: WelcomePageConfig }> {
    safeStorage.setItem(STORAGE_KEYS.WELCOME_PAGE, JSON.stringify(defaultWelcomePageConfig));

    await this.logAudit({
      action: 'WELCOME_PAGE_REVERTED_DEFAULT',
      performedBy: actor.email,
      affectedRecord: 'welcome-page-config',
      metadata: { note: 'Welcome page configuration restored to official approved defaults' }
    });

    return { success: true, config: defaultWelcomePageConfig };
  },

  // ==========================================
  // LEADERSHIP OFFICES & GRANULAR PERMISSIONS
  // ==========================================
  async getLeadershipOffices(): Promise<LeadershipOffice[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.LEADERSHIP_OFFICES);
    if (!raw) return defaultSeedOffices;
    try {
      return JSON.parse(raw) as LeadershipOffice[];
    } catch {
      return defaultSeedOffices;
    }
  },

  async saveLeadershipOffice(
    officeData: Partial<LeadershipOffice>, 
    actor: AuthUser
  ): Promise<{ success: boolean; office: LeadershipOffice }> {
    const offices = await this.getLeadershipOffices();
    let savedOffice: LeadershipOffice;

    if (officeData.id) {
      const idx = offices.findIndex(o => o.id === officeData.id);
      if (idx !== -1) {
        offices[idx] = {
          ...offices[idx],
          ...officeData,
          updatedAt: new Date().toISOString(),
          updatedBy: actor.email,
        } as LeadershipOffice;
        savedOffice = offices[idx];
      } else {
        savedOffice = {
          ...officeData,
          id: officeData.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: actor.email,
        } as LeadershipOffice;
        offices.push(savedOffice);
      }
    } else {
      savedOffice = {
        id: `off-${Date.now()}`,
        title: officeData.title || 'Untitled Office',
        description: officeData.description || '',
        category: officeData.category || 'COMMITTEE',
        status: 'VACANT',
        modules: officeData.modules || ['REGISTRY'],
        granularPermissions: officeData.granularPermissions || { REGISTRY: ['VIEW'] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: actor.email,
      };
      offices.push(savedOffice);
    }

    safeStorage.setItem(STORAGE_KEYS.LEADERSHIP_OFFICES, JSON.stringify(offices));

    await this.logAudit({
      action: 'LEADERSHIP_OFFICE_SAVED',
      performedBy: actor.email,
      affectedRecord: savedOffice.id,
      metadata: { title: savedOffice.title, category: savedOffice.category }
    });

    return { success: true, office: savedOffice };
  },

  async deleteLeadershipOffice(
    officeId: string, 
    actor: AuthUser
  ): Promise<{ success: boolean; error?: string }> {
    const offices = await this.getLeadershipOffices();
    const idx = offices.findIndex(o => o.id === officeId);
    if (idx === -1) return { success: false, error: 'Office not found' };

    const removed = offices.splice(idx, 1)[0];
    safeStorage.setItem(STORAGE_KEYS.LEADERSHIP_OFFICES, JSON.stringify(offices));

    // Clear office links from any user assigned
    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let usersUpdated = false;
    users.forEach(u => {
      if (u.officeId === officeId) {
        delete u.officeId;
        delete u.officeTitle;
        delete u.assignedPermissions;
        delete u.granularPermissions;
        usersUpdated = true;
      }
    });
    if (usersUpdated) {
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    await this.logAudit({
      action: 'LEADERSHIP_OFFICE_DELETED',
      performedBy: actor.email,
      affectedRecord: officeId,
      metadata: { title: removed.title }
    });

    return { success: true };
  },

  async assignAlumnusToOffice(
    params: {
      officeId: string;
      alumniNumber: string;
      startDate?: string;
      endDate?: string;
    },
    actor: AuthUser
  ): Promise<{ success: boolean; error?: string; office?: LeadershipOffice }> {
    const offices = await this.getLeadershipOffices();
    const office = offices.find(o => o.id === params.officeId);
    if (!office) return { success: false, error: 'Leadership office does not exist.' };

    const cleanNum = params.alumniNumber.trim().toUpperCase();
    const alumniList = await this.getAlumniList();
    const targetAlumnus = alumniList.find(a => a.alumniNumber.toUpperCase() === cleanNum);

    if (!targetAlumnus) {
      return { success: false, error: `Alumnus with number "${cleanNum}" was not found in the verified registry.` };
    }

    // Eligibility verification (Section 7)
    if (targetAlumnus.membershipStatus !== 'ACTIVE' && targetAlumnus.membershipStatus !== 'APPROVED') {
      return { 
        success: false, 
        error: `Alumnus ${targetAlumnus.fullName || targetAlumnus.firstName} is not in good verified standing (${targetAlumnus.membershipStatus}). Verification is required before assigning leadership offices.` 
      };
    }

    // Update office assignment
    office.assignedAlumniId = targetAlumnus.internalId;
    office.assignedAlumniNumber = targetAlumnus.alumniNumber;
    office.assignedAlumniName = targetAlumnus.fullName || `${targetAlumnus.firstName} ${targetAlumnus.lastName}`;
    office.assignedEmail = targetAlumnus.email;
    office.appointmentStartDate = params.startDate || new Date().toISOString().split('T')[0];
    office.appointmentEndDate = params.endDate;
    office.status = 'ACTIVE';
    office.updatedAt = new Date().toISOString();
    office.updatedBy = actor.email;

    safeStorage.setItem(STORAGE_KEYS.LEADERSHIP_OFFICES, JSON.stringify(offices));

    // Update user record with role and granular permissions
    const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));
    const targetEmail = targetAlumnus.email.toLowerCase();
    const userIdx = users.findIndex(u => u.email.toLowerCase() === targetEmail);

    if (userIdx !== -1) {
      users[userIdx].officeId = office.id;
      users[userIdx].officeTitle = office.title;
      users[userIdx].assignedPermissions = office.modules;
      users[userIdx].granularPermissions = office.granularPermissions;
      users[userIdx].appointmentStatus = 'ACTIVE';
      users[userIdx].appointmentStartDate = office.appointmentStartDate;
      users[userIdx].appointmentEndDate = office.appointmentEndDate;
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
      // Create user record for this leader so they can log in and receive permissions
      const newLeaderUser: AuthUser = {
        uid: `usr-leader-${targetAlumnus.internalId}`,
        email: targetAlumnus.email,
        displayName: office.assignedAlumniName,
        role: 'CUSTOM_STAFF',
        alumniId: targetAlumnus.internalId,
        alumniNumber: targetAlumnus.alumniNumber,
        officeId: office.id,
        officeTitle: office.title,
        assignedPermissions: office.modules,
        granularPermissions: office.granularPermissions,
        appointmentStatus: 'ACTIVE',
        appointmentStartDate: office.appointmentStartDate,
        appointmentEndDate: office.appointmentEndDate,
        active: true,
      };
      users.push(newLeaderUser);
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    await this.logAudit({
      action: 'LEADERSHIP_OFFICER_ASSIGNED',
      performedBy: actor.email,
      affectedRecord: office.id,
      metadata: { 
        office: office.title, 
        alumnus: office.assignedAlumniName, 
        alumniNumber: office.assignedAlumniNumber,
        modules: office.modules
      }
    });

    return { success: true, office };
  },

  async revokeOfficeAppointment(
    officeId: string, 
    actor: AuthUser
  ): Promise<{ success: boolean; error?: string }> {
    const offices = await this.getLeadershipOffices();
    const office = offices.find(o => o.id === officeId);
    if (!office) return { success: false, error: 'Office not found' };

    const priorLeader = office.assignedAlumniName;
    const priorEmail = office.assignedEmail?.toLowerCase();

    office.assignedAlumniId = undefined;
    office.assignedAlumniNumber = undefined;
    office.assignedAlumniName = undefined;
    office.assignedEmail = undefined;
    office.appointmentStartDate = undefined;
    office.appointmentEndDate = undefined;
    office.status = 'VACANT';
    office.updatedAt = new Date().toISOString();
    office.updatedBy = actor.email;

    safeStorage.setItem(STORAGE_KEYS.LEADERSHIP_OFFICES, JSON.stringify(offices));

    // Clear user permissions
    if (priorEmail) {
      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const userIdx = users.findIndex(u => u.email.toLowerCase() === priorEmail);
      if (userIdx !== -1) {
        delete users[userIdx].officeId;
        delete users[userIdx].officeTitle;
        delete users[userIdx].assignedPermissions;
        delete users[userIdx].granularPermissions;
        users[userIdx].appointmentStatus = 'EXPIRED';
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }

    await this.logAudit({
      action: 'LEADERSHIP_OFFICE_REVOKED',
      performedBy: actor.email,
      affectedRecord: officeId,
      metadata: { office: office.title, priorLeader }
    });

    return { success: true };
  },

  // ==========================================
  // MEMBER DATA EXPORTS (CSV, EXCEL, PDF)
  // ==========================================
  async getMembersForExport(filter?: MemberExportFilter): Promise<Array<{
    alumniNumber: string;
    fullName: string;
    email: string;
    phone: string;
    cohortYear: string;
    status: string;
    leadershipOffice: string;
    joinedDate: string;
    profession: string;
    chapter: string;
    verificationStatus?: string;
    alumniRegistrationStatus?: string;
    rawStatus?: string;
  }>> {
    const [alumniList, applications, users, offices] = await Promise.all([
      this.getAlumniList(),
      this.getApplications(),
      Promise.resolve(JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]') as AuthUser[]),
      this.getLeadershipOffices()
    ]);

    const results: Array<any> = [];

    // Map verified alumni
    alumniList.forEach(a => {
      const assignedOffice = offices.find(o => o.assignedAlumniNumber === a.alumniNumber && o.status === 'ACTIVE');
      const cohort = a.schoolHistory?.aLevel?.yearCompleted || a.schoolHistory?.oLevel?.yearCompleted || '';
      
      results.push({
        alumniNumber: a.alumniNumber || 'N/A',
        fullName: a.fullName || `${a.firstName} ${a.lastName}`,
        email: a.email || 'N/A',
        phone: a.phone || 'N/A',
        cohortYear: String(cohort || 'Unknown'),
        status: 'VERIFIED_ALUMNUS',
        verificationStatus: 'VERIFIED',
        alumniRegistrationStatus: 'COMPLETED',
        leadershipOffice: assignedOffice ? assignedOffice.title : 'None',
        joinedDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A',
        profession: a.occupation || a.programme || 'Alumnus',
        chapter: a.city ? `${a.city} Chapter` : 'National',
        rawStatus: 'VERIFIED',
        cohortNum: cohort ? Number(cohort) : 0,
        officeId: assignedOffice?.id || 'NONE',
      });
    });

    // Map pending applicants
    applications.forEach(app => {
      if (app.status === 'PENDING' || app.status === 'UNDER_REVIEW') {
        const cohort = app.schoolHistory?.aLevel?.yearCompleted || app.schoolHistory?.oLevel?.yearCompleted || '';
        results.push({
          alumniNumber: 'Pending Allocation',
          fullName: `${app.firstName} ${app.lastName}`,
          email: app.email || 'N/A',
          phone: app.phone || 'N/A',
          cohortYear: String(cohort || 'Unknown'),
          status: 'PENDING_VERIFICATION',
          verificationStatus: 'PENDING',
          alumniRegistrationStatus: 'SUBMITTED',
          leadershipOffice: 'None',
          joinedDate: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A',
          profession: app.occupation || app.programme || 'Applicant',
          chapter: app.city ? `${app.city} Chapter` : 'National',
          rawStatus: 'PENDING',
          cohortNum: cohort ? Number(cohort) : 0,
          officeId: 'NONE',
        });
      }
    });

    // Map registered users who haven't completed alumni application
    users.forEach(u => {
      if (!u.alumniNumber && u.role !== 'SUPER_ADMIN') {
        const alreadyInApps = applications.some(a => a.email.toLowerCase() === u.email.toLowerCase());
        if (!alreadyInApps) {
          results.push({
            alumniNumber: 'Unregistered',
            fullName: u.displayName || u.email.split('@')[0],
            email: u.email,
            phone: u.phone || 'N/A',
            cohortYear: 'N/A',
            status: 'UNREGISTERED_ACCOUNT',
            verificationStatus: 'UNREGISTERED',
            alumniRegistrationStatus: 'NOT_STARTED',
            leadershipOffice: 'None',
            joinedDate: 'Registered',
            profession: 'User Account',
            chapter: 'General',
            rawStatus: 'UNREGISTERED',
            cohortNum: 0,
            officeId: 'NONE',
          });
        }
      }
    });

    // Apply Filters if provided
    if (!filter) {
      return results;
    }

    return results.filter(item => {
      if (filter.statusScope === 'VERIFIED' && item.rawStatus !== 'VERIFIED') return false;
      if (filter.statusScope === 'PENDING' && item.rawStatus !== 'PENDING') return false;
      if (filter.statusScope === 'UNREGISTERED' && item.rawStatus !== 'UNREGISTERED') return false;

      if (filter.cohortYear && filter.cohortYear !== 'ALL') {
        if (Number(item.cohortNum) !== Number(filter.cohortYear)) return false;
      }

      if (filter.officeId && filter.officeId !== 'ALL') {
        if (item.officeId !== filter.officeId) return false;
      }

      if (filter.searchTerm && filter.searchTerm.trim()) {
        const q = filter.searchTerm.trim().toLowerCase();
        const matches = 
          item.fullName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.alumniNumber.toLowerCase().includes(q) ||
          item.cohortYear.toLowerCase().includes(q) ||
          item.leadershipOffice.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  },

  // Protect against Spreadsheet Formula Injection (CWE-1236)
  sanitizeSpreadsheetCell(val: any): string {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@') || s.startsWith('\t') || s.startsWith('\r')) {
      return `'${s}`;
    }
    return s;
  },

  async exportMembersToCsv(
    filter: MemberExportFilter, 
    actor: AuthUser
  ): Promise<{ filename: string; content: string }> {
    const data = await this.getMembersForExport(filter);
    const headers = [
      'Alumni Number',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Cohort (Exit Year)',
      'Verification Status',
      'Leadership Office',
      'Date Registered',
      'Profession / Qualification',
      'Chapter Affiliation'
    ];

    const rows = data.map(m => [
      this.sanitizeSpreadsheetCell(m.alumniNumber),
      this.sanitizeSpreadsheetCell(m.fullName),
      this.sanitizeSpreadsheetCell(m.email),
      this.sanitizeSpreadsheetCell(m.phone),
      this.sanitizeSpreadsheetCell(m.cohortYear),
      this.sanitizeSpreadsheetCell(m.status),
      this.sanitizeSpreadsheetCell(m.leadershipOffice),
      this.sanitizeSpreadsheetCell(m.joinedDate),
      this.sanitizeSpreadsheetCell(m.profession),
      this.sanitizeSpreadsheetCell(m.chapter),
    ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `MOSA_Member_Register_${dateStr}.csv`;

    await this.logAudit({
      action: 'MEMBER_DATA_EXPORT_CSV',
      performedBy: actor.email,
      affectedRecord: filename,
      metadata: { filter, count: data.length }
    });

    return { filename, content: csvContent };
  },

  async exportMembersToXlsx(
    filter: MemberExportFilter, 
    actor: AuthUser
  ): Promise<{ filename: string; content: string }> {
    const data = await this.getMembersForExport(filter);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `MOSA_Member_Register_${dateStr}.xlsx`;

    // Standard XML Spreadsheet 2003 which Excel opens natively without external libraries
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0A271B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0A271B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowEven">
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="MOSA Members">
  <Table ss:DefaultColumnWidth="140">
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Alumni Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Full Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email Address</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Phone Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cohort Year</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Verification Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Leadership Office</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Registration Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Profession</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chapter</Data></Cell>
   </Row>`;

    data.forEach((m, idx) => {
      const styleId = idx % 2 === 1 ? ' ss:StyleID="RowEven"' : '';
      xml += `
   <Row${styleId}>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.alumniNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.fullName)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.email)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.phone)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.cohortYear)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.leadershipOffice)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.joinedDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.profession)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.sanitizeSpreadsheetCell(m.chapter)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    await this.logAudit({
      action: 'MEMBER_DATA_EXPORT_EXCEL',
      performedBy: actor.email,
      affectedRecord: filename,
      metadata: { filter, count: data.length }
    });

    return { filename, content: xml };
  },

  async exportMembersToPdf(
    filter: MemberExportFilter, 
    actor: AuthUser
  ): Promise<MemberPdfExportResult> {
    const data = await this.getMembersForExport(filter);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `MOSA_Member_Report_${dateStr}.pdf`;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Brand Header banner
    doc.setFillColor(10, 39, 27); // #0A271B
    doc.rect(0, 0, 297, 26, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('MANDELA OLD STUDENTS ASSOCIATION (MOSA)', 14, 11);

    doc.setFontSize(9);
    doc.setTextColor(252, 211, 77); // Gold
    doc.text('OFFICIAL MEMBER REGISTER & LEADERSHIP AUDIT REPORT', 14, 18);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleString()} | Exported by: ${actor.email}`, 14, 23);

    // Filter Summary Badge
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 30, 269, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Scope: ${filter.statusScope}  |  Cohort: ${filter.cohortYear || 'ALL'}  |  Total Records: ${data.length}`, 18, 36);

    // Table Header
    let y = 46;
    doc.setFillColor(17, 61, 43);
    doc.rect(14, y, 269, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Number', 16, y + 5.5);
    doc.text('Full Name', 45, y + 5.5);
    doc.text('Email Address', 95, y + 5.5);
    doc.text('Phone', 150, y + 5.5);
    doc.text('Cohort', 185, y + 5.5);
    doc.text('Status', 205, y + 5.5);
    doc.text('Leadership Office', 240, y + 5.5);

    y += 8;

    // Rows
    data.forEach((m, idx) => {
      if (y > 185) {
        doc.addPage();
        y = 15;
        // Repeat mini header
        doc.setFillColor(17, 61, 43);
        doc.rect(14, y, 269, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Number', 16, y + 5.5);
        doc.text('Full Name', 45, y + 5.5);
        doc.text('Email Address', 95, y + 5.5);
        doc.text('Phone', 150, y + 5.5);
        doc.text('Cohort', 185, y + 5.5);
        doc.text('Status', 205, y + 5.5);
        doc.text('Leadership Office', 240, y + 5.5);
        y += 8;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 269, 7, 'F');
      }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.text(m.alumniNumber.slice(0, 15), 16, y + 4.8);
      doc.text(m.fullName.slice(0, 25), 45, y + 4.8);
      doc.text(m.email.slice(0, 30), 95, y + 4.8);
      doc.text(m.phone.slice(0, 18), 150, y + 4.8);
      doc.text(String(m.cohortYear).slice(0, 10), 185, y + 4.8);
      doc.text(m.status.slice(0, 18), 205, y + 4.8);
      doc.text(m.leadershipOffice.slice(0, 22), 240, y + 4.8);

      y += 7;
    });

    await this.logAudit({
      action: 'MEMBER_DATA_EXPORT_PDF',
      performedBy: actor.email,
      affectedRecord: filename,
      metadata: { filter, count: data.length }
    });

    return { filename, doc };
  },

  // ==========================================
  // SECRETARIAT OFFICIAL CONTACTS (Phase 7)
  // ==========================================
  async getSecretariatContacts(onlyActive = false): Promise<SecretariatContact[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.SECRETARIAT_CONTACTS);
    let list: SecretariatContact[] = raw ? JSON.parse(raw) : defaultSeedSecretariatContacts;
    if (onlyActive) {
      list = list.filter(c => c.status === 'ACTIVE');
    }
    return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  },

  async saveSecretariatContact(contact: SecretariatContact, actorEmail = 'admin@massh.ac.ug'): Promise<SecretariatContact> {
    const list = await this.getSecretariatContacts(false);
    const existingIdx = list.findIndex(c => c.id === contact.id);
    const updated = {
      ...contact,
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx !== -1) {
      list[existingIdx] = updated;
    } else {
      if (!updated.id) updated.id = `sec-${Date.now()}`;
      list.push(updated);
    }
    safeStorage.setItem(STORAGE_KEYS.SECRETARIAT_CONTACTS, JSON.stringify(list));
    await this.logAudit({
      action: 'SECRETARIAT_CONTACT_SAVED',
      performedBy: actorEmail,
      affectedRecord: updated.name,
      metadata: { title: updated.title, phone: updated.publishedPhone, whatsApp: updated.whatsAppNumber },
    });
    return updated;
  },

  async deleteSecretariatContact(id: string, actorEmail = 'admin@massh.ac.ug'): Promise<boolean> {
    const list = await this.getSecretariatContacts(false);
    const target = list.find(c => c.id === id);
    const updated = list.filter(c => c.id !== id);
    safeStorage.setItem(STORAGE_KEYS.SECRETARIAT_CONTACTS, JSON.stringify(updated));
    if (target) {
      await this.logAudit({
        action: 'SECRETARIAT_CONTACT_DELETED',
        performedBy: actorEmail,
        affectedRecord: target.name,
        metadata: { title: target.title },
      });
    }
    return true;
  },

  // ==========================================
  // LEGACY ALUMNI PHYSICAL REGISTER (Phase 3 & 4)
  // ==========================================
  async getLegacyAlumni(): Promise<LegacyAlumniRecord[]> {
    const raw = safeStorage.getItem(STORAGE_KEYS.LEGACY_ALUMNI);
    return raw ? JSON.parse(raw) : defaultSeedLegacyAlumni;
  },

  async importLegacyAlumni(records: LegacyAlumniRecord[], actorEmail = 'admin@massh.ac.ug'): Promise<{ importedCount: number; duplicateCount: number }> {
    const current = await this.getLegacyAlumni();
    const existingNumbers = new Set(current.map(r => this.normalizeAlumniNumber(r.membershipNumber)));
    let importedCount = 0;
    let duplicateCount = 0;

    for (const rec of records) {
      const norm = this.normalizeAlumniNumber(rec.membershipNumber);
      if (existingNumbers.has(norm)) {
        duplicateCount++;
      } else {
        current.push({
          ...rec,
          id: rec.id || `leg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          membershipNumber: norm,
          importedAt: new Date().toISOString(),
          verifiedStatus: rec.verifiedStatus || 'TRUSTED',
        });
        existingNumbers.add(norm);
        importedCount++;
      }
    }

    safeStorage.setItem(STORAGE_KEYS.LEGACY_ALUMNI, JSON.stringify(current));

    // Also register legacy numbers in permanent allocation ledger
    const settings = await this.getSystemSettings();
    const usedRegistry = new Set(settings.usedMANumbersRegistry || []);
    records.forEach(r => usedRegistry.add(this.normalizeAlumniNumber(r.membershipNumber)));
    settings.usedMANumbersRegistry = Array.from(usedRegistry);
    await this.updateSystemSettings({ usedMANumbersRegistry: settings.usedMANumbersRegistry });

    await this.logAudit({
      action: 'LEGACY_ALUMNI_REGISTER_IMPORTED',
      performedBy: actorEmail,
      affectedRecord: `${importedCount} records`,
      metadata: { importedCount, duplicateCount },
    });

    return { importedCount, duplicateCount };
  },

  async saveLegacyAlumniRecord(record: LegacyAlumniRecord, actorEmail = 'admin@massh.ac.ug'): Promise<LegacyAlumniRecord> {
    const list = await this.getLegacyAlumni();
    const idx = list.findIndex(r => r.id === record.id || this.normalizeAlumniNumber(r.membershipNumber) === this.normalizeAlumniNumber(record.membershipNumber));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.push(record);
    }
    safeStorage.setItem(STORAGE_KEYS.LEGACY_ALUMNI, JSON.stringify(list));
    return record;
  },

  async deleteLegacyAlumniRecord(id: string, actorEmail = 'admin@massh.ac.ug'): Promise<boolean> {
    const list = await this.getLegacyAlumni();
    const updated = list.filter(r => r.id !== id);
    safeStorage.setItem(STORAGE_KEYS.LEGACY_ALUMNI, JSON.stringify(updated));
    return true;
  },

  // ==========================================
  // PERMANENT RECORD DELETION WITH LEDGER RETENTION (Phase 4 & 11)
  // ==========================================
  async deleteAlumnus(idOrNumber: string, actorEmail = 'admin@massh.ac.ug', reason = 'Administrative deletion'): Promise<{ success: boolean; error?: string }> {
    try {
      const list = await this.getAlumniList();
      const normTarget = this.normalizeAlumniNumber(idOrNumber);
      const target = list.find(a => a.internalId === idOrNumber || this.normalizeAlumniNumber(a.alumniNumber) === normTarget);
      if (!target) return { success: false, error: 'Alumni member not found' };

      // Number MUST remain permanently reserved in the ledger
      const settings = await this.getSystemSettings();
      const usedRegistry = new Set(settings.usedMANumbersRegistry || []);
      usedRegistry.add(this.normalizeAlumniNumber(target.alumniNumber));
      settings.usedMANumbersRegistry = Array.from(usedRegistry);
      await this.updateSystemSettings({ usedMANumbersRegistry: settings.usedMANumbersRegistry });

      // Remove from active alumni collection
      const remaining = list.filter(a => a.internalId !== target.internalId);
      safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(remaining));

      if (isFirebaseConfigured() && db) {
        try {
          await updateDoc(doc(db, 'alumni', target.internalId), {
            membershipStatus: 'INACTIVE',
            deletedAt: new Date().toISOString(),
            deletedBy: actorEmail,
            deletionReason: reason,
          });
        } catch (e) {
          console.warn('Firebase update failed during deleteAlumnus:', e);
        }
      }

      await this.logAudit({
        action: 'MEMBER_DELETED',
        performedBy: actorEmail,
        affectedRecord: target.alumniNumber,
        metadata: {
          alumnusId: target.internalId,
          alumnusName: target.fullName || `${target.firstName} ${target.lastName}`,
          permanentReservedNumber: target.alumniNumber,
          reason,
        },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete member' };
    }
  },

  // Save custom Firebase configuration
  saveFirebaseConfig(config: any): void {
    safeStorage.setItem('mosa_firebase_config', JSON.stringify(config));
    window.location.reload();
  },

  clearFirebaseConfig(): void {
    safeStorage.removeItem('mosa_firebase_config');
    window.location.reload();
  },
};
