import React, { useState, useEffect } from 'react';
import { AuthUser, ModuleSettings, AlumniProfile } from '../types';
import { isStaffRole } from '../services/governanceService';
import { dataService, cleanMANumber } from '../services/dataService';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  LogIn, 
  Award, 
  Calendar, 
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
import { MosaLogo } from './MosaLogo';

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
  const [memberProfile, setMemberProfile] = useState<AlumniProfile | null>(null);

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

  const handleTabClick = (tabKey: string) => {
    setCurrentTab(tabKey);
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

  // Member Identity Card Details
  const memberDisplayName = memberProfile?.fullName || 
    (memberProfile ? `${memberProfile.firstName} ${memberProfile.lastName}` : currentUser?.displayName) || 
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest Visitor');

  const rawMemberNumber = memberProfile?.alumniNumber || 
    currentUser?.alumniNumber || 
    (currentUser ? 'MA.PENDING' : 'NOT VERIFIED');
  const memberNumber = cleanMANumber(rawMemberNumber);

  const memberPhoto = memberProfile?.photoUrl || 
    currentUser?.photoUrl || 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

  return (
    <header className="mosa-header" style={{ position: 'sticky', top: 0, zIndex: 1100, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="mosa-nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 1.25rem' }}>
        {/* Left: Official School Crest linking to Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          <div
            onClick={() => handleTabClick('home')}
            style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.4rem' }}
            title="Mandela Secondary School Hoima"
          >
            <MosaLogo size={36} />
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {currentUser ? (
              <span 
                style={{ 
                  fontSize: '0.84rem', 
                  fontWeight: 800, 
                  color: '#14532D', 
                  letterSpacing: '0.04em',
                  background: '#ECFDF5',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Award size={13} color="#059669" />
                <span>{memberNumber}</span>
              </span>
            ) : (
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669' }}>
                Sign In
              </span>
            )}
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
            title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread Alert${unreadNotificationsCount > 1 ? 's' : ''}` : 'Alerts & Notifications'}
            aria-label="Open Alerts & Notifications"
          >
            <Bell size={22} color="#334155" />
            {unreadNotificationsCount > 0 && (
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
                background: '#14532D',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(20, 83, 45, 0.25)',
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
    </header>
  );
};
