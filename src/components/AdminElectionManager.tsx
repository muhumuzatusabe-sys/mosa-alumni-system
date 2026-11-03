import React, { useState, useEffect } from 'react';
import {
  Vote,
  Calendar,
  Award,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Search,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
  UserCheck,
  ExternalLink,
  X
} from 'lucide-react';
import {
  ElectionCycle,
  ElectionPosition,
  Candidate,
  AuthUser,
  AlumniProfile,
  ElectionStatus
} from '../types';
import { dataService } from '../services/dataService';

interface AdminElectionManagerProps {
  currentUser: AuthUser;
}

export const AdminElectionManager: React.FC<AdminElectionManagerProps> = ({ currentUser }) => {
  const [elections, setElections] = useState<ElectionCycle[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Tabs within election manager
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'candidates' | 'live_results'>('overview');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditingElection, setIsEditingElection] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ElectionPosition | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showManifestoModal, setShowManifestoModal] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

  // Form State: Schedule / Edit Election
  const [cycleTitle, setCycleTitle] = useState('');
  const [cycleTheme, setCycleTheme] = useState('');
  const [cycleTerm, setCycleTerm] = useState('');
  const [cycleDesc, setCycleDesc] = useState('');
  const [cycleNomDeadline, setCycleNomDeadline] = useState('');
  const [cycleVotingStart, setCycleVotingStart] = useState('');
  const [cycleVotingEnd, setCycleVotingEnd] = useState('');
  const [cycleQuorum, setCycleQuorum] = useState<number>(25);
  const [cycleEligibleVoters, setCycleEligibleVoters] = useState<number>(250);
  const [cycleInitialStatus, setCycleInitialStatus] = useState<ElectionStatus>('UPCOMING');

  // Form State: Position
  const [posTitle, setPosTitle] = useState('');
  const [posDesc, setPosDesc] = useState('');
  const [posMaxSelect, setPosMaxSelect] = useState<number>(1);
  const [posOrder, setPosOrder] = useState<number>(1);

  // Form State: Candidate Placement
  const [candAlumniSearch, setCandAlumniSearch] = useState('');
  const [candPositionId, setCandPositionId] = useState('');
  const [candFullName, setCandFullName] = useState('');
  const [candAlumniNumber, setCandAlumniNumber] = useState('');
  const [candAlumniId, setCandAlumniId] = useState('');
  const [candCohort, setCandCohort] = useState('');
  const [candProfession, setCandProfession] = useState('');
  const [candPhotoUrl, setCandPhotoUrl] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [candSeconderName, setCandSeconderName] = useState('');
  const [candSeconderNumber, setCandSeconderNumber] = useState('');
  const [candStatus, setCandStatus] = useState<'APPROVED' | 'PENDING' | 'DISQUALIFIED'>('APPROVED');

  // Live Auto-Refresh State
  const [liveTick, setLiveTick] = useState(0);

  // Load elections & alumni list
  const loadElectionsData = async () => {
    try {
      const [elecList, alumni] = await Promise.all([
        dataService.getElectionCycles(),
        dataService.getAlumniList()
      ]);
      setElections(elecList);
      setAlumniList(alumni);

      // Determine selected election
      if (elecList.length > 0) {
        if (!selectedElectionId || !elecList.some(e => e.id === selectedElectionId)) {
          const active = elecList.find(e => e.status === 'VOTING_ACTIVE') || elecList[0];
          setSelectedElectionId(active.id);
        }
      } else {
        setSelectedElectionId('');
      }
    } catch (err) {
      console.error('Failed to load elections data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load candidates for selected election
  const loadCandidates = async (electionId: string) => {
    if (!electionId) {
      setCandidates([]);
      return;
    }
    try {
      const cands = await dataService.getCandidates(electionId);
      setCandidates(cands);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  };

  useEffect(() => {
    loadElectionsData();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadCandidates(selectedElectionId);
    }
  }, [selectedElectionId]);

  // Real-time live polling & custom event listener
  useEffect(() => {
    const handleLiveVote = () => {
      setLiveTick(prev => prev + 1);
    };

    window.addEventListener('mosa-vote-cast', handleLiveVote);
    window.addEventListener('mosa-election-updated', handleLiveVote);
    window.addEventListener('mosa-candidate-updated', handleLiveVote);
    window.addEventListener('storage', handleLiveVote);

    // Live polling interval every 3 seconds for ALWAYS LIVE results
    const interval = setInterval(() => {
      setLiveTick(prev => prev + 1);
    }, 3000);

    return () => {
      window.removeEventListener('mosa-vote-cast', handleLiveVote);
      window.removeEventListener('mosa-election-updated', handleLiveVote);
      window.removeEventListener('mosa-candidate-updated', handleLiveVote);
      window.removeEventListener('storage', handleLiveVote);
      clearInterval(interval);
    };
  }, []);

  // When liveTick fires, refresh candidate tallies and election totals silently
  useEffect(() => {
    if (selectedElectionId) {
      dataService.getCandidates(selectedElectionId).then(cands => {
        setCandidates(cands);
      });
      dataService.getElectionCycles().then(cycles => {
        setElections(cycles);
      });
    }
  }, [liveTick, selectedElectionId]);

  const selectedElection = elections.find(e => e.id === selectedElectionId) || null;

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Schedule / Edit Election Handlers
  const openScheduleModal = (electionToEdit?: ElectionCycle) => {
    if (electionToEdit) {
      setIsEditingElection(true);
      setCycleTitle(electionToEdit.title);
      setCycleTheme(electionToEdit.theme || '');
      setCycleTerm(electionToEdit.term || '');
      setCycleDesc(electionToEdit.description || '');
      setCycleNomDeadline(electionToEdit.nominationDeadline || '');
      setCycleVotingStart(electionToEdit.votingStartDate || '');
      setCycleVotingEnd(electionToEdit.votingEndDate || '');
      setCycleQuorum(electionToEdit.quorumRequiredPercentage || 25);
      setCycleEligibleVoters(electionToEdit.eligibleVotersCount || 250);
      setCycleInitialStatus(electionToEdit.status || 'UPCOMING');
    } else {
      setIsEditingElection(false);
      const year = new Date().getFullYear();
      setCycleTitle(`MOSA National Executive Committee General Elections ${year}`);
      setCycleTheme('Integrity, Unity & Institutional Progress');
      setCycleTerm(`${year} - ${year + 2}`);
      setCycleDesc('Official secret ballot election of the MOSA National Executive Committee.');
      setCycleNomDeadline(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
      setCycleVotingStart(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
      setCycleVotingEnd(new Date(Date.now() + 16 * 86400000).toISOString().split('T')[0]);
      setCycleQuorum(25);
      setCycleEligibleVoters(alumniList.length > 0 ? alumniList.length : 250);
      setCycleInitialStatus('NOMINATIONS_OPEN');
    }
    setShowScheduleModal(true);
  };

  const handleSaveElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingElection && selectedElection) {
        await dataService.updateElectionCycle({
          id: selectedElection.id,
          title: cycleTitle,
          theme: cycleTheme,
          term: cycleTerm,
          description: cycleDesc,
          nominationDeadline: cycleNomDeadline,
          votingStartDate: cycleVotingStart,
          votingEndDate: cycleVotingEnd,
          quorumRequiredPercentage: Number(cycleQuorum),
          eligibleVotersCount: Number(cycleEligibleVoters),
          status: cycleInitialStatus,
        });
        showNotification('Election cycle updated successfully.');
      } else {
        const created = await dataService.createElectionCycle({
          title: cycleTitle,
          theme: cycleTheme,
          term: cycleTerm,
          description: cycleDesc,
          nominationDeadline: cycleNomDeadline,
          votingStartDate: cycleVotingStart,
          votingEndDate: cycleVotingEnd,
          quorumRequiredPercentage: Number(cycleQuorum),
          eligibleVotersCount: Number(cycleEligibleVoters),
          status: cycleInitialStatus,
        });
        setSelectedElectionId(created.id);
        showNotification('New election cycle scheduled and published.');
      }
      setShowScheduleModal(false);
      await loadElectionsData();
    } catch (err: any) {
      alert(`Error saving election: ${err.message}`);
    }
  };

  const handleDeleteElection = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this election cycle? All candidates and recorded votes will be removed.')) return;
    try {
      await dataService.deleteElectionCycle(id);
      showNotification('Election cycle deleted.');
      await loadElectionsData();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (cycleId: string, status: ElectionStatus) => {
    try {
      await dataService.updateElectionCycle({ id: cycleId, status });
      showNotification(`Electoral stage moved to ${status.replace('_', ' ')}.`);
      await loadElectionsData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleCertify = async (cycleId: string) => {
    if (!confirm('Certify and seal this election declaration? This concludes voting and archives the certified return.')) return;
    try {
      await dataService.certifyElection(
        cycleId,
        currentUser.email,
        `Certified by ${currentUser.displayName || currentUser.email} (${currentUser.role}) on ${new Date().toLocaleDateString()}`
      );
      showNotification('Election cycle officially certified and sealed.');
      await loadElectionsData();
    } catch (err: any) {
      alert(`Failed to certify: ${err.message}`);
    }
  };

  // Position Handlers
  const openPositionModal = (pos?: ElectionPosition) => {
    if (pos) {
      setEditingPosition(pos);
      setPosTitle(pos.title);
      setPosDesc(pos.description || '');
      setPosMaxSelect(pos.maxSelect || 1);
      setPosOrder(pos.order || 1);
    } else {
      setEditingPosition(null);
      setPosTitle('');
      setPosDesc('');
      setPosMaxSelect(1);
      setPosOrder((selectedElection?.positions.length || 0) + 1);
    }
    setShowPositionModal(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElection) return;

    try {
      if (editingPosition) {
        await dataService.updatePositionInElection(selectedElection.id, {
          id: editingPosition.id,
          title: posTitle,
          description: posDesc,
          maxSelect: Number(posMaxSelect),
          order: Number(posOrder),
        });
        showNotification('Position updated.');
      } else {
        await dataService.addPositionToElection(selectedElection.id, {
          title: posTitle,
          description: posDesc,
          maxSelect: Number(posMaxSelect),
          order: Number(posOrder),
        });
        showNotification('New position added to election.');
      }
      setShowPositionModal(false);
      await loadElectionsData();
    } catch (err: any) {
      alert(`Failed to save position: ${err.message}`);
    }
  };

  const handleDeletePosition = async (posId: string) => {
    if (!selectedElection) return;
    if (!confirm('Are you sure you want to remove this position from the election?')) return;
    try {
      await dataService.deletePositionFromElection(selectedElection.id, posId);
      showNotification('Position removed.');
      await loadElectionsData();
    } catch (err: any) {
      alert(`Failed to remove position: ${err.message}`);
    }
  };

  // Candidate Placement & Manifesto Handlers
  const openCandidateModal = (cand?: Candidate) => {
    if (cand) {
      setEditingCandidate(cand);
      setCandPositionId(cand.positionId);
      setCandFullName(cand.fullName);
      setCandAlumniNumber(cand.alumniNumber);
      setCandAlumniId(cand.alumniId);
      setCandCohort(cand.cohort);
      setCandProfession(cand.profession || '');
      setCandPhotoUrl(cand.photoUrl || '');
      setCandManifesto(cand.manifesto || '');
      setCandSeconderName(cand.seconderName || '');
      setCandSeconderNumber(cand.seconderAlumniNumber || '');
      setCandStatus(cand.status);
    } else {
      setEditingCandidate(null);
      setCandAlumniSearch('');
      setCandPositionId(selectedElection?.positions[0]?.id || '');
      setCandFullName('');
      setCandAlumniNumber('');
      setCandAlumniId('');
      setCandCohort('');
      setCandProfession('');
      setCandPhotoUrl('');
      setCandManifesto('Pledged to uphold the MOSA Constitution, strengthen alumni welfare, and foster institutional excellence.');
      setCandSeconderName('');
      setCandSeconderNumber('');
      setCandStatus('APPROVED');
    }
    setShowCandidateModal(true);
  };

  // When selecting an alumnus from search autocomplete
  const handleSelectAlumnusForCandidate = (alumnus: AlumniProfile) => {
    setCandFullName(alumnus.fullName || `${alumnus.firstName} ${alumnus.lastName}`);
    setCandAlumniNumber(alumnus.alumniNumber || 'MA. PENDING');
    setCandAlumniId(alumnus.id);
    setCandCohort(alumnus.cohort || alumnus.yearOfCompletion || 'Alumnus');
    setCandProfession(alumnus.profession || alumnus.careerTitle || '');
    setCandPhotoUrl(alumnus.photoUrl || '');
    setCandAlumniSearch('');
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElection) return;
    if (!candPositionId) {
      alert('Please select a position for this candidate.');
      return;
    }
    if (!candFullName || !candAlumniNumber) {
      alert('Candidate full name and permanent MA membership number are required.');
      return;
    }

    try {
      await dataService.saveCandidate({
        id: editingCandidate?.id,
        electionId: selectedElection.id,
        positionId: candPositionId,
        fullName: candFullName,
        alumniNumber: candAlumniNumber,
        alumniId: candAlumniId,
        cohort: candCohort,
        profession: candProfession,
        photoUrl: candPhotoUrl,
        manifesto: candManifesto,
        seconderName: candSeconderName,
        seconderAlumniNumber: candSeconderNumber,
        status: candStatus,
      });

      showNotification(editingCandidate ? 'Candidate details and manifesto updated.' : 'Candidate registered and placed on official ballot.');
      setShowCandidateModal(false);
      await loadCandidates(selectedElection.id);
    } catch (err: any) {
      alert(`Failed to save candidate: ${err.message}`);
    }
  };

  const handleDeleteCandidate = async (candId: string) => {
    if (!confirm('Are you sure you want to remove this candidate?')) return;
    try {
      await dataService.deleteCandidate(candId);
      showNotification('Candidate removed.');
      if (selectedElection) {
        await loadCandidates(selectedElection.id);
      }
    } catch (err: any) {
      alert(`Failed to delete candidate: ${err.message}`);
    }
  };

  // Turnout & Quorum calculation
  const totalBallots = selectedElection?.totalBallotsCast || 0;
  const eligibleVoters = selectedElection?.eligibleVotersCount || 1;
  const turnoutPercent = Math.round((totalBallots / eligibleVoters) * 100);
  const quorumPercent = selectedElection?.quorumRequiredPercentage || 25;
  const quorumMet = turnoutPercent >= quorumPercent;
  const requiredVotesForQuorum = Math.ceil(eligibleVoters * (quorumPercent / 100));

  // Filtered alumni for search dropdown
  const filteredAlumni = candAlumniSearch.trim()
    ? alumniList.filter(a => {
        const q = candAlumniSearch.toLowerCase();
        return (
          a.fullName?.toLowerCase().includes(q) ||
          a.alumniNumber?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="mosa-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Vote size={22} color="#D97706" />
              <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                MOSA Electoral Commission Operations Desk
              </h2>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
              Schedule election cycles, configure positions, place verified alumni candidates with their MA numbers and manifestos, and monitor live secret ballot results.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => openScheduleModal()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0B203E',
                color: '#FFFFFF',
                border: '1px solid #D97706',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11,32,62,0.2)'
              }}
            >
              <Plus size={16} color="#FCD34D" /> Schedule New Election
            </button>
          </div>
        </div>

        {notice && (
          <div style={{ marginTop: '1rem', background: '#ECFDF5', color: '#065F46', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        {/* Election Cycle Selector */}
        {elections.length > 0 ? (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E' }}>Active Election Cycle:</span>
            <select
              value={selectedElectionId}
              onChange={e => setSelectedElectionId(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0B203E',
                background: '#FFFFFF',
                minWidth: '280px'
              }}
            >
              {elections.map(ec => (
                <option key={ec.id} value={ec.id}>
                  {ec.title} ({ec.term}) &bull; [{ec.status.replace('_', ' ')}]
                </option>
              ))}
            </select>

            {selectedElection && (
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button
                  onClick={() => openScheduleModal(selectedElection)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={14} /> Edit Cycle
                </button>
                <button
                  onClick={() => handleDeleteElection(selectedElection.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '1.25rem', textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '10px', border: '1.5px dashed #CBD5E1' }}>
            <Vote size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
            <h4 style={{ margin: '0 0 0.4rem 0', color: '#0B203E' }}>No Election Cycles Scheduled Yet</h4>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
              Create an election cycle to configure positions, attach candidates with MA numbers and manifestos, and open voting.
            </p>
            <button
              onClick={() => openScheduleModal()}
              style={{
                background: '#0B203E',
                color: '#FFFFFF',
                border: '1px solid #D97706',
                padding: '0.6rem 1.4rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + Schedule Inaugural Alumni Election
            </button>
          </div>
        )}
      </div>

      {selectedElection && (
        <>
          {/* Subtabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.2rem', overflowX: 'auto' }}>
            {[
              { key: 'overview', label: 'Overview & Commission Stages', icon: ShieldCheck },
              { key: 'positions', label: `Positions (${selectedElection.positions.length})`, icon: Award },
              { key: 'candidates', label: `Candidates & Manifestos (${candidates.length})`, icon: Users },
              { key: 'live_results', label: 'Live Results & Tally Board', icon: TrendingUp, liveBadge: true },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 1.1rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: isActive ? '3px solid #D97706' : '3px solid transparent',
                    color: isActive ? '#0B203E' : '#64748B',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginBottom: '-2px'
                  }}
                >
                  <Icon size={16} color={isActive ? '#D97706' : '#64748B'} />
                  {tab.label}
                  {tab.liveBadge && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: '#DCFCE7',
                      color: '#14532D',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      border: '1px solid #86EFAC'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0A271B', display: 'inline-block' }} />
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW & COMMISSION STAGES                      */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="mosa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: selectedElection.status === 'VOTING_ACTIVE' ? '#DCFCE7' : selectedElection.status === 'CONCLUDED' ? '#E0E7FF' : '#FEF3C7',
                      color: selectedElection.status === 'VOTING_ACTIVE' ? '#14532D' : selectedElection.status === 'CONCLUDED' ? '#3730A3' : '#92400E',
                      border: '1px solid currentColor',
                      display: 'inline-block',
                      marginBottom: '0.4rem'
                    }}>
                      STAGE: {selectedElection.status.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.25rem 0' }}>
                      {selectedElection.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                      {selectedElection.theme ? `Theme: "${selectedElection.theme}" • ` : ''}Electoral Term: {selectedElection.term}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selectedElection.status !== 'CONCLUDED' && (
                      <button
                        onClick={() => handleCertify(selectedElection.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#047857',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.55rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(4,120,87,0.3)'
                        }}
                      >
                        <ShieldCheck size={16} /> Certify Election Return & Seal
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Ballots Tallied</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0B203E', marginTop: '0.2rem' }}>
                      {totalBallots}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>from {eligibleVoters} registered alumni</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Turnout Percentage</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: quorumMet ? '#059669' : '#D97706', marginTop: '0.2rem' }}>
                      {turnoutPercent}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Threshold: {quorumPercent}%</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Quorum Status</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: quorumMet ? '#059669' : '#D97706', marginTop: '0.45rem' }}>
                      {quorumMet ? 'Quorum Met ✓' : `Requires ${requiredVotesForQuorum} votes`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Constitutional Requirement</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Positions Contested</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E40AF', marginTop: '0.2rem' }}>
                      {selectedElection.positions.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{candidates.length} vetted candidates</div>
                  </div>
                </div>

                {/* Stage Progression Bar */}
                <div style={{ background: '#F1F5F9', padding: '1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.75rem' }}>
                    Advance Electoral Commission Stage:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_ACTIVE', 'TALLYING', 'CONCLUDED'] as const).map(st => {
                      const isCurrent = selectedElection.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedElection.id, st)}
                          style={{
                            padding: '0.55rem 1rem',
                            fontSize: '0.78rem',
                            fontWeight: isCurrent ? 800 : 600,
                            borderRadius: '8px',
                            border: isCurrent ? '2px solid #0B203E' : '1px solid #CBD5E1',
                            background: isCurrent ? '#0B203E' : '#FFFFFF',
                            color: isCurrent ? '#FFFFFF' : '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: isCurrent ? '0 2px 6px rgba(11,32,62,0.2)' : 'none'
                          }}
                        >
                          {isCurrent && <CheckCircle2 size={14} color="#FCD34D" />}
                          {st.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedElection.certifiedAt && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', color: '#3730A3', fontSize: '0.85rem' }}>
                    <strong>Official Certified Declaration:</strong> Certified by {selectedElection.certifiedBy} on {new Date(selectedElection.certifiedAt).toLocaleString()}.
                    <br />
                    <em>"{selectedElection.declarationSummary}"</em>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: POSITIONS MANAGEMENT                              */}
          {/* ======================================================== */}
          {activeTab === 'positions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="mosa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.25rem 0' }}>
                      Electoral Positions ({selectedElection.positions.length})
                    </h3>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                      Define executive roles contested in this election cycle.
                    </p>
                  </div>

                  <button
                    onClick={() => openPositionModal()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#0B203E',
                      color: '#FFFFFF',
                      border: '1px solid #D97706',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} color="#FCD34D" /> Add New Position
                  </button>
                </div>

                {selectedElection.positions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    <p style={{ color: '#64748B', margin: '0 0 1rem 0' }}>No positions configured for this election cycle yet.</p>
                    <button
                      onClick={() => openPositionModal()}
                      style={{
                        background: '#0B203E',
                        color: '#FFFFFF',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Position
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {selectedElection.positions.sort((a, b) => (a.order || 0) - (b.order || 0)).map(pos => {
                      const posCandidates = candidates.filter(c => c.positionId === pos.id);
                      return (
                        <div
                          key={pos.id}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1.5px solid #CBD5E1',
                            padding: '1.15rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                Order #{pos.order || 1} &bull; Max: {pos.maxSelect || 1}
                              </span>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  onClick={() => openPositionModal(pos)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#64748B' }}
                                  title="Edit Position"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeletePosition(pos.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#DC2626' }}
                                  title="Delete Position"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E', margin: '0.2rem 0 0.4rem 0' }}>
                              {pos.title}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                              {pos.description || 'No description provided.'}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                              {posCandidates.length} {posCandidates.length === 1 ? 'candidate' : 'candidates'}
                            </span>
                            <button
                              onClick={() => {
                                setCandPositionId(pos.id);
                                openCandidateModal();
                              }}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                color: '#0B203E',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + Add Candidate
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CANDIDATES & MANIFESTOS                           */}
          {/* ======================================================== */}
          {activeTab === 'candidates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="mosa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.25rem 0' }}>
                      Registered Candidates & Official Manifestos ({candidates.length})
                    </h3>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                      Candidates placed by verified alumni registration records, permanent MA membership numbers, and policy manifestos.
                    </p>
                  </div>

                  <button
                    onClick={() => openCandidateModal()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#0B203E',
                      color: '#FFFFFF',
                      border: '1px solid #D97706',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} color="#FCD34D" /> Place / Register Candidate
                  </button>
                </div>

                {candidates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                    <Users size={40} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#0B203E' }}>No Candidates Placed Yet</h4>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                      Add candidates from the registered alumni membership directory. Their MA numbers, cohorts, and manifestos will be displayed on official ballots.
                    </p>
                    <button
                      onClick={() => openCandidateModal()}
                      style={{
                        background: '#0B203E',
                        color: '#FFFFFF',
                        border: '1px solid #D97706',
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Candidate
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {candidates.map(cand => {
                      const pos = selectedElection.positions.find(p => p.id === cand.positionId);
                      return (
                        <div
                          key={cand.id}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1.5px solid #CBD5E1',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            {/* Candidate Header */}
                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                              <img
                                src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.fullName)}&background=0B203E&color=fff`}
                                alt={cand.fullName}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #D97706',
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                    {pos?.title || 'Contested Post'}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    background: cand.status === 'APPROVED' ? '#DCFCE7' : '#FEE2E2',
                                    color: cand.status === 'APPROVED' ? '#14532D' : '#B91C1C'
                                  }}>
                                    {cand.status}
                                  </span>
                                </div>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E', margin: '0.25rem 0 0.1rem 0' }}>
                                  {cand.fullName}
                                </h4>
                                <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
                                  {cand.alumniNumber} &bull; Cohort {cand.cohort}
                                </div>
                                {cand.profession && (
                                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                    {cand.profession}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Manifesto Box */}
                            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0B203E', textTransform: 'uppercase' }}>
                                  Candidate Manifesto Pledge
                                </span>
                                <button
                                  onClick={() => {
                                    setViewingCandidate(cand);
                                    setShowManifestoModal(true);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#D97706',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  Read Full &rarr;
                                </button>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.45, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                "{cand.manifesto || 'No manifesto pledge recorded yet.'}"
                              </p>
                            </div>

                            {cand.seconderName && (
                              <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                <ShieldCheck size={13} color="#047857" />
                                Seconded by: <strong>{cand.seconderName}</strong> ({cand.seconderAlumniNumber || 'Verified'})
                              </div>
                            )}
                          </div>

                          {/* Footer with Votes & Actions */}
                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>
                                {cand.votesCount || 0}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.25rem' }}>votes</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => openCandidateModal(cand)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  background: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  color: '#0B203E',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={13} /> Edit / Manifesto
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(cand.id)}
                                style={{
                                  background: '#FEE2E2',
                                  border: '1px solid #FCA5A5',
                                  color: '#DC2626',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Remove candidate"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ALWAYS-LIVE RESULTS & TALLY BOARD                 */}
          {/* ======================================================== */}
          {activeTab === 'live_results' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Live Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0A271B 0%, #14532D 100%)',
                color: '#FFFFFF',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1.5px solid #C68A24',
                boxShadow: '0 8px 24px -6px rgba(10,39,27,0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(52, 211, 153, 0.2)',
                      color: '#34D399',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: '1px solid #34D399'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block', boxShadow: '0 0 8px #34D399' }} />
                      ALWAYS LIVE BALLOT TALLY
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#FCD34D' }}>Auto-polling every 3 seconds</span>
                  </div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 0.25rem 0', color: '#FFFFFF' }}>
                    {selectedElection.title}
                  </h3>
                  <p style={{ color: '#E2E8F0', fontSize: '0.85rem', margin: 0 }}>
                    Official live certified return of secret ballots cast by registered alumni.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => setLiveTick(prev => prev + 1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} /> Refresh Tallies Now
                  </button>
                  <button
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={14} /> Print Certified Return
                  </button>
                </div>
              </div>

              {/* Turnout & Quorum Progress Card */}
              <div className="mosa-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0B203E' }}>
                    Constitutional Quorum Progress: {totalBallots} of {requiredVotesForQuorum} votes needed ({turnoutPercent}% reached)
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: quorumMet ? '#059669' : '#D97706',
                    background: quorumMet ? '#DCFCE7' : '#FEF3C7',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px'
                  }}>
                    {quorumMet ? 'QUORUM REACHED ✓' : `NEEDS ${requiredVotesForQuorum - totalBallots} MORE BALLOTS`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(turnoutPercent, 100)}%`,
                      height: '100%',
                      background: quorumMet ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #F59E0B, #D97706)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>

              {/* Position by Position Live Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {selectedElection.positions.sort((a, b) => (a.order || 0) - (b.order || 0)).map(pos => {
                  const posCandidates = candidates.filter(c => c.positionId === pos.id);
                  const totalVotesForPos = posCandidates.reduce((acc, c) => acc + (c.votesCount || 0), 0);
                  const sortedCandidates = [...posCandidates].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
                  const highestVote = sortedCandidates[0]?.votesCount || 0;

                  return (
                    <div
                      key={pos.id}
                      className="mosa-card"
                      style={{ padding: '1.5rem', borderLeft: '4px solid #D97706' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                            POSITION #{pos.order || 1}
                          </span>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0B203E', margin: '0.2rem 0 0.1rem 0' }}>
                            {pos.title}
                          </h4>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {pos.description}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0B203E' }}>
                            {totalVotesForPos}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Total Ballots Tallied
                          </div>
                        </div>
                      </div>

                      {posCandidates.length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                          No candidates registered for this position.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {sortedCandidates.map((cand, idx) => {
                            const candVotes = cand.votesCount || 0;
                            const percent = totalVotesForPos > 0 ? Math.round((candVotes / totalVotesForPos) * 100) : 0;
                            const isLeading = highestVote > 0 && candVotes === highestVote;

                            return (
                              <div
                                key={cand.id}
                                style={{
                                  background: isLeading ? '#F0FDF4' : '#F8FAFC',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                  border: isLeading ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <img
                                      src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.fullName)}&background=0B203E&color=fff`}
                                      alt={cand.fullName}
                                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #D97706' }}
                                    />
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 800, color: '#0B203E', fontSize: '0.98rem' }}>
                                          {cand.fullName}
                                        </span>
                                        {isLeading && (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.2rem',
                                            background: '#DCFCE7',
                                            color: '#14532D',
                                            fontSize: '0.68rem',
                                            fontWeight: 800,
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '999px',
                                            border: '1px solid #86EFAC'
                                          }}>
                                            <Award size={12} /> LEADING
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        {cand.alumniNumber} &bull; {cand.cohort} {cand.profession ? `&bull; ${cand.profession}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isLeading ? '#14532D' : '#0B203E' }}>
                                      {candVotes} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>({percent}%)</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>verified votes</div>
                                  </div>
                                </div>

                                {/* Live Progress Bar */}
                                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${percent}%`,
                                      height: '100%',
                                      background: isLeading ? 'linear-gradient(90deg, #10B981, #047857)' : 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
                                      borderRadius: '999px',
                                      transition: 'width 0.4s ease'
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SCHEDULE / EDIT ELECTION CYCLE                  */}
      {/* ======================================================== */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,32,62,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0B203E', fontWeight: 800 }}>
                  {isEditingElection ? 'Edit Election Cycle' : 'Schedule New Election Cycle'}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveElection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Election Title *
                </label>
                <input
                  type="text"
                  required
                  value={cycleTitle}
                  onChange={e => setCycleTitle(e.target.value)}
                  placeholder="e.g. MOSA NEC General Elections 2026"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Electoral Term *
                  </label>
                  <input
                    type="text"
                    required
                    value={cycleTerm}
                    onChange={e => setCycleTerm(e.target.value)}
                    placeholder="e.g. 2026 - 2028"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Theme / Slogan
                  </label>
                  <input
                    type="text"
                    value={cycleTheme}
                    onChange={e => setCycleTheme(e.target.value)}
                    placeholder="e.g. Integrity & Progress"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Description / Preamble
                </label>
                <textarea
                  rows={2}
                  value={cycleDesc}
                  onChange={e => setCycleDesc(e.target.value)}
                  placeholder="Official notice and context for this election..."
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Nomination Deadline
                  </label>
                  <input
                    type="date"
                    value={cycleNomDeadline}
                    onChange={e => setCycleNomDeadline(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Voting Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleVotingStart}
                    onChange={e => setCycleVotingStart(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Voting End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={cycleVotingEnd}
                    onChange={e => setCycleVotingEnd(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Quorum Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={cycleQuorum}
                    onChange={e => setCycleQuorum(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Eligible Voters (Est.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cycleEligibleVoters}
                    onChange={e => setCycleEligibleVoters(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Initial Stage
                  </label>
                  <select
                    value={cycleInitialStatus}
                    onChange={e => setCycleInitialStatus(e.target.value as ElectionStatus)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="NOMINATIONS_OPEN">NOMINATIONS OPEN</option>
                    <option value="VOTING_ACTIVE">VOTING ACTIVE</option>
                    <option value="TALLYING">TALLYING</option>
                    <option value="CONCLUDED">CONCLUDED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ padding: '0.55rem 1.1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.4rem', background: '#0B203E', color: '#FFFFFF', border: '1px solid #D97706', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isEditingElection ? 'Save Changes' : 'Schedule Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT POSITION                             */}
      {/* ======================================================== */}
      {showPositionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,32,62,0.65)',
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
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0B203E', fontWeight: 800 }}>
                  {editingPosition ? 'Edit Position' : 'Add Position to Election'}
                </h3>
              </div>
              <button
                onClick={() => setShowPositionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePosition} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={posTitle}
                  onChange={e => setPosTitle(e.target.value)}
                  placeholder="e.g. President / National Chairperson"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Description / Constitutional Roles
                </label>
                <textarea
                  rows={3}
                  value={posDesc}
                  onChange={e => setPosDesc(e.target.value)}
                  placeholder="Primary executive responsibilities..."
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Order Sequence
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={posOrder}
                    onChange={e => setPosOrder(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Max Choices Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={posMaxSelect}
                    onChange={e => setPosMaxSelect(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPositionModal(false)}
                  style={{ padding: '0.55rem 1.1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.4rem', background: '#0B203E', color: '#FFFFFF', border: '1px solid #D97706', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {editingPosition ? 'Save Changes' : 'Add Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PLACE / REGISTER CANDIDATE & MANIFESTO          */}
      {/* ======================================================== */}
      {showCandidateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,32,62,0.65)',
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
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0B203E', fontWeight: 800 }}>
                  {editingCandidate ? 'Edit Candidate & Manifesto' : 'Place Candidate by Registration & Membership Number'}
                </h3>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Alumni Registry Autocomplete Search */}
              {!editingCandidate && (
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Quick-Attach from Verified Alumni Registry:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      value={candAlumniSearch}
                      onChange={e => setCandAlumniSearch(e.target.value)}
                      placeholder="Type name, MA number (e.g. MA. 0001), or email to auto-fill..."
                      style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.2rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>

                  {filteredAlumni.length > 0 && (
                    <div style={{ marginTop: '0.5rem', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {filteredAlumni.map(al => (
                        <div
                          key={al.id}
                          onClick={() => handleSelectAlumnusForCandidate(al)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.82rem'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FEF3C7')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <div>
                            <strong>{al.fullName || `${al.firstName} ${al.lastName}`}</strong>
                            <span style={{ color: '#D97706', marginLeft: '0.5rem', fontWeight: 700 }}>
                              {al.alumniNumber}
                            </span>
                          </div>
                          <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
                            {al.cohort || al.yearOfCompletion} &bull; Select &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Target Position */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Target Position *
                </label>
                <select
                  required
                  value={candPositionId}
                  onChange={e => setCandPositionId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="">Select a contested position...</option>
                  {selectedElection?.positions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Registration Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Full Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={candFullName}
                    onChange={e => setCandFullName(e.target.value)}
                    placeholder="e.g. Dr. Arthur Muhumuza"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Permanent MA Membership Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={candAlumniNumber}
                    onChange={e => setCandAlumniNumber(e.target.value)}
                    placeholder="e.g. MA. 0001"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem', fontWeight: 700, color: '#D97706' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Cohort / Graduation Year
                  </label>
                  <input
                    type="text"
                    value={candCohort}
                    onChange={e => setCandCohort(e.target.value)}
                    placeholder="e.g. 2004 - 2007"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Profession / Career Title
                  </label>
                  <input
                    type="text"
                    value={candProfession}
                    onChange={e => setCandProfession(e.target.value)}
                    placeholder="e.g. Senior Software Architect"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Photo URL
                </label>
                <input
                  type="url"
                  value={candPhotoUrl}
                  onChange={e => setCandPhotoUrl(e.target.value)}
                  placeholder="https://... (leave blank for automatic avatar)"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Manifesto Text Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0B203E' }}>
                    Official Candidate Policy Manifesto *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Displayed on secret ballot cards for voters to inspect
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={candManifesto}
                  onChange={e => setCandManifesto(e.target.value)}
                  placeholder="Enter the candidate's strategic priorities, vision for MOSA, and key policy commitments..."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', lineHeight: 1.45 }}
                />
              </div>

              {/* Seconder Details & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Seconder Alumnus Name
                  </label>
                  <input
                    type="text"
                    value={candSeconderName}
                    onChange={e => setCandSeconderName(e.target.value)}
                    placeholder="e.g. Sarah Namubiru"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Seconder MA Number
                  </label>
                  <input
                    type="text"
                    value={candSeconderNumber}
                    onChange={e => setCandSeconderNumber(e.target.value)}
                    placeholder="e.g. MA. 0089"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Vetting Status
                  </label>
                  <select
                    value={candStatus}
                    onChange={e => setCandStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  >
                    <option value="APPROVED">APPROVED / VETTED</option>
                    <option value="PENDING">PENDING REVIEW</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  style={{ padding: '0.55rem 1.1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.55rem 1.4rem', background: '#0B203E', color: '#FFFFFF', border: '1px solid #D97706', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {editingCandidate ? 'Save Candidate & Manifesto' : 'Register Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: FULL MANIFESTO VIEWER                           */}
      {/* ======================================================== */}
      {showManifestoModal && viewingCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,32,62,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <img
                  src={viewingCandidate.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingCandidate.fullName)}&background=0B203E&color=fff`}
                  alt={viewingCandidate.fullName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D97706' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0B203E', fontWeight: 800 }}>
                    {viewingCandidate.fullName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>
                    {viewingCandidate.alumniNumber} &bull; Cohort {viewingCandidate.cohort}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Position: {selectedElection?.positions.find(p => p.id === viewingCandidate.positionId)?.title || viewingCandidate.positionId}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowManifestoModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Official Candidate Policy Manifesto & Pledges:
              </div>
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {viewingCandidate.manifesto || 'No manifesto documented.'}
              </p>
            </div>

            {viewingCandidate.seconderName && (
              <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={16} color="#047857" />
                Officially Seconded by: <strong>{viewingCandidate.seconderName}</strong> ({viewingCandidate.seconderAlumniNumber || 'Verified Member'})
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setShowManifestoModal(false);
                  openCandidateModal(viewingCandidate);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#0B203E',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={14} /> Edit Manifesto
              </button>
              <button
                onClick={() => setShowManifestoModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
