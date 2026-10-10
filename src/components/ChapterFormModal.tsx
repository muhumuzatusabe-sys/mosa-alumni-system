import React, { useState, useEffect } from 'react';
import { Chapter } from '../types';
import { dataService } from '../services/dataService';
import { X, Landmark, Save, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapterToEdit: Chapter | null;
  adminEmail: string;
  onSuccess: () => void;
}

export const ChapterFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chapterToEdit,
  adminEmail,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('Kampala');
  const [country, setCountry] = useState('Uganda');
  const [description, setDescription] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderContact, setLeaderContact] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (chapterToEdit) {
      setName(chapterToEdit.name);
      setCode(chapterToEdit.code);
      setInstitution(chapterToEdit.institution);
      setLocation(chapterToEdit.location);
      setCountry(chapterToEdit.country);
      setDescription(chapterToEdit.description);
      setLeaderName(chapterToEdit.leaderName || '');
      setLeaderContact(chapterToEdit.leaderContact || '');
      setStatus(chapterToEdit.status);
    } else {
      setName('');
      setCode('');
      setInstitution('');
      setLocation('Kampala');
      setCountry('Uganda');
      setDescription('');
      setLeaderName('');
      setLeaderContact('');
      setStatus('ACTIVE');
    }
    setErrorMsg('');
  }, [chapterToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !institution.trim()) {
      setErrorMsg('Chapter name, acronym code, and institution are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (chapterToEdit) {
        const res = await dataService.updateChapter(
          chapterToEdit.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            institution: institution.trim(),
            location: location.trim(),
            country: country.trim(),
            description: description.trim(),
            leaderName: leaderName.trim() || undefined,
            leaderContact: leaderContact.trim() || undefined,
            status,
          },
          adminEmail
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to update chapter');
        }
      } else {
        const res = await dataService.createChapter(
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            institution: institution.trim(),
            location: location.trim(),
            country: country.trim(),
            description: description.trim(),
            leaderName: leaderName.trim() || undefined,
            leaderContact: leaderContact.trim() || undefined,
            status,
            adminEmails: [adminEmail],
          },
          adminEmail
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to create chapter');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Landmark color="#D97706" size={22} />
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E' }}>
                {chapterToEdit ? 'Edit Chapter Details' : 'Create New MOSA Chapter'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                University or Institutional Chapter for Mandela Secondary School Hoima Alumni
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Chapter Acronym / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MUMASA, KYUMASA"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="form-select"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Full Chapter Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Makerere University Mandela Old Students Association"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Affiliated Institution</label>
              <input
                type="text"
                required
                placeholder="e.g. Makerere University, MUST, Kyambogo University"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">City / Campus Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kampala, Mbarara, Gulu"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Chapter Coordinator / President</label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Zatusave"
                  value={leaderName}
                  onChange={e => setLeaderName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coordinator Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+256 701 234567"
                  value={leaderContact}
                  onChange={e => setLeaderContact(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Chapter Description & Mission</label>
              <textarea
                rows={3}
                placeholder="Describe the chapter focus, meeting schedules, or target student body..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="form-textarea"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              <Save size={16} /> {loading ? 'Saving Chapter...' : chapterToEdit ? 'Save Changes' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
