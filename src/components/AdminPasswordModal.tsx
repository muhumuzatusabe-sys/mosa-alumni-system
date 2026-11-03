import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthUser } from '../types';
import { dataService } from '../services/dataService';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter admin password');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dataService.verifyAdminPasswordOnly(password.trim());
      if (res.success && res.user) {
        setPassword('');
        setErrorMsg('');
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Incorrect admin password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1200 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '380px', 
          width: '90%', 
          borderRadius: '14px', 
          padding: '1.5rem',
          background: '#FFFFFF',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Simple Header: Just "Admin" and Close X */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0A271B' }}>
            Admin
          </h3>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div 
            style={{ 
              background: '#FEF2F2', 
              color: '#DC2626', 
              border: '1px solid #FCA5A5', 
              padding: '0.65rem 0.85rem', 
              borderRadius: '8px', 
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Clean, simple form: Just Admin Password box, no added descriptions */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label 
              htmlFor="admin-password-field"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.45rem' }}
            >
              Admin Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={16} 
                color="#94A3B8" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                id="admin-password-field"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 2.4rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.92rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0A271B')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: '#0A271B',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
              marginTop: '0.25rem'
            }}
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
