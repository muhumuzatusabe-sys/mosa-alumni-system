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
} from '../types';
import { db, isFirebaseConfigured } from './firebase';
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
  nextAlumniNumber: 3, // Since 0001 and 0002 are seeded
  nextApplicationNumber: 125,
  prefix: 'MA.-',
  padDigits: 4,
  systemName: 'MOSA Alumni Management System',
  schoolName: 'Mandela Secondary School Hoima (MASSH)',
  establishedYear: 1997,
  usedMANumbersRegistry: ['MA. 0001', 'MA. 0002', 'MA.-0001', 'MA.-0002'],
  mobileMoneySettings: {
    mtnNumber: '0782 123456',
    mtnName: 'Mandela Old Students Association',
    airtelNumber: '0701 654321',
    airtelName: 'MOSA National Treasury',
    instructions: 'Enter your Alumni Number (e.g. MA.-0001) or Application Reference (e.g. MOSA-2026-00125) as the transaction reason.',
  },
  allowManualMANumberAssignment: true,
  autoApproveRegistrations: true,
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
    heroTitle: 'Connecting Generations of Mandela Scholars Across the Globe.',
    heroSubtitle: 'Welcome to the official alumni platform of the Mandela Old Students Association (MOSA). Reconnect with classmates, access your official membership registry, join university chapters, and support our alma mater in Hoima.',
    heroHighlightWord: 'Mandela Scholars',
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
    motto: '"Education is the Most Powerful Weapon"',
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
    phoneNumbers: ['+256 782 123456', '+256 701 654321'],
    emails: ['secretariat@mosa-massh.ac.ug', 'admin@massh.ac.ug'],
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

const defaultSeedDocuments: MOSADocument[] = [
  {
    id: 'doc-01',
    title: 'MOSA Constitution & By-Laws (Official Ratified Edition)',
    category: 'CONSTITUTION',
    description: 'The supreme governing instrument of the Mandela Old Students Association, outlining aims, membership rights, executive structures, and operational covenants.',
    fileSize: '2.4 MB',
    publishedDate: '2025-10-15',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-02',
    title: 'MOSA Annual General Meeting (AGM) Comprehensive Report',
    category: 'AGM_REPORT',
    description: 'Official record of the 2025 Annual General Meeting, featuring development reviews, executive elections, project ratifications, and member resolutions.',
    fileSize: '4.8 MB',
    publishedDate: '2025-12-28',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-03',
    title: 'Executive Circular: 2026 Homecoming & Silver Jubilee Roadmap',
    category: 'CIRCULAR',
    description: 'Official dispatch from the Secretariat detailing dates, committee coordinators, sports gala program, and banquet arrangements for the alumni homecoming.',
    fileSize: '820 KB',
    publishedDate: '2026-02-10',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-04',
    title: 'Annual Audited Financial Statements & Treasury Account',
    category: 'FINANCIAL_REPORT',
    description: 'Independent audit report on alumni subscriptions, bursary allocations, science laboratory donations, and bank account reconciliations.',
    fileSize: '1.9 MB',
    publishedDate: '2026-01-20',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: true,
  },
  {
    id: 'doc-05',
    title: 'MOSA University Chapter Guidelines & Accreditation Charter',
    category: 'MEMBERSHIP_FORM',
    description: 'Handbook for establishing, running, and getting accredited as an official MOSA campus chapter in universities across Uganda.',
    fileSize: '650 KB',
    publishedDate: '2026-01-05',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-06',
    title: 'MOSA Mentorship Charter & Professional Guidance Protocol',
    category: 'CIRCULAR',
    description: 'Code of conduct, matching mechanisms, and professional milestones for senior MASSH alumni mentors and mentees.',
    fileSize: '1.2 MB',
    publishedDate: '2026-02-15',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-07',
    title: 'Electoral Commission Guidelines & Digital Ballot Code of Conduct 2026-2028',
    category: 'AGM_REPORT',
    description: 'Statutory regulations governing the biennial national executive elections, secret digital balloting, nomination vetting, and certification protocols.',
    fileSize: '2.1 MB',
    publishedDate: '2026-03-01',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: false,
  },
  {
    id: 'doc-08',
    title: 'MOSA Strategic Plan 2025–2030 (Silver Jubilee Horizon)',
    category: 'CONSTITUTION',
    description: 'Five-year institutional blueprint focusing on campus infrastructure modernization, student bursary endowments, and regional chapter growth.',
    fileSize: '3.6 MB',
    publishedDate: '2025-11-20',
    downloadUrl: '#',
    fileType: 'PDF Document',
    isRestrictedToMembers: true,
  },
];

const defaultSeedOpportunities: OpportunityItem[] = [
  {
    id: 'opp-01',
    title: 'Senior Medical Officer & Clinical Specialist',
    type: 'JOB',
    organisation: 'Hoima Regional Referral Hospital',
    description: 'Leading clinical department rounds, emergency diagnosis, and medical internship mentorship in Bunyoro sub-region.',
    requirements: 'MBChB degree with minimum 3 years post-internship experience. Fully registered with Uganda Medical and Dental Practitioners Council (UMDPC).',
    skills: ['Internal Medicine', 'Clinical Leadership', 'Emergency Care', 'Mentorship'],
    location: 'Hoima City',
    country: 'Uganda',
    workplaceType: 'ON_SITE',
    deadline: '2026-11-30',
    contactPerson: 'Dr. Muhammad Z. (Class of 2002)',
    contactEmail: 'clinical@hoimahospital.go.ug',
    postedBy: {
      name: 'Dr. Muhammad Z.',
      email: 'muhammad.z@alumni.massh.ac.ug',
      alumniNumber: 'MA. 0001',
      role: 'ALUMNI',
    },
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    createdAt: '2026-09-15',
    publishedAt: '2026-09-15',
    viewsCount: 142,
    applicationsCount: 8,
  },
  {
    id: 'opp-02',
    title: 'Civil Infrastructure & Road Systems Graduate Residency',
    type: 'INTERNSHIP',
    organisation: 'Uganda National Roads Authority (UNRA)',
    description: 'Hands-on engineering residency working on the Albertine Region oil corridor network, bridge design, and drainage infrastructure.',
    requirements: 'BSc in Civil Engineering or Construction Management. Recent MASSH graduate or final year university student.',
    skills: ['AutoCAD', 'Topographical Surveying', 'Structural Design', 'Highway Engineering'],
    location: 'Hoima - Butiaba Corridor',
    country: 'Uganda',
    workplaceType: 'ON_SITE',
    deadline: '2026-12-15',
    contactPerson: 'Eng. Grace Akiiki (Class of 2004)',
    contactEmail: 'infrastructure@unra.go.ug',
    postedBy: {
      name: 'Eng. Grace Akiiki',
      email: 'grace.akiiki@alumni.massh.ac.ug',
      alumniNumber: 'MA. 0002',
      role: 'ALUMNI',
    },
    visibility: 'MEMBERS_ONLY',
    status: 'PUBLISHED',
    createdAt: '2026-09-20',
    publishedAt: '2026-09-20',
    viewsCount: 215,
    applicationsCount: 19,
  },
  {
    id: 'opp-03',
    title: 'Commonwealth Master’s & Doctoral Scholarships 2027',
    type: 'SCHOLARSHIP',
    organisation: 'Commonwealth Scholarship Commission (UK)',
    description: 'Fully funded postgraduate scholarships for MASSH alumni seeking to undertake Master’s or PhD studies in top United Kingdom universities.',
    requirements: 'Upper Second Class Bachelor’s degree or first class honours. Relevant fields in STEM, Public Policy, Healthcare, or Law.',
    skills: ['Academic Research', 'Proposal Writing', 'English Proficiency'],
    location: 'United Kingdom Universities',
    country: 'United Kingdom',
    workplaceType: 'ON_SITE',
    deadline: '2026-12-31',
    externalUrl: 'https://cscuk.fcdo.gov.uk/apply/',
    applicationInstructions: 'Apply via the official CSCUK portal and contact MOSA Academic Committee for letter of recommendation.',
    postedBy: {
      name: 'MOSA Academic Committee',
      email: 'admin@massh.ac.ug',
      role: 'ADMIN',
    },
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    createdAt: '2026-10-01',
    publishedAt: '2026-10-01',
    viewsCount: 389,
    applicationsCount: 34,
  },
  {
    id: 'opp-04',
    title: 'Senior Full-Stack TypeScript & Cloud Developer',
    type: 'JOB',
    organisation: 'NileTech Digital Solutions',
    description: 'Building secure fintech and distributed cloud web platforms for East African financial institutions.',
    requirements: 'Proficiency in React, TypeScript, Node.js, PostgreSQL, Docker, and AWS. Minimum 3 years building web applications.',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    location: 'Kampala / Remote',
    country: 'Uganda',
    workplaceType: 'HYBRID',
    deadline: '2026-11-20',
    contactPerson: 'Joan Asiimwe (Class of 2010)',
    contactEmail: 'careers@niletech.ug',
    postedBy: {
      name: 'Joan Asiimwe',
      email: 'joan.a@alumni.massh.ac.ug',
      alumniNumber: 'MA. 0004',
      role: 'ALUMNI',
    },
    visibility: 'MEMBERS_ONLY',
    status: 'PUBLISHED',
    createdAt: '2026-10-02',
    publishedAt: '2026-10-02',
    viewsCount: 178,
    applicationsCount: 12,
  },
  {
    id: 'opp-05',
    title: 'Bunyoro Kitara Agribusiness Venture Incubation Fellowship',
    type: 'ENTREPRENEURSHIP',
    organisation: 'Bunyoro Agribusiness Innovation Trust',
    description: 'Seed grant funding of up to UGX 15,000,000, laboratory testing, and 6 months mentorship for alumni founding agro-processing enterprises.',
    requirements: 'Verified MOSA member with viable agribusiness concept in coffee, grain milling, honey, or horticulture.',
    skills: ['Agribusiness', 'Financial Modeling', 'Value Addition', 'Supply Chain'],
    location: 'Hoima / Masindi / Kikuube',
    country: 'Uganda',
    workplaceType: 'HYBRID',
    deadline: '2026-12-10',
    postedBy: {
      name: 'Secretariat Team',
      email: 'admin@massh.ac.ug',
      role: 'ADMIN',
    },
    visibility: 'MEMBERS_ONLY',
    status: 'PUBLISHED',
    createdAt: '2026-10-06',
    publishedAt: '2026-10-06',
    viewsCount: 95,
    applicationsCount: 7,
  },
];

const defaultSeedMentors: MentorProfile[] = [
  {
    id: 'mentor-01',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    fullName: 'Dr. Muhammad Zatusave',
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
    email: 'muhammad.z@alumni.massh.ac.ug',
    phone: '+256 782 111 222',
    professionalField: 'Medicine & Surgery',
    currentRole: 'Senior Consultant Surgeon',
    organisation: 'Hoima Regional Referral Hospital',
    yearsExperience: 18,
    areasOfExpertise: ['Surgical Practice', 'Hospital Administration', 'Medical School Mentorship', 'Clinical Research'],
    skills: ['Surgery', 'Clinical Diagnostics', 'Healthcare Leadership'],
    mentorshipAreas: ['Career Guidance', 'Medical School Prep', 'Public Health Research'],
    preferredMenteeInterests: ['Medical Students', 'Clinical Officers', 'Junior Doctors'],
    availability: 'AVAILABLE',
    maxMentees: 5,
    currentMenteesCount: 2,
    location: 'Hoima, Uganda',
    format: 'HYBRID',
    status: 'ACTIVE',
    bio: 'MASSH Pioneer (Class of 2002). Passionate about mentoring the next generation of healthcare professionals across Uganda.',
    createdAt: '2026-08-01',
  },
  {
    id: 'mentor-02',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    fullName: 'Eng. Grace Akiiki',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    email: 'grace.akiiki@alumni.massh.ac.ug',
    phone: '+256 772 333 444',
    professionalField: 'Civil & Structural Engineering',
    currentRole: 'Principal Infrastructure Engineer',
    organisation: 'UNRA Albertine Corridor Project',
    yearsExperience: 14,
    areasOfExpertise: ['Highway Engineering', 'FIDIC Contracts', 'Project Management', 'Women in STEM'],
    skills: ['Structural Design', 'Highway Engineering', 'Project Management'],
    mentorshipAreas: ['ERB Professional Licensure', 'Women in Engineering', 'Graduate Transition'],
    preferredMenteeInterests: ['Engineering Undergraduates', 'Junior Site Engineers', 'Surveyors'],
    availability: 'AVAILABLE',
    maxMentees: 4,
    currentMenteesCount: 1,
    location: 'Kampala / Hoima',
    format: 'ONLINE',
    status: 'ACTIVE',
    bio: 'Class of 2004 (PEM). ERB registered civil engineer committed to advancing technical and infrastructure careers for alumni.',
    createdAt: '2026-08-10',
  },
  {
    id: 'mentor-03',
    alumniId: 'alumni-0003',
    alumniNumber: 'MA. 0003',
    fullName: 'Adv. Emmanuel Byaruhanga',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    email: 'emmanuel.b@alumni.massh.ac.ug',
    phone: '+256 701 555 666',
    professionalField: 'Law & Corporate Governance',
    currentRole: 'Managing Partner',
    organisation: 'Byaruhanga & Advocates',
    yearsExperience: 12,
    areasOfExpertise: ['Corporate Law', 'Commercial Arbitration', 'Land Rights in Bunyoro', 'LDC Bar Coaching'],
    skills: ['Advocacy', 'Legal Research', 'Arbitration', 'Contract Law'],
    mentorshipAreas: ['LDC Bar Exam Strategy', 'Law Firm Practice', 'Judicial Clerkship'],
    preferredMenteeInterests: ['Law Students (LLB)', 'LDC Bar Candidates', 'Pupils'],
    availability: 'LIMITED',
    maxMentees: 3,
    currentMenteesCount: 2,
    location: 'Kampala, Uganda',
    format: 'HYBRID',
    status: 'ACTIVE',
    bio: 'Class of 2006 (HEL). Senior advocate dedicated to guiding aspiring lawyers through the rigors of bar exams and legal practice.',
    createdAt: '2026-08-15',
  },
  {
    id: 'mentor-04',
    alumniId: 'alumni-0004',
    alumniNumber: 'MA. 0004',
    fullName: 'Joan Asiimwe',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    email: 'joan.a@alumni.massh.ac.ug',
    phone: '+256 788 777 888',
    professionalField: 'Technology & Cloud Engineering',
    currentRole: 'Head of Engineering',
    organisation: 'AfriTech Digital Innovations',
    yearsExperience: 10,
    areasOfExpertise: ['Cloud Architecture', 'TypeScript/React', 'DevOps & CI/CD', 'Global Remote Careers'],
    skills: ['TypeScript', 'Python', 'AWS', 'System Design'],
    mentorshipAreas: ['Global Remote Job Search', 'GitHub Portfolio Review', 'Tech Interview Prep'],
    preferredMenteeInterests: ['Software Developers', 'CS Undergraduates', 'Tech Career Switchers'],
    availability: 'AVAILABLE',
    maxMentees: 6,
    currentMenteesCount: 3,
    location: 'Nairobi / Remote',
    format: 'ONLINE',
    status: 'ACTIVE',
    bio: 'Class of 2010 (PCB/M). Passionate about empowering African software engineers to excel in global engineering organizations.',
    createdAt: '2026-09-01',
  },
];

const defaultSeedElections: ElectionCycle[] = [
  {
    id: 'elec-2026',
    title: 'MOSA National Executive Committee (NEC) General Elections 2026 – 2028',
    theme: 'Consolidating 30 Years of Mandela Excellence • Integrity, Unity & Service',
    description: 'Official biennial digital elections for the executive leadership of the Mandela Old Students Association. All verified alumni in good standing are entitled to cast one secret verifiable ballot for each executive portfolio.',
    term: '2026 – 2028',
    status: 'VOTING_ACTIVE',
    nominationDeadline: '2026-10-01',
    votingStartDate: '2026-10-05',
    votingEndDate: '2026-10-31',
    eligibleVotersCount: 450,
    totalBallotsCast: 184,
    quorumRequiredPercentage: 25,
    positions: [
      { id: 'pos-pres', title: 'MOSA Association President / Chairperson', description: 'Chief Executive Officer representing the alumni body to the MASSH Board of Governors, Headteacher, and national partners.', maxSelect: 1, order: 1 },
      { id: 'pos-vp', title: 'Vice President', description: 'Deputizes the President and leads university and regional chapter liaison affairs.', maxSelect: 1, order: 2 },
      { id: 'pos-sec', title: 'Secretary General', description: 'Custodian of the permanent registry, official communications, AGM records, and executive circulars.', maxSelect: 1, order: 3 },
      { id: 'pos-tres', title: 'Honorary National Treasurer', description: 'Oversees membership dues treasury, annual audits, science lab campaigns, and financial integrity.', maxSelect: 1, order: 4 },
      { id: 'pos-pub', title: 'Publicity & Communications Secretary', description: 'Leads digital platforms, media outreach, campus archives, and alumni spotlights.', maxSelect: 1, order: 5 },
      { id: 'pos-ment', title: 'Academic & Mentorship Secretary', description: 'Coordinates scholarship funds, university chapter symposia, and graduate career placements.', maxSelect: 1, order: 6 },
    ],
    createdAt: '2026-09-01',
  },
];

const defaultSeedCandidates: Candidate[] = [
  {
    id: 'cand-01',
    electionId: 'elec-2026',
    positionId: 'pos-pres',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    fullName: 'Dr. Muhammad Zatusave',
    cohort: 'Class of 2002 (Pioneer)',
    profession: 'Senior Consultant Surgeon',
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
    manifesto: 'Elevate MASSH infrastructure with a transparent UGX 500M Science Lab Fund, diaspora chapter alliances, and student healthcare schemes.',
    seconderName: 'Adv. Emmanuel Byaruhanga (MA. 0003)',
    seconderAlumniNumber: 'MA. 0003',
    status: 'APPROVED',
    votesCount: 104,
    nominatedAt: '2026-09-12',
  },
  {
    id: 'cand-02',
    electionId: 'elec-2026',
    positionId: 'pos-pres',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    fullName: 'Eng. Grace Akiiki',
    cohort: 'Class of 2004 (PEM)',
    profession: 'Principal Infrastructure Engineer',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    manifesto: 'Modernize STEM laboratories, establish incubator hubs for university chapters, and guarantee transparent audited financial governance.',
    seconderName: 'Joan Asiimwe (MA. 0004)',
    seconderAlumniNumber: 'MA. 0004',
    status: 'APPROVED',
    votesCount: 80,
    nominatedAt: '2026-09-14',
  },
  {
    id: 'cand-03',
    electionId: 'elec-2026',
    positionId: 'pos-vp',
    alumniId: 'alumni-0003',
    alumniNumber: 'MA. 0003',
    fullName: 'Adv. Emmanuel Byaruhanga',
    cohort: 'Class of 2006 (HEL)',
    profession: 'Managing Partner, Byaruhanga & Advocates',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    manifesto: 'Expand chapter mobilization across East Africa and establish a free legal advisory desk for alumni entrepreneurs and innovators.',
    seconderName: 'Dr. Muhammad Zatusave (MA. 0001)',
    seconderAlumniNumber: 'MA. 0001',
    status: 'APPROVED',
    votesCount: 112,
    nominatedAt: '2026-09-15',
  },
  {
    id: 'cand-04',
    electionId: 'elec-2026',
    positionId: 'pos-vp',
    alumniId: 'alumni-0006',
    alumniNumber: 'MA. 0006',
    fullName: 'Robert Magezi',
    cohort: 'Class of 2008 (MEG)',
    profession: 'Senior Regional Planner',
    manifesto: 'Strengthen grassroots Bunyoro regional chapters, revive inter-house sports galas, and mobilize rural alumni networks.',
    seconderName: 'Eng. Grace Akiiki (MA. 0002)',
    seconderAlumniNumber: 'MA. 0002',
    status: 'APPROVED',
    votesCount: 72,
    nominatedAt: '2026-09-16',
  },
  {
    id: 'cand-05',
    electionId: 'elec-2026',
    positionId: 'pos-sec',
    alumniId: 'alumni-0004',
    alumniNumber: 'MA. 0004',
    fullName: 'Joan Asiimwe',
    cohort: 'Class of 2010 (PCB/M)',
    profession: 'Head of Engineering, AfriTech',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    manifesto: '100% digital registry automation, instant QR membership cards, real-time AGM broadcasts, and tamper-proof archival records.',
    seconderName: 'Dr. Muhammad Zatusave (MA. 0001)',
    seconderAlumniNumber: 'MA. 0001',
    status: 'APPROVED',
    votesCount: 138,
    nominatedAt: '2026-09-18',
  },
  {
    id: 'cand-06',
    electionId: 'elec-2026',
    positionId: 'pos-tres',
    alumniId: 'alumni-0005',
    alumniNumber: 'MA. 0005',
    fullName: 'Caleb Mbabazi',
    cohort: 'Class of 2005 (BCM)',
    profession: 'Senior Audit Manager (CPA)',
    manifesto: 'Zero-loss treasury controls, instant Mobile Money automated receipts, quarterly public financial dashboards, and high treasury bond returns.',
    seconderName: 'Adv. Emmanuel Byaruhanga (MA. 0003)',
    seconderAlumniNumber: 'MA. 0003',
    status: 'APPROVED',
    votesCount: 156,
    nominatedAt: '2026-09-18',
  },
  {
    id: 'cand-07',
    electionId: 'elec-2026',
    positionId: 'pos-pub',
    alumniId: 'alumni-0007',
    alumniNumber: 'MA. 0007',
    fullName: 'Gloria Kemigisa',
    cohort: 'Class of 2014 (Arts)',
    profession: 'Broadcast Media Specialist',
    manifesto: 'Elevate the MOSA brand through national media partnerships, monthly alumni spotlight videos, and interactive digital circulars.',
    seconderName: 'Joan Asiimwe (MA. 0004)',
    seconderAlumniNumber: 'MA. 0004',
    status: 'APPROVED',
    votesCount: 149,
    nominatedAt: '2026-09-20',
  },
  {
    id: 'cand-08',
    electionId: 'elec-2026',
    positionId: 'pos-ment',
    alumniId: 'alumni-0009',
    alumniNumber: 'MA. 0009',
    fullName: 'Dr. Andrew Kasaija',
    cohort: 'Class of 2007 (PCB)',
    profession: 'Senior University Lecturer',
    manifesto: 'Place 500 MASSH graduates in vetted internships, organize annual career symposia, and secure international postgraduate scholarships.',
    seconderName: 'Dr. Muhammad Zatusave (MA. 0001)',
    seconderAlumniNumber: 'MA. 0001',
    status: 'APPROVED',
    votesCount: 161,
    nominatedAt: '2026-09-21',
  },
];


const defaultSeedUsers: AuthUser[] = [
  {
    uid: 'admin-super-01',
    email: 'admin@massh.ac.ug',
    role: 'SUPER_ADMIN',
    displayName: 'Head of ICT / MOSA Admin',
  },
  { uid: 'staff-secretary-01', email: 'secretary@massh.ac.ug', role: 'SECRETARY', displayName: 'MOSA Secretary General', active: true },
  { uid: 'staff-treasurer-01', email: 'treasurer@massh.ac.ug', role: 'TREASURER', displayName: 'MOSA Honorary Treasurer', active: true },
  { uid: 'staff-publicity-01', email: 'publicity@massh.ac.ug', role: 'PUBLICITY', displayName: 'MOSA Publicity Secretary', active: true },
  {
    uid: 'alumni-user-0001',
    email: 'muhammad.z@alumni.massh.ac.ug',
    role: 'ALUMNI',
    displayName: 'Muhammad Zatusave',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
  },
];

const defaultSeedAlumni: AlumniProfile[] = [
  {
    internalId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    firstName: 'Muhammad',
    middleName: 'K.',
    lastName: 'Zatusave',
    nickname: 'Bulldozer',
    gender: 'Male',
    dateOfBirth: '2001-05-14',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    phone: '+256 701 234567',
    email: 'muhammad.z@alumni.massh.ac.ug',
    country: 'Uganda',
    city: 'Kampala',
    address: 'Plot 14, Kololo Heights',
    linkedIn: 'https://linkedin.com/in/muhammad-zatusave',
    socialLink: 'https://twitter.com/zatusave',
    currentInstitution: 'Makerere University (Alum)',
    programme: 'BSc. Civil Engineering',
    highestQualification: "Bachelor's Degree",
    occupation: 'Lead Infrastructure Engineer',
    organisation: 'Uganda National Roads Authority (UNRA)',
    position: 'Senior Project Engineer',
    bio: 'Proud MASSH alumnus. Passionate about road infrastructure development, student mentorship, and Hoima community initiatives.',
    schoolHistory: {
      attendedOLevel: true,
      oLevel: {
        yearJoined: 2017,
        yearCompleted: 2020,
        campus: 'Main Campus Hoima',
        class: 'Senior 4',
        stream: 'Blue Stream',
      },
      attendedALevel: true,
      aLevel: {
        yearJoined: 2021,
        yearCompleted: 2022,
        campus: 'Main Campus Hoima',
        class: 'Senior 6',
        combination: 'PCM/ICT (Physics, Chemistry, Maths, ICT)',
      },
    },
    privacySettings: {
      showName: true,
      showNickname: true,
      showProfession: true,
      showOrganisation: true,
      showCountry: true,
      showPhone: false,
      showEmail: false,
    },
    membershipStatus: 'ACTIVE',
    createdAt: '2023-01-15T09:00:00.000Z',
    updatedAt: '2023-01-15T09:00:00.000Z',
    verifiedAt: '2023-01-15T10:30:00.000Z',
    verifiedBy: 'admin@massh.ac.ug',
    applicationId: 'seed-app-0001',
  },
  {
    internalId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    firstName: 'Grace',
    middleName: 'Mary',
    lastName: 'Akiiki',
    nickname: 'Queen of Science',
    gender: 'Female',
    dateOfBirth: '2002-09-19',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    phone: '+256 772 987654',
    email: 'grace.akiiki@alumni.massh.ac.ug',
    country: 'Uganda',
    city: 'Hoima',
    address: 'Hospital Road, Hoima City',
    linkedIn: 'https://linkedin.com/in/grace-akiiki',
    currentInstitution: 'Mbarara University of Science & Technology',
    programme: 'Bachelor of Medicine & Surgery (MBChB)',
    highestQualification: 'Medical Degree',
    occupation: 'Medical Doctor',
    organisation: 'Hoima Regional Referral Hospital',
    position: 'Medical Officer',
    bio: 'Dedicated to rural maternal healthcare in Bunyoro sub-region. MASSH gave me the discipline to pursue medicine.',
    schoolHistory: {
      attendedOLevel: true,
      oLevel: {
        yearJoined: 2018,
        yearCompleted: 2021,
        campus: 'Main Campus Hoima',
        class: 'Senior 4',
        stream: 'Green Stream',
      },
      attendedALevel: true,
      aLevel: {
        yearJoined: 2022,
        yearCompleted: 2023,
        campus: 'Main Campus Hoima',
        class: 'Senior 6',
        combination: 'BCM/Sub-Maths (Biology, Chemistry, Maths)',
      },
    },
    privacySettings: {
      showName: true,
      showNickname: true,
      showProfession: true,
      showOrganisation: true,
      showCountry: true,
      showPhone: true,
      showEmail: false,
    },
    membershipStatus: 'ACTIVE',
    createdAt: '2024-02-10T11:00:00.000Z',
    updatedAt: '2024-02-10T11:00:00.000Z',
    verifiedAt: '2024-02-10T14:20:00.000Z',
    verifiedBy: 'admin@massh.ac.ug',
    applicationId: 'seed-app-0002',
  },
];

const defaultSeedApplications: AlumniApplication[] = [
  {
    id: 'app-pending-01',
    firstName: 'Patrick',
    middleName: 'Bagonza',
    lastName: 'Mugisa',
    nickname: 'Speedy',
    gender: 'Male',
    dateOfBirth: '2003-02-10',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    phone: '+256 788 112233',
    email: 'pmugisa.tech@gmail.com',
    country: 'Uganda',
    city: 'Kampala',
    address: 'Ntinda, Kampala',
    linkedIn: 'https://linkedin.com/in/pmugisa',
    currentInstitution: 'Kyambogo University',
    programme: 'BSc. Computer Science',
    highestQualification: "Bachelor's Degree",
    occupation: 'Software Developer',
    organisation: 'FinTech Africa Hoima Branch',
    position: 'Full-stack Engineer',
    bio: 'Software engineer passionate about building community software for Hoima youth. MASSH S4 & S6 alum.',
    schoolHistory: {
      attendedOLevel: true,
      oLevel: {
        yearJoined: 2016,
        yearCompleted: 2019,
        campus: 'Main Campus Hoima',
        class: 'Senior 4',
        stream: 'Yellow Stream',
      },
      attendedALevel: true,
      aLevel: {
        yearJoined: 2020,
        yearCompleted: 2021,
        campus: 'Main Campus Hoima',
        class: 'Senior 6',
        combination: 'MEG (Mathematics, Economics, Geography)',
      },
    },
    privacySettings: {
      showName: true,
      showNickname: true,
      showProfession: true,
      showOrganisation: true,
      showCountry: true,
      showPhone: false,
      showEmail: false,
    },
    status: 'PENDING',
    submittedAt: '2026-10-01T08:30:00.000Z',
    updatedAt: '2026-10-01T08:30:00.000Z',
  },
  {
    id: 'app-underreview-02',
    firstName: 'Daphne',
    lastName: 'Kembabazi',
    nickname: 'DJ Daph',
    gender: 'Female',
    dateOfBirth: '2004-11-05',
    phone: '+256 755 443322',
    email: 'daphnekembabazi@gmail.com',
    country: 'Uganda',
    city: 'Entebbe',
    occupation: 'Financial Analyst',
    organisation: 'Stanbic Bank Uganda',
    position: 'Graduate Associate',
    schoolHistory: {
      attendedOLevel: false,
      attendedALevel: true,
      aLevel: {
        yearJoined: 2021,
        yearCompleted: 2022,
        campus: 'Main Campus Hoima',
        class: 'Senior 6',
        combination: 'HEL/Div (History, Economics, Literature)',
      },
    },
    privacySettings: {
      showName: true,
      showNickname: true,
      showProfession: true,
      showOrganisation: true,
      showCountry: true,
      showPhone: false,
      showEmail: false,
    },
    status: 'UNDER_REVIEW',
    reviewNotes: 'Verified with MASSH 2022 A-Level class registers. Ready for final committee approval.',
    submittedAt: '2026-10-02T11:15:00.000Z',
    updatedAt: '2026-10-02T15:45:00.000Z',
    reviewedBy: 'admin@massh.ac.ug',
  },
];

const defaultSeedAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    action: 'SYSTEM_INITIALIZED',
    performedBy: 'SYSTEM',
    affectedRecord: 'SYSTEM_SETTINGS',
    timestamp: '2026-10-01T00:00:00.000Z',
    metadata: { note: 'Mandela Old Students Association (MOSA) portal initialized for MASSH (Est. 1997).' },
  },
  {
    id: 'log-002',
    action: 'APPLICATION_APPROVED',
    performedBy: 'admin@massh.ac.ug',
    affectedRecord: 'MA. 0001',
    timestamp: '2023-01-15T10:30:00.000Z',
    metadata: { applicant: 'Muhammad Zatusave', alumniNumber: 'MA. 0001' },
  },
  {
    id: 'log-003',
    action: 'APPLICATION_APPROVED',
    performedBy: 'admin@massh.ac.ug',
    affectedRecord: 'MA. 0002',
    timestamp: '2024-02-10T14:20:00.000Z',
    metadata: { applicant: 'Grace Mary Akiiki', alumniNumber: 'MA. 0002' },
  },
];

const defaultSeedChapters: Chapter[] = [
  {
    id: 'chap-01',
    code: 'MUMASA',
    name: 'Makerere University Mandela Old Students Association',
    institution: 'Makerere University',
    location: 'Kampala',
    country: 'Uganda',
    status: 'ACTIVE',
    description: 'The premier university chapter uniting MASSH alumni pursuing undergraduate and postgraduate programmes at Makerere University.',
    adminEmails: ['admin@massh.ac.ug', 'muhammad.z@alumni.massh.ac.ug'],
    leaderName: 'Muhammad Zatusave',
    leaderContact: '+256 701 234567',
    memberCount: 1,
    createdAt: '2023-02-01T10:00:00.000Z',
    updatedAt: '2023-02-01T10:00:00.000Z',
  },
  {
    id: 'chap-02',
    code: 'KYUMASA',
    name: 'Kyambogo University Mandela Old Students Association',
    institution: 'Kyambogo University',
    location: 'Kampala',
    country: 'Uganda',
    status: 'ACTIVE',
    description: 'Active chapter supporting engineering, education, and vocational sciences students from MASSH at Kyambogo University.',
    adminEmails: ['admin@massh.ac.ug'],
    leaderName: 'Patrick Mugisa',
    leaderContact: '+256 788 112233',
    memberCount: 0,
    createdAt: '2023-02-15T11:00:00.000Z',
    updatedAt: '2023-02-15T11:00:00.000Z',
  },
  {
    id: 'chap-03',
    code: 'MBUMASA',
    name: 'Mbarara University Mandela Old Students Association',
    institution: 'Mbarara University of Science & Technology (MUST)',
    location: 'Mbarara',
    country: 'Uganda',
    status: 'ACTIVE',
    description: 'Chapter for MASSH alumni in western Uganda pursuing medicine, pharmacy, nursing, and science degrees at MUST.',
    adminEmails: ['admin@massh.ac.ug', 'grace.akiiki@alumni.massh.ac.ug'],
    leaderName: 'Dr. Grace Mary Akiiki',
    leaderContact: '+256 772 987654',
    memberCount: 1,
    createdAt: '2024-03-01T09:00:00.000Z',
    updatedAt: '2024-03-01T09:00:00.000Z',
  },
  {
    id: 'chap-04',
    code: 'GUMASA',
    name: 'Gulu University Mandela Old Students Association',
    institution: 'Gulu University',
    location: 'Gulu',
    country: 'Uganda',
    status: 'ACTIVE',
    description: 'Northern Uganda chapter for MASSH alumni pursuing biosystems, business, and medicine at Gulu University.',
    adminEmails: ['admin@massh.ac.ug'],
    memberCount: 0,
    createdAt: '2024-04-10T12:00:00.000Z',
    updatedAt: '2024-04-10T12:00:00.000Z',
  },
  {
    id: 'chap-05',
    code: 'NKUMASA',
    name: 'Nkumba University Mandela Old Students Association',
    institution: 'Nkumba University',
    location: 'Entebbe',
    country: 'Uganda',
    status: 'ACTIVE',
    description: 'Entebbe / Wakiso chapter connecting MASSH alumni pursuing law, business, and applied sciences.',
    adminEmails: ['admin@massh.ac.ug'],
    memberCount: 0,
    createdAt: '2024-05-20T14:00:00.000Z',
    updatedAt: '2024-05-20T14:00:00.000Z',
  },
];

const defaultSeedChapterMembers: ChapterMember[] = [
  {
    id: 'cm-01',
    chapterId: 'chap-01',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    alumniName: 'Muhammad Zatusave',
    alumniEmail: 'muhammad.z@alumni.massh.ac.ug',
    roleInChapter: 'LEADER',
    joinedAt: '2023-02-01T10:00:00.000Z',
    status: 'ACTIVE',
  },
  {
    id: 'cm-02',
    chapterId: 'chap-03',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    alumniName: 'Grace Mary Akiiki',
    alumniEmail: 'grace.akiiki@alumni.massh.ac.ug',
    roleInChapter: 'LEADER',
    joinedAt: '2024-03-01T09:00:00.000Z',
    status: 'ACTIVE',
  },
];

const defaultSeedEvents: MOSAEvent[] = [
  {
    id: 'evt-01',
    title: 'MASSH Grand Alumni Convention & Dinner 2026',
    description: 'The annual flagship gathering of all Mandela Secondary School Hoima alumni, celebrating school traditions, presenting alumni awards, and inaugurating new development projects.',
    eventType: 'ANNUAL_CONVENTION',
    date: '2026-12-18',
    startTime: '14:00',
    endTime: '22:00',
    venue: 'Main Campus Hall & Sports Grounds, MASSH Hoima',
    registrationDeadline: '2026-12-15',
    registrationRequirement: 'REGISTRATION_REQUIRED',
    eventImage: '/images/massh-courtyard-briefing.jpg',
    status: 'UPCOMING',
    registeredCount: 2,
    attendedCount: 0,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
  {
    id: 'evt-02',
    title: 'Silver Jubilee Cohort Reunion (2000–2010)',
    description: 'Special reunion commemorating the pioneer classes of MASSH. An evening of nostalgia, networking, and memory sharing.',
    eventType: 'REUNION',
    date: '2026-11-28',
    startTime: '16:00',
    endTime: '21:00',
    venue: 'Miika Eco Resort Hotel, Hoima',
    registrationDeadline: '2026-11-25',
    registrationRequirement: 'REGISTRATION_REQUIRED',
    eventImage: '/images/massh-gate-welcoming.jpg',
    status: 'UPCOMING',
    registeredCount: 1,
    attendedCount: 0,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
  {
    id: 'evt-03',
    title: 'Bunyoro Youth STEM & Career Mentorship Day',
    description: 'MOSA professionals return to MASSH to mentor current S4 and S6 students in engineering, medicine, ICT, law, and entrepreneurship.',
    eventType: 'MENTORSHIP',
    date: '2026-10-24',
    startTime: '09:00',
    endTime: '15:00',
    venue: 'MASSH Science Complex & ICT Laboratories',
    registrationRequirement: 'OPEN',
    eventImage: '/images/massh-science-lab-inspection.jpg',
    status: 'UPCOMING',
    registeredCount: 1,
    attendedCount: 0,
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-15T12:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
  {
    id: 'evt-04',
    title: 'MOSA 2025 Annual Homecoming & Silver Jubilee Assembly',
    description: 'The commemorative homecoming session bringing together alumni cohorts from 1997 to 2024 at MASSH Main Campus.',
    eventType: 'GENERAL_MEETING',
    date: '2025-12-20',
    startTime: '10:00',
    endTime: '17:00',
    venue: 'MASSH Main Assembly Hall, Hoima',
    registrationRequirement: 'REGISTRATION_REQUIRED',
    eventImage: '/images/massh-vip-convoy-arrival.jpg',
    status: 'COMPLETED',
    registeredCount: 38,
    attendedCount: 32,
    createdAt: '2025-11-01T08:00:00.000Z',
    updatedAt: '2025-12-21T09:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
];

const defaultSeedEventRegistrations: EventRegistration[] = [
  {
    id: 'reg-01',
    eventId: 'evt-01',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    alumniName: 'Muhammad Zatusave',
    alumniEmail: 'muhammad.z@alumni.massh.ac.ug',
    registeredAt: '2026-09-05T09:00:00.000Z',
    qrCheckInToken: 'QR-evt-01-MA. 0001-1725526800000',
    status: 'REGISTERED',
  },
  {
    id: 'reg-02',
    eventId: 'evt-01',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    alumniName: 'Grace Mary Akiiki',
    alumniEmail: 'grace.akiiki@alumni.massh.ac.ug',
    registeredAt: '2026-09-06T11:00:00.000Z',
    qrCheckInToken: 'QR-evt-01-MA. 0002-1725620400000',
    status: 'REGISTERED',
  },
  {
    id: 'reg-03',
    eventId: 'evt-02',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    alumniName: 'Muhammad Zatusave',
    alumniEmail: 'muhammad.z@alumni.massh.ac.ug',
    registeredAt: '2026-09-12T14:00:00.000Z',
    qrCheckInToken: 'QR-evt-02-MA. 0001-1726150000000',
    status: 'REGISTERED',
  },
];

const defaultSeedEventAttendance: EventAttendance[] = [
  {
    id: 'att-01',
    eventId: 'evt-04',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    alumniName: 'Muhammad Zatusave',
    checkedInAt: '2025-12-20T10:15:00.000Z',
    checkedInBy: 'admin@massh.ac.ug',
    checkInMethod: 'QR_SCAN',
  },
  {
    id: 'att-02',
    eventId: 'evt-04',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    alumniName: 'Grace Mary Akiiki',
    checkedInAt: '2025-12-20T10:28:00.000Z',
    checkedInBy: 'admin@massh.ac.ug',
    checkInMethod: 'MANUAL_ADMIN',
  },
];

const defaultSeedCampaigns: DonationCampaign[] = [
  {
    id: 'camp-01',
    title: 'MASSH Science Laboratory Complex Expansion',
    description: 'Upgrading physics, chemistry, and biology laboratories with modern digital apparatus, spectrophotometers, and reagents for O & A-Level candidates. Foundation stone laid by Hon. Fred Byamukama, MP & Minister of Works on 26th Sept, 2026.',
    targetAmount: 45000000,
    raisedAmount: 18500000,
    donorCount: 38,
    category: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    coverImage: '/images/massh-foundation-stone-unveiled.jpg',
    startDate: '2026-01-10T00:00:00.000Z',
    createdAt: '2026-01-10T00:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
  {
    id: 'camp-02',
    title: 'MOSA Needy & Brilliant Student Bursary Endowment',
    description: 'Sponsoring school fees, uniforms, and scholastic materials for orphans and underprivileged students from Bunyoro sub-region admitted to MASSH.',
    targetAmount: 25000000,
    raisedAmount: 12000000,
    donorCount: 52,
    category: 'BURSARY',
    status: 'ACTIVE',
    coverImage: '/images/massh-flag-unveiling-ceremony.jpg',
    startDate: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
  {
    id: 'camp-03',
    title: 'Silver Jubilee Pioneer Monument & Sports Pavilion',
    description: 'Constructing a covered spectator pavilion at the main football pitch to honor the pioneer class of 1997.',
    targetAmount: 35000000,
    raisedAmount: 8750000,
    donorCount: 19,
    category: 'SPORTS',
    status: 'ACTIVE',
    coverImage: '/images/massh-science-lab-inspection.jpg',
    startDate: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    createdBy: 'admin@massh.ac.ug',
  },
];

const defaultSeedPayments: PaymentTransaction[] = [
  {
    id: 'pay-01',
    receiptNumber: 'MOSA-RCP-2026-0001',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
    alumniName: 'Muhammad Zatusave',
    alumniEmail: 'muhammad.z@alumni.massh.ac.ug',
    alumniPhone: '+256 701 234567',
    category: 'ANNUAL_MEMBERSHIP',
    subscriptionYear: 2026,
    amount: 50000,
    currency: 'UGX',
    paymentMethod: 'MTN_MOMO',
    transactionReference: 'MP260115.1120.M00123',
    payerPhoneOrAccount: '0772123456',
    notes: 'Annual MOSA membership subscription 2026',
    status: 'VERIFIED',
    submittedAt: '2026-01-15T11:20:00.000Z',
    verifiedAt: '2026-01-15T14:00:00.000Z',
    verifiedBy: 'admin@massh.ac.ug',
  },
  {
    id: 'pay-02',
    receiptNumber: 'MOSA-RCP-2026-0002',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    alumniName: 'Grace Mary Akiiki',
    alumniEmail: 'grace.akiiki@alumni.massh.ac.ug',
    alumniPhone: '+256 701 445566',
    category: 'PROJECT_DONATION',
    campaignId: 'camp-01',
    campaignTitle: 'MASSH Science Laboratory Complex Expansion',
    amount: 500000,
    currency: 'UGX',
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: 'STB-UG-99887766',
    payerPhoneOrAccount: 'Stanbic Bank Hoima',
    notes: 'Donation towards Chemistry titration glassware',
    status: 'VERIFIED',
    submittedAt: '2026-02-10T09:15:00.000Z',
    verifiedAt: '2026-02-10T12:00:00.000Z',
    verifiedBy: 'admin@massh.ac.ug',
  },
  {
    id: 'pay-03',
    alumniId: 'alumni-0002',
    alumniNumber: 'MA. 0002',
    alumniName: 'Grace Mary Akiiki',
    alumniEmail: 'grace.akiiki@alumni.massh.ac.ug',
    alumniPhone: '+256 701 445566',
    category: 'ANNUAL_MEMBERSHIP',
    subscriptionYear: 2026,
    amount: 50000,
    currency: 'UGX',
    paymentMethod: 'AIRTEL_MONEY',
    transactionReference: 'AIR261002.1645.K8899',
    payerPhoneOrAccount: '0701445566',
    notes: 'Annual dues payment via Airtel Money',
    status: 'PENDING_VERIFICATION',
    submittedAt: '2026-10-02T16:45:00.000Z',
  },
];

const defaultSeedAnnouncements: Announcement[] = [
  {
    id: 'ann-01',
    title: 'Official Circular: 2026 MOSA Annual General Meeting (AGM) & Election Notice',
    summary: 'Formal notice for the 2026 Elective AGM convening at the MASSH Main Hall and virtually via Zoom for all diaspora alumni.',
    content: 'Pursuant to Article 9 of the Mandela Old Students Association (MOSA) Constitution, all verified alumni are formally invited to the 2026 Annual General Meeting. Agenda includes: (1) Presentation of the Annual Executive Report by the President, (2) Audited Financial Statements by the Treasurer, (3) Commissioning of the new Science Complex project, and (4) Election of Executive Committee members for the 2026–2028 tenure. Paid-up alumni with active dues for 2026 are entitled to full voting and candidacy privileges.',
    category: 'CIRCULAR',
    audienceScope: 'ALL_ALUMNI',
    isPinned: true,
    channels: ['PORTAL_FEED', 'SMS_BROADCAST', 'EMAIL_DIGEST'],
    viewsCount: 245,
    smsRecipientsCount: 180,
    emailRecipientsCount: 310,
    publishedAt: '2026-09-20T08:00:00.000Z',
    publishedBy: 'admin@massh.ac.ug',
    authorName: 'Dr. Patrick Mugisa',
    authorRole: 'MOSA Secretary General',
    coverImage: '/images/massh-flag-unveiling-ceremony.jpg',
  },
  {
    id: 'ann-02',
    title: 'Headteacher’s Termly Address: 29 Years of Academic & Co-Curricular Distinction',
    summary: 'MASSH administration congratulates alumni on national leadership and reports 98.4% Division 1 pass rate in recent mock exams.',
    content: 'Dear Old Students, On behalf of the Board of Governors, teaching staff, and students of Mandela Secondary School Hoima, I warmly greet you. Since 1997, our institution has stood as an academic beacon in the Albertine region. We are pleased to report steady progress on our STEM laboratories and thank the diaspora and university chapters for their continuous mentorship.',
    category: 'NEWSLETTER',
    audienceScope: 'ALL_ALUMNI',
    isPinned: false,
    channels: ['PORTAL_FEED', 'EMAIL_DIGEST'],
    viewsCount: 188,
    publishedAt: '2026-09-25T10:30:00.000Z',
    publishedBy: 'admin@massh.ac.ug',
    authorName: 'Mr. Lawrence Bagonza',
    authorRole: 'Headteacher, MASSH Hoima',
    coverImage: '/images/massh-headteacher-dignitary.jpg',
  },
  {
    id: 'ann-03',
    title: 'MUMASA Makerere Chapter: Freshers Welcome & Career Mentorship Fellowship',
    summary: 'Makerere University chapter hosts welcome dinner for MASSH Class of 2024 joining Makerere undergraduate programmes.',
    content: 'The executive of Makerere University Mandela Old Students Association (MUMASA) cordially invites all MASSH alumni at Makerere to our annual Welcome & Mentorship Fellowship at the University Main Hall. Connect with senior alumni in medicine, engineering, law, and business.',
    category: 'EVENT_ALERT',
    audienceScope: 'CHAPTER_ONLY',
    targetChapterId: 'chap-01',
    targetChapterCode: 'MUMASA',
    isPinned: false,
    channels: ['PORTAL_FEED', 'SMS_BROADCAST'],
    viewsCount: 92,
    smsRecipientsCount: 64,
    publishedAt: '2026-09-28T14:00:00.000Z',
    publishedBy: 'muhammad.z@alumni.massh.ac.ug',
    authorName: 'Muhammad Zatusave (Bulldozer)',
    authorRole: 'MUMASA Chapter President',
    coverImage: '/images/massh-courtyard-briefing.jpg',
  },
  {
    id: 'ann-04',
    title: 'Condolence Message: Passing of Pioneer Mathematics Teacher Mr. Stephen Isingoma',
    summary: 'MOSA extends heartfelt condolences to the family of our beloved pioneer teacher Mr. Stephen Isingoma (1997–2012).',
    content: 'With deep sorrow, we announce the passing of Mr. Stephen Isingoma, who served as Head of the Mathematics Department from our founding year in 1997 until 2012. A vigil will be held in Hoima City followed by funeral services. Contributions to the condolence fund can be made via the MOSA Welfare Portal.',
    category: 'OBITUARY',
    audienceScope: 'ALL_ALUMNI',
    isPinned: false,
    channels: ['PORTAL_FEED', 'SMS_BROADCAST', 'EMAIL_DIGEST'],
    viewsCount: 312,
    publishedAt: '2026-09-30T09:00:00.000Z',
    publishedBy: 'admin@massh.ac.ug',
    authorName: 'MOSA Executive Committee',
    authorRole: 'Welfare & Secretariat',
  },
];

const defaultSeedNotifications: AlumniNotification[] = [
  {
    id: 'notif-01',
    alumniId: 'alumni-0001',
    title: 'Attendance Sign-In Now Open',
    message: 'Attendance roll call for the MOSA National General Assembly is now open for member check-in.',
    type: 'ATTENDANCE_OPEN',
    linkTab: 'attendance',
    isRead: false,
    createdAt: '2026-10-04T08:00:00.000Z',
  },
  {
    id: 'notif-02',
    alumniId: 'alumni-0001',
    title: 'Membership Application Approved',
    message: 'Your official MOSA membership application has been approved and permanent number MASSH-00109 has been issued.',
    type: 'MEMBERSHIP_APPROVED',
    linkTab: 'my-profile',
    isRead: false,
    createdAt: '2026-10-02T10:15:00.000Z',
  },
  {
    id: 'notif-03',
    alumniId: 'alumni-0001',
    title: 'Contribution Verified',
    message: 'Your contribution of UGX 150,000 to the MASSH Science Laboratory Fund has been verified and recorded.',
    type: 'PAYMENT_VERIFIED',
    linkTab: 'payments',
    isRead: false,
    createdAt: '2026-09-28T14:30:00.000Z',
  },
  {
    id: 'notif-04',
    alumniId: 'alumni-0001',
    title: 'New MOSA Event Announced',
    message: 'Registration is now open for the 2026 MASSH Annual Grand Reunion & Sports Gala in Hoima.',
    type: 'EVENT_ANNOUNCED',
    linkTab: 'events',
    isRead: true,
    createdAt: '2026-09-22T09:00:00.000Z',
  },
  {
    id: 'notif-05',
    alumniId: 'alumni-0001',
    title: 'Registry Profile Updated',
    message: 'Your alumni record in the MOSA Official Registry was updated with your current chapter details.',
    type: 'REGISTRY_UPDATED',
    linkTab: 'directory',
    isRead: true,
    createdAt: '2026-09-15T11:45:00.000Z',
  },
];

const defaultSeedPhotos: CampusPhoto[] = [
  {
    id: 'photo-01',
    title: 'Foundation Stone Laid by Hon. Fred Byamukama (MP & Minister of Works)',
    caption: 'Official commemorative foundation stone laid on 26th September 2026 by Hon. Fred Byamukama, Minister of State for Works and Transport, marking the new infrastructural expansion at Mandela Secondary School Hoima.',
    category: 'FOUNDATION',
    imageUrl: '/images/massh-foundation-stone-unveiled.jpg',
    date: '2026-09-26',
    location: 'MASSH Main Campus, Hoima',
    featured: true,
  },
  {
    id: 'photo-02',
    title: 'MASSH Flag Unveiling Ceremony — Caring to Achieve',
    caption: 'Dignitaries and school leaders unveil the official Mandela Secondary School flag bearing the Kob emblem and school motto "Caring to Achieve" during the foundation ceremony.',
    category: 'FOUNDATION',
    imageUrl: '/images/massh-flag-unveiling-ceremony.jpg',
    date: '2026-09-26',
    location: 'MASSH Campus Courtyard',
    featured: true,
  },
  {
    id: 'photo-03',
    title: 'Chemistry & Science Laboratory Inspection',
    caption: 'Touring the MASSH Science Complex with laboratory glassware and equipment, supporting O & A-Level practical science training.',
    category: 'ACADEMICS',
    imageUrl: '/images/massh-science-lab-inspection.jpg',
    date: '2026-09-26',
    location: 'MASSH Science Complex',
    featured: true,
  },
  {
    id: 'photo-04',
    title: 'Headteacher Mr. Lawrence Bagonza with School Lapel Badge',
    caption: 'MASSH Headteacher proudly displaying his official school lapel pin alongside guests in the science laboratory.',
    category: 'ACADEMICS',
    imageUrl: '/images/massh-headteacher-dignitary.jpg',
    date: '2026-09-26',
    location: 'Chemistry Lab, MASSH',
    featured: false,
  },
  {
    id: 'photo-05',
    title: 'VIP Ministerial Convoy Arrival at School Gate',
    caption: 'Official Toyota Land Cruiser convoy with national ministerial flag arriving at Mandela Secondary School Hoima under security escort.',
    category: 'VIP_VISIT',
    imageUrl: '/images/massh-vip-convoy-arrival.jpg',
    date: '2026-09-26',
    location: 'MASSH Main Entrance Gate',
    featured: true,
  },
  {
    id: 'photo-06',
    title: 'Leadership & Delegation Discussions at School Courtyard',
    caption: 'Senior administrators and delegation members discussing academic expansion and community partnership at MASSH.',
    category: 'CAMPUS_LIFE',
    imageUrl: '/images/massh-courtyard-briefing.jpg',
    date: '2026-09-26',
    location: 'Campus Administration Block',
    featured: false,
  },
  {
    id: 'photo-07',
    title: 'Official Report Handover to Dignitaries',
    caption: 'Handing over the MASSH Institutional Development and Alumni Progress Report to visiting guests.',
    category: 'VIP_VISIT',
    imageUrl: '/images/massh-official-handover.jpg',
    date: '2026-09-26',
    location: 'MASSH Main Campus',
    featured: false,
  },
  {
    id: 'photo-08',
    title: 'Warm Reception at School Gate Entrance',
    caption: 'Welcoming alumni leaders and state officials at the MASSH blue gates.',
    category: 'ALUMNI_COMMUNITY',
    imageUrl: '/images/massh-gate-welcoming.jpg',
    date: '2026-09-26',
    location: 'Main School Gates',
    featured: false,
  },
  {
    id: 'photo-09',
    title: 'Welcoming Guest of Honour with Event Literature',
    caption: 'School leadership presenting the commemorative program to guests upon arrival at the school.',
    category: 'VIP_VISIT',
    imageUrl: '/images/massh-dignitary-arrival.jpg',
    date: '2026-09-26',
    location: 'School Compound',
    featured: false,
  },
  {
    id: 'photo-10',
    title: 'Ministerial Delegation Reception',
    caption: 'Welcoming guests as they arrive for the school assembly and project inspection.',
    category: 'VIP_VISIT',
    imageUrl: '/images/massh-vip-vehicle-reception.jpg',
    date: '2026-09-26',
    location: 'MASSH Parking Pavilion',
    featured: false,
  },
];

// Helper to initialize local storage
function initLocalStore() {
  if (!safeStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.USERS)) {
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultSeedUsers));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ALUMNI)) {
    safeStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(defaultSeedAlumni));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    safeStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(defaultSeedApplications));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    safeStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultSeedAuditLogs));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CHAPTERS)) {
    safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(defaultSeedChapters));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CHAPTER_MEMBERS)) {
    safeStorage.setItem(STORAGE_KEYS.CHAPTER_MEMBERS, JSON.stringify(defaultSeedChapterMembers));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENTS)) {
    safeStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(defaultSeedEvents));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENT_REGISTRATIONS)) {
    safeStorage.setItem(STORAGE_KEYS.EVENT_REGISTRATIONS, JSON.stringify(defaultSeedEventRegistrations));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.EVENT_ATTENDANCE)) {
    safeStorage.setItem(STORAGE_KEYS.EVENT_ATTENDANCE, JSON.stringify(defaultSeedEventAttendance));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.CAMPAIGNS)) {
    safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(defaultSeedCampaigns));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    safeStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(defaultSeedPayments));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    safeStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultSeedAnnouncements));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultSeedNotifications));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.PHOTOS)) {
    safeStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(defaultSeedPhotos));
  }
  if (!safeStorage.getItem(STORAGE_KEYS.BROADCASTS)) {
    safeStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(defaultSeedBroadcasts));
  }
}

const defaultSeedBroadcasts: BroadcastMessage[] = [
  {
    id: 'bcast-01',
    title: 'Grand Alumni Homecoming & Silver Jubilee Gala 2026',
    channel: 'SMS',
    senderName: 'Dr. Patrick Mugisa',
    senderRole: 'Secretary General, MOSA',
    senderContact: '+256 772 100 200',
    content: 'Dear {{fullName}} ({{alumniNumber}}), MOSA cordially invites you to the Grand Homecoming on Dec 12th at Mandela SS Hoima Main Campus. Celebrate 29 years of excellence! Confirm attendance: mosa.massh.ac.ug',
    templateVariables: ['fullName', 'alumniNumber', 'cohort'],
    targetAudience: { scope: 'ALL_ALUMNI' },
    recipientCount: 342,
    status: 'SENT',
    estimatedCostUgx: 10260,
    deliverySummary: { sent: 342, delivered: 338, failed: 4 },
    createdAt: '2026-10-01T08:00:00.000Z',
    sentAt: '2026-10-01T08:05:00.000Z',
    gatewayProvider: 'MTN Uganda Bulk SMS Gateway (Shortcode: MOSA-MASSH)',
  },
  {
    id: 'bcast-02',
    title: 'Biennial NEC General Elections: Secret Ballot Casting Open',
    channel: 'WHATSAPP',
    senderName: 'Muhammad Zatusave',
    senderRole: 'Electoral Commission ICT Lead',
    senderContact: '+256 701 445 566',
    content: '🗳️ *MOSA Biennial Elections (2026-2028)*\n\nGreetings {{fullName}} (Cohort: {{cohort}}).\nVoting is officially active for Executive Committee positions.\nYour verified voter token is ready.\n\nCast your verifiable secret ballot now:\n👉 https://mosa.massh.ac.ug/elections\n\n_Every vote counts toward transparent governance!_',
    templateVariables: ['fullName', 'cohort', 'alumniNumber'],
    targetAudience: { scope: 'VERIFIED_ONLY' },
    recipientCount: 285,
    status: 'SENT',
    estimatedCostUgx: 14250,
    deliverySummary: { sent: 285, delivered: 281, failed: 4 },
    createdAt: '2026-10-04T09:30:00.000Z',
    sentAt: '2026-10-04T09:32:00.000Z',
    gatewayProvider: 'Meta WhatsApp Cloud Business API (Official Green Tick)',
  },
  {
    id: 'bcast-03',
    title: 'Formal Notice of 2026 Annual General Meeting & Audited Accounts',
    channel: 'EMAIL',
    senderName: 'Sarah Mbabazi, CPA',
    senderRole: 'Honorary Treasurer, MOSA',
    senderContact: 'treasurer@massh.ac.ug',
    content: 'Dear {{fullName}},\n\nNotice is hereby given that the 2026 MOSA Annual General Meeting (AGM) will convene in Hoima City on Saturday, 12th December 2026.\n\nKey Agenda:\n1. Consideration of 2025/2026 Audited Financial Statements\n2. STEM Science Laboratory Trust Fund Progress\n3. Regional Chapter Charters Ratification\n\nDownload the full AGM booklet and financial statements on your member dashboard.',
    templateVariables: ['fullName', 'cohort'],
    targetAudience: { scope: 'ALL_ALUMNI' },
    recipientCount: 310,
    status: 'SENT',
    estimatedCostUgx: 0,
    deliverySummary: { sent: 310, delivered: 308, failed: 2 },
    createdAt: '2026-09-28T10:00:00.000Z',
    sentAt: '2026-09-28T10:02:00.000Z',
    gatewayProvider: 'AWS SES Dedicated SMTP Cluster',
  }
];

initLocalStore();

export const dataService = {
  // Format membership number, e.g. MA.-0001
  formatAlumniNumber(num: number, prefix = 'MA.-', pad = 4): string {
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
      const dupCheck = await this.checkDuplicate(appData.email, appData.phone);
      if (dupCheck.isDuplicate) {
        return { success: false, error: dupCheck.reason };
      }

      const id = `app-${Date.now()}`;
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();

      // Generate Reference ID (e.g. MOSA-2026-00125)
      const settingsRaw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings: SystemSettings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;
      const appSeq = settings.nextApplicationNumber || 125;
      const referenceId = `MOSA-${currentYear}-${String(appSeq).padStart(5, '0')}`;
      settings.nextApplicationNumber = appSeq + 1;

      const isAutoApprove = settings.autoApproveRegistrations !== false;
      let generatedNumber: string | undefined;
      let newProfile: AlumniProfile | undefined;

      if (isAutoApprove) {
        const prefix = settings.prefix || 'MA.-';
        const pad = settings.padDigits || 4;
        let currentCounter = settings.nextAlumniNumber || 3;

        // Anti-collision set
        const usedRegistry = new Set<string>((settings.usedMANumbersRegistry || []).map(s => s.trim().toUpperCase()));
        const existingAlumni = await this.getAlumniList();
        existingAlumni.forEach(a => usedRegistry.add(a.alumniNumber.trim().toUpperCase()));

        generatedNumber = this.formatAlumniNumber(currentCounter, prefix, pad);
        while (usedRegistry.has(generatedNumber.toUpperCase())) {
          currentCounter += 1;
          generatedNumber = this.formatAlumniNumber(currentCounter, prefix, pad);
        }

        settings.nextAlumniNumber = currentCounter + 1;
        if (!settings.usedMANumbersRegistry) settings.usedMANumbersRegistry = [];
        settings.usedMANumbersRegistry.push(generatedNumber);

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

        // Save AuthUser so they can immediately login (only when a credential exists;
        // the account is never tied to the assisting person's login).
        const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const hasCredential = !!(appData.email || appData.phone);
        if (hasCredential && !users.some(u => !!appData.email && u.email.toLowerCase() === appData.email.toLowerCase())) {
          users.push({
            uid: `user-${alumniId}`,
            email: appData.email,
            displayName: [appData.firstName, appData.lastName].filter(Boolean).join(' '),
            role: 'ALUMNI',
            alumniId,
            alumniNumber: generatedNumber,
            photoUrl: appData.photoUrl,
            phone: appData.phone,
          });
          safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
        let currentCounter = settings.nextAlumniNumber || 3;
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

      // Register new number in used numbers registry and clean up vacated previous number
      const usedSet = new Set((settings.usedMANumbersRegistry || []).map(n => n.trim().toUpperCase()));
      const otherUsingPrev = localList.some(a => a.internalId !== alumnus.internalId && normalize(a.alumniNumber) === normalize(previousNumber));
      if (!otherUsingPrev) {
        usedSet.delete(previousNumber.trim().toUpperCase());
      }
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
      },
      'muhammad.z@alumni.massh.ac.ug': {
        email: 'muhammad.z@alumni.massh.ac.ug',
        password: 'alumni123',
        role: 'ALUMNI',
        displayName: 'Muhammad Zatusave',
        alumniId: 'alumni-0001',
        alumniNumber: 'MA. 0001',
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

  // Enhanced Login with separate Admin & Alumni Password protection
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
      const users: AuthUser[] = JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS) || JSON.stringify(defaultSeedUsers));
      const matchedAdmin = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

      const isRecognizedAdmin = matchedAdmin || cleanEmail === 'admin@massh.ac.ug';
      if (!isRecognizedAdmin) {
        return { 
          success: false, 
          error: 'This email is not authorized for administrative access. Please use Alumni Sign In.' 
        };
      }

      if (matchedAdmin && matchedAdmin.active === false) {
        return { success: false, error: 'This administrative account has been deactivated.' };
      }

      // Check Admin Password
      const expectedPassword = userCred?.password || 'admin123';
      if (!password || password !== expectedPassword) {
        return { success: false, error: 'Incorrect administrator password. Please check your credentials.' };
      }

      const adminUser: AuthUser = matchedAdmin || {
        uid: 'admin-super-01',
        email: cleanEmail,
        role: 'SUPER_ADMIN',
        displayName: 'Head of ICT / MOSA Admin',
      };

      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
      await this.logAudit({
        action: 'ADMIN_LOGIN',
        performedBy: adminUser.email,
        affectedRecord: adminUser.uid,
        metadata: { role: adminUser.role },
      });

      return { success: true, user: adminUser };
    }

    // ----------------------------------------------------
    // PORTAL 2: ALUMNI MEMBER SIGN IN
    // ----------------------------------------------------
    const alumniList = await this.getAlumniList();
    const alumnus = alumniList.find(a => !!a.email && a.email.toLowerCase() === cleanEmail);

    if (!alumnus) {
      if (cleanEmail === 'admin@massh.ac.ug' || cleanEmail.includes('@massh.ac.ug')) {
        return {
          success: false,
          error: 'This appears to be an administrator email. Please switch to the "Administrator Sign In" tab.'
        };
      }
      return {
        success: false,
        error: `No alumni account found for "${cleanEmail}". Please check the spelling or register first.`
      };
    }

    // Check if alumnus has already created a password
    if (!userCred || !userCred.password) {
      return {
        success: false,
        needsPasswordCreation: true,
        alumnusName: `${alumnus.firstName} ${alumnus.lastName}`,
        alumniNumber: alumnus.alumniNumber,
        error: `Welcome, ${alumnus.firstName}! You have not set a password yet. Please create your password below to activate sign in.`
      };
    }

    // Verify Password
    if (!password || password !== userCred.password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again, or create/reset your password.'
      };
    }

    const alumniUser: AuthUser = {
      uid: `user-${alumnus.internalId}`,
      email: alumnus.email,
      role: 'ALUMNI',
      displayName: `${alumnus.firstName} ${alumnus.lastName}`,
      alumniId: alumnus.internalId,
      alumniNumber: alumnus.alumniNumber,
      photoUrl: alumnus.photoUrl,
      phone: alumnus.phone,
    };

    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(alumniUser));
    await this.logAudit({
      action: 'USER_LOGIN',
      performedBy: alumniUser.email,
      affectedRecord: alumniUser.uid,
      metadata: { role: 'ALUMNI', alumniNumber: alumnus.alumniNumber },
    });

    return { success: true, user: alumniUser };
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
    if (chapters.length === 0) {
      safeStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(defaultSeedChapters));
      chapters = [...defaultSeedChapters];
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

  // NOTIFICATION CENTER
  async getAlumniNotifications(alumniId: string): Promise<AlumniNotification[]> {
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
    return notifs.map(n => ({ ...n, alumniId })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
