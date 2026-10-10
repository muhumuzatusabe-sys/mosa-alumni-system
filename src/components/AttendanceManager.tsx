import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus, ChevronLeft, Users, UserPlus, Search, Download, Printer, Lock, Unlock,
  CheckCircle2, MoreVertical, AlertTriangle, ClipboardCheck, X, RotateCcw,
} from 'lucide-react';
import { AlumniProfile, AttendeeType, AuthUser, Meeting, MeetingAttendanceRecord } from '../types';
import { dataService } from '../services/dataService';
import { governanceService, ATTENDEE_TYPE_LABELS, ATTENDANCE_STATE_LABELS } from '../services/governanceService';

interface Props {
  currentUser: AuthUser;
}

const stateColors: Record<string, { bg: string; fg: string }> = {
  CLOSED: { bg: '#F1F5F9', fg: '#475569' },
  OPEN: { bg: '#DCFCE7', fg: '#166534' },
  CHECKIN_CLOSED: { bg: '#FEF3C7', fg: '#92400E' },
  FINALIZED: { bg: '#DBEAFE', fg: '#1E40AF' },
};

const statusColors: Record<string, string> = { PENDING: '#B45309', VERIFIED: '#047857', REMOVED: '#B91C1C' };

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem',
  borderBottom: '1px solid #F1F5F9', fontSize: '0.87rem',
};

const Pill: React.FC<{ label: string; bg: string; fg: string }> = ({ label, bg, fg }) => (
  <span style={{ background: bg, color: fg, fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>{label}</span>
);

export const AttendanceManager: React.FC<Props> = ({ currentUser }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [records, setRecords] = useState<MeetingAttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REMOVED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AttendeeType>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; needsReason?: boolean; reasonLabel?: string; action: (reason?: string) => Promise<void> }>(null);
  const [confirmReason, setConfirmReason] = useState('');

  const canManage = governanceService.can(currentUser, 'ATTENDANCE', 'MANAGE');
  const canAdd = governanceService.can(currentUser, 'ATTENDANCE', 'ADD');
  const canExport = governanceService.can(currentUser, 'ATTENDANCE', 'EXPORT');
  const isSuper = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const meeting = meetings.find(m => m.id === selectedId) || null;
  const stats = selectedId ? governanceService.getStats(selectedId) : null;

  const reload = () => {
    setMeetings(governanceService.getMeetings());
    if (selectedId) setRecords(governanceService.getAttendance(selectedId));
  };

  useEffect(() => {
    reload();
    // Live updates: self-registrations from other devices/tabs
    const t = setInterval(reload, 4000);
    const onStorage = () => reload();
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(t); window.removeEventListener('storage', onStorage); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const flash = (msg: string) => { setNotice(msg); setError(''); setTimeout(() => setNotice(''), 3500); };
  const run = async (fn: () => Promise<any>, ok?: string) => {
    try { await fn(); reload(); if (ok) flash(ok); } catch (e: any) { setError(e.message || 'Action failed.'); }
  };

  const filtered = useMemo(() => records.filter(r =>
    (statusFilter === 'ALL' || r.status === statusFilter) &&
    (typeFilter === 'ALL' || r.attendeeType === typeFilter) &&
    (!search.trim() || `${r.fullName} ${r.alumniNumber || ''}`.toLowerCase().includes(search.toLowerCase()))
  ), [records, statusFilter, typeFilter, search]);

  const locked = meeting?.attendanceState === 'FINALIZED';

  const askConfirm = (c: NonNullable<typeof confirm>) => { setConfirmReason(''); setConfirm(c); };

  const exportCSV = () => {
    if (!meeting) return;
    const blob = new Blob([governanceService.toCSV(meeting.id)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOSA_Attendance_${meeting.date}_${meeting.title.replace(/[^a-z0-9]+/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    dataService.logAudit({ action: 'ATTENDANCE_EXPORTED', performedBy: currentUser.email, affectedRecord: meeting.id, metadata: { format: 'CSV' } });
  };

  const printReport = () => {
    if (!meeting || !stats) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = records.map(r => `<tr><td>${r.fullName}</td><td>${r.alumniNumber || '-'}</td><td>${ATTENDEE_TYPE_LABELS[r.attendeeType]}</td><td>${r.source}</td><td>${r.status}</td><td>${new Date(r.registeredAt).toLocaleTimeString()}</td></tr>`).join('');
    w.document.write(`<html><head><title>${meeting.title} - Attendance</title><style>body{font-family:Inter,Arial,sans-serif;color:#0B203E;padding:24px}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{border-bottom:1px solid #E2E8F0;padding:6px;text-align:left}th{background:#F8FAFC}.k{display:inline-block;margin-right:18px;font-size:13px}</style></head><body>
      <div style="border-bottom:3px solid #D97706;padding-bottom:8px;margin-bottom:12px"><strong>Mandela Old Students Association (MOSA)</strong><br/><small>Mandela Secondary School Hoima</small></div>
      <h1>${meeting.title}</h1><p>${meeting.date} | ${meeting.startTime} - ${meeting.endTime} | ${meeting.venue} | Status: ${ATTENDANCE_STATE_LABELS[meeting.attendanceState]}</p>
      <div><span class="k">Registered: <b>${stats.registered}</b></span><span class="k">Verified: <b>${stats.verified}</b></span><span class="k">Pending: <b>${stats.pending}</b></span><span class="k">Removed: <b>${stats.removed}</b></span><span class="k">Expected: <b>${stats.expected}</b></span><span class="k">Alumni: <b>${stats.byType.ALUMNI_MEMBER}</b></span><span class="k">Guests: <b>${stats.byType.GUEST + stats.byType.NON_ALUMNUS}</b></span><span class="k">Officials: <b>${stats.byType.INVITED_OFFICIAL}</b></span></div>
      <table><thead><tr><th>Name</th><th>MA No.</th><th>Type</th><th>Source</th><th>Status</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  // ==========================================
  // MEETING LIST
  // ==========================================
  if (!meeting) {
    return (
      <div className="mosa-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Meeting Attendance</h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Attendance never opens automatically. Select a meeting to control it.</p>
          </div>
          {canAdd && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <CalendarPlus size={16} /> New Meeting
            </button>
          )}
        </div>
        {error && <div style={{ color: '#B91C1C', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</div>}
        {meetings.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '2.5rem 0' }}>No meetings yet. Create the first meeting to begin.</p>
        ) : (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            {meetings.map(m => {
              const s = governanceService.getStats(m.id);
              const c = stateColors[m.attendanceState];
              return (
                <div key={m.id} style={{ ...rowStyle, cursor: 'pointer' }} onClick={() => { setSelectedId(m.id); setSelectedRows(new Set()); }}>
                  <div style={{ width: '52px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 700 }}>{new Date(m.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0B203E' }}>{new Date(m.date).getDate()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#0B203E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ color: '#64748B', fontSize: '0.78rem' }}>{m.venue} | {m.startTime} | {s.verified}/{m.expectedAttendance} verified</div>
                  </div>
                  <Pill label={ATTENDANCE_STATE_LABELS[m.attendanceState]} bg={c.bg} fg={c.fg} />
                </div>
              );
            })}
          </div>
        )}
        {isCreateOpen && <CreateMeetingDialog currentUser={currentUser} onClose={() => setIsCreateOpen(false)} onCreated={id => { setIsCreateOpen(false); reload(); setSelectedId(id); }} />}
      </div>
    );
  }

  // ==========================================
  // LIVE ATTENDANCE SCREEN
  // ==========================================
  const c = stateColors[meeting.attendanceState];
  const pendingIds = records.filter(r => r.status === 'PENDING').map(r => r.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="mosa-card" style={{ padding: '1.25rem' }}>
        <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', padding: 0, marginBottom: '0.5rem' }}>
          <ChevronLeft size={15} /> All meetings
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{meeting.title}</h2>
              <Pill label={`Attendance ${ATTENDANCE_STATE_LABELS[meeting.attendanceState]}`} bg={c.bg} fg={c.fg} />
            </div>
            <div style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              {new Date(meeting.date).toLocaleDateString(undefined, { dateStyle: 'long' })} | {meeting.startTime} - {meeting.endTime} | {meeting.venue}{meeting.city ? `, ${meeting.city}` : ''}
            </div>
          </div>

          {/* State control: one deliberate next step at a time */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canManage && meeting.attendanceState === 'CLOSED' && (
              <button className="btn btn-primary" onClick={() => askConfirm({ title: 'Open attendance', message: 'Members will be able to register their attendance and will be notified. Continue?', action: async () => run(() => governanceService.changeAttendanceState(meeting.id, 'OPEN', currentUser), 'Attendance is now open.') })}>
                <Unlock size={15} /> Open Attendance
              </button>
            )}
            {canManage && meeting.attendanceState === 'OPEN' && (
              <button className="btn btn-secondary" onClick={() => askConfirm({ title: 'Close check-in', message: 'No new self-registrations will be accepted. You can still review the list and add missing attendees. Continue?', action: async () => run(() => governanceService.changeAttendanceState(meeting.id, 'CHECKIN_CLOSED', currentUser), 'Check-in closed.') })}>
                <Lock size={15} /> Close Check-in
              </button>
            )}
            {canManage && meeting.attendanceState === 'CHECKIN_CLOSED' && (
              <>
                <button className="btn btn-secondary" onClick={() => run(() => governanceService.changeAttendanceState(meeting.id, 'OPEN', currentUser), 'Check-in reopened.')}>
                  <Unlock size={15} /> Reopen Check-in
                </button>
                <button className="btn btn-primary" onClick={() => askConfirm({ title: 'Finalize attendance', message: `This makes the list the official meeting record. ${stats?.pending || 0} record(s) are still pending and will remain unverified. Only a Super Admin can reopen it afterwards. Continue?`, action: async () => run(() => governanceService.changeAttendanceState(meeting.id, 'FINALIZED', currentUser), 'Attendance finalized.') })}>
                  <ClipboardCheck size={15} /> Finalize Attendance
                </button>
              </>
            )}
            {locked && isSuper && (
              <button className="btn btn-secondary" onClick={() => askConfirm({ title: 'Reopen finalized attendance', message: 'Reopening an official record is audited.', needsReason: true, reasonLabel: 'Reason for reopening', action: async (reason) => run(() => governanceService.changeAttendanceState(meeting.id, 'CHECKIN_CLOSED', currentUser, reason), 'Attendance reopened for review.') })}>
                <RotateCcw size={15} /> Reopen (Super Admin)
              </button>
            )}
          </div>
        </div>

        {/* Live counters */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
            {[
              { k: 'Registered', v: stats.registered, col: '#0B203E' },
              { k: 'Verified', v: stats.verified, col: '#047857' },
              { k: 'Pending', v: stats.pending, col: '#B45309' },
              { k: 'Removed', v: stats.removed, col: '#B91C1C' },
              { k: 'Expected', v: stats.expected, col: '#475569' },
              { k: 'Alumni', v: stats.byType.ALUMNI_MEMBER + stats.byType.PENDING_ALUMNI, col: '#0B203E' },
              { k: 'Guests', v: stats.byType.GUEST + stats.byType.NON_ALUMNUS + stats.byType.OTHER, col: '#0B203E' },
              { k: 'Officials', v: stats.byType.INVITED_OFFICIAL, col: '#0B203E' },
            ].map(x => (
              <div key={x.k} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.5rem 0.65rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>{x.k}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: x.col }}>{x.v}</div>
              </div>
            ))}
          </div>
        )}
        {meeting.attendanceState === 'OPEN' && (
          <div style={{ marginTop: '0.85rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', color: '#166534' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block', boxShadow: '0 0 8px #16A34A' }} />
              <strong>Live Member Roll Call Active:</strong> Members can check in from their mobile phones or computers on the Attendance page.
            </div>
            <span style={{ fontSize: '0.75rem', color: '#15803D' }}>Real-time synchronization enabled</span>
          </div>
        )}
        {meeting.reopenHistory && meeting.reopenHistory.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#92400E' }}>
            Reopened {meeting.reopenHistory.length} time(s). Last: {meeting.reopenHistory[meeting.reopenHistory.length - 1].by} - "{meeting.reopenHistory[meeting.reopenHistory.length - 1].reason}"
          </div>
        )}
      </div>

      {(error || notice) && (
        <div style={{ padding: '0.65rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', background: error ? '#FEE2E2' : '#DCFCE7', color: error ? '#991B1B' : '#166534', display: 'flex', justifyContent: 'space-between' }}>
          <span>{error || notice}</span>
          <button onClick={() => { setError(''); setNotice(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      <div className="mosa-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #E2E8F0', background: '#FCFCFD' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input className="form-input" placeholder="Search name or MA number" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', width: '100%' }} />
          </div>
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REMOVED">Removed</option>
          </select>
          <select className="form-input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
            <option value="ALL">All person types</option>
            {Object.entries(ATTENDEE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {canAdd && !locked && meeting.attendanceState !== 'CLOSED' && (
            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}><UserPlus size={15} /> Add Attendee</button>
          )}
          {canExport && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV} title="CSV opens directly in Excel"><Download size={15} /> CSV / Excel</button>
              <button className="btn btn-secondary" onClick={printReport} title="Print or save as PDF"><Printer size={15} /> PDF</button>
            </>
          )}
        </div>

        {/* Bulk bar */}
        {!locked && (pendingIds.length > 0 || selectedRows.size > 0) && governanceService.can(currentUser, 'ATTENDANCE', 'VERIFY') && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: '0.82rem' }}>
            <AlertTriangle size={15} color="#B45309" />
            <span style={{ color: '#92400E', flex: 1 }}>{selectedRows.size > 0 ? `${selectedRows.size} selected` : `${pendingIds.length} pending record(s)`}</span>
            {pendingIds.length > 0 && selectedRows.size === 0 && (
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => askConfirm({ title: 'Approve all eligible pending', message: `You are about to verify ${pendingIds.length} attendance record(s). Continue?`, action: async () => run(() => governanceService.setStatus(meeting.id, pendingIds, 'VERIFIED', currentUser), `${pendingIds.length} record(s) verified.`) })}>
                Approve All Eligible Pending
              </button>
            )}
            {selectedRows.size > 0 && (
              <>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => askConfirm({ title: 'Verify selected', message: `You are about to verify ${selectedRows.size} attendance record(s). Continue?`, action: async () => run(async () => { await governanceService.setStatus(meeting.id, [...selectedRows], 'VERIFIED', currentUser); setSelectedRows(new Set()); }, 'Selected records verified.') })}>
                  Verify Selected
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#B91C1C' }}
                  onClick={() => askConfirm({ title: 'Remove selected', message: `You are about to remove ${selectedRows.size} attendance record(s).`, needsReason: true, reasonLabel: 'Reason (e.g. Not physically present at meeting)', action: async (reason) => run(async () => { await governanceService.setStatus(meeting.id, [...selectedRows], 'REMOVED', currentUser, reason); setSelectedRows(new Set()); }, 'Selected records removed.') })}>
                  Remove Selected
                </button>
                <button onClick={() => setSelectedRows(new Set())} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem' }}>Clear</button>
              </>
            )}
          </div>
        )}

        {/* Compact rows */}
        {filtered.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '2.5rem 1rem', fontSize: '0.9rem' }}>
            {meeting.attendanceState === 'CLOSED' ? 'Attendance is closed. Open attendance to begin receiving registrations.' : 'No attendance records match these filters.'}
          </p>
        ) : filtered.map(r => (
          <div key={r.id} style={{ ...rowStyle, opacity: r.status === 'REMOVED' ? 0.6 : 1 }}>
            {!locked && (
              <input type="checkbox" checked={selectedRows.has(r.id)} onChange={e => {
                const next = new Set(selectedRows);
                e.target.checked ? next.add(r.id) : next.delete(r.id);
                setSelectedRows(next);
              }} aria-label={`Select ${r.fullName}`} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#0B203E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.fullName}</div>
              <div style={{ color: '#64748B', fontSize: '0.76rem' }}>
                {r.alumniNumber || ATTENDEE_TYPE_LABELS[r.attendeeType]}{r.organisation ? ` | ${r.organisation}` : ''} | {new Date(r.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {r.source}{r.isLate ? ' | Late' : ''}
                {r.status === 'REMOVED' && r.removalReason ? ` | ${r.removalReason}` : ''}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColors[r.status] }}>{r.status === 'VERIFIED' ? 'Verified' : r.status === 'PENDING' ? 'Pending' : 'Removed'}</span>
            {!locked && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuFor(menuFor === r.id ? null : r.id)} style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer', display: 'flex' }} aria-label="Attendance actions" title="Attendance Actions">
                  <MoreVertical size={15} color="#475569" />
                </button>
                {menuFor === r.id && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 8px 20px rgba(11,32,62,0.12)', zIndex: 20, minWidth: '190px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Attendance Actions</div>
                    {r.status !== 'VERIFIED' && <MenuItem label="Approve / verify" onClick={() => { setMenuFor(null); run(() => governanceService.setStatus(meeting.id, [r.id], 'VERIFIED', currentUser), `${r.fullName} verified.`); }} />}
                    {r.status !== 'PENDING' && <MenuItem label="Keep pending" onClick={() => { setMenuFor(null); run(() => governanceService.setStatus(meeting.id, [r.id], 'PENDING', currentUser)); }} />}
                    {r.status !== 'REMOVED' && <MenuItem danger label="Reject / remove" onClick={() => { setMenuFor(null); askConfirm({ title: `Remove ${r.fullName}`, message: 'This attendance record will be removed from the count.', needsReason: true, reasonLabel: 'Reason (e.g. Not physically present at meeting)', action: async (reason) => run(() => governanceService.setStatus(meeting.id, [r.id], 'REMOVED', currentUser, reason), 'Record removed.') }); }} />}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAddOpen && <AddAttendeeDialog meeting={meeting} currentUser={currentUser} onClose={() => setIsAddOpen(false)} onDone={msg => { setIsAddOpen(false); reload(); flash(msg); }} />}

      {confirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header"><h3 style={{ fontSize: '1.1rem' }}>{confirm.title}</h3></div>
            <div className="modal-body">
              <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.5 }}>{confirm.message}</p>
              {confirm.needsReason && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label required">{confirm.reasonLabel || 'Reason'}</label>
                  <input className="form-input" value={confirmReason} onChange={e => setConfirmReason(e.target.value)} placeholder="Not physically present at meeting" autoFocus />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={confirm.needsReason && !confirmReason.trim()}
                onClick={async () => { const c2 = confirm; setConfirm(null); await c2.action(confirmReason.trim() || undefined); }}>
                <CheckCircle2 size={15} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ label: string; onClick: () => void; danger?: boolean }> = ({ label, onClick, danger }) => (
  <button onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'none', border: 'none', borderTop: '1px solid #F1F5F9', cursor: 'pointer', fontSize: '0.84rem', color: danger ? '#B91C1C' : '#0B203E' }}>
    {label}
  </button>
);

// ==========================================
// CREATE MEETING
// ==========================================
const CreateMeetingDialog: React.FC<{ currentUser: AuthUser; onClose: () => void; onCreated: (id: string) => void }> = ({ currentUser, onClose, onCreated }) => {
  const [f, setF] = useState({
    title: 'MOSA General Meeting', description: '', date: new Date().toISOString().slice(0, 10),
    startTime: '10:00', endTime: '13:00', venue: 'Mandela SS Main Hall', city: 'Hoima', country: 'Uganda',
    expectedAttendance: 150, maxAttendance: '', attendanceRequirement: 'MEMBERS_AND_GUESTS' as 'MEMBERS_ONLY' | 'MEMBERS_AND_GUESTS',
  });
  const [err, setErr] = useState('');
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const m = await governanceService.createMeeting({
        title: f.title.trim(), description: f.description.trim() || undefined, date: f.date, startTime: f.startTime, endTime: f.endTime,
        venue: f.venue.trim(), city: f.city.trim() || undefined, country: f.country.trim() || undefined,
        expectedAttendance: Number(f.expectedAttendance) || 0, maxAttendance: f.maxAttendance ? Number(f.maxAttendance) : undefined,
        attendanceRequirement: f.attendanceRequirement,
      }, currentUser);
      onCreated(m.id);
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem' }}>New Meeting</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {err && <div style={{ gridColumn: '1 / -1', color: '#B91C1C', fontSize: '0.85rem' }}>{err}</div>}
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label required">Meeting title</label><input className="form-input" required value={f.title} onChange={e => set('title', e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="form-input" rows={2} value={f.description} onChange={e => set('description', e.target.value)} /></div>
            <div><label className="form-label required">Date</label><input type="date" className="form-input" required value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}><label className="form-label">Start</label><input type="time" className="form-input" value={f.startTime} onChange={e => set('startTime', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label className="form-label">End</label><input type="time" className="form-input" value={f.endTime} onChange={e => set('endTime', e.target.value)} /></div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label required">Venue</label><input className="form-input" required value={f.venue} onChange={e => set('venue', e.target.value)} /></div>
            <div><label className="form-label">City</label><input className="form-input" value={f.city} onChange={e => set('city', e.target.value)} /></div>
            <div><label className="form-label">Country</label><input className="form-input" value={f.country} onChange={e => set('country', e.target.value)} /></div>
            <div><label className="form-label">Expected attendance</label><input type="number" min={0} className="form-input" value={f.expectedAttendance} onChange={e => set('expectedAttendance', e.target.value)} /></div>
            <div><label className="form-label">Maximum (optional)</label><input type="number" min={0} className="form-input" value={f.maxAttendance} onChange={e => set('maxAttendance', e.target.value)} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Attendance requirement</label>
              <select className="form-input" value={f.attendanceRequirement} onChange={e => set('attendanceRequirement', e.target.value)}>
                <option value="MEMBERS_AND_GUESTS">Members and invited guests</option>
                <option value="MEMBERS_ONLY">Members only</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Meeting</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// ADD ATTENDEE (registry search or guest)
// ==========================================
const AddAttendeeDialog: React.FC<{ meeting: Meeting; currentUser: AuthUser; onClose: () => void; onDone: (msg: string) => void }> = ({ meeting, currentUser, onClose, onDone }) => {
  const [mode, setMode] = useState<'REGISTRY' | 'GUEST'>('REGISTRY');
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [g, setG] = useState({ fullName: '', attendeeType: 'GUEST' as AttendeeType, organisation: '', position: '', phone: '', relationship: '' });
  const [createProfile, setCreateProfile] = useState(false);

  useEffect(() => { dataService.getAlumniList().then(setAlumni); }, []);

  const results = q.trim().length < 2 ? [] : alumni.filter(a =>
    `${a.firstName} ${a.middleName || ''} ${a.lastName} ${a.alumniNumber} ${a.nickname || ''}`.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8);

  const addMember = async (a: AlumniProfile) => {
    try { await governanceService.addRegistryMember(meeting.id, a, currentUser); onDone(`${a.firstName} ${a.lastName} added (Assisted).`); }
    catch (e: any) { setErr(e.message); }
  };

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await governanceService.addGuest(meeting.id, { ...g, organisation: g.organisation || undefined, position: g.position || undefined, phone: g.phone || undefined, relationship: g.relationship || undefined }, currentUser, createProfile);
      onDone(createProfile ? `${g.fullName} added and a registry profile was opened for verification.` : `${g.fullName} added to this meeting only.`);
    } catch (e2: any) { setErr(e2.message); }
  };

  const tab = (k: 'REGISTRY' | 'GUEST', label: string) => (
    <button type="button" onClick={() => { setMode(k); setErr(''); }} style={{ flex: 1, padding: '0.55rem', border: 'none', borderBottom: mode === k ? '2px solid #D97706' : '2px solid transparent', background: 'none', fontWeight: 600, color: mode === k ? '#0B203E' : '#64748B', cursor: 'pointer' }}>{label}</button>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem' }}>Add Attendee</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
          {tab('REGISTRY', 'Search Registry')}
          {tab('GUEST', 'Guest / Non-Alumnus')}
        </div>
        <div className="modal-body">
          {err && <div style={{ color: '#B91C1C', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{err}</div>}
          {mode === 'REGISTRY' ? (
            <>
              <input className="form-input" autoFocus placeholder="Type a name or MA number, e.g. MA. 0248" value={q} onChange={e => setQ(e.target.value)} />
              <div style={{ marginTop: '0.5rem', border: results.length ? '1px solid #E2E8F0' : 'none', borderRadius: '8px', overflow: 'hidden' }}>
                {results.map(a => (
                  <div key={a.internalId} style={rowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{a.alumniNumber} | {a.membershipStatus}</div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => addMember(a)}>Add</button>
                  </div>
                ))}
                {q.trim().length >= 2 && results.length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#64748B', padding: '0.75rem 0' }}>No registry match. Use "Guest / Non-Alumnus" to record this person.</p>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.75rem' }}>Recorded as Assisted attendance, added by you, with the current time.</p>
            </>
          ) : (
            <form id="guest-form" onSubmit={addGuest} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label required">Full name</label><input className="form-input" required value={g.fullName} onChange={e => setG({ ...g, fullName: e.target.value })} /></div>
              <div><label className="form-label">Category</label>
                <select className="form-input" value={g.attendeeType} onChange={e => setG({ ...g, attendeeType: e.target.value as AttendeeType })}>
                  <option value="GUEST">Guest</option><option value="NON_ALUMNUS">Non-Alumnus</option><option value="INVITED_OFFICIAL">Invited Official</option><option value="OTHER">Other</option>
                </select>
              </div>
              <div><label className="form-label">Phone (optional)</label><input className="form-input" value={g.phone} onChange={e => setG({ ...g, phone: e.target.value })} /></div>
              <div><label className="form-label">Organisation</label><input className="form-input" value={g.organisation} onChange={e => setG({ ...g, organisation: e.target.value })} /></div>
              <div><label className="form-label">Position</label><input className="form-input" value={g.position} onChange={e => setG({ ...g, position: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Reason / relationship</label><input className="form-input" placeholder="e.g. Invited by the Head Teacher" value={g.relationship} onChange={e => setG({ ...g, relationship: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', cursor: 'pointer', padding: '0.55rem', border: `1px solid ${!createProfile ? '#0B203E' : '#E2E8F0'}`, borderRadius: '8px' }}>
                  <input type="radio" checked={!createProfile} onChange={() => setCreateProfile(false)} />
                  <span><strong>Add to this meeting only</strong><br /><span style={{ color: '#64748B' }}>Creates an attendance record. The alumni registry is not changed.</span></span>
                </label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', cursor: 'pointer', padding: '0.55rem', border: `1px solid ${createProfile ? '#0B203E' : '#E2E8F0'}`, borderRadius: '8px' }}>
                  <input type="radio" checked={createProfile} onChange={() => setCreateProfile(true)} />
                  <span><strong>Create registry profile</strong><br /><span style={{ color: '#64748B' }}>Use only for a former MASSH student. Opens a pending application for verification.</span></span>
                </label>
              </div>
            </form>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {mode === 'GUEST' && <button type="submit" form="guest-form" className="btn btn-primary"><Users size={15} /> Add Attendee</button>}
        </div>
      </div>
    </div>
  );
};
