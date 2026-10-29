import React from 'react';
import { 
  Home,
  Users, 
  Coins, 
  ClipboardCheck, 
  Sliders,
  LogOut,
  LogIn
} from 'lucide-react';
import { AuthUser } from '../types';
import { isStaffRole } from '../services/governanceService';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  currentUser: AuthUser | null;
  onOpenVerify?: () => void;
  onOpenRegister?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenAdmin?: () => void;
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenVerify,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenAdmin,
  onSwitchToAdmin,
  onLogout,
  onOpenAuth,
}) => {
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || isStaffRole(currentUser?.role);

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => setCurrentTab('home')}
        title="Home Dashboard"
      >
        <Home size={19} />
        <span>Home</span>
      </button>

      {/* 2. Registry */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'directory' ? 'active' : ''}`}
        onClick={() => setCurrentTab('directory')}
        title="Alumni Directory"
      >
        <Users size={19} />
        <span>Registry</span>
      </button>

      {/* 3. Attendance (Replacing My Pass) */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'attendance' ? 'active' : ''}`}
        onClick={() => setCurrentTab('attendance')}
        title="Meeting Attendance & Roll Call"
      >
        <ClipboardCheck size={19} />
        <span>Attendance</span>
      </button>

      {/* 4. Giving / Payments */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'payments' ? 'active' : ''}`}
        onClick={() => setCurrentTab('payments')}
        title="Donations & Giving"
      >
        <Coins size={19} />
        <span>Giving</span>
      </button>

      {/* 5. Admin Panel (Direct Staff switch or Admin Gate) */}
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => {
          if (isStaff && onSwitchToAdmin) {
            onSwitchToAdmin();
          } else if (onOpenAdmin) {
            onOpenAdmin();
          } else if (onOpenAuth) {
            onOpenAuth();
          }
        }}
        style={{ color: '#FBBF24' }}
        title="Administration Panel"
      >
        <Sliders size={19} color="#FBBF24" />
        <span style={{ color: '#FDE68A', fontWeight: 700 }}>Admin</span>
      </button>

      {/* 8. Logout / Login */}
      {currentUser ? (
        <button
          type="button"
          className="mobile-bottom-nav-item"
          onClick={onLogout}
          style={{ color: '#FDA4AF' }}
          title="Sign Out"
        >
          <LogOut size={19} color="#FDA4AF" />
          <span style={{ color: '#FECDD3' }}>Logout</span>
        </button>
      ) : (
        <button
          type="button"
          className="mobile-bottom-nav-item"
          onClick={onOpenAuth}
          style={{ color: '#86EFAC' }}
          title="Sign In"
        >
          <LogIn size={19} color="#86EFAC" />
          <span style={{ color: '#BBF7D0' }}>Login</span>
        </button>
      )}
    </nav>
  );
};


