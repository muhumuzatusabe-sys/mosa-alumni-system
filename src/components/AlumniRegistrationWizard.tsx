import React, { useState, useEffect } from 'react';
import { dataService, defaultSeedChapters } from '../services/dataService';
import { Chapter, AuthUser } from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  User, 
  Phone, 
  Briefcase, 
  Lock,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Eye,
  FileCheck,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon,
  Search
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: AuthUser | null;
}

const STEPS = [
  { id: 1, label: 'Account', icon: Lock },
  { id: 2, label: 'Personal', icon: User },
  { id: 3, label: 'MASSH History', icon: GraduationCap },
  { id: 4, label: 'Career & Higher Ed', icon: Briefcase },
  { id: 5, label: 'Contact & Location', icon: MapPin },
  { id: 6, label: 'MOSA Chapter', icon: Building2 },
  { id: 7, label: 'Privacy Preferences', icon: Eye },
  { id: 8, label: 'Review & Submit', icon: FileCheck },
];

export const AlumniRegistrationWizard: React.FC<Props> = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>(defaultSeedChapters);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ id: string; referenceId: string; name: string; alumniNumber?: string } | null>(null);
  const [allowSelfAssignedNumber, setAllowSelfAssignedNumber] = useState<boolean>(false);
  const [chapterCategoryFilter, setChapterCategoryFilter] = useState<'ALL' | 'UNIVERSITY' | 'REGIONAL' | 'DIASPORA'>('ALL');
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const wizardBodyRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wizardBodyRef.current) {
      wizardBodyRef.current.scrollTop = 0;
    }
  }, [step, isOpen]);

  // Assisted Registration & Flexible Phone/Credentials Support
  const [registrationMode, setRegistrationMode] = useState<'SELF' | 'ASSISTED'>('SELF');
  const [hasInitialCredentials, setHasInitialCredentials] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    accountEmail: '',
    accountPhone: '',
    password: '',
    confirmPassword: '',

    // Step 2: Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '', // Nickname at School
    existingAlumniNumber: '', // Optional existing permanent number from physical register
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '',
    photoUrl: '',

    // Step 3: School History (MASSH)
    attendanceMode: 'BOTH' as 'O_LEVEL_ONLY' | 'A_LEVEL_ONLY' | 'BOTH',
    attendedOLevel: true,
    oYearJoined: 2017,
    oYearCompleted: 2020,
    oCampus: 'Main Campus Hoima',
    oClass: 'Senior 4',
    oStream: 'Blue Stream',

    attendedALevel: true,
    aYearJoined: 2021,
    aYearCompleted: 2022,
    aCampus: 'Main Campus Hoima',
    aClass: 'Senior 6',
    aCombination: 'PCM/ICT',

    // Step 4: Higher Education & Career
    currentInstitution: '',
    programme: '',
    highestQualification: "Bachelor's Degree",
    occupation: '',
    organisation: '',
    position: '',
    bio: '',

    // Step 5: Contact & Location
    phone: '',
    email: '',
    country: 'Uganda',
    city: 'Hoima',
    address: '',
    linkedIn: '',
    socialLink: '',

    // Step 6: Chapter
    selectedChapterId: '',

    // Step 7: Privacy Settings
    showName: true,
    showNickname: true,
    showProfession: true,
    showOrganisation: true,
    showCountry: true,
    showPhone: false, // Default false per spec
    showEmail: false, // Default false per spec

    // Step 8: Declaration
    declarationAccepted: false,
  });

  useEffect(() => {
    if (isOpen) {
      dataService.getChapters('ACTIVE').then(list => {
        if (list && list.length > 0) {
          setChapters(list);
        } else {
          setChapters(defaultSeedChapters);
        }
      }).catch(() => setChapters(defaultSeedChapters));
      dataService.getSystemSettings().then(settings => {
        setAllowSelfAssignedNumber(settings.allowSelfAssignedAlumniNumber === true);
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentUser?.email) {
      setFormData(prev => ({
        ...prev,
        accountEmail: prev.accountEmail || currentUser.email,
        email: prev.email || currentUser.email,
        firstName: prev.firstName || (currentUser.displayName ? currentUser.displayName.split(' ')[0] : ''),
        lastName: prev.lastName || (currentUser.displayName && currentUser.displayName.split(' ').length > 1 ? currentUser.displayName.split(' ').slice(1).join(' ') : ''),
        phone: prev.phone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        // Sync account email/phone with contact email/phone if user edits them
        if (name === 'accountEmail' && !prev.email) next.email = value;
        if (name === 'accountPhone' && !prev.phone) next.phone = value;
        return next;
      });
    }
  };

  const handleAttendanceModeChange = (mode: 'O_LEVEL_ONLY' | 'A_LEVEL_ONLY' | 'BOTH') => {
    setFormData(prev => ({
      ...prev,
      attendanceMode: mode,
      attendedOLevel: mode === 'O_LEVEL_ONLY' || mode === 'BOTH',
      attendedALevel: mode === 'A_LEVEL_ONLY' || mode === 'BOTH',
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (registrationMode === 'SELF' && currentUser?.email) {
        return true;
      }
      if (hasInitialCredentials) {
        if (!formData.accountEmail.trim() && !formData.accountPhone.trim()) {
          setErrorMsg('Please enter either an email address or mobile phone number for verification.');
          return false;
        }
        if (formData.accountEmail.trim() && !formData.accountEmail.includes('@')) {
          setErrorMsg('Please enter a valid account email address.');
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg('Passwords do not match. Please re-enter.');
          return false;
        }
      }
    } else if (currentStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setErrorMsg('First Name and Last Name are mandatory.');
        return false;
      }
      if (!formData.dateOfBirth) {
        setErrorMsg('Please provide your Date of Birth.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.attendedOLevel && !formData.attendedALevel) {
        setErrorMsg('Please select your study level at MASSH (O-Level, A-Level, or Both).');
        return false;
      }
      if (formData.attendedOLevel) {
        if (formData.oYearJoined > formData.oYearCompleted) {
          setErrorMsg('O-Level year joined cannot be later than year completed.');
          return false;
        }
        if (formData.oYearJoined < 1997) {
          setErrorMsg('MASSH was founded in 1997. Joined year cannot be earlier than 1997.');
          return false;
        }
      }
      if (formData.attendedALevel) {
        if (formData.aYearJoined > formData.aYearCompleted) {
          setErrorMsg('A-Level year joined cannot be later than year completed.');
          return false;
        }
        if (formData.aYearJoined < 1997) {
          setErrorMsg('MASSH was founded in 1997. Joined year cannot be earlier than 1997.');
          return false;
        }
      }
    } else if (currentStep === 4) {
      // Step 4 is optional
    } else if (currentStep === 5) {
      if (!formData.country.trim() || !formData.city.trim()) {
        setErrorMsg('Country and City / District are required.');
        return false;
      }
    } else if (currentStep === 6) {
      // Chapter selection is optional
    } else if (currentStep === 7) {
      // Privacy preferences have sensible defaults
    } else if (currentStep === 8) {
      if (!formData.declarationAccepted) {
        setErrorMsg('You must check the official declaration confirming the authenticity of your study records.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  const handleCopyReference = () => {
    if (successInfo?.referenceId) {
      navigator.clipboard.writeText(successInfo.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const handleCopyNumber = () => {
    if (successInfo?.alumniNumber) {
      navigator.clipboard.writeText(successInfo.alumniNumber);
      setCopiedNum(true);
      setTimeout(() => setCopiedNum(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const applicationPayload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim() || undefined,
        existingAlumniNumber: (allowSelfAssignedNumber && formData.existingAlumniNumber.trim()) ? formData.existingAlumniNumber.trim() : undefined,
        cohortYear: String(formData.aYearCompleted || formData.oYearCompleted),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        photoUrl: formData.photoUrl.trim() || undefined,
        phone: formData.phone.trim() || formData.accountPhone.trim(),
        email: formData.email.trim() || formData.accountEmail.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        linkedIn: formData.linkedIn.trim() || undefined,
        socialLink: formData.socialLink.trim() || undefined,
        currentInstitution: formData.currentInstitution.trim() || undefined,
        programme: formData.programme.trim() || undefined,
        highestQualification: formData.highestQualification || undefined,
        occupation: formData.occupation.trim() || undefined,
        organisation: formData.organisation.trim() || undefined,
        position: formData.position.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        selectedChapterId: formData.selectedChapterId || undefined,
        declarationAccepted: formData.declarationAccepted,
        registrationMode,
        registeredBy: registrationMode === 'ASSISTED' && currentUser ? {
          name: currentUser.displayName,
          alumniNumber: currentUser.alumniNumber,
          uid: currentUser.uid,
          email: currentUser.email,
          registeredAt: new Date().toISOString(),
        } : undefined,
        accountActivated: hasInitialCredentials && !!(formData.accountEmail || formData.accountPhone),
        schoolHistory: {
          attendedOLevel: formData.attendedOLevel,
          oLevel: formData.attendedOLevel ? {
            yearJoined: Number(formData.oYearJoined),
            yearCompleted: Number(formData.oYearCompleted),
            campus: formData.oCampus,
            class: formData.oClass,
            stream: formData.oStream,
          } : undefined,
          attendedALevel: formData.attendedALevel,
          aLevel: formData.attendedALevel ? {
            yearJoined: Number(formData.aYearJoined),
            yearCompleted: Number(formData.aYearCompleted),
            campus: formData.aCampus,
            class: formData.aClass,
            combination: formData.aCombination,
          } : undefined,
        },
        privacySettings: {
          showName: formData.showName,
          showNickname: formData.showNickname,
          showProfession: formData.showProfession,
          showOrganisation: formData.showOrganisation,
          showCountry: formData.showCountry,
          showPhone: formData.showPhone,
          showEmail: formData.showEmail,
        },
      };

      const res = await dataService.submitApplication(applicationPayload);
      if (res.success && res.id) {
        setSuccessInfo({
          id: res.id,
          referenceId: res.referenceId || `MOSA-${new Date().getFullYear()}-${res.id.slice(-5)}`,
          name: `${formData.firstName} ${formData.lastName}`,
          alumniNumber: res.alumniNumber,
        });
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to submit application. Please check details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const selectedChapterObj = chapters.find(c => c.id === formData.selectedChapterId);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{ zIndex: 1100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '820px', 
          width: '94%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(11, 32, 62, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 60%, #18533B 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderBottom: '3px solid #C68A24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}>
                M
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.3px' }}>
                MOSA Alumni Registration Portal
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1' }}>
              Mandela Secondary School Hoima • Official Verification &amp; Registry Admission
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ 
              color: '#CBD5E1', 
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="Exit Registration (Esc)"
            aria-label="Exit Registration"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Step Indicator Bar */}
        {!successInfo && (
          <>
            {/* Desktop Step Pills */}
            <div className="desktop-step-pills" style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '0.75rem 1.25rem',
              overflowX: 'auto',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 'max-content' }}>
                {STEPS.map((s, idx) => {
                  const IconComponent = s.icon;
                  const isCompleted = step > s.id;
                  const isActive = step === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div 
                        onClick={() => isCompleted && setStep(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: isCompleted ? 'pointer' : 'default',
                          opacity: isActive ? 1 : isCompleted ? 0.85 : 0.45,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isActive ? '#0B203E' : isCompleted ? '#059669' : '#E2E8F0',
                          color: isActive || isCompleted ? '#ffffff' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: isActive ? '2px solid #D97706' : 'none'
                        }}>
                          {isCompleted ? <Check size={14} /> : s.id}
                        </div>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#0B203E' : isCompleted ? '#059669' : '#64748B',
                          whiteSpace: 'nowrap'
                        }}>
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div style={{
                          flex: 1,
                          height: '2px',
                          background: isCompleted ? '#059669' : '#E2E8F0',
                          minWidth: '14px'
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile Step Header with Progress Bar */}
            <div className="mobile-step-header" style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '0.65rem 1rem',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B203E' }}>
                  Step {step} of {STEPS.length}: {STEPS[step - 1]?.label}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  {Math.round((step / STEPS.length) * 100)}%
                </span>
              </div>
              <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(step / STEPS.length) * 100}%`,
                  background: 'linear-gradient(90deg, #D97706 0%, #2563EB 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </>
        )}

        {/* Modal Scrollable Body */}
        <div ref={wizardBodyRef} className="wizard-body" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {errorMsg && (
            <div style={{
              background: '#FEE2E2',
              borderLeft: '4px solid #EF4444',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#991B1B',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {successInfo ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: successInfo.alumniNumber ? '#D1FAE5' : '#FEF3C7',
                color: successInfo.alumniNumber ? '#059669' : '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle2 size={44} />
              </div>
              <div style={{
                display: 'inline-block',
                background: successInfo.alumniNumber ? '#D1FAE5' : '#FEF3C7',
                color: successInfo.alumniNumber ? '#065F46' : '#92400E',
                padding: '0.25rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {successInfo.alumniNumber ? 'Instant Approval Confirmed' : 'Application Submitted • Pending Verification'}
              </div>
              <h2 style={{ fontSize: '1.6rem', color: '#0B203E', marginBottom: '0.5rem' }}>
                {successInfo.alumniNumber ? 'Registration & Membership Approved!' : 'Registration Submitted for Verification'}
              </h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
                {successInfo.alumniNumber ? (
                  <>Welcome, <strong>{successInfo.name}</strong>. Your alumni record has been registered and verified.</>
                ) : (
                  <>Thank you, <strong>{successInfo.name}</strong>. Your MASSH alumni registration has been received and submitted to the MOSA Secretariat for credential verification.</>
                )}
              </p>

              {/* Number & Reference Card */}
              <div style={{
                maxWidth: '480px',
                margin: '0 auto 1.75rem auto',
                background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 12px 24px -6px rgba(10, 39, 27, 0.35)',
                border: '1.5px solid #C68A24'
              }}>
                {successInfo.alumniNumber ? (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Official MOSA Membership Number
                    </div>
                    <div style={{
                      fontSize: '2.2rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '2px',
                    }}>
                      {successInfo.alumniNumber}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      style={{
                        marginTop: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: copiedNum ? '#059669' : '#D97706',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedNum ? <Check size={14} /> : <Copy size={14} />}
                      {copiedNum ? 'Number Copied!' : 'Copy Membership Number'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Alumni Number Allocation
                    </div>
                    <div style={{
                      fontSize: '1.3rem',
                      fontFamily: 'sans-serif',
                      fontWeight: 700,
                      color: '#E2E8F0',
                      padding: '0.4rem 0'
                    }}>
                      Allocated upon Secretariat Verification
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#CBD5E1', opacity: 0.9 }}>
                      Official sequential MA number will be assigned once approved.
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Tracking Reference ID</div>
                    <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>{successInfo.referenceId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedRef ? 'Copied' : 'Copy Ref'}
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div style={{
                maxWidth: '520px',
                margin: '0 auto 2rem auto',
                background: successInfo.alumniNumber ? '#EFF6FF' : '#FFFBEB',
                border: successInfo.alumniNumber ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                textAlign: 'left',
                fontSize: '0.85rem',
                color: successInfo.alumniNumber ? '#1E3A8A' : '#92400E',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: successInfo.alumniNumber ? '#1E40AF' : '#B45309' }}>
                  <ShieldCheck size={16} /> {successInfo.alumniNumber ? 'Instant Active Privileges' : 'Verification Process & Next Steps'}
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {successInfo.alumniNumber ? (
                    <>
                      <li>Your status is officially <strong>ACTIVE</strong> in the MOSA Alumni Registry.</li>
                      <li>Your membership can be publicly verified anytime at the <strong>Verify Alumni</strong> desk.</li>
                      <li>Log in with your email and password to view and flip your 3D Digital Membership Pass.</li>
                    </>
                  ) : (
                    <>
                      <li>Your application is safely in the Secretariat review queue.</li>
                      <li>Your dashboard membership panel will reflect <strong>Pending Verification</strong>.</li>
                      <li>You can browse the MASSH Alumni Portal while verification proceeds.</li>
                    </>
                  )}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  id="btn-registration-complete-close"
                  className="btn btn-primary"
                  onClick={onClose}
                  style={{ minWidth: '160px', padding: '0.75rem 1.5rem' }}
                >
                  {successInfo.alumniNumber ? 'Go to Dashboard & View Pass' : 'Enter Alumni Portal'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={step === 8 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              
              {/* STEP 1: ACCOUNT DETAILS */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={18} color="#D97706" /> Step 1: Registration Mode & Credentials
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Configure whether you are registering for yourself or assisting another alumnus on your device.
                    </p>
                  </div>

                  {/* Self vs Assisted Registration Selector */}
                  {currentUser && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '10px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', display: 'block', marginBottom: '0.5rem' }}>
                        Registration Mode:
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer', color: '#334155' }}>
                          <input
                            type="radio"
                            name="regMode"
                            checked={registrationMode === 'SELF'}
                            onChange={() => setRegistrationMode('SELF')}
                          />
                          <span><strong>Self Registration</strong> - I am registering myself</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer', color: '#334155' }}>
                          <input
                            type="radio"
                            name="regMode"
                            checked={registrationMode === 'ASSISTED'}
                            onChange={() => setRegistrationMode('ASSISTED')}
                          />
                          <span><strong>Assisted Registration</strong> - I am assisting another alumnus on this device (their record remains independent and not tied to my login)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {registrationMode === 'SELF' && currentUser?.email ? (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#DCFCE7',
                        color: '#16A34A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ShieldCheck size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
                          Authenticated Account Linked
                        </div>
                        <div style={{ fontSize: '0.86rem', color: '#15803D', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                          You are signed in as <strong>{currentUser.email}</strong>. Your alumni record will be permanently linked to this account upon submission.
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#166534', background: '#DCFCE7', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 600 }}>
                          <Check size={14} /> Active Session Verified • No password recreation required
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Flexible Credentials Toggle */}
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer', color: '#92400E' }}>
                          <input
                            type="checkbox"
                            checked={hasInitialCredentials}
                            onChange={e => setHasInitialCredentials(e.target.checked)}
                            style={{ marginTop: '2px' }}
                          />
                          <div>
                            <strong>Create member login credentials now</strong>
                            <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '0.15rem' }}>
                              Uncheck if the member does not own a smartphone or active email right now. Their registry record will still be created, permanent MA number assigned, and login can be activated at a later date.
                            </div>
                          </div>
                        </label>
                      </div>

                      {hasInitialCredentials ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontWeight: 600 }}>
                                Account Email Address
                              </label>
                              <input
                                type="email"
                                name="accountEmail"
                                value={formData.accountEmail}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="yourname@domain.com"
                              />
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Optional if phone is provided.</span>
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ fontWeight: 600 }}>
                                Mobile Phone Number
                              </label>
                              <input
                                type="tel"
                                name="accountPhone"
                                value={formData.accountPhone}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="e.g. +256 772 123 456"
                              />
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Optional if email is provided.</span>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontWeight: 600 }}>
                                Create Password <span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Minimum 6 characters"
                                required={hasInitialCredentials}
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ fontWeight: 600 }}>
                                Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                              </label>
                              <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Re-enter password"
                                required={hasInitialCredentials}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', color: '#475569', fontSize: '0.85rem' }}>
                          Credentials skipped. Proceed to Personal Identification.
                        </div>
                      )}
                    </>
                  )}

                  <div style={{
                    background: '#EFF6FF',
                    borderLeft: '4px solid #3B82F6',
                    padding: '0.85rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    color: '#1E40AF',
                    lineHeight: '1.5'
                  }}>
                    <strong>Notice:</strong> Your permanent official <strong>MA. XXXX</strong> membership number is automatically issued upon completion.
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL INFORMATION */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={18} color="#D97706" /> Step 2: Personal Identification
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Provide your full legal names and authentic school nickname as known during your time at Mandela SS Hoima.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        First Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Kenneth"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Brian"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Last Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Ayesiga"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Existing Alumni Number from Physical Registers - only shown when admin permits self-assigned/claimed numbers */}
                  {allowSelfAssignedNumber && (
                    <div style={{
                      background: '#FFFBEB',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '10px',
                      padding: '0.9rem 1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}>
                      <label className="form-label" style={{ fontWeight: 700, color: '#92400E', margin: 0, fontSize: '0.88rem' }}>
                        Existing Alumni Membership Number (if already allocated)
                      </label>
                      <input
                        type="text"
                        name="existingAlumniNumber"
                        value={formData.existingAlumniNumber}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. MA. 0001 (Found on physical register or certificate)"
                        style={{ background: '#FFFFFF', borderColor: '#F59E0B', fontSize: '0.9rem', padding: '0.55rem 0.8rem' }}
                      />
                      <div style={{ fontSize: '0.78rem', color: '#78350F', lineHeight: 1.4 }}>
                        Example format: <strong>MA. 0001</strong>. If you were already allocated a permanent number in previous physical register books, enter it here. Leave this blank if you do not have one; a unique permanent number will be generated for you automatically.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                        Nickname at School (Optional)
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Captain, Professor, Skip"
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Helps peers from your cohort identify you in the directory.</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Gender <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Date of Birth <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                      Profile Photograph / Portrait (Direct Image Upload)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    
                    {formData.photoUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', flexWrap: 'wrap' }}>
                        <img 
                          src={formData.photoUrl} 
                          alt="Uploaded Profile Preview" 
                          style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #D4AF37', flexShrink: 0 }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0B203E' }}>Photograph Uploaded Successfully</div>
                          <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                            <CheckCircle2 size={13} /> Stored directly in MOSA platform storage
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change Photo
                          </button>
                          <button
                            type="button"
                            style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            title="Remove Photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: '10px',
                          padding: '1.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: '#F8FAFC',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#0B203E')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
                      >
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
                          <Upload size={20} color="#2563EB" />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0B203E' }}>
                          Click to upload your portrait photograph
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                          PNG, JPG or WEBP (Direct upload stored in MOSA storage — external URLs not required)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: MANDELA SCHOOL HISTORY */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={18} color="#D97706" /> Step 3: Mandela Secondary School History
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Select which levels you attended at MASSH (Est. 1997) and specify your exact cohorts and streams.
                    </p>
                  </div>

                  {/* Dynamic Level Selector */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {[
                      { id: 'O_LEVEL_ONLY', label: 'O-Level Only' },
                      { id: 'A_LEVEL_ONLY', label: 'A-Level Only' },
                      { id: 'BOTH', label: 'Both O & A Level' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAttendanceModeChange(opt.id as any)}
                        style={{
                          flex: 1,
                          padding: '0.65rem 1rem',
                          borderRadius: '8px',
                          border: formData.attendanceMode === opt.id ? '2px solid #0B203E' : '1px solid #CBD5E1',
                          background: formData.attendanceMode === opt.id ? '#0B203E' : '#ffffff',
                          color: formData.attendanceMode === opt.id ? '#ffffff' : '#334155',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        {formData.attendanceMode === opt.id && <Check size={14} color="#D97706" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* O-Level Section */}
                  {formData.attendedOLevel && (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                    }}>
                      <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }}></span>
                        Ordinary Level (O-Level / UCE) Records
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Year Joined (S1)</label>
                          <input
                            type="number"
                            name="oYearJoined"
                            min="1997"
                            max="2026"
                            value={formData.oYearJoined}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Year Completed (S4)</label>
                          <input
                            type="number"
                            name="oYearCompleted"
                            min="1997"
                            max="2026"
                            value={formData.oYearCompleted}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Campus Attended</label>
                          <select name="oCampus" value={formData.oCampus} onChange={handleChange} className="form-control">
                            <option value="Main Campus Hoima">Main Campus Hoima</option>
                            <option value="Annex Campus">Annex Campus</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Completion Class</label>
                          <input
                            type="text"
                            name="oClass"
                            value={formData.oClass}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Senior 4"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Stream / House</label>
                          <input
                            type="text"
                            name="oStream"
                            value={formData.oStream}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g. Blue Stream / Mandela House"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* A-Level Section */}
                  {formData.attendedALevel && (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                    }}>
                      <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
                        Advanced Level (A-Level / UACE) Records
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Year Joined (S5)</label>
                          <input
                            type="number"
                            name="aYearJoined"
                            min="1997"
                            max="2026"
                            value={formData.aYearJoined}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Year Completed (S6)</label>
                          <input
                            type="number"
                            name="aYearCompleted"
                            min="1997"
                            max="2026"
                            value={formData.aYearCompleted}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Campus Attended</label>
                          <select name="aCampus" value={formData.aCampus} onChange={handleChange} className="form-control">
                            <option value="Main Campus Hoima">Main Campus Hoima</option>
                            <option value="Annex Campus">Annex Campus</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Completion Class</label>
                          <input
                            type="text"
                            name="aClass"
                            value={formData.aClass}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Senior 6"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Subject Combination</label>
                          <input
                            type="text"
                            name="aCombination"
                            value={formData.aCombination}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g. PCM/ICT, BCM, HEG/SubMath"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: HIGHER EDUCATION & CAREER */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={18} color="#D97706" /> Step 4: Higher Education &amp; Career
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Highlight your post-Mandela studies, university attended, current profession, and achievements.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Tertiary / University Institution</label>
                      <input
                        type="text"
                        name="currentInstitution"
                        value={formData.currentInstitution}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Makerere University, Kyambogo, MUST"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Degree / Programme</label>
                      <input
                        type="text"
                        name="programme"
                        value={formData.programme}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. B.Sc Civil Engineering"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Highest Qualification</label>
                      <select
                        name="highestQualification"
                        value={formData.highestQualification}
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="Certificate">Certificate</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Doctorate / PhD">Doctorate / PhD</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Occupation / Profession</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Software Engineer, Medical Doctor"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Current Organisation / Employer</label>
                      <input
                        type="text"
                        name="organisation"
                        value={formData.organisation}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. UNRA, Ministry of Health, Self-Employed"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Position / Job Title</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Senior Project Manager"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Bio / Achievements</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="form-control"
                      placeholder="Share a short summary of your professional journey since leaving Mandela Secondary School..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: CONTACT & LOCATION */}
              {step === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={18} color="#D97706" /> Step 5: Contact Details &amp; Current Location
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Used strictly by the MOSA Secretariat for official notices, AGM circulars, and chapter regional allocations.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Primary Mobile Phone <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="+256 700 000 000"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Official Email <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="yourname@domain.com"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Country of Residence <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Uganda"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        City / District / Region <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. Hoima, Kampala, London"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Physical / Postal Address (Optional)</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="e.g. Plot 14, Main Street, Hoima City"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        name="linkedIn"
                        value={formData.linkedIn}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Portfolio / Social Profile</label>
                      <input
                        type="url"
                        name="socialLink"
                        value={formData.socialLink}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="https://twitter.com/handle"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: MOSA CHAPTER */}
              {step === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={18} color="#D97706" /> Step 6: Affiliate with a MOSA Chapter
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Select your university chapter (e.g., MUMASA, KYUMASA, MBUMASA, GUMASA, MUBSMASA, NKUMASA), regional mother chapter, or diaspora chapter to network with peers.
                    </p>
                  </div>

                  {/* Filter Tabs and Search Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'ALL', label: 'All Chapters' },
                        { id: 'UNIVERSITY', label: 'University / Institutional' },
                        { id: 'REGIONAL', label: 'Regional & Mother Chapter' },
                        { id: 'DIASPORA', label: 'International Diaspora' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setChapterCategoryFilter(tab.id as any)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: chapterCategoryFilter === tab.id ? '1px solid #0B203E' : '1px solid #CBD5E1',
                            background: chapterCategoryFilter === tab.id ? '#0B203E' : '#FFFFFF',
                            color: chapterCategoryFilter === tab.id ? '#FFFFFF' : '#475569',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        placeholder="Search chapter by name, code, university or city (e.g. Makerere, MUMASA, Kyambogo)..."
                        value={chapterSearchQuery}
                        onChange={e => setChapterSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.85rem 0.55rem 2.3rem',
                          borderRadius: '8px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Option: General Alumni (Central Secretariat) */}
                    {(chapterCategoryFilter === 'ALL' || !chapterSearchQuery.trim()) && (
                      <div 
                        onClick={() => setFormData(prev => ({ ...prev, selectedChapterId: '' }))}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          border: !formData.selectedChapterId ? '2px solid #0B203E' : '1px solid #E2E8F0',
                          background: !formData.selectedChapterId ? '#F0F9FF' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: !formData.selectedChapterId ? '0 2px 8px rgba(11,32,62,0.08)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{
                              background: '#0B203E',
                              color: '#FCD34D',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              letterSpacing: '0.05em'
                            }}>
                              GENERAL MOSA
                            </span>
                            <span style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                              National Secretariat Central Registry
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Direct affiliation with the central MOSA National Secretariat at MASSH Main Campus, Hoima. Choose this if your university or district does not yet have a specialized chapter.
                          </div>
                        </div>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginLeft: '1rem',
                          border: !formData.selectedChapterId ? '6px solid #0B203E' : '2px solid #CBD5E1'
                        }} />
                      </div>
                    )}

                    {/* Filtered Official Chapters */}
                    {chapters
                      .filter(chap => {
                        const matchesCategory = chapterCategoryFilter === 'ALL' || chap.chapterType === chapterCategoryFilter;
                        const query = chapterSearchQuery.trim().toLowerCase();
                        const matchesSearch = !query ||
                          chap.name.toLowerCase().includes(query) ||
                          chap.code.toLowerCase().includes(query) ||
                          chap.institution.toLowerCase().includes(query) ||
                          chap.location.toLowerCase().includes(query);
                        return matchesCategory && matchesSearch;
                      })
                      .map(chap => {
                        const isSelected = formData.selectedChapterId === chap.id;
                        return (
                          <div
                            key={chap.id}
                            onClick={() => setFormData(prev => ({ ...prev, selectedChapterId: chap.id }))}
                            style={{
                              padding: '1rem',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #0B203E' : '1px solid #E2E8F0',
                              background: isSelected ? '#F0F9FF' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              boxShadow: isSelected ? '0 2px 8px rgba(11,32,62,0.08)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <span style={{
                                  background: '#0B203E',
                                  color: '#FCD34D',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  letterSpacing: '0.05em'
                                }}>
                                  {chap.code}
                                </span>
                                <span style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                                  {chap.name}
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  background: chap.chapterType === 'UNIVERSITY' ? '#EFF6FF' : chap.chapterType === 'REGIONAL' ? '#ECFDF5' : '#FEF3C7',
                                  color: chap.chapterType === 'UNIVERSITY' ? '#1D4ED8' : chap.chapterType === 'REGIONAL' ? '#047857' : '#92400E',
                                  fontWeight: 700
                                }}>
                                  {chap.chapterType}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <span>🏛️ {chap.institution}</span>
                                <span>📍 {chap.location}</span>
                                <span style={{ fontWeight: 600, color: '#D97706' }}>👥 {chap.memberCount} members</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: '1.4' }}>
                                {chap.description}
                              </div>
                            </div>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginLeft: '1rem',
                              border: isSelected ? '6px solid #0B203E' : '2px solid #CBD5E1'
                            }} />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* STEP 7: PRIVACY PREFERENCES */}
              {step === 7 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Eye size={18} color="#D97706" /> Step 7: Public Directory Privacy Settings
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      You control what information is visible to the public and fellow alumni in the online directory.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { key: 'showName', label: 'Display Full Name in Directory', desc: 'Visible on alumni profile and search results (Recommended)' },
                      { key: 'showNickname', label: 'Display School Nickname', desc: 'Allows classmates to search and recognize you by moniker' },
                      { key: 'showProfession', label: 'Display Profession & Job Title', desc: 'Assists with networking and professional referrals' },
                      { key: 'showOrganisation', label: 'Display Current Workplace / Company', desc: 'Helps alumni collaborate across industries' },
                      { key: 'showCountry', label: 'Display City & Country of Residence', desc: 'Allows local chapter coordinators to invite you to events' },
                      { key: 'showPhone', label: 'Display Phone Number Publicly', desc: 'Default is OFF. Protects your personal mobile from unsolicited calls' },
                      { key: 'showEmail', label: 'Display Email Address Publicly', desc: 'Default is OFF. Keeps your email private' },
                    ].map(pref => {
                      const isChecked = (formData as any)[pref.key];
                      return (
                        <label
                          key={pref.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            background: isChecked ? '#F8FAFC' : '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            name={pref.key}
                            checked={isChecked}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#0B203E' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0B203E' }}>
                              {pref.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              {pref.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 8: REVIEW & SUBMIT */}
              {step === 8 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={18} color="#D97706" /> Step 8: Review &amp; Official Declaration
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      Verify all entries before official submission to the MASSH Archival Verification Desk.
                    </p>
                  </div>

                  {/* Summary Breakdown Card */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* Alumnus Identity */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                          Applicant
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>
                          {formData.firstName} {formData.middleName ? `${formData.middleName} ` : ''}{formData.lastName}
                        </div>
                        {formData.nickname && (
                          <div style={{ color: '#D97706', fontWeight: 600, fontSize: '0.85rem' }}>
                            Known as: "{formData.nickname}"
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        Pending Verification
                      </span>
                    </div>

                    {/* School History */}
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Mandela Secondary School Record
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {formData.attendedOLevel && (
                          <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 700, color: '#0B203E' }}>O-Level ({formData.oYearJoined} - {formData.oYearCompleted})</div>
                            <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{formData.oClass} • {formData.oStream}</div>
                          </div>
                        )}
                        {formData.attendedALevel && (
                          <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 700, color: '#0B203E' }}>A-Level ({formData.aYearJoined} - {formData.aYearCompleted})</div>
                            <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{formData.aClass} • Comb: {formData.aCombination}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact & Chapter */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, marginBottom: '0.2rem' }}>
                          Contact Details
                        </div>
                        <div style={{ color: '#0B203E', fontWeight: 600 }}>{formData.accountPhone || formData.phone}</div>
                        <div style={{ color: '#64748B' }}>{formData.accountEmail || formData.email}</div>
                        <div style={{ color: '#64748B' }}>{formData.city}, {formData.country}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, marginBottom: '0.2rem' }}>
                          MOSA Chapter Affiliation
                        </div>
                        <div style={{ color: '#0B203E', fontWeight: 600 }}>
                          {selectedChapterObj ? selectedChapterObj.name : 'General Alumni (Central Secretariat)'}
                        </div>
                        <div style={{ color: '#64748B' }}>
                          {formData.occupation ? `${formData.occupation} at ${formData.organisation || 'N/A'}` : 'Career info not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Official Declaration Checkbox */}
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="declarationAccepted"
                        checked={formData.declarationAccepted}
                        onChange={handleChange}
                        style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: '#D97706' }}
                        required
                      />
                      <div style={{ fontSize: '0.85rem', color: '#78350F', lineHeight: '1.5' }}>
                        <strong>Official Declaration:</strong> I hereby declare that all information submitted is true, correct, and represents my genuine attendance and completion record at Mandela Secondary School Hoima (MASSH). I understand that any deliberate misrepresentation is a breach of MOSA standards and will invalidate my application.
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid #E2E8F0',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    style={{ color: '#64748B', borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                    title="Exit registration wizard and return to portal"
                  >
                    <span className="hidden sm:inline">Exit Registration</span>
                    <span className="sm:hidden">Exit</span>
                  </button>

                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                  )}
                </div>

                {step < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '130px' }}
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !formData.declarationAccepted}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: '#0B203E',
                      minWidth: '180px',
                      padding: '0.75rem 1.5rem',
                      opacity: (loading || !formData.declarationAccepted) ? 0.6 : 1,
                      cursor: (loading || !formData.declarationAccepted) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? (
                      'Processing Submission...'
                    ) : (
                      <>
                        <ShieldCheck size={18} color="#D97706" /> Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniRegistrationWizard;
