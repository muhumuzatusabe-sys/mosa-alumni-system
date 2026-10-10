import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  Users, 
  FileText, 
  HelpCircle, 
  Search, 
  ArrowRight,
  Sparkles,
  QrCode,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { AuthUser, AlumniProfile, MembershipContent, MembershipTier } from '../types';
import { dataService } from '../services/dataService';

interface MembershipViewProps {
  currentUser: AuthUser | null;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
  onNavigate: (tab: any) => void;
  onBack?: () => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  currentUser,
  onOpenRegister,
  onOpenVerify,
  onNavigate,
  onBack,
}) => {
  const [content, setContent] = useState<MembershipContent | null>(null);

  // Integrated quick verification state
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ checked: boolean; found: boolean; alumnus?: AlumniProfile } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const websiteContent = await dataService.getWebsiteContent();
        setContent(websiteContent.membership);
      } catch (err) {
        console.error('Failed to load membership content:', err);
      }
    };
    loadContent();
  }, []);

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyQuery.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const res = await dataService.verifyAlumnusByNumber(verifyQuery.trim());
      if (res && res.isValidMember && res.alumnus) {
        setVerifyResult({ checked: true, found: true, alumnus: res.alumnus });
      } else {
        setVerifyResult({ checked: true, found: false });
      }
    } catch (err) {
      console.error(err);
      setVerifyResult({ checked: true, found: false });
    } finally {
      setIsVerifying(false);
    }
  };

  const defaultTiers: MembershipTier[] = [
    {
      title: 'Ordinary Member',
      target: 'All Former MASSH Students',
      description: 'Automatic membership granted to all students who completed O-Level or A-Level at Mandela Secondary School Hoima.',
      benefits: [
        'Permanent unique official membership number',
        'Inclusion in the global verified alumni directory',
        'Right to attend MOSA Annual General Meetings (AGM)',
        'Participation in sports galas, dinners, and homecomings',
        'Access to university and regional campus chapters',
      ],
      badge: 'STANDARD',
    },
    {
      title: 'Life Member',
      target: 'Distinguished Alumni & Benefactors',
      description: 'Conferred upon alumni who make a lifetime endowment to the MOSA Education Trust or scholarship fund.',
      benefits: [
        'Gold digital & physical permanent ID credential',
        'Permanent citation in the MASSH Heritage Roll of Honour',
        'Special invitation to executive roundtables & school assemblies',
        'Full voting and executive nomination rights',
        'Dedicated VIP seating at all official functions',
      ],
      badge: 'HONOUR ROLL',
    },
    {
      title: 'Student Member',
      target: 'Current S.4 & S.6 Candidates',
      description: 'Transitional membership for graduating candidates preparing to cross into higher institutions and the corporate world.',
      benefits: [
        'Career mentorship by established alumni in their desired fields',
        'Orientation and link-up with university chapter leaders',
        'Priority transition to full alumni status upon result release',
        'Participation in pre-university career preparation workshops',
      ],
      badge: 'CANDIDATES',
    },
  ];

  const membershipTiers: MembershipTier[] = content?.tiers && content.tiers.length > 0 ? content.tiers : defaultTiers;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        {onBack && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#0B203E',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', color: '#D97706', padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Award size={15} />
          <span>{content?.tagline || 'OFFICIAL MOSA MEMBERSHIP'}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: '#0B203E', marginBottom: '0.75rem', fontWeight: 800 }}>
          {content?.title || 'Membership Structure & Numbering'}
        </h1>
        <p style={{ color: '#64748B', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: '1.6' }}>
          {content?.subtitle || 'Every student who passed through the gates of Mandela Secondary School Hoima is entitled to a permanent, officially authenticated alumni number.'}
        </p>
      </div>

      {/* Numbering System Explainer Card */}
      <div 
        className="mosa-card" 
        style={{ 
          background: 'linear-gradient(135deg, #07152B 0%, #0B203E 60%, #163663 100%)', 
          color: '#FFFFFF', 
          padding: '2.5rem', 
          borderRadius: '16px', 
          marginBottom: '3rem',
          borderLeft: '6px solid #D97706',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#FBBF24', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} />
              <span>Standardised Numbering System</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#FFFFFF', marginBottom: '1rem', lineHeight: '1.25' }}>
              {content?.explainerTitle || 'How Your Alumni Number Works'}
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              {content?.explainerBody || 'When you submit your membership registration, the system validates your MASSH completion credentials and automatically allocates your official sequential membership number (e.g. MA. 0001 or MOSA-000001).'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {!currentUser && (
                <button
                  className="btn btn-primary"
                  onClick={onOpenRegister}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                >
                  <Users size={17} />
                  <span>Register & Get Your Number</span>
                </button>
              )}
              {currentUser && currentUser.role === 'ALUMNI' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate('my-profile')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                >
                  <CreditCard size={17} />
                  <span>View My Digital Card</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.75rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
              Sample Official Format
            </div>
            <div 
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '1.75rem', 
                fontWeight: 800, 
                color: '#FBBF24', 
                letterSpacing: '0.05em',
                background: '#07152B',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px dashed #D97706',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              {content?.sampleNumber || 'MA. 0042'}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#CBD5E1', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#10B981" /> Unique and non-transferable
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#10B981" /> Publicly verifiable by institutions & employers
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#10B981" /> Encoded onto your digital membership card QR code
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instant Public Verification Widget */}
      <div 
        className="mosa-card" 
        style={{ 
          padding: '2rem', 
          marginBottom: '3.5rem',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={20} color="#2563EB" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Instant Number Verification Desk</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Verify if an individual is an authentic registered alumnus of Mandela Secondary School Hoima.</p>
          </div>
        </div>

        <form onSubmit={handleQuickVerify} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter Alumni Number (e.g. MA. 0001 or MOSA-000001)"
            value={verifyQuery}
            onChange={e => setVerifyQuery(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '0.75rem 1rem' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isVerifying || !verifyQuery.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            {isVerifying ? 'Checking...' : 'Verify Now'}
          </button>
        </form>

        {verifyResult && (
          <div style={{ marginTop: '1rem' }}>
            {verifyResult.found && verifyResult.alumnus ? (
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: '#D1FAE5', border: '1px solid #10B981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle2 size={28} color="#059669" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#065F46', fontSize: '1rem' }}>
                    Authentic Verified Member: {verifyResult.alumnus.fullName || `${verifyResult.alumnus.firstName} ${verifyResult.alumnus.lastName}`}
                  </div>
                  <div style={{ color: '#047857', fontSize: '0.85rem' }}>
                    Alumni Number: <strong>{verifyResult.alumnus.alumniNumber}</strong> • Status: <strong>{verifyResult.alumnus.membershipStatus || 'ACTIVE'}</strong> • Profession: {verifyResult.alumnus.occupation || 'Alumnus'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: '#FEE2E2', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <HelpCircle size={28} color="#DC2626" />
                <div>
                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '1rem' }}>
                    No Registered Member Found
                  </div>
                  <div style={{ color: '#B91C1C', fontSize: '0.85rem' }}>
                    The number "{verifyQuery}" does not match any authenticated record in the official MOSA registry.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Membership Categories Grid */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', color: '#0B203E', marginBottom: '0.5rem' }}>
            Membership Categories
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
            Choose the membership tier corresponding to your engagement in the association.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
          {membershipTiers.map((tier: MembershipTier, idx: number) => (
            <div key={idx} className="mosa-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  {tier.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#0B203E', marginBottom: '0.3rem' }}>{tier.title}</h3>
              <div style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, marginBottom: '0.75rem' }}>
                {tier.target}
              </div>
              <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                {tier.description}
              </p>
              
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Key Privileges:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {tier.benefits.map((b: string, bIdx: number) => (
                    <li key={bIdx} style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: '1.4' }}>
                      <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipView;
