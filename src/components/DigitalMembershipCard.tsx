import React, { useState, useEffect } from 'react';
import { AlumniProfile, MembershipCardRecord, MembershipCardSettings } from '../types';
import { membershipCardService } from '../services/membershipCardService';
import { 
  RotateCw, 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Columns, 
  CreditCard,
  ExternalLink,
  Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import { MOSA_COLORS, getMosaCrestSvg, getMosaSignatureSvg, svgToDataUrl } from '../utils/mosaCrest';

interface Props {
  alumnus: AlumniProfile;
  card?: MembershipCardRecord | null;
  settings?: MembershipCardSettings;
  onOpenPublicVerification?: (tokenOrNumber: string) => void;
  onRequestCorrection?: () => void;
}

export const DigitalMembershipCard: React.FC<Props> = ({ 
  alumnus, 
  card: initialCard,
  settings: initialSettings,
  onOpenPublicVerification,
  onRequestCorrection
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'3D' | 'SIDE_BY_SIDE'>('3D');
  const [card, setCard] = useState<MembershipCardRecord | null>(initialCard || null);
  const [settings, setSettings] = useState<MembershipCardSettings>(initialSettings || null as any);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const s = initialSettings || await membershipCardService.getCardSettings();
      if (!isMounted) return;
      setSettings(s);

      let c = initialCard;
      if (!c) {
        c = await membershipCardService.getCardForAlumnus(alumnus.internalId);
      }
      if (!isMounted) return;
      setCard(c);

      // Generate live QR
      const verToken = c?.verificationToken || alumnus.alumniNumber;
      const targetUrl = `${window.location?.origin || 'https://mandelassalumni.com'}/?verify-card=${encodeURIComponent(verToken)}`;
      try {
        const url = await QRCode.toDataURL(targetUrl, {
          margin: 1,
          width: 240,
          color: { dark: '#0B203E', light: '#FFFFFF' }
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.warn('QR code generation failed:', err);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [alumnus, initialCard, initialSettings]);

  const activeSettings = settings || membershipCardService.getCardSettings();
  const snapshot = card?.snapshot || membershipCardService.buildCardSnapshot(alumnus, settings || ({} as any));
  const displayStatus = membershipCardService.computeCardDisplayStatus(alumnus, card);

  // Format issue date matching template e.g. "05 SEPT 19XX"
  const formatIssueDate = (iso?: string) => {
    if (!iso) return '05 SEPT 2026';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const issueDateStr = formatIssueDate(card?.issuedAt);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const s = settings || await membershipCardService.getCardSettings();
      // If card record doesn't exist yet, build simulated card for preview
      const cardRecord: MembershipCardRecord = card || {
        id: 'preview',
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        validationNumber: 'MOSA-VAL-SAMPLE',
        verificationToken: alumnus.alumniNumber,
        status: 'ISSUED',
        issueNumber: 1,
        issuedAt: new Date().toISOString(),
        issuedBy: 'MOSA Secretariat',
        snapshot,
        history: []
      };

      const doc = await membershipCardService.generateCardPdf(alumnus, cardRecord, s, 'DUPLEX');
      const cleanNum = alumnus.alumniNumber.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`MOSA_ID_Card_${cleanNum}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Error generating print-ready PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const crestUrl = settings?.crestDataUrl || svgToDataUrl(getMosaCrestSvg(140));
  const holderSigUrl = alumnus.signatureUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 90, 36));
  const chairmanMosaSigUrl = settings?.chairmanMosa?.signatureDataUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 90, 36));
  const chairmanBogSigUrl = settings?.chairmanBog?.signatureDataUrl || svgToDataUrl(getMosaSignatureSvg(MOSA_COLORS.navyDeep, 90, 36));

  // Render Status Badge
  const renderStatusBadge = () => {
    switch (displayStatus) {
      case 'VALID':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <CheckCircle2 size={12} /> VALID CARD
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <Clock size={12} /> PENDING ISSUANCE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <AlertTriangle size={12} /> SUSPENDED
          </span>
        );
      case 'REVOKED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <XCircle size={12} /> REVOKED
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <Clock size={12} /> EXPIRED
          </span>
        );
      case 'AWAITING_CORRECTION':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#E0E7FF', color: '#3730A3', border: '1px solid #C7D2FE', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <Clock size={12} /> AWAITING CORRECTION
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
            <AlertTriangle size={12} /> {displayStatus}
          </span>
        );
    }
  };

  // Card Front Component
  const CardFront = () => (
    <div 
      className="mosa-id-card-front"
      style={{
        width: '100%',
        maxWidth: '430px',
        aspectRatio: '1.586', // Standard ID-1 CR80 credit card aspect ratio
        background: '#F3F6E8', // Exact pale cream
        borderRadius: '16px',
        border: '1px solid #D4DBC5',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(11, 32, 62, 0.25), 0 4px 6px -2px rgba(11, 32, 62, 0.05)',
        display: 'flex',
        boxSizing: 'border-box',
        userSelect: 'none'
      }}
    >
      {/* Decorative Left Dark Navy Sweep & Lime Ring */}
      <div 
        style={{
          position: 'absolute',
          left: '-32%',
          top: '-15%',
          width: '68%',
          height: '130%',
          borderRadius: '50%',
          background: '#0B203E',
          border: '7px solid #D2E038',
          zIndex: 1,
          boxShadow: '4px 0 14px rgba(0,0,0,0.2)'
        }}
      />

      {/* Circular Member Photo */}
      <div 
        style={{
          position: 'absolute',
          left: '7.5%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '27%',
          aspectRatio: '1',
          borderRadius: '50%',
          border: '4px solid #D2E038',
          background: '#FFFFFF',
          zIndex: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {alumnus.photoUrl ? (
          <img 
            src={alumnus.photoUrl} 
            alt={snapshot.givenName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D2E038',
            fontSize: '1.4rem',
            fontWeight: 800
          }}>
            {snapshot.givenName[0]}{snapshot.surname[0]}
          </div>
        )}
      </div>

      {/* Top Right MASSH School Crest */}
      <div style={{ position: 'absolute', right: '3.5%', top: '4%', width: '14%', zIndex: 2 }}>
        <img src={crestUrl} alt="MASSH Crest" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* Main Content Area */}
      <div 
        style={{
          position: 'absolute',
          left: '37.5%',
          top: '4%',
          right: '3.5%',
          bottom: '4%',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Header Block */}
        <div>
          <div style={{ textAlign: 'center', paddingRight: '14%' }}>
            <h2 style={{
              margin: 0,
              fontSize: 'clamp(0.68rem, 2.2vw, 0.95rem)',
              fontWeight: 900,
              color: '#0B203E',
              lineHeight: 1.15,
              letterSpacing: '-0.2px',
              textTransform: 'uppercase',
              fontFamily: "'Montserrat', 'Inter', sans-serif"
            }}>
              MANDELA OLD STUDENTS
            </h2>
            <h3 style={{
              margin: '1px 0 0 0',
              fontSize: 'clamp(0.65rem, 2.1vw, 0.9rem)',
              fontWeight: 900,
              color: '#0B203E',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              fontFamily: "'Montserrat', 'Inter', sans-serif"
            }}>
              ASSOCIATION (MOSA)
            </h3>
            
            {/* Green Pill Badge */}
            <div style={{
              display: 'inline-block',
              background: '#548C4E',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 'clamp(0.48rem, 1.4vw, 0.65rem)',
              padding: '2px 10px',
              borderRadius: '999px',
              margin: '3px auto 0 auto',
              letterSpacing: '0.2px'
            }}>
              Membership ID Card
            </div>
          </div>
        </div>

        {/* Member Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
          {/* Surname */}
          <div>
            <div style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600, lineHeight: 1 }}>
              Surname:
            </div>
            <div style={{ fontSize: 'clamp(0.68rem, 2.1vw, 0.9rem)', fontWeight: 900, color: '#0B203E', lineHeight: 1.15 }}>
              {snapshot.surname}
            </div>
          </div>

          {/* Given Name */}
          <div>
            <div style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600, lineHeight: 1 }}>
              Given Name:
            </div>
            <div style={{ fontSize: 'clamp(0.68rem, 2.1vw, 0.9rem)', fontWeight: 900, color: '#0B203E', lineHeight: 1.15 }}>
              {snapshot.givenName}
            </div>
          </div>

          {/* Nationality & Sex Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>Nationality:</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 800, color: '#0B203E' }}>{snapshot.nationality}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>Sex:</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 800, color: '#0B203E' }}>{snapshot.sex}</span>
            </div>
          </div>

          {/* Cohort Year & MA No. Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>Cohort year:</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 800, color: '#0B203E' }}>{snapshot.cohortYear}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>MA No.</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 900, color: '#0B203E', fontFamily: 'monospace' }}>
                {snapshot.alumniNumber}
              </span>
            </div>
          </div>

          {/* Entry & Departure Year Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>Entry year:</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 800, color: '#0B203E' }}>{snapshot.entryYear}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: 'clamp(0.45rem, 1.3vw, 0.58rem)', color: '#5A6874', fontWeight: 600 }}>Departure year:</span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.72rem)', fontWeight: 800, color: '#0B203E' }}>{snapshot.departureYear}</span>
            </div>
          </div>

          {/* Issue Date & Holder's Signature Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1px' }}>
            <div>
              <div style={{ fontSize: 'clamp(0.42rem, 1.2vw, 0.52rem)', color: '#5A6874', fontWeight: 600, lineHeight: 1 }}>
                Issue Date:
              </div>
              <div style={{ fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)', fontWeight: 800, color: '#0B203E' }}>
                {issueDateStr}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: 'clamp(0.42rem, 1.2vw, 0.52rem)', color: '#5A6874', fontWeight: 600, textAlign: 'right', lineHeight: 1.1 }}>
                Holder's<br/>Signature
              </div>
              <div style={{ width: '46px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={holderSigUrl} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Card Back Component
  const CardBack = () => (
    <div 
      className="mosa-id-card-back"
      style={{
        width: '100%',
        maxWidth: '430px',
        aspectRatio: '1.586',
        background: '#F3F6E8', // Exact pale cream
        borderRadius: '16px',
        border: '1px solid #D4DBC5',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(11, 32, 62, 0.25), 0 4px 6px -2px rgba(11, 32, 62, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0',
        boxSizing: 'border-box',
        userSelect: 'none'
      }}
    >
      {/* Top Statement */}
      <div style={{ textAlign: 'center', paddingTop: '3.5%', paddingBottom: '1.5%' }}>
        <span style={{
          fontSize: 'clamp(0.52rem, 1.6vw, 0.7rem)',
          fontWeight: 600,
          color: '#0B203E'
        }}>
          {settings?.ownershipStatement || 'This is property of:'}
        </span>
      </div>

      {/* Middle Dark Navy Banner */}
      <div 
        style={{
          background: '#0B203E',
          color: '#FFFFFF',
          padding: '2.5% 4%',
          textAlign: 'center',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        <div style={{
          fontSize: 'clamp(0.68rem, 2.2vw, 0.95rem)',
          fontWeight: 900,
          letterSpacing: '-0.1px',
          textTransform: 'none',
          fontFamily: "'Montserrat', 'Inter', sans-serif"
        }}>
          {settings?.associationName || 'Mandela Old Students Association (MOSA)'}
        </div>
        <div style={{ fontSize: 'clamp(0.48rem, 1.4vw, 0.65rem)', color: '#F1F5F9', fontWeight: 500 }}>
          Tel: {(settings?.phoneNumbers || ['+256 772 411921', '+256 706599793', '+256 773432413']).join(', ')}
        </div>
        <div style={{ fontSize: 'clamp(0.48rem, 1.4vw, 0.65rem)', color: '#F1F5F9', fontWeight: 500 }}>
          Email: {settings?.email || 'mosaalumni31@gmail.com'}
        </div>
        <div style={{ fontSize: 'clamp(0.48rem, 1.4vw, 0.65rem)', color: '#F1F5F9', fontWeight: 500 }}>
          Website: {settings?.website || 'mandelassalumni.com'}
        </div>
      </div>

      {/* Bottom Area: Signatories on Left, Validated QR on Right */}
      <div style={{
        padding: '3% 6% 4.5% 6%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Authorisation Signatures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Chairman MOSA */}
          <div>
            <div style={{ width: '85px', height: '22px', display: 'flex', alignItems: 'center' }}>
              <img src={chairmanMosaSigUrl} alt="Chairman MOSA" style={{ maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ width: '105px', borderBottom: '1.2px solid #0B203E' }} />
            <div style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.68rem)', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
              {settings?.chairmanMosa?.title || 'Chairman MOSA'}
            </div>
          </div>

          {/* Chairman BOG Massh */}
          <div>
            <div style={{ width: '85px', height: '22px', display: 'flex', alignItems: 'center' }}>
              <img src={chairmanBogSigUrl} alt="Chairman BOG" style={{ maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ width: '105px', borderBottom: '1.2px solid #0B203E' }} />
            <div style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.68rem)', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
              {settings?.chairmanBog?.title || 'Chairman BOG Massh'}
            </div>
          </div>
        </div>

        {/* Validated Scannable QR Code */}
        <div 
          onClick={() => {
            if (onOpenPublicVerification) {
              onOpenPublicVerification(card?.verificationToken || alumnus.alumniNumber);
            }
          }}
          title="Click to view live public verification"
          style={{
            position: 'relative',
            background: '#FFFFFF',
            padding: '5px',
            borderRadius: '6px',
            border: '2px solid #589152', // Green bracket border
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Verification QR" style={{ width: '70px', height: '70px', display: 'block' }} />
          ) : (
            <div style={{ width: '70px', height: '70px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
              Generating...
            </div>
          )}
          <div style={{ fontSize: '0.45rem', fontWeight: 800, color: '#0B203E', textAlign: 'center', marginTop: '2px', letterSpacing: '-0.2px' }}>
            SCAN TO VERIFY
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
      
      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '440px', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {renderStatusBadge()}
          {card?.validationNumber && (
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
              {card.validationNumber}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3D' ? 'SIDE_BY_SIDE' : '3D')}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Columns size={12} /> {viewMode === '3D' ? 'View Both Sides' : '3D Flip View'}
          </button>
        </div>
      </div>

      {/* RENDER VIEW: 3D Flip Mode or Side-by-Side */}
      {viewMode === '3D' ? (
        <div 
          style={{
            width: '100%',
            maxWidth: '430px',
            perspective: '1000px',
            cursor: 'pointer'
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FRONT */}
            <div style={{ backfaceVisibility: 'hidden' }}>
              <CardFront />
            </div>

            {/* BACK */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}>
              <CardBack />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', color: '#64748B', fontSize: '0.78rem' }}>
            <RotateCw size={12} /> Click card to flip ({isFlipped ? 'showing Back' : 'showing Front'})
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B203E', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>
              Card Front
            </div>
            <CardFront />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B203E', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>
              Card Back
            </div>
            <CardBack />
          </div>
        </div>
      )}

      {/* Action Controls Bar */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '440px', marginTop: '0.25rem' }}>
        {viewMode === '3D' && (
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCw size={14} /> Flip Card
          </button>
        )}

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="btn btn-primary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 700
          }}
        >
          <Download size={14} color="#FBBF24" />
          {isDownloading ? 'Generating PDF...' : 'Download Print-Ready PDF'}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={14} /> Print
        </button>

        {onOpenPublicVerification && (
          <button
            type="button"
            onClick={() => onOpenPublicVerification(card?.verificationToken || alumnus.alumniNumber)}
            className="btn btn-gold"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShieldCheck size={14} /> Verify Registry
          </button>
        )}

        {onRequestCorrection && (
          <button
            type="button"
            onClick={onRequestCorrection}
            style={{
              background: 'none',
              border: 'none',
              color: '#B45309',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: '0.2rem',
              width: '100%',
              textAlign: 'center'
            }}
          >
            Incorrect personal details? Request Card Correction
          </button>
        )}
      </div>
    </div>
  );
};

export default DigitalMembershipCard;
