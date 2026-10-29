import React, { useState, useEffect } from 'react';
import { Chapter, ChapterMember, AlumniProfile, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { 
  Landmark, 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  CheckCircle, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  X, 
  Edit3, 
  Award, 
  Phone, 
  Mail, 
  AlertCircle,
  Building2,
  UserPlus,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ChapterFormModal } from './ChapterFormModal';

interface Props {
  currentUser: AuthUser | null;
  onSelectAlumnus?: (alumnus: AlumniProfile) => void;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const ChaptersHub: React.FC<Props> = ({ currentUser, onOpenAuth, onSelectAlumnus, onBack }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterMembers, setChapterMembers] = useState<ChapterMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);

  // Alumnus profile for logged in user
  const [myProfile, setMyProfile] = useState<AlumniProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showAdminAssign, setShowAdminAssign] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const loadChapters = async () => {
    setLoading(true);
    try {
      const data = await dataService.getChapters(statusFilter === 'ALL' ? undefined : statusFilter);
      setChapters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProfile = async () => {
    if (currentUser?.alumniId) {
      const p = await dataService.getAlumniById(currentUser.alumniId);
      setMyProfile(p);
    } else if (currentUser?.email) {
      const list = await dataService.getAlumniList();
      const p = list.find(a => a.email.toLowerCase() === currentUser.email.toLowerCase()) || null;
      setMyProfile(p);
    } else {
      setMyProfile(null);
    }
  };

  useEffect(() => {
    loadChapters();
    loadMyProfile();
  }, [statusFilter, currentUser]);

  const loadMembers = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setLoadingMembers(true);
    try {
      const mems = await dataService.getChapterMembers(chapter.id);
      setChapterMembers(mems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleJoinChapter = async (chapter: Chapter) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!myProfile) {
      alert('You must have a verified alumni profile with an official MA. number to join a chapter.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await dataService.joinChapter(chapter.id, myProfile);
      if (res.success) {
        await loadChapters();
        await loadMembers(chapter);
      } else {
        alert(res.error || 'Failed to join chapter');
      }
    } catch (err: any) {
      alert(err.message || 'Error joining chapter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveChapter = async (chapterId: string) => {
    if (!myProfile) return;
    if (!confirm('Are you sure you want to leave this chapter? (Your overall MOSA membership remains active)')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await dataService.leaveChapter(chapterId, myProfile.internalId, currentUser?.email);
      if (res.success) {
        await loadChapters();
        if (selectedChapter) {
          await loadMembers(selectedChapter);
        }
      } else {
        alert(res.error || 'Failed to leave chapter');
      }
    } catch (err: any) {
      alert(err.message || 'Error leaving chapter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter || !newAdminEmail.trim()) return;

    setActionLoading(true);
    try {
      const res = await dataService.assignChapterAdmin(
        selectedChapter.id,
        newAdminEmail.trim(),
        currentUser?.email || 'admin@massh.ac.ug'
      );
      if (res.success) {
        alert(`${newAdminEmail} assigned as chapter administrator!`);
        setNewAdminEmail('');
        setShowAdminAssign(false);
        const updated = await dataService.getChapterById(selectedChapter.id);
        if (updated) setSelectedChapter(updated);
        await loadChapters();
      } else {
        alert(res.error || 'Failed to assign administrator');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning administrator');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredChapters = chapters.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = c.code.toLowerCase().includes(q);
      const matchName = c.name.toLowerCase().includes(q);
      const matchInst = c.institution.toLowerCase().includes(q);
      const matchLoc = `${c.location} ${c.country}`.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchInst && !matchLoc) return false;
    }
    return true;
  });

  const isUserMember = (chapterId: string): boolean => {
    if (!myProfile) return false;
    return chapterMembers.some(m => m.chapterId === chapterId && m.alumniId === myProfile.internalId && m.status === 'ACTIVE');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Explanatory Hero (Conforms to Section 11) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B203E 0%, #163663 100%)',
          borderRadius: '20px',
          padding: '2.25rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(11, 32, 62, 0.2)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
        }}
      >
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'background 0.2s'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #D97706', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: '#FCD34D', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Landmark size={14} /> MOSA University & Institutional Chapters
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '2rem', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
            MOSA Campus & Institutional Network
          </h1>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Uniting former students of <strong>Mandela Secondary School Hoima (MASSH)</strong> across universities and institutions throughout Uganda (e.g. <strong>MUMASA</strong> at Makerere, <strong>KYUMASA</strong> at Kyambogo, <strong>MBUMASA</strong> at MUST, <strong>GUMASA</strong>, and <strong>NKUMASA</strong>).
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#FEF3C7', border: '1px solid rgba(254, 243, 199, 0.2)' }}>
            <ShieldCheck size={16} color="#F59E0B" />
            <span><strong>Key Policy:</strong> An alumnus may belong to any chapter without losing their overall MOSA membership.</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and Create Chapter Button */}
      <div className="mosa-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Tabs */}
          <div className="horizontal-scroll-touch" style={{ display: 'flex', gap: '0.5rem', maxWidth: '100%' }}>
            {[
              { id: 'ACTIVE', label: 'Active Chapters' },
              { id: 'ALL', label: 'All Chapters' },
              { id: 'INACTIVE', label: 'Inactive' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  border: statusFilter === tab.id ? '1px solid #0B203E' : '1px solid #CBD5E1',
                  background: statusFilter === tab.id ? '#0B203E' : '#FFFFFF',
                  color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Controls: Search, Create */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search chapters (e.g. MUMASA, Makerere)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  width: '240px',
                }}
              />
            </div>

            {isAdmin && (
              <button
                className="btn btn-gold"
                onClick={() => {
                  setChapterToEdit(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus size={16} /> Create Chapter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Content (Grid) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Loading MOSA chapters...
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Landmark size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>No Chapters Found</h3>
          <p style={{ color: '#64748B', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            No chapters match your search query. Try clearing filters or create a new chapter if you have administrative privileges.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredChapters.map(chapter => {
            const isChapterAdmin = isAdmin || (currentUser && chapter.adminEmails?.includes(currentUser.email));

            return (
              <div
                key={chapter.id}
                className="mosa-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  borderTop: `4px solid ${chapter.status === 'ACTIVE' ? '#D97706' : '#94A3B8'}`,
                }}
              >
                <div>
                  {/* Top Bar: Chapter Code & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        background: '#0B203E',
                        color: '#FCD34D',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Landmark size={14} /> {chapter.code}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        background: chapter.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9',
                        color: chapter.status === 'ACTIVE' ? '#065F46' : '#64748B',
                        border: `1px solid ${chapter.status === 'ACTIVE' ? '#A7F3D0' : '#CBD5E1'}`,
                      }}
                    >
                      {chapter.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.35rem', lineHeight: '1.3' }}>
                    {chapter.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <Building2 size={15} color="#D97706" />
                    <strong>{chapter.institution}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} />
                    <span>{chapter.location}, {chapter.country}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chapter.description}
                  </p>

                  {/* Leader info */}
                  {chapter.leaderName && (
                    <div style={{ background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                      <span style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Coordinator:</span>
                      <div style={{ fontWeight: 700, color: '#0B203E' }}>
                        {chapter.leaderName} {chapter.leaderContact ? `(${chapter.leaderContact})` : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Bar: Members count & Actions */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#0B203E', fontWeight: 700 }}>
                    <Users size={16} color="#059669" />
                    <span>{chapter.memberCount} Members</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isChapterAdmin && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setChapterToEdit(chapter);
                          setIsFormOpen(true);
                        }}
                        title="Edit Chapter Details"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    )}

                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => loadMembers(chapter)}
                    >
                      View Chapter <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHAPTER DETAILS & MEMBERS ROSTER DRAWER */}
      {selectedChapter && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header" style={{ background: '#0B203E', color: '#ffffff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ background: '#F59E0B', color: '#0B203E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem' }}>
                    {selectedChapter.code}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                    {selectedChapter.institution}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                  {selectedChapter.name}
                </h3>
              </div>
              <button onClick={() => setSelectedChapter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Chapter Overview Box */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', background: '#F8FAFC' }}>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                  {selectedChapter.description}
                </div>

                <div className="grid-2" style={{ fontSize: '0.8rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <div><span style={{ color: '#64748B' }}>Location:</span> <strong>{selectedChapter.location}, {selectedChapter.country}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Status:</span> <strong style={{ color: selectedChapter.status === 'ACTIVE' ? '#059669' : '#64748B' }}>{selectedChapter.status}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Coordinator:</span> <strong>{selectedChapter.leaderName || 'Not designated'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Chapter Administrators:</span> <strong>{selectedChapter.adminEmails?.join(', ') || 'MOSA Central Admin'}</strong></div>
                </div>
              </div>

              {/* Membership Action Bar for Alumnus */}
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>
                    Join the {selectedChapter.code} Chapter
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                    Joining connects you with fellow MASSH alumni at {selectedChapter.institution}. Your overall MOSA membership remains unaffected.
                  </div>
                </div>

                <div>
                  {isUserMember(selectedChapter.id) ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleLeaveChapter(selectedChapter.id)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.8rem', color: '#DC2626' }}
                    >
                      <LogOut size={14} /> Leave Chapter
                    </button>
                  ) : (
                    <button
                      className="btn btn-emerald"
                      onClick={() => handleJoinChapter(selectedChapter)}
                      disabled={actionLoading}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <UserPlus size={15} /> Join This Chapter
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Member Roster */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#0B203E', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={17} color="#059669" /> Chapter Member Roster ({chapterMembers.length})
                  </h4>

                  {isAdmin && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => setShowAdminAssign(!showAdminAssign)}
                    >
                      + Assign Chapter Admin
                    </button>
                  )}
                </div>

                {/* Form to assign chapter admin */}
                {showAdminAssign && (
                  <form onSubmit={handleAssignAdmin} style={{ background: '#F1F5F9', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="email"
                      required
                      placeholder="Admin email to designate (e.g. member@massh.ac.ug)..."
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} disabled={actionLoading}>
                      Assign
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowAdminAssign(false)}>
                      Cancel
                    </button>
                  </form>
                )}

                {loadingMembers ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Loading chapter roster...</div>
                ) : chapterMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem' }}>
                    No alumni have officially joined this chapter yet. Be the first to join!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {chapterMembers.map(member => (
                      <div
                        key={member.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="alumni-no-pill" style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem' }}>
                            <Award size={12} /> {member.alumniNumber}
                          </span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.9rem' }}>
                              {member.alumniName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Joined: {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: member.roleInChapter === 'LEADER' ? '#FEF3C7' : '#EFF6FF',
                            color: member.roleInChapter === 'LEADER' ? '#B45309' : '#1E40AF',
                          }}
                        >
                          {member.roleInChapter}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedChapter(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CHAPTER MODAL */}
      <ChapterFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        chapterToEdit={chapterToEdit}
        adminEmail={currentUser?.email || 'admin@massh.ac.ug'}
        onSuccess={loadChapters}
      />
    </div>
  );
};
