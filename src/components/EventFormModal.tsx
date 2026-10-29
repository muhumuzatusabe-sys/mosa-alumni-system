import React, { useState, useEffect } from 'react';
import { MOSAEvent, EventType, EventRegistrationRequirement } from '../types';
import { dataService } from '../services/dataService';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: MOSAEvent | null;
  adminEmail: string;
  onSuccess: () => void;
}

export const EventFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventToEdit,
  adminEmail,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('ANNUAL_CONVENTION');
  const [date, setDate] = useState('2026-12-20');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('20:00');
  const [venue, setVenue] = useState('Main Campus Hall, MASSH Hoima');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-12-18');
  const [registrationRequirement, setRegistrationRequirement] = useState<EventRegistrationRequirement>('REGISTRATION_REQUIRED');
  const [eventImage, setEventImage] = useState('');
  const [status, setStatus] = useState<'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description);
      setEventType(eventToEdit.eventType);
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setVenue(eventToEdit.venue);
      setRegistrationDeadline(eventToEdit.registrationDeadline || '');
      setRegistrationRequirement(eventToEdit.registrationRequirement);
      setEventImage(eventToEdit.eventImage || '');
      setStatus(eventToEdit.status);
    } else {
      setTitle('');
      setDescription('');
      setEventType('ANNUAL_CONVENTION');
      setDate('2026-12-20');
      setStartTime('14:00');
      setEndTime('20:00');
      setVenue('Main Campus Hall, MASSH Hoima');
      setRegistrationDeadline('2026-12-18');
      setRegistrationRequirement('REGISTRATION_REQUIRED');
      setEventImage('');
      setStatus('UPCOMING');
    }
    setErrorMsg('');
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !venue.trim()) {
      setErrorMsg('Event title, date, and venue are mandatory.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (eventToEdit) {
        const res = await dataService.updateEvent(
          eventToEdit.id,
          {
            title: title.trim(),
            description: description.trim(),
            eventType,
            date,
            startTime,
            endTime,
            venue: venue.trim(),
            registrationDeadline: registrationDeadline || undefined,
            registrationRequirement,
            eventImage: eventImage.trim() || undefined,
            status,
          },
          adminEmail
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to update event');
        }
      } else {
        const res = await dataService.createEvent(
          {
            title: title.trim(),
            description: description.trim(),
            eventType,
            date,
            startTime,
            endTime,
            venue: venue.trim(),
            registrationDeadline: registrationDeadline || undefined,
            registrationRequirement,
            eventImage: eventImage.trim() || undefined,
            status,
            createdBy: adminEmail,
          },
          adminEmail
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to create event');
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
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar color="#D97706" size={22} />
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E' }}>
                {eventToEdit ? 'Edit Event Details' : 'Organize New MOSA Event'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Mandela Secondary School Hoima Alumni Association
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

            <div className="form-group">
              <label className="form-label required">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. MASSH Annual Alumni Convention & Dinner"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Event Type</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as EventType)}
                  className="form-select"
                >
                  <option value="ANNUAL_CONVENTION">Annual Alumni Convention</option>
                  <option value="REUNION">Cohort Reunion</option>
                  <option value="GENERAL_MEETING">General Meeting (AGM)</option>
                  <option value="FUNDRAISING">Fundraising Event</option>
                  <option value="CAREER">Career & Mentorship Day</option>
                  <option value="CHAPTER_EVENT">University Chapter Event</option>
                  <option value="OTHER">Other Gathering</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="form-select"
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label required">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Campus Grounds, MASSH Hoima"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Requirement</label>
                <select
                  value={registrationRequirement}
                  onChange={e => setRegistrationRequirement(e.target.value as any)}
                  className="form-select"
                >
                  <option value="REGISTRATION_REQUIRED">Registration Required (QR Check-In)</option>
                  <option value="OPEN">Open Entry (No Prior RSVP)</option>
                  <option value="INVITE_ONLY">Invite Only</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Registration Deadline</label>
                <input
                  type="date"
                  value={registrationDeadline}
                  onChange={e => setRegistrationDeadline(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <ImageUploader
                  value={eventImage}
                  onChange={setEventImage}
                  label="Event Banner Image (Direct Upload or Link)"
                  helpText="Upload a banner directly from your device, or paste a banner image URL."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Agenda</label>
              <textarea
                rows={3}
                placeholder="Details about speeches, dinner dress code, project fundraisers, or chapter networking..."
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
              <Save size={16} /> {loading ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
