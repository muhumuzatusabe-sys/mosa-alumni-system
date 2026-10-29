import React, { useState, useEffect } from 'react';
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
  ChevronUp,
  ChevronRight,
  Sliders,
  ClipboardCheck,
  Briefcase,
  Vote,
  Sparkles,
  Search,
  GraduationCap
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
  const [searchQuery, setSearchQuery] = useState('');
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  // Complete, beautifully organized navigation categories for the Cream Dropdown
  const menuCategories = [
    {
      title: 'Registry & Membership',
      icon: Users,
      items: [
        { key: 'home', label: 'Home Dashboard', icon: Home, enabled: moduleSettings.home, desc: 'Personalized identity, statements & live alerts' },
        { key: 'welcome', label: 'MOSA Welcome Page', icon: Sparkles, enabled: true, desc: 'Official welcome experience, heritage & statistics' },
        { key: 'directory', label: 'Alumni Registry', icon: Users, enabled: moduleSettings.directory, desc: 'Explore registered alumni of Mandela Secondary School Hoima' },
        { key: 'membership', label: 'Official Membership Guide', icon: Award, enabled: moduleSettings.membership, desc: 'Permanent MA numbers & member rights' },
      ]
    },
    {
      title: 'Careers & Governance',
      icon: Briefcase,
      items: [
        { key: 'opportunities', label: 'Opportunities & Mentorship Hub', icon: Briefcase, enabled: moduleSettings.opportunities ?? true, desc: 'Jobs, internships, scholarships & mentor network' },
        { key: 'elections', label: 'Elections & Digital Voting', icon: Vote, enabled: moduleSettings.elections ?? true, desc: 'NEC executive elections, manifestos & secret ballot' },
      ]
    },
    {
      title: 'Philanthropy & Giving',
      icon: Coins,
      items: [
        { key: 'payments', label: 'Donations & Giving', icon: Coins, enabled: moduleSettings.giving, desc: 'Voluntary donations, school projects & receipts' },
        { key: 'documents', label: 'Documents & Reports', icon: FileText, enabled: moduleSettings.documents, desc: 'Constitution, AGM minutes & audited records' },
      ]
    },
    {
      title: 'Community & Programs',
      icon: Calendar,
      items: [
        { key: 'attendance', label: 'Meeting Attendance Roll Call', icon: ClipboardCheck, enabled: moduleSettings.attendance, desc: 'Live assembly roll call & sign-in' },
        { key: 'events', label: 'Events & Reunions', icon: Calendar, enabled: moduleSettings.events, desc: 'Homecoming, sports gala & reunions' },
        { key: 'gallery', label: 'Campus Heritage Gallery', icon: ImageIcon, enabled: moduleSettings.gallery, desc: 'Historical photos & school milestones' },
        { key: 'chapters', label: 'University & Regional Chapters', icon: Landmark, enabled: moduleSettings.chapters, desc: 'Tertiary institutions & regional diaspora' },
      ]
    },
    {
      title: 'Information & Heritage',
      icon: Info,
      items: [
        { key: 'news', label: 'News & Announcements', icon: Megaphone, enabled: moduleSettings.news, desc: 'Official executive circulars & notices' },
        { key: 'about', label: 'About MASSH & MOSA', icon: Info, enabled: moduleSettings.about, desc: 'History of Mandela SS Hoima since 1997' },
        { key: 'contact', label: 'Contact Secretariat', icon: Mail, enabled: moduleSettings.contact, desc: 'Official secretariat office, inquiries & helpdesk' },
      ]
    }
  ];

  const query = searchQuery.trim().toLowerCase();
  const displayedCategories = menuCategories
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        if (!item.enabled) return false;
        if (!query) return true;
        return (
          item.label.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query) ||
          cat.title.toLowerCase().includes(query)
        );
      })
    }))
    .filter(cat => cat.items.length > 0);

  const handleTabClick = (tabKey: string) => {
    setCurrentTab(tabKey);
    setMenuOpen(false);
    setSearchQuery('');
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
              color: menuOpen ? '#22D3EE' : '#FFFFFF',
              background: menuOpen ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.08)',
              border: menuOpen ? '1.5px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: menuOpen ? '0 0 14px rgba(6, 182, 212, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-expanded={menuOpen}
            aria-label="Open MOSA Member Services Menu"
            title="Explore All MOSA Services & Sections"
          >
            {menuOpen ? <X size={18} color="#22D3EE" /> : <Menu size={18} color="#22D3EE" />}
            <span style={{ fontWeight: 700 }}>Menu</span>
            <ChevronDown size={14} style={{ opacity: 0.9, color: menuOpen ? '#22D3EE' : '#E2E8F0', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
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

          {/* Far Right: Admin Panel Access (Direct switch for staff, or staff portal login) */}
          {isStaff ? (
            <button
              onClick={handleAdminClick}
              style={{
                display: 'inline-flex',
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
              <span className="hidden sm:inline">Admin</span>
            </button>
          ) : (
            <button
              onClick={handleAdminClick}
              style={{
                display: 'inline-flex',
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
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* PRESTIGE SMOOTH CYAN DROPDOWN MENU */}
      {menuOpen && (
        <>
          {/* Backdrop for click-outside dismissal (does not obscure the entire page) */}
          <div 
            className="mosa-cyan-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sleek Scrollable Cyan Menu Panel */}
          <div 
            className="mosa-cyan-dropdown"
            role="dialog"
            aria-label="MOSA Navigation Menu"
          >
            {/* Header */}
            <div className="mosa-cyan-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="mosa-cyan-logo-badge">
                  <GraduationCap size={18} color="#22D3EE" />
                </div>
                <div>
                  <div className="mosa-cyan-title">
                    MOSA Navigation Menu
                  </div>
                  <div className="mosa-cyan-subtitle">
                    Mandela Old Students Association • All 15 Sections
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="mosa-cyan-close-btn"
                aria-label="Close Menu"
              >
                <X size={17} />
              </button>
            </div>

            {/* Continuous Scrollable List — All Items Clearly Visible & Grouped */}
            <div className="mosa-cyan-scroll">
              {menuCategories.map((cat) => {
                const CatIcon = cat.icon;
                const activeItems = cat.items.filter(item => item.enabled);
                if (activeItems.length === 0) return null;

                return (
                  <div key={cat.title} className="mosa-cyan-category-section">
                    <div className="mosa-cyan-group-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CatIcon size={13} color="#22D3EE" />
                        <span>{cat.title}</span>
                      </div>
                      <span className="mosa-cyan-count-pill">{activeItems.length}</span>
                    </div>

                    <div className="mosa-cyan-items-group">
                      {activeItems.map((item) => {
                        const ItemIcon = item.icon;
                        const isCurrent = currentTab === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleTabClick(item.key)}
                            className={`mosa-cyan-nav-row ${isCurrent ? 'active' : ''}`}
                          >
                            <div className={`mosa-cyan-nav-icon ${isCurrent ? 'active' : ''}`}>
                              <ItemIcon size={16} />
                            </div>

                            <div className="mosa-cyan-nav-text">
                              <div className="mosa-cyan-nav-label-row">
                                <span className={`mosa-cyan-nav-label ${isCurrent ? 'active' : ''}`}>
                                  {item.label}
                                </span>
                                {isCurrent && (
                                  <span className="mosa-cyan-nav-active-pill">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="mosa-cyan-nav-desc">
                                {item.desc}
                              </div>
                            </div>

                            <ChevronRight size={14} className="mosa-cyan-nav-arrow" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Quick Verify & Register Actions */}
            <div className="mosa-cyan-footer">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); if (onOpenVerify) onOpenVerify(); }}
                className="mosa-cyan-footer-btn"
              >
                <ShieldCheck size={14} color="#22D3EE" />
                <span>Verify Alumnus</span>
              </button>

              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                className="mosa-cyan-footer-btn primary"
              >
                <UserPlus size={14} color="#67E8F9" />
                <span>Join / Register</span>
              </button>
            </div>
          </div>
        </>
      )}

    </header>
  );
};
