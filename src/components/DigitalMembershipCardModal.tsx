import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  Download,
  Printer,
  X,
  Copy,
  Check,
  AlertCircle,
  FileEdit,
} from 'lucide-react';
import { AlumniProfile, MembershipCardRecord, MembershipCardSettings } from '../types';
import { DigitalMembershipCard } from './DigitalMembershipCard';
import { CardCorrectionModal } from './CardCorrectionModal';
import { membershipCardService } from '../services/membershipCardService';
import { offlinePassStorage } from '../utils/offlinePassStorage';

interface DigitalMembershipCardModalProps {
  alumnus: AlumniProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicVerification?: (number: string) => void;
}

export const DigitalMembershipCardModal: React.FC<DigitalMembershipCardModalProps> = ({
  alumnus,
  isOpen,
  onClose,
  onOpenPublicVerification,
}) => {
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState<MembershipCardRecord | null>(null);
  const [settings, setSettings] = useState<MembershipCardSettings | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && alumnus) {
      membershipCardService.getCardForAlumnus(alumnus.internalId).then(c => {
        setCard(c);
      });
      membershipCardService.getCardSettings().then(s => {
        setSettings(s);
      });

      // Save pass for offline readiness
      offlinePassStorage.savePass({
        alumniId: alumnus.internalId,
        fullName: alumnus.fullName || `${alumnus.firstName} ${alumnus.lastName}`,
        alumniNumber: alumnus.alumniNumber,
        cohort: String(alumnus.schoolHistory?.oLevel?.yearCompleted || alumnus.schoolHistory?.aLevel?.yearCompleted || '2022'),
        category: 'Official Membership ID',
        photoUrl: alumnus.photoUrl,
        verificationToken: `MOSA-PASS-${alumnus.alumniNumber}`,
        qrPayload: `https://mandelassalumni.com/?verify-card=${encodeURIComponent(alumnus.alumniNumber)}`,
        issuedAt: alumnus.verifiedAt || new Date().toISOString(),
        isValidated: alumnus.membershipStatus === 'ACTIVE' || alumnus.membershipStatus === 'APPROVED',
      });
    }
  }, [isOpen, alumnus]);

  if (!isOpen || !alumnus) return null;

  const handleCopyValidationNumber = () => {
    const val = card?.validationNumber || alumnus.alumniNumber;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const s = settings || await membershipCardService.getCardSettings();
      const currentCard: MembershipCardRecord = card || {
        id: 'temp',
        alumniId: alumnus.internalId,
        alumniNumber: alumnus.alumniNumber,
        validationNumber: 'MOSA-VAL-SAMPLE',
        verificationToken: alumnus.alumniNumber,
        status: 'ISSUED',
        issueNumber: 1,
        issuedAt: new Date().toISOString(),
        issuedBy: 'Secretariat',
        snapshot: membershipCardService.buildCardSnapshot(alumnus, s),
        history: [],
      };

      const doc = await membershipCardService.generateCardPdf(alumnus, currentCard, s, 'DUPLEX');
      const cleanNum = alumnus.alumniNumber.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`MOSA_ID_Card_${cleanNum}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7, 21, 43, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          textAlign: 'center',
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '1.25rem',
              top: '1.25rem',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>

          {/* Modal Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.45rem' }}>
              <Award size={14} /> OFFICIAL MOSA DIGITAL CREDENTIAL
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
              Digital Membership ID Card
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
              Mandela Secondary School Hoima • Founded 1997
            </p>
          </div>

          {/* Personalized ID Card */}
          <div style={{ marginBottom: '1.5rem' }}>
            <DigitalMembershipCard
              alumnus={alumnus}
              card={card}
              settings={settings || undefined}
              onOpenPublicVerification={onOpenPublicVerification}
              onRequestCorrection={() => setIsCorrectionModalOpen(true)}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <button
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  background: '#FFFFFF',
                  color: '#0B203E',
                  border: '1px solid #CBD5E1',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Printer size={16} color="#D97706" /> Print Card
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(11,32,62,0.2)',
                }}
              >
                <Download size={16} color="#F59E0B" />
                {isDownloading ? 'Generating...' : 'Download Print-Ready PDF'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyValidationNumber}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {copied ? <Check size={14} color="#047857" /> : <Copy size={14} />}
                {copied ? 'Copied Number!' : `Copy ${card?.validationNumber || alumnus.alumniNumber}`}
              </button>

              {onOpenPublicVerification && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPublicVerification(card?.verificationToken || alumnus.alumniNumber);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D97706',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ShieldCheck size={14} /> Verify Registry Record
                </button>
              )}

              <button
                onClick={() => setIsCorrectionModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <FileEdit size={14} /> Request Correction
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCorrectionModalOpen && (
        <CardCorrectionModal
          alumnus={alumnus}
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
        />
      )}
    </>
  );
};

export default DigitalMembershipCardModal;
