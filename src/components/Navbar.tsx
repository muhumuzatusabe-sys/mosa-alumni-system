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
  Sparkles
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Registry & Membership');
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  // Logically grouped navigation categories for the clean Menu drawer
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
      ]
    }
  ];

  // Auto-synchronize selected category with active tab
  useEffect(() => {
    const match = menuCategories.find(cat => cat.items.some(i => i.key === currentTab));
    if (match) {
      setSelectedCategory(match.title);
    }
  }, [currentTab]);

  const activeCategoryData = menuCategories.find(c => c.title === selectedCategory) || menuCategories[0];
  const activeSubItems = activeCategoryData.items.filter(item => item.enabled);

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

          {/* Far Right: Admin Panel Button */}
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
              title="Restricted Administrative Control Panel"
              aria-label="Restricted Administrative Control Panel"
            >
              <Sliders size={16} color="#FBBF24" />
              <span>Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenAdmin) onOpenAdmin();
                else onOpenAuth();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FDE68A',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem',
              }}
              title="Secretariat & Administration Gate"
              aria-label="Secretariat & Administration Gate"
            >
              <Sliders size={14} color="#FBBF24" />
              <span className="hidden sm:inline">Admin Gate</span>
            </button>
          )}
        </div>
      </div>

      {/* REFINED COMPACT NAVIGATION OVERLAY & SEPARATE SUBMENU WINDOW */}
      {menuOpen && (
        <>
          {/* Backdrop for click-outside dismissal (does not obscure the page entirely) */}
          <div 
            className="mosa-menu-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Compact Menu Drawer: <= half screen width on desktop, compact on mobile */}
          <div 
            className="mosa-menu-drawer"
            role="dialog"
            aria-label="MOSA Portal Sections Menu"
          >
            {/* Menu Header */}
            <div className="mosa-menu-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#06B6D4', 
                    boxShadow: '0 0 10px #22D3EE' 
                  }} 
                />
                <span style={{ fontSize: '0.78rem', color: '#E0F2FE', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  MOSA Portal Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: '6px',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                aria-label="Close Navigation Menu"
              >
                <X size={15} />
              </button>
            </div>

            {/* Menu Body: Left parent list, Right submenu window */}
            <div className="mosa-menu-body">
              {/* Left Column: Parent Sections with Cyan Active State */}
              <div className="mosa-parent-list" role="tablist" aria-label="Menu Sections">
                {menuCategories.map((cat) => {
                  const visibleItems = cat.items.filter((item) => item.enabled);
                  if (visibleItems.length === 0) return null;

                  const isSelected = selectedCategory === cat.title;
                  const hasActiveRoute = visibleItems.some((item) => item.key === currentTab);
                  const CatIcon = cat.icon;

                  return (
                    <button
                      key={cat.title}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedCategory(cat.title)}
                      className={`mosa-parent-btn ${isSelected ? 'active' : ''}`}
                    >
                      {/* Cyan indicator bar on active */}
                      {isSelected && <span className="cyan-indicator" />}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: isSelected ? '#22D3EE' : '#94A3B8',
                          }}
                        >
                          <CatIcon size={14} />
                        </div>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: isSelected ? 800 : 600, 
                          color: isSelected ? '#22D3EE' : '#E2E8F0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {cat.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        {hasActiveRoute && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#FBBF24',
                              boxShadow: '0 0 6px #FBBF24',
                            }}
                            title="Current Active View"
                          />
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                            background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#67E8F9' : '#94A3B8',
                            border: isSelected ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                            fontWeight: 700,
                          }}
                        >
                          {visibleItems.length}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Clear, Separate Submenu Window */}
              <div 
                className="mosa-submenu-window" 
                role="region" 
                aria-label={`${activeCategoryData?.title || 'Section'} Submenu Window`}
              >
                {/* Submenu Header establishing clear visual relationship */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingBottom: '0.55rem', 
                    borderBottom: '1px solid rgba(6, 182, 212, 0.25)', 
                    marginBottom: '0.65rem' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span 
                      style={{ 
                        width: '7px', 
                        height: '7px', 
                        borderRadius: '50%', 
                        background: '#06B6D4', 
                        boxShadow: '0 0 8px #22D3EE' 
                      }} 
                    />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#22D3EE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {activeCategoryData?.title} Submenu
                    </span>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '0.68rem', 
                      color: '#67E8F9', 
                      background: 'rgba(6, 182, 212, 0.15)', 
                      padding: '0.1rem 0.45rem', 
                      borderRadius: '999px', 
                      border: '1px solid rgba(6, 182, 212, 0.3)', 
                      fontWeight: 700 
                    }}
                  >
                    {activeSubItems.length} destinations
                  </span>
                </div>

                {/* Submenu Destination Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                  {activeSubItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isCurrentTab = currentTab === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTabClick(item.key)}
                        className={`mosa-submenu-item ${isCurrentTab ? 'active' : ''}`}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isCurrentTab ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: isCurrentTab ? '1px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: isCurrentTab ? '#22D3EE' : '#94A3B8',
                          }}
                        >
                          <ItemIcon size={16} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ 
                            fontSize: '0.84rem', 
                            fontWeight: 700, 
                            color: isCurrentTab ? '#22D3EE' : '#FFFFFF', 
                            lineHeight: 1.25,
                            marginBottom: '0.15rem'
                          }}>
                            {item.label}
                          </div>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#94A3B8', 
                            lineHeight: 1.25, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {item.desc}
                          </div>
                        </div>

                        <div style={{ flexShrink: 0, marginLeft: '0.35rem' }}>
                          {isCurrentTab ? (
                            <span 
                              style={{ 
                                fontSize: '0.62rem', 
                                fontWeight: 800, 
                                color: '#06B6D4', 
                                background: 'rgba(6, 182, 212, 0.15)', 
                                padding: '0.15rem 0.4rem', 
                                borderRadius: '4px', 
                                textTransform: 'uppercase',
                                border: '1px solid rgba(6, 182, 212, 0.3)' 
                              }}
                            >
                              Active
                            </span>
                          ) : (
                            <ChevronRight size={14} color="#64748B" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </header>
  );
};
