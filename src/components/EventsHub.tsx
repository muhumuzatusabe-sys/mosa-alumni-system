import React, { useState, useEffect } from 'react';
import { MOSAEvent, EventType, EventStatus, AuthUser, AlumniProfile } from '../types';
import { dataService } from '../services/dataService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Award, 
  QrCode, 
  CheckCircle2, 
  Edit3, 
  ArrowRight,
  Ticket,
  ArrowLeft
} from 'lucide-react';
import { EventFormModal } from './EventFormModal';
import { EventDetailsModal } from './EventDetailsModal';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const EventsHub: React.FC<Props> = ({ currentUser, onOpenAuth, onBack }) => {
  const [events, setEvents] = useState<MOSAEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<MOSAEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MOSAEvent | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await dataService.getEvents(
        selectedStatus,
        selectedType === 'ALL' ? undefined : (selectedType as EventType)
      );
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedType, selectedStatus]);

  const filteredEvents = events.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchVenue = e.venue.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner (Conforms to Section 12) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
          borderRadius: '20px',
          padding: '2.25rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(11, 32, 62, 0.2)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
        }}
      >
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #D97706', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: '#FCD34D', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Calendar size={14} /> Official MOSA Events & Conventions
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '2rem', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
            Alumni Events & Attendance System
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Connect at the Annual Alumni Convention, cohort reunions, career mentorship sessions, and university chapter gatherings. Register for digital passes and check in seamlessly via QR code.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isAdmin && (
              <button
                className="btn btn-gold"
                onClick={() => {
                  setEventToEdit(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus size={16} /> Publish New Event
              </button>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
              <span>Upcoming Scheduled Events: <strong>{events.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mosa-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Filter Types */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'ANNUAL_CONVENTION', label: 'Convention' },
              { id: 'REUNION', label: 'Reunions' },
              { id: 'MENTORSHIP', label: 'Mentorship' },
              { id: 'GENERAL_MEETING', label: 'AGM' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedType === tab.id ? '1px solid #0B203E' : '1px solid #CBD5E1',
                  background: selectedType === tab.id ? '#0B203E' : '#FFFFFF',
                  color: selectedType === tab.id ? '#FFFFFF' : '#475569',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search event title or venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                width: '260px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Loading events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Calendar size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            {events.length === 0 ? 'No events have been added yet' : 'No Events Found'}
          </h3>
          <p style={{ color: '#64748B', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            {events.length === 0 
              ? 'There are no active or scheduled MOSA alumni events at this time.' 
              : 'No events match your current filter criteria. Try resetting your search filter.'}
          </p>
          {isAdmin ? (
            <button 
              className="btn btn-primary" 
              onClick={() => { setEventToEdit(null); setIsFormOpen(true); }}
            >
              <Plus size={16} /> Create First Event
            </button>
          ) : events.length > 0 ? (
            <button className="btn btn-secondary" onClick={() => setSelectedType('ALL')}>
              View All Events
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredEvents.map(evt => (
            <div
              key={evt.id}
              className="mosa-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              <div>
                {/* Event Image Banner */}
                {evt.eventImage && (
                  <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={evt.eventImage}
                      alt={evt.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '4px', background: '#0B203E', color: '#FCD34D', textTransform: 'uppercase' }}>
                        {evt.eventType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ padding: '1.25rem' }}>
                  {!evt.eventImage && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', textTransform: 'uppercase' }}>
                        {evt.eventType.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  <h3 style={{ fontSize: '1.2rem', color: '#0B203E', marginBottom: '0.75rem', lineHeight: '1.3' }}>
                    {evt.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: '#475569', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#D97706" />
                      <strong>{new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span>{evt.startTime} — {evt.endTime}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="#64748B" />
                      <span>{evt.venue}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {evt.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Users size={14} />
                  <span>{evt.registeredCount} Registered</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {isAdmin && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setEventToEdit(evt);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                  )}

                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setSelectedEvent(evt)}
                  >
                    View Details & Pass <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      <EventFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eventToEdit={eventToEdit}
        adminEmail={currentUser?.email || 'admin@massh.ac.ug'}
        onSuccess={loadEvents}
      />

      {/* EVENT DETAILS & ATTENDANCE DESK MODAL */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        currentUser={currentUser}
        onEventUpdated={loadEvents}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
