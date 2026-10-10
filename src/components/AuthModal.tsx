import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { AuthUser } from '../types';
import { X, LogIn, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await dataService.login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'alumni') => {
    if (role === 'admin') {
      setEmail('admin@massh.ac.ug');
      setPassword('admin123');
    } else {
      setEmail('muhammad.z@alumni.massh.ac.ug');
      setPassword('alumni123');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E' }}>MOSA Portal Sign In</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Mandela Secondary School Hoima Alumni Association
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ padding: '0.65rem 0.85rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label required">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="e.g. admin@massh.ac.ug or alumni email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label required">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/* Quick Demo Fill Buttons */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
                Quick Test Credentials:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    fontWeight: 600,
                    color: '#0B203E',
                  }}
                >
                  <ShieldCheck size={14} color="#D97706" /> Admin (MASSH)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('alumni')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    fontWeight: 600,
                    color: '#059669',
                  }}
                >
                  <UserCheck size={14} color="#059669" /> Alumnus (MA. 0001)
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
