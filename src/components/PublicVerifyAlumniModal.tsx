import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { membershipCardService } from '../services/membershipCardService';
import { CardVerificationResult } from '../types';
import { 
  X, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Award, 
  Lock, 
  Calendar, 
  User, 
  Building2,
  ArrowRight,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenRegister?: () => void;
}

export const PublicVerifyAlumniModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '',
  onOpenRegister 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cardResult, setCardResult] = useState<CardVerificationResult | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleVerify(undefined, initialQuery);
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);
    setCardResult(null);

    try {
      // 1. Check card verification first if token / validation number format
      const cardRes = await membershipCardService.verifyCard(q);
      if (cardRes.found) {
        setCardResult(cardRes);
      }

      // 2. Query registry by number
      const targetQuery = cardRes.found && cardRes.alumniNumber ? cardRes.alumniNumber : q;
      const res = await dataService.verifyAlumnusByNumber(targetQuery);
      
      // If card was found but member not directly found by query, adapt result
      if (!res.found && cardRes.found) {
        setResult({
          found: true,
          verified: cardRes.valid,
          fullName: cardRes.memberName,
          alumniNumber: cardRes.alumniNumber,
          membershipStatus: cardRes.valid ? 'ACTIVE' : 'SUPERSEDED',
          message: cardRes.message,
        });
      } else {
        setResult(res);
        // Also check if member has an active card
        if (!cardRes.found && res.found && res.alumnus) {
          const mCard = await membershipCardService.getCardForAlumnus(res.alumnus.internalId);
          if (mCard) {
            setCardResult({
              found: true,
              valid: mCard.status === 'ISSUED',
              state: mCard.status === 'ISSUED' ? 'VALID' : (mCard.status as any),
              validationNumber: mCard.validationNumber,
              alumniNumber: mCard.alumniNumber,
              memberName: res.fullName,
              issuedAt: mCard.issuedAt,
              message: mCard.status === 'ISSUED' ? 'Official active membership card' : `Card is ${mCard.status}`,
            });
          }
        }
      }
    } catch (err: any) {
      setResult({
        found: false,
        verified: false,
        message: err.message || 'Verification service temporarily unavailable.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (testNum: string) => {
    setQuery(testNum);
    handleVerify(undefined, testNum);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '620px', 
          width: '92%',
          borderRadius: '16px',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(11, 32, 62, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 60%, #18533B 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid #C68A24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Official Public Verification Desk
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#FCD34D' }}>
                Mandela Old Students Association (MOSA) • MASSH Hoima
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
            Verify official credentials, alumni numbers (e.g. <code>MA. 0001</code>), or card validation numbers (e.g. <code>MOSA-VAL-XXXXXX</code>) against the archival records of Mandela Secondary School Hoima.
          </p>

          {/* Search Form */}
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter MA Number or Card Validation No..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0B203E'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                background: '#0B203E'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </form>

          {/* Quick Examples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Quick search:</span>
            {['MA. 0001', 'MA. 0002'].map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => handleQuickSearch(ex)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  color: '#0B203E',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Verification Result */}
          {searched && result && (
            <div>
              {result.found && result.verified ? (
                /* VERIFIED RECORD CARD */
                <div style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '2px solid #059669',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #A7F3D0', paddingBottom: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#059669',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                    }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#047857', fontWeight: 800 }}>
                        Official Verification Confirmed
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064E3B' }}>
                        {result.fullName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                        Alumni Number
                      </div>
                      <div style={{ fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 800, color: '#064E3B' }}>
                        {result.alumniNumber}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                        Membership Status
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
                        {result.membershipStatus || 'ACTIVE'}
                      </div>
                    </div>

                    {cardResult?.validationNumber && (
                      <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                          ID Card Validation No.
                        </div>
                        <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 800, color: '#064E3B' }}>
                          {cardResult.validationNumber}
                        </div>
                      </div>
                    )}

                    <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>
                        Institution
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064E3B' }}>
                        MASSH (Est. 1997)
                      </div>
                    </div>
                  </div>

                  {/* Redaction Notice */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#065F46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255,255,255,0.6)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px'
                  }}>
                    <Lock size={12} style={{ flexShrink: 0 }} />
                    <span>Private contact and address details are protected under MOSA Privacy & Security Policy.</span>
                  </div>
                </div>
              ) : (
                /* NOT FOUND OR UNVERIFIED CARD */
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  color: '#991B1B'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <ShieldAlert size={24} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        Verification Record Not Found
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#7F1D1D', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                        {cardResult?.message || result.message}
                      </div>
                      {onOpenRegister && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenRegister();
                          }}
                          style={{
                            marginTop: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#0B203E',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Register for Official MA Number <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicVerifyAlumniModal;
