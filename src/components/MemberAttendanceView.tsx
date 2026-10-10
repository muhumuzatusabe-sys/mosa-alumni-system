import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  Sparkles,
  ArrowRight,
  Info,
  Check,
  ArrowLeft
} from 'lucide-react';
import { AuthUser, Meeting, MeetingAttendanceRecord } from '../types';
import { governanceService, ATTENDANCE_STATE_LABELS } from '../services/governanceService';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onOpenRegister: () => void;
  onBack?: () => void;
}

export const MemberAttendanceView: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onOpenRegister,
  onBack,
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allAttendance, setAllAttendance] = useState<MeetingAttendanceRecord[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ meetingId: string; message: string; isError?: boolean } | null>(null);
  
  // Assisted registration drawer/form per meeting
  const [assistedOpenFor, setAssistedOpenFor] = useState<string | null>(null);
  const [colleagueName, setColleagueName] = useState('');
  const [colleagueMANumber, setColleagueMANumber] = useState('');
  const [colleaguePhone, setColleaguePhone] = useState('');
  const [assistedLoading, setAssistedLoading] = useState(false);

  // Quick guest check-in for non-logged in users
  const [quickCheckinOpenFor, setQuickCheckinOpenFor] = useState<string | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickContact, setQuickContact] = useState('');
  const [quickMANumber, setQuickMANumber] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const loadMeetingsData = () => {
    try {
      const mtgs = governanceService.getMeetings();
      setMeetings(mtgs);
      const atts = governanceService.getAllAttendance();
      setAllAttendance(atts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMeetingsData();
    // Live update interval: keep sync with secretariat and other attendee check-ins
    const interval = setInterval(loadMeetingsData, 4000);
    const onStorage = () => loadMeetingsData();
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const flashNotice = (meetingId: string, message: string, isError = false) => {
    setNotice({ meetingId, message, isError });
    setTimeout(() => {
      setNotice(prev => (prev?.meetingId === meetingId ? null : prev));
    }, 4500);
  };

  const handleSelfSignIn = async (meeting: Meeting) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSubmittingId(meeting.id);
    try {
      await governanceService.selfRegister(meeting.id, currentUser);
      loadMeetingsData();
      flashNotice(meeting.id, 'Attendance recorded! Your check-in is pending Secretary verification.');
    } catch (err: any) {
      flashNotice(meeting.id, err.message || 'Unable to record attendance.', true);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleAssistedSubmit = async (e: React.FormEvent, meetingId: string) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!colleagueName.trim()) {
      flashNotice(meetingId, 'Please enter the alumnus full name.', true);
      return;
    }

    setAssistedLoading(true);
    try {
      await governanceService.assistedMemberRegister(
        meetingId,
        {
          fullName: colleagueName.trim(),
          alumniNumber: colleagueMANumber.trim() || undefined,
          phone: colleaguePhone.trim() || undefined,
        },
        currentUser
      );
      loadMeetingsData();
      setColleagueName('');
      setColleagueMANumber('');
      setColleaguePhone('');
      setAssistedOpenFor(null);
      flashNotice(meetingId, `Attendance submitted for ${colleagueName.trim()} (Assisted check-in).`);
    } catch (err: any) {
      flashNotice(meetingId, err.message || 'Failed to submit assisted attendance.', true);
    } finally {
      setAssistedLoading(false);
    }
  };

  const handleQuickGuestCheckin = async (e: React.FormEvent, meetingId: string) => {
    e.preventDefault();
    if (!quickName.trim()) {
      flashNotice(meetingId, 'Full name is required.', true);
      return;
    }

    setQuickLoading(true);
    try {
      // Create guest or alumnus attendance record
      const guestActor: AuthUser = {
        uid: `guest-roll-${Date.now()}`,
        email: quickContact.includes('@') ? quickContact.trim() : 'guest@mosa.massh.ac.ug',
        displayName: quickName.trim(),
        role: 'ALUMNI',
        active: true,
      };
      await governanceService.addGuest(
        meetingId,
        {
          fullName: quickName.trim(),
          attendeeType: quickMANumber.trim() ? 'ALUMNI_MEMBER' : 'GUEST',
          phone: quickContact.trim() || undefined,
          relationship: quickMANumber.trim() ? `Self-checkin with MA No: ${quickMANumber.trim()}` : 'In-person attendee',
        },
        guestActor,
        false
      );
      loadMeetingsData();
      setQuickName('');
      setQuickContact('');
      setQuickMANumber('');
      setQuickCheckinOpenFor(null);
      flashNotice(meetingId, `Attendance recorded for ${quickName.trim()}! Please see the Secretary for verification.`);
    } catch (err: any) {
      flashNotice(meetingId, err.message || 'Failed to check in.', true);
    } finally {
      setQuickLoading(false);
    }
  };

  // Find user's attendance record for a meeting
  const getUserRecord = (meetingId: string): MeetingAttendanceRecord | undefined => {
    if (!currentUser) return undefined;
    return allAttendance.find(r => 
      r.meetingId === meetingId && 
      r.status !== 'REMOVED' && 
      ((currentUser.alumniId && r.alumniId === currentUser.alumniId) ||
       (currentUser.email && r.phone?.toLowerCase() === currentUser.email.toLowerCase()) ||
       (currentUser.alumniNumber && r.alumniNumber && r.alumniNumber.toUpperCase() === currentUser.alumniNumber.toUpperCase()))
    );
  };

  const openMeetings = meetings.filter(m => m.attendanceState === 'OPEN');
  const otherMeetings = meetings.filter(m => m.attendanceState !== 'OPEN');

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
      {/* Header Banner */}
      <div 
        className="mosa-card" 
        style={{ 
          background: 'linear-gradient(135deg, #07152B 0%, #0B203E 100%)', 
          color: '#FFFFFF', 
          padding: '2rem 1.5rem', 
          borderRadius: '14px',
          borderLeft: '5px solid #D97706',
          marginBottom: '2rem'
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'rgba(217, 119, 6, 0.2)', padding: '0.5rem', borderRadius: '8px', color: '#FBBF24' }}>
            <ClipboardCheck size={26} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            MOSA Meeting Governance &amp; Roll Call
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
          Meeting Attendance Portal
        </h1>
        <p style={{ color: '#CBD5E1', fontSize: '0.92rem', maxWidth: '720px', margin: 0, lineHeight: 1.6 }}>
          Official roll call for Mandela Old Students Association assemblies, AGMs, chapter sessions, and committee meetings. 
          When roll call is opened by the Secretary General, members can sign in with one click.
        </p>

        {openMeetings.length > 0 && (
          <div style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, color: '#A7F3D0' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
            {openMeetings.length} Meeting Roll Call is Currently OPEN
          </div>
        )}
      </div>

      {/* SECTION 1: LIVE / OPEN MEETINGS */}
      {openMeetings.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
              Live Meetings Accepting Check-in
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {openMeetings.map(meeting => {
              const myRecord = getUserRecord(meeting.id);
              const stats = governanceService.getStats(meeting.id);
              const isSubmitted = !!myRecord;
              const isAssistedOpen = assistedOpenFor === meeting.id;
              const isQuickOpen = quickCheckinOpenFor === meeting.id;

              return (
                <div 
                  key={meeting.id} 
                  className="mosa-card" 
                  style={{ 
                    padding: '1.75rem', 
                    borderRadius: '12px', 
                    border: '2px solid #10B981', 
                    background: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)' 
                  }}
                >
                  {/* Top Bar with Title and Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                          {meeting.title}
                        </h3>
                        <span style={{ 
                          background: '#DCFCE7', 
                          color: '#166534', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.2rem 0.65rem', 
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Unlock size={12} /> Roll Call Open
                        </span>
                      </div>
                      {meeting.description && (
                        <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                        Attendees Present
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E' }}>
                        {stats.registered} <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>checked in</span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Meta (Date, Time, Venue) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={15} color="#D97706" />
                      <span>{new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={15} color="#D97706" />
                      <span>{meeting.startTime}{meeting.endTime ? ` – ${meeting.endTime}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="#D97706" />
                      <span>{meeting.venue}{meeting.city ? `, ${meeting.city}` : ''}</span>
                    </div>
                  </div>

                  {/* Inline Notice / Feedback */}
                  {notice?.meetingId === meeting.id && (
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      fontSize: '0.88rem', 
                      fontWeight: 600,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: notice.isError ? '#FEE2E2' : '#DCFCE7', 
                      color: notice.isError ? '#991B1B' : '#166534',
                      border: notice.isError ? '1px solid #FCA5A5' : '1px solid #86EFAC'
                    }}>
                      {notice.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                      <span>{notice.message}</span>
                    </div>
                  )}

                  {/* User Sign-In Action Area */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                    {currentUser ? (
                      <div>
                        {isSubmitted ? (
                          /* ALREADY SIGNED IN */
                          <div style={{ 
                            background: '#F0FDF4', 
                            border: '1.5px solid #86EFAC', 
                            borderRadius: '10px', 
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ background: '#DCFCE7', color: '#166534', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Check size={20} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                                  Attendance Signed &amp; Logged
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '0.1rem' }}>
                                  Signed at {new Date(myRecord.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {myRecord.fullName} ({myRecord.alumniNumber || 'Member'})
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {myRecord.status === 'VERIFIED' ? (
                                <span style={{ background: '#166534', color: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <ShieldCheck size={14} /> Verified by Secretary
                                </span>
                              ) : (
                                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Clock size={14} /> Pending Verification
                                </span>
                              )}
                              <button
                                disabled
                                className="btn"
                                style={{
                                  background: '#E2E8F0',
                                  color: '#64748B',
                                  border: 'none',
                                  padding: '0.45rem 0.85rem',
                                  fontSize: '0.82rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                <Lock size={13} /> Locked (Already Recorded)
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* NOT YET SIGNED IN */
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                                Ready to record your presence?
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                Click below to register your attendance as <strong>{currentUser.displayName}</strong> ({currentUser.alumniNumber || currentUser.email}).
                              </div>
                            </div>

                            <button
                              onClick={() => handleSelfSignIn(meeting)}
                              disabled={submittingId === meeting.id}
                              className="btn btn-primary"
                              style={{ 
                                padding: '0.75rem 1.75rem', 
                                fontSize: '0.95rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                boxShadow: '0 4px 14px rgba(11, 32, 62, 0.25)' 
                              }}
                            >
                              <CheckCircle2 size={18} />
                              <span>{submittingId === meeting.id ? 'Recording...' : 'Sign My Attendance'}</span>
                            </button>
                          </div>
                        )}

                        {/* Assisted Registration for Fellow Alumni without Devices */}
                        <div style={{ marginTop: '1rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setAssistedOpenFor(isAssistedOpen ? null : meeting.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#D97706',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: 0
                            }}
                          >
                            <Users size={14} />
                            <span>{isAssistedOpen ? 'Hide Assisted Form' : 'Attending with a fellow alumnus without a smartphone? Record their attendance'}</span>
                          </button>

                          {isAssistedOpen && (
                            <form 
                              onSubmit={(e) => handleAssistedSubmit(e, meeting.id)}
                              style={{ 
                                marginTop: '0.75rem', 
                                background: '#FFFBEB', 
                                border: '1px solid #FDE68A', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '0.75rem'
                              }}
                            >
                              <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>
                                Assisted Check-In Desk: Recorded under your name ({currentUser.displayName}) for a member without a device.
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Alumnus Full Name *</label>
                                <input
                                  required
                                  className="form-control"
                                  placeholder="e.g. David Magezi"
                                  value={colleagueName}
                                  onChange={e => setColleagueName(e.target.value)}
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>MA Number (if known)</label>
                                <input
                                  className="form-control"
                                  placeholder="e.g. MA. 0124"
                                  value={colleagueMANumber}
                                  onChange={e => setColleagueMANumber(e.target.value)}
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone Number (optional)</label>
                                <input
                                  className="form-control"
                                  placeholder="e.g. 0772 000 000"
                                  value={colleaguePhone}
                                  onChange={e => setColleaguePhone(e.target.value)}
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setAssistedOpenFor(null)}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={assistedLoading}
                                  className="btn btn-primary"
                                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                >
                                  {assistedLoading ? 'Submitting...' : 'Submit Colleague Attendance'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* USER NOT LOGGED IN */
                      <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                              Sign In to Sign Your Official Attendance
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                              Log in with your MOSA account or register for instant verification.
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={onOpenAuth}
                              className="btn btn-primary"
                              style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <LogIn size={15} />
                              <span>Login to Sign</span>
                            </button>
                            <button
                              onClick={() => setQuickCheckinOpenFor(isQuickOpen ? null : meeting.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}
                            >
                              {isQuickOpen ? 'Cancel' : 'Quick Guest Sign-In'}
                            </button>
                          </div>
                        </div>

                        {/* Quick Check-in form for in-person visitors or alumni without account */}
                        {isQuickOpen && (
                          <form 
                            onSubmit={(e) => handleQuickGuestCheckin(e, meeting.id)}
                            style={{ 
                              marginTop: '1rem', 
                              borderTop: '1px solid #E2E8F0', 
                              paddingTop: '1rem',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ gridColumn: '1 / -1', fontSize: '0.82rem', color: '#334155' }}>
                              <strong>Quick In-Person Sign-In:</strong> Record your name on the roll call list immediately.
                            </div>
                            <div>
                              <label className="form-label required" style={{ fontSize: '0.75rem' }}>Full Name</label>
                              <input
                                required
                                className="form-control"
                                placeholder="Your full name"
                                value={quickName}
                                onChange={e => setQuickName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone or Email</label>
                              <input
                                className="form-control"
                                placeholder="e.g. 0772... or email"
                                value={quickContact}
                                onChange={e => setQuickContact(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>MASSH MA Number (if known)</label>
                              <input
                                className="form-control"
                                placeholder="e.g. MA. 0248"
                                value={quickMANumber}
                                onChange={e => setQuickMANumber(e.target.value)}
                              />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button
                                type="submit"
                                disabled={quickLoading}
                                className="btn btn-primary"
                                style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }}
                              >
                                {quickLoading ? 'Submitting...' : 'Record My Attendance'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SCHEDULED & RECENT MEETINGS */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', marginBottom: '1rem' }}>
          All Association Meetings &amp; Proceedings
        </h2>

        {meetings.length === 0 ? (
          <div className="mosa-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
            <Calendar size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4, display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0B203E' }}>No Meetings Scheduled</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Check back soon or review Association news and announcements.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {otherMeetings.map(meeting => {
              const myRecord = getUserRecord(meeting.id);
              const stats = governanceService.getStats(meeting.id);
              const isClosed = meeting.attendanceState === 'CLOSED';
              const isFinalized = meeting.attendanceState === 'FINALIZED';
              const isCheckinClosed = meeting.attendanceState === 'CHECKIN_CLOSED';

              return (
                <div 
                  key={meeting.id} 
                  className="mosa-card" 
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    borderLeft: isFinalized ? '4px solid #2563EB' : isCheckinClosed ? '4px solid #D97706' : '4px solid #94A3B8'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0B203E', margin: 0 }}>
                        {meeting.title}
                      </h4>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '0.15rem 0.55rem', 
                        borderRadius: '999px',
                        background: isFinalized ? '#DBEAFE' : isCheckinClosed ? '#FEF3C7' : '#F1F5F9',
                        color: isFinalized ? '#1E40AF' : isCheckinClosed ? '#92400E' : '#475569'
                      }}>
                        {ATTENDANCE_STATE_LABELS[meeting.attendanceState]}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.35rem', fontSize: '0.8rem', color: '#64748B' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} /> {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} /> {meeting.startTime}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} /> {meeting.venue}
                      </span>
                    </div>

                    {isClosed && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem', fontStyle: 'italic' }}>
                        Attendance will open when proceedings commence.
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                        {isFinalized ? 'Verified Official' : 'Registered'}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B203E' }}>
                        {isFinalized ? stats.verified : stats.registered}
                      </div>
                    </div>

                    {myRecord && (
                      <span style={{ 
                        background: myRecord.status === 'VERIFIED' ? '#DCFCE7' : '#FEF3C7', 
                        color: myRecord.status === 'VERIFIED' ? '#166534' : '#92400E',
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        padding: '0.3rem 0.65rem', 
                        borderRadius: '6px' 
                      }}>
                        {myRecord.status === 'VERIFIED' ? 'Attended' : 'Pending Verification'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
