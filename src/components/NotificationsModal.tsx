import React, { useState, useEffect } from 'react';
import { AlumniNotification, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { isRegisteredAlumni } from '../services/governanceService';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Award, 
  Calendar, 
  Coins, 
  ClipboardCheck,
  Users,
  Megaphone,
  Info, 
  ExternalLink,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onNavigateTab?: (tab: any, targetId?: string) => void;
  onOpenRegister?: () => void;
}

export const NotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
  onOpenRegister,
}) => {
  if (!isOpen) return null;

  const [notifications, setNotifications] = useState<AlumniNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const isRegistered = isRegisteredAlumni(currentUser);
  const alumniId = currentUser?.alumniId || currentUser?.alumniNumber || currentUser?.uid || '';

  const loadNotifications = async () => {
    if (!isRegistered || !alumniId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await dataService.getAlumniNotifications(alumniId);
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [alumniId, isRegistered]);

  const handleNotificationClick = async (notif: AlumniNotification) => {
    await dataService.markNotificationAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (notif.linkTab && onNavigateTab) {
      onNavigateTab(notif.linkTab, notif.targetId);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    await dataService.markAllNotificationsAsRead(alumniId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DONATION_RECEIVED':
        return <HeartHandshake size={20} color="#D97706" />;
      case 'ATTENDANCE_OPEN':
        return <ClipboardCheck size={20} color="#D97706" />;
      case 'MEMBERSHIP_APPROVED':
      case 'MEMBERSHIP':
        return <Award size={20} color="#7C3AED" />;
      case 'PAYMENT_VERIFIED':
      case 'DUES_REMINDER':
        return <Coins size={20} color="#059669" />;
      case 'EVENT_ANNOUNCED':
      case 'EVENT_INVITE':
      case 'EVENT':
        return <Calendar size={20} color="#2563EB" />;
      case 'REGISTRY_UPDATED':
        return <Users size={20} color="#0284C7" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={20} color="#D97706" />;
      default:
        return <Bell size={20} color="#64748B" />;
    }
  };

  const getActionLabel = (notif: AlumniNotification) => {
    switch (notif.linkTab) {
      case 'attendance':
        return 'Go to Meeting Attendance Sign-In';
      case 'my-profile':
      case 'membership':
        return 'View Membership & Profile';
      case 'payments':
        return 'View Contribution & Receipts';
      case 'events':
        return 'View Event Details';
      case 'directory':
        return 'Open Alumni Registry';
      case 'news':
        return 'Read Official Announcement';
      default:
        return 'View Relevant Information';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'PAYMENTS') return n.linkTab === 'payments' || n.type.includes('PAYMENT') || n.type.includes('DUES');
    if (activeFilter === 'EVENTS') return n.linkTab === 'events' || n.type.includes('EVENT');
    if (activeFilter === 'ATTENDANCE') return n.linkTab === 'attendance' || n.type.includes('ATTENDANCE');
    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
      <div 
        className="modal-content notifications-modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '560px', 
          width: '95%', 
          maxHeight: '85vh', 
          padding: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(11, 32, 62, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0B203E', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.25)', border: '1px solid #D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="#FBBF24" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
                MOSA Notification Centre
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Actionable alerts & deep-links for MASSH alumni
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {unreadCount > 0 && (
              <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.75rem', padding: '3px 9px', borderRadius: '9999px', fontWeight: 800 }}>
                {unreadCount} new
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FCD34D', fontSize: '0.78rem', fontWeight: 600, padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              aria-label="Close Notification Centre"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!isRegistered ? (
          <div style={{ padding: '2.5rem 1.75rem', textAlign: 'center', background: '#FFFFFF' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF3C7', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#B45309' }}>
              <Bell size={26} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              Alumni Registration Required
            </h4>
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55, maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
              Notifications, official circulars, event invitations, and meeting roll calls are delivered exclusively to registered MASSH alumni.
            </p>
            <button
              onClick={() => {
                onClose();
                if (onOpenRegister) onOpenRegister();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: '#113D2B',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(17, 61, 43, 0.25)',
                width: '100%',
                maxWidth: '280px'
              }}
            >
              <Award size={16} />
              <span>Register as an Alumnus</span>
            </button>
          </div>
        ) : (
          <>
            {/* Filter Pills */}
            <div style={{ padding: '0.65rem 1.25rem', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'PAYMENTS', label: 'Contributions' },
            { id: 'EVENTS', label: 'Events' },
            { id: 'ATTENDANCE', label: 'Attendance' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: activeFilter === f.id ? '1px solid #0B203E' : '1px solid #E2E8F0',
                background: activeFilter === f.id ? '#0B203E' : '#F8FAFC',
                color: activeFilter === f.id ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#F8FAFC' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
              <Bell size={42} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '1.05rem', marginBottom: '0.25rem' }}>No notifications yet</div>
              <div style={{ fontSize: '0.85rem' }}>You are completely caught up on Mandela Old Students Association updates.</div>
            </div>
          ) : (
            filteredNotifications.map(n => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    background: isUnread ? '#FFFFFF' : '#F1F5F9',
                    border: isUnread ? '1.5px solid #D97706' : '1px solid #E2E8F0',
                    boxShadow: isUnread ? '0 4px 15px rgba(217, 119, 6, 0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      background: isUnread ? '#FEF3C7' : '#E2E8F0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                      <strong style={{ fontSize: '0.94rem', color: '#0B203E', fontWeight: 700 }}>
                        {n.title}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', flexShrink: 0 }}>
                        {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 0.65rem 0', lineHeight: '1.45' }}>
                      {n.message}
                    </p>

                    {/* Actionable Deep-Link Gateway Button */}
                    {n.linkTab && (
                      <div 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          color: '#2563EB',
                          background: '#EFF6FF',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        <span>{getActionLabel(n)}</span>
                        <ArrowRight size={13} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};
