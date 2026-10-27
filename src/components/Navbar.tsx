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
  Search
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
            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              MASSH ALUMNI PORTAL
            </h1>
            <div className="subtext" style={{ fontSize: '0.68rem', color: '#FCD34D', letterSpacing: '0.03em', fontWeight: 600 }}>
              MOSA — Mandela Old Students Association • Est. 1997
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
              <span>Admin Panel</span>
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

      {/* REFINED PRESTIGE CREAM DROPDOWN MENU */}
      {menuOpen && (
        <>
          {/* Subtle backdrop for click-outside dismissal (does not obscure the entire page) */}
          <div 
            className="mosa-cream-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Compact Cream Dropdown Panel */}
          <div 
            className="mosa-cream-dropdown"
            role="dialog"
            aria-label="MOSA Portal Directory"
          >
            {/* Header */}
            <div className="mosa-cream-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '8px', 
                    background: '#113D2B', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid #C68A24',
                    color: '#FDE68A',
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  MASSH
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#113D2B', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    MOSA Portal Directory
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#78716C', fontWeight: 500 }}>
                    Mandela Old Students Association • All Services
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: '#ECE4D4',
                  border: '1px solid #DFD6C3',
                  color: '#44403C',
                  borderRadius: '7px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DFD6C3';
                  e.currentTarget.style.color = '#1C1917';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ECE4D4';
                  e.currentTarget.style.color = '#44403C';
                }}
                aria-label="Close Menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Live Filter & Shortcut Actions */}
            <div style={{ padding: '0.65rem 0.75rem 0.4rem', borderBottom: '1px solid #EAE2D2', background: '#FAF7EE' }}>
              <div style={{ position: 'relative', marginBottom: '0.45rem' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#78716C', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter MOSA sections & services..."
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #D8CEBB',
                    background: '#FFFFFF',
                    color: '#1C1917',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#78716C', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick Action Badges */}
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); if (onOpenVerify) onOpenVerify(); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    border: '1px solid #D8CEBB',
                    color: '#113D2B',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <ShieldCheck size={13} color="#C68A24" />
                  <span>Verify Alumnus</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onOpenRegister(); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    border: '1px solid #D8CEBB',
                    color: '#113D2B',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <UserPlus size={13} color="#16A34A" />
                  <span>Join / Register</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdminClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#113D2B',
                    border: '1px solid #C68A24',
                    color: '#FDE68A',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Sliders size={13} color="#FBBF24" />
                  <span>Admin Panel</span>
                </button>
              </div>
            </div>

            {/* Scrollable Categories List */}
            <div className="mosa-cream-scroll">
              {displayedCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#78716C' }}>
                  <Search size={28} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>No matching sections found</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Try searching for "directory", "voting", "dues", or "events"</div>
                </div>
              ) : (
                displayedCategories.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.title} className="mosa-cream-section">
                      <div className="mosa-cream-section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#F1E8D7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#113D2B' }}>
                            <CatIcon size={13} />
                          </div>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#113D2B', letterSpacing: '0.02em' }}>
                            {cat.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.08rem 0.4rem', borderRadius: '999px' }}>
                          {cat.items.length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {cat.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isCurrent = currentTab === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleTabClick(item.key)}
                              className={`mosa-cream-item ${isCurrent ? 'active' : ''}`}
                            >
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '7px',
                                  background: isCurrent ? '#FEF3C7' : '#F7F3EA',
                                  border: isCurrent ? '1px solid #F59E0B' : '1px solid #E7DFC9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  color: isCurrent ? '#B45309' : '#113D2B'
                                }}
                              >
                                <ItemIcon size={15} />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 800 : 700, color: isCurrent ? '#92400E' : '#1C1917' }}>
                                    {item.label}
                                  </span>
                                  {isCurrent && (
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '0.08rem 0.35rem', borderRadius: '4px', border: '1px solid #FDE68A', textTransform: 'uppercase' }}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                                  {item.desc}
                                </div>
                              </div>

                              {!isCurrent && <ChevronRight size={14} color="#A8A29E" style={{ flexShrink: 0 }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Dedicated Administrative Access Card */}
              <div className="mosa-cream-admin-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.25)', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sliders size={16} color="#FBBF24" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FDE68A', letterSpacing: '0.02em' }}>
                        Admin Control Panel
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#CBD5E1' }}>
                        {isStaff ? 'Authenticated as Staff Member' : 'Secretariat & Executive Suite'}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FDE68A', background: 'rgba(245, 158, 11, 0.2)', padding: '0.15rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    {isStaff ? 'Authorized' : 'Restricted'}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#E2E8F0', marginBottom: '0.65rem', lineHeight: 1.35 }}>
                  {isStaff 
                    ? 'Manage registry approvals, digital membership cards, finances, roll calls, and governance.'
                    : 'Restricted to MASSH executive officers, secretariat administrators, and verified staff.'}
                </div>

                <button
                  type="button"
                  onClick={handleAdminClick}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    color: '#FFFFFF',
                    border: '1px solid #FBBF24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldCheck size={14} color="#FFFFFF" />
                  <span>{isStaff ? 'Enter Administrative Control Panel' : 'Staff & Secretariat Login'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </header>
  );
};
