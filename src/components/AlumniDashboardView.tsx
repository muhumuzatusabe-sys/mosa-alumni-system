import React, { useState, useEffect } from 'react';
import { AlumniProfile, AuthUser, PaymentTransaction, DonationCampaign, Chapter, MentorshipRequest } from '../types';
import { dataService } from '../services/dataService';
import { DigitalMembershipCard } from './DigitalMembershipCard';
import { DigitalMembershipCardModal } from './DigitalMembershipCardModal';
import { CardCorrectionModal } from './CardCorrectionModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { PublicVerifyAlumniModal } from './PublicVerifyAlumniModal';
import { membershipCardService } from '../services/membershipCardService';
import { MembershipCardRecord } from '../types';
import { 
  Award, 
  User, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  Edit3, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle,
  Lock,
  ChevronRight,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  Download,
  QrCode,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Info,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Vote,
  Copy,
  Check,
  Send
} from 'lucide-react';

interface Props {
  currentUser: AuthUser;
  onOpenEditModal: (alumnus: AlumniProfile) => void;
  onBack?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

type DashboardTab = 'pass' | 'personal' | 'history' | 'career' | 'mentorship' | 'voting' | 'contributions' | 'chapters' | 'privacy';

export const AlumniDashboardView: React.FC<Props> = ({ currentUser, onOpenEditModal, onBack, onNavigateToTab }) => {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('pass');
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Mentorship & Voting State
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [incomingMentorRequests, setIncomingMentorRequests] = useState<MentorshipRequest[]>([]);
  const [voterTokens, setVoterTokens] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isDigitalCardModalOpen, setIsDigitalCardModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [cardRecord, setCardRecord] = useState<MembershipCardRecord | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyQuery, setVerifyQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      let found: AlumniProfile | null = null;
      if (currentUser.alumniId) {
        found = await dataService.getAlumniById(currentUser.alumniId);
      }
      if (!found && currentUser.alumniNumber) {
        found = await dataService.getAlumniByNumber(currentUser.alumniNumber);
      }
      if (!found) {
        const list = await dataService.getAlumniList();
        found = list.find(a => a.email.toLowerCase() === currentUser.email.toLowerCase()) || null;
      }
      setProfile(found);

      if (found) {
        const [userPayments, allCampaigns, allChapters, myRequests, inRequests, tokens, voted, memCard] = await Promise.all([
          dataService.getAlumnusPayments(found.internalId),
          dataService.getDonationCampaigns('ACTIVE'),
          dataService.getChapters('ACTIVE'),
          dataService.getMentorshipRequests({ menteeAlumniId: found.internalId }),
          dataService.getMentorshipRequests({ mentorId: found.internalId }),
          dataService.getVoterReceiptTokens('elec-2026', currentUser),
          dataService.hasVotedInElection('elec-2026', currentUser),
          membershipCardService.getCardForAlumnus(found.internalId),
        ]);
        setPayments(userPayments);
        setCampaigns(allCampaigns);
        setChapters(allChapters);
        setMentorshipRequests(myRequests);
        setIncomingMentorRequests(inRequests);
        setVoterTokens(tokens);
        setHasVoted(voted);
        setCardRecord(memCard);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
        Loading your MOSA Alumni Dashboard...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mosa-card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '580px', margin: '3rem auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <Clock size={32} color="#D97706" />
        </div>
        <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>
          Alumni Credentials Under Verification
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Your alumni registration application is currently undergoing official verification against MASSH archival records. Once approved, your permanent <strong>MA. XXXX</strong> number and digital membership pass will appear here.
        </p>
      </div>
    );
  }

  // Calculate cohort span
  const startYear = profile.schoolHistory.oLevel?.yearJoined || profile.schoolHistory.aLevel?.yearJoined || 1997;
  const endYear = profile.schoolHistory.aLevel?.yearCompleted || profile.schoolHistory.oLevel?.yearCompleted || 2022;

  // Total contributions calculation
  const totalContributed = payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  const isDuesCurrent = profile.membershipStatus === 'ACTIVE' && (profile.membershipPaidUntilYear || 0) >= new Date().getFullYear();

  const handleOpenVerify = (num: string) => {
    setVerifyQuery(num);
    setIsVerifyModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. PERSONALIZED MEMBER PROFILE HEADER */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 60%, #18533B 100%)',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          boxShadow: '0 12px 28px rgba(10, 39, 27, 0.25)',
          border: '1px solid rgba(198, 138, 36, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.firstName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D97706' }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #D97706', color: '#D97706', fontSize: '1.8rem', fontWeight: 800 }}>
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.8rem', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                Member Self-Service Desk
              </div>
              <h1 style={{ fontSize: '1.6rem', color: '#FFFFFF', margin: '0.2rem 0', fontWeight: 800 }}>
                {profile.firstName} {profile.middleName ? `${profile.middleName} ` : ''}{profile.lastName}
              </h1>
              {profile.nickname && (
                <div style={{ fontSize: '0.85rem', color: '#FCD34D', fontWeight: 600, marginBottom: '0.35rem' }}>
                  School Moniker: "{profile.nickname}"
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="alumni-no-pill" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800, padding: '3px 10px', borderRadius: '6px' }}>
                  <Award size={14} /> {profile.alumniNumber}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                  Class of {endYear} ({startYear} – {endYear})
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(5, 150, 105, 0.3)', color: '#D1FAE5', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>
                  {profile.membershipStatus === 'ACTIVE' ? 'Verified Member' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {onBack && (
              <button 
                className="btn btn-secondary"
                onClick={onBack}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button 
              className="btn btn-gold" 
              onClick={() => onOpenEditModal(profile)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleOpenVerify(profile.alumniNumber)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <ShieldCheck size={15} /> Public Lookup
            </button>
          </div>
        </div>
      </div>

      {/* 2. MODERN HORIZONTAL SECTION NAVIGATOR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0.4rem',
        display: 'flex',
        gap: '0.4rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'pass', label: 'My Membership ID', icon: QrCode },
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'history', label: 'School History', icon: GraduationCap },
          { id: 'career', label: 'Career & Higher Ed', icon: Briefcase },
          { id: 'mentorship', label: `Mentorship (${mentorshipRequests.length + incomingMentorRequests.length})`, icon: Sparkles },
          { id: 'voting', label: hasVoted ? 'Ballot Cast' : 'Secret Ballot', icon: Vote },
          { id: 'contributions', label: 'Giving & History', icon: CreditCard },
          { id: 'chapters', label: 'Chapters & Network', icon: Building2 },
          { id: 'privacy', label: 'Privacy Settings', icon: Lock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              style={{
                flex: 1,
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0B203E' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} color={isActive ? '#D97706' : '#64748B'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: MY MEMBERSHIP ID CARD */}
      {/* ============================================================== */}
      {activeTab === 'pass' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="mosa-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <Award size={14} /> OFFICIAL MOSA MEMBERSHIP IDENTIFICATION
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0B203E', marginBottom: '0.4rem', fontWeight: 800 }}>
              My Official Membership ID Card
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
              Your accredited digital and printable credential issued by the Mandela Old Students Association (MOSA). Tap the card to flip between front and back, or download the high-resolution vector PDF below.
            </p>

            {/* Validation & Status Metadata Ribbon */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              fontSize: '0.82rem'
            }}>
              <div>
                <span style={{ color: '#64748B' }}>Permanent MA No: </span>
                <strong style={{ color: '#0B203E', fontFamily: 'monospace' }}>{profile.alumniNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Validation No: </span>
                <strong style={{ color: '#0B203E', fontFamily: 'monospace' }}>{cardRecord?.validationNumber || 'Pending Official Issuance'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Issue Status: </span>
                <strong style={{ color: cardRecord?.status === 'ISSUED' ? '#059669' : '#D97706' }}>
                  {cardRecord ? cardRecord.status : 'PENDING APPROVAL'}
                </strong>
              </div>
            </div>

            {/* Reusable Personalized Card */}
            <DigitalMembershipCard
              alumnus={profile}
              card={cardRecord}
              onOpenPublicVerification={handleOpenVerify}
              onRequestCorrection={() => setIsCorrectionOpen(true)}
            />

            {/* Print & Full Export Action */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsDigitalCardModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.4rem',
                  fontWeight: 700,
                  fontSize: '0.88rem'
                }}
              >
                <Award size={16} />
                <span>Open Flippable Card & Export Printable Badge</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCorrectionOpen(true)}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <Edit3 size={15} />
                <span>Request Detail Correction</span>
              </button>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div 
              onClick={() => setIsPaymentOpen(true)}
              style={{
                background: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>Donate to Project</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Support school development</div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('contributions')}
              style={{
                background: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>Giving History</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Audit contributions ledger</div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('chapters')}
              style={{
                background: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>University Chapter</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Connect with peers</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: PERSONAL INFORMATION */}
      {/* ============================================================== */}
      {activeTab === 'personal' && (
        <div className="mosa-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="#D97706" /> Personal Information &amp; Bio
            </h3>
            <button className="btn btn-secondary" onClick={() => onOpenEditModal(profile)} style={{ fontSize: '0.8rem' }}>
              <Edit3 size={14} /> Update Info
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Full Legal Name:</span>
              <strong style={{ color: '#0B203E' }}>{profile.firstName} {profile.middleName || ''} {profile.lastName}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Official MA Number:</span>
              <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>{profile.alumniNumber}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Primary Email:</span>
              <strong style={{ color: '#0B203E' }}>{profile.email}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Phone / Mobile Money:</span>
              <strong style={{ color: '#0B203E' }}>{profile.phone}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Gender &amp; Date of Birth:</span>
              <strong style={{ color: '#0B203E' }}>{profile.gender || 'Not specified'} • {profile.dateOfBirth || 'N/A'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Current Location:</span>
              <strong style={{ color: '#0B203E' }}>{profile.city ? `${profile.city}, ` : ''}{profile.country}</strong>
            </div>
          </div>

          {profile.bio && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block', marginBottom: '0.35rem' }}>Personal Statement / Bio:</span>
              <p style={{ color: '#334155', lineHeight: '1.6', margin: 0, fontSize: '0.92rem' }}>
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: MANDELA SCHOOL HISTORY */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="mosa-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="#D97706" /> Mandela Secondary School Hoima (MASSH) History
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748B', background: '#F1F5F9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              Archival Record
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {profile.schoolHistory.attendedOLevel && profile.schoolHistory.oLevel && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#065F46', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Ordinary Level (O-Level / UCE)
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.7' }}>
                  <div>Years: <strong>{profile.schoolHistory.oLevel.yearJoined} – {profile.schoolHistory.oLevel.yearCompleted}</strong></div>
                  <div>Campus: <strong>{profile.schoolHistory.oLevel.campus}</strong></div>
                  <div>Class &amp; Stream: <strong>{profile.schoolHistory.oLevel.class} ({profile.schoolHistory.oLevel.stream})</strong></div>
                  {profile.schoolHistory.oLevel.house && (
                    <div>House: <strong>{profile.schoolHistory.oLevel.house}</strong></div>
                  )}
                </div>
              </div>
            )}

            {profile.schoolHistory.attendedALevel && profile.schoolHistory.aLevel && (
              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#1E40AF', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Advanced Level (A-Level / UACE)
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.7' }}>
                  <div>Years: <strong>{profile.schoolHistory.aLevel.yearJoined} – {profile.schoolHistory.aLevel.yearCompleted}</strong></div>
                  <div>Campus: <strong>{profile.schoolHistory.aLevel.campus}</strong></div>
                  <div>Combination: <strong>{profile.schoolHistory.aLevel.combination}</strong></div>
                  {profile.schoolHistory.aLevel.house && (
                    <div>House: <strong>{profile.schoolHistory.aLevel.house}</strong></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: CAREER & HIGHER EDUCATION */}
      {/* ============================================================== */}
      {activeTab === 'career' && (
        <div className="mosa-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="#0B203E" /> Higher Education &amp; Career
            </h3>
            <button className="btn btn-secondary" onClick={() => onOpenEditModal(profile)} style={{ fontSize: '0.8rem' }}>
              <Edit3 size={14} /> Edit Career
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Profession / Occupation:</span>
              <strong style={{ color: '#0B203E' }}>{profile.occupation || 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Current Organization / Employer:</span>
              <strong style={{ color: '#0B203E' }}>{profile.organisation || 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>Highest Educational Qualification:</span>
              <strong style={{ color: '#0B203E' }}>{profile.highestQualification || 'Not specified'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.8rem', display: 'block' }}>University / Tertiary Institution:</span>
              <strong style={{ color: '#0B203E' }}>{profile.currentInstitution ? `${profile.programme || ''} (${profile.currentInstitution})` : 'Not specified'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION: MENTORSHIP DESK */}
      {/* ============================================================== */}
      {activeTab === 'mentorship' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div className="mosa-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Sparkles size={20} color="#D97706" />
                <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>1-on-1 Alumni Mentorship Desk</h3>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                Track your guidance requests with senior MASSH professionals and manage incoming mentee guidance.
              </p>
            </div>
            {onNavigateToTab && (
              <button
                className="btn btn-primary"
                onClick={() => onNavigateToTab('opportunities')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                <Briefcase size={15} />
                <span>Browse Opportunities Hub</span>
              </button>
            )}
          </div>

          {/* Outbound Guidance Requests */}
          <div className="mosa-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: '0 0 1rem 0', fontWeight: 700 }}>
              My Mentorship Guidance Requests ({mentorshipRequests.length})
            </h4>
            {mentorshipRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.88rem' }}>
                You have not submitted any mentorship requests yet. Connect with senior doctors, engineers, advocates, and civil servants in the Opportunities &amp; Mentorship Hub.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {mentorshipRequests.map(req => (
                  <div key={req.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0B203E', fontSize: '0.95rem' }}>{req.mentorName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Topic: {req.fieldOrTopic} &bull; Preferred: {req.preferredFormat}</div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: req.status === 'ACCEPTED' ? '#DCFCE7' : req.status === 'DECLINED' ? '#FEE2E2' : '#FEF3C7',
                        color: req.status === 'ACCEPTED' ? '#166534' : req.status === 'DECLINED' ? '#991B1B' : '#92400E',
                      }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#334155', fontStyle: 'italic', background: '#FFFFFF', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginTop: '0.4rem' }}>
                      "{req.message}"
                    </div>
                    {req.responseNote && (
                      <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#065F46', background: '#ECFDF5', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                        <strong>Mentor Response:</strong> {req.responseNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Mentee Requests (If User Offers Mentorship) */}
          {incomingMentorRequests.length > 0 && (
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: '0 0 1rem 0', fontWeight: 700 }}>
                Incoming Mentee Requests ({incomingMentorRequests.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {incomingMentorRequests.map(req => (
                  <div key={req.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0B203E' }}>{req.menteeName} ({req.menteeAlumniNumber})</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Topic: {req.fieldOrTopic} &bull; Email: {req.menteeEmail}</div>
                      </div>
                      <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, background: req.status === 'ACCEPTED' ? '#DCFCE7' : '#FEF3C7', color: req.status === 'ACCEPTED' ? '#166534' : '#92400E' }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#334155', background: '#F8FAFC', padding: '0.6rem', borderRadius: '6px', marginTop: '0.4rem' }}>
                      "{req.message}"
                    </div>
                    {req.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={async () => {
                            await dataService.respondToMentorshipRequest(req.id, 'ACCEPTED', 'Guidance request accepted. Looking forward to connecting.');
                            await loadData();
                          }}
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: 'none', background: '#059669', color: '#FFFFFF', cursor: 'pointer' }}
                        >
                          Accept Mentorship
                        </button>
                        <button
                          onClick={async () => {
                            await dataService.respondToMentorshipRequest(req.id, 'DECLINED', 'Currently at maximum mentoring capacity.');
                            await loadData();
                          }}
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: '6px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION: SECRET VOTING & VERIFICATION TOKENS */}
      {/* ============================================================== */}
      {activeTab === 'voting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="mosa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Vote size={20} color="#D97706" />
                  <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>Elections &amp; Secret Ballot Participation</h3>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                  Biennial NEC General Elections &bull; Verifiable cryptographic secret ballot audit receipts.
                </p>
              </div>
              {onNavigateToTab && (
                <button
                  className="btn btn-primary"
                  onClick={() => onNavigateToTab('elections')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                >
                  <Vote size={15} />
                  <span>Go to Digital Ballot Box</span>
                </button>
              )}
            </div>

            {/* Voting Status Banner */}
            <div style={{ marginTop: '1.25rem', background: hasVoted ? '#ECFDF5' : '#FFFBEB', border: `1.5px solid ${hasVoted ? '#A7F3D0' : '#FDE68A'}`, borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={18} color={hasVoted ? '#059669' : '#D97706'} />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: hasVoted ? '#065F46' : '#92400E' }}>
                  {hasVoted ? 'Official Secret Ballot Cast & Tallied' : 'Ballot Pending — 2026 NEC Elections are Active'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.85rem 0', lineHeight: 1.5 }}>
                {hasVoted
                  ? 'Your vote has been securely tallied into the official electoral roll. In compliance with constitutional secrecy, individual candidate selections are detached from member identity.'
                  : 'As an active verified alumnus, you hold 1 secret vote for each executive position (President, Vice President, Secretary General, Treasurer).'}
              </p>

              {voterTokens.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0B203E', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Your Verifiable Cryptographic Ballot Token:
                  </div>
                  {voterTokens.map(tok => (
                    <div key={tok} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: '#FFFFFF', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                      <code style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>{tok}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tok);
                          setCopiedToken(tok);
                          setTimeout(() => setCopiedToken(null), 2500);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                      >
                        {copiedToken === tok ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                        <span>{copiedToken === tok ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 5: CONTRIBUTIONS STATEMENT & DUES */}
      {/* ============================================================== */}
      {activeTab === 'contributions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Financial Health Summary Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
            borderRadius: '16px',
            padding: '1.75rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Total MOSA Contributions to Date
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FBBF24', margin: '0.2rem 0', fontFamily: 'var(--font-heading)' }}>
                UGX {totalContributed.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Alumni Standing:</span>
                <span style={{ background: '#059669', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {isDuesCurrent ? 'Active Contributor' : 'Verified Member'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="btn btn-gold"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              <DollarSign size={16} /> Donate to Project
            </button>
          </div>

          {/* Statement Transaction History Table */}
          <div className="mosa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: 0 }}>
                Official Contribution &amp; Payment Statement
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {payments.length} Recorded Transactions
              </span>
            </div>

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                <p>No payment records found on your account.</p>
                <button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="btn btn-primary"
                  style={{ marginTop: '0.75rem' }}
                >
                  Make First Payment
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Receipt / Ref</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Amount (UGX)</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0B203E' }}>
                          {pay.receiptNumber || pay.transactionReference || pay.id.slice(0, 8)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0B203E' }}>
                            {pay.category.replace('_', ' ')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {new Date(pay.submittedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                          {pay.paymentMethod.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0B203E' }}>
                          UGX {pay.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: pay.status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                            color: pay.status === 'VERIFIED' ? '#065F46' : '#92400E'
                          }}>
                            {pay.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedReceipt(pay)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <FileText size={13} /> View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 6: CHAPTERS & NETWORK */}
      {/* ============================================================== */}
      {activeTab === 'chapters' && (
        <div className="mosa-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="#D97706" /> MOSA Institutional &amp; Regional Chapters
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
            Alumni participate in university chapters (MUMASA, KYUMASA, MBUMASA) and regional hubs while remaining unified under your permanent MOSA number <strong>{profile.alumniNumber}</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {chapters.map(chap => (
              <div key={chap.id} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                    {chap.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '8px' }}>
                    {chap.chapterType}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                  {chap.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Location: <strong>{chap.location}</strong> • {chap.memberCount} Members
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 7: DIRECTORY PRIVACY CONTROLS */}
      {/* ============================================================== */}
      {activeTab === 'privacy' && (
        <div className="mosa-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="#D97706" /> Directory Privacy Controls
            </h3>
            <button className="btn btn-secondary" onClick={() => onOpenEditModal(profile)} style={{ fontSize: '0.8rem' }}>
              <Edit3 size={14} /> Change Privacy
            </button>
          </div>

          <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            You maintain full sovereignty over what details other members and the public can view in the official alumni directory.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Display Full Name in Directory', active: profile.privacySettings.showName, desc: 'Visible in search results and cohort lists' },
              { label: 'Display School Moniker / Nickname', active: profile.privacySettings.showNickname, desc: 'Allows classmates from your stream to find you by your school moniker' },
              { label: 'Display Current Profession & Industry', active: profile.privacySettings.showProfession, desc: 'Enables professional networking with alumni in your sector' },
              { label: 'Display Current Organisation / Employer', active: profile.privacySettings.showOrganisation, desc: 'Shows where you currently practice or work' },
              { label: 'Display Country & City of Residence', active: profile.privacySettings.showCountry, desc: 'Facilitates regional chapter connections and alumni meetups' },
              { label: 'Display Phone Number to Members', active: profile.privacySettings.showPhone, desc: 'Direct dialling by verified Mandela alumni' },
              { label: 'Display Email Address to Members', active: profile.privacySettings.showEmail, desc: 'Direct correspondence through verified email' },
            ].map((setting, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.9rem' }}>{setting.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{setting.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: setting.active ? '#059669' : '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>
                  {setting.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{setting.active ? 'Visible' : 'Hidden'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        currentUser={currentUser}
        currentAlumnus={profile}
        campaigns={campaigns}
        defaultCategory="ANNUAL_MEMBERSHIP"
        onSuccess={() => {
          setIsPaymentOpen(false);
          loadData();
        }}
      />

      <ReceiptModal
        payment={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      <PublicVerifyAlumniModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        initialQuery={verifyQuery}
      />

      {/* Digital Membership Card Preview & Print Modal */}
      <DigitalMembershipCardModal
        alumnus={profile}
        isOpen={isDigitalCardModalOpen}
        onClose={() => setIsDigitalCardModalOpen(false)}
        onOpenPublicVerification={handleOpenVerify}
      />

      {/* Card Correction Request Modal */}
      {profile && (
        <CardCorrectionModal
          alumnus={profile}
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          onSubmitted={loadData}
        />
      )}
    </div>
  );
};

export default AlumniDashboardView;
