import React, { useState, useEffect } from 'react';
import { AuthUser, ModuleSettings, AlumniProfile } from '../types';
import { isStaffRole, isRegisteredAlumni } from '../services/governanceService';
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
  CheckCircle2,
  BookOpen,
  Newspaper,
  HeartHandshake,
  Image as ImageIcon
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
    registry: true, // open by default like Enrollment in Makerere portal
    giving: false,
    careers: false,
    community: false,
    information: false,
  });

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);
  const isRegistered = isRegisteredAlumni(currentUser);

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
    (currentUser ? 'ALUMNI NO.: 2400707132' : 'ALUMNI NO.: NOT VERIFIED');

  const memberPhoto = memberProfile?.photoUrl || 
    currentUser?.photoUrl || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <header className="mosa-header" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
      <div className="mosa-nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 1.25rem' }}>
        {/* Left: [MENU] Toggle Button matching screenshot format */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              color: '#15803D',
              background: '#FFFFFF',
              border: '1.5px solid #16A34A',
              boxShadow: '0 1px 4px rgba(22, 163, 74, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-expanded={menuOpen}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={16} color="#15803D" strokeWidth={2.5} />
            <span style={{ fontWeight: 800 }}>MENU</span>
          </button>
        </div>

        {/* Center / User Header Section: Profile Photo, "Hi, [NAME] ▾" matching screenshot */}
        <div 
          onClick={() => {
            if (currentUser) {
              handleTabClick('my-profile');
            } else {
              onOpenAuth();
            }
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer',
            padding: '0.25rem 0.6rem',
            borderRadius: '8px',
            transition: 'background 0.2s ease'
          }}
          title={currentUser ? "View Your Profile Pass" : "Login to Your Account"}
        >
          <img
            src={memberPhoto}
            alt={memberDisplayName}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Hi,</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.02em' }}>
              {(memberProfile?.lastName || memberProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'ALUMNUS').toUpperCase()}
            </span>
            <ChevronDown size={14} color="#64748B" />
          </div>
        </div>

        {/* Right Area: Alerts Bell + Desktop Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={onOpenNotifications}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              color: '#334155',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={!isRegistered ? 'Alerts (Registered Alumni Only)' : (unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Alerts` : 'Alerts & Notifications')}
            aria-label="Open Alerts & Notifications"
          >
            <Bell size={22} color="#334155" />
            {isRegistered && unreadNotificationsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 3px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #0A271B',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
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
                  background: currentTab === 'my-profile' ? '#FEF3C7' : '#FFFBEB',
                  border: '1px solid #F59E0B',
                  color: '#B45309',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title="My Personal MOSA Account & Pass"
              >
                <Award size={15} color="#D97706" />
                <span>My Pass</span>
              </button>

              <button 
                onClick={onLogout} 
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
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
                background: '#15803D',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(21, 128, 61, 0.25)',
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
                background: '#FEF3C7',
                border: '1.5px solid #F59E0B',
                color: '#B45309',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
              }}
              title="MOSA Administrative Control Panel"
              aria-label="MOSA Administrative Control Panel"
            >
              <Sliders size={16} color="#D97706" />
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
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
              }}
              title="Staff & Secretariat Administration Login"
              aria-label="Staff & Secretariat Administration Login"
            >
              <ShieldCheck size={15} color="#D97706" />
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
                  {memberNumber.toUpperCase().startsWith('ALUMNI') 
                    ? memberNumber 
                    : `ALUMNI NO.: ${memberNumber}`}
                </div>
              </div>

              {/* ACCORDION 1: REGISTRY & MEMBERSHIP (Green Pen Icon & Green Text - Active like Makerere Enrollment) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('registry')}
                  className={`mosa-portal-menu-row enrollment ${expandedAccordions.registry ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Edit3 size={17} color="#16A34A" />
                    <span>REGISTRY & MEMBERSHIP</span>
                  </div>
                  {expandedAccordions.registry ? (
                    <ChevronUp size={16} color="#16A34A" />
                  ) : (
                    <ChevronDown size={16} color="#16A34A" />
                  )}
                </button>

                {expandedAccordions.registry && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('home')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'home' ? 'active' : ''}`}
                    >
                      <span>MOSA Dashboard & Overview</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('welcome')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'welcome' ? 'active' : ''}`}
                    >
                      <span>Welcome & Association Orientation</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('directory')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'directory' ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>Alumni Directory & Member Search</span>
                        {!isRegistered && (
                          <span style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                            Registered Only
                          </span>
                        )}
                      </div>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('membership')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'membership' ? 'active' : ''}`}
                    >
                      <span>Membership Categories & Rights</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Register</span>
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
                  </div>
                )}
              </div>

              {/* ACCORDION 2: PHILANTHROPY & GIVING (Coins Icon & Highlighted Gray Pill matching Payments) */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('giving')}
                  className={`mosa-portal-menu-row pill-highlight ${expandedAccordions.giving ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Coins size={17} color="#0F172A" />
                    <span>PHILANTHROPY & GIVING</span>
                  </div>
                  {expandedAccordions.giving ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.giving && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'payments' ? 'active' : ''}`}
                    >
                      <span>Annual Alumni Contribution</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>School Development & Building Campaigns</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('payments')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Alumni Welfare & Solidarity Trust Fund</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('documents')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'documents' ? 'active' : ''}`}
                    >
                      <span>Treasury Statements & Official Receipts</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 3: CAREERS & GOVERNANCE */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('careers')}
                  className={`mosa-portal-menu-row ${expandedAccordions.careers ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Briefcase size={17} color="#0F172A" />
                    <span>CAREERS & GOVERNANCE</span>
                  </div>
                  {expandedAccordions.careers ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.careers && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('opportunities')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'opportunities' ? 'active' : ''}`}
                    >
                      <span>Job Opportunities & Career Hub</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'elections' ? 'active' : ''}`}
                    >
                      <span>NEC General Elections & Manifestos</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('elections')}
                      className="mosa-portal-subitem-btn"
                    >
                      <span>Cast Ballot & Certified Results</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 4: COMMUNITY & PROGRAMS */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('community')}
                  className={`mosa-portal-menu-row ${expandedAccordions.community ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Users size={17} color="#0F172A" />
                    <span>COMMUNITY & PROGRAMS</span>
                  </div>
                  {expandedAccordions.community ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.community && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('attendance')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'attendance' ? 'active' : ''}`}
                    >
                      <span>Roll Call & Assembly Sign-In</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('events')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'events' ? 'active' : ''}`}
                    >
                      <span>Alumni Events, Reunions & Dinners</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('gallery')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'gallery' ? 'active' : ''}`}
                    >
                      <span>Heritage & Milestones Photo Gallery</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('chapters')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'chapters' ? 'active' : ''}`}
                    >
                      <span>University & Regional Chapters (MUMASA, etc.)</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACCORDION 5: INFORMATION & HERITAGE */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('information')}
                  className={`mosa-portal-menu-row ${expandedAccordions.information ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <BookOpen size={17} color="#0F172A" />
                    <span>INFORMATION & HERITAGE</span>
                  </div>
                  {expandedAccordions.information ? (
                    <ChevronUp size={16} color="#0F172A" />
                  ) : (
                    <ChevronDown size={16} color="#0F172A" />
                  )}
                </button>

                {expandedAccordions.information && (
                  <div className="mosa-portal-subitems-group">
                    <button
                      type="button"
                      onClick={() => handleTabClick('news')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'news' ? 'active' : ''}`}
                    >
                      <span>News, Circulars & Announcements</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('about')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'about' ? 'active' : ''}`}
                    >
                      <span>About Mandela SS & MOSA History</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('contact')}
                      className={`mosa-portal-subitem-btn ${currentTab === 'contact' ? 'active' : ''}`}
                    >
                      <span>Secretariat Contact & Helpdesk</span>
                      <ChevronRight size={13} opacity={0.6} />
                    </button>
                  </div>
                )}
              </div>

              {/* DIRECT ROW: ARCHIVES */}
              <button
                type="button"
                onClick={() => handleTabClick('documents')}
                className={`mosa-portal-direct-row ${currentTab === 'documents' ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={17} color="#0F172A" />
                  <span>ARCHIVES</span>
                </div>
                <ChevronRight size={14} opacity={0.4} />
              </button>
            </div>

            {/* Footer with Quick Register Action (Guest Only) */}
            {!currentUser && (
              <div className="mosa-portal-menu-footer">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                  className="mosa-portal-footer-action primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <UserPlus size={14} />
                  <span>Join / Register</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </header>
  );
};
