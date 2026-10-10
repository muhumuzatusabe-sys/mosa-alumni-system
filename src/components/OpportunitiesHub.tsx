import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  Users, 
  Compass, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  Building2, 
  ExternalLink, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Bookmark, 
  Share2, 
  Sparkles, 
  X, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { 
  OpportunityItem, 
  OpportunityType, 
  OpportunityStatus, 
  WorkplaceType, 
  MentorProfile, 
  MentorshipRequest, 
  AuthUser,
  Chapter
} from '../types';
import { dataService } from '../services/dataService';
import { governanceService } from '../services/governanceService';

interface OpportunitiesHubProps {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OpportunitiesHub: React.FC<OpportunitiesHubProps> = ({
  currentUser,
  onOpenAuth,
  onBack,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'mentors' | 'my-items'>('opportunities');
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for Opportunities
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('ALL');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Filters for Mentors
  const [mentorSearch, setMentorSearch] = useState('');
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [selectedMentorFormat, setSelectedMentorFormat] = useState<string>('ALL');

  // Modals
  const [selectedOpp, setSelectedOpp] = useState<OpportunityItem | null>(null);
  const [isCreateOppOpen, setIsCreateOppOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [isRequestMentorshipOpen, setIsRequestMentorshipOpen] = useState(false);
  const [isBecomeMentorOpen, setIsBecomeMentorOpen] = useState(false);

  // New Opportunity Form state
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppType, setNewOppType] = useState<OpportunityType>('JOB');
  const [newOppOrg, setNewOppOrg] = useState('');
  const [newOppDesc, setNewOppDesc] = useState('');
  const [newOppReqs, setNewOppReqs] = useState('');
  const [newOppSkills, setNewOppSkills] = useState('');
  const [newOppLocation, setNewOppLocation] = useState('Hoima, Uganda');
  const [newOppCountry, setNewOppCountry] = useState('Uganda');
  const [newOppWorkplace, setNewOppWorkplace] = useState<WorkplaceType>('ON_SITE');
  const [newOppDeadline, setNewOppDeadline] = useState('');
  const [newOppExtUrl, setNewOppExtUrl] = useState('');
  const [newOppEmail, setNewOppEmail] = useState('');
  const [newOppInstructions, setNewOppInstructions] = useState('');
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);
  const [oppSuccessMessage, setOppSuccessMessage] = useState('');

  // Mentorship Request form state
  const [mentorshipTopic, setMentorshipTopic] = useState('Career Transition & Professional Growth');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [mentorshipFormat, setMentorshipFormat] = useState<'ONLINE' | 'IN_PERSON' | 'HYBRID'>('ONLINE');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Become Mentor form state
  const [mentorRole, setMentorRole] = useState('');
  const [mentorOrg, setMentorOrg] = useState('');
  const [mentorField, setMentorField] = useState('Medicine & Surgery');
  const [mentorExp, setMentorExp] = useState<number>(5);
  const [mentorBio, setMentorBio] = useState('');
  const [mentorSkills, setMentorSkills] = useState('');
  const [mentorAreas, setMentorAreas] = useState('Career Guidance, Professional Licensure');
  const [mentorMaxMentees, setMentorMaxMentees] = useState<number>(4);
  const [mentorPrefFormat, setMentorPrefFormat] = useState<'ONLINE' | 'IN_PERSON' | 'HYBRID'>('HYBRID');
  const [isSubmittingMentorProfile, setIsSubmittingMentorProfile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const opps = await dataService.getOpportunities();
      setOpportunities(opps);
      const mList = await dataService.getMentorProfiles();
      setMentors(mList);
      const chaps = await dataService.getChapters();
      setChapters(chaps);

      if (currentUser?.alumniId) {
        const requests = await dataService.getMentorshipRequests({ menteeAlumniId: currentUser.alumniId });
        setMentorshipRequests(requests);
      }
    } catch (err) {
      console.error('Failed to load opportunities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredOpportunities = opportunities.filter(opp => {
    // Regular public sees published items or their own items
    const isOwner = currentUser?.email && opp.postedBy?.email?.toLowerCase() === currentUser.email.toLowerCase();
    const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
    if (!isAdmin && !isOwner && opp.status !== 'PUBLISHED') return false;

    if (selectedType !== 'ALL' && opp.type !== selectedType) return false;
    if (selectedWorkplace !== 'ALL' && opp.workplaceType !== selectedWorkplace) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        opp.title.toLowerCase().includes(q) ||
        opp.organisation.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        (opp.skills && opp.skills.some(s => s.toLowerCase().includes(q)));
      if (!matches) return false;
    }
    return true;
  });

  const filteredMentors = mentors.filter(mentor => {
    if (selectedField !== 'ALL' && mentor.professionalField !== selectedField) return false;
    if (selectedMentorFormat !== 'ALL' && mentor.format !== selectedMentorFormat) return false;
    if (mentorSearch.trim()) {
      const q = mentorSearch.toLowerCase();
      const matches = 
        mentor.fullName.toLowerCase().includes(q) ||
        mentor.professionalField.toLowerCase().includes(q) ||
        mentor.organisation.toLowerCase().includes(q) ||
        mentor.currentRole.toLowerCase().includes(q) ||
        mentor.areasOfExpertise.some(e => e.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsSubmittingOpp(true);
    try {
      const skillsArr = newOppSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const created = await dataService.createOpportunity({
        title: newOppTitle,
        type: newOppType,
        organisation: newOppOrg,
        description: newOppDesc,
        requirements: newOppReqs,
        skills: skillsArr,
        location: newOppLocation,
        country: newOppCountry,
        workplaceType: newOppWorkplace,
        deadline: newOppDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        externalUrl: newOppExtUrl,
        contactEmail: newOppEmail || currentUser.email,
        applicationInstructions: newOppInstructions,
      }, currentUser);

      setOppSuccessMessage(
        created.status === 'PUBLISHED'
          ? 'Opportunity successfully published to the MOSA Network!'
          : 'Opportunity submitted! It has been routed to the Secretariat Review Queue for approval.'
      );

      // Reset form
      setNewOppTitle('');
      setNewOppOrg('');
      setNewOppDesc('');
      setNewOppReqs('');
      setNewOppSkills('');
      setNewOppExtUrl('');
      setNewOppInstructions('');
      await loadData();

      setTimeout(() => {
        setIsCreateOppOpen(false);
        setOppSuccessMessage('');
      }, 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to submit opportunity. Please verify all required fields.');
    } finally {
      setIsSubmittingOpp(false);
    }
  };

  const handleSendMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedMentor) return;

    setIsSubmittingRequest(true);
    try {
      await dataService.submitMentorshipRequest({
        mentorId: selectedMentor.alumniId,
        mentorName: selectedMentor.fullName,
        mentorAlumniNumber: selectedMentor.alumniNumber,
        fieldOrTopic: mentorshipTopic,
        message: mentorshipMessage,
        preferredFormat: mentorshipFormat,
      }, currentUser);

      alert(`Mentorship request successfully dispatched to ${selectedMentor.fullName}! You will receive a notification when they respond.`);
      setIsRequestMentorshipOpen(false);
      setMentorshipMessage('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to send mentorship request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleBecomeMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsSubmittingMentorProfile(true);
    try {
      const skillsArr = mentorSkills.split(',').map(s => s.trim()).filter(Boolean);
      const areasArr = mentorAreas.split(',').map(s => s.trim()).filter(Boolean);

      await dataService.saveMentorProfile({
        alumniId: currentUser.alumniId || currentUser.uid,
        alumniNumber: currentUser.alumniNumber || 'MA. ALUMNI',
        fullName: currentUser.displayName,
        email: currentUser.email,
        professionalField: mentorField,
        currentRole: mentorRole || 'Senior Professional',
        organisation: mentorOrg || 'Corporate / Institutional',
        yearsExperience: mentorExp,
        bio: mentorBio || 'MASSH Alumni committed to guiding younger scholars.',
        skills: skillsArr,
        mentorshipAreas: areasArr,
        maxMentees: mentorMaxMentees,
        format: mentorPrefFormat,
      }, currentUser);

      alert('Congratulations! Your MOSA Mentor profile has been published to the Alumni Directory.');
      setIsBecomeMentorOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to register mentor profile.');
    } finally {
      setIsSubmittingMentorProfile(false);
    }
  };

  const getTypeBadgeColor = (type: OpportunityType) => {
    switch (type) {
      case 'JOB': return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'INTERNSHIP': return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'SCHOLARSHIP': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'FELLOWSHIP': return { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' };
      case 'MENTORSHIP': return { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' };
      case 'TRAINING': return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'ENTREPRENEURSHIP': return { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' };
      default: return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const distinctFields = Array.from(new Set(mentors.map(m => m.professionalField)));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '2rem' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0B203E',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} /> Back to Hub
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #FDE68A', letterSpacing: '0.5px' }}>
                MOSA CAREERS & GUIDANCE
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• MASSH Alumni Guild</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.4rem 0' }}>
              Alumni Opportunities & Mentorship Hub
            </h1>
            <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, maxWidth: '720px' }}>
              Discover career openings, vetted graduate internships, international scholarships, and connect with senior MASSH professionals across Uganda and the global diaspora.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setIsBecomeMentorOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FFFFFF',
                color: '#0B203E',
                border: '1px solid #CBD5E1',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <UserCheck size={16} color="#D97706" /> Become a Mentor
            </button>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setIsCreateOppOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11,32,62,0.2)'
              }}
            >
              <Plus size={16} color="#F59E0B" /> Post Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '1.75rem', gap: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('opportunities')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'opportunities' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'opportunities' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'opportunities' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Briefcase size={18} color={activeTab === 'opportunities' ? '#D97706' : '#64748B'} />
          Browse Opportunities ({opportunities.filter(o => o.status === 'PUBLISHED').length})
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'mentors' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'mentors' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'mentors' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Compass size={18} color={activeTab === 'mentors' ? '#D97706' : '#64748B'} />
          Mentorship Network ({mentors.length})
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('my-items')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              color: activeTab === 'my-items' ? '#0B203E' : '#64748B',
              fontWeight: activeTab === 'my-items' ? 800 : 600,
              fontSize: '0.95rem',
              borderBottom: activeTab === 'my-items' ? '3px solid #D97706' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Clock size={18} color={activeTab === 'my-items' ? '#D97706' : '#64748B'} />
            My Postings & Requests
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OPPORTUNITIES DIRECTORY                            */}
      {/* ======================================================== */}
      {activeTab === 'opportunities' && (
        <div>
          {/* Filter Bar */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Search input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search opportunities by title, organization, skills (e.g. Surgery, TypeScript, Civil, Law)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Pill Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Type:</span>
                {[
                  { key: 'ALL', label: 'All Types' },
                  { key: 'JOB', label: 'Jobs' },
                  { key: 'INTERNSHIP', label: 'Internships' },
                  { key: 'SCHOLARSHIP', label: 'Scholarships' },
                  { key: 'ENTREPRENEURSHIP', label: 'Venture & Grants' },
                  { key: 'FELLOWSHIP', label: 'Fellowships' },
                  { key: 'TRAINING', label: 'Training' },
                ].map(pill => (
                  <button
                    key={pill.key}
                    onClick={() => setSelectedType(pill.key)}
                    style={{
                      background: selectedType === pill.key ? '#0B203E' : '#F8FAFC',
                      color: selectedType === pill.key ? '#FFFFFF' : '#475569',
                      border: selectedType === pill.key ? '1px solid #0B203E' : '1px solid #E2E8F0',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pill.label}
                  </button>
                ))}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>Format:</span>
                  <select
                    value={selectedWorkplace}
                    onChange={e => setSelectedWorkplace(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0B203E',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="ALL">All Workplaces</option>
                    <option value="ON_SITE">On-Site</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunities Grid */}
          {filteredOpportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <Briefcase size={42} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: '0 0 0.5rem 0' }}>No Opportunities Match Your Filter</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                Try adjusting your search keywords or switching filters to view all openings across the alumni network.
              </p>
              <button
                onClick={() => { setSelectedType('ALL'); setSelectedWorkplace('ALL'); setSearchQuery(''); }}
                style={{
                  background: '#0B203E',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredOpportunities.map(opp => {
                const badge = getTypeBadgeColor(opp.type);
                const isBookmarked = bookmarkedIds.includes(opp.id);

                return (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(11,32,62,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            letterSpacing: '0.4px'
                          }}>
                            {opp.type}
                          </span>
                          <span style={{
                            background: opp.workplaceType === 'REMOTE' ? '#F0FDF4' : opp.workplaceType === 'HYBRID' ? '#EFF6FF' : '#F8FAFC',
                            color: opp.workplaceType === 'REMOTE' ? '#15803D' : opp.workplaceType === 'HYBRID' ? '#1D4ED8' : '#64748B',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0'
                          }}>
                            {opp.workplaceType.replace('_', ' ')}
                          </span>
                        </div>

                        <button
                          onClick={e => toggleBookmark(opp.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isBookmarked ? '#D97706' : '#94A3B8',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={isBookmarked ? 'Bookmarked' : 'Save opportunity'}
                        >
                          <Bookmark size={17} fill={isBookmarked ? '#D97706' : 'none'} />
                        </button>
                      </div>

                      {/* Title & Organisation */}
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                        {opp.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem' }}>
                        <Building2 size={14} color="#D97706" /> {opp.organisation}
                      </div>

                      {/* Location & Deadline */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', color: '#64748B', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} /> {opp.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} /> Deadline: {opp.deadline}
                        </span>
                      </div>

                      {/* Description excerpt */}
                      <p style={{ color: '#64748B', fontSize: '0.83rem', lineHeight: 1.45, margin: '0 0 0.85rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {opp.description}
                      </p>

                      {/* Skills Tags */}
                      {opp.skills && opp.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                          {opp.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}>
                              {skill}
                            </span>
                          ))}
                          {opp.skills.length > 4 && (
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, alignSelf: 'center' }}>
                              +{opp.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Footer */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        Posted by {opp.postedBy?.name || 'Secretariat'}
                      </div>
                      <span style={{ color: '#D97706', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MENTORSHIP NETWORK                                */}
      {/* ======================================================== */}
      {activeTab === 'mentors' && (
        <div>
          {/* Mentorship Hero Explainer */}
          <div style={{
            background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
            borderRadius: '16px',
            padding: '2rem',
            color: '#FFFFFF',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px -6px rgba(11,32,62,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div>
              <span style={{ background: '#D97706', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '4px', letterSpacing: '0.5px' }}>
                MASSH MENTORSHIP COVENANT
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.65rem 0 0.5rem 0', color: '#FFFFFF' }}>
                Connect with Verified Senior Alumni Mentors
              </h2>
              <p style={{ color: '#E2E8F0', fontSize: '0.9rem', maxWidth: '620px', margin: 0, lineHeight: 1.5 }}>
                Our established professionals in medicine, engineering, law, technology, and public administration offer 1-on-1 guidance, bar exam strategies, portfolio reviews, and graduate career direction.
              </p>
            </div>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setIsBecomeMentorOpen(true);
              }}
              style={{
                background: '#F59E0B',
                color: '#0B203E',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
              }}
            >
              Offer Mentorship
            </button>
          </div>

          {/* Mentors Filter Bar */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search mentors by name, specialty, or organization..."
                  value={mentorSearch}
                  onChange={e => setMentorSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={selectedField}
                onChange={e => setSelectedField(e.target.value)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0B203E',
                  background: '#FFFFFF'
                }}
              >
                <option value="ALL">All Disciplines & Fields</option>
                {distinctFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <select
                value={selectedMentorFormat}
                onChange={e => setSelectedMentorFormat(e.target.value)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#0B203E',
                  background: '#FFFFFF'
                }}
              >
                <option value="ALL">All Meeting Formats</option>
                <option value="ONLINE">Online (Virtual)</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Mentors Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {filteredMentors.map(mentor => (
              <div
                key={mentor.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <img
                      src={mentor.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.fullName)}&background=0B203E&color=fff`}
                      alt={mentor.fullName}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #D97706',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                          {mentor.alumniNumber}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                          {mentor.availability}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.2rem 0' }}>
                        {mentor.fullName}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {mentor.currentRole}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {mentor.organisation} • {mentor.yearsExperience}+ yrs exp
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.45, margin: '0 0 1rem 0' }}>
                    {mentor.bio}
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Mentorship Focus:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {mentor.mentorshipAreas.map((area, idx) => (
                        <span key={idx} style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #DBEAFE'
                        }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} /> {mentor.location} ({mentor.format})
                  </span>

                  <button
                    onClick={() => {
                      if (!currentUser) onOpenAuth();
                      else {
                        setSelectedMentor(mentor);
                        setIsRequestMentorshipOpen(true);
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Send size={13} color="#F59E0B" /> Request Mentorship
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY SUBMISSIONS & MENTORSHIP REQUESTS               */}
      {/* ======================================================== */}
      {activeTab === 'my-items' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            {/* My Posted Opportunities */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                  My Posted Opportunities
                </h3>
                <button
                  onClick={() => setIsCreateOppOpen(true)}
                  style={{
                    background: '#0B203E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + New Posting
                </button>
              </div>

              {opportunities.filter(o => o.postedBy?.email?.toLowerCase() === currentUser?.email?.toLowerCase()).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.88rem' }}>
                  You haven't posted any opportunities yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {opportunities.filter(o => o.postedBy?.email?.toLowerCase() === currentUser?.email?.toLowerCase()).map(item => (
                    <div key={item.id} style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0B203E' }}>{item.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.organisation} • Posted {item.createdAt}</div>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        background: item.status === 'PUBLISHED' ? '#ECFDF5' : item.status === 'PENDING_REVIEW' ? '#FEF3C7' : '#F1F5F9',
                        color: item.status === 'PUBLISHED' ? '#047857' : item.status === 'PENDING_REVIEW' ? '#B45309' : '#475569',
                      }}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Mentorship Requests */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E', margin: '0 0 1.25rem 0' }}>
                Mentorship Requests History
              </h3>

              {mentorshipRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.88rem' }}>
                  No mentorship requests recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {mentorshipRequests.map(req => (
                    <div key={req.id} style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0B203E' }}>
                            Mentor: {req.mentorName} ({req.mentorAlumniNumber})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>
                            Topic: {req.fieldOrTopic}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: req.status === 'ACCEPTED' ? '#ECFDF5' : req.status === 'DECLINED' ? '#FEF2F2' : '#FEF3C7',
                          color: req.status === 'ACCEPTED' ? '#047857' : req.status === 'DECLINED' ? '#B91C1C' : '#B45309',
                        }}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.35rem 0' }}>
                        "{req.message}"
                      </p>
                      {req.responseNote && (
                        <div style={{ fontSize: '0.75rem', background: '#FFFFFF', padding: '0.45rem', borderRadius: '4px', border: '1px solid #E2E8F0', color: '#334155' }}>
                          <strong>Mentor note:</strong> {req.responseNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OPPORTUNITY FULL DETAILS                          */}
      {/* ======================================================== */}
      {selectedOpp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedOpp(null)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <span style={{
                background: getTypeBadgeColor(selectedOpp.type).bg,
                color: getTypeBadgeColor(selectedOpp.type).text,
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
              }}>
                {selectedOpp.type}
              </span>
              <span style={{
                background: '#F1F5F9',
                color: '#475569',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
              }}>
                {selectedOpp.workplaceType.replace('_', ' ')}
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.5rem 0' }}>
              {selectedOpp.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#D97706', marginBottom: '1.25rem' }}>
              <Building2 size={16} /> {selectedOpp.organisation}
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Location</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0B203E' }}>{selectedOpp.location}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Application Deadline</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#B91C1C' }}>{selectedOpp.deadline}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Posted Date</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0B203E' }}>{selectedOpp.createdAt}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.5rem 0' }}>Description & Scope</h4>
              <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {selectedOpp.description}
              </p>
            </div>

            {selectedOpp.requirements && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.5rem 0' }}>Requirements & Eligibility</h4>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedOpp.requirements}
                </p>
              </div>
            )}

            {selectedOpp.skills && selectedOpp.skills.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.5rem 0' }}>Key Competencies</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedOpp.skills.map((skill, idx) => (
                    <span key={idx} style={{
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedOpp.applicationInstructions && (
              <div style={{ background: '#FFFBEB', borderRadius: '10px', padding: '1rem', border: '1px solid #FDE68A', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#B45309', margin: '0 0 0.35rem 0' }}>How to Apply</h4>
                <p style={{ fontSize: '0.83rem', color: '#78350F', margin: 0, lineHeight: 1.45 }}>
                  {selectedOpp.applicationInstructions}
                </p>
              </div>
            )}

            {/* Application Actions */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {selectedOpp.externalUrl && (
                <a
                  href={selectedOpp.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                    color: '#FFFFFF',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <ExternalLink size={16} /> Open Official Application Portal
                </a>
              )}

              {selectedOpp.contactEmail && (
                <a
                  href={`mailto:${selectedOpp.contactEmail}?subject=Application: ${encodeURIComponent(selectedOpp.title)} - MOSA Network`}
                  style={{
                    background: '#FFFFFF',
                    color: '#0B203E',
                    border: '1px solid #CBD5E1',
                    padding: '0.7rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <Mail size={16} color="#D97706" /> Email Recruiter ({selectedOpp.contactPerson || 'Secretariat'})
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: POST OPPORTUNITY FORM                             */}
      {/* ======================================================== */}
      {isCreateOppOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsCreateOppOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
              Publish an Opportunity
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Share job openings, graduate internships, scholarships, or venture funding with Mandela Old Students.
            </p>

            {oppSuccessMessage ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: '10px', color: '#047857', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800 }}>Submission Recorded!</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{oppSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Opportunity Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Medical Officer, Graduate Civil Engineer, Commonwealth Scholarship"
                    value={newOppTitle}
                    onChange={e => setNewOppTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Opportunity Type *
                    </label>
                    <select
                      value={newOppType}
                      onChange={e => setNewOppType(e.target.value as OpportunityType)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    >
                      <option value="JOB">Job / Full-Time Employment</option>
                      <option value="INTERNSHIP">Graduate Internship / Residency</option>
                      <option value="SCHOLARSHIP">Scholarship / Bursary</option>
                      <option value="FELLOWSHIP">Fellowship</option>
                      <option value="TRAINING">Technical Training / Workshop</option>
                      <option value="ENTREPRENEURSHIP">Venture Grant / Agribusiness</option>
                      <option value="OTHER">Other Opportunity</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Workplace Format
                    </label>
                    <select
                      value={newOppWorkplace}
                      onChange={e => setNewOppWorkplace(e.target.value as WorkplaceType)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    >
                      <option value="ON_SITE">On-Site</option>
                      <option value="REMOTE">Remote</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Hiring Organisation / Company *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hoima Regional Hospital, Stanbic, UNRA"
                      value={newOppOrg}
                      onChange={e => setNewOppOrg(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hoima City, Kampala, London (UK)"
                      value={newOppLocation}
                      onChange={e => setNewOppLocation(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Description & Responsibilities *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide overview of duties, project scope, team..."
                    value={newOppDesc}
                    onChange={e => setNewOppDesc(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Requirements & Qualifications
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Degree required, minimum years experience, professional registration..."
                    value={newOppReqs}
                    onChange={e => setNewOppReqs(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Key Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Surgery, TypeScript, CAD, Financial Modeling"
                      value={newOppSkills}
                      onChange={e => setNewOppSkills(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={newOppDeadline}
                      onChange={e => setNewOppDeadline(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      External Application URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://company.com/apply"
                      value={newOppExtUrl}
                      onChange={e => setNewOppExtUrl(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="hr@company.com"
                      value={newOppEmail}
                      onChange={e => setNewOppEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#64748B' }}>
                  <ShieldCheck size={14} color="#D97706" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  <strong>Governance Policy:</strong> Postings by verified alumni undergo administrative vetting by the MOSA Secretariat before public listing. Administrators publish immediately.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOpp}
                  style={{
                    background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: isSubmittingOpp ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingOpp ? 'Submitting...' : 'Submit Opportunity'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REQUEST MENTORSHIP FORM                           */}
      {/* ======================================================== */}
      {isRequestMentorshipOpen && selectedMentor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsRequestMentorshipOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
              Request Mentorship from {selectedMentor.fullName}
            </h2>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1.25rem' }}>
              {selectedMentor.currentRole} at {selectedMentor.organisation}
            </div>

            <form onSubmit={handleSendMentorshipRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  What area do you need mentorship in? *
                </label>
                <input
                  type="text"
                  required
                  value={mentorshipTopic}
                  onChange={e => setMentorshipTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Preferred Meeting Format
                </label>
                <select
                  value={mentorshipFormat}
                  onChange={e => setMentorshipFormat(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option value="ONLINE">Online (Google Meet / Zoom / WhatsApp call)</option>
                  <option value="IN_PERSON">In-Person (Coffee / Office)</option>
                  <option value="HYBRID">Flexible</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Introduction & Goals *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell the mentor briefly about your current background, what you hope to learn, and questions you have..."
                  value={mentorshipMessage}
                  onChange={e => setMentorshipMessage(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                style={{
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isSubmittingRequest ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmittingRequest ? 'Sending Request...' : 'Send Mentorship Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BECOME A MENTOR                                   */}
      {/* ======================================================== */}
      {isBecomeMentorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsBecomeMentorOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
              Register as a MOSA Mentor
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              Offer your professional experience to coach fellow alumni and current students of Mandela Secondary School Hoima.
            </p>

            <form onSubmit={handleBecomeMentor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Current Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Architect, Consultant"
                    value={mentorRole}
                    onChange={e => setMentorRole(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Organisation / Employer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanbic Bank, Ministry, UN"
                    value={mentorOrg}
                    onChange={e => setNewOppOrg(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Professional Discipline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medicine, Software, Civil Engineering"
                    value={mentorField}
                    onChange={e => setMentorField(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={mentorExp}
                    onChange={e => setMentorExp(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Areas You Can Mentor (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LDC Bar Course, CV & Portfolio Review, Remote Work, Medical Residency"
                  value={mentorAreas}
                  onChange={e => setMentorAreas(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Short Bio for Prospective Mentees
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe your journey from MASSH into your field and what you are passionate about helping with..."
                  value={mentorBio}
                  onChange={e => setMentorBio(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Max Simultaneous Mentees
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={mentorMaxMentees}
                    onChange={e => setMentorMaxMentees(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Format
                  </label>
                  <select
                    value={mentorPrefFormat}
                    onChange={e => setMentorPrefFormat(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  >
                    <option value="ONLINE">Online Only</option>
                    <option value="IN_PERSON">In-Person</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingMentorProfile}
                style={{
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: isSubmittingMentorProfile ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmittingMentorProfile ? 'Publishing Profile...' : 'Save & Publish Mentor Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
