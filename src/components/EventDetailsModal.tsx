import React, { useState, useEffect } from 'react';
import { MOSAEvent, EventRegistration, EventAttendance, AlumniProfile, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  Search, 
  Award,
  Sparkles,
  Ticket
} from 'lucide-react';

interface Props {
  event: MOSAEvent | null;
  onClose: () => void;
  currentUser: AuthUser | null;
  onEventUpdated: () => void;
  onOpenAuth: () => void;
}

export const EventDetailsModal: React.FC<Props> = ({
  event,
  onClose,
  currentUser,
  onEventUpdated,
  onOpenAuth,
}) => {
  if (!event) return null;

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'MY_PASS' | 'ATTENDANCE_DESK'>('DETAILS');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [myRegistration, setMyRegistration] = useState<EventRegistration | null>(null);
  const [myProfile, setMyProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Check-in inputs
  const [manualAlumniNo, setManualAlumniNo] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ success: boolean; message: string } | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const regs = await dataService.getEventRegistrations(event.id);
      setRegistrations(regs);

      const atts = await dataService.getEventAttendance(event.id);
      setAttendance(atts);

      if (currentUser?.alumniId) {
        const p = await dataService.getAlumniById(currentUser.alumniId);
        setMyProfile(p);
        const myReg = regs.find(r => r.alumniId === currentUser.alumniId && r.status === 'REGISTERED');
        setMyRegistration(myReg || null);
      } else if (currentUser?.email) {
        const list = await dataService.getAlumniList();
        const p = list.find(a => a.email.toLowerCase() === currentUser.email.toLowerCase()) || null;
        setMyProfile(p);
        if (p) {
          const myReg = regs.find(r => r.alumniId === p.internalId && r.status === 'REGISTERED');
          setMyRegistration(myReg || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [event, currentUser]);

  const handleRegister = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!myProfile) {
      alert('You must have an official verified alumni profile with an assigned MA. number to register.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.registerForEvent(event.id, myProfile);
      if (res.success && res.registration) {
        setMyRegistration(res.registration);
        setActiveTab('MY_PASS');
        await loadData();
        onEventUpdated();
      } else {
        alert(res.error || 'Registration failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error registering');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAlumniNo.trim()) return;

    setCheckInMsg(null);
    try {
      const res = await dataService.checkInAttendee(
        event.id,
        manualAlumniNo.trim(),
        currentUser?.email || 'admin@massh.ac.ug',
        'MANUAL_ADMIN'
      );
      if (res.success && res.attendance) {
        setCheckInMsg({
          success: true,
          message: `Checked in: ${res.attendance.alumniName} (${res.attendance.alumniNumber}) at ${new Date(res.attendance.checkedInAt).toLocaleTimeString()}`,
        });
        setManualAlumniNo('');
        await loadData();
        onEventUpdated();
      } else {
        setCheckInMsg({ success: false, message: res.error || 'Check-in failed' });
      }
    } catch (err: any) {
      setCheckInMsg({ success: false, message: err.message || 'Error executing check-in' });
    }
  };

  const handleQRCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) return;

    setCheckInMsg(null);
    try {
      const res = await dataService.verifyAndCheckInByQR(
        qrTokenInput.trim(),
        currentUser?.email || 'admin@massh.ac.ug'
      );
      if (res.success) {
        setCheckInMsg({
          success: true,
          message: `Verified QR: ${res.attendeeName} (${res.alumniNumber}) successfully checked in!`,
        });
        setQrTokenInput('');
        await loadData();
        onEventUpdated();
      } else {
        setCheckInMsg({ success: false, message: res.error || 'QR Verification failed' });
      }
    } catch (err: any) {
      setCheckInMsg({ success: false, message: err.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        {/* Header with image banner if exists */}
        <div style={{ position: 'relative' }}>
          {event.eventImage ? (
            <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
              <img
                src={event.eventImage}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,32,62,0.9) 0%, rgba(11,32,62,0.3) 100%)' }} />
            </div>
          ) : (
            <div style={{ height: '90px', background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)' }} />
          )}

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <button
            onClick={() => setActiveTab('DETAILS')}
            style={{
              flex: 1,
              padding: '0.85rem',
              fontWeight: activeTab === 'DETAILS' ? 700 : 500,
              color: activeTab === 'DETAILS' ? '#0B203E' : '#64748B',
              border: 'none',
              borderBottom: activeTab === 'DETAILS' ? '3px solid #D97706' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Event Details
          </button>

          {myRegistration && (
            <button
              onClick={() => setActiveTab('MY_PASS')}
              style={{
                flex: 1,
                padding: '0.85rem',
                fontWeight: activeTab === 'MY_PASS' ? 700 : 500,
                color: activeTab === 'MY_PASS' ? '#0B203E' : '#64748B',
                border: 'none',
                borderBottom: activeTab === 'MY_PASS' ? '3px solid #D97706' : '3px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <Ticket size={16} color="#D97706" />
              <span>My QR Check-In Pass</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('ATTENDANCE_DESK')}
              style={{
                flex: 1,
                padding: '0.85rem',
                fontWeight: activeTab === 'ATTENDANCE_DESK' ? 700 : 500,
                color: activeTab === 'ATTENDANCE_DESK' ? '#0B203E' : '#64748B',
                border: 'none',
                borderBottom: activeTab === 'ATTENDANCE_DESK' ? '3px solid #D97706' : '3px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <ShieldCheck size={16} color="#059669" />
              <span>Attendance Check-In Desk ({attendance.length})</span>
            </button>
          )}
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* TAB 1: DETAILS */}
          {activeTab === 'DETAILS' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', textTransform: 'uppercase' }}>
                    {event.eventType.replace('_', ' ')}
                  </span>
                  <h2 style={{ fontSize: '1.45rem', color: '#0B203E', marginTop: '0.35rem' }}>
                    {event.title}
                  </h2>
                </div>

                <span className={`status-badge ${event.status}`}>
                  {event.status}
                </span>
              </div>

              {/* Schedule and Venue Cards */}
              <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Calendar size={15} /> Date
                  </div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem', fontSize: '0.95rem' }}>
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Clock size={15} /> Time
                  </div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem', fontSize: '0.95rem' }}>
                    {event.startTime} — {event.endTime}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontSize: '0.8rem', fontWeight: 600 }}>
                    <MapPin size={15} /> Venue
                  </div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                    {event.venue}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#0B203E', marginBottom: '0.4rem' }}>About this Event</h4>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                  {event.description}
                </p>
              </div>

              {/* Registration RSVP Banner */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={16} /> {event.registeredCount} Alumni Registered • {event.attendedCount} Attended
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: '0.2rem' }}>
                    Requirement: <strong>{event.registrationRequirement.replace('_', ' ')}</strong>
                    {event.registrationDeadline && ` • RSVP Deadline: ${event.registrationDeadline}`}
                  </div>
                </div>

                <div>
                  {myRegistration ? (
                    <button className="btn btn-emerald" onClick={() => setActiveTab('MY_PASS')}>
                      <QrCode size={15} /> View My QR Pass
                    </button>
                  ) : (
                    <button className="btn btn-gold" onClick={handleRegister} disabled={loading}>
                      Register for Event (Get QR Pass)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY QR PASS */}
          {activeTab === 'MY_PASS' && myRegistration && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  color: '#ffffff',
                  maxWidth: '440px',
                  margin: '0 auto',
                  boxShadow: '0 10px 25px rgba(11,32,62,0.25)',
                  border: '2px solid #D97706',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Mandela Old Students Association
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem', marginBottom: '0.75rem' }}>
                  Official Event Admission Pass
                </div>

                {/* QR Code Container */}
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', margin: '0 auto 1rem auto' }}>
                  {/* Decorative QR code mockup */}
                  <div style={{ width: '160px', height: '160px', background: '#F8FAFC', border: '2px solid #0B203E', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <QrCode size={110} color="#0B203E" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>
                      SCAN AT ENTRANCE
                    </span>
                  </div>
                </div>

                {/* Attendee details */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Attendee:</span>
                    <strong style={{ color: '#FFFFFF' }}>{myRegistration.alumniName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Alumni No:</span>
                    <strong style={{ color: '#FCD34D' }}>{myRegistration.alumniNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Event:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{event.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94A3B8' }}>Date:</span>
                    <span style={{ color: '#FFFFFF' }}>{event.date} ({event.startTime})</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', color: '#CBD5E1', wordBreak: 'break-all' }}>
                    Token: <code>{myRegistration.qrCheckInToken}</code>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '1rem' }}>
                Present this digital pass at the MASSH registration desk for fast QR check-in.
              </p>
            </div>
          )}

          {/* TAB 3: ATTENDANCE CHECK-IN DESK (Admins only) */}
          {activeTab === 'ATTENDANCE_DESK' && isAdmin && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0B203E' }}>
                  On-Site Attendance Check-In Desk
                </h3>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  {attendance.length} Checked In
                </span>
              </div>

              {/* Feedback Alert */}
              {checkInMsg && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', background: checkInMsg.success ? '#D1FAE5' : '#FEE2E2', border: checkInMsg.success ? '1px solid #A7F3D0' : '1px solid #FECACA', color: checkInMsg.success ? '#065F46' : '#991B1B' }}>
                  {checkInMsg.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{checkInMsg.message}</span>
                </div>
              )}

              {/* Fast Check-In Row */}
              <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
                {/* Method 1: Manual Alumni No Check-in */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#0B203E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Search size={14} color="#D97706" /> 1. Check-In by Alumni Number
                  </h4>
                  <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. MA. 0001"
                      value={manualAlumniNo}
                      onChange={e => setManualAlumniNo(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                      Check-In
                    </button>
                  </form>
                  <small style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '0.3rem' }}>
                    Quickly check in alumni who do not have their phone or pass.
                  </small>
                </div>

                {/* Method 2: Scan / Paste QR Pass Token */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#0B203E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <QrCode size={14} color="#059669" /> 2. Scan / Verify QR Pass Token
                  </h4>
                  <form onSubmit={handleQRCheckIn} style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Paste QR token payload..."
                      value={qrTokenInput}
                      onChange={e => setQrTokenInput(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    />
                    <button type="submit" className="btn btn-emerald" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
                      Verify
                    </button>
                  </form>
                  <small style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '0.3rem' }}>
                    Instantly verifies token, records timestamp, and assigns check-in.
                  </small>
                </div>
              </div>

              {/* Real-time Attendees List */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#0B203E', marginBottom: '0.5rem' }}>
                  Confirmed Checked-In Attendees ({attendance.length})
                </h4>

                {attendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem' }}>
                    No alumni have checked in to this event yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {attendance.map(att => (
                      <div
                        key={att.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="alumni-no-pill" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                            {att.alumniNumber}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0B203E' }}>
                            {att.alumniName}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            via {att.checkInMethod === 'QR_SCAN' ? 'QR Code' : 'Desk Admin'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          Checked in {new Date(att.checkedInAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
