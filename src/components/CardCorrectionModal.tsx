import React, { useState } from 'react';
import { AlumniProfile, CardFieldKey } from '../types';
import { membershipCardService } from '../services/membershipCardService';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  alumnus: AlumniProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const CardCorrectionModal: React.FC<Props> = ({
  alumnus,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [selectedFields, setSelectedFields] = useState<Record<CardFieldKey, boolean>>({
    surname: false,
    givenName: false,
    nationality: false,
    sex: false,
    entryYear: false,
    departureYear: false,
    photo: false,
  });

  const [requestedValues, setRequestedValues] = useState<Record<CardFieldKey, string>>({
    surname: alumnus.lastName || '',
    givenName: [alumnus.firstName, alumnus.middleName].filter(Boolean).join(' '),
    nationality: alumnus.nationality || alumnus.country || 'Ugandan',
    sex: alumnus.gender || 'Male',
    entryYear: (alumnus.schoolHistory?.oLevel?.yearJoined || alumnus.schoolHistory?.aLevel?.yearJoined || 2012).toString(),
    departureYear: (alumnus.schoolHistory?.aLevel?.yearCompleted || alumnus.schoolHistory?.oLevel?.yearCompleted || 2014).toString(),
    photo: '',
  });

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentValues: Record<CardFieldKey, string> = {
    surname: alumnus.lastName || '',
    givenName: [alumnus.firstName, alumnus.middleName].filter(Boolean).join(' '),
    nationality: alumnus.nationality || alumnus.country || 'Ugandan',
    sex: alumnus.gender || 'Male',
    entryYear: (alumnus.schoolHistory?.oLevel?.yearJoined || alumnus.schoolHistory?.aLevel?.yearJoined || 2012).toString(),
    departureYear: (alumnus.schoolHistory?.aLevel?.yearCompleted || alumnus.schoolHistory?.oLevel?.yearCompleted || 2014).toString(),
    photo: alumnus.photoUrl ? 'Current registered photograph' : 'No photo uploaded',
  };

  const fieldLabels: Record<CardFieldKey, string> = {
    surname: 'Surname',
    givenName: 'Given Name(s)',
    nationality: 'Nationality',
    sex: 'Sex / Gender',
    entryYear: 'School Entry Year',
    departureYear: 'School Departure Year',
    photo: 'Passport Photograph',
  };

  const handleToggle = (field: CardFieldKey) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const active = (Object.keys(selectedFields) as CardFieldKey[]).filter(k => selectedFields[k]);
    if (active.length === 0) {
      alert('Please check at least one field requiring correction.');
      return;
    }

    setSubmitting(true);
    try {
      const fieldsPayload = active.map(k => ({
        field: k,
        currentValue: currentValues[k],
        requestedValue: requestedValues[k],
      }));

      await membershipCardService.submitCorrectionRequest({
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        alumniName: alumnus.fullName || `${alumnus.firstName} ${alumnus.lastName}`,
        fields: fieldsPayload,
        note: note.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSubmitted) onSubmitted();
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 21, 43, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        maxWidth: '540px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            <AlertCircle size={13} /> OFFICIAL REGISTRY CORRECTION
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.3rem 0' }}>
            Request Membership Card Correction
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
            To safeguard registry integrity, members cannot directly alter their official card numbers or status. Select the fields that need correction and submit to the Secretariat for review.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ color: '#0B203E', marginBottom: '0.5rem' }}>Correction Request Submitted</h3>
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>
              Your request has been forwarded to the Secretariat. You will receive a notification upon review and reissuance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(Object.keys(fieldLabels) as CardFieldKey[]).map(field => {
                const isSelected = selectedFields[field];
                return (
                  <div
                    key={field}
                    style={{
                      border: isSelected ? '1.5px solid #0B203E' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      background: isSelected ? '#F8FAFC' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(field)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <span>{fieldLabels[field]}</span>
                      </label>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Current: <strong>{currentValues[field]}</strong>
                      </span>
                    </div>

                    {isSelected && (
                      <div style={{ marginTop: '0.5rem', paddingLeft: '1.6rem' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#475569', fontWeight: 600, marginBottom: '0.25rem' }}>
                          Requested Correct Value:
                        </label>
                        <input
                          type="text"
                          value={requestedValues[field]}
                          onChange={e => setRequestedValues(prev => ({ ...prev, [field]: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Additional Notes / Proof Explanation:
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Briefly explain the reason for correction (e.g. spelling error as per national ID, wrong completion year, updated legal name)..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0B203E' }}
              >
                <Send size={14} />
                {submitting ? 'Submitting...' : 'Submit Correction Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default CardCorrectionModal;
