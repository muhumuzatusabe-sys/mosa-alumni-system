import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  Users, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  HeartHandshake, 
  BookOpen, 
  Search,
  ExternalLink,
  ChevronDown,
  Building,
  MapPin,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';
import { AuthUser, WelcomePageConfig, AlumniProfile } from '../types';
import { dataService } from '../services/dataService';

interface MOSAWelcomeViewProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenRegisterAccount: () => void;
  onOpenAlumniRegistration: () => void;
  onOpenVerify: () => void;
  onGoToPortal: () => void;
  onGoToAdmin?: () => void;
}

export const MOSAWelcomeView: React.FC<MOSAWelcomeViewProps> = ({
  currentUser,
  onOpenLogin,
  onOpenRegisterAccount,
  onOpenAlumniRegistration,
  onOpenVerify,
  onGoToPortal,
  onGoToAdmin,
}) => {
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomePageConfig | null>(null);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    verifiedAlumni: 0,
    cohortsCount: 29,
    allocatedMANumbers: 0,
    eventsHeld: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [config, alumniList, users, events] = await Promise.all([
          dataService.getWelcomePageConfig(),
          dataService.getAlumniList(),
          Promise.resolve(JSON.parse(localStorage.getItem('mosa_users') || '[]')),
          dataService.getEvents(),
        ]);

        setWelcomeConfig(config);

        const verified = alumniList.filter(a => a.membershipStatus === 'ACTIVE' || a.membershipStatus === 'APPROVED' || a.verifiedAt);
        const allocated = alumniList.filter(a => !!a.alumniNumber && a.alumniNumber.startsWith('MA.'));

        // Calculate cohorts count from unique completion years
        const cohorts = new Set<number>();
        alumniList.forEach(a => {
          if (a.schoolHistory?.aLevel?.yearCompleted) cohorts.add(a.schoolHistory.aLevel.yearCompleted);
          if (a.schoolHistory?.oLevel?.yearCompleted) cohorts.add(a.schoolHistory.oLevel.yearCompleted);
        });

        setStats({
          totalAccounts: Math.max(users.length, alumniList.length),
          verifiedAlumni: verified.length,
          cohortsCount: Math.max(cohorts.size, 29),
          allocatedMANumbers: allocated.length,
          eventsHeld: Math.max(events.length, 6),
        });
      } catch (err) {
        console.error('Failed to load welcome page data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const scrollToExplore = () => {
    const el = document.getElementById('explore-mosa-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroTitle = welcomeConfig?.heroTitle || 'WELCOME TO MOSA';
  const slogan = welcomeConfig?.slogan || 'PROUDLY MANDELIAN';
  const subtitle = welcomeConfig?.subtitle || 'One family. One legacy. A lifetime of connection.';
  const introMessage = welcomeConfig?.introMessage || 'Your journey with the Mandela Old Students Association starts here.';
  const heroImage = welcomeConfig?.heroImageUrl || '/images/massh-flag-unveiling-ceremony.jpg';

  const isVerifiedAlumnus = currentUser?.role === 'ALUMNI' || !!currentUser?.alumniNumber;
  const isSuperAdminOrStaff = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || (currentUser.role && currentUser.role !== 'USER' && currentUser.role !== 'ALUMNI'));

  return (
    <div style={{ minHeight: '100vh', background: '#05160F', color: '#FFFFFF', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ============================================================== */}
      {/* 1. TOP MOSA HEADER BAR                                         */}
      {/* ============================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(10, 39, 27, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.85rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Logo & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <GraduationCap size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: 800 }}>
                Mandela Old Students Association
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.01em', color: '#FFFFFF', lineHeight: 1.1 }}>
                MOSA — MASSH
              </div>
            </div>
          </div>

          {/* Quick Navigation Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={scrollToExplore}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CBD5E1',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
            >
              Explore MOSA
            </button>

            <button
              onClick={onOpenVerify}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FDE68A',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0.42rem 0.85rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldCheck size={14} color="#FBBF24" />
              <span>Verify Alumnus</span>
            </button>

            {/* Authenticated user vs Visitor options */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={onGoToPortal}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <ArrowRight size={15} />
                  <span>Enter Member Portal</span>
                </button>

                {isSuperAdminOrStaff && onGoToAdmin && (
                  <button
                    onClick={onGoToAdmin}
                    style={{
                      background: 'rgba(217, 119, 6, 0.25)',
                      color: '#FDE68A',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Lock size={13} color="#FBBF24" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={onOpenLogin}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    padding: '0.42rem 0.9rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <LogIn size={14} />
                  <span>Log In</span>
                </button>

                <button
                  onClick={onOpenRegisterAccount}
                  style={{
                    background: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    padding: '0.42rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(190, 24, 93, 0.3)',
                  }}
                >
                  <UserPlus size={14} />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION WITH VIBRANT MOSA GREEN & PINK PALETTE         */}
      {/* ============================================================== */}
      <section
        style={{
          position: 'relative',
          padding: '4rem 1.5rem 3.5rem 1.5rem',
          background: 'radial-gradient(ellipse at top, #113D2B 0%, #0A271B 65%, #05160F 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(10, 39, 27, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(10, 39, 27, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          
          {/* Left Column: Heading & Calls to Action */}
          <div>
            {/* Proudly Mandelian Slogan Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.22) 0%, rgba(190, 24, 93, 0.15) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.45)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={14} color="#F43F5E" />
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FDA4AF', fontWeight: 800 }}>
                {slogan}
              </span>
            </div>

            {/* Main Welcome Heading */}
            <h1
              style={{
                fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)',
                fontWeight: 900,
                lineHeight: 1.12,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: '0 0 1rem 0',
              }}
            >
              {heroTitle}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                fontWeight: 700,
                color: '#FDE68A',
                margin: '0 0 1rem 0',
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </p>

            {/* Intro Supporting Message */}
            <p
              style={{
                fontSize: '0.98rem',
                color: '#CBD5E1',
                lineHeight: 1.6,
                margin: '0 0 2rem 0',
                maxWidth: '540px',
              }}
            >
              {introMessage}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              {/* Register as an Alumnus CTA */}
              <button
                onClick={onOpenAlumniRegistration}
                style={{
                  background: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(244, 63, 94, 0.5)',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 6px 18px rgba(190, 24, 93, 0.35)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <GraduationCap size={18} />
                <span>Register as an Alumnus</span>
              </button>

              {/* Explore MOSA CTA */}
              <button
                onClick={scrollToExplore}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  border: '1.5px solid rgba(255, 255, 255, 0.22)',
                  padding: '0.85rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Explore MOSA</span>
                <ChevronDown size={16} />
              </button>

              {/* Member area login if unauthenticated */}
              {!currentUser && (
                <button
                  onClick={onOpenLogin}
                  style={{
                    background: 'transparent',
                    color: '#94A3B8',
                    border: '1px dashed rgba(255, 255, 255, 0.25)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <LogIn size={15} />
                  <span>Member Area Log In</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Hero Image Showcase with Glassmorphism */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(10, 39, 27, 0.8)',
                position: 'relative',
              }}
            >
              <img
                src={heroImage}
                alt="MOSA Mandela Secondary School Hoima"
                style={{
                  width: '100%',
                  height: '340px',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Bottom Caption Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(10, 39, 27, 0.95) 0%, rgba(10, 39, 27, 0.7) 60%, transparent 100%)',
                  padding: '1.25rem 1.25rem 1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCD34D', fontWeight: 800 }}>
                    Official Alumni Portal
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Mandela Secondary School Hoima
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(236, 72, 153, 0.25)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#FDA4AF',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  Est. 1997
                </div>
              </div>
            </div>

            {/* Quick trust tag pill */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                background: 'rgba(5, 150, 105, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#FFFFFF',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CheckCircle2 size={13} color="#FFFFFF" />
              <span>Registered MASSH Alumni Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. LIVE DATABASE STATISTICS SECTION (Requirement Section 2)    */}
      {/* ============================================================== */}
      <section
        style={{
          padding: '2.5rem 1.5rem',
          background: 'linear-gradient(180deg, #0A271B 0%, #071E15 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FDA4AF', fontWeight: 800 }}>
              Live Community Records
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0 0 0' }}>
              Mandela Old Students Association at a Glance
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Stat 1: Registered Accounts */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FCD34D', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <Users size={26} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.totalAccounts.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.4rem', fontWeight: 600 }}>
                Total MOSA Accounts
              </div>
            </div>

            {/* Stat 2: Verified Alumni */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#34D399', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <ShieldCheck size={26} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.verifiedAlumni.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.4rem', fontWeight: 600 }}>
                Verified Alumni Members
              </div>
            </div>

            {/* Stat 3: Alumni Cohorts */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FDA4AF', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <GraduationCap size={26} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.cohortsCount}+
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.4rem', fontWeight: 600 }}>
                Alumni Cohorts (1997–2026)
              </div>
            </div>

            {/* Stat 4: Allocated MA Numbers */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#93C5FD', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <Award size={26} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.allocatedMANumbers.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.4rem', fontWeight: 600 }}>
                Allocated MA Numbers
              </div>
            </div>

            {/* Stat 5: Events Held */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FBBF24', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <Calendar size={26} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.eventsHeld}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.4rem', fontWeight: 600 }}>
                Reunions & Conventions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. EXPLORE MOSA SECTION (About, Heritage, Verification)         */}
      {/* ============================================================== */}
      <section
        id="explore-mosa-section"
        style={{
          padding: '4rem 1.5rem',
          maxWidth: '1160px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FCD34D', fontWeight: 800 }}>
            Mandela Secondary School Hoima
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', margin: '0.35rem 0 0.75rem 0' }}>
            One Legacy of Academic & Leadership Distinction
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '650px', margin: '0 auto', fontSize: '0.96rem', lineHeight: 1.6 }}>
            Founded in 1997, Mandela Secondary School Hoima has nurtured thousands of professionals across engineering, medicine, education, public service, and enterprise.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1: Official Membership Register */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                }}
              >
                <Award size={24} color="#F43F5E" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                Lifelong MA Membership Numbers
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Every verified Mandelian receives a permanent, unique membership credential (e.g. <code>MA. 0001</code>). Used for AGMs, secret balloting, and regional chapter coordination.
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={onOpenAlumniRegistration}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FDA4AF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: 0,
                }}
              >
                <span>Register to obtain your number</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Card 2: Public Alumnus Verification */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(5, 150, 105, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                <ShieldCheck size={24} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                Public Alumnus Verification
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Employers, institutions, and fellow alumni can independently verify the standing and graduation cohort of any registered member without exposing private contact info.
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={onOpenVerify}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#34D399',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: 0,
                }}
              >
                <span>Check verification status</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Card 3: Regional & Institutional Chapters */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(217, 119, 6, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                <Building size={24} color="#FBBF24" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                University & Diaspora Chapters
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Active chapters across Makerere University (MUMASA), Kyambogo, MUST, Gulu, and global diaspora networks coordinating welfare and student mentorship.
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={currentUser ? onGoToPortal : onOpenLogin}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FCD34D',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: 0,
                }}
              >
                <span>{currentUser ? 'View chapters in portal' : 'Sign in to connect'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. FOOTER & SECRETARIAT INFORMATION                            */}
      {/* ============================================================== */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#04120C',
          padding: '2.5rem 1.5rem',
          color: '#94A3B8',
          fontSize: '0.84rem',
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
              Mandela Old Students Association (MOSA)
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda
            </div>
            <div style={{ marginTop: '0.2rem', color: '#64748B', fontSize: '0.78rem' }}>
              Operating under Article 4 of the MOSA Constitution. Never SOSA.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={onOpenVerify}
              style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0 }}
            >
              Public Verification
            </button>
            <span>•</span>
            <button
              onClick={onOpenLogin}
              style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0 }}
            >
              Member Sign In
            </button>
            <span>•</span>
            <button
              onClick={onOpenRegisterAccount}
              style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0 }}
            >
              Create Account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
