import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  LogIn, 
  Award, 
  Calendar, 
  Landmark, 
  FileText, 
  Mail, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Newspaper, 
  HeartHandshake, 
  Image as ImageIcon,
  CheckCircle2,
  Home
} from 'lucide-react';
import { AuthUser, ModuleSettings } from '../types';
import { isStaffRole, isRegisteredAlumni } from '../services/governanceService';

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
  moduleSettings: _moduleSettings,
  onNavigateTab,
  onOpenRegister,
  onOpenVerify,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onSwitchToAdmin,
}) => {
  // Accordion state: ONLY ONE major item can be expanded at a time.
  // Initially null (all closed) so the page is never congested on load or return.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);
  const isRegistered = isRegisteredAlumni(currentUser);

  const toggleSection = (key: string) => {
    setExpandedSection(prev => (prev === key ? null : key));
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.25rem 1rem 5rem 1rem' }}>
      
      {/* 1. STRUCTURED MENU ACCORDIONS & CATEGORIES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

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
              borderBottom: expandedSection === 'registry' ? '1.5px solid #BBF7D0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#DCFCE7', padding: '0.45rem', borderRadius: '8px', color: '#0A271B' }}>
                <Users size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532D' }}>
                  REGISTRY &amp; MEMBERSHIP
                </span>
                <div style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                  Alumni records, directory search, registration &amp; ID verification
                </div>
              </div>
            </div>
            {expandedSection === 'registry' ? <ChevronUp size={18} color="#0A271B" /> : <ChevronDown size={18} color="#0A271B" />}
          </button>

          {expandedSection === 'registry' && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Home size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>MOSA Dashboard &amp; Overview</div>
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
                  <GraduationCap size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Welcome &amp; Association Orientation</div>
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
                  <Users size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>Alumni Directory &amp; Member Search</span>
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
                  <Award size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Official Membership &amp; Numbering</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ordinary, Associate, Life &amp; Honorary tiers and ID number guide</div>
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
              borderBottom: expandedSection === 'careers' ? '1.5px solid #E2E8F0' : 'none',
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
                  CAREERS &amp; OPPORTUNITIES
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Jobs, tenders, mentorship &amp; professional advancement
                </div>
              </div>
            </div>
            {expandedSection === 'careers' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'careers' && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('opportunities')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Briefcase size={16} color="#4338CA" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Job Opportunities &amp; Career Hub</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Discover open job vacancies, attachments &amp; business tenders</div>
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
              borderBottom: expandedSection === 'giving' ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#FEF3C7', padding: '0.45rem', borderRadius: '8px', color: '#B45309' }}>
                <Landmark size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  GIVING &amp; CONTRIBUTIONS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Annual subscription, project contributions &amp; fundraising
                </div>
              </div>
            </div>
            {expandedSection === 'giving' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'giving' && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('payments')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HeartHandshake size={16} color="#B45309" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Association Giving &amp; Dues</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Annual dues, school infrastructure support &amp; donation pledges</div>
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
              borderBottom: expandedSection === 'community' ? '1.5px solid #E2E8F0' : 'none',
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
                  COMMUNITY &amp; PROGRAMS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Assembly attendance roll call, reunions, galleries &amp; university chapters
                </div>
              </div>
            </div>
            {expandedSection === 'community' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'community' && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Roll Call &amp; Assembly Sign-In</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Self check-in for physical &amp; online alumni reunions</div>
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
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Alumni Events, Reunions &amp; Dinners</div>
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
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Heritage &amp; Milestones Photo Gallery</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Historic campus photos, events &amp; memorial albums</div>
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
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>University &amp; Regional Chapters</div>
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
              borderBottom: expandedSection === 'heritage' ? '1.5px solid #E2E8F0' : 'none',
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
                  INFORMATION &amp; HERITAGE
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  School history, announcements, circulars &amp; secretariat contacts
                </div>
              </div>
            </div>
            {expandedSection === 'heritage' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'heritage' && (
            <div style={{ padding: '0.5rem 0' }}>
              <button
                type="button"
                onClick={() => onNavigateTab('news')}
                style={itemButtonStyle}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Newspaper size={16} color="#0284C7" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>News, Circulars &amp; Announcements</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Official association news, executive resolutions &amp; press releases</div>
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
                  <GraduationCap size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>About Mandela SS &amp; MOSA History</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Founded in 1997, motto "Caring to Achieve" &amp; executive committee</div>
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
                  <Mail size={16} color="#0A271B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#1E293B' }}>Secretariat Contact &amp; Helpdesk</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Physical address, phone lines &amp; email support</div>
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
                  ARCHIVES &amp; CONSTITUTION
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

      {/* 2. ACCOUNT ACTION (LOGOUT / LOGIN) */}
      <div style={{ marginTop: '1.75rem' }}>
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
            <span>Sign Out ({currentUser.email || currentUser.displayName})</span>
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
              color: '#0A271B',
              border: '1.5px solid #86EFAC',
              borderRadius: '12px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={18} color="#0A271B" />
            <span>Sign In to Your Account</span>
          </button>
        )}
      </div>

      {/* 3. ADMIN BUTTON (Simple, sleek, just Admin) */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleAdminClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            color: '#475569',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0A271B';
            e.currentTarget.style.borderColor = '#0A271B';
            e.currentTarget.style.background = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.background = '#F8FAFC';
          }}
        >
          <ShieldCheck size={15} />
          <span>Admin</span>
        </button>
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
