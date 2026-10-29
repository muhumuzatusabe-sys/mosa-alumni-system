import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Award, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Building, 
  Lock, 
  UserPlus, 
  LogIn,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  Globe
} from 'lucide-react';
import { AuthUser, WelcomePageConfig, CarouselImageItem } from '../types';
import { dataService } from '../services/dataService';

interface MOSAWelcomeViewProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenRegisterAccount: () => void;
  onOpenAlumniRegistration?: () => void;
  onOpenVerify?: () => void;
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

  // Dynamic Viewport Page Slider State (rotates every 6s)
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Background Carousel Slides (changes in sync or sub-slider)
  const [photoIndex, setPhotoIndex] = useState(0);

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

        const cohorts = new Set<number>();
        alumniList.forEach(a => {
          if (a.schoolHistory?.aLevel?.yearCompleted) cohorts.add(a.schoolHistory.aLevel.yearCompleted);
          if (a.schoolHistory?.oLevel?.yearCompleted) cohorts.add(a.schoolHistory.oLevel.yearCompleted);
        });

        setStats({
          totalAccounts: Math.max(users.length, alumniList.length),
          verifiedAlumni: verified.length,
          cohortsCount: cohorts.size,
          allocatedMANumbers: allocated.length,
          eventsHeld: events.length,
        });
      } catch (err) {
        console.error('Failed to load welcome page data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const carouselImages: CarouselImageItem[] = 
    welcomeConfig?.carouselImages && welcomeConfig.carouselImages.length > 0
      ? [...welcomeConfig.carouselImages].sort((a, b) => a.order - b.order)
      : [
          {
            id: 'img-1',
            url: '/images/massh-flag-unveiling-ceremony.jpg',
            title: 'Flag Unveiling & Assembly',
            caption: 'Mandela Secondary School Hoima official assembly ceremony',
            isFeatured: true,
            order: 1
          },
          {
            id: 'img-2',
            url: '/images/massh-gate-welcoming.jpg',
            title: 'Campus Main Gate',
            caption: 'Welcoming generations of proud Mandelians since 1997',
            isFeatured: false,
            order: 2
          },
          {
            id: 'img-3',
            url: '/images/massh-courtyard-briefing.jpg',
            title: 'Alumni Gathering',
            caption: 'Courtyard briefing and reunion networking',
            isFeatured: false,
            order: 3
          },
          {
            id: 'img-4',
            url: '/images/massh-official-handover.jpg',
            title: 'Secretariat Leadership',
            caption: 'Official executive handover and leadership stewardship',
            isFeatured: false,
            order: 4
          },
          {
            id: 'img-5',
            url: '/images/massh-foundation-stone-unveiled.jpg',
            title: 'School Heritage',
            caption: 'Historic foundation stone commemorating MASSH founding',
            isFeatured: false,
            order: 5
          },
          {
            id: 'img-6',
            url: '/images/massh-science-lab-inspection.jpg',
            title: 'Academic Excellence',
            caption: 'State-of-the-art science laboratories and student innovation',
            isFeatured: false,
            order: 6
          }
        ];

  const totalPages = 3;
  const intervalSeconds = 6; // 6 seconds auto-rotation as requested

  // Rotate between dynamic pages every 6 seconds
  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!isPaused) {
      pageTimerRef.current = setInterval(() => {
        setActivePageIndex(prev => (prev + 1) % totalPages);
        setPhotoIndex(prev => (prev + 1) % carouselImages.length);
      }, intervalSeconds * 1000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pageTimerRef.current) clearInterval(pageTimerRef.current);
    };
  }, [isPaused, intervalSeconds, totalPages, carouselImages.length]);

  const handlePrevPage = () => {
    setActivePageIndex(prev => (prev === 0 ? totalPages - 1 : prev - 1));
    setPhotoIndex(prev => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const handleNextPage = () => {
    setActivePageIndex(prev => (prev + 1) % totalPages);
    setPhotoIndex(prev => (prev + 1) % carouselImages.length);
  };

  const heroTitle = welcomeConfig?.heroTitle || 'WELCOME TO MOSA';
  const slogan = welcomeConfig?.slogan || 'PROUDLY MANDELIAN';
  const subtitle = welcomeConfig?.subtitle || 'One family. One legacy. A lifetime of connection.';
  const introMessage = welcomeConfig?.introMessage || 'Connecting generations of Mandela Secondary School Hoima alumni across Uganda and the world.';

  const currentPhoto = carouselImages[photoIndex % carouselImages.length] || carouselImages[0];

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        background: '#05160F', 
        color: '#FFFFFF', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Background Atmosphere with Soft Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.16) 0%, rgba(10, 39, 27, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(5, 150, 105, 0.14) 0%, rgba(10, 39, 27, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ============================================================== */}
      {/* 1. TOP HEADER: COMPACT & FIXED (NEVER SCROLLS AWAY)            */}
      {/* ============================================================== */}
      <header
        style={{
          position: 'relative',
          zIndex: 40,
          background: 'rgba(10, 39, 27, 0.95)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.75rem 1.5rem',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
          {/* Logo & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0
              }}
            >
              <GraduationCap size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FCD34D', fontWeight: 800 }}>
                Mandela Old Students Association
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.01em', color: '#FFFFFF', lineHeight: 1.1 }}>
                MOSA — MASSH
              </div>
            </div>
          </div>

          {/* Header Actions: Create Account & Sign In */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {currentUser ? (
              <button
                onClick={onGoToPortal}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                }}
              >
                <span>Dashboard</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    padding: '0.48rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  }}
                >
                  <LogIn size={14} />
                  <span>Log In</span>
                </button>

                <button
                  onClick={onOpenRegisterAccount}
                  style={{
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    padding: '0.48rem 1.05rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(217, 119, 6, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.3)';
                  }}
                >
                  <UserPlus size={14} />
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DYNAMIC PAGES CONTAINER (ROTATES EVERY 6 SECONDS)           */}
      {/* ============================================================== */}
      <main 
        style={{ 
          flex: 1, 
          position: 'relative', 
          zIndex: 10,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '1.25rem 1.5rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1160px', width: '100%', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* ==================== PAGE 0: HERO & COMMUNITY ENTRANCE ==================== */}
          <div
            style={{
              display: activePageIndex === 0 ? 'grid' : 'none',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center',
              animation: 'fadeIn 0.7s ease',
            }}
          >
            {/* Left Column: Hero identity & Actions */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(180, 83, 9, 0.15) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  marginBottom: '1rem',
                }}
              >
                <Sparkles size={14} color="#F59E0B" />
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FDE68A', fontWeight: 800 }}>
                  {slogan}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.75rem 0',
                }}
              >
                {heroTitle}
              </h1>

              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                  fontWeight: 700,
                  color: '#FDE68A',
                  margin: '0 0 0.85rem 0',
                  lineHeight: 1.3,
                }}
              >
                {subtitle}
              </p>

              <p
                style={{
                  fontSize: '0.96rem',
                  color: '#CBD5E1',
                  lineHeight: 1.55,
                  margin: '0 0 1.75rem 0',
                  maxWidth: '500px',
                }}
              >
                {introMessage}
              </p>

              {/* Primary Call to Action */}
              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={onOpenRegisterAccount}
                  style={{
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(245, 158, 11, 0.55)',
                    padding: '0.85rem 1.65rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 8px 24px rgba(217, 119, 6, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(217, 119, 6, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 6, 0.35)';
                  }}
                >
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </button>

                <button
                  onClick={onOpenLogin}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#F8FAFC',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <LogIn size={18} />
                  <span>Member Sign In</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Photo Card */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
                  border: '2px solid rgba(255, 255, 255, 0.14)',
                  background: '#04120C',
                  height: '320px',
                  position: 'relative',
                }}
              >
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.title || 'MOSA MASSH'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'all 0.8s ease',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(5, 22, 15, 0.95) 0%, rgba(5, 22, 15, 0.6) 70%, transparent 100%)',
                    padding: '1.25rem 1.25rem 0.85rem 1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCD34D', fontWeight: 800 }}>
                    {currentPhoto.title || 'Official Alumni Archive'}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>
                    {currentPhoto.caption || 'Mandela Secondary School Hoima • Est. 1997'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PAGE 1: LIVE COMMUNITY RECORDS & METRICS ==================== */}
          <div
            style={{
              display: activePageIndex === 1 ? 'block' : 'none',
              animation: 'fadeIn 0.7s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FCD34D', fontWeight: 800 }}>
                Live Community Records
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.3rem)', fontWeight: 900, color: '#FFFFFF', margin: '0.25rem 0 0.5rem 0' }}>
                Mandela Old Students Association at a Glance
              </h2>
              <p style={{ color: '#94A3B8', maxWidth: '580px', margin: '0 auto', fontSize: '0.94rem' }}>
                Real-time official statistics across cohorts, verified alumni credentials, and allocated membership numbers.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.25rem',
                maxWidth: '960px',
                margin: '0 auto 2rem auto',
              }}
            >
              {/* Stat 1: Registered Accounts */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#FCD34D', marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                  <Users size={28} />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {stats.totalAccounts.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '0.45rem', fontWeight: 600 }}>
                  Total Registered Members
                </div>
              </div>

              {/* Stat 2: Verified Alumni Standing */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#34D399', marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                  <ShieldCheck size={28} />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {stats.verifiedAlumni.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '0.45rem', fontWeight: 600 }}>
                  Verified Alumni Standing
                </div>
              </div>

              {/* Stat 3: Alumni Cohorts */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#FBBF24', marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                  <GraduationCap size={28} />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {stats.cohortsCount}+
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '0.45rem', fontWeight: 600 }}>
                  Cohorts (1997 – Present)
                </div>
              </div>

              {/* Stat 4: Allocated MA Numbers */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: '#93C5FD', marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                  <Award size={28} />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {stats.allocatedMANumbers.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '0.45rem', fontWeight: 600 }}>
                  Allocated MA Numbers
                </div>
              </div>
            </div>

            {/* Quick Action under stats */}
            <div>
              <button
                onClick={onOpenRegisterAccount}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(245, 158, 11, 0.55)',
                  padding: '0.75rem 1.65rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                }}
              >
                <UserPlus size={16} />
                <span>Join Official Register</span>
              </button>
            </div>
          </div>

          {/* ==================== PAGE 2: ESSENTIAL COMMUNITY FOUNDATION ==================== */}
          <div
            style={{
              display: activePageIndex === 2 ? 'block' : 'none',
              animation: 'fadeIn 0.7s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FCD34D', fontWeight: 800 }}>
                Mandela Secondary School Hoima
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.3rem)', fontWeight: 900, color: '#FFFFFF', margin: '0.25rem 0 0.5rem 0' }}>
                One Legacy of Academic & Leadership Distinction
              </h2>
              <p style={{ color: '#94A3B8', maxWidth: '620px', margin: '0 auto', fontSize: '0.94rem' }}>
                Founded in 1997, MASSH has nurtured thousands of professionals across engineering, medicine, education, public service, and enterprise.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                maxWidth: '920px',
                margin: '0 auto 2rem auto',
                textAlign: 'left',
              }}
            >
              {/* Pillar 1: Permanent MA Credential */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.65rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(217, 119, 6, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                  }}
                >
                  <Award size={22} color="#FBBF24" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                  Lifelong MA Membership Numbers
                </h3>
                <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  Every registered Mandelian receives a permanent, non-reusable membership credential upon registration, securing democratic voting rights and official standing.
                </p>
              </div>

              {/* Pillar 2: University & Diaspora Chapters */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '1.65rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(5, 150, 105, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <Building size={22} color="#34D399" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                  University & Diaspora Chapters
                </h3>
                <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  Active student and professional chapters across Makerere University (MUMASA), Kyambogo, MUST, Gulu, and international diaspora networks.
                </p>
              </div>
            </div>

            {/* Quick Action under pillars */}
            <div>
              <button
                onClick={onOpenRegisterAccount}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(245, 158, 11, 0.55)',
                  padding: '0.75rem 1.65rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)',
                }}
              >
                <UserPlus size={16} />
                <span>Create Your Account Now</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ============================================================== */}
      {/* 3. DYNAMIC PAGE CONTROLS (ARROWS, 6s DOT PROGRESS & TIMER)     */}
      {/* ============================================================== */}
      <div
        style={{
          position: 'relative',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '0.5rem 1rem',
          flexShrink: 0,
        }}
      >
        {/* Previous page arrow */}
        <button
          onClick={handlePrevPage}
          aria-label="Previous section"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#CBD5E1';
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Dynamic 6-second Indicator Dots */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[0, 1, 2].map((idx) => {
            const isActive = idx === activePageIndex;
            return (
              <button
                key={idx}
                onClick={() => setActivePageIndex(idx)}
                aria-label={`Go to page ${idx + 1}`}
                style={{
                  width: isActive ? '32px' : '10px',
                  height: '8px',
                  borderRadius: '999px',
                  background: isActive ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' : 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.35s ease',
                }}
              />
            );
          })}
        </div>

        {/* Next page arrow */}
        <button
          onClick={handleNextPage}
          aria-label="Next section"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#CBD5E1';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. COMPACT FOOTER (NO DOWNWARD SCROLLING NEEDED)               */}
      {/* ============================================================== */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#04120C',
          padding: '0.85rem 1.5rem',
          color: '#94A3B8',
          fontSize: '0.78rem',
          flexShrink: 0,
          position: 'relative',
          zIndex: 30,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Identity & Address */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.84rem' }}>
                Mandela Old Students Association (MOSA)
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                {welcomeConfig?.officialAddress || 'Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda'}
              </span>
            </div>
            
            {/* Official Phone & WhatsApp Contacts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.35rem', fontSize: '0.74rem' }}>
              <a 
                href={`tel:${(welcomeConfig?.officialPhone || '+256782123456').replace(/\s+/g, '')}`} 
                style={{ color: '#CBD5E1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                title="Call MOSA Secretariat"
              >
                <Phone size={12} color="#FBBF24" />
                <span>{welcomeConfig?.officialPhone || '+256 782 123456'}</span>
              </a>

              <span style={{ color: '#334155' }}>|</span>

              <a 
                href={`https://wa.me/${(welcomeConfig?.officialWhatsApp || '256782123456').replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#34D399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                title="WhatsApp Official Line"
              >
                <MessageCircle size={12} color="#34D399" />
                <span>WhatsApp</span>
              </a>

              <span style={{ color: '#334155' }}>|</span>

              <a 
                href={`mailto:${welcomeConfig?.socialGmail || 'masshalumni@gmail.com'}`} 
                style={{ color: '#CBD5E1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                title="Email MOSA Secretariat"
              >
                <Mail size={12} color="#60A5FA" />
                <span>{welcomeConfig?.socialGmail || 'masshalumni@gmail.com'}</span>
              </a>

              <span style={{ color: '#334155' }}>|</span>

              <a 
                href={welcomeConfig?.officialWebsite || 'https://mtech-46634.web.app'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#FCD34D', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                title="Official Portal Website"
              >
                <Globe size={12} color="#FBBF24" />
                <span>{(welcomeConfig?.officialWebsite || 'https://mtech-46634.web.app').replace(/^https?:\/\//, '')}</span>
              </a>
            </div>
          </div>

          {/* Association Handles (X, LinkedIn, TikTok, Gmail) & Access Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Social Icons Badge Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {/* X / Twitter */}
              <a
                href={welcomeConfig?.socialX || 'https://x.com/Masshalumni'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter) MOSA @Masshalumni"
                title="Follow MOSA on X (@Masshalumni)"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  transition: 'all 0.2s',
                }}
              >
                𝕏
              </a>

              {/* LinkedIn */}
              <a
                href={welcomeConfig?.socialLinkedIn || 'https://linkedin.com/company/mosa-massh'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn MOSA"
                title="Connect with MOSA on LinkedIn"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#0A66C2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href={welcomeConfig?.socialTikTok || 'https://tiktok.com/@mosa_massh'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok MOSA"
                title="Follow MOSA on TikTok"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#F43F5E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  transition: 'all 0.2s',
                }}
              >
                ♪
              </a>

              {/* Gmail / Email */}
              <a
                href={`mailto:${welcomeConfig?.socialGmail || 'masshalumni@gmail.com'}`}
                aria-label="Email MOSA Secretariat"
                title="Send Email to Secretariat"
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#EA4335',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Mail size={13} color="#F87171" />
              </a>
            </div>

            <span style={{ color: '#334155' }}>|</span>

            {/* Member Action Links */}
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <button
                onClick={onOpenLogin}
                style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
              >
                Member Sign In
              </button>
              <span>•</span>
              <button
                onClick={onOpenRegisterAccount}
                style={{ background: 'transparent', border: 'none', color: '#FCD34D', cursor: 'pointer', padding: 0, fontWeight: 700, fontSize: '0.8rem' }}
              >
                Create Account
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* ============================================================== */}
      {/* 5. DISCREET BOTTOM-RIGHT ADMIN GATE                           */}
      {/* ============================================================== */}
      {onGoToAdmin && (
        <div
          style={{
            position: 'fixed',
            bottom: '3.5rem',
            right: '1.25rem',
            zIndex: 50,
          }}
        >
          <button
            onClick={onGoToAdmin}
            aria-label="Discreet Administrator Portal Entry"
            title="MOSA Secretariat & Administrator Gate"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.8rem',
              background: 'rgba(10, 39, 27, 0.82)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              borderRadius: '999px',
              color: '#FDE68A',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              opacity: 0.85,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.borderColor = '#F59E0B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.35)';
            }}
          >
            <Lock size={12} color="#FBBF24" />
            <span>Admin Portal</span>
          </button>
        </div>
      )}

      {/* CSS Animation for smooth fade transitions */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MOSAWelcomeView;
