import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  Award, 
  Calendar, 
  FileText, 
  Mail, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase, 
  GraduationCap, 
  BookOpen, 
  Newspaper, 
  Image as ImageIcon,
  Home,
  Phone,
  MapPin,
  Globe,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { AuthUser, ModuleSettings } from '../types';
import { isStaffRole } from '../services/governanceService';

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
  onOpenRegister: _onOpenRegister,
  onOpenVerify: _onOpenVerify,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onSwitchToAdmin,
}) => {
  // Accordion state: ONLY ONE major item can be expanded at a time.
  // Initially null (all closed) so the page is never congested on load or return.
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  const toggleSection = (key: string) => {
    setExpandedSection(prev => (prev === key ? null : key));
  };

  const handleAdminClick = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else if (onSwitchToAdmin) {
      onSwitchToAdmin();
    } else {
      onOpenAuth();
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.25rem 1rem 5rem 1rem' }}>
      
      {/* 1. STRUCTURED MENU ITEMS & CATEGORIES */}
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
                  Alumni overview, student orientation &amp; official membership tiers
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
            </div>
          )}
        </div>

        {/* SECTION 2: CAREERS & OPPORTUNITIES (DIRECT SINGLE ITEM — NO SUB-ITEM) */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => onNavigateTab('opportunities')}
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
            <ChevronRight size={16} color="#94A3B8" />
          </button>
        </div>

        {/* SECTION 3: COMMUNITY & PROGRAMS (RETAINING EVENTS & REUNIONS + HERITAGE GALLERY) */}
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
                  Alumni reunions, official events calendar &amp; campus photo gallery
                </div>
              </div>
            </div>
            {expandedSection === 'community' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'community' && (
            <div style={{ padding: '0.5rem 0' }}>
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
            </div>
          )}
        </div>

        {/* SECTION 4: INFORMATION & HERITAGE */}
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
                  School history, circulars, resolutions &amp; announcements
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
            </div>
          )}
        </div>

        {/* SECTION 5: ARCHIVES & CONSTITUTION (DIRECT SINGLE ITEM) */}
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

        {/* SECTION 6: CONTACTS & OFFICIAL SOCIALS (DEDICATED SECTION WITH COMPLETE DETAILS & SOCIALS) */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('contacts')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: '#F8FAFC',
              border: 'none',
              borderBottom: expandedSection === 'contacts' ? '1.5px solid #E2E8F0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#DCFCE7', padding: '0.45rem', borderRadius: '8px', color: '#14532D' }}>
                <Phone size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                  CONTACTS &amp; OFFICIAL SOCIALS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Secretariat phone lines, official email, campus location &amp; social channels
                </div>
              </div>
            </div>
            {expandedSection === 'contacts' ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
          </button>

          {expandedSection === 'contacts' && (
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Phone Lines */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} />
                  <span>Official Secretariat Phone Lines</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <a href="tel:+256772411921" style={contactLinkStyle}>+256 772 411921</a>
                  <a href="tel:+256706599793" style={contactLinkStyle}>+256 706 599793</a>
                  <a href="tel:+256773432413" style={contactLinkStyle}>+256 773 432413</a>
                </div>
              </div>

              {/* Official Email */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} />
                  <span>Official Email Address</span>
                </div>
                <div>
                  <a href="mailto:masshalumni@gmail.com" style={contactLinkStyle}>masshalumni@gmail.com</a>
                </div>
              </div>

              {/* Physical Location */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} />
                  <span>Physical Secretariat Office</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                  Mandela Secondary School Hoima, Plot 14, Main Street, P.O. Box 244, Hoima, Uganda
                </div>
              </div>

              {/* Social Channels */}
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={14} />
                  <span>Official Social Media &amp; Community Channels</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  <a 
                    href="https://wa.me/256772411921" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={socialButtonStyle}
                  >
                    <MessageSquare size={15} color="#25D366" />
                    <span>WhatsApp Secretariat</span>
                    <ExternalLink size={12} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                  </a>

                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={socialButtonStyle}
                  >
                    <Globe size={15} color="#1877F2" />
                    <span>Facebook Community</span>
                    <ExternalLink size={12} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                  </a>

                  <a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={socialButtonStyle}
                  >
                    <Globe size={15} color="#0F172A" />
                    <span>X (Twitter) @masshalumni</span>
                    <ExternalLink size={12} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                  </a>

                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={socialButtonStyle}
                  >
                    <Globe size={15} color="#0A66C2" />
                    <span>LinkedIn Alumni Network</span>
                    <ExternalLink size={12} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                  </a>
                </div>
              </div>

              {/* Action Button to Full Inquiry Page */}
              <button
                type="button"
                onClick={() => onNavigateTab('contact')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  background: '#0A271B',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.25rem'
                }}
              >
                <Mail size={15} />
                <span>Open Secretariat Helpdesk &amp; Inquiry Form</span>
              </button>
            </div>
          )}
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
              background: '#FFFFFF',
              color: '#334155',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#334155';
            }}
          >
            <LogOut size={18} color="#475569" />
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

const contactLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#0A271B',
  background: '#FFFFFF',
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid #CBD5E1',
  textDecoration: 'none',
};

const socialButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.45rem 0.75rem',
  borderRadius: '6px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#334155',
  textDecoration: 'none',
};
