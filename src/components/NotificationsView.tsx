import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ArrowLeft, 
  Filter, 
  Calendar, 
  Coins, 
  Award, 
  ClipboardCheck, 
  Megaphone, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AlumniNotification, AuthUser } from '../types';
import { dataService } from '../services/dataService';

interface Props {
  currentUser: AuthUser | null;
  onNavigate: (tab: any, targetId?: string) => void;
  onBack?: () => void;
  onOpenAdmin?: () => void;
  onRefreshNotifs?: () => void;
}

export const NotificationsView: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onBack,
  onOpenAdmin,
  onRefreshNotifs,
}) => {
  const [notifications, setNotifications] = useState<AlumniNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const alumniId = currentUser?.alumniId || 'alumni-0001';
      const list = await dataService.getAlumniNotifications(alumniId);
      setNotifications(list);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    const alumniId = currentUser?.alumniId || 'alumni-0001';
    await dataService.markAllNotificationsAsRead(alumniId);
    await loadNotifications();
    if (onRefreshNotifs) onRefreshNotifs();
  };

  const handleNotificationClick = async (notif: AlumniNotification) => {
    if (!notif.isRead) {
      await dataService.markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      if (onRefreshNotifs) onRefreshNotifs();
    }

    // Actionable Deep Links
    if (notif.linkTab === 'admin') {
      if (onOpenAdmin) onOpenAdmin();
      return;
    }

    if (notif.linkTab) {
      onNavigate(notif.linkTab);
      return;
    }

    // Smart fallback based on category / type
    const typeUpper = (notif.type || '').toUpperCase();
    if (typeUpper.includes('PAYMENT') || typeUpper.includes('DUES') || typeUpper.includes('CONTRIBUTION')) {
      onNavigate('payments');
    } else if (typeUpper.includes('EVENT')) {
      onNavigate('events');
    } else if (typeUpper.includes('ATTENDANCE')) {
      onNavigate('attendance');
    } else if (typeUpper.includes('MEMBERSHIP') || typeUpper.includes('PASS')) {
      onNavigate('my-profile');
    } else if (typeUpper.includes('ANNOUNCEMENT') || typeUpper.includes('CIRCULAR')) {
      onNavigate('news');
    } else {
      onNavigate('home');
    }
  };

  const getNotificationIcon = (notif: AlumniNotification) => {
    const typeUpper = (notif.type || '').toUpperCase();
    if (typeUpper.includes('PAYMENT') || typeUpper.includes('DUES') || notif.linkTab === 'payments') {
      return <Coins size={18} color="#059669" />;
    }
    if (typeUpper.includes('EVENT') || notif.linkTab === 'events') {
      return <Calendar size={18} color="#2563EB" />;
    }
    if (typeUpper.includes('ATTENDANCE') || notif.linkTab === 'attendance') {
      return <ClipboardCheck size={18} color="#7C3AED" />;
    }
    if (typeUpper.includes('MEMBERSHIP') || notif.linkTab === 'my-profile') {
      return <Award size={18} color="#D97706" />;
    }
    return <Megaphone size={18} color="#D97706" />;
  };

  const getActionLabel = (notif: AlumniNotification) => {
    const typeUpper = (notif.type || '').toUpperCase();
    if (typeUpper.includes('PAYMENT') || notif.linkTab === 'payments') return 'View Contribution & Receipts';
    if (typeUpper.includes('EVENT') || notif.linkTab === 'events') return 'Open Event Details & RSVP';
    if (typeUpper.includes('ATTENDANCE') || notif.linkTab === 'attendance') return 'Go to Attendance Roll Call';
    if (typeUpper.includes('MEMBERSHIP') || notif.linkTab === 'my-profile') return 'View Member Profile & Pass';
    if (typeUpper.includes('ANNOUNCEMENT') || notif.linkTab === 'news') return 'View Announcement Details';
    return 'View Details';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'PAYMENTS') return n.linkTab === 'payments' || (n.type && (n.type.includes('PAYMENT') || n.type.includes('DUES')));
    if (activeFilter === 'EVENTS') return n.linkTab === 'events' || (n.type && n.type.includes('EVENT'));
    if (activeFilter === 'ATTENDANCE') return n.linkTab === 'attendance' || (n.type && n.type.includes('ATTENDANCE'));
    return true;
  });

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '1.5rem 1rem 4rem 1rem' }}>
      
      {/* Top Header Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #07152B 0%, #0B203E 65%, #163663 100%)', 
          borderRadius: '16px', 
          padding: '1.75rem 1.5rem', 
          color: '#FFFFFF',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(11, 32, 62, 0.25)',
          border: '1.5px solid rgba(217, 119, 6, 0.3)',
        }}
      >
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1.25rem',
              transition: 'background 0.2s'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.25)', border: '1.5px solid #D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={24} color="#FBBF24" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: '#FFFFFF', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  MOSA Notification Centre
                </h1>
                {unreadCount > 0 && (
                  <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '999px', fontWeight: 800 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#CBD5E1' }}>
                Interactive alerts, verified contributions, meeting calls & announcements for Mandela scholars
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid #D97706',
                color: '#FDE68A',
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'background 0.2s',
              }}
            >
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div 
        className="mosa-card" 
        style={{ 
          padding: '0.75rem 1rem', 
          marginBottom: '1.25rem', 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto',
          background: '#FFFFFF' 
        }}
      >
        {[
          { id: 'ALL', label: `All (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'PAYMENTS', label: 'Contributions' },
          { id: 'EVENTS', label: 'Events' },
          { id: 'ATTENDANCE', label: 'Attendance' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeFilter === filter.id ? '1px solid #0B203E' : '1px solid #E2E8F0',
              background: activeFilter === filter.id ? '#0B203E' : '#FFFFFF',
              color: activeFilter === filter.id ? '#FFFFFF' : '#475569',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
          Loading your alerts...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#FFFFFF' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Bell size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.4rem' }}>
            {activeFilter === 'UNREAD' ? 'You are all caught up!' : 'No notifications in this category'}
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
            {activeFilter === 'UNREAD' 
              ? 'There are no unread notifications for your account.' 
              : 'New announcements, roll calls, and transaction receipts will appear right here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.15rem 1.25rem',
                borderRadius: '12px',
                background: notif.isRead ? '#FFFFFF' : '#F0FDF4',
                border: notif.isRead ? '1px solid #E2E8F0' : '1.5px solid #86EFAC',
                boxShadow: notif.isRead ? '0 1px 3px rgba(0,0,0,0.03)' : '0 4px 12px rgba(16, 185, 129, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Unread Indicator Bar */}
              {!notif.isRead && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '8px', 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: '#10B981' 
                  }} 
                />
              )}

              {/* Icon Box */}
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: notif.isRead ? '#F1F5F9' : '#DCFCE7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getNotificationIcon(notif)}
              </div>

              {/* Content Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0B203E' }}>
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  {notif.message}
                </p>

                {/* Deep Link Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: notif.isRead ? '#F8FAFC' : '#059669',
                      color: notif.isRead ? '#0B203E' : '#FFFFFF',
                      border: notif.isRead ? '1px solid #CBD5E1' : 'none',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{getActionLabel(notif)}</span>
                    <ArrowRight size={13} />
                  </button>

                  {!notif.isRead && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={12} /> New unread
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
