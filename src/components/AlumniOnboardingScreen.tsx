import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Users, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { AuthUser } from '../types';

interface AlumniOnboardingScreenProps {
  currentUser: AuthUser;
  onRegister: () => void;
  onSkip: () => void;
}

export const AlumniOnboardingScreen: React.FC<AlumniOnboardingScreenProps> = ({
  currentUser,
  onRegister,
  onSkip,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at top, #113D2B 0%, #0A271B 65%, #05160F 100%)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative Glow */}
      <div
        style={{
          position: 'absolute',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(198, 138, 36, 0.12) 0%, rgba(10, 39, 27, 0) 70%)',
          top: '12%',
          pointerEvents: 'none',
        }}
      />

      <div
        className="onboarding-card"
        style={{
          maxWidth: '540px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(198, 138, 36, 0.3)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
          border: '1.5px solid rgba(229, 223, 209, 0.9)',
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)',
            padding: '2.25rem 2rem 2rem 2rem',
            textAlign: 'center',
            color: '#FFFFFF',
            borderBottom: '3px solid #C68A24',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
              margin: '0 auto 1rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <GraduationCap size={34} color="#FFFFFF" />
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#FCD34D',
              fontWeight: 800,
              marginBottom: '0.35rem',
            }}
          >
            Account Activated • {currentUser.displayName ? `Welcome ${currentUser.displayName}` : 'Welcome to the MOSA Community'}
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '-0.01em',
              margin: 0,
              color: '#FFFFFF',
              lineHeight: 1.25,
            }}
          >
            Register
          </h1>

          <p
            style={{
              fontSize: '0.92rem',
              color: '#E2E8F0',
              margin: '0.65rem auto 0 auto',
              maxWidth: '440px',
              lineHeight: 1.5,
            }}
          >
            Connect your account to the MASSH alumni community by submitting your alumni registration details.
          </p>
        </div>

        {/* Benefits Breakdown */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748B',
                fontWeight: 800,
                marginBottom: '0.75rem',
              }}
            >
              Why register your alumni profile?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Award size={18} color="#B45309" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                    Official MASSH Alumni Number
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                    Receive your verified sequential number (e.g. <code>MA. 0001</code>) and printable digital alumni pass.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Users size={18} color="#059669" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                    Verified Registry & Class Connections
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                    Connect with your O-Level and A-Level classmates, stream peers, and institutional chapters.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Calendar size={18} color="#2563EB" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                    Reunions, Voting & Community Giving
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                    Vote in association elections, attend homecoming assemblies, and mentor younger scholars.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Clear Choices (Section 4 Requirement) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
            {/* Primary Choice: Register as Alumnus */}
            <button
              type="button"
              id="btn-onboarding-register-now"
              onClick={onRegister}
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem',
                background: 'linear-gradient(135deg, #113D2B 0%, #0A271B 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                boxShadow: '0 4px 14px rgba(17, 61, 43, 0.3)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <CheckCircle2 size={19} color="#FCD34D" />
              <span>Register</span>
              <ArrowRight size={17} style={{ marginLeft: 'auto' }} />
            </button>

            {/* Secondary Choice: Not Now */}
            <button
              type="button"
              id="btn-onboarding-not-now"
              onClick={onSkip}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0';
                e.currentTarget.style.color = '#1E293B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.color = '#475569';
              }}
            >
              Not Now
            </button>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#94A3B8',
              lineHeight: 1.45,
            }}
          >
            Selecting <em>"Not Now"</em> lets you browse public portal services. You can complete your official alumni registration at any time later from your membership pass.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniOnboardingScreen;
