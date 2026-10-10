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
import { PublicVerifyAlumniModal } from './components/PublicVerifyAlumniModal';
import { NotificationsModal } from './components/NotificationsModal';
import { NotificationsView } from './components/NotificationsView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { dataService } from './services/dataService';
import { isStaffRole } from './services/governanceService';
import { MemberAttendanceView } from './components/MemberAttendanceView';
import { OpportunitiesHub } from './components/OpportunitiesHub';
import { ElectionsHub } from './components/ElectionsHub';
import { DigitalMembershipCardModal } from './components/DigitalMembershipCardModal';
import { AlumniProfile, AuthUser, ModuleSettings } from './types';
import { ShieldCheck, Lock, Sliders, ArrowUpRight, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  // Application Mode: Member Portal vs Dedicated Admin Control Panel
  const [portalMode, setPortalMode] = useState<'member' | 'admin'>('member');
  
  // Current Active Tab in Member Portal
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [tabHistory, setTabHistory] = useState<string[]>(['home']);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

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
      case 'directory': return 'Alumni Directory & Registry';
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMembershipCardOpen, setIsMembershipCardOpen] = useState(false);
  const [cardTargetAlumnus, setCardTargetAlumnus] = useState<AlumniProfile | null>(null);
  const [selectedAlumnus, setSelectedAlumnus] = useState<AlumniProfile | null>(null);
  const [verifyInitialQuery, setVerifyInitialQuery] = useState<string>('');

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
    refreshUserData();

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
    setPortalMode('member');
    setCurrentTab('home');
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
      setIsAuthOpen(true);
    }
  };

  // If in Dedicated Admin Mode and authenticated as Admin or Executive Staff
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
      // Admin authentication prompt
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07152B', padding: '1.5rem' }}>
          <div className="mosa-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', background: '#FFFFFF' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <ShieldCheck size={36} color="#D97706" />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#0B203E', marginBottom: '0.5rem' }}>
              MOSA Administrative Portal
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              Access to the administrative control suite, member reviews, and system settings is restricted to authorized MASSH administrators.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsAuthOpen(true)}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                Sign In as Administrator
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPortalMode('member')}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                Return to Member Portal
              </button>
            </div>
          </div>
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      );
    }
  }

  // ==========================================
  // USER / MEMBER PORTAL ENVIRONMENT
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
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
        onOpenAuth={() => setIsAuthOpen(true)}
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
              borderBottom: '1px solid #E2E8F0', 
              position: 'sticky', 
              top: 0, 
              zIndex: 90,
              padding: '0.65rem 1.25rem',
              boxShadow: '0 2px 4px rgba(11, 32, 62, 0.04)'
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
                  background: '#0B203E',
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

              <div className="universal-back-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748B' }}>
                <button 
                  onClick={() => { setCurrentTab('home'); setTabHistory(['home']); }}
                  style={{ background: 'none', border: 'none', color: '#D97706', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Dashboard
                </button>
                <span>/</span>
                <span style={{ color: '#0B203E', fontWeight: 600 }}>{getTabLabel(currentTab)}</span>
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
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onBack={handleBack}
          />
        )}

        {/* 5. NEWS / ANNOUNCEMENTS */}
        {currentTab === 'news' && moduleSettings.news && (
          <CommunicationsHub
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
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
      <footer style={{ background: '#07152B', color: '#94A3B8', padding: '2.5rem 1.25rem', borderTop: '2px solid #D97706', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
              Mandela Secondary School Hoima (MASSH)
            </div>
            <div style={{ color: '#FBBF24', fontSize: '0.82rem', marginTop: '0.2rem', fontWeight: 600 }}>
              Mandela Old Students Association (MOSA) • Founded 1997
            </div>
            <div style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '0.35rem', fontStyle: 'italic' }}>
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

      {/* Member Registration Wizard with Direct Image Upload & Auto-Approval */}
      {isRegisterOpen && (
        <AlumniRegistrationWizard
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={refreshUserData}
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
