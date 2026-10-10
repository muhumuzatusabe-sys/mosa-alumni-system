import React from 'react';
import { PaymentTransaction } from '../types';
import { Award, CheckCircle, Printer, X, ShieldCheck, Download, Calendar, Tag, CreditCard } from 'lucide-react';

interface Props {
  payment: PaymentTransaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ payment, onClose }) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ANNUAL_MEMBERSHIP':
        return `Annual Membership Subscription (${payment.subscriptionYear || new Date().getFullYear()})`;
      case 'PROJECT_DONATION':
        return payment.campaignTitle ? `Project Donation: ${payment.campaignTitle}` : 'School Project Donation';
      case 'EVENT_TICKET':
        return payment.eventTitle ? `Event Ticket: ${payment.eventTitle}` : 'Event Ticket';
      case 'WELFARE_CONTRIBUTION':
        return 'Alumni Welfare & Emergency Support Fund';
      default:
        return 'MOSA Alumni Contribution';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '680px', 
          width: '95%', 
          padding: '0', 
          overflow: 'hidden', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          background: '#FFFFFF',
        }}
      >
        {/* Printable Receipt Container */}
        <div id="mosa-printable-receipt" style={{ padding: '2.5rem', background: '#FFFFFF' }}>
          
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0B203E', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: '#0B203E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                fontWeight: 800,
                fontSize: '1.1rem',
                border: '2px solid #D97706'
              }}>
                MASSH
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Mandela Old Students Association
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  Mandela Secondary School Hoima • Est. 1997
                </div>
                <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                  OFFICIAL ELECTRONIC RECEIPT
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-block', 
                background: '#ECFDF5', 
                color: '#059669', 
                padding: '0.35rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.8rem', 
                fontWeight: 700,
                border: '1px solid #A7F3D0'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={13} /> {payment.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B203E', marginTop: '0.5rem' }}>
                {payment.receiptNumber || 'RECEIPT-PENDING'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Issued: {new Date(payment.verifiedAt || payment.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0B203E 0%, #1E3A8A 100%)', 
            borderRadius: '12px', 
            padding: '1.5rem', 
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '1.75rem'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Total Amount Received
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.25rem' }}>
              {formatUGX(payment.amount)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginTop: '0.25rem' }}>
              {getCategoryLabel(payment.category)}
            </div>
          </div>

          {/* Details Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ padding: '0.85rem 1.25rem', borderRight: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Received From:</span>
                <strong style={{ fontSize: '0.95rem', color: '#0B203E' }}>{payment.alumniName}</strong>
              </div>
              <div style={{ padding: '0.85rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Official Alumni Number:</span>
                <span style={{ 
                  display: 'inline-block',
                  background: '#FEF3C7', 
                  color: '#92400E', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  border: '1px solid #FDE68A'
                }}>
                  {payment.alumniNumber}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
              <div style={{ padding: '0.85rem 1.25rem', borderRight: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Payment Method:</span>
                <strong style={{ fontSize: '0.9rem', color: '#334155' }}>
                  {payment.paymentMethod.replace('_', ' ')}
                </strong>
              </div>
              <div style={{ padding: '0.85rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Transaction Reference / Slip:</span>
                <code style={{ fontSize: '0.85rem', color: '#0B203E', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>
                  {payment.transactionReference}
                </code>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '0.85rem 1.25rem', borderRight: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Contact / Payer Account:</span>
                <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                  {payment.payerPhoneOrAccount || payment.alumniEmail}
                </span>
              </div>
              <div style={{ padding: '0.85rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Verified By:</span>
                <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                  {payment.verifiedBy || 'MOSA Secretariat'}
                </span>
              </div>
            </div>
          </div>

          {payment.notes && (
            <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem' }}>
              <strong>Notes / Allocation:</strong> {payment.notes}
            </div>
          )}

          {/* Official Verification Seal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px dashed #CBD5E1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={20} />
              <span>Tamper-Resistant Digital Audit Record in MOSA Database</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontFamily: 'serif', 
                fontSize: '1rem', 
                fontStyle: 'italic', 
                color: '#0B203E',
                borderBottom: '1px solid #94A3B8',
                paddingBottom: '2px',
                marginBottom: '2px'
              }}>
                MOSA Finance Desk
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>
                Office of the Treasurer • MASSH
              </div>
            </div>
          </div>

        </div>

        {/* Modal Controls (Not Printed) */}
        <div style={{ 
          background: '#F8FAFC', 
          borderTop: '1px solid #E2E8F0', 
          padding: '1rem 2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <X size={16} /> Close
          </button>

          <button 
            type="button" 
            onClick={handlePrint} 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} /> Print / Save PDF Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
