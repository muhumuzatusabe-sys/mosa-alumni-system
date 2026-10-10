import React, { useState } from 'react';
import { Chapter } from '../types';
import {
  MapPin,
  Building2,
  Users,
  Compass,
  Globe2,
  Landmark,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Props {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter) => void;
  onJoinChapter?: (chapter: Chapter) => void;
}

interface MapCoordinate {
  chapterId: string;
  name: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  region: 'UGANDA' | 'DIASPORA';
  isHomeCampus?: boolean;
}

const PIN_COORDINATES: Record<string, { x: number; y: number; region: 'UGANDA' | 'DIASPORA'; isHomeCampus?: boolean }> = {
  'chap-00': { x: 38, y: 46, region: 'UGANDA', isHomeCampus: true }, // Hoima
  'chap-01': { x: 55, y: 64, region: 'UGANDA' }, // Makerere / Kampala
  'chap-02': { x: 58, y: 62, region: 'UGANDA' }, // Kyambogo
  'chap-03': { x: 34, y: 78, region: 'UGANDA' }, // Mbarara
  'chap-04': { x: 52, y: 24, region: 'UGANDA' }, // Gulu
  'chap-05': { x: 53, y: 72, region: 'UGANDA' }, // Entebbe
  'chap-06': { x: 68, y: 58, region: 'UGANDA' }, // Jinja
  'chap-07': { x: 25, y: 50, region: 'DIASPORA' }, // UK & Europe
  'chap-08': { x: 50, y: 50, region: 'DIASPORA' }, // North America
  'chap-09': { x: 75, y: 50, region: 'DIASPORA' }, // UAE & Middle East
};

export const ChaptersMap: React.FC<Props> = ({
  chapters,
  selectedChapter,
  onSelectChapter,
  onJoinChapter
}) => {
  const [filterRegion, setFilterRegion] = useState<'ALL' | 'UGANDA' | 'DIASPORA'>('ALL');

  const getPinForChapter = (ch: Chapter) => {
    // Lookup by id or fuzzy match
    if (PIN_COORDINATES[ch.id]) return PIN_COORDINATES[ch.id];
    const code = ch.code.toUpperCase();
    if (code.includes('MUMASA') || code.includes('KAMPALA')) return PIN_COORDINATES['chap-01'];
    if (code.includes('KYUMASA')) return PIN_COORDINATES['chap-02'];
    if (code.includes('MBUMASA') || ch.location.toLowerCase().includes('mbarara')) return PIN_COORDINATES['chap-03'];
    if (code.includes('GUMASA') || ch.location.toLowerCase().includes('gulu')) return PIN_COORDINATES['chap-04'];
    if (code.includes('NKUMASA') || ch.location.toLowerCase().includes('entebbe')) return PIN_COORDINATES['chap-05'];
    if (ch.location.toLowerCase().includes('jinja')) return PIN_COORDINATES['chap-06'];
    if (ch.country && ch.country !== 'Uganda') return { x: 50, y: 50, region: 'DIASPORA' as const };
    return { x: 42, y: 50, region: 'UGANDA' as const };
  };

  const filteredList = chapters.filter(ch => {
    const pin = getPinForChapter(ch);
    if (filterRegion === 'ALL') return true;
    return pin.region === filterRegion;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={20} color="#D97706" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0B203E' }}>
            Regional Chapters & Diaspora Locator
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'ALL', label: 'All Chapters', icon: Globe2 },
            { id: 'UGANDA', label: 'Uganda & Universities', icon: Landmark },
            { id: 'DIASPORA', label: 'Global Diaspora', icon: Compass }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterRegion(tab.id as any)}
              style={{
                background: filterRegion === tab.id ? '#0B203E' : '#F1F5F9',
                color: filterRegion === tab.id ? '#FFFFFF' : '#475569',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <tab.icon size={13} color={filterRegion === tab.id ? '#F59E0B' : '#64748B'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Chapter Details Dossier */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Map Canvas */}
        <div style={{
          background: 'linear-gradient(135deg, #07152B 0%, #0B203E 50%, #163663 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          minHeight: '440px',
          boxShadow: '0 8px 24px rgba(11,32,62,0.2)',
          border: '1px solid rgba(217,119,6,0.3)',
          overflow: 'hidden'
        }}>
          {/* Subtle Grid overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }} />

          {/* Map Title & Legend */}
          <div style={{ position: 'relative', zIndex: 2, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cartographic Locator
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Mandela Secondary School Alumni Network
              </h4>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#F8FAFC',
              fontWeight: 600
            }}>
              ⭐ Hoima Mother Chapter
            </div>
          </div>

          {/* SVG Stylized Map of Uganda */}
          <div style={{ position: 'relative', width: '100%', height: '320px', zIndex: 2 }}>
            <svg viewBox="0 0 500 400" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>
              {/* Stylized Uganda Territorial Contour */}
              <path
                d="M 120 70 
                   Q 200 40, 310 50 
                   Q 390 60, 420 120 
                   Q 440 200, 410 260 
                   Q 380 320, 320 360 
                   Q 240 370, 180 340 
                   Q 110 320, 90 240 
                   Q 70 160, 120 70 Z"
                fill="rgba(15, 36, 70, 0.65)"
                stroke="#D97706"
                strokeWidth="2"
                strokeDasharray="6 3"
              />

              {/* Lake Victoria Stylized Basin */}
              <path
                d="M 280 280 
                   Q 380 290, 400 350 
                   Q 320 380, 260 340 Z"
                fill="rgba(14, 165, 233, 0.25)"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <text x="320" y="325" fill="#7DD3FC" fontSize="10" fontWeight="600" textAnchor="middle">
                Lake Victoria
              </text>

              {/* Lake Albert Stylized Basin (Albertine / Bunyoro) */}
              <path
                d="M 130 140 
                   Q 170 200, 150 250 
                   Q 120 220, 110 160 Z"
                fill="rgba(14, 165, 233, 0.25)"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <text x="110" y="200" fill="#7DD3FC" fontSize="9" fontWeight="600" textAnchor="middle" transform="rotate(-45 110 200)">
                Lake Albert
              </text>

              {/* Region Label: Bunyoro Kitara */}
              <text x="180" y="170" fill="rgba(245, 158, 11, 0.5)" fontSize="11" fontWeight="800" letterSpacing="1">
                BUNYORO KITARA
              </text>
            </svg>

            {/* Pins overlaid dynamically */}
            {chapters.map(ch => {
              const pin = getPinForChapter(ch);
              if (filterRegion !== 'ALL' && pin.region !== filterRegion) return null;
              const isSelected = selectedChapter?.id === ch.id;

              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChapter(ch)}
                  style={{
                    position: 'absolute',
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 3,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Floating Pill Tag */}
                  <div style={{
                    background: isSelected ? '#D97706' : '#0B203E',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    marginBottom: '2px'
                  }}>
                    {pin.isHomeCampus && '⭐ '}{ch.code}
                  </div>

                  {/* Pin Circle / Kob Star */}
                  <div style={{
                    width: pin.isHomeCampus ? '26px' : '20px',
                    height: pin.isHomeCampus ? '26px' : '20px',
                    borderRadius: '50%',
                    background: pin.isHomeCampus ? '#F59E0B' : isSelected ? '#D97706' : '#3B82F6',
                    border: '2px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
                  }}>
                    <MapPin size={pin.isHomeCampus ? 14 : 11} color="#FFFFFF" />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.74rem', color: '#94A3B8' }}>
            Click any pin or chapter below to inspect leadership, meeting schedules & member roster.
          </div>
        </div>

        {/* Chapter Dossier Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {selectedChapter ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {selectedChapter.code} CHAPTER
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: '0.35rem 0 0 0' }}>
                    {selectedChapter.name}
                  </h3>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: selectedChapter.status === 'ACTIVE' ? '#ECFDF5' : '#F1F5F9',
                  color: selectedChapter.status === 'ACTIVE' ? '#065F46' : '#64748B'
                }}>
                  {selectedChapter.status}
                </span>
              </div>

              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {selectedChapter.description}
              </p>

              {/* Spec Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Institution / Base</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E' }}>
                    {selectedChapter.institution}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Location & Country</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E' }}>
                    {selectedChapter.location}, {selectedChapter.country}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chapter Leader / Chair</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E' }}>
                    {selectedChapter.leaderName || 'Secretariat Assigned'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Verified Members</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>
                    {selectedChapter.memberCount || 0} Alumni
                  </div>
                </div>
              </div>

              {selectedChapter.leaderContact && (
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} color="#D97706" />
                  <span>Contact Secretariat Desk: <strong>{selectedChapter.leaderContact}</strong></span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {onJoinChapter && (
                  <button
                    onClick={() => onJoinChapter(selectedChapter)}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 2px 6px rgba(11,32,62,0.2)'
                    }}
                  >
                    <Users size={16} color="#F59E0B" /> Join / Switch to Chapter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <Compass size={40} color="#CBD5E1" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Select a Chapter on the Map
              </h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                Click any chapter marker on the East Africa map to view leadership, member rosters, and regional circulars.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chapters Quick Roster Cards */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.75rem' }}>
          All MOSA Chapters & Consulates ({filteredList.length})
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {filteredList.map(ch => {
            const isSelected = selectedChapter?.id === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => onSelectChapter(ch)}
                style={{
                  background: isSelected ? '#EFF6FF' : '#FFFFFF',
                  border: isSelected ? '2px solid #0B203E' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(11,32,62,0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
                    {ch.code}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {ch.location}, {ch.country}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  {ch.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                  <span>{ch.institution}</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>{ch.memberCount || 0} members</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
