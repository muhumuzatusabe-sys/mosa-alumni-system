import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { dataService } from '../services/dataService';
import { X, Smartphone, Building2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const TreasurySettingsModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    mtnNumber: '0782 123456',
    mtnName: 'MANDELA SEC SCH HOIMA MOSA',
    airtelNumber: '0701 654321',
    airtelName: 'MANDELA OLD STUDENTS ASSOC',
    instructions: 'Include your full name and Alumni Number (or Application Ref) in the payment reason/reference.',
  });

  useEffect(() => {
    if (isOpen) {
      dataService.getSystemSettings().then(settings => {
        if (settings.mobileMoneySettings) {
          setForm({
            mtnNumber: settings.mobileMoneySettings.mtnNumber || '0782 123456',
            mtnName: settings.mobileMoneySettings.mtnName || 'MANDELA SEC SCH HOIMA MOSA',
            airtelNumber: settings.mobileMoneySettings.airtelNumber || '0701 654321',
            airtelName: settings.mobileMoneySettings.airtelName || 'MANDELA OLD STUDENTS ASSOC',
            instructions: settings.mobileMoneySettings.instructions || 'Include your full name and Alumni Number in the payment reference.',
          });
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await dataService.updateSystemSettings({
        mobileMoneySettings: {
          mtnNumber: form.mtnNumber.trim(),
          mtnName: form.mtnName.trim(),
          airtelNumber: form.airtelNumber.trim(),
          airtelName: form.airtelName.trim(),
          instructions: form.instructions.trim(),
        },
      });

      if (res.success) {
        setSuccessMsg('Treasury Mobile Money configurations saved successfully.');
        setTimeout(() => {
          if (onUpdated) onUpdated();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Failed to update treasury settings.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '560px', 
          width: '94%',
          borderRadius: '16px',
          padding: 0,
          overflow: 'hidden' 
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #07152B 0%, #0B203E 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid #D97706',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
              color: '#ffffff'
            }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 700 }}>
                Treasury Mobile Money Settings
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                Mandela Secondary School Hoima • Official Payment Accounts
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ color: '#CBD5E1', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', padding: '0.75rem 1rem', borderRadius: '6px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#D1FAE5', borderLeft: '4px solid #10B981', padding: '0.75rem 1rem', borderRadius: '6px', color: '#065F46', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* MTN Mobile Money */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#B45309', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
              MTN Mobile Money Merchant / Receiving Line
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>MTN Phone Number</label>
                <input
                  type="text"
                  value={form.mtnNumber}
                  onChange={e => setForm(p => ({ ...p, mtnNumber: e.target.value }))}
                  className="form-control"
                  placeholder="0782 123456"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Registered Account Name</label>
                <input
                  type="text"
                  value={form.mtnName}
                  onChange={e => setForm(p => ({ ...p, mtnName: e.target.value }))}
                  className="form-control"
                  placeholder="MANDELA SEC SCH HOIMA MOSA"
                  required
                />
              </div>
            </div>
          </div>

          {/* Airtel Money */}
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></span>
              Airtel Money Merchant / Receiving Line
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Airtel Phone Number</label>
                <input
                  type="text"
                  value={form.airtelNumber}
                  onChange={e => setForm(p => ({ ...p, airtelNumber: e.target.value }))}
                  className="form-control"
                  placeholder="0701 654321"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Registered Account Name</label>
                <input
                  type="text"
                  value={form.airtelName}
                  onChange={e => setForm(p => ({ ...p, airtelName: e.target.value }))}
                  className="form-control"
                  placeholder="MANDELA OLD STUDENTS ASSOC"
                  required
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Payment Reference Instructions</label>
            <textarea
              rows={2}
              value={form.instructions}
              onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
              className="form-control"
              placeholder="Guidance shown to alumni when sending mobile money..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#0B203E' }} disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Treasury Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreasurySettingsModal;
