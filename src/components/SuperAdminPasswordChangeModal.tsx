import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AuthUser } from '../types';
import { dataService } from '../services/dataService';

interface SuperAdminPasswordChangeModalProps {
  currentUser: AuthUser;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SuperAdminPasswordChangeModal: React.FC<SuperAdminPasswordChangeModalProps> = ({
  currentUser,
  onSuccess,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your initial temporary password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New administrator password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be identical to the initial temporary password.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.changeSuperAdminPassword(
        newPassword,
        currentPassword,
        currentUser.email
      );

      if (!res.success) {
        setError(res.error || 'Failed to update password. Please check your credentials.');
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while saving password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 22, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0A271B 0%, #113D2B 100%)',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '2rem',
          color: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(217, 119, 6, 0.2)',
              border: '2px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <ShieldAlert size={28} color="#FBBF24" />
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#FCD34D',
              fontWeight: 800,
            }}
          >
            Security Compliance Check
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: '0.2rem 0 0.5rem 0' }}>
            Change Initial Admin Password
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
            You are logged in with an initial temporary password. To access the MOSA Administrative Dashboard, you must configure a secure administrator password.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#FCA5A5',
              fontSize: '0.84rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Current Temporary Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
              Current Initial Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (e.g. admin123)"
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 2.5rem 0.7rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
              New Administrator Password (Min. 8 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create strong new password"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '0.7rem 2.5rem 0.7rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
              Confirm New Password
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#05160F',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Save Password & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
