import React, { useState, useEffect } from 'react';
import {
  Vote,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Lock,
  ChevronRight,
  ArrowLeft,
  FileText,
  Printer,
  Sparkles,
  Search,
  X,
  Send,
  UserCheck,
  TrendingUp,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import {
  ElectionCycle,
  ElectionPosition,
  Candidate,
  BallotVote,
  AuthUser
} from '../types';
import { dataService } from '../services/dataService';

interface ElectionsHubProps {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const ElectionsHub: React.FC<ElectionsHubProps> = ({
  currentUser,
  onOpenAuth,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'ballot' | 'candidates' | 'results' | 'nominate'>('ballot');
  const [elections, setElections] = useState<ElectionCycle[]>([]);
  const [selectedElection, setSelectedElection] = useState<ElectionCycle | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Voting state
  const [hasVoted, setHasVoted] = useState(false);
  const [receiptTokens, setReceiptTokens] = useState<string[]>([]);
  const [ballotSelections, setBallotSelections] = useState<Record<string, string>>({}); // positionId -> candidateId
  const [isSubmittingBallot, setIsSubmittingBallot] = useState(false);
  const [castSuccessToken, setCastSuccessToken] = useState<string | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);

  // Candidate Nomination form state
  const [nomPositionId, setNomPositionId] = useState('');
  const [nomCandidateName, setNomCandidateName] = useState('');
  const [nomCandidateNumber, setNomCandidateNumber] = useState('');
  const [nomCohort, setNomCohort] = useState('');
  const [nomProfession, setNomProfession] = useState('');
  const [nomManifesto, setNomManifesto] = useState('');
  const [nomSeconderName, setNomSeconderName] = useState('');
  const [nomSeconderNumber, setNomSeconderNumber] = useState('');
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [nominationSuccess, setNominationSuccess] = useState(false);

  // Candidate details modal
  const [inspectCandidate, setInspectCandidate] = useState<Candidate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const elecList = await dataService.getElectionCycles();
      setElections(elecList);
      const active = elecList.find(e => e.status === 'VOTING_ACTIVE') || elecList[0] || null;
      setSelectedElection(active);

      if (active) {
        const cands = await dataService.getCandidates(active.id);
        setCandidates(cands);

        if (currentUser) {
          const voted = await dataService.hasVotedInElection(active.id, currentUser);
          setHasVoted(voted);
          if (voted) {
            const tokens = await dataService.getVoterReceiptTokens(active.id, currentUser);
            setReceiptTokens(tokens);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load elections data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSelectCandidate = (positionId: string, candidateId: string) => {
    setBallotSelections(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const handleCastBallot = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedElection) return;

    // Check if voter has verified MA number
    if (!currentUser.alumniNumber && !currentUser.alumniId) {
      setVotingError('Only officially verified alumni with an authentic MA number (e.g. MA. 0001) may cast votes.');
      return;
    }

    // Require selection for all positions
    const missing = selectedElection.positions.filter(p => !ballotSelections[p.id]);
    if (missing.length > 0) {
      setVotingError(`Please select a candidate for: ${missing.map(p => p.title).join(', ')}`);
      return;
    }

    setVotingError(null);
    setIsSubmittingBallot(true);

    try {
      const res = await dataService.castSecretBallot(selectedElection.id, ballotSelections, currentUser);
      setCastSuccessToken(res.receiptToken);
      setHasVoted(true);
      setReceiptTokens([res.receiptToken]);
      await loadData();
    } catch (err: any) {
      setVotingError(err.message || 'Failed to submit secret ballot. Please try again.');
    } finally {
      setIsSubmittingBallot(false);
    }
  };

  const handleNominateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedElection) return;

    setIsSubmittingNomination(true);
    try {
      await dataService.nominateCandidate({
        electionId: selectedElection.id,
        positionId: nomPositionId || selectedElection.positions[0]?.id,
        fullName: nomCandidateName || currentUser.displayName,
        alumniNumber: nomCandidateNumber || currentUser.alumniNumber || 'MA. PENDING',
        cohort: nomCohort || 'Alumni Member',
        profession: nomProfession,
        manifesto: nomManifesto,
        seconderName: nomSeconderName,
        seconderAlumniNumber: nomSeconderNumber,
      }, currentUser);

      setNominationSuccess(true);
      setNomCandidateName('');
      setNomCandidateNumber('');
      setNomManifesto('');
      setNomSeconderName('');
      setNomSeconderNumber('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit nomination.');
    } finally {
      setIsSubmittingNomination(false);
    }
  };

  const handlePrintResults = () => {
    window.print();
  };

  if (!selectedElection) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Vote size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
        <h3>No Active Election Cycle</h3>
        <p style={{ color: '#64748B' }}>The Secretariat has not scheduled an active alumni election cycle at this time.</p>
      </div>
    );
  }

  // Turnout calculation
  const turnoutPercent = Math.round(
    (selectedElection.totalBallotsCast / (selectedElection.eligibleVotersCount || 1)) * 100
  );
  const quorumMet = turnoutPercent >= selectedElection.quorumRequiredPercentage;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
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

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{
                background: selectedElection.status === 'VOTING_ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                color: selectedElection.status === 'VOTING_ACTIVE' ? '#15803D' : '#B45309',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid currentColor'
              }}>
                {selectedElection.status === 'VOTING_ACTIVE' ? 'SECRET VOTING ACTIVE' : selectedElection.status.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• Term: {selectedElection.term}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.4rem 0' }}>
              {selectedElection.title}
            </h1>
            <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, maxWidth: '780px' }}>
              {selectedElection.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={handlePrintResults}
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
              <Printer size={16} color="#D97706" /> Print Certified Declaration
            </button>
          </div>
        </div>
      </div>

      {/* Quorum & Turnout Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: '#FFFFFF',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        border: '1px solid #C68A24',
        boxShadow: '0 8px 24px -6px rgba(10,39,27,0.3)'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 800, letterSpacing: '0.5px' }}>
            CONSTITUTIONAL QUORUM TRACKER
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: '0.2rem 0' }}>
            {selectedElection.totalBallotsCast} Ballots Cast
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            From {selectedElection.eligibleVotersCount} registered eligible alumni
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 800, letterSpacing: '0.5px' }}>
            TURNOUT & THRESHOLD
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: quorumMet ? '#34D399' : '#FBBF24', margin: '0.2rem 0' }}>
            {turnoutPercent}% Turnout
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Minimum Quorum Required: {selectedElection.quorumRequiredPercentage}% ({quorumMet ? 'Quorum Met ✓' : 'Pending Quorum'})
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 800, letterSpacing: '0.5px' }}>
            VOTING WINDOW
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', margin: '0.35rem 0' }}>
            {selectedElection.votingStartDate} to {selectedElection.votingEndDate}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38BDF8' }}>
            Strict secret ballot: 1 member = 1 vote
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="horizontal-scroll-touch" style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '1.75rem', gap: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveTab('ballot')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'ballot' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'ballot' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'ballot' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Vote size={18} color={activeTab === 'ballot' ? '#D97706' : '#64748B'} />
          Digital Secret Ballot
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'candidates' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'candidates' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'candidates' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Users size={18} color={activeTab === 'candidates' ? '#D97706' : '#64748B'} />
          Candidates & Manifestos ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('results')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'results' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'results' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'results' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <BarChart2 size={18} color={activeTab === 'results' ? '#D97706' : '#64748B'} />
          Certified Results & Tally
        </button>

        <button
          onClick={() => setActiveTab('nominate')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            color: activeTab === 'nominate' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'nominate' ? 800 : 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'nominate' ? '3px solid #D97706' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <UserCheck size={18} color={activeTab === 'nominate' ? '#D97706' : '#64748B'} />
          Nominate Candidate
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SECRET DIGITAL BALLOT                             */}
      {/* ======================================================== */}
      {activeTab === 'ballot' && (
        <div>
          {/* Already Voted Banner */}
          {hasVoted ? (
            <div style={{
              background: '#ECFDF5',
              border: '2px solid #10B981',
              borderRadius: '14px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <CheckCircle2 size={48} color="#047857" style={{ margin: '0 auto 0.75rem auto' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064E3B', margin: '0 0 0.35rem 0' }}>
                Your Official Ballot Has Been Securely Cast!
              </h2>
              <p style={{ color: '#047857', fontSize: '0.92rem', maxWidth: '580px', margin: '0 auto 1.25rem auto' }}>
                Thank you for exercising your constitutional right in the MOSA General Elections. Your votes have been anonymously tallied into the official ballot box.
              </p>

              {receiptTokens.length > 0 && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px dashed #059669',
                  borderRadius: '10px',
                  padding: '1rem',
                  maxWidth: '460px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Cryptographic Vote Verification Token
                  </div>
                  {receiptTokens.map((t, idx) => (
                    <code key={idx} style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#0B203E',
                      background: '#F1F5F9',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      letterSpacing: '0.8px'
                    }}>
                      {t}
                    </code>
                  ))}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Keep this receipt. It proves your vote was tallied without disclosing your secret choices.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Voter Instructions Notice */}
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Lock size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.88rem', color: '#92400E' }}>
                  <strong>Official Secret Ballot:</strong> Select exactly one candidate for each executive position below. When you click "Submit Secret Ballot", your votes will be recorded into the encrypted tally, and you will be issued a verifiable cryptographic receipt token.
                </div>
              </div>

              {votingError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.88rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={18} /> {votingError}
                </div>
              )}

              {/* Positions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {selectedElection.positions.map(position => {
                  const posCandidates = candidates.filter(c => c.positionId === position.id && c.status === 'APPROVED');
                  const selectedCandId = ballotSelections[position.id];

                  return (
                    <div
                      key={position.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #CBD5E1',
                        padding: '1.5rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                            {position.order}. {position.title}
                          </h3>
                          {selectedCandId && (
                            <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#047857', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                              Selection Made ✓
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
                          {position.description}
                        </p>
                      </div>

                      {posCandidates.length === 0 ? (
                        <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', padding: '1rem 0' }}>
                          No approved candidates nominated for this position yet.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                          {posCandidates.map(cand => {
                            const isSelected = selectedCandId === cand.id;

                            return (
                              <div
                                key={cand.id}
                                onClick={() => handleSelectCandidate(position.id, cand.id)}
                                style={{
                                  borderRadius: '10px',
                                  border: isSelected ? '2px solid #D97706' : '1px solid #CBD5E1',
                                  background: isSelected ? '#FFFBEB' : '#FFFFFF',
                                  padding: '1rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  gap: '0.85rem',
                                  alignItems: 'flex-start',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <img
                                  src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.fullName)}&background=0B203E&color=fff`}
                                  alt={cand.fullName}
                                  style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: isSelected ? '2px solid #D97706' : '1px solid #E2E8F0',
                                    flexShrink: 0
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0B203E' }}>
                                      {cand.fullName}
                                    </div>
                                    <input
                                      type="radio"
                                      name={position.id}
                                      checked={isSelected}
                                      onChange={() => handleSelectCandidate(position.id, cand.id)}
                                      style={{ accentColor: '#D97706', width: '18px', height: '18px' }}
                                    />
                                  </div>

                                  <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700, margin: '0.1rem 0' }}>
                                    {cand.alumniNumber} • {cand.cohort}
                                  </div>

                                  {cand.profession && (
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.45rem' }}>
                                      {cand.profession}
                                    </div>
                                  )}

                                  <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, margin: '0 0 0.45rem 0', fontStyle: 'italic' }}>
                                    "{cand.manifesto}"
                                  </p>

                                  {cand.seconderName && (
                                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                      Seconded by: {cand.seconderName}
                                    </div>
                                  )}
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

              {/* Submit Ballot Button */}
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button
                  onClick={handleCastBallot}
                  disabled={isSubmittingBallot}
                  style={{
                    background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                    color: '#FFFFFF',
                    border: '2px solid #D97706',
                    padding: '0.95rem 2.5rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    cursor: isSubmittingBallot ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(11,32,62,0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Vote size={20} color="#F59E0B" />
                  {isSubmittingBallot ? 'Casting Secret Ballot...' : 'Submit Certified Secret Ballot'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CANDIDATES & MANIFESTOS                           */}
      {/* ======================================================== */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {candidates.map(cand => {
            const pos = selectedElection.positions.find(p => p.id === cand.positionId);

            return (
              <div
                key={cand.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #CBD5E1',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <img
                      src={cand.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.fullName)}&background=0B203E&color=fff`}
                      alt={cand.fullName}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #D97706',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {pos?.title || 'Executive Post'}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0B203E', margin: '0.35rem 0 0.15rem 0' }}>
                        {cand.fullName}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>
                        {cand.alumniNumber} • {cand.cohort}
                      </div>
                      {cand.profession && (
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {cand.profession}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.85rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.25rem' }}>
                      Manifesto Pledge:
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                      "{cand.manifesto}"
                    </p>
                  </div>

                  {cand.seconderName && (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="#047857" />
                      Seconded by {cand.seconderName} ({cand.seconderAlumniNumber || 'Verified'})
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Nominated {cand.nominatedAt}
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab('ballot');
                      handleSelectCandidate(cand.positionId, cand.id);
                    }}
                    style={{
                      background: '#0B203E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Select on Ballot
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CERTIFIED RESULTS & TALLY                         */}
      {/* ======================================================== */}
      {activeTab === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {selectedElection.positions.map(position => {
            const posCandidates = candidates.filter(c => c.positionId === position.id);
            const totalPosVotes = posCandidates.reduce((acc, c) => acc + (c.votesCount || 0), 0);
            const leadingVotes = Math.max(...posCandidates.map(c => c.votesCount || 0), 0);

            return (
              <div
                key={position.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #CBD5E1',
                  padding: '1.5rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                      {position.title}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Total Valid Votes Cast: {totalPosVotes}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    1 Seat
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {posCandidates.map(cand => {
                    const votes = cand.votesCount || 0;
                    const percent = totalPosVotes > 0 ? Math.round((votes / totalPosVotes) * 100) : 0;
                    const isWinner = votes > 0 && votes === leadingVotes;

                    return (
                      <div key={cand.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E' }}>
                              {cand.fullName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>
                              ({cand.alumniNumber})
                            </span>
                            {isWinner && (
                              <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                                ELECTED / LEADING 👑
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0B203E' }}>
                            {votes} votes ({percent}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: isWinner ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' : '#0B203E',
                            borderRadius: '999px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: NOMINATE CANDIDATE                                */}
      {/* ======================================================== */}
      {activeTab === 'nominate' && (
        <div style={{ maxWidth: '680px', margin: '0 auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0B203E', margin: '0 0 0.35rem 0' }}>
            Candidate Nomination Form
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
            Submit an alumni candidate for the MOSA National Executive Committee. Nominees must be in good standing and seconded by a verified alumnus.
          </p>

          {nominationSuccess ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.5rem', borderRadius: '10px', color: '#047857', textAlign: 'center' }}>
              <CheckCircle2 size={42} style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ margin: '0 0 0.35rem 0', fontWeight: 800 }}>Nomination Form Lodged!</h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                The nomination has been submitted to the Electoral Commission Secretariat for credential vetting.
              </p>
            </div>
          ) : (
            <form onSubmit={handleNominateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Contesting Position *
                </label>
                <select
                  required
                  value={nomPositionId}
                  onChange={e => setNomPositionId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Select Executive Portfolio --</option>
                  {selectedElection.positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Muhammad Zatusave"
                    value={nomCandidateName}
                    onChange={e => setNomCandidateName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Alumni Number (MA. XXXX) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MA. 0001"
                    value={nomCandidateNumber}
                    onChange={e => setNomCandidateNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Class / Cohort *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class of 2004 (PEM)"
                    value={nomCohort}
                    onChange={e => setNomCohort(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                    Current Profession
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Civil Engineer"
                    value={nomProfession}
                    onChange={e => setNomProfession(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  Campaign Manifesto Summary (Max 300 words) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Outline key pledges, strategic priorities, and commitment to Mandela Secondary School Hoima..."
                  value={nomManifesto}
                  onChange={e => setNomManifesto(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.65rem' }}>
                  Mandatory Seconder Endorsement
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Seconder Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adv. Emmanuel Byaruhanga"
                      value={nomSeconderName}
                      onChange={e => setNomSeconderName(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Seconder MA Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MA. 0003"
                      value={nomSeconderNumber}
                      onChange={e => setNomSeconderNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNomination}
                style={{
                  background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: isSubmittingNomination ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmittingNomination ? 'Lodge Nomination...' : 'Lodge Formal Nomination'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
