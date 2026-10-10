import React, { useState } from 'react';
import { AuthUser, ModuleSettings } from '../types';
import { isStaffRole } from '../services/governanceService';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  LogIn, 
  Award, 
  Landmark, 
  Calendar, 
  Coins, 
  Megaphone, 
  Bell, 
  FileText, 
  Image as ImageIcon,
  Home, 
  Info, 
  Mail, 
  Menu, 
  X, 
  ChevronDown,
  Sliders,
  ClipboardCheck,
  Briefcase,
  Vote
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
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  // Logically grouped navigation categories for the clean Menu drawer
  const menuCategories = [
    {
      title: 'Registry & Membership',
      items: [
        { key: 'home', label: 'Home Dashboard', icon: Home, enabled: moduleSettings.home, desc: 'Personalized identity, statements & live alerts' },
        { key: 'directory', label: 'Alumni Directory & Registry', icon: Users, enabled: moduleSettings.directory, desc: 'Search classmates, chapters & cohorts' },
        { key: 'verify', label: 'Verified Alumni Lookup', icon: ShieldCheck, enabled: true, isAction: true, desc: 'Instant official MA number authentication' },
        { key: 'membership', label: 'Official Membership Guide', icon: Award, enabled: moduleSettings.membership, desc: 'Permanent MA numbers & member rights' },
      ]
    },
    {
      title: 'Careers & Governance',
      items: [
        { key: 'opportunities', label: 'Opportunities & Mentorship Hub', icon: Briefcase, enabled: moduleSettings.opportunities ?? true, desc: 'Jobs, internships, scholarships & mentor network' },
        { key: 'elections', label: 'Elections & Digital Voting', icon: Vote, enabled: moduleSettings.elections ?? true, desc: 'NEC executive elections, manifestos & secret ballot' },
      ]
    },
    {
      title: 'Philanthropy & Giving',
      items: [
        { key: 'payments', label: 'Donations & Giving', icon: Coins, enabled: moduleSettings.giving, desc: 'Voluntary donations, school projects & receipts' },
        { key: 'documents', label: 'Documents & Reports', icon: FileText, enabled: moduleSettings.documents, desc: 'Constitution, AGM minutes & audited records' },
      ]
    },
    {
      title: 'Community & Programs',
      items: [
        { key: 'attendance', label: 'Meeting Attendance Roll Call', icon: ClipboardCheck, enabled: moduleSettings.attendance, desc: 'Live assembly roll call & sign-in' },
        { key: 'events', label: 'Events & Reunions', icon: Calendar, enabled: moduleSettings.events, desc: 'Homecoming, sports gala & reunions' },
        { key: 'gallery', label: 'Campus Heritage Gallery', icon: ImageIcon, enabled: moduleSettings.gallery, desc: 'Historical photos & school milestones' },
        { key: 'chapters', label: 'University & Regional Chapters', icon: Landmark, enabled: moduleSettings.chapters, desc: 'Tertiary institutions & regional diaspora' },
      ]
    },
    {
      title: 'Information & Secretariat',
      items: [
        { key: 'news', label: 'News & Announcements', icon: Megaphone, enabled: moduleSettings.news, desc: 'Official executive circulars & notices' },
        { key: 'about', label: 'About MASSH & MOSA', icon: Info, enabled: moduleSettings.about, desc: 'History of Mandela SS Hoima since 1997' },
        { key: 'contact', label: 'Contact Secretariat', icon: Mail, enabled: moduleSettings.contact, desc: 'Executive committee & secretariat desk' },
      ]
    }
  ];

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
              color: menuOpen ? '#FDE68A' : '#FFFFFF',
              background: menuOpen ? 'rgba(217, 119, 6, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              border: menuOpen ? '1px solid #D97706' : '1px solid rgba(255, 255, 255, 0.18)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            aria-expanded={menuOpen}
            aria-label="Open MOSA Member Services Menu"
            title="Explore All MOSA Services & Sections"
          >
            {menuOpen ? <X size={18} color="#FBBF24" /> : <Menu size={18} color="#FBBF24" />}
            <span style={{ fontWeight: 700 }}>Menu</span>
            <ChevronDown size={14} style={{ opacity: 0.8, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Centre / Left: MOSA Branding & Application Title */}
        <div 
          className="brand-wrapper" 
          onClick={() => handleTabClick('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}
        >
          <div className="massh-crest" style={{ width: '40px', height: '40px', fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)' }}>
            <span>MASSH</span>
          </div>
          <div className="brand-text">
            <h1 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              MOSA Portal
            </h1>
            <div className="subtext" style={{ fontSize: '0.68rem', color: '#FCD34D', letterSpacing: '0.04em', fontWeight: 600 }}>
              Mandela SS Hoima • Est. 1997
            </div>
          </div>
        </div>

        {/* Right Area: Actionable Notifications, Member Identity Pass / Auth, and Far-Right Admin Panel (Exclusively Staff) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
          
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
                  border: '2px solid #07152B',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                }}
              >
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Member Authentication / My Account Pass */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                <span className="hidden sm:inline">My Pass</span>
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
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                display: 'inline-flex',
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

          {/* Far Right: Admin Panel Icon ONLY for Authorised Administrators */}
          {isStaff && (
            <button
              onClick={handleAdminClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'rgba(217, 119, 6, 0.25)',
                border: '1px solid #D97706',
                color: '#FDE68A',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
              }}
              title="Restricted Administrative Control Panel"
              aria-label="Restricted Administrative Control Panel"
            >
              <Sliders size={16} color="#FBBF24" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* COMPRESSED SECONDARY NAVIGATION OVERLAY / DRAWER */}
      {menuOpen && (
        <>
          {/* Backdrop for click-outside dismissal */}
          <div 
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(7, 21, 43, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 1050,
            }}
          />

          {/* Clean Menu Container */}
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'linear-gradient(180deg, #0B203E 0%, #07152B 100%)',
              borderBottom: '3px solid #D97706',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              padding: '1.5rem 1.25rem 2rem 1.25rem',
              zIndex: 1060,
              maxHeight: 'calc(100vh - 70px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
              
              {/* Menu Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    Navigation Centre
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800 }}>
                    Mandela Old Students Association Sections
                  </h3>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#CBD5E1',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Close Menu"
                >
                  <X size={18} />
                </button>
              </div>              {/* Logically Grouped Menu Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '1.5rem' }}>
                {menuCategories.map(cat => {
                  const visibleItems = cat.items.filter(item => item.enabled);
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={cat.title}>
                      <div style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: 800, 
                        color: '#FCD34D', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.07em', 
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                        <span>{cat.title}</span>
                      </div>

                      <div 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                          gap: '0.75rem',
                        }}
                      >
                        {visibleItems.map(item => {
                          const Icon = item.icon;
                          const isActive = currentTab === item.key;

                          return (
                            <div
                              key={item.key}
                              onClick={() => {
                                if (item.key === 'verify' && onOpenVerify) {
                                  setMenuOpen(false);
                                  onOpenVerify();
                                } else {
                                  handleTabClick(item.key);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.85rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                background: isActive ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                border: isActive ? '1px solid #D97706' : '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isActive ? 'rgba(217, 119, 6, 0.35)' : 'rgba(255, 255, 255, 0.08)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isActive ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.04)';
                              }}
                            >
                              <div 
                                style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  borderRadius: '8px', 
                                  background: isActive ? '#D97706' : 'rgba(255, 255, 255, 0.1)', 
                                  color: '#FFFFFF', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  flexShrink: 0 
                                }}
                              >
                                <Icon size={18} color={isActive ? '#FFFFFF' : '#FBBF24'} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isActive ? '#FDE68A' : '#FFFFFF', marginBottom: '0.15rem' }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.3 }}>
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Utility Action Bar at bottom of menu */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.75rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {onOpenVerify && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenVerify();
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(217, 119, 6, 0.15)',
                        color: '#FCD34D',
                        border: '1px solid #D97706',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Verify Alumni Number</span>
                    </button>
                  )}

                  {!currentUser && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenRegister();
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #D97706, #B45309)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <UserPlus size={16} />
                      <span>Register as Member</span>
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Mandela Secondary School Hoima • Official Alumni System
                </div>
              </div>

            </div>
          </div>
        </>
      )}

    </header>
  );
};
