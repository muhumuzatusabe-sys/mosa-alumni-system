import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { AuthUser, AlumniProfile } from '../types';
import { 
  X, 
  LogIn, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  Lock,
  Mail
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialPortal?: 'alumni' | 'admin';
}

export const AuthModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  initialPortal = 'alumni'
}) => {
  // Portal tab: alumni vs admin
  const [portal, setPortal] = useState<'alumni' | 'admin'>(initialPortal);
  
  // Alumni submode: 'signin' vs 'create_password'
  const [alumniMode, setAlumniMode] = useState<'signin' | 'create_password'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification for Password Creation
  const [pwdStep, setPwdStep] = useState<'details' | 'otp_verify'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status and verification states
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Detected alumnus profile during password creation
  const [verifiedAlumnus, setVerifiedAlumnus] = useState<AlumniProfile | null>(null);

  // Sync initial portal prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setPortal(initialPortal);
      setErrorMsg('');
      setSuccessMsg('');
      if (initialPortal === 'admin') {
        setEmail(prev => prev || 'admin@massh.ac.ug');
      }
    }
  }, [isOpen, initialPortal]);

  // Reset errors when switching portal or submode
  const handleSwitchPortal = (newPortal: 'alumni' | 'admin') => {
    setPortal(newPortal);
    setErrorMsg('');
    setSuccessMsg('');
    if (newPortal === 'admin' && (!email || email.includes('alumni'))) {
      setEmail('admin@massh.ac.ug');
      setPassword('');
    } else if (newPortal === 'alumni' && email === 'admin@massh.ac.ug') {
      setEmail('');
      setPassword('');
    }
  };

  // Check alumnus email against database
  const handleCheckEmail = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setVerifiedAlumnus(null);
      return;
    }
    setVerifyingEmail(true);
    try {
      const res = await dataService.checkEmailStatus(emailToCheck);
      if (res.isAlumnus && res.alumnus) {
        setVerifiedAlumnus(res.alumnus);
        setErrorMsg('');
      } else if (res.isAdmin) {
        setVerifiedAlumnus(null);
        setErrorMsg('This is an administrator email. Please switch to the Administrator tab.');
      } else {
        setVerifiedAlumnus(null);
      }
    } catch {
      setVerifiedAlumnus(null);
    } finally {
      setVerifyingEmail(false);
    }
  };

  if (!isOpen) return null;

  // Handle Alumni Sign In
  const handleAlumniSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await dataService.login(email, password, 'alumni');
      if (res.success && res.user) {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 300);
      } else if (res.needsPasswordCreation) {
        // Automatically pivot to create password mode
        setAlumniMode('create_password');
        setErrorMsg('');
        if (res.alumnusName) {
          handleCheckEmail(email);
        }
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP for password creation
  const handleRequestPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await dataService.sendRegistrationOtp(email);
      if (res.success) {
        setPwdStep('otp_verify');
        setSuccessMsg(`A 6-digit verification code has been dispatched to ${email}. Please check your inbox and enter it below.`);
        setSimulatedOtpNotice(null);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Failed to send verification code. Please check your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while sending the code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize Password Creation
  const handleVerifyOtpAndCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const otpCheck = await dataService.verifyRegistrationOtp(email, otpCode);
      if (!otpCheck.success) {
        setErrorMsg(otpCheck.error || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      const res = await dataService.createAlumniPassword(email, password);
      if (res.success && res.user) {
        setSuccessMsg('Email verified and password created successfully! Signing you in...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Failed to create password. Please check your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating your password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Administrator Sign In (Password Only - nothing else asked)
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password || !password.trim()) {
      setErrorMsg('Please enter the administrative password.');
      return;
    }

    setLoading(true);

    try {
      const res = await dataService.verifyAdminPasswordOnly(password);
      if (res.success && res.user) {
        setSuccessMsg('Administrative access granted. Welcome!');
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 300);
      } else {
        setErrorMsg(res.error || 'Incorrect administrator password. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during administrative sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for administrator access
  const handleQuickFill = (type: 'admin' | 'superadmin') => {
    setErrorMsg('');
    setSuccessMsg('');
    setPortal('admin');
    if (type === 'superadmin') {
      setEmail('superadmin@mosa.org');
      setPassword('admin123');
    } else {
      setEmail('admin@massh.ac.ug');
      setPassword('admin123');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200, padding: '1rem' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '470px', 
          width: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(10, 39, 27, 0.25)',
          border: '1px solid #E5DFD1',
          background: '#FFFFFF'
        }}
      >
        {/* Modal Top Bar */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #113D2B 0%, #0A271B 100%)', 
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'rgba(198, 138, 36, 0.2)', 
                  border: '1px solid rgba(198, 138, 36, 0.4)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {portal === 'admin' ? (
                  <ShieldCheck size={22} color="#FCD34D" />
                ) : (
                  <GraduationCap size={22} color="#FCD34D" />
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800 }}>
                  MASSH ALUMNI PORTAL
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.1rem 0 0 0', color: '#FAF8F3', letterSpacing: '-0.01em' }}>
                  {portal === 'admin' ? 'MOSA Administrative Portal' : 'MOSA Member Sign In'}
                </h3>
                <p style={{ fontSize: '0.78rem', margin: 0, color: '#E5DFD1', opacity: 0.85 }}>
                  Mandela Secondary School Hoima Alumni Association
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                border: 'none', 
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer', 
                color: '#E5DFD1',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Portal Switcher Tabs - Strictly Hidden in Admin Mode */}
          {portal !== 'admin' && (
            <div 
              style={{ 
                display: 'flex', 
                background: 'rgba(0, 0, 0, 0.25)', 
                padding: '0.25rem', 
                borderRadius: '10px', 
                marginTop: '1rem',
                gap: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => handleSwitchPortal('alumni')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: portal === 'alumni' ? '#FFFFFF' : 'transparent',
                  color: portal === 'alumni' ? '#113D2B' : '#E5DFD1',
                  fontWeight: portal === 'alumni' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  boxShadow: portal === 'alumni' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <UserCheck size={15} color={portal === 'alumni' ? '#113D2B' : '#E5DFD1'} />
                <span>Alumni Member</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPortal('admin')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: portal === 'admin' ? '#FFFFFF' : 'transparent',
                  color: portal === 'admin' ? '#113D2B' : '#E5DFD1',
                  fontWeight: portal === 'admin' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  boxShadow: portal === 'admin' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <ShieldCheck size={15} color={portal === 'admin' ? '#C68A24' : '#E5DFD1'} />
                <span>Administrator</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          
          {/* Error Banner */}
          {errorMsg && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                borderRadius: '10px', 
                color: '#991B1B', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.6rem', 
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.45
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                background: '#ECFDF5', 
                border: '1px solid #A7F3D0', 
                borderRadius: '10px', 
                color: '#065F46', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: ALUMNI PORTAL                                      */}
          {/* ========================================================= */}
          {portal === 'alumni' && (
            <div>
              {/* Alumni Mode Switch (Sign In vs Create Password) */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid #F1ECE1'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#113D2B' }}>
                    {alumniMode === 'signin' ? 'Sign In to Your Account' : 'Set Your Account Password'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                    {alumniMode === 'signin' 
                      ? 'Sign in using your permanent alumni email address.' 
                      : 'Create a password linked permanently to your registered email.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    if (alumniMode === 'signin') {
                      setAlumniMode('create_password');
                      if (email) handleCheckEmail(email);
                    } else {
                      setAlumniMode('signin');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C68A24',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '6px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAF7EE'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {alumniMode === 'signin' ? (
                    <>
                      <span>First time? Create password</span>
                      <ArrowRight size={13} />
                    </>
                  ) : (
                    <>
                      <span>Back to Sign In</span>
                    </>
                  )}
                </button>
              </div>

              {/* -------------------------------------------------- */}
              {/* SUBMODE A: ALUMNI SIGN IN                          */}
              {/* -------------------------------------------------- */}
              {alumniMode === 'signin' && (
                <form onSubmit={handleAlumniSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B' }}>
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. member@alumni.massh.ac.ug or personal email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.9rem'
                      }}
                    />
                    <span style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                      Your email permanently identifies your MOSA membership.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B', marginBottom: '0.25rem' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAlumniMode('create_password');
                          if (email) handleCheckEmail(email);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#C68A24',
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Create / Reset Password
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                          padding: '0.75rem 2.5rem 0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.9rem',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
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
                          color: '#9CA3AF'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: '#113D2B',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 10px rgba(17, 61, 43, 0.2)'
                    }}
                  >
                    <LogIn size={18} />
                    <span>{loading ? 'Signing In...' : 'Sign In as Member'}</span>
                  </button>
                </form>
              )}

              {/* -------------------------------------------------- */}
              {/* SUBMODE B: ALUMNI CREATE / RESET PASSWORD          */}
              {/* -------------------------------------------------- */}
              {alumniMode === 'create_password' && (
                <>
                  {pwdStep === 'details' ? (
                    <form onSubmit={handleRequestPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B' }}>
                      Your Registered Email Address
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="e.g. yourname@alumni.massh.ac.ug or personal email"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value);
                          if (e.target.value.includes('@')) {
                            handleCheckEmail(e.target.value);
                          } else {
                            setVerifiedAlumnus(null);
                          }
                        }}
                        onBlur={() => handleCheckEmail(email)}
                        style={{
                          flex: 1,
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCheckEmail(email)}
                        disabled={verifyingEmail || !email}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          background: '#FAF7EE',
                          border: '1px solid #E5DFD1',
                          color: '#113D2B',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {verifyingEmail ? 'Checking...' : 'Check'}
                      </button>
                    </div>
                  </div>

                  {/* Verified Alumnus Profile Badge */}
                  {verifiedAlumnus && (
                    <div 
                      style={{ 
                        padding: '0.85rem 1rem', 
                        background: '#F0FDF4', 
                        border: '1px solid #BBF7D0', 
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: '#113D2B', 
                          color: '#FCD34D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}
                      >
                        {verifiedAlumnus.firstName[0]}{verifiedAlumnus.lastName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#113D2B', fontSize: '0.88rem' }}>
                            {verifiedAlumnus.firstName} {verifiedAlumnus.lastName}
                          </span>
                          <span 
                            style={{ 
                              background: '#DCFCE7', 
                              color: '#15803D', 
                              fontSize: '0.72rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px',
                              fontWeight: 700
                            }}
                          >
                            {verifiedAlumnus.alumniNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '2px' }}>
                          Verified Record in MASSH Registry • Permanent Link Ready
                        </div>
                      </div>
                      <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0 }} />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B' }}>
                      Create New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        className="form-input"
                        placeholder="At least 4 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                          padding: '0.75rem 2.5rem 0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.9rem',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
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
                          color: '#9CA3AF'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        className="form-input"
                        placeholder="Re-type your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{
                          padding: '0.75rem 2.5rem 0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.9rem',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: '#113D2B',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 10px rgba(17, 61, 43, 0.2)'
                    }}
                  >
                    <ShieldCheck size={18} />
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code & Continue'}</span>
                  </button>
                </form>
              ) : (
                /* OTP VERIFICATION VIEW FOR PASSWORD CREATION */
                <form onSubmit={handleVerifyOtpAndCreatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ 
                    background: '#F8FAFC', 
                    border: '1.5px solid #E2E8F0', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: '#ECFDF5', 
                      color: '#059669', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem auto'
                    }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      Verify Your Email Address
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                      We sent a 6-digit confirmation code to:
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#113D2B', marginTop: '0.1rem' }}>
                      {email}
                    </div>

                    <div style={{
                      marginTop: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      background: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      color: '#166534',
                      lineHeight: 1.45,
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        <Mail size={16} />
                        <span>Check Your Inbox</span>
                      </div>
                      A 6-digit confirmation code was sent to your email. Please check your inbox (and spam/junk folder) and enter it below.
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#113D2B', textAlign: 'center', display: 'block' }}>
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #113D2B',
                        borderRadius: '8px',
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        letterSpacing: '6px',
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#0F172A',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.trim().length < 4}
                    className="btn btn-primary"
                    style={{
                      marginTop: '0.25rem',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: '#113D2B',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      border: 'none',
                      cursor: (loading || otpCode.trim().length < 4) ? 'not-allowed' : 'pointer',
                      opacity: (loading || otpCode.trim().length < 4) ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 10px rgba(17, 61, 43, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{loading ? 'Verifying & Setting Password...' : 'Verify Email & Finish'}</span>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPwdStep('details');
                        setOtpCode('');
                        setErrorMsg('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleRequestPasswordOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#9CA3AF' : '#C68A24',
                        fontWeight: 700,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        padding: 0
                      }}
                    >
                      {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ADMINISTRATOR PORTAL                               */}
          {/* ========================================================= */}
          {portal === 'admin' && (
            <div>
              {/* Admin Banner */}
              <div 
                style={{ 
                  background: '#FEF3C7', 
                  border: '1.5px solid #FCD34D', 
                  borderRadius: '12px', 
                  padding: '1rem', 
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#B45309',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400E' }}>
                    Executive Administrative Access
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Authorized members sign in using the Admin Password. Nothing else is required.
                  </div>
                </div>
              </div>

              <form onSubmit={handleAdminSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label required" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#113D2B', display: 'block', marginBottom: '0.45rem' }}>
                    Admin Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      color="#94A3B8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      className="form-input"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        padding: '0.8rem 2.6rem 0.8rem 2.6rem',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.95rem',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
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
                        color: '#9CA3AF'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.45rem' }}>
                    Default Admin Password: <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>admin123</code>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.28)'
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{loading ? 'Authenticating...' : 'Access Admin Panel'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Quick Member Help Panel only for alumni mode */}
          {portal === 'alumni' && (
            <div 
              style={{ 
                marginTop: '1.5rem', 
                padding: '0.85rem', 
                background: '#F8F6F0', 
                border: '1px dashed #E5DFD1', 
                borderRadius: '10px',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#113D2B', marginBottom: '0.35rem' }}>
                <GraduationCap size={14} color="#C68A24" />
                <span>Need assistance signing into your alumni account?</span>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', lineHeight: 1.45 }}>
                Ensure you use the email address associated with your MASSH registration. For support, contact secretariat@massh.ac.ug.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
