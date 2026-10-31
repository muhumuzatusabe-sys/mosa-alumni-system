import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  UserPlus, 
  LogIn,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  ArrowRight,
  Music
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

const DEFAULT_CAROUSEL_IMAGES: CarouselImageItem[] = [
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

export const MOSAWelcomeView: React.FC<MOSAWelcomeViewProps> = ({
  currentUser,
  onOpenLogin,
  onOpenRegisterAccount,
  onGoToPortal,
}) => {
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomePageConfig | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await dataService.getWelcomePageConfig();
        setWelcomeConfig(config);
      } catch (err) {
        console.warn('Failed to load welcome config:', err);
      }
    };
    loadConfig();
  }, []);

  const backgroundImages: CarouselImageItem[] = 
    welcomeConfig?.carouselImages && welcomeConfig.carouselImages.length > 0
      ? [...welcomeConfig.carouselImages].sort((a, b) => a.order - b.order)
      : DEFAULT_CAROUSEL_IMAGES;

  // Auto-rotate background image slides smoothly every 6 seconds
  useEffect(() => {
    if (isPaused || backgroundImages.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % backgroundImages.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, backgroundImages.length]);

  const heroTitle = welcomeConfig?.heroTitle || 'Welcome to MOSA';
  const slogan = welcomeConfig?.slogan || 'Proudly Mandelian • Est. 1997';
  const subtitle = welcomeConfig?.subtitle || 'Mandela Old Students Association';
  const introMessage = welcomeConfig?.introMessage || 
    'Connecting generations of Mandela Secondary School Hoima alumni across Uganda and the world. Join our official alumni network to access your permanent digital membership card, chapters, and school development.';

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        background: '#ECFDF5', 
        color: '#064E3B', 
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ============================================================== */}
      {/* 1. DYNAMIC BACKGROUND IMAGE CAROUSEL WITH LIGHT GREEN VEIL     */}
      {/* ============================================================== */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        {backgroundImages.map((img, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={img.id || idx}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${img.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isActive ? 0.38 : 0,
                transform: isActive ? 'scale(1.04)' : 'scale(1.0)',
                transition: 'opacity 1.8s ease-in-out, transform 7s ease-out',
              }}
            />
          );
        })}

        {/* Luminous Light-Green Ambient Overlay Gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.92) 0%, rgba(230, 250, 238, 0.85) 45%, rgba(209, 250, 229, 0.92) 100%)',
          }}
        />

        {/* Soft Decorative Ambient Light Blooms */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '580px',
            height: '580px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(209, 250, 229, 0) 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(254, 243, 199, 0) 70%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. TOP BRANDING BAR (MINIMAL & CLEAN, NO BUTTON CLUTTER)       */}
      {/* ============================================================== */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.85rem',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '0.55rem 1.25rem',
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 4px 14px rgba(6, 78, 59, 0.05)',
          }}
        >
          {/* MASSH Gold Emblem */}
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              color: '#FFFFFF',
              flexShrink: 0
            }}
          >
            <GraduationCap size={18} />
          </div>

          <div>
            <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#B45309', fontWeight: 800 }}>
              Mandela Secondary School Hoima
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#064E3B', lineHeight: 1.1 }}>
              MOSA — Alumni Association
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. CENTER HERO: SIMPLY WELCOME & ONLY 2 CLEAN ACTION BUTTONS   */}
      {/* ============================================================== */}
      <main
        style={{
          position: 'relative',
          zIndex: 20,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.90)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.5px solid rgba(16, 185, 129, 0.30)',
            padding: 'clamp(2rem, 4vw, 3rem) clamp(1.75rem, 4vw, 3.25rem)',
            textAlign: 'center',
            boxShadow: '0 25px 60px -12px rgba(6, 78, 59, 0.16), 0 8px 24px -4px rgba(0, 0, 0, 0.04)',
            animation: 'mosaFadeInUp 0.6s ease-out',
          }}
        >
          {/* Official Mandela Secondary School Hoima Logo Crest */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div 
              style={{
                width: '105px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 6px 16px rgba(6, 78, 59, 0.22))',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              <img src="/images/mosa-logo.svg" alt="Mandela Secondary School Hoima Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Slogan Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              marginBottom: '1.25rem',
            }}
          >
            <Sparkles size={14} color="#059669" />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#065F46', fontWeight: 800 }}>
              {slogan}
            </span>
          </div>

          {/* Prestigious Main Welcome Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#064E3B',
              letterSpacing: '-0.025em',
              margin: '0 0 0.5rem 0',
            }}
          >
            {heroTitle}
          </h1>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.28rem)',
              fontWeight: 700,
              color: '#B45309',
              margin: '0 0 1.15rem 0',
              letterSpacing: '-0.01em',
            }}
          >
            {subtitle}
          </div>

          {/* Clean Welcoming Description */}
          <p
            style={{
              fontSize: 'clamp(0.92rem, 1.3vw, 1.02rem)',
              color: '#334155',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto 2.25rem auto',
            }}
          >
            {introMessage}
          </p>

          {/* ========================================================== */}
          {/* ONLY TWO CLEAN BUTTONS: CREATE ACCOUNT & LOG IN            */}
          {/* ========================================================== */}
          {currentUser ? (
            <button
              onClick={onGoToPortal}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.95rem 2.25rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1.02rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.32)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(5, 150, 105, 0.42)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.32)';
              }}
            >
              <span>Go to Your Portal Dashboard</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '1.15rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* 1. Create Account Button */}
              <button
                id="btn-welcome-create-account"
                onClick={onOpenRegisterAccount}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  border: '1.5px solid #10B981',
                  padding: '0.92rem 2.15rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.32)',
                  transition: 'all 0.2s ease',
                  minWidth: '185px',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(5, 150, 105, 0.42)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(5, 150, 105, 0.32)';
                }}
              >
                <UserPlus size={19} />
                <span>Create Account</span>
              </button>

              {/* 2. Log In Button */}
              <button
                id="btn-welcome-login"
                onClick={onOpenLogin}
                style={{
                  background: '#FFFFFF',
                  color: '#065F46',
                  border: '1.5px solid #059669',
                  padding: '0.92rem 2.15rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  minWidth: '185px',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F0FDF4';
                  e.currentTarget.style.borderColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.05)';
                }}
              >
                <LogIn size={19} color="#059669" />
                <span>Log In</span>
              </button>
            </div>
          )}

          {/* Background image indicator dots (subtle & elegant) */}
          {backgroundImages.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '2.25rem' }}>
              {backgroundImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    width: idx === currentSlideIndex ? '24px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    background: idx === currentSlideIndex ? '#059669' : 'rgba(5, 150, 105, 0.22)',
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
      </main>

      {/* ============================================================== */}
      {/* 4. PROFESSIONAL CONTACTS & SOCIAL MEDIA FOOTER (BOTTOM BAR)     */}
      {/* ============================================================== */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(16, 185, 129, 0.22)',
          padding: '0.85rem 2rem',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Secretariat Contact Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#1E293B' }}>
            {/* Campus / Address */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <MapPin size={14} color="#059669" />
              <span>{welcomeConfig?.officialAddress || 'Mandela Secondary School Hoima • P.O. Box 280, Hoima, Uganda'}</span>
            </div>

            <span style={{ color: '#CBD5E1', display: 'none' }}>|</span>

            {/* Telephone */}
            <a
              href={`tel:${(welcomeConfig?.officialPhone || '+256772411921').replace(/\s+/g, '')}`}
              style={{ color: '#0F172A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
              title="Call MOSA Secretariat (+256 772 411921 / +256 706599793 / +256 773432413)"
            >
              <Phone size={14} color="#D97706" />
              <span>{welcomeConfig?.officialPhone || '+256 772 411921'}</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${(welcomeConfig?.officialWhatsApp || '256772411921').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#065F46', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              title="Message on WhatsApp (+256 772 411921)"
            >
              <MessageCircle size={14} color="#059669" />
              <span>WhatsApp</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${welcomeConfig?.socialGmail || 'mosaalumni31@gmail.com'}`}
              style={{ color: '#0F172A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
              title="Email MOSA Secretariat"
            >
              <Mail size={14} color="#2563EB" />
              <span>{welcomeConfig?.socialGmail || 'mosaalumni31@gmail.com'}</span>
            </a>

            {/* Official Website */}
            <a
              href={welcomeConfig?.officialWebsite || 'https://mtech-46634.web.app'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#B45309', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              title="Official Portal Website"
            >
              <Globe size={14} color="#D97706" />
              <span>{(welcomeConfig?.officialWebsite || 'https://mtech-46634.web.app').replace(/^https?:\/\//, '')}</span>
            </a>
          </div>

          {/* Social Media Channels Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginRight: '0.2rem' }}>
              Follow MOSA:
            </span>

            {/* X / Twitter */}
            <a
              href={welcomeConfig?.socialX || 'https://x.com/Masshalumni'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MOSA on X (@Masshalumni)"
              title="X (@Masshalumni)"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              𝕏
            </a>

            {/* LinkedIn */}
            <a
              href={welcomeConfig?.socialLinkedIn || 'https://linkedin.com/company/mosa-massh'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MOSA on LinkedIn"
              title="MOSA on LinkedIn"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#0A66C2',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(10, 102, 194, 0.25)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              aria-label="MOSA on TikTok"
              title="MOSA on TikTok (@mosa_massh)"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#000000',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              <Music size={14} />
            </a>

            {/* Gmail / Contact */}
            <a
              href={`mailto:${welcomeConfig?.socialGmail || 'mosaalumni31@gmail.com'}`}
              aria-label="Email MOSA Secretariat"
              title="Email Secretariat (mosaalumni31@gmail.com)"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#EA4335',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(234, 67, 53, 0.25)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              <Mail size={14} color="#FFFFFF" />
            </a>
          </div>
        </div>
      </footer>

      {/* Embedded Animations */}
      <style>{`
        @keyframes mosaFadeInUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MOSAWelcomeView;
