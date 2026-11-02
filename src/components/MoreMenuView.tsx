import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  LogIn, 
  Award, 
  Calendar, 
  Coins, 
  Bell, 
  FileText, 
  Mail, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sliders, 
  Briefcase, 
  GraduationCap, 
  Edit3, 
  Building2, 
  BookOpen, 
  Newspaper, 
  HeartHandshake, 
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { AuthUser, ModuleSettings, AlumniProfile } from '../types';
import { isStaffRole, isRegisteredAlumni } from '../services/governanceService';
import { dataService } from '../services/dataService';
import { MosaLogo } from './MosaLogo';

interface MoreMenuViewProps {
  currentUser: AuthUser | null;
  moduleSettings: ModuleSettings;
  onNavigateTab: (tab: string) => void;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onSwitchToAdmin?: () => void;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({
  currentUser,
  moduleSettings,
  onNavigateTab,
  onOpenRegister,
  onOpenVerify,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onSwitchToAdmin,
}) => {
  const [memberProfile, setMemberProfile] = useState<AlumniProfile | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    registry: true,
    careers: true,
    giving: true,
    community: true,
    heritage: true,
    archives: true,
  });

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);
  const isRegistered = isRegisteredAlumni(currentUser);

  useEffect(() => {
    let isMounted = true;
    if (currentUser) {
      if (currentUser.alumniId) {
        dataService.getAlumniById(currentUser.alumniId).then(profile => {
          if (isMounted && profile) setMemberProfile(profile);
        }).catch(() => {});
      } else if (currentUser.email) {
        dataService.getAlumniList().then(list => {
          if (!isMounted) return;
          const found = list.find(a => 
            a.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
            (currentUser.alumniNumber && a.alumniNumber === currentUser.alumniNumber)
          );
          if (found) setMemberProfile(found);
        }).catch(() => {});
      }
    } else {
      setMemberProfile(null);
    }
    return () => { isMounted = false; };
  }, [currentUser]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAdminClick = () => {
    if (isStaff && onSwitchToAdmin) {
      onSwitchToAdmin();
    } else if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      onOpenAuth();
    }
  };

  const memberDisplayName = memberProfile?.fullName || 
    (memberProfile ? `${memberProfile.firstName} ${memberProfile.lastName}` : currentUser?.displayName) || 
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest Visitor');

  const memberNumber = memberProfile?.alumniNumber || 
    currentUser?.alumniNumber || 
    (currentUser ? 'PENDING' : 'NOT VERIFIED');

  const memberPhoto = memberProfile?.photoUrl || 
    currentUser?.photoUrl || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.25rem 1rem 5rem 1rem' }}>
      {/* 1. INSTITUTIONAL PAGE HEADER */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', padding: '0.4rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <MosaLogo size={42} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FEF08A', fontWeight: 800 }}>
              Mandela Secondary School Hoima (MASSH)
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              MOSA Alumni Services & Menu
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#DCFCE7' }}>
              Full institutional directory, community programs, records & administration
            </p>
          </div>
        </div>
      </div>

      {/* 2. MEMBER PROFILE OR GUEST ONBOARDING CARD */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1.5px solid #86EFAC',
          padding: '1.25rem',
          boxShadow: '0 4px 16px rgba(22, 101, 52, 0.08)',
          marginBottom: '1.5rem'
        }}
      >
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={memberPhoto} 
                alt={memberDisplayName}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #166534',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    {memberDisplayName}
                  </span>
                  {isStaff && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid #FDE68A' }}>
                      STAFF / ADMIN
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <Award size={14} color="#166534" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803D' }}>
                    ALUMNI NO.: {memberNumber}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('my-profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#ECFDF5',
                border: '1.5px solid #166534',
                color: '#15803D',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>View My Digital Pass</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803D' }}>
                Join Mandela Old Students Association
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#4B5563' }}>
                Register your membership or sign in to access official member privileges & the directory.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={onOpenRegister}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#166534',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#F0FDF4',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #86EFAC',
                  cursor: 'pointer'
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. STRUCTURED MENU ACCORDIONS & CATEGORIES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* SECTION 1: REGISTRY & MEMBERSHIP */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('registry')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F0FDF4',
              border: 'none',
              borderBottom: expandedSections.registry ? '1.5px solid #BBF7D0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#DCFCE7', padding: '0.45rem', borderRadius: '8px', color: '#166534' }}>
                <Edit3 size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#15803D' }}>
                  REGISTRY & MEMBERSHIP
                </span>
                <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                  Alumni records, directory search, registration & ID verification
                </div>
              </div>
            </div>
            {expandedSections.registry ? <ChevronUp size={18} color="#166534" /> : <ChevronDown size={18} color="#166534" />}
          </button>

          {expandedSections.registry && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>MOSA Dashboard & Overview</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Primary association hub and active summary</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('welcome')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <GraduationCap size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Welcome & Association Orientation</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Introduction to Mandela Secondary School alumni body</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('directory')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>Alumni Directory & Member Search</span>
                      {!isRegistered && (
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}>
                          Registered Only
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Search classmates by year of completion and profession</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('membership')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Membership Categories & Rights</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ordinary, Associate, Life & Honorary membership guide</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={onOpenRegister}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserPlus size={16} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#059669' }}>Register as an Alumnus</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Apply for permanent MOSA Alumni Number</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={onOpenVerify}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} color="#D97706" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Verify Permanent Alumni Number</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Public verification portal for authenticity verification</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: CAREERS & OPPORTUNITIES */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('careers')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: 'none',
              borderBottom: expandedSections.careers ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#E0E7FF', padding: '0.45rem', borderRadius: '8px', color: '#4338CA' }}>
                <Briefcase size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  CAREERS & OPPORTUNITIES
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Jobs, tenders, mentorship & professional advancement
                </div>
              </div>
            </div>
            {expandedSections.careers ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSections.careers && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('opportunities')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Briefcase size={16} color="#4338CA" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Job Opportunities & Career Hub</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Discover open job vacancies, attachments & business tenders</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 3: CONTRIBUTIONS & GIVING */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('giving')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: 'none',
              borderBottom: expandedSections.giving ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#FEF3C7', padding: '0.45rem', borderRadius: '8px', color: '#B45309' }}>
                <Coins size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  GIVING & CONTRIBUTIONS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Annual subscription, project contributions & fundraising
                </div>
              </div>
            </div>
            {expandedSections.giving ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSections.giving && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('payments')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HeartHandshake size={16} color="#B45309" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Association Giving & Dues</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Annual dues, school infrastructure support & donation pledges</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 4: COMMUNITY & PROGRAMS */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('community')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: 'none',
              borderBottom: expandedSections.community ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#F1F5F9', padding: '0.45rem', borderRadius: '8px', color: '#334155' }}>
                <Users size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  COMMUNITY & PROGRAMS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Assembly attendance roll call, reunions, galleries & university chapters
                </div>
              </div>
            </div>
            {expandedSections.community ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSections.community && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Roll Call & Assembly Sign-In</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Self check-in for physical & online alumni reunions</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={16} color="#0284C7" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Alumni Events, Reunions & Dinners</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Official association calendar, dinners and sports galas</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('gallery')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ImageIcon size={16} color="#D97706" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Heritage & Milestones Photo Gallery</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Historic campus photos, events & memorial albums</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('chapters')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Building2 size={16} color="#7C3AED" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>University & Regional Chapters</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Connect with MUMASA, Kampala, Hoima and global branches</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 5: INFORMATION & HERITAGE */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('heritage')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: 'none',
              borderBottom: expandedSections.heritage ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#F1F5F9', padding: '0.45rem', borderRadius: '8px', color: '#334155' }}>
                <BookOpen size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  INFORMATION & HERITAGE
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  School history, announcements, circulars & secretariat contacts
                </div>
              </div>
            </div>
            {expandedSections.heritage ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSections.heritage && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('news')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Newspaper size={16} color="#0284C7" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>News, Circulars & Announcements</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Official association news, executive resolutions & press releases</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('about')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <GraduationCap size={16} color="#166534" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>About Mandela SS & MOSA History</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Founded in 1997, motto "Caring to Achieve" & executive committee</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('contact')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} color="#EA4335" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Secretariat Contact & Helpdesk</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Physical address, phone lines & email support</div>
                  </div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </button>
            </div>
          )}
        </div>

        {/* SECTION 6: ARCHIVES */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => onNavigateTab('documents')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#F1F5F9', padding: '0.45rem', borderRadius: '8px', color: '#334155' }}>
                <FileText size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  ARCHIVES & CONSTITUTION
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Download official constitution, reports and governing policies
                </div>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>
        </div>

      </div>

      {/* 4. ACCOUNT ACTION (LOGOUT / LOGIN) AS REQUESTED */}
      <div style={{ marginTop: '2rem' }}>
        {currentUser ? (
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1.25rem',
              background: '#FEF2F2',
              color: '#DC2626',
              border: '1.5px solid #FCA5A5',
              borderRadius: '12px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
            }}
          >
            <LogOut size={18} color="#DC2626" />
            <span>Sign Out of Account ({currentUser.email || currentUser.displayName})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1.25rem',
              background: '#F0FDF4',
              color: '#166534',
              border: '1.5px solid #86EFAC',
              borderRadius: '12px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={18} color="#166534" />
            <span>Sign In to Your Account</span>
          </button>
        )}
      </div>

      {/* 5. ADMIN SECTION (APPEARS THE VERY LAST AT THE BOTTOM AS REQUESTED) */}
      <div style={{ marginTop: '1rem' }}>
        <div
          onClick={handleAdminClick}
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            border: '2px solid #F59E0B',
            borderRadius: '14px',
            padding: '1.25rem',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: '#F59E0B', padding: '0.6rem', borderRadius: '10px', color: '#0F172A' }}>
              <Sliders size={22} color="#0F172A" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FDE68A', letterSpacing: '0.02em' }}>
                  MOSA Administrative Control Panel
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#F59E0B', color: '#0F172A', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                  STAFF ONLY
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Alumni approvals, verification tokens, event setup & system settings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FDE68A', fontSize: '0.82rem', fontWeight: 700 }}>
            <span>Access Admin</span>
            <ChevronRight size={16} color="#FDE68A" />
          </div>
        </div>
      </div>

    </div>
  );
};

const itemButtonStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1.25rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #F1F5F9',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s ease'
};
