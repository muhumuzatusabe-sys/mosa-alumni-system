import React from 'react';
import { 
  Home,
  Users, 
  Coins, 
  Bell, 
  Award, 
  ShieldCheck 
} from 'lucide-react';
import { AuthUser } from '../types';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  currentUser: AuthUser | null;
  onOpenVerify: () => void;
  onOpenRegister: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const MobileBottomNav: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenVerify,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const isAlumni = currentUser?.role === 'ALUMNI';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => setCurrentTab('home')}
      >
        <Home size={19} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'directory' ? 'active' : ''}`}
        onClick={() => setCurrentTab('directory')}
      >
        <Users size={19} />
        <span>Registry</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'payments' ? 'active' : ''}`}
        onClick={() => setCurrentTab('payments')}
      >
        <Coins size={19} />
        <span>Giving</span>
      </button>

      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'notifications' ? 'active' : ''}`}
        onClick={onOpenNotifications}
        style={{ position: 'relative' }}
      >
        <Bell size={19} />
        {unreadNotificationsCount > 0 && (
          <span 
            style={{ 
              position: 'absolute', 
              top: '4px', 
              right: 'calc(50% - 14px)', 
              background: '#EF4444', 
              color: '#FFFFFF', 
              fontSize: '0.6rem', 
              fontWeight: 800, 
              width: '14px', 
              height: '14px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
        <span>Alerts</span>
      </button>

      {isAlumni ? (
        <button
          type="button"
          className={`mobile-bottom-nav-item ${currentTab === 'my-profile' ? 'active' : ''}`}
          onClick={() => setCurrentTab('my-profile')}
        >
          <Award size={19} />
          <span>My Pass</span>
        </button>
      ) : (
        <button
          type="button"
          className="mobile-bottom-nav-item"
          onClick={onOpenVerify}
        >
          <ShieldCheck size={19} />
          <span>Verify</span>
        </button>
      )}
    </nav>
  );
};
