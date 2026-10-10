import React, { useState, useEffect } from 'react';
import { 
  AuthUser, 
  AlumniProfile, 
  PaymentCategory, 
  PaymentMethod, 
  DonationCampaign,
  MOSAEvent,
  SystemSettings
} from '../types';
import { dataService } from '../services/dataService';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  currentAlumnus?: AlumniProfile | null;
  campaigns: DonationCampaign[];
  defaultCategory?: PaymentCategory;
  defaultCampaignId?: string;
  defaultAmount?: number;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  currentAlumnus,
  campaigns,
  defaultCategory = 'ANNUAL_MEMBERSHIP',
  defaultCampaignId,
  defaultAmount,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<PaymentCategory>(defaultCategory);
  const [campaignId, setCampaignId] = useState<string>(defaultCampaignId || (campaigns[0]?.id || ''));
  const [amount, setAmount] = useState<number>(defaultAmount || (defaultCategory === 'ANNUAL_MEMBERSHIP' ? 50000 : 100000));
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [transactionReference, setTransactionReference] = useState('');
  const [payerPhoneOrAccount, setPayerPhoneOrAccount] = useState(currentAlumnus?.phone || '');
  const [notes, setNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedPaymentId, setSubmittedPaymentId] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    dataService.getSystemSettings().then(setSystemSettings).catch(console.error);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const currentYear = new Date().getFullYear();

  const handlePresetAmount = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw);
    if (raw) {
      setAmount(parseInt(raw, 10));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || amount < 1000) {
      setError('Please enter a valid amount of at least UGX 1,000');
      return;
    }

    if (!transactionReference.trim()) {
      setError('Please provide the transaction reference ID, mobile money code, or bank slip number');
      return;
    }

    // Require either verified alumnus or user
    const alumniId = currentAlumnus?.internalId || currentUser?.alumniId || 'guest-donor';
    const alumniNumber = currentAlumnus?.alumniNumber || currentUser?.alumniNumber || 'GUEST';
    const alumniName = currentAlumnus 
      ? `${currentAlumnus.firstName} ${currentAlumnus.lastName}` 
      : currentUser?.displayName || 'MOSA Contributor';
    const alumniEmail = currentAlumnus?.email || currentUser?.email || 'contributor@massh.ac.ug';

    const selectedCampaign = campaigns.find(c => c.id === campaignId);

    setSubmitting(true);
    try {
      const res = await dataService.submitPayment({
        alumniId,
        alumniNumber,
        alumniName,
        alumniEmail,
        alumniPhone: payerPhoneOrAccount,
        category,
        campaignId: category === 'PROJECT_DONATION' ? campaignId : undefined,
        campaignTitle: category === 'PROJECT_DONATION' ? selectedCampaign?.title : undefined,
        subscriptionYear: category === 'ANNUAL_MEMBERSHIP' ? currentYear : undefined,
        amount,
        currency: 'UGX',
        paymentMethod,
        transactionReference: transactionReference.trim(),
        payerPhoneOrAccount: payerPhoneOrAccount.trim(),
        notes: notes.trim() || undefined,
      });

      if (res.success && res.id) {
        setSubmittedPaymentId(res.id);
        onSuccess();
      } else {
        setError(res.error || 'Failed to submit payment record');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#0B203E', margin: 0, fontWeight: 700 }}>
              Make a Payment / Contribution
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Mandela Old Students Association (MOSA) • Official Finance Portal
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {submittedPaymentId ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#ECFDF5', 
              color: '#059669', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem auto' 
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0B203E', marginBottom: '0.5rem' }}>
              Payment Reference Recorded!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Your transaction reference <strong>{transactionReference}</strong> for <strong>UGX {amount.toLocaleString()}</strong> has been submitted to the MOSA Treasurer desk for verification.
            </p>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div>• Once confirmed against our bank/mobile money statement, an official numbered receipt will be issued.</div>
              {category === 'ANNUAL_MEMBERSHIP' && (
                <div style={{ marginTop: '4px' }}>
                  • Your MOSA Annual Membership status will be automatically refreshed to <strong>ACTIVE ({currentYear})</strong>.
                </div>
              )}
            </div>
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Contribution Purpose */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                1. Select Payment Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setCategory('ANNUAL_MEMBERSHIP'); setAmount(50000); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: category === 'ANNUAL_MEMBERSHIP' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                    background: category === 'ANNUAL_MEMBERSHIP' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>
                    Annual Alumni Contribution
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    UGX 50,000 / Year (Voluntary)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategory('PROJECT_DONATION'); setAmount(100000); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: category === 'PROJECT_DONATION' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                    background: category === 'PROJECT_DONATION' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>
                    Project Donation
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Support School Expansion
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategory('WELFARE_CONTRIBUTION'); setAmount(50000); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: category === 'WELFARE_CONTRIBUTION' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                    background: category === 'WELFARE_CONTRIBUTION' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>
                    Alumni Welfare Fund
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Emergency & Sickness Aid
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategory('OTHER'); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: category === 'OTHER' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                    background: category === 'OTHER' ? '#EFF6FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>
                    General Contribution
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Other MOSA Giving
                  </div>
                </button>
              </div>
            </div>

            {/* Campaign Selection if Project Donation */}
            {category === 'PROJECT_DONATION' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Select Development Campaign
                </label>
                <select
                  value={campaignId}
                  onChange={e => setCampaignId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Goal: UGX {(c.targetAmount / 1000000).toFixed(0)}M)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 2: Amount in UGX */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                2. Contribution Amount (UGX)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {[30000, 50000, 100000, 250000, 500000, 1000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetAmount(val)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: amount === val && !customAmount ? '2px solid #0B203E' : '1px solid #CBD5E1',
                      background: amount === val && !customAmount ? '#0B203E' : '#FFFFFF',
                      color: amount === val && !customAmount ? '#FFFFFF' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    UGX {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}K`}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or enter custom amount in UGX (e.g. 150000)"
                value={customAmount}
                onChange={handleCustomAmountChange}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>

            {/* Step 3: Payment Channel & Instructions */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                3. Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MTN_MOMO')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: paymentMethod === 'MTN_MOMO' ? '2px solid #EAB308' : '1px solid #CBD5E1',
                    background: paymentMethod === 'MTN_MOMO' ? '#FEFCE8' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#854D0E',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Smartphone size={18} />
                  <span>MTN MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: paymentMethod === 'AIRTEL_MONEY' ? '2px solid #EF4444' : '1px solid #CBD5E1',
                    background: paymentMethod === 'AIRTEL_MONEY' ? '#FEF2F2' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#991B1B',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Smartphone size={18} />
                  <span>Airtel Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: paymentMethod === 'BANK_TRANSFER' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    background: paymentMethod === 'BANK_TRANSFER' ? '#EFF6FF' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#1E40AF',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Building2 size={18} />
                  <span>Bank Deposit</span>
                </button>
              </div>

              {/* Official Account Box */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                {paymentMethod === 'MTN_MOMO' && (
                  <div>
                    <div style={{ color: '#854D0E', fontWeight: 700, marginBottom: '4px' }}>
                      MTN Mobile Money Pay:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span>Pay to / Merchant: <strong style={{ fontSize: '1rem', color: '#0B203E' }}>{systemSettings?.mobileMoneySettings?.mtnNumber || '0782 123456 (Code: 654321)'}</strong></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(systemSettings?.mobileMoneySettings?.mtnNumber || '654321', 'mtn')}
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        {copiedCode === 'mtn' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy
                      </button>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px' }}>
                      Recipient Name: <em>{systemSettings?.mobileMoneySettings?.mtnName || 'Mandela Old Students Association'}</em>
                    </div>
                    {systemSettings?.mobileMoneySettings?.instructions && (
                      <div style={{ color: '#0284C7', fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                        Note: {systemSettings.mobileMoneySettings.instructions}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'AIRTEL_MONEY' && (
                  <div>
                    <div style={{ color: '#991B1B', fontWeight: 700, marginBottom: '4px' }}>
                      Airtel Money Pay:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span>Pay to / Merchant: <strong style={{ fontSize: '1rem', color: '#0B203E' }}>{systemSettings?.mobileMoneySettings?.airtelNumber || '0701 654321 (Code: 123456)'}</strong></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(systemSettings?.mobileMoneySettings?.airtelNumber || '123456', 'airtel')}
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        {copiedCode === 'airtel' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy
                      </button>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px' }}>
                      Recipient Name: <em>{systemSettings?.mobileMoneySettings?.airtelName || 'Mandela Old Students Association'}</em>
                    </div>
                    {systemSettings?.mobileMoneySettings?.instructions && (
                      <div style={{ color: '#0284C7', fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                        Note: {systemSettings.mobileMoneySettings.instructions}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div>
                    <div style={{ color: '#1E40AF', fontWeight: 700, marginBottom: '4px' }}>
                      Bank Account Details:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>Stanbic Bank Hoima Branch</strong> — A/C: <strong style={{ fontSize: '0.95rem', color: '#0B203E' }}>9030012345678</strong></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('9030012345678', 'bank')}
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        {copiedCode === 'bank' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy
                      </button>
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '2px' }}>
                      Account Name: <em>Mandela Old Students Association</em>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Reference Details */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                4. Transaction Reference / SMS Code / Deposit Slip <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MP261003.1420.H12345 or STB-998877"
                value={transactionReference}
                onChange={e => setTransactionReference(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px' }}>
                Enter the confirmation code from your telecom SMS or bank teller slip for reconciliation.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Payer Phone / Account
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0772 123456"
                  value={payerPhoneOrAccount}
                  onChange={e => setPayerPhoneOrAccount(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid on behalf of Class of 2004"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '0.65rem 1.75rem' }}
              >
                {submitting ? 'Submitting Reference...' : `Submit UGX ${amount.toLocaleString()}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
