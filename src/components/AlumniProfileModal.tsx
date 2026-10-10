import React, { useState } from 'react';
import { AlumniProfile, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { 
  X, 
  Award, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle, 
  Calendar, 
  ShieldCheck, 
  Edit3, 
  Save, 
  ExternalLink,
  User
} from 'lucide-react';

interface Props {
  alumnus: AlumniProfile | null;
  onClose: () => void;
  currentUser: AuthUser | null;
  onProfileUpdated: () => void;
}

export const AlumniProfileModal: React.FC<Props> = ({ alumnus, onClose, currentUser, onProfileUpdated }) => {
  if (!alumnus) return null;

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isOwner = currentUser?.alumniId === alumnus.internalId || currentUser?.email.toLowerCase() === alumnus.email.toLowerCase();
  const canEdit = isOwner || isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editBio, setEditBio] = useState(alumnus.bio || '');
  const [editOccupation, setEditOccupation] = useState(alumnus.occupation || '');
  const [editOrganisation, setEditOrganisation] = useState(alumnus.organisation || '');
  const [editPosition, setEditPosition] = useState(alumnus.position || '');
  const [editCity, setEditCity] = useState(alumnus.city);
  const [editCountry, setEditCountry] = useState(alumnus.country);
  const [editLinkedIn, setEditLinkedIn] = useState(alumnus.linkedIn || '');
  
  // Privacy toggles
  const [showPhone, setShowPhone] = useState(alumnus.privacySettings.showPhone);
  const [showEmail, setShowEmail] = useState(alumnus.privacySettings.showEmail);
  const [showNickname, setShowNickname] = useState(alumnus.privacySettings.showNickname);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: Partial<AlumniProfile> = {
        bio: editBio,
        occupation: editOccupation,
        organisation: editOrganisation,
        position: editPosition,
        city: editCity,
        country: editCountry,
        linkedIn: editLinkedIn,
        privacySettings: {
          ...alumnus.privacySettings,
          showPhone,
          showEmail,
          showNickname,
        },
      };

      const res = await dataService.updateAlumniProfile(alumnus.internalId, updates, currentUser?.email);
      if (res.success) {
        setIsEditing(false);
        onProfileUpdated();
      } else {
        alert(res.error || 'Failed to update profile');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const priv = alumnus.privacySettings;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div className="modal-header" style={{ background: '#0B203E', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="alumni-no-pill large">
              <Award size={16} /> {alumnus.alumniNumber}
            </span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified MOSA Alumni Profile
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Alumnus Identity Card */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {alumnus.photoUrl ? (
              <img
                src={alumnus.photoUrl}
                alt={alumnus.firstName}
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D97706' }}
              />
            ) : (
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #D97706', color: '#0B203E' }}>
                <User size={40} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.6rem', color: '#0B203E' }}>
                  {alumnus.firstName} {alumnus.middleName ? `${alumnus.middleName} ` : ''}{alumnus.lastName}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#059669', fontSize: '0.8rem', fontWeight: 700, background: '#D1FAE5', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                  <CheckCircle size={14} /> Official Verified
                </span>
              </div>

              {/* NICKNAME AT SCHOOL - EXPLICIT LABEL */}
              {alumnus.nickname && (
                <div style={{ marginTop: '0.35rem' }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid #FDE68A' }}>
                    Nickname at School: "{alumnus.nickname}"
                  </span>
                </div>
              )}

              <div style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>Gender: <strong>{alumnus.gender}</strong></span>
                <span>Location: <strong>{alumnus.city}, {alumnus.country}</strong></span>
                <span>Status: <strong style={{ color: '#059669' }}>{alumnus.membershipStatus}</strong></span>
              </div>
            </div>

            {canEdit && !isEditing && (
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                <Edit3 size={15} /> Edit Profile
              </button>
            )}
          </div>

          {/* MASSH School History (O-Level & A-Level) */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', background: '#F8FAFC' }}>
            <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GraduationCap size={18} color="#D97706" /> MASSH School History (Hoima)
            </h4>

            <div className="grid-2">
              {/* O-Level Block */}
              <div style={{ padding: '0.85rem', background: alumnus.schoolHistory.attendedOLevel ? '#FFFFFF' : '#F1F5F9', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: alumnus.schoolHistory.attendedOLevel ? '#065F46' : '#94A3B8', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Ordinary Level (O-Level)
                </div>
                {alumnus.schoolHistory.attendedOLevel && alumnus.schoolHistory.oLevel ? (
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>Years: <strong>{alumnus.schoolHistory.oLevel.yearJoined} – {alumnus.schoolHistory.oLevel.yearCompleted}</strong></div>
                    <div>Campus: <strong>{alumnus.schoolHistory.oLevel.campus}</strong></div>
                    <div>Class & Stream: <strong>{alumnus.schoolHistory.oLevel.class} ({alumnus.schoolHistory.oLevel.stream})</strong></div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Did not attend O-Level at MASSH</div>
                )}
              </div>

              {/* A-Level Block */}
              <div style={{ padding: '0.85rem', background: alumnus.schoolHistory.attendedALevel ? '#FFFFFF' : '#F1F5F9', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: alumnus.schoolHistory.attendedALevel ? '#1E40AF' : '#94A3B8', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  Advanced Level (A-Level)
                </div>
                {alumnus.schoolHistory.attendedALevel && alumnus.schoolHistory.aLevel ? (
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>Years: <strong>{alumnus.schoolHistory.aLevel.yearJoined} – {alumnus.schoolHistory.aLevel.yearCompleted}</strong></div>
                    <div>Campus: <strong>{alumnus.schoolHistory.aLevel.campus}</strong></div>
                    <div>Combination: <strong>{alumnus.schoolHistory.aLevel.combination}</strong></div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Did not attend A-Level at MASSH</div>
                )}
              </div>
            </div>
          </div>

          {/* Current Profession & Bio */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Briefcase size={18} color="#0B203E" /> Current Profession & Background
            </h4>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Occupation</label>
                    <input
                      type="text"
                      value={editOccupation}
                      onChange={e => setEditOccupation(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organisation / Employer</label>
                    <input
                      type="text"
                      value={editOrganisation}
                      onChange={e => setEditOrganisation(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      value={editCountry}
                      onChange={e => setEditCountry(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Professional Biography</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                {/* Privacy toggles for owner */}
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Directory Privacy Settings
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} />
                      <span>Show Phone Publicly</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input type="checkbox" checked={showEmail} onChange={e => setShowEmail(e.target.checked)} />
                      <span>Show Email Publicly</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input type="checkbox" checked={showNickname} onChange={e => setShowNickname(e.target.checked)} />
                      <span>Show Nickname</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid-2" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Occupation:</span>
                    <div style={{ fontWeight: 600 }}>{alumnus.occupation || 'Not specified'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Organisation:</span>
                    <div style={{ fontWeight: 600 }}>{alumnus.organisation || 'Not specified'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Higher Education:</span>
                    <div style={{ fontWeight: 600 }}>{alumnus.currentInstitution ? `${alumnus.programme || ''} (${alumnus.currentInstitution})` : 'Not specified'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Highest Qualification:</span>
                    <div style={{ fontWeight: 600 }}>{alumnus.highestQualification || 'UACE / UCE'}</div>
                  </div>
                </div>

                {alumnus.bio && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.875rem', color: '#475569', fontStyle: 'italic', lineHeight: '1.6' }}>
                    "{alumnus.bio}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details & Privacy Status */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={18} color="#0B203E" /> Contact Information
            </h4>

            <div className="grid-2" style={{ fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Phone:</span>
                <div style={{ fontWeight: 600 }}>
                  {priv.showPhone || canEdit ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} color="#059669" /> {alumnus.phone}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Lock size={13} /> Private (Visible to Admins only)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748B' }}>Email:</span>
                <div style={{ fontWeight: 600 }}>
                  {priv.showEmail || canEdit ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={14} color="#059669" /> {alumnus.email}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Lock size={13} /> Private (Visible to Admins only)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Audit Stamp */}
          <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Verified on {new Date(alumnus.verifiedAt).toLocaleDateString()} by <code>{alumnus.verifiedBy}</code></span>
            <span>Permanent ID: <code>{alumnus.internalId}</code></span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
