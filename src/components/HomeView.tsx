import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Coins, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  MapPin, 
  HeartHandshake, 
  TrendingUp,
  Receipt,
  QrCode,
  ClipboardCheck,
  ShieldCheck,
  Menu,
  Clock,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { 
  AuthUser, 
  AlumniProfile, 
  AlumniApplication,
  DonationCampaign, 
  PaymentTransaction 
} from '../types';
import { dataService } from '../services/dataService';

interface HomeViewProps {
  currentUser: AuthUser | null;
  onNavigate: (tab: any, targetId?: string) => void;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onSelectAlumni?: (alumnus: AlumniProfile) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  onNavigate,
  onOpenRegister,
  onOpenVerify,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onSelectAlumni,
}) => {
  const [memberProfile, setMemberProfile] = useState<AlumniProfile | null>(null);
  const [userApplication, setUserApplication] = useState<AlumniApplication | null>(null);
  const [memberPayments, setMemberPayments] = useState<PaymentTransaction[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<DonationCampaign[]>([]);
  const [compactAlumni, setCompactAlumni] = useState<AlumniProfile[]>([]);
  const [totalAlumniCount, setTotalAlumniCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [
          alumniList,
          campaignsList,
          allPayments,
        ] = await Promise.all([
          dataService.getAlumniList(),
          dataService.getDonationCampaigns('ACTIVE'),
          dataService.getPayments(),
        ]);

        setActiveCampaigns(campaignsList.slice(0, 2));
        setCompactAlumni(alumniList.slice(0, 3));
        setTotalAlumniCount(alumniList.length);

        // Resolve current member profile
        let userProfile: AlumniProfile | null = null;
        if (currentUser?.alumniId) {
          userProfile = await dataService.getAlumniById(currentUser.alumniId);
        }
        if (!userProfile && currentUser?.alumniNumber) {
          userProfile = await dataService.getAlumniByNumber(currentUser.alumniNumber);
        }
        if (!userProfile && currentUser?.email) {
          userProfile = alumniList.find(a => a.email.toLowerCase() === currentUser.email.toLowerCase()) || null;
        }

        // Check if user has an application on file
        let appOnRecord: AlumniApplication | null = null;
        if (currentUser?.email) {
          appOnRecord = await dataService.getApplicationByEmail(currentUser.email);
        }
        setUserApplication(appOnRecord);

        // Explicitly set genuine profile without fabricating alumni information
        setMemberProfile(userProfile);

        // Member contributions
        if (userProfile) {
          const userPays = allPayments.filter(p => 
            p.alumniNumber === userProfile?.alumniNumber || p.alumniEmail === userProfile?.email
          );
          setMemberPayments(userPays);
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  // Financial calculations
  const totalVerifiedGiving = memberPayments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  const featuredCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null;
  const campaignPercent = featuredCampaign && featuredCampaign.targetAmount > 0
    ? Math.min(Math.round((featuredCampaign.raisedAmount / featuredCampaign.targetAmount) * 100), 100)
    : 0;

  return (
    <div className="home-container" style={{ width: '100%', maxWidth: '1160px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* ============================================================== */}
      {/* 1. COMPACT MEMBER IDENTITY & PROFILE SUMMARY                   */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 1. COMPACT MEMBER IDENTITY & DIGITAL ALUMNI PASS               */}
      {/* ============================================================== */}
      <section style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '100%' }}>
        <div
          className="member-identity-card"
          style={{
            background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 65%, #18533B 100%)',
            borderRadius: '14px',
            padding: '1.15rem 1.35rem',
            color: '#FFFFFF',
            boxShadow: '0 6px 18px rgba(10, 39, 27, 0.16)',
            border: '1.5px solid rgba(198, 138, 36, 0.35)',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* CASE 1: VERIFIED ALUMNUS PROFILE */}
          {memberProfile && (memberProfile.membershipStatus === 'ACTIVE' || memberProfile.membershipStatus === 'APPROVED' || memberProfile.verifiedAt) ? (
            <>
              {/* Member Photo Block with Exact Heading */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#FCD34D',
                    fontWeight: 800,
                  }}
                >
                  MASSH Alumni Photo
                </span>

                {memberProfile.photoUrl ? (
                  <img
                    src={memberProfile.photoUrl}
                    alt={memberProfile.firstName || 'MASSH Alumnus'}
                    style={{
                      width: '58px',
                      height: '58px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #FBBF24',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '58px',
                      height: '58px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D97706, #B45309)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      border: '2px solid #FDE68A',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    {`${memberProfile.firstName?.[0] || 'M'}${memberProfile.lastName?.[0] || 'A'}`}
                  </div>
                )}
              </div>

              {/* Member Details Hierarchy */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#CBD5E1', fontWeight: 600 }}>
                  MASSH ALUMNI PORTAL
                </div>

                <h2
                  style={{
                    fontSize: '1.25rem',
                    color: '#FFFFFF',
                    margin: '0.15rem 0 0.35rem 0',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {memberProfile.fullName || `${memberProfile.firstName} ${memberProfile.lastName}`}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      color: '#FDE68A',
                      background: 'rgba(217, 119, 6, 0.25)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Award size={13} color="#FBBF24" />
                    <span>{memberProfile.alumniNumber}</span>
                  </span>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#D1FAE5',
                      background: 'rgba(5, 150, 105, 0.3)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCircle2 size={12} color="#34D399" />
                    <span>Verified Member</span>
                  </span>

                  {memberProfile.city && (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} color="#FBBF24" />
                      <span>{`${memberProfile.city} Chapter`}</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : userApplication ? (
            /* CASE 2: REGISTRATION SUBMITTED & AWAITING VERIFICATION */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#FCD34D',
                    fontWeight: 800,
                  }}
                >
                  Alumni Membership
                </span>

                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#FCD34D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #FBBF24',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Clock size={24} />
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#CBD5E1', fontWeight: 600 }}>
                  MASSH ALUMNI PORTAL
                </div>

                <h2
                  style={{
                    fontSize: '1.25rem',
                    color: '#FFFFFF',
                    margin: '0.15rem 0 0.35rem 0',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {[userApplication.firstName, userApplication.lastName].filter(Boolean).join(' ') || currentUser?.displayName || 'Alumni Applicant'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: '#FDE68A',
                      background: 'rgba(217, 119, 6, 0.2)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Clock size={13} color="#FBBF24" />
                    <span>Pending Verification</span>
                  </span>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#FEF3C7',
                      background: 'rgba(217, 119, 6, 0.35)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(251, 191, 36, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Clock size={12} color="#FDE68A" />
                    <span>Application Under Review</span>
                  </span>

                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Submitted {userApplication.submittedAt ? new Date(userApplication.submittedAt).toLocaleDateString() : 'recently'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* CASE 3: AUTHENTICATED USER — NOT YET REGISTERED AS ALUMNUS (Section 5 Requirement) */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: '#FCD34D',
                    fontWeight: 800,
                  }}
                >
                  Alumni Membership
                </span>

                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <GraduationCap size={24} color="#94A3B8" />
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#CBD5E1', fontWeight: 600 }}>
                  MASSH ALUMNI PORTAL
                </div>

                <h2
                  style={{
                    fontSize: '1.25rem',
                    color: '#FFFFFF',
                    margin: '0.15rem 0 0.35rem 0',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {currentUser?.displayName && currentUser.displayName.trim() ? currentUser.displayName : 'No name allocated'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: '#CBD5E1',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    No alumni number allocated
                  </span>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#E2E8F0',
                      background: 'rgba(100, 116, 139, 0.3)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                    }}
                  >
                    Not yet registered
                  </span>

                  {/* Subtle Register as Alumnus Action (Section 5) */}
                  <button
                    id="btn-home-pass-register"
                    onClick={onOpenRegister}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(198, 138, 36, 0.3)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <UserPlus size={13} />
                    <span>Register as Alumnus</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. COMPACT QUICK ACTIONS                                       */}
      {/* ============================================================== */}
      <section style={{ marginBottom: '1.25rem', width: '100%', maxWidth: '100%' }}>
        <div
          className="quick-actions-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.65rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <button
            onClick={() => onNavigate('directory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              color: '#0B271C',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 4px rgba(10, 39, 27, 0.03)',
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={16} />
            </div>
            <span>Registry</span>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              color: '#0B271C',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 4px rgba(10, 39, 27, 0.03)',
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Coins size={16} />
            </div>
            <span>Donations</span>
          </button>

          <button
            onClick={() => onNavigate('attendance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              color: '#0B271C',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 4px rgba(10, 39, 27, 0.03)',
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardCheck size={16} />
            </div>
            <span>Attendance</span>
          </button>

          <button
            onClick={() => onNavigate('membership')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              color: '#0B271C',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 4px rgba(10, 39, 27, 0.03)',
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={16} />
            </div>
            <span>Membership</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. PRIMARY ONE-PAGE GRID: DONATIONS & GIVING + REGISTRY        */}
      {/* ============================================================== */}
      <section style={{ width: '100%', maxWidth: '100%' }}>
        <div className="home-primary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          
          {/* ------------------------------------------------------------ */}
          {/* SECTION A: DONATIONS & GIVING (VOLUNTARY, COMPACT)           */}
          {/* ------------------------------------------------------------ */}
          <div
            className="mosa-card home-card"
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              boxShadow: '0 3px 10px rgba(10, 39, 27, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#0B271C', margin: 0, fontWeight: 800 }}>
                      Donations &amp; Giving
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#4B6354' }}>
                      Voluntary alumni philanthropy &amp; projects
                    </div>
                  </div>
                </div>
                
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                  Contributions
                </span>
              </div>

              {/* Total Contributions Snippet */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #113D2B 0%, #18533B 100%)', 
                  borderRadius: '10px', 
                  padding: '0.9rem 1rem', 
                  color: '#FFFFFF',
                  marginBottom: '0.85rem',
                  boxShadow: '0 4px 12px rgba(10, 39, 27, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#D1FAE5', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Verified Contributions to Date
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FDE68A', margin: '0.1rem 0' }}>
                      UGX {totalVerifiedGiving.toLocaleString()}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D1FAE5', background: 'rgba(22, 163, 74, 0.35)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                    {totalVerifiedGiving > 0 ? 'Active Contributor' : 'Verified Member'}
                  </span>
                </div>
              </div>

              {/* Active Project Progress */}
              {featuredCampaign ? (
                <div style={{ background: '#FAF7EE', borderRadius: '10px', padding: '0.75rem 0.9rem', border: '1px solid #E5DFD1', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B271C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {featuredCampaign.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C68A24', flexShrink: 0 }}>
                      {campaignPercent}%
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: '#E5DFD1', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${campaignPercent}%`, height: '100%', background: 'linear-gradient(90deg, #16A34A, #C68A24)', borderRadius: '999px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#4B6354', marginTop: '0.25rem' }}>
                    <span>Raised: UGX {featuredCampaign.raisedAmount.toLocaleString()}</span>
                    <span>Goal: UGX {featuredCampaign.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FAF7EE', borderRadius: '10px', padding: '0.85rem', border: '1px solid #E5DFD1', marginBottom: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B271C', marginBottom: '0.2rem' }}>
                    No Active Campaigns
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4B6354' }}>
                    School development and project campaigns will appear here.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="home-giving-actions" style={{ display: 'flex', gap: '0.55rem' }}>
              <button
                onClick={() => onNavigate('payments')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <HeartHandshake size={15} />
                <span>Donate to Project</span>
              </button>

              <button
                onClick={() => onNavigate('payments')}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  color: '#0B203E',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <Receipt size={14} />
                <span>Giving History</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* SECTION B: COMPACT ALUMNI REGISTRY PREVIEW                   */}
          {/* ------------------------------------------------------------ */}
          <div
            className="mosa-card home-card"
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid #E5DFD1',
              boxShadow: '0 3px 10px rgba(10, 39, 27, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F2EFE6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#0B271C', margin: 0, fontWeight: 800 }}>
                      Alumni Registry
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#4B6354' }}>
                      {totalAlumniCount > 0 ? `${totalAlumniCount.toLocaleString()} verified scholars recorded` : 'No alumni registered yet'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('directory')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C68A24',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>Directory</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Compact 3-Member Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.85rem' }}>
                {compactAlumni.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', background: '#FAF7EE', borderRadius: '8px', border: '1px dashed #D3CAB8' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0B271C', marginBottom: '0.25rem' }}>
                      No alumni registered yet
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      Be the first Mandelian scholar to complete registration.
                    </div>
                  </div>
                ) : (
                  compactAlumni.map((alumnus, idx) => {
                  const fullName = `${alumnus.firstName} ${alumnus.lastName}`;
                  const occupation = alumnus.occupation || 'Mandela Secondary School Alumnus';
                  const alumniNo = alumnus.alumniNumber || `MA. 000${idx + 1}`;

                  return (
                    <div
                      key={alumnus.internalId}
                      onClick={() => onSelectAlumni ? onSelectAlumni(alumnus) : onNavigate('directory')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.55rem 0.6rem',
                        borderRadius: '8px',
                        background: '#FAF7EE',
                        border: '1px solid #E5DFD1',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Tap to view full profile of ${fullName}`}
                    >
                      {alumnus.photoUrl ? (
                        <img
                          src={alumnus.photoUrl}
                          alt={fullName}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid #D3CAB8',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: '#113D2B',
                            color: '#FDE68A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {alumnus.firstName[0]}{alumnus.lastName[0]}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0B271C', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fullName}
                        </div>
                        <div style={{ color: '#4B6354', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {occupation}
                        </div>
                      </div>

                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          color: '#B45309',
                          background: '#FFFBEB',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '5px',
                          border: '1px solid #FDE68A',
                          flexShrink: 0,
                        }}
                      >
                        {alumniNo}
                      </span>
                    </div>
                  );
                })
              )}
              </div>
            </div>

            {/* Bottom Registry Action */}
            <button
              onClick={() => onNavigate('directory')}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#113D2B',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(10, 39, 27, 0.25)',
              }}
            >
              <span>Explore Complete Registry</span>
              <ArrowRight size={14} color="#FDE68A" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomeView;
