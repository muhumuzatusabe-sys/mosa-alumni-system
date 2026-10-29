import React, { useState, useEffect } from 'react';
import { AlumniProfile, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { 
  Search, 
  Filter, 
  Award, 
  GraduationCap, 
  ChevronRight, 
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface Props {
  currentUser: AuthUser | null;
  onSelectAlumni: (alumnus: AlumniProfile) => void;
  onOpenRegister: () => void;
  onBack?: () => void;
}

export const AlumniDirectory: React.FC<Props> = ({ 
  currentUser, 
  onSelectAlumni, 
  onOpenRegister, 
  onBack 
}) => {
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'O_LEVEL' | 'A_LEVEL' | 'BOTH'>('ALL');
  const [yearFilter, setYearFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');

  // Dynamic membership statistics
  const [totalRegistered, setTotalRegistered] = useState<number>(0);
  const [totalVerified, setTotalVerified] = useState<number>(0);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  // Helper to determine if an alumnus is verified according to business rules
  const checkIsVerified = (a: AlumniProfile): boolean => {
    return Boolean(
      (a.verifiedAt || a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED') &&
      a.membershipStatus !== 'DISAPPROVED' &&
      a.membershipStatus !== 'REJECTED' &&
      a.membershipStatus !== 'SUSPENDED'
    );
  };

  // Load overall membership database statistics
  useEffect(() => {
    const loadDatabaseStats = async () => {
      try {
        const [allAlumni, applications] = await Promise.all([
          dataService.getAlumniList(),
          dataService.getApplications(),
        ]);
        const verifiedCount = allAlumni.filter(checkIsVerified).length;
        const registeredCount = Math.max(applications.length, allAlumni.length);
        setTotalRegistered(registeredCount);
        setTotalVerified(verifiedCount);
      } catch (err) {
        console.error('Failed to load registry statistics:', err);
      }
    };

    loadDatabaseStats();
  }, []);

  // Load and filter searchable alumni list
  const loadAlumni = async () => {
    setLoading(true);
    try {
      const results = await dataService.searchAlumni(searchQuery, {
        level: levelFilter,
        year: yearFilter,
        campus: campusFilter,
      });
      setAlumniList(results);
    } catch (err) {
      console.error('Failed to search alumni registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
  }, [searchQuery, levelFilter, yearFilter, campusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 4.1 Registry Heading */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 65%, #18533B 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(10, 39, 27, 0.16)',
          border: '1.5px solid rgba(198, 138, 36, 0.35)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}
      >
        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #D97706', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.76rem', color: '#FCD34D', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Award size={13} /> MASSH ALUMNI PORTAL • Official Member Registry
          </div>

          <h1 style={{ color: '#FFFFFF', fontSize: '1.9rem', margin: '0 0 0.35rem 0', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Alumni Registry
          </h1>

          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            Explore registered alumni of Mandela Secondary School Hoima.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', zIndex: 2 }}>
          <button className="btn btn-gold" onClick={onOpenRegister}>
            Register
          </button>
        </div>
      </div>

      {/* 4.2 Membership Statistics Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1rem' 
        }}
      >
        {/* Card 1: Registered Alumni */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(11, 32, 62, 0.08)',
              color: '#0B203E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={26} color="#0B203E" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', fontWeight: 700 }}>
              Registered Alumni
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B203E', lineHeight: 1.1, marginTop: '0.15rem' }}>
              {totalRegistered > 0 ? totalRegistered.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              Total registered in membership database
            </div>
          </div>
        </div>

        {/* Card 2: Verified Alumni */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={26} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', fontWeight: 700 }}>
              Verified Alumni
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', lineHeight: 1.1, marginTop: '0.15rem' }}>
              {totalVerified > 0 ? totalVerified.toLocaleString() : '0'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              Authenticated with official MA numbers
            </div>
          </div>
        </div>
      </div>

      {/* 4.4 Search and Filters Section */}
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
              placeholder='Search by Alumni Number (e.g. MA. 0001), Name, Profession, or Nickname...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '2.75rem',
                fontSize: '0.98rem',
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
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                    border: levelFilter === item.id ? '1px solid #113D2B' : '1px solid #E5DFD1',
                    background: levelFilter === item.id ? '#113D2B' : '#FFFFFF',
                    color: levelFilter === item.id ? '#FFFFFF' : '#4B6354',
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
          </div>
        </div>
      </div>

      {/* 4.3 Alumni Member Cards Roster */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B' }}>
          Loading registered alumni directory...
        </div>
      ) : alumniList.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <GraduationCap size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            {!searchQuery && levelFilter === 'ALL' && !yearFilter ? 'No members registered yet' : 'No Alumni Found'}
          </h3>
          <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            {!searchQuery && levelFilter === 'ALL' && !yearFilter
              ? 'Be the first to join the official MOSA alumni registry. Complete your registration to receive your official membership number.'
              : 'No registered alumni matched your current search filters. Try clearing your search or register as a new alumnus.'}
          </p>
          {!searchQuery && levelFilter === 'ALL' && !yearFilter ? (
            <button className="btn btn-gold" onClick={onOpenRegister}>
              Register
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setLevelFilter('ALL'); setYearFilter(''); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div 
          style={{ 
            background: '#FFFFFF', 
            borderRadius: '12px', 
            border: '1px solid #E2E8F0', 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          {alumniList.map((alumnus, idx) => {
            const priv = alumnus.privacySettings;
            const displayName = priv.showName || isAdmin 
              ? (alumnus.fullName || `${alumnus.firstName} ${alumnus.lastName}`)
              : 'Alumnus Member';
            
            const profession = priv.showProfession || isAdmin 
              ? (alumnus.occupation || alumnus.programme || 'Mandela Secondary School Alumnus')
              : 'Mandela Secondary School Alumnus';

            const isVerified = checkIsVerified(alumnus);

            return (
              <div 
                key={alumnus.internalId}
                onClick={() => onSelectAlumni(alumnus)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1.15rem',
                  borderBottom: idx < alumniList.length - 1 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  background: '#FFFFFF',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                title={`Click to view profile of ${displayName}`}
              >
                {/* 1. Member's Profile Photograph (or Clean Default Avatar) */}
                {alumnus.photoUrl ? (
                  <img
                    src={alumnus.photoUrl}
                    alt={displayName}
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: '1.5px solid #CBD5E1', 
                      flexShrink: 0 
                    }}
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #0B203E 0%, #113D2B 100%)', 
                      color: '#FDE68A', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '0.9rem', 
                      flexShrink: 0,
                      border: '1.5px solid #FBBF24'
                    }}
                  >
                    {alumnus.firstName?.[0] || 'M'}{alumnus.lastName?.[0] || 'A'}
                  </div>
                )}

                {/* 2. Full Name & 3. Current Profession directly below */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div 
                    style={{ 
                      fontWeight: 700, 
                      color: '#0B203E', 
                      fontSize: '0.96rem', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}
                  >
                    {displayName}
                  </div>
                  <div 
                    style={{ 
                      color: '#64748B', 
                      fontSize: '0.82rem', 
                      marginTop: '0.15rem', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}
                  >
                    {profession}
                  </div>
                </div>

                {/* 4. Alumni Number & 5. Verification Badge/Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                  {/* 5. Verification Status Badge */}
                  {isVerified ? (
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        color: '#059669', 
                        background: '#ECFDF5', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '999px', 
                        border: '1px solid #A7F3D0', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem' 
                      }}
                    >
                      <CheckCircle2 size={12} color="#059669" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        color: '#64748B', 
                        background: '#F1F5F9', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '999px', 
                        border: '1px solid #E2E8F0' 
                      }}
                    >
                      Registered
                    </span>
                  )}

                  {/* 4. Alumni Membership Number */}
                  <span 
                    style={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 800, 
                      fontSize: '0.82rem', 
                      color: '#D97706', 
                      background: '#FFFBEB', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '6px', 
                      border: '1px solid #FDE68A' 
                    }}
                  >
                    {alumnus.alumniNumber}
                  </span>

                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
