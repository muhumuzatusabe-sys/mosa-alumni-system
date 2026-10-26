import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { MembershipView } from './components/MembershipView';
import { AlumniDirectory } from './components/AlumniDirectory';
import { ChaptersHub } from './components/ChaptersHub';
import { EventsHub } from './components/EventsHub';
import { PaymentsHub } from './components/PaymentsHub';
import { CommunicationsHub } from './components/CommunicationsHub';
import { CampusHeritageGallery } from './components/CampusHeritageGallery';
import { DocumentsView } from './components/DocumentsView';
import { ContactView } from './components/ContactView';
import { AdminControlPanel } from './components/AdminControlPanel';
import { AlumniRegistrationWizard } from './components/AlumniRegistrationWizard';
import { AlumniProfileModal } from './components/AlumniProfileModal';
import { AlumniDashboardView } from './components/AlumniDashboardView';
import { AuthModal } from './components/AuthModal';
import { AuthenticationGate } from './components/AuthenticationGate';
import { AlumniOnboardingScreen } from './components/AlumniOnboardingScreen';
import { PublicVerifyAlumniModal } from './components/PublicVerifyAlumniModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NotificationsView } from './components/NotificationsView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MOSAWelcomeView } from './components/MOSAWelcomeView';
import { SuperAdminPasswordChangeModal } from './components/SuperAdminPasswordChangeModal';
import { dataService } from './services/dataService';
import { isStaffRole } from './services/governanceService';
import { MemberAttendanceView } from './components/MemberAttendanceView';
import { OpportunitiesHub } from './components/OpportunitiesHub';
import { ElectionsHub } from './components/ElectionsHub';
import { DigitalMembershipCardModal } from './components/DigitalMembershipCardModal';
import { AlumniProfile, AuthUser, ModuleSettings } from './types';
import { ShieldCheck, Lock, Sliders, ArrowUpRight, ArrowLeft, GraduationCap, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Application Mode: Member Portal vs Dedicated Admin Control Panel
  const [portalMode, setPortalMode] = useState<'member' | 'admin'>('member');
  
  // Current Active Tab in Member Portal
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [tabHistory, setTabHistory] = useState<string[]>(['home']);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authResolving, setAuthResolving] = useState<boolean>(true);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState<boolean>(false);

  const handleNavigate = (tab: string) => {
    if (tab === currentTab) return;
    setTabHistory(prev => [...prev, tab]);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // Remove active tab
      const previousTab = newHistory[newHistory.length - 1] || 'home';
      setTabHistory(newHistory);
      setCurrentTab(previousTab);
    } else {
      setCurrentTab('home');
      setTabHistory(['home']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'notifications': return 'MOSA Notification Centre';
      case 'directory': return 'Alumni Registry';
      case 'membership': return 'Membership & Number Guide';
      case 'payments': return 'Donations & Giving';
      case 'events': return 'Events & Reunions';
      case 'attendance': return 'Meeting Attendance';
      case 'gallery': return 'Campus Heritage Gallery';
      case 'news': return 'News & Official Circulars';
      case 'chapters': return 'Campus & Institutional Chapters';
      case 'documents': return 'Official Documents & Archives';
      case 'about': return 'About MASSH & MOSA';
      case 'contact': return 'Contact Secretariat';
      case 'my-profile': return 'My Alumni Dashboard';
      case 'opportunities': return 'Opportunities & Mentorship Hub';
      case 'elections': return 'Elections & Digital Voting';
      case 'welcome': return 'MOSA Welcome Experience';
      default: return 'Alumni Services';
    }
  };

  // Dynamic Module Toggles (Configured by Administrator)
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({
    home: true,
    about: true,
    membership: true,
    directory: true,
    news: true,
    events: true,
    gallery: true,
    documents: true,
    contact: true,
    giving: true,
    chapters: true,
    attendance: true,
    opportunities: true,
    elections: true,
  });

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPortal, setAuthPortal] = useState<'alumni' | 'admin'>('alumni');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMembershipCardOpen, setIsMembershipCardOpen] = useState(false);
  const [cardTargetAlumnus, setCardTargetAlumnus] = useState<AlumniProfile | null>(null);
  const [selectedAlumnus, setSelectedAlumnus] = useState<AlumniProfile | null>(null);
  const [verifyInitialQuery, setVerifyInitialQuery] = useState<string>('');

  const openAuth = (portal: 'alumni' | 'admin' = 'alumni') => {
    setAuthPortal(portal);
    setIsAuthOpen(true);
  };

  const refreshUserData = async () => {
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    try {
      const modules = await dataService.getModuleSettings();
      setModuleSettings(modules);

      const notifs = await dataService.getAlumniNotifications(user?.alumniId || 'alumni-0001');
      setUnreadNotifsCount(notifs.filter(n => !n.isRead).length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        await refreshUserData();
      } finally {
        setAuthResolving(false);
      }
    };
    initApp();

    // Check for ?verify-card= query parameter from scannable QR code
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verify-card');
      if (verifyToken) {
        setVerifyInitialQuery(verifyToken);
        setIsVerifyOpen(true);
      }
    }
  }, []);

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
    setIsGuestBrowsing(false);
    setPortalMode('member');
    setCurrentTab('home');
    setTabHistory(['home']);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || isStaffRole(user.role)) {
      setPortalMode('admin');
    } else if (user.role === 'ALUMNI') {
      setCurrentTab('my-profile');
    }
    refreshUserData();
  };

  const handleAdminGateClick = () => {
    if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || isStaffRole(currentUser.role))) {
      setPortalMode('admin');
    } else {
      openAuth('admin');
    }
  };

  // ==============================================================
  // 1. SESSION RESOLUTION LOADING STATE (Requirement Section 1)
  // ==============================================================
  if (authResolving) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at top, #113D2B 0%, #0A271B 65%, #05160F 100%)',
          color: '#FFFFFF',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C68A24 0%, #9A6814 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
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
            marginBottom: '0.25rem',
          }}
        >
          Mandela Old Students Association
        </div>
        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 1.25rem 0',
          }}
        >
          MASSH ALUMNI PORTAL
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            color: '#CBD5E1',
            fontSize: '0.88rem',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Loader2 size={17} className="animate-spin" />
          <span>Restoring authenticated session...</span>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 2. MOSA WELCOME VIEW & AUTHENTICATION GATE
  // Public visitors see the official MOSA Welcome Experience by default
  // ==============================================================
  if (!currentUser && !isGuestBrowsing) {
    if (showAuthGate) {
      return (
        <AuthenticationGate
          portal={authPortal}
          initialMode={authPortal === 'admin' ? 'admin-login' : 'login'}
          onLoginSuccess={(user) => {
            setShowAuthGate(false);
            handleLoginSuccess(user);
          }}
          onCancel={() => setShowAuthGate(false)}
        />
      );
    }

    return (
      <>
        <MOSAWelcomeView
          currentUser={null}
          onOpenLogin={() => { setAuthPortal('alumni'); setShowAuthGate(true); }}
          onOpenRegisterAccount={() => { setAuthPortal('alumni'); setShowAuthGate(true); }}
          onOpenVerify={() => setIsVerifyOpen(true)}
          onGoToPortal={() => { setIsGuestBrowsing(true); setCurrentTab('home'); }}
          onGoToAdmin={() => { setAuthPortal('admin'); setShowAuthGate(true); }}
        />
        {isVerifyOpen && (
          <PublicVerifyAlumniModal
            isOpen={isVerifyOpen}
            onClose={() => setIsVerifyOpen(false)}
            initialQuery={verifyInitialQuery}
          />
        )}
      </>
    );
  }

  // ==============================================================
  // 2.5. SUPER ADMIN FORCED PASSWORD CHANGE (Requirement Section 4)
  // Blocks admin dashboard access until initial temporary password replaced
  // ==============================================================
  if (currentUser && currentUser.mustChangePassword && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')) {
    return (
      <SuperAdminPasswordChangeModal
        currentUser={currentUser}
        onSuccess={() => {
          const updated = dataService.getCurrentUser();
          if (updated) setCurrentUser(updated);
        }}
        onCancel={() => {
          handleLogout();
        }}
      />
    );
  }

  // ==============================================================
  // 3. OPTIONAL ALUMNI ONBOARDING (Requirement Section 3 & 4)
  // Presented immediately after account creation
  // ==============================================================
  if (currentUser && currentUser.alumniOnboardingDecision === 'PENDING') {
    return (
      <>
        <AlumniOnboardingScreen
          currentUser={currentUser}
          onRegister={() => setIsRegisterOpen(true)}
          onSkip={async () => {
            await dataService.skipAlumniOnboarding(currentUser.uid);
            setCurrentUser(prev => prev ? { ...prev, alumniOnboardingDecision: 'SKIPPED' } : null);
            setCurrentTab('welcome');
          }}
        />
        {isRegisterOpen && (
          <AlumniRegistrationWizard
            isOpen={isRegisterOpen}
            onClose={() => {
              setIsRegisterOpen(false);
              const latestUser = dataService.getCurrentUser();
              if (latestUser) {
                setCurrentUser(latestUser);
              } else {
                setCurrentUser(prev => prev ? { ...prev, alumniOnboardingDecision: 'COMPLETED' } : null);
              }
              refreshUserData();
            }}
            onSuccess={async () => {
              if (currentUser) {
                await dataService.completeAlumniOnboarding(currentUser.uid);
                refreshUserData();
              }
            }}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

  // ==============================================================
  // 4. DEDICATED ADMINISTRATOR ACCESS (Requirement Section 5)
  // Ordinary accounts never receive administrative privileges automatically
  // ==============================================================
  if (portalMode === 'admin') {
    if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || isStaffRole(currentUser.role))) {
      return (
        <AdminControlPanel
          currentUser={currentUser}
          onReturnToMemberPortal={() => setPortalMode('member')}
          onRefreshData={refreshUserData}
        />
      );
    } else {
      setPortalMode('member');
    }
  }

  // ==========================================
  // USER / MEMBER PORTAL ENVIRONMENT
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F6F0' }}>
      {/* Member Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        currentUser={currentUser}
        moduleSettings={moduleSettings}
        unreadNotificationsCount={unreadNotifsCount}
        onOpenNotifications={() => handleNavigate('notifications')}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenAuth={() => openAuth('alumni')}
        onLogout={handleLogout}
        onOpenAdmin={handleAdminGateClick}
        onSwitchToAdmin={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || isStaffRole(currentUser.role)) ? () => setPortalMode('admin') : handleAdminGateClick}
      />

      {/* Main Content Area */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        {/* Universal Sticky In-App Back Bar for All Secondary Screens */}
        {currentTab !== 'home' && (
          <aside 
            aria-label="Screen Navigation"
            className="universal-back-bar"
            style={{ 
              background: '#FFFFFF', 
              borderBottom: '1px solid #E5DFD1', 
              position: 'sticky', 
              top: 0, 
              zIndex: 90,
              padding: '0.65rem 1.25rem',
              boxShadow: '0 2px 4px rgba(10, 39, 27, 0.04)'
            }}
          >
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                id="btn-global-inapp-back"
                onClick={handleBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#113D2B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="universal-back-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#4B6354' }}>
                <button 
                  onClick={() => { setCurrentTab('home'); setTabHistory(['home']); }}
                  style={{ background: 'none', border: 'none', color: '#C68A24', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Dashboard
                </button>
                <span>/</span>
                <span style={{ color: '#0B271C', fontWeight: 600 }}>{getTabLabel(currentTab)}</span>
              </div>
            </div>
          </aside>
        )}

        {/* 0. DEDICATED NOTIFICATIONS VIEW (Top / Primary Content Area) */}
        {currentTab === 'notifications' && (
          <NotificationsView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onOpenAdmin={handleAdminGateClick}
            onRefreshNotifs={refreshUserData}
          />
        )}

        {/* 0.5. OFFICIAL MOSA WELCOME VIEW */}
        {currentTab === 'welcome' && (
          <MOSAWelcomeView
            currentUser={currentUser}
            onOpenLogin={() => openAuth('alumni')}
            onOpenRegisterAccount={() => openAuth('alumni')}
            onOpenAlumniRegistration={() => setIsRegisterOpen(true)}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onGoToPortal={() => handleNavigate('home')}
            onGoToAdmin={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || isStaffRole(currentUser.role)) ? () => setPortalMode('admin') : handleAdminGateClick}
          />
        )}

        {/* 1. HOME VIEW */}
        {currentTab === 'home' && moduleSettings.home && (
          <HomeView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onOpenNotifications={() => handleNavigate('notifications')}
            unreadNotificationsCount={unreadNotifsCount}
            onSelectAlumni={alumnus => setSelectedAlumnus(alumnus)}
          />
        )}

        {/* 2. ABOUT MASSH & MOSA */}
        {currentTab === 'about' && moduleSettings.about && (
          <AboutView onBack={handleBack} />
        )}

        {/* 3. MEMBERSHIP & NUMBER GUIDE */}
        {currentTab === 'membership' && moduleSettings.membership && (
          <MembershipView
            currentUser={currentUser}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenVerify={() => setIsVerifyOpen(true)}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {/* 4. ALUMNI DIRECTORY */}
        {currentTab === 'directory' && moduleSettings.directory && (
          <AlumniDirectory
            currentUser={currentUser}
            onSelectAlumni={alumnus => setSelectedAlumnus(alumnus)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 4.5. MEETING ATTENDANCE ROLL CALL */}
        {currentTab === 'attendance' && moduleSettings.attendance && (
          <MemberAttendanceView
            currentUser={currentUser}
            onOpenAuth={() => openAuth('alumni')}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 5. NEWS / ANNOUNCEMENTS */}
        {currentTab === 'news' && moduleSettings.news && (
          <CommunicationsHub
            currentUser={currentUser}
            onOpenAuth={() => openAuth('alumni')}
            onBack={handleBack}
          />
        )}

        {/* 6. EVENTS */}
        {currentTab === 'events' && moduleSettings.events && (
          <EventsHub
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 7. GALLERY */}
        {currentTab === 'gallery' && moduleSettings.gallery && (
          <CampusHeritageGallery
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 8. DOCUMENTS ARCHIVE */}
        {currentTab === 'documents' && moduleSettings.documents && (
          <DocumentsView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 9. CONTACT SECRETARIAT */}
        {currentTab === 'contact' && moduleSettings.contact && (
          <ContactView
            currentUser={currentUser}
            onBack={handleBack}
          />
        )}

        {/* 10. CHAPTERS (If enabled) */}
        {currentTab === 'chapters' && moduleSettings.chapters && (
          <ChaptersHub
            currentUser={currentUser}
            onSelectAlumnus={alumnus => setSelectedAlumnus(alumnus)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 11. GIVING & DUES (If enabled) */}
        {currentTab === 'payments' && moduleSettings.giving && (
          <PaymentsHub
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 11.5. OPPORTUNITIES & MENTORSHIP HUB */}
        {currentTab === 'opportunities' && (moduleSettings.opportunities ?? true) && (
          <OpportunitiesHub
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
            onNavigateTab={handleNavigate}
          />
        )}

        {/* 11.6. ELECTIONS & DIGITAL VOTING */}
        {currentTab === 'elections' && (moduleSettings.elections ?? true) && (
          <ElectionsHub
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 12. LOGGED-IN ALUMNUS DASHBOARD / MY PROFILE */}
        {currentTab === 'my-profile' && currentUser && (
          <AlumniDashboardView
            currentUser={currentUser}
            onOpenEditModal={alumnus => setSelectedAlumnus(alumnus)}
            onBack={handleBack}
            onNavigateToTab={tab => setCurrentTab(tab as any)}
          />
        )}
      </main>

      {/* Member Portal Footer */}
      <footer style={{ background: '#0A271B', color: '#CBD5CD', padding: '2.5rem 1.25rem', borderTop: '2px solid #C68A24', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ color: '#FDE68A', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              MASSH ALUMNI PORTAL
            </div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', marginTop: '0.15rem' }}>
              Mandela Secondary School Hoima (MASSH)
            </div>
            <div style={{ color: '#CBD5CD', fontSize: '0.82rem', marginTop: '0.2rem', fontWeight: 600 }}>
              Mandela Old Students Association (MOSA) • Founded 1997
            </div>
            <div style={{ color: '#8BA193', fontSize: '0.78rem', marginTop: '0.35rem', fontStyle: 'italic' }}>
              "Education is the Most Powerful Weapon"
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsVerifyOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FCD34D',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ShieldCheck size={15} />
              <span>Verify Alumni Number</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        currentUser={currentUser}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenNotifications={() => handleNavigate('notifications')}
        unreadNotificationsCount={unreadNotifsCount}
      />

      {/* Member Registration Wizard */}
      {isRegisterOpen && (
        <AlumniRegistrationWizard
          isOpen={isRegisterOpen}
          onClose={() => {
            setIsRegisterOpen(false);
            refreshUserData();
          }}
          onSuccess={async () => {
            if (currentUser) {
              await dataService.completeAlumniOnboarding(currentUser.uid);
              setCurrentUser(prev => prev ? { ...prev, alumniOnboardingDecision: 'COMPLETED' } : null);
            }
            refreshUserData();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Public Number Verification Modal */}
      <PublicVerifyAlumniModal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setVerifyInitialQuery('');
        }}
        initialQuery={verifyInitialQuery}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Alumni Profile Detail Modal */}
      <AlumniProfileModal
        alumnus={selectedAlumnus}
        onClose={() => setSelectedAlumnus(null)}
        currentUser={currentUser}
        onProfileUpdated={refreshUserData}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialPortal={authPortal}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Notifications Drawer */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          refreshUserData();
        }}
        currentUser={currentUser}
        onNavigateTab={(tab) => {
          if (tab === 'admin') {
            handleAdminGateClick();
          } else {
            handleNavigate(tab);
          }
          setIsNotificationsOpen(false);
        }}
      />

      {/* Digital Membership Card Export Modal */}
      <DigitalMembershipCardModal
        alumnus={cardTargetAlumnus || (currentUser?.alumniNumber ? {
          internalId: currentUser.alumniId || 'alumni-0001',
          alumniNumber: currentUser.alumniNumber || 'MA. 0001',
          firstName: currentUser.displayName?.split(' ')[0] || 'Alumnus',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || 'Member',
          fullName: currentUser.displayName,
          email: currentUser.email,
          phone: currentUser.phone || '',
          gender: 'Other',
          dateOfBirth: '1990-01-01',
          country: 'Uganda',
          city: 'Hoima',
          membershipStatus: 'ACTIVE',
          schoolHistory: { attendedOLevel: true, attendedALevel: true },
          privacySettings: { showName: true, showNickname: true, showProfession: true, showOrganisation: true, showCountry: true, showPhone: false, showEmail: false },
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          verifiedAt: '2026-01-01',
          verifiedBy: 'Secretariat',
          applicationId: 'app-001'
        } as AlumniProfile : null)}
        isOpen={isMembershipCardOpen}
        onClose={() => {
          setIsMembershipCardOpen(false);
          setCardTargetAlumnus(null);
        }}
        onOpenPublicVerification={(num) => setIsVerifyOpen(true)}
      />
    </div>
  );
};

export default App;
