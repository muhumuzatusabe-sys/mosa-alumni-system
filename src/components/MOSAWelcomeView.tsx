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
  ArrowRight
} from 'lucide-react';
import { AuthUser, WelcomePageConfig, CarouselImageItem } from '../types';
import { dataService } from '../services/dataService';

interface MOSAWelcomeViewProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenRegisterAccount: () => void;
  onOpenAlumniRegistration?: () => void;
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

  // Dynamic Image Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Carousel images list
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

  const intervalSeconds = welcomeConfig?.carouselIntervalSeconds || 6;

  // Auto-advance Carousel timer with visibility check & reduced motion check
  useEffect(() => {
    if (carouselImages.length <= 1) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    // Handle document visibility
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!isPaused) {
      slideTimerRef.current = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % carouselImages.length);
      }, intervalSeconds * 1000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [carouselImages.length, isPaused, intervalSeconds]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % carouselImages.length);
  };

  const heroTitle = welcomeConfig?.heroTitle || 'WELCOME TO MOSA';
  const slogan = welcomeConfig?.slogan || 'PROUDLY MANDELIAN';
  const subtitle = welcomeConfig?.subtitle || 'One family. One legacy. A lifetime of connection.';
  const introMessage = welcomeConfig?.introMessage || 'Connecting generations of Mandela Secondary School Hoima alumni across Uganda and the world.';

  const activeSlide = carouselImages[currentSlideIndex] || carouselImages[0];

  return (
    <div style={{ minHeight: '100vh', background: '#05160F', color: '#FFFFFF', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER: MINIMAL & UNCLUTTERED                           */}
      {/* ============================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(10, 39, 27, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.85rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
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
                flexShrink: 0
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

          {/* Header Action: Authenticated Portal vs Visitor Two Primary Actions */}
          <div>
            {currentUser ? (
              <button
                onClick={onGoToPortal}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '0.5rem 1.1rem',
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
                <span>Enter Member Portal</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  onClick={onOpenLogin}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.86rem',
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
                  <LogIn size={15} />
                  <span>Log In</span>
                </button>

                <button
                  onClick={onOpenRegisterAccount}
                  style={{
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
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
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION: TWO PRIMARY ACTIONS & DYNAMIC IMAGE CAROUSEL   */}
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
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-5%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.14) 0%, rgba(10, 39, 27, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          
          {/* Left Column: Essential Identity & Three Clean Primary Actions */}
          <div>
            {/* Proudly Mandelian Slogan Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(180, 83, 9, 0.15) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={14} color="#F59E0B" />
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FDE68A', fontWeight: 800 }}>
                {slogan}
              </span>
            </div>

            {/* Main Welcome Heading */}
            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
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
                fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)',
                fontWeight: 700,
                color: '#FDE68A',
                margin: '0 0 1rem 0',
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </p>

            {/* Concise Community Introduction */}
            <p
              style={{
                fontSize: '1rem',
                color: '#CBD5E1',
                lineHeight: 1.6,
                margin: '0 0 2.25rem 0',
                maxWidth: '520px',
              }}
            >
              {introMessage}
            </p>

            {/* THREE PRIMARY ACTIONS: Explore Alumni Portal, Member Sign In / Register, & Public Verification Desk */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={onGoToPortal}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(245, 158, 11, 0.55)',
                  padding: '0.9rem 1.65rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.96rem',
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
                <span>Explore Alumni Portal</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={onOpenLogin}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.9rem 1.45rem',
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
                <LogIn size={17} />
                <span>Member Sign In</span>
              </button>

              <button
                onClick={onOpenVerify}
                style={{
                  background: 'rgba(5, 150, 105, 0.18)',
                  color: '#6EE7B7',
                  border: '1.5px solid rgba(16, 185, 129, 0.45)',
                  padding: '0.9rem 1.35rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(5, 150, 105, 0.28)';
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(5, 150, 105, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ShieldCheck size={17} />
                <span>Verify Alumni Number</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic Photo Carousel */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                background: '#04120C',
                position: 'relative',
                height: '360px',
              }}
            >
              {/* Stacked Carousel Slides with Cross-Fade */}
              {carouselImages.map((img, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <div
                    key={img.id || idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 0.8s ease-in-out',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.title || 'MOSA Mandela Secondary School Hoima'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                );
              })}

              {/* Prev / Next Manual Carousel Controls */}
              {carouselImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Previous photograph"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(10, 39, 27, 0.7)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'background 0.2s',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next photograph"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(10, 39, 27, 0.7)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'background 0.2s',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Bottom Caption Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(5, 22, 15, 0.95) 0%, rgba(5, 22, 15, 0.7) 65%, transparent 100%)',
                  padding: '1.5rem 1.25rem 1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  zIndex: 5,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCD34D', fontWeight: 800 }}>
                    {activeSlide.title || 'Official Alumni Archive'}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem', maxWidth: '320px', lineHeight: 1.3 }}>
                    {activeSlide.caption || 'Mandela Secondary School Hoima • Est. 1997'}
                  </div>
                </div>

                {/* Dot indicators */}
                {carouselImages.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {carouselImages.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setCurrentSlideIndex(dotIdx)}
                        aria-label={`View slide ${dotIdx + 1}`}
                        style={{
                          width: dotIdx === currentSlideIndex ? '20px' : '7px',
                          height: '7px',
                          borderRadius: '999px',
                          background: dotIdx === currentSlideIndex ? '#FBBF24' : 'rgba(255, 255, 255, 0.35)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                background: 'rgba(5, 150, 105, 0.92)',
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
                zIndex: 15,
              }}
            >
              <ShieldCheck size={13} color="#FFFFFF" />
              <span>MASSH Alumni Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. COMPACT LIVE COMMUNITY RECORDS & STATISTICS                */}
      {/* ============================================================== */}
      <section
        style={{
          padding: '2.25rem 1.5rem',
          background: 'linear-gradient(180deg, #0A271B 0%, #071E15 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: 800 }}>
              Live Community Records
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0 0 0' }}>
              Mandela Old Students Association at a Glance
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Stat 1: Registered Accounts */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.15rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FCD34D', marginBottom: '0.35rem', display: 'flex', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.totalAccounts.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.35rem', fontWeight: 600 }}>
                Total Registered Members
              </div>
            </div>

            {/* Stat 2: Verified Alumni */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.15rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#34D399', marginBottom: '0.35rem', display: 'flex', justifyContent: 'center' }}>
                <ShieldCheck size={24} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.verifiedAlumni.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.35rem', fontWeight: 600 }}>
                Verified Alumni Standing
              </div>
            </div>

            {/* Stat 3: Alumni Cohorts */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.15rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#FBBF24', marginBottom: '0.35rem', display: 'flex', justifyContent: 'center' }}>
                <GraduationCap size={24} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.cohortsCount}+
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.35rem', fontWeight: 600 }}>
                Cohorts (1997 – Present)
              </div>
            </div>

            {/* Stat 4: Allocated MA Numbers */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.15rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#93C5FD', marginBottom: '0.35rem', display: 'flex', justifyContent: 'center' }}>
                <Award size={24} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.allocatedMANumbers.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.35rem', fontWeight: 600 }}>
                Allocated MA Numbers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. ESSENTIAL COMMUNITY FOUNDATION OVERVIEW                      */}
      {/* ============================================================== */}
      <section
        style={{
          padding: '3.5rem 1.5rem',
          maxWidth: '1160px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#FCD34D', fontWeight: 800 }}>
            Mandela Secondary School Hoima
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: '0.35rem 0 0.5rem 0' }}>
            One Legacy of Academic & Leadership Distinction
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '620px', margin: '0 auto', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Founded in 1997, Mandela Secondary School Hoima has nurtured thousands of professionals across engineering, medicine, education, public service, and enterprise.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1: Official Membership Register */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
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
              Every verified Mandelian receives a permanent, non-reusable membership credential (e.g. <code>MA. 0001</code>) upon registration, securing democratic voting rights and official standing.
            </p>
          </div>

          {/* Card 2: Public Alumnus Verification */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(5, 150, 105, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              <ShieldCheck size={22} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
              Verified Alumni Credentials
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Employers, academic institutions, and fellow Mandelians can independently verify completion cohorts and alumni standing with cryptographic integrity.
            </p>
          </div>

          {/* Card 3: Regional & Institutional Chapters */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1.75rem',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(217, 119, 6, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <Building size={22} color="#FBBF24" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
              University & Diaspora Chapters
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Active student and professional chapters across Makerere University (MUMASA), Kyambogo, MUST, Gulu, and international diaspora chapters.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. FOOTER & DISCREET LEGAL META                                */}
      {/* ============================================================== */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#04120C',
          padding: '2.5rem 1.5rem',
          color: '#94A3B8',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.92rem' }}>
              Mandela Old Students Association (MOSA)
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda
            </div>
            <div style={{ marginTop: '0.2rem', color: '#64748B', fontSize: '0.76rem' }}>
              Operating under Article 4 of the MOSA Constitution. Never SOSA.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.82rem' }}>
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
            <span>•</span>
            <button
              onClick={onOpenVerify}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
            >
              Public Verification
            </button>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 6. DISCREET BOTTOM-RIGHT ADMIN PORTAL ENTRY POINT (Phase 4)    */}
      {/* ============================================================== */}
      {onGoToAdmin && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingRight: 'env(safe-area-inset-right)',
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
              padding: '0.45rem 0.85rem',
              background: 'rgba(10, 39, 27, 0.78)',
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
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Lock size={12} color="#FBBF24" />
            <span>Admin Portal</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default MOSAWelcomeView;
