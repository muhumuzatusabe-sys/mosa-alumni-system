import React, { useState, useEffect } from 'react';
import { AlumniProfile, AuthUser, DirectoryContent } from '../types';
import { dataService } from '../services/dataService';
import { 
  Search, 
  Filter, 
  Award, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle,
  ExternalLink,
  ChevronRight,
  User,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { CampusHeritageGallery } from './CampusHeritageGallery';

interface Props {
  currentUser: AuthUser | null;
  onSelectAlumni: (alumnus: AlumniProfile) => void;
  onOpenRegister: () => void;
  onBack?: () => void;
}

export const AlumniDirectory: React.FC<Props> = ({ currentUser, onSelectAlumni, onOpenRegister, onBack }) => {
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [directoryContent, setDirectoryContent] = useState<DirectoryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'O_LEVEL' | 'A_LEVEL' | 'BOTH'>('ALL');
  const [yearFilter, setYearFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const loadAlumni = async () => {
    setLoading(true);
    try {
      const [results, cms] = await Promise.all([
        dataService.searchAlumni(searchQuery, {
          level: levelFilter,
          year: yearFilter,
          campus: campusFilter,
        }),
        dataService.getWebsiteContent(),
      ]);
      setAlumniList(results);
      if (cms?.directory) setDirectoryContent(cms.directory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
  }, [searchQuery, levelFilter, yearFilter, campusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero Welcome Card for MASSH & MOSA */}
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
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.75rem'
        }}
      >
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
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
            <Award size={14} /> {directoryContent?.tagline || 'Official Mandela Old Students Association Registry • Motto: Caring to Achieve'}
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '2rem', marginBottom: '0.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {directoryContent?.title || 'Welcome to the MOSA Alumni Network'}
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            {directoryContent?.description || 'Connecting former students of Mandela Secondary School Hoima (MASSH), established in 1997. Find your classmates, verify alumni credentials with official MA. XXXX numbers, and celebrate our institutional heritage.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-gold" onClick={onOpenRegister}>
              Register as an Alumnus
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
              <span>Total Verified Alumni: <strong>{alumniList.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Featured Real Photo Showcase */}
        <div 
          style={{ 
            position: 'relative', 
            zIndex: 2, 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '0.6rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            maxWidth: '340px',
            width: '100%',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ position: 'relative', height: '175px', borderRadius: '10px', overflow: 'hidden', background: '#020617' }}>
            <img 
              src="/images/massh-flag-unveiling-ceremony.jpg" 
              alt="MASSH Foundation Ceremony"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(11, 32, 62, 0.95))', padding: '0.5rem 0.65rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#FDE68A', fontWeight: 700, display: 'block' }}>
                MASSH Flag Ceremony • Caring to Achieve
              </span>
              <span style={{ fontSize: '0.65rem', color: '#CBD5E1', display: 'block' }}>
                Hon. Fred Byamukama lays foundation stone (26th Sept, 2026)
              </span>
            </div>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div 
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-30px',
            fontSize: '9rem',
            fontFamily: 'var(--font-serif)',
            fontWeight: 900,
            color: 'rgba(255, 255, 255, 0.03)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          1997
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="mosa-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={20} 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} 
            />
            <input
              type="text"
              placeholder='Search by Alumni Number (e.g. MA. 0001), Name, or School Nickname (e.g. "Bulldozer")...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '2.75rem',
                fontSize: '1rem',
                paddingTop: '0.85rem',
                paddingBottom: '0.85rem',
                borderColor: '#CBD5E1',
                borderRadius: '12px',
              }}
            />
          </div>

          {/* Filter Chips / Selectors */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={15} /> Filters:
            </span>

            {/* Level Chips */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { id: 'ALL', label: 'All Levels' },
                { id: 'O_LEVEL', label: 'O-Level' },
                { id: 'A_LEVEL', label: 'A-Level' },
                { id: 'BOTH', label: 'Both Levels' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setLevelFilter(item.id as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: levelFilter === item.id ? '1px solid #0B203E' : '1px solid #CBD5E1',
                    background: levelFilter === item.id ? '#0B203E' : '#FFFFFF',
                    color: levelFilter === item.id ? '#FFFFFF' : '#475569',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Year Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Year:</span>
              <input
                type="number"
                placeholder="e.g. 2020"
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                style={{
                  width: '100px',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8rem',
                }}
                min={1997}
                max={2026}
              />
              {yearFilter && (
                <button 
                  onClick={() => setYearFilter('')} 
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#EF4444', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Nickname Search Prompt */}
            <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748B' }}>
              Try searching: <button onClick={() => setSearchQuery('Bulldozer')} style={{ color: '#D97706', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>"Bulldozer"</button> or <button onClick={() => setSearchQuery('MA. 0001')} style={{ color: '#D97706', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>"MA. 0001"</button>
            </div>
          </div>
        </div>
      </div>

      {/* Alumni Results Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          Loading verified MOSA alumni...
        </div>
      ) : alumniList.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <GraduationCap size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>No Alumni Found</h3>
          <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            No verified alumni matched your current search filters. Try clearing your search or register as a new alumnus.
          </p>
          <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setLevelFilter('ALL'); setYearFilter(''); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {alumniList.map((alumnus, idx) => {
            const priv = alumnus.privacySettings;
            const displayName = priv.showName || isAdmin ? `${alumnus.firstName} ${alumnus.lastName}` : 'Alumnus Member';
            const occupation = priv.showProfession || isAdmin 
              ? (alumnus.occupation || 'Mandela Secondary School Alumnus')
              : 'Verified Alumnus';

            return (
              <div 
                key={alumnus.internalId}
                onClick={() => onSelectAlumni(alumnus)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderBottom: idx < alumniList.length - 1 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  background: '#FFFFFF',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                title={`Tap to view full profile of ${displayName}`}
              >
                {/* 1. Photo */}
                {alumnus.photoUrl ? (
                  <img
                    src={alumnus.photoUrl}
                    alt={displayName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #CBD5E1', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0B203E', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {alumnus.firstName.charAt(0)}{alumnus.lastName.charAt(0)}
                  </div>
                )}

                {/* 2. Name & 3. Occupation */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.94rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {occupation}
                  </div>
                </div>

                {/* 4. MA Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#D97706', background: '#FFFBEB', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                    {alumnus.alumniNumber}
                  </span>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campus Heritage & Photo Gallery (With Authentic & Dynamic Photos) */}
      <CampusHeritageGallery 
        currentUser={currentUser}
        onOpenAuth={() => {}}
      />
    </div>
  );
};
