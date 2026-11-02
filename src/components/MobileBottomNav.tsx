import React from 'react';
import { 
  Home,
  Bell,
  Menu
} from 'lucide-react';
import { AuthUser } from '../types';

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
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => setCurrentTab('home')}
        title="Home Dashboard"
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      {/* 2. Alerts / Notifications with Live Badge */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'notifications' ? 'active' : ''}`}
        onClick={() => {
          if (onOpenNotifications) {
            onOpenNotifications();
          } else {
            setCurrentTab('notifications');
          }
        }}
        style={{ position: 'relative' }}
        title="Alerts & Notifications"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Bell size={19} />
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.58rem',
                fontWeight: 800,
                minWidth: '15px',
                height: '15px',
                padding: '0 2px',
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
        </div>
        <span>Alerts</span>
      </button>

      {/* 3. More (Shifted institutional menu, account logout & admin panel) */}
      <button
        type="button"
        className={`mobile-bottom-nav-item ${currentTab === 'more' ? 'active' : ''}`}
        onClick={() => setCurrentTab('more')}
        title="More Services & Menu"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
