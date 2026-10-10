import React, { useState } from 'react';
import { dataService } from '../services/dataService';
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
  ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AlumniRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '', // Nickname at School
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '',
    photoUrl: '',

    // Contact Info
    phone: '',
    email: '',
    country: 'Uganda',
    city: 'Hoima',
    address: '',
    linkedIn: '',
    socialLink: '',

    // School History (MASSH)
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

    // Current Info
    currentInstitution: '',
    programme: '',
    highestQualification: "Bachelor's Degree",
    occupation: '',
    organisation: '',
    position: '',
    bio: '',

    // Privacy Settings
    showName: true,
    showNickname: true,
    showProfession: true,
    showOrganisation: true,
    showCountry: true,
    showPhone: false, // Default false per spec
    showEmail: false, // Default false per spec
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setErrorMsg('Please enter both First Name and Last Name.');
        return false;
      }
      if (!formData.dateOfBirth) {
        setErrorMsg('Please select your Date of Birth.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.phone.trim() || !formData.email.trim()) {
        setErrorMsg('Valid phone number and email are required for verification.');
        return false;
      }
      if (!formData.city.trim() || !formData.country.trim()) {
        setErrorMsg('Country and city are required.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.attendedOLevel && !formData.attendedALevel) {
        setErrorMsg('Please select at least one attended level: O-Level, A-Level, or Both.');
        return false;
      }
      if (formData.attendedOLevel) {
        if (formData.oYearJoined > formData.oYearCompleted) {
          setErrorMsg('O-Level year joined cannot be greater than year completed.');
          return false;
        }
      }
      if (formData.attendedALevel) {
        if (formData.aYearJoined > formData.aYearCompleted) {
          setErrorMsg('A-Level year joined cannot be greater than year completed.');
          return false;
        }
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
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        photoUrl: formData.photoUrl.trim() || undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
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
          name: `${formData.firstName} ${formData.lastName}`,
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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap color="#D97706" />
              <span>MOSA Alumni Registration</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
              Mandela Secondary School Hoima (MASSH) • Official Alumni Record
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {/* Success Screen */}
        {successInfo ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <CheckCircle2 size={36} color="#059669" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
              Thank you, <strong>{successInfo.name}</strong>. Your application has been logged with ID <code>{successInfo.id}</code> and queued for administrator verification.
            </p>

            {/* Workflow steps card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', maxWidth: '550px', margin: '0 auto 1.5rem auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Next Verification Steps:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669' }}>
                  <CheckCircle2 size={16} /> <span>1. Registration Application Created (Status: <strong>PENDING</strong>)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D97706' }}>
                  <ArrowRight size={16} /> <span>2. MASSH Records Review by MOSA Administration</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                  <ArrowRight size={16} /> <span>3. Approval & Automatic Generation of Official <strong>MA. XXXX</strong> Number</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                  <ArrowRight size={16} /> <span>4. Activation of Alumni Directory Profile</span>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={onClose}>
              Done & Return to Directory
            </button>
          </div>
        ) : (
          <div>
            {/* Steps Progress Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              {[
                { n: 1, label: 'Personal', icon: User },
                { n: 2, label: 'Contact', icon: Phone },
                { n: 3, label: 'MASSH History', icon: GraduationCap },
                { n: 4, label: 'Career & Privacy', icon: Lock },
              ].map(s => {
                const Icon = s.icon;
                const isActive = step === s.n;
                const isPassed = step > s.n;
                return (
                  <div
                    key={s.n}
                    style={{
                      flex: 1,
                      padding: '0.75rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#0B203E' : isPassed ? '#059669' : '#64748B',
                      borderBottom: isActive ? '3px solid #D97706' : '3px solid transparent',
                    }}
                  >
                    <Icon size={14} />
                    <span>{s.n}. {s.label}</span>
                  </div>
                );
              })}
            </div>

            {errorMsg && (
              <div style={{ margin: '1rem 1.5rem 0 1.5rem', padding: '0.75rem 1rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {/* STEP 1: PERSONAL INFORMATION */}
                {step === 1 && (
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: '#0B203E' }}>Step 1: Personal Information</h4>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label required">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Patrick"
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
                          className="form-input"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Mugisa"
                          required
                        />
                      </div>
                    </div>

                    {/* Nickname at School - EXPLICITLY LABELED PER SPEC */}
                    <div className="form-group" style={{ background: '#FEF3C7', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                      <label className="form-label" style={{ color: '#92400E', fontWeight: 700 }}>
                        Nickname at School (Optional)
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. Bulldozer, Queen of Science, DJ Daph, Speedy..."
                      />
                      <small style={{ color: '#B45309', display: 'block', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                        This allows your former classmates at MASSH to easily find you in the alumni directory by your school nickname.
                      </small>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label required">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Profile Photo URL (Optional)</label>
                      <input
                        type="url"
                        name="photoUrl"
                        value={formData.photoUrl}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="https://... image link"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTACT INFORMATION */}
                {step === 2 && (
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: '#0B203E' }}>Step 2: Contact Information</h4>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label required">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. +256 701 234567"
                          required
                        />
                        <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
                          Kept strictly private by default unless you choose to expose it.
                        </small>
                      </div>
                      <div className="form-group">
                        <label className="form-label required">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. patrick.m@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label required">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label required">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Physical / Contact Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g. Plot 12, Main Street, Hoima"
                      />
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          name="linkedIn"
                          value={formData.linkedIn}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Other Social / Professional Link</label>
                        <input
                          type="url"
                          name="socialLink"
                          value={formData.socialLink}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Twitter/X, portfolio website"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: MASSH SCHOOL HISTORY */}
                {step === 3 && (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', color: '#0B203E' }}>Step 3: MASSH School History</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem' }}>
                      Mandela Secondary School Hoima has both O-Level and A-Level. An alumnus may have attended O-Level only, A-Level only, or both.
                    </p>

                    {/* O-Level Section */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', background: formData.attendedOLevel ? '#F8FAFC' : '#F1F5F9' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: '#0B203E' }}>
                        <input
                          type="checkbox"
                          name="attendedOLevel"
                          checked={formData.attendedOLevel}
                          onChange={handleChange}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>I attended Ordinary Level (O-Level) at MASSH</span>
                      </label>

                      {formData.attendedOLevel && (
                        <div style={{ marginTop: '1rem' }}>
                          <div className="grid-2">
                            <div className="form-group">
                              <label className="form-label required">Year Joined (O-Level)</label>
                              <input
                                type="number"
                                name="oYearJoined"
                                value={formData.oYearJoined}
                                onChange={handleChange}
                                min={1997}
                                max={2026}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label required">Year Completed (O-Level)</label>
                              <input
                                type="number"
                                name="oYearCompleted"
                                value={formData.oYearCompleted}
                                onChange={handleChange}
                                min={1997}
                                max={2026}
                                className="form-input"
                              />
                            </div>
                          </div>
                          <div className="grid-3">
                            <div className="form-group">
                              <label className="form-label">Campus</label>
                              <input
                                type="text"
                                name="oCampus"
                                value={formData.oCampus}
                                onChange={handleChange}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Class</label>
                              <input
                                type="text"
                                name="oClass"
                                value={formData.oClass}
                                onChange={handleChange}
                                placeholder="e.g. Senior 4"
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Stream</label>
                              <input
                                type="text"
                                name="oStream"
                                value={formData.oStream}
                                onChange={handleChange}
                                placeholder="e.g. Blue, Green, North"
                                className="form-input"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* A-Level Section */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '10px', padding: '1rem', background: formData.attendedALevel ? '#F8FAFC' : '#F1F5F9' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: '#0B203E' }}>
                        <input
                          type="checkbox"
                          name="attendedALevel"
                          checked={formData.attendedALevel}
                          onChange={handleChange}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>I attended Advanced Level (A-Level) at MASSH</span>
                      </label>

                      {formData.attendedALevel && (
                        <div style={{ marginTop: '1rem' }}>
                          <div className="grid-2">
                            <div className="form-group">
                              <label className="form-label required">Year Joined (A-Level)</label>
                              <input
                                type="number"
                                name="aYearJoined"
                                value={formData.aYearJoined}
                                onChange={handleChange}
                                min={1997}
                                max={2026}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label required">Year Completed (A-Level)</label>
                              <input
                                type="number"
                                name="aYearCompleted"
                                value={formData.aYearCompleted}
                                onChange={handleChange}
                                min={1997}
                                max={2026}
                                className="form-input"
                              />
                            </div>
                          </div>
                          <div className="grid-3">
                            <div className="form-group">
                              <label className="form-label">Campus</label>
                              <input
                                type="text"
                                name="aCampus"
                                value={formData.aCampus}
                                onChange={handleChange}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Class</label>
                              <input
                                type="text"
                                name="aClass"
                                value={formData.aClass}
                                onChange={handleChange}
                                placeholder="e.g. Senior 6"
                                className="form-input"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Combination</label>
                              <input
                                type="text"
                                name="aCombination"
                                value={formData.aCombination}
                                onChange={handleChange}
                                placeholder="e.g. PCM/ICT, BCM, MEG"
                                className="form-input"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: CURRENT INFO & PRIVACY */}
                {step === 4 && (
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: '#0B203E' }}>Step 4: Current Information & Privacy</h4>
                    
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Occupation / Profession</label>
                        <input
                          type="text"
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Software Engineer, Doctor, Teacher"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Organisation / Employer</label>
                        <input
                          type="text"
                          name="organisation"
                          value={formData.organisation}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Ministry of Health, MTN, Self"
                        />
                      </div>
                    </div>

                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Position / Title</label>
                        <input
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Senior Analyst"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Current / Tertiary Institution</label>
                        <input
                          type="text"
                          name="currentInstitution"
                          value={formData.currentInstitution}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="e.g. Makerere University"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Highest Qualification</label>
                        <select
                          name="highestQualification"
                          value={formData.highestQualification}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="UACE (A-Level Certificate)">UACE (A-Level Certificate)</option>
                          <option value="UCE (O-Level Certificate)">UCE (O-Level Certificate)</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Professional Biography</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="form-textarea"
                        rows={3}
                        placeholder="Brief summary of your career, passions, or memories at MASSH..."
                      />
                    </div>

                    {/* Privacy Controls per Section 9 */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '1rem', marginTop: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0B203E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Lock size={15} color="#D97706" />
                        <span>Alumni Directory Privacy Controls</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.75rem' }}>
                        Choose what information is visible to other verified members in the MOSA Directory. Phone & Email are private by default.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showName" checked={formData.showName} onChange={handleChange} />
                          <span>Show Name</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showNickname" checked={formData.showNickname} onChange={handleChange} />
                          <span>Show Nickname</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showProfession" checked={formData.showProfession} onChange={handleChange} />
                          <span>Show Profession</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showOrganisation" checked={formData.showOrganisation} onChange={handleChange} />
                          <span>Show Organisation</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showPhone" checked={formData.showPhone} onChange={handleChange} />
                          <span style={{ color: formData.showPhone ? '#D97706' : '#64748B' }}>Show Phone Publicly</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input type="checkbox" name="showEmail" checked={formData.showEmail} onChange={handleChange} />
                          <span style={{ color: formData.showEmail ? '#D97706' : '#64748B' }}>Show Email Publicly</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="modal-footer">
                {step > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={handlePrev} disabled={loading}>
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {step < 4 ? (
                  <button type="button" className="btn btn-primary" onClick={handleNext}>
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-gold" disabled={loading}>
                    {loading ? 'Submitting Application...' : 'Submit Application to MOSA'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
