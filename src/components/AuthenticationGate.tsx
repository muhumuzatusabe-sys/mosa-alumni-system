import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  GraduationCap, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AuthUser } from '../types';

interface AuthenticationGateProps {
  onLoginSuccess: (user: AuthUser) => void;
  onCancel?: () => void;
}

export const AuthenticationGate: React.FC<AuthenticationGateProps> = ({ onLoginSuccess, onCancel }) => {
  // Tabs: 'create-account' | 'login' | 'reset-password' | 'admin-login'
  const [authMode, setAuthMode] = useState<'create-account' | 'login' | 'reset-password' | 'admin-login'>('create-account');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clear errors when switching modes
  const handleSwitchMode = (mode: 'create-account' | 'login' | 'reset-password' | 'admin-login') => {
    setAuthMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. CREATE ACCOUNT SUBMISSION
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The passwords entered do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.createAccount(cleanEmail, password);
      if (res.success && res.user) {
        setSuccessMessage('Account created successfully! Preparing your alumni experience...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. MEMBER LOGIN SUBMISSION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.login(cleanEmail, password, 'alumni');
      if (res.success && res.user) {
        setSuccessMessage('Welcome back! Restoring your session...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Invalid email or password. Please verify your credentials and try again.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to log in at this moment. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // 3. ADMIN LOGIN SUBMISSION
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter your administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.login(cleanEmail, password, 'admin');
      if (res.success && res.user) {
        setSuccessMessage('Administrator authenticated. Launching control console...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Administrator authentication failed. Unauthorized credentials.');
      }
    } catch (err: any) {
      setErrorMessage('Administrator authentication service error.');
    } finally {
      setLoading(false);
    }
  };

  // 4. PASSWORD RESET SUBMISSION
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.resetPassword(cleanEmail);
      setSuccessMessage(res.message);
    } catch {
      setSuccessMessage('If an account exists for this email address, password reset instructions have been dispatched.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem 1rem',
        background: 'radial-gradient(ellipse at top, #113D2B 0%, #0A271B 60%, #05160F 100%)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative Brand Background Glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198, 138, 36, 0.08) 0%, rgba(10, 39, 27, 0) 70%)',
          top: '10%',
          pointerEvents: 'none',
        }}
      />

      {/* Main Authentication Card */}
      <div
        className="auth-gate-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(198, 138, 36, 0.25)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
          border: '1px solid rgba(229, 223, 209, 0.8)',
        }}
      >
        {/* Card Header Branding */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)',
            padding: '2rem 1.75rem 1.75rem 1.75rem',
            textAlign: 'center',
            color: '#FFFFFF',
            borderBottom: '3px solid #C68A24',
            position: 'relative',
          }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title="Return to MOSA Welcome Experience"
            >
              <ArrowLeft size={14} />
              <span>Welcome Page</span>
            </button>
          )}

          {/* MOSA Crest Badge */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
              margin: '0 auto 0.85rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <GraduationCap size={30} color="#FFFFFF" />
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#FCD34D',
              fontWeight: 800,
              marginBottom: '0.2rem',
            }}
          >
            Mandela Old Students Association
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              letterSpacing: '0.01em',
              margin: 0,
              color: '#FFFFFF',
            }}
          >
            MASSH ALUMNI PORTAL
          </h1>

          <p
            style={{
              fontSize: '0.86rem',
              color: '#CBD5E1',
              margin: '0.45rem 0 0 0',
              fontWeight: 400,
              fontStyle: 'italic',
            }}
          >
            "Your connection to the MASSH alumni community."
          </p>
        </div>

        {/* Tab Switcher (Create Account vs Log In) */}
        {authMode !== 'admin-login' && authMode !== 'reset-password' && (
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              borderBottom: '1px solid #E2E8F0',
              padding: '0.35rem',
              gap: '0.35rem',
            }}
          >
            <button
              type="button"
              id="tab-btn-create-account"
              onClick={() => handleSwitchMode('create-account')}
              style={{
                flex: 1,
                padding: '0.7rem 0.5rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: authMode === 'create-account' ? '#FFFFFF' : 'transparent',
                color: authMode === 'create-account' ? '#0A271B' : '#64748B',
                boxShadow: authMode === 'create-account' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <UserPlus size={16} color={authMode === 'create-account' ? '#C68A24' : '#94A3B8'} />
              Create Account
            </button>

            <button
              type="button"
              id="tab-btn-login"
              onClick={() => handleSwitchMode('login')}
              style={{
                flex: 1,
                padding: '0.7rem 0.5rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: authMode === 'login' ? '#FFFFFF' : 'transparent',
                color: authMode === 'login' ? '#0A271B' : '#64748B',
                boxShadow: authMode === 'login' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <LogIn size={16} color={authMode === 'login' ? '#0A271B' : '#94A3B8'} />
              Log In
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                color: '#991B1B',
                fontSize: '0.85rem',
                lineHeight: 1.45,
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '10px',
                color: '#166534',
                fontSize: '0.85rem',
                lineHeight: 1.45,
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* VIEW 1: CREATE ACCOUNT */}
          {authMode === 'create-account' && (
            <form onSubmit={handleCreateAccount}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  htmlFor="register-email"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#113D2B')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  htmlFor="register-password"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Password <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>(minimum 6 characters)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.7rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#113D2B')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <label
                  htmlFor="register-confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.7rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#113D2B')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: '4px',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-create-account"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #113D2B 0%, #0A271B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(17, 61, 43, 0.28)',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '1.15rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C68A24',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Log In here
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: LOG IN */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#113D2B')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#1E293B',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('reset-password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C68A24',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.7rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#113D2B')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #113D2B 0%, #0A271B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(17, 61, 43, 0.28)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Log In</span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '1.15rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('create-account')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C68A24',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {authMode === 'reset-password' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <KeyRound size={36} color="#C68A24" style={{ margin: '0 auto 0.5rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.35rem 0', color: '#0A271B', fontWeight: 800 }}>
                  Reset Your Password
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                  Enter your email address and we'll dispatch instructions to reset your password securely.
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="reset-email"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-reset-password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #113D2B 0%, #0A271B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(17, 61, 43, 0.28)',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                <span>Send Password Reset</span>
              </button>

              <div style={{ marginTop: '1.15rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ArrowLeft size={14} /> Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: SEPARATE DISCREET ADMINISTRATOR ACCESS (Section 6) */}
          {authMode === 'admin-login' && (
            <form onSubmit={handleAdminLogin}>
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                }}
              >
                <ShieldCheck size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#92400E' }}>
                    MOSA Secretariat & Administrator Gate
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '0.15rem' }}>
                    Restricted to authorized MASSH executive officers and system administrators.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  htmlFor="admin-email"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Administrator Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@massh.ac.ug"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '0.4rem',
                  }}
                >
                  Administrator Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.7rem 0.75rem 2.6rem',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-admin-login"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #92400E 0%, #78350F 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(146, 64, 14, 0.28)',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                <span>Authenticate Administrator</span>
              </button>

              <div style={{ marginTop: '1.15rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ArrowLeft size={14} /> Return to Member Log In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Discreet Administrator Link at the Bottom (Section 6 Requirement) */}
        {authMode !== 'admin-login' && (
          <div
            style={{
              padding: '0.85rem 1.75rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              id="link-admin-discreet"
              onClick={() => handleSwitchMode('admin-login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#64748B')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <ShieldCheck size={13} />
              <span>Official Secretariat & Administration Access</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer System Meta */}
      <div
        style={{
          marginTop: '1.75rem',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.55)',
          fontSize: '0.78rem',
          lineHeight: 1.5,
          zIndex: 10,
        }}
      >
        <div>Mandela Secondary School Hoima • Est. 1997</div>
        <div>Operated by Mandela Old Students Association (MOSA)</div>
      </div>
    </div>
  );
};

export default AuthenticationGate;
