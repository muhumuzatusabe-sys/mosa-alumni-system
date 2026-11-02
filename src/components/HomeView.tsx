import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Coins, 
  HeartHandshake, 
  Receipt,
  ClipboardCheck,
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

  // Resolve user/member profile photo to ensure it always reflects on the card
  const userPhoto = memberProfile?.photoUrl || 
    currentUser?.photoUrl || 
    (userApplication as any)?.photoUrl || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <div className="home-container" style={{ width: '100%', maxWidth: '1160px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* ============================================================== */}
      {/* 1. COMPACT MEMBER IDENTITY & PROFILE SUMMARY                   */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 1. COMPACT MEMBER IDENTITY & DIGITAL ALUMNI PASS               */}
      {/* ============================================================== */}
      <section style={{ marginBottom: '0.75rem', width: '100%', maxWidth: '100%' }}>
        <div
          className="member-identity-card"
          style={{
            background: 'linear-gradient(135deg, #15803D 0%, #166534 65%, #14532D 100%)',
            borderRadius: '16px',
            padding: '1.25rem 1.4rem',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(22, 101, 52, 0.22)',
            border: '1.5px solid #F59E0B',
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
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#FEF08A',
                    fontWeight: 800,
                  }}
                >
                  MASSH ALUMNI PORTAL
                </span>

                {memberProfile.photoUrl ? (
                  <img
                    src={memberProfile.photoUrl}
                    alt={memberProfile.firstName || 'MASSH Alumnus'}
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3.5px solid #FDE68A',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D97706, #B45309)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.9rem',
                      fontWeight: 800,
                      border: '3.5px solid #FDE68A',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {`${memberProfile.firstName?.[0] || 'M'}${memberProfile.lastName?.[0] || 'A'}`}
                  </div>
                )}
              </div>

              {/* Member Details Hierarchy */}
              <div style={{ minWidth: 0, flex: 1 }}>

                <h2
                  style={{
                    fontSize: '1.35rem',
                    color: '#FFFFFF',
                    margin: '0.15rem 0 0.45rem 0',
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
                      fontSize: '0.88rem',
                      color: '#FEF08A',
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(254, 240, 138, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Award size={14} color="#FBBF24" />
                    <span>{memberProfile.alumniNumber}</span>
                  </span>
                </div>
              </div>
            </>
          ) : userApplication ? (
            /* CASE 2: REGISTRATION SUBMITTED & AWAITING VERIFICATION */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#FEF08A',
                    fontWeight: 800,
                  }}
                >
                  MASSH ALUMNI PORTAL
                </span>

                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userApplication?.firstName || currentUser?.displayName || 'MASSH Member'}
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3.5px dashed #FDE68A',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#FCD34D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3.5px dashed #FDE68A',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <Clock size={36} />
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>

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
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#FEF08A',
                    fontWeight: 800,
                  }}
                >
                  MASSH ALUMNI PORTAL
                </span>

                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={currentUser?.displayName || 'MASSH Member'}
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3.5px solid #FDE68A',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#FEF08A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3.5px solid rgba(254, 240, 138, 0.5)',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <GraduationCap size={36} color="#FEF08A" />
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h2
                  style={{
                    fontSize: '1.3rem',
                    color: '#FFFFFF',
                    margin: '0.1rem 0 0.45rem 0',
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
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#FEF08A',
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(254, 240, 138, 0.35)',
                    }}
                  >
                    No alumni number allocated
                  </span>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#FEE2E2',
                      background: 'rgba(239, 68, 68, 0.25)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(248, 113, 113, 0.4)',
                    }}
                  >
                    Not yet registered
                  </span>

                  {/* Register as Alumnus Action */}
                  <button
                    id="btn-home-pass-register"
                    onClick={onOpenRegister}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <UserPlus size={14} />
                    <span>Register</span>
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
      <section style={{ marginBottom: '0.75rem', width: '100%', maxWidth: '100%' }}>
        <div
          className="quick-actions-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
              boxShadow: '0 1px 4px rgba(22, 101, 52, 0.03)',
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
              boxShadow: '0 1px 4px rgba(22, 101, 52, 0.03)',
            }}
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              boxShadow: '0 1px 4px rgba(22, 101, 52, 0.03)',
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
              boxShadow: '0 1px 4px rgba(22, 101, 52, 0.03)',
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
      {/* 3. PRIMARY ONE-PAGE SECTION: DONATIONS & GIVING (TERMINATING AT GIVING HISTORY) */}
      {/* ============================================================== */}
      <section style={{ width: '100%', maxWidth: '100%' }}>
        <div
          className="mosa-card home-card"
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '14px',
            background: '#FFFFFF',
            border: '1px solid #E5DFD1',
            boxShadow: '0 3px 10px rgba(22, 101, 52, 0.05)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid #BBF7D0' }}>
              Contributions
            </span>
          </div>

          {/* Total Contributions Snippet */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #15803D 0%, #166534 65%, #14532D 100%)', 
              borderRadius: '10px', 
              padding: '0.85rem 1rem', 
              color: '#FFFFFF',
              marginBottom: '0.85rem',
              boxShadow: '0 4px 12px rgba(22, 101, 52, 0.16)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#D1FAE5', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Verified Contributions to Date
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FDE68A', margin: '0.1rem 0' }}>
                  UGX {totalVerifiedGiving.toLocaleString()}
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D1FAE5', background: 'rgba(255, 255, 255, 0.18)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                {totalVerifiedGiving > 0 ? 'Active Contributor' : 'Alumni Contributor'}
              </span>
            </div>
          </div>

          {/* Active Project Progress */}
          {featuredCampaign ? (
            <div style={{ background: '#FAF7EE', borderRadius: '10px', padding: '0.75rem 0.9rem', border: '1px solid #E5DFD1', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B271C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {featuredCampaign.title}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C68A24', flexShrink: 0 }}>
                  {campaignPercent}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '7px', background: '#E5DFD1', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${campaignPercent}%`, height: '100%', background: 'linear-gradient(90deg, #15803D, #C68A24)', borderRadius: '999px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#4B6354', marginTop: '0.3rem' }}>
                <span>Raised: UGX {featuredCampaign.raisedAmount.toLocaleString()}</span>
                <span>Goal: UGX {featuredCampaign.targetAmount.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FAF7EE', borderRadius: '10px', padding: '0.85rem', border: '1px solid #E5DFD1', marginBottom: '0.9rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B271C', marginBottom: '0.15rem' }}>
                No Active Campaigns
              </div>
              <div style={{ fontSize: '0.72rem', color: '#4B6354' }}>
                School development and project campaigns will appear here.
              </div>
            </div>
          )}

          {/* Action Buttons: Donate to Project & Giving History (Final Element on Homepage) */}
          <div className="home-giving-actions" style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => onNavigate('payments')}
              style={{
                flex: 1,
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #15803D, #166534)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)',
              }}
            >
              <HeartHandshake size={16} />
              <span>Donate to Project</span>
            </button>

            <button
              onClick={() => onNavigate('payments')}
              style={{
                flex: 1,
                padding: '0.7rem 0.9rem',
                borderRadius: '8px',
                background: '#F8FAFC',
                color: '#0F172A',
                fontWeight: 600,
                fontSize: '0.84rem',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Receipt size={15} color="#475569" />
              <span>Giving History</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeView;
