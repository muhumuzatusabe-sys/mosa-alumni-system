import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  Calendar, 
  Clock, 
  UserX,
  Lock,
  Layers,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { 
  AuthUser, 
  LeadershipOffice, 
  OfficeCategory, 
  PermissionModule, 
  PermissionAction,
  AlumniProfile 
} from '../types';
import { dataService } from '../services/dataService';

interface LeadershipOfficesManagerProps {
  currentUser: AuthUser;
  onRefreshData?: () => void;
}

const ALL_MODULES: Array<{ key: PermissionModule; label: string; desc: string }> = [
  { key: 'REGISTRY', label: 'Alumni Registry', desc: 'Member records, directory, applications' },
  { key: 'VERIFICATION', label: 'Alumni Verification', desc: 'Review applications and approve credentials' },
  { key: 'NUMBERS', label: 'Membership Numbers', desc: 'Manage MA numbers and uniqueness sequence' },
  { key: 'LEADERSHIP', label: 'Leadership & Offices', desc: 'Office assignments and appointments' },
  { key: 'PERMISSIONS', label: 'Roles & Permissions', desc: 'Granular permissions matrix' },
  { key: 'WELCOME_PAGE', label: 'Welcome Page Content', desc: 'Public website hero text, slogan, imagery' },
  { key: 'FINANCE', label: 'Treasury & Finances', desc: 'Contributions, donations, verified receipts' },
  { key: 'ATTENDANCE', label: 'Meeting Attendance', desc: 'Assemblies, roll calls, QR check-ins' },
  { key: 'EVENTS', label: 'Events & Reunions', desc: 'Conventions, reunions, ticketing, agendas' },
  { key: 'COMMUNICATIONS', label: 'Communications & Heritage', desc: 'Announcements, circulars, campus gallery' },
  { key: 'CHAPTERS', label: 'Chapters Hub', desc: 'Regional and university chapter coordination' },
  { key: 'DOCUMENTS', label: 'Official Documents', desc: 'Constitution, resolutions, archives' },
  { key: 'EXPORTS', label: 'Member Data Exports', desc: 'Download CSV, Excel, and PDF reports' },
  { key: 'OPPORTUNITIES', label: 'Opportunities & Mentorship', desc: 'Jobs, internships, scholarships' },
  { key: 'ELECTIONS', label: 'Elections & Voting', desc: 'Electoral commission, ballot tallies' },
  { key: 'AUDIT', label: 'Audit Trail', desc: 'Administrative action logs' },
  { key: 'SETTINGS', label: 'System Settings', desc: 'Module toggles and configuration' },
];

const ALL_ACTIONS: Array<{ key: PermissionAction; label: string }> = [
  { key: 'VIEW', label: 'View' },
  { key: 'ADD', label: 'Create' },
  { key: 'EDIT', label: 'Edit' },
  { key: 'APPROVE', label: 'Approve' },
  { key: 'EXPORT', label: 'Export' },
  { key: 'DELETE', label: 'Delete' },
  { key: 'MANAGE', label: 'Manage Settings' },
];

export const LeadershipOfficesManager: React.FC<LeadershipOfficesManagerProps> = ({
  currentUser,
  onRefreshData,
}) => {
  const [offices, setOffices] = useState<LeadershipOffice[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Office Create/Edit Modal
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Partial<LeadershipOffice> | null>(null);

  // Assign Leader Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetOffice, setTargetOffice] = useState<LeadershipOffice | null>(null);
  const [selectedAlumniNumber, setSelectedAlumniNumber] = useState('');
  const [appointmentStartDate, setAppointmentStartDate] = useState('');
  const [appointmentEndDate, setAppointmentEndDate] = useState('');
  const [alumniSearchTerm, setAlumniSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [officesList, allAlumni] = await Promise.all([
        dataService.getLeadershipOffices(),
        dataService.getAlumniList(),
      ]);
      setOffices(officesList);
      setAlumniList(allAlumni);
    } catch (err: any) {
      setErrorMsg('Failed to load leadership offices data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateOffice = () => {
    setEditingOffice({
      title: '',
      description: '',
      category: 'EXECUTIVE',
      modules: ['REGISTRY'],
      granularPermissions: { REGISTRY: ['VIEW'] },
      status: 'VACANT',
    });
    setIsOfficeModalOpen(true);
  };

  const handleOpenEditOffice = (office: LeadershipOffice) => {
    setEditingOffice({ ...office });
    setIsOfficeModalOpen(true);
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice || !editingOffice.title?.trim()) {
      setErrorMsg('Office title is required.');
      return;
    }

    try {
      const res = await dataService.saveLeadershipOffice(editingOffice, currentUser);
      if (res.success) {
        setSuccessMsg(`Leadership office "${res.office.title}" saved successfully.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setIsOfficeModalOpen(false);
        loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save office.');
    }
  };

  const handleDeleteOffice = async (officeId: string, title: string) => {
    if (!window.confirm(`Delete the leadership office "${title}"? Any assigned leader will lose associated permissions.`)) return;
    try {
      const res = await dataService.deleteLeadershipOffice(officeId, currentUser);
      if (res.success) {
        setSuccessMsg(`Leadership office "${title}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete office.');
    }
  };

  const handleOpenAssign = (office: LeadershipOffice) => {
    setTargetOffice(office);
    setSelectedAlumniNumber(office.assignedAlumniNumber || '');
    setAppointmentStartDate(office.appointmentStartDate || new Date().toISOString().split('T')[0]);
    setAppointmentEndDate(office.appointmentEndDate || '');
    setAlumniSearchTerm('');
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOffice) return;
    if (!selectedAlumniNumber) {
      setErrorMsg('Please select a verified alumnus to assign.');
      return;
    }

    try {
      const res = await dataService.assignAlumnusToOffice({
        officeId: targetOffice.id,
        alumniNumber: selectedAlumniNumber,
        startDate: appointmentStartDate,
        endDate: appointmentEndDate,
      }, currentUser);

      if (res.success) {
        setSuccessMsg(`Office "${targetOffice.title}" successfully assigned to ${res.office?.assignedAlumniName}. Delegated permissions are now active.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setIsAssignModalOpen(false);
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMsg(res.error || 'Failed to assign office.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign office.');
    }
  };

  const handleRevokeAssignment = async (officeId: string, title: string) => {
    if (!window.confirm(`Revoke appointment for "${title}"? The member's administrative permissions will be revoked immediately.`)) return;
    try {
      const res = await dataService.revokeOfficeAppointment(officeId, currentUser);
      if (res.success) {
        setSuccessMsg(`Appointment revoked for "${title}". Permissions revoked.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        loadData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to revoke appointment.');
    }
  };

  // Toggle module in office editor
  const toggleModule = (modKey: PermissionModule) => {
    if (!editingOffice) return;
    const currentMods = editingOffice.modules || [];
    const hasMod = currentMods.includes(modKey);
    const newMods = hasMod ? currentMods.filter(m => m !== modKey) : [...currentMods, modKey];
    
    const currentGranular = { ...(editingOffice.granularPermissions || {}) };
    if (!hasMod) {
      currentGranular[modKey] = ['VIEW'];
    } else {
      delete currentGranular[modKey];
    }

    setEditingOffice({
      ...editingOffice,
      modules: newMods,
      granularPermissions: currentGranular,
    });
  };

  // Toggle action within module in office editor
  const toggleAction = (modKey: PermissionModule, actKey: PermissionAction) => {
    if (!editingOffice) return;
    const currentGranular = { ...(editingOffice.granularPermissions || {}) };
    const currentActions = currentGranular[modKey] || [];
    const hasAct = currentActions.includes(actKey);
    const newActions = hasAct ? currentActions.filter(a => a !== actKey) : [...currentActions, actKey];

    currentGranular[modKey] = newActions;
    setEditingOffice({
      ...editingOffice,
      granularPermissions: currentGranular,
    });
  };

  // Filter verified alumni eligible for appointment (Section 7)
  const eligibleAlumni = alumniList.filter(a => {
    const isVerified = a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED' || !!a.verifiedAt;
    const hasNumber = !!a.alumniNumber && a.alumniNumber.startsWith('MA.');
    if (!isVerified || !hasNumber) return false;
    if (!alumniSearchTerm.trim()) return true;
    const q = alumniSearchTerm.toLowerCase();
    return (
      (a.fullName || `${a.firstName} ${a.lastName}`).toLowerCase().includes(q) ||
      a.alumniNumber.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', color: '#FFFFFF' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: 800 }}>
            Governance & Delegated Authority
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.2rem 0' }}>
            Leadership Offices & Permissions
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
            Establish leadership portfolios, assign verified alumni, and grant scoped granular permissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateOffice}
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#05160F',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Plus size={16} />
          <span>Create Leadership Office</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: 'rgba(5, 150, 105, 0.2)', border: '1px solid rgba(16, 185, 129, 0.45)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#6EE7B7', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} color="#34D399" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} color="#F87171" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Offices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {offices.map((office) => {
          const isAssigned = office.status === 'ACTIVE' && !!office.assignedAlumniName;

          return (
            <div
              key={office.id}
              style={{
                background: 'rgba(10, 39, 27, 0.7)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {office.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        background: office.category === 'EXECUTIVE' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(5, 150, 105, 0.2)',
                        color: office.category === 'EXECUTIVE' ? '#FDA4AF' : '#6EE7B7',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      {office.category}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        background: isAssigned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        color: isAssigned ? '#34D399' : '#CBD5E1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {isAssigned ? 'Active Appointment' : 'Vacant'}
                    </span>
                  </div>

                  <p style={{ color: '#CBD5E1', fontSize: '0.86rem', margin: '0.35rem 0 0 0', maxWidth: '650px' }}>
                    {office.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenEditOffice(office)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Office & Permissions</span>
                  </button>

                  <button
                    onClick={() => handleDeleteOffice(office.id, office.title)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#FCA5A5',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Assignment Information Card */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '0.85rem 1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {isAssigned ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        border: '1.5px solid #34D399',
                      }}
                    >
                      <UserCheck size={20} color="#FFFFFF" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {office.assignedAlumniName}
                        <span style={{ marginLeft: '0.6rem', color: '#FCD34D', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700 }}>
                          {office.assignedAlumniNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        Email: {office.assignedEmail} | Tenure: {office.appointmentStartDate || 'Current'} to {office.appointmentEndDate || 'Indefinite'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Clock size={15} />
                    <span>No verified leader currently assigned to this office portfolio.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenAssign(office)}
                    style={{
                      background: 'rgba(217, 119, 6, 0.25)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#FDE68A',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <UserCheck size={14} />
                    <span>{isAssigned ? 'Reassign Leader' : 'Assign Verified Alumnus'}</span>
                  </button>

                  {isAssigned && (
                    <button
                      onClick={() => handleRevokeAssignment(office.id, office.title)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#FCA5A5',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <UserX size={14} />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Granted Permissions Badges */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                  Authorized Modules & Granular Actions:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(office.modules || []).map(modKey => {
                    const actions = office.granularPermissions?.[modKey] || ['VIEW'];
                    return (
                      <span
                        key={modKey}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          color: '#E2E8F0',
                        }}
                      >
                        <strong style={{ color: '#FCD34D' }}>{modKey}</strong> ({actions.join(', ')})
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CREATE OR EDIT LEADERSHIP OFFICE                       */}
      {/* ============================================================== */}
      {isOfficeModalOpen && editingOffice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0A271B',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                {editingOffice.id ? 'Edit Leadership Office & Permissions' : 'Create New Leadership Office'}
              </h3>
              <button
                onClick={() => setIsOfficeModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOffice} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                    Office Title
                  </label>
                  <input
                    type="text"
                    value={editingOffice.title || ''}
                    onChange={(e) => setEditingOffice({ ...editingOffice, title: e.target.value })}
                    placeholder="e.g. Publicity & Communications Secretary"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={editingOffice.category || 'EXECUTIVE'}
                    onChange={(e) => setEditingOffice({ ...editingOffice, category: e.target.value as OfficeCategory })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="EXECUTIVE" style={{ background: '#0A271B' }}>Executive</option>
                    <option value="SECRETARIAT" style={{ background: '#0A271B' }}>Secretariat</option>
                    <option value="COMMITTEE" style={{ background: '#0A271B' }}>Standing Committee</option>
                    <option value="REGIONAL" style={{ background: '#0A271B' }}>Regional Chapter</option>
                    <option value="SPECIAL" style={{ background: '#0A271B' }}>Special Assignment</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                  Office Description & Scope of Responsibility
                </label>
                <textarea
                  value={editingOffice.description || ''}
                  onChange={(e) => setEditingOffice({ ...editingOffice, description: e.target.value })}
                  rows={2}
                  placeholder="Outline responsibilities and institutional duties..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '6px',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Granular Permissions Builder */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#FCD34D', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Delegated Administrative Modules & Actions
                </label>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '1rem', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ALL_MODULES.map((mod) => {
                    const isSelected = (editingOffice.modules || []).includes(mod.key);
                    const actions = editingOffice.granularPermissions?.[mod.key] || [];

                    return (
                      <div
                        key={mod.key}
                        style={{
                          background: isSelected ? 'rgba(5, 150, 105, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleModule(mod.key)}
                              style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                            />
                            <span>{mod.label}</span>
                          </label>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{mod.desc}</span>
                        </div>

                        {isSelected && (
                          <div style={{ marginTop: '0.5rem', paddingLeft: '1.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {ALL_ACTIONS.map(act => {
                              const hasAct = actions.includes(act.key);
                              return (
                                <button
                                  type="button"
                                  key={act.key}
                                  onClick={() => toggleAction(mod.key, act.key)}
                                  style={{
                                    background: hasAct ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                    border: hasAct ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                                    color: hasAct ? '#34D399' : '#94A3B8',
                                    borderRadius: '4px',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {act.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOfficeModalOpen(false)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'transparent', color: '#CBD5E1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.35rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Office
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ASSIGN VERIFIED ALUMNUS TO OFFICE                     */}
      {/* ============================================================== */}
      {isAssignModalOpen && targetOffice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0A271B',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
                  Appointment Workflow
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Assign Leader: {targetOffice.title}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Eligibility Notice (Section 7) */}
              <div style={{ background: 'rgba(5, 150, 105, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#D1FAE5' }}>
                <strong style={{ color: '#FFFFFF' }}>Eligibility Rule:</strong> Only authenticated alumni with completed registration, verified status, and an assigned MA number can be appointed to leadership offices.
              </div>

              {/* Search verified alumni */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                  Search Verified Alumni
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={alumniSearchTerm}
                    onChange={(e) => setAlumniSearchTerm(e.target.value)}
                    placeholder="Search by name, MA number (e.g. MA. 0001), or email..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem 0.65rem 2.2rem',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Verified Alumni Options */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                  Select Verified Alumnus ({eligibleAlumni.length} eligible)
                </label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {eligibleAlumni.map(a => {
                    const isSelected = selectedAlumniNumber === a.alumniNumber;
                    return (
                      <div
                        key={a.internalId}
                        onClick={() => setSelectedAlumniNumber(a.alumniNumber)}
                        style={{
                          background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #F59E0B' : '1px solid transparent',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.86rem' }}>
                            {a.fullName || `${a.firstName} ${a.lastName}`}
                          </span>
                          <span style={{ marginLeft: '0.5rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                            {a.email}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FCD34D', fontSize: '0.8rem' }}>
                          {a.alumniNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effective Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                    Appointment Effective Date
                  </label>
                  <input
                    type="date"
                    value={appointmentStartDate}
                    onChange={(e) => setAppointmentStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                    Tenure End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={appointmentEndDate}
                    onChange={(e) => setAppointmentEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '6px',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'transparent', color: '#CBD5E1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.35rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#05160F', fontWeight: 800, cursor: 'pointer' }}
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
