import React, { useState, useEffect } from 'react';
import { AuthUser, ModuleSettings, AlumniProfile } from '../types';
import { isStaffRole } from '../services/governanceService';
import { dataService } from '../services/dataService';
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
  Menu, 
  X, 
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sliders,
  Briefcase,
  Vote,
  GraduationCap,
  Edit3,
  Building2,
  User,
  CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  currentUser: AuthUser | null;
  moduleSettings: ModuleSettings;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenRegister: () => void;
  onOpenVerify?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onSwitchToAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  moduleSettings,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenRegister,
  onOpenVerify,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onSwitchToAdmin,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [memberProfile, setMemberProfile] = useState<AlumniProfile | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    enrollment: false,
    payments: false,
    programme: false,
    services: false,
    voting: false,
    admin: false,
  });

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  // Load Member Profile for Identity Box
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

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTabClick = (tabKey: string) => {
    setCurrentTab(tabKey);
    setMenuOpen(false);
  };

  const handleAdminClick = () => {
    setMenuOpen(false);
    if (isStaff && onSwitchToAdmin) {
      onSwitchToAdmin();
    } else if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      onOpenAuth();
    }
  };

  // Member Identity Card Details (matching Makerere portal format: MUHUMUZA Tusabe, STUDENT NO.: 2400707132)
  const memberDisplayName = memberProfile?.fullName || 
    (memberProfile ? `${memberProfile.firstName} ${memberProfile.lastName}` : currentUser?.displayName) || 
    (currentUser ? 'MUHUMUZA Tusabe' : 'GUEST ALUMNUS');

  const memberNumber = memberProfile?.alumniNumber || 
    currentUser?.alumniNumber || 
    (currentUser ? 'STUDENT NO.: 2400707132' : 'STUDENT NO.: NOT VERIFIED');

  const memberPhoto = memberProfile?.photoUrl || 
    currentUser?.photoUrl || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <header className="mosa-header" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
      <div className="mosa-nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 1.25rem' }}>
        {/* Left: Menu Drawer Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '9px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: menuOpen ? '#4ADE80' : '#FFFFFF',
              background: menuOpen ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.08)',
              border: menuOpen ? '1.5px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: menuOpen ? '0 0 14px rgba(34, 197, 94, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-expanded={menuOpen}
            aria-label="Open MOSA Member Services Menu"
            title="Explore All MOSA Services & Sections"
          >
            {menuOpen ? <X size={18} color="#4ADE80" /> : <Menu size={18} color="#4ADE80" />}
            <span style={{ fontWeight: 700 }}>Menu</span>
            <ChevronDown size={14} style={{ opacity: 0.9, color: menuOpen ? '#4ADE80' : '#E2E8F0', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>
        </div>

        {/* Centre / Left: MOSA Branding & Application Title */}
        <div 
          className="brand-wrapper" 
          onClick={() => handleTabClick('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 1, minWidth: 0, textDecoration: 'none' }}
        >
          <div className="massh-crest" style={{ width: '38px', height: '38px', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)', flexShrink: 0 }}>
            <span>MASSH</span>
          </div>
          <div className="brand-text" style={{ minWidth: 0, overflow: 'hidden' }}>
            <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span className="hidden sm:inline">MASSH ALUMNI PORTAL</span>
              <span className="sm:hidden">MOSA PORTAL</span>
            </h1>
            <div className="subtext" style={{ fontSize: '0.68rem', color: '#FCD34D', letterSpacing: '0.03em', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              MOSA • Est. 1997
            </div>
          </div>
        </div>

        {/* Right Area: Actionable Notifications, Member Identity Pass / Auth, and Far-Right Admin Panel (Exclusively Staff) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: 'auto' }}>
          
          {/* Notifications Button (Dedicated Notifications View Trigger) */}
          <button
            onClick={onOpenNotifications}
            style={{
              position: 'relative',
              background: currentTab === 'notifications' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              border: currentTab === 'notifications' ? '1px solid #D97706' : '1px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Alerts` : 'Notifications Service Centre'}
            aria-label="Open Notifications Centre"
          >
            <Bell size={18} color={unreadNotificationsCount > 0 ? '#FBBF24' : '#E2E8F0'} />
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #0A271B',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                }}
              >
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Member Authentication / My Account Pass - Hidden on mobile, accessible via bottom nav and menu */}
          {currentUser ? (
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => handleTabClick('my-profile')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: currentTab === 'my-profile' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid #F59E0B',
                  color: '#FDE68A',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="My Personal MOSA Account & Pass"
              >
                <Award size={15} color="#FBBF24" />
                <span>My Pass</span>
              </button>

              <button 
                onClick={onLogout} 
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#CBD5E1',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden md:inline-flex"
              style={{
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              }}
            >
              <LogIn size={15} />
              <span>Login</span>
            </button>
          )}

          {/* Far Right: Admin Panel Access - Hidden on mobile, accessible via bottom nav and menu */}
          {isStaff ? (
            <button
              onClick={handleAdminClick}
              className="hidden md:inline-flex"
              style={{
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.45), rgba(180, 83, 9, 0.45))',
                border: '1.5px solid #F59E0B',
                color: '#FDE68A',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              }}
              title="MOSA Administrative Control Panel"
              aria-label="MOSA Administrative Control Panel"
            >
              <Sliders size={16} color="#FBBF24" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              onClick={handleAdminClick}
              className="hidden md:inline-flex"
              style={{
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.7rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
              }}
              title="Staff & Secretariat Administration Login"
              aria-label="Staff & Secretariat Administration Login"
            >
              <ShieldCheck size={15} color="#FBBF24" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* RESTORED OFFICIAL INSTITUTIONAL MEMBERSHIP MENU (MAKERERE PORTAL STYLE) */}
      {menuOpen && (
        <>
          {/* Backdrop for click-outside dismissal */}
          <div 
            className="mosa-portal-menu-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* White Card Container Matching Screenshot */}
          <div 
            className="mosa-portal-menu-card"
            role="dialog"
            aria-label="MOSA Institutional Navigation Menu"
          >
            {/* Top Header: MASSH Crest & Green Uppercase Institution Title */}
            <div className="mosa-portal-menu-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                <div className="massh-crest" style={{ width: '36px', height: '36px', fontSize: '0.8rem', flexShrink: 0 }}>
                  <span>MASSH</span>
                </div>
                <div className="mosa-portal-inst-title">
                  MANDELA SECONDARY SCHOOL HOIMA
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="mosa-portal-close-btn"
                aria-label="Close Menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body Containing All Items & Subitems */}
            <div className="mosa-portal-scroll-body">
              {/* Dark Slate Member Profile ID Box */}
              <div className="mosa-portal-id-box">
                <img 
                  src={memberPhoto} 
                  alt={memberDisplayName}
                  className="mosa-portal-id-photo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';
                  }}
                />
                <div className="mosa-portal-id-name">
                  {memberDisplayName}
                </div>
                <div className="mosa-portal-id-number">
                  {memberNumber.toUpperCase().startsWith('STUDENT') || memberNumber.toUpperCase().startsWith('ALUMNI') 
                    ? memberNumber 
                    : `STUDENT NO.: ${memberNumber}`}
                </div>
              </div>

              {/* 01 GENERATE PRN / DIGITAL PASS */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (currentUser) {
                    handleTabClick('my-profile');
                  } else {
                    onOpenAuth();
                  }
                }}
                className="mosa-portal-numbered-action"
              >
                <span className="mosa-portal-num-prefix">01</span>
                <span className="mosa-portal-num-label">GENERATE PRN / DIGITAL PASS</span>
              </button>

              {/* ACCORDION 1: ENROLLMENT & REGISTRATION (Green Pen Icon & Green Text) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('enrollment')}
                  className={`mosa-portal-menu-row enrollment ${expandedAccordions.enrollment ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Edit3 size={17} color="#16A34A" />
                    <span>ENROLLMENT & REGISTRATION</span>
                  </div>
                  {expandedAccordions.enrollment ? (
                    <ChevronUp size={16} color="#16A34A" />
                  ) : (
                    <ChevronDown size={16} color="#16A34A" />
                  )}
                </button>

                {expandedAccordions.enrollment && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Register as Alumnus (New Member)</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); if (onOpenVerify) onOpenVerify(); }}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Verify Permanent Alumni Number</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('membership')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'membership' ? 'active' : ''}`}
                    >
                      <span>Official Membership Rights & Guide</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('welcome')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'welcome' ? 'active' : ''}`}
                    >
                      <span>MOSA Welcome & Orientation Page</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('attendance')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'attendance' ? 'active' : ''}`}
                    >
                      <span>Member Roll Call & Assembly Sign-In</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 2: PAYMENTS (Highlighted soft-gray pill matching image) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('payments')}
                  className={`mosa-portal-menu-row pill-highlight ${expandedAccordions.payments ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Coins size={17} color="#0F172A" />
                    <span>PAYMENTS</span>
                  </div>
                  {expandedAccordions.payments ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.payments && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'payments' ? 'active' : ''}`}
                    >
                      <span>Annual Membership Subscription (UGX 50k)</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>School Development Project Campaigns</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Alumni Welfare & Emergency Aid Fund</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Treasury Statements & Numbered Invoices</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 3: MY PROGRAMME (ALUMNI REGISTRY & CHAPTERS) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('programme')}
                  className={`mosa-portal-menu-row ${expandedAccordions.programme ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <GraduationCap size={17} color="#0F172A" />
                    <span>MY PROGRAMME & CHAPTERS</span>
                  </div>
                  {expandedAccordions.programme ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.programme && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('directory')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'directory' ? 'active' : ''}`}
                    >
                      <span>Complete Alumni Directory & Member Search</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('chapters')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'chapters' ? 'active' : ''}`}
                    >
                      <span>University Chapters (MUMASA, KYUMASA)</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('chapters')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Regional & Diaspora Chapters</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('directory')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Academic Cohorts & Alumni Sets</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 4: SERVICES & OPPORTUNITIES */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('services')}
                  className={`mosa-portal-menu-row ${expandedAccordions.services ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Building2 size={17} color="#0F172A" />
                    <span>SERVICES & OPPORTUNITIES</span>
                  </div>
                  {expandedAccordions.services ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.services && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('opportunities')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'opportunities' ? 'active' : ''}`}
                    >
                      <span>Jobs, Internships & Tenders Hub</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('opportunities')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Alumni Career Mentorship Network</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('events')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'events' ? 'active' : ''}`}
                    >
                      <span>Events, Reunions & Sports Gala</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('gallery')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'gallery' ? 'active' : ''}`}
                    >
                      <span>Campus Heritage & Milestones Gallery</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('contact')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'contact' ? 'active' : ''}`}
                    >
                      <span>Secretariat Helpdesk & WhatsApp Inquiries</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 5: E-VOTING & ELECTIONS */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('voting')}
                  className={`mosa-portal-menu-row ${expandedAccordions.voting ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Vote size={17} color="#0F172A" />
                    <span>E-VOTING</span>
                  </div>
                  {expandedAccordions.voting ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.voting && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'elections' ? 'active' : ''}`}
                    >
                      <span>NEC Executive General Elections</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Candidate Manifestos & Profiles</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Cast Secure Digital Ballot</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Certified Election Results & Archive</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* DIRECT ROW: BIO DATA */}
              <button
                type="button"
                onClick={() => handleTabClick('my-profile')}
                className={`mosa-portal-direct-row ${currentTab === 'my-profile' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <User size={17} color="#0F172A" />
                  <span>BIO DATA</span>
                </div>
                <ChevronRight size={14} opacity={0.4} />
              </button>

              {/* DIRECT ROW: MY MAILBOX */}
              <button
                type="button"
                onClick={() => handleTabClick('notifications')}
                className={`mosa-portal-direct-row ${currentTab === 'notifications' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Mail size={17} color="#0F172A" />
                  <span>MY MAILBOX</span>
                </div>
                {unreadNotificationsCount > 0 ? (
                  <span className="mosa-portal-unread-badge">
                    {unreadNotificationsCount}
                  </span>
                ) : (
                  <ChevronRight size={14} opacity={0.4} />
                )}
              </button>

              {/* DIRECT ROW: ACADEMIC CALENDAR */}
              <button
                type="button"
                onClick={() => handleTabClick('events')}
                className={`mosa-portal-direct-row ${currentTab === 'events' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Calendar size={17} color="#0F172A" />
                  <span>ACADEMIC CALENDAR</span>
                </div>
                <ChevronRight size={14} opacity={0.4} />
              </button>

              {/* DIRECT ROW: EVALUATION SURVEYS */}
              <button
                type="button"
                onClick={() => handleTabClick('documents')}
                className={`mosa-portal-direct-row ${currentTab === 'documents' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={17} color="#0F172A" />
                  <span>EVALUATION SURVEYS & ARCHIVES</span>
                </div>
                <ChevronRight size={14} opacity={0.4} />
              </button>

              {/* OPTIONAL ACCORDION: ADMINISTRATION CONSOLE (Staff/Admins only) */}
              {isStaff && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('admin')}
                    className={`mosa-portal-menu-row ${expandedAccordions.admin ? 'active' : ''}`}
                    style={{ color: '#D97706' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <ShieldCheck size={17} color="#D97706" />
                      <span>ADMINISTRATION CONSOLE</span>
                    </div>
                    {expandedAccordions.admin ? (
                      <ChevronUp size={16} color="#D97706" />
                    ) : (
                      <ChevronDown size={16} color="#D97706" />
                    )}
                  </button>

                  {expandedAccordions.admin && (
                    <div className="mosa-portal-subitems-group">
                      <button
                        type="button"
                        onClick={handleAdminClick}
                        className="mosa-portal-subitem-btn"
                      >
                        <span>Executive Control Panel & Stats</span>
                        <ChevronRight size={13} opacity={0.6} />
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminClick}
                        className="mosa-portal-subitem-btn"
                      >
                        <span>Alumni Approvals & Registry Desk</span>
                        <ChevronRight size={13} opacity={0.6} />
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminClick}
                        className="mosa-portal-subitem-btn"
                      >
                        <span>Content Management System (CMS)</span>
                        <ChevronRight size={13} opacity={0.6} />
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminClick}
                        className="mosa-portal-subitem-btn"
                      >
                        <span>System Security & Audit Trail</span>
                        <ChevronRight size={13} opacity={0.6} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Quick Verify & Register Actions */}
            <div className="mosa-portal-menu-footer">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); handleTabClick('my-profile'); }}
                    className="mosa-portal-footer-action primary"
                  >
                    <Award size={14} />
                    <span>My Digital Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    className="mosa-portal-footer-action"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); if (onOpenVerify) onOpenVerify(); }}
                    className="mosa-portal-footer-action"
                  >
                    <ShieldCheck size={14} color="#15803D" />
                    <span>Verify Alumnus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                    className="mosa-portal-footer-action primary"
                  >
                    <UserPlus size={14} />
                    <span>Join / Register</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

    </header>
  );
};
