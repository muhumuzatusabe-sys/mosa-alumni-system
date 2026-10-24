import React, { useState, useEffect } from 'react';
import { 
  Announcement, 
  AnnouncementCategory, 
  AudienceScope, 
  AuthUser, 
  Chapter 
} from '../types';
import { dataService } from '../services/dataService';
import { 
  Megaphone, 
  Search, 
  Filter, 
  Pin, 
  Calendar, 
  Eye, 
  Send, 
  Plus, 
  Mail, 
  Smartphone, 
  Globe, 
  Award, 
  BookOpen, 
  FileText, 
  Heart, 
  Building2,
  Trash2,
  Edit3,
  ArrowLeft
} from 'lucide-react';
import { AnnouncementDetailsModal } from './AnnouncementDetailsModal';
import { AnnouncementFormModal } from './AnnouncementFormModal';
import { BroadcastDesk } from './BroadcastDesk';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const CommunicationsHub: React.FC<Props> = ({ currentUser, onOpenAuth, onBack }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Main Hub Tabs
  const [mainTab, setMainTab] = useState<'CIRCULARS' | 'OUTBOUND'>('CIRCULARS');

  // Modals
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CHAPTER_ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [annList, chapList] = await Promise.all([
        dataService.getAnnouncements(
          selectedCategory === 'ALL' ? undefined : (selectedCategory as AnnouncementCategory),
          selectedScope === 'ALL' ? undefined : (selectedScope as AudienceScope)
        ),
        dataService.getChapters(),
      ]);
      setAnnouncements(annList);
      setChapters(chapList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedScope]);

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await dataService.togglePinAnnouncement(id, !currentPinned, currentUser?.email || 'admin@massh.ac.ug');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this broadcast announcement?')) {
      await dataService.deleteAnnouncement(id, currentUser?.email || 'admin@massh.ac.ug');
      loadData();
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = a.content.toLowerCase().includes(q);
      const matchAuthor = a.authorName.toLowerCase().includes(q);
      return matchTitle || matchContent || matchAuthor;
    }
    return true;
  });

  const pinnedAnnouncement = announcements.find(a => a.isPinned);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'CIRCULAR': return { bg: '#FEF3C7', color: '#92400E', label: 'Official Circular' };
      case 'NEWSLETTER': return { bg: '#EFF6FF', color: '#1E40AF', label: 'Newsletter' };
      case 'EVENT_ALERT': return { bg: '#ECFDF5', color: '#065F46', label: 'Event Alert' };
      case 'OBITUARY': return { bg: '#F1F5F9', color: '#475569', label: 'Obituary / Condolence' };
      case 'ACADEMIC_EXCELLENCE': return { bg: '#FAF5FF', color: '#6B21A8', label: 'Academic Excellence' };
      default: return { bg: '#F8FAFC', color: '#334155', label: 'Notice' };
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 60%, #18533B 100%)', 
        borderRadius: '16px', 
        padding: '2rem', 
        color: '#FFFFFF',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(10, 39, 27, 0.3)'
      }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ 
                background: 'rgba(217, 119, 6, 0.2)', 
                color: '#FBBF24', 
                padding: '4px 10px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                border: '1px solid rgba(217, 119, 6, 0.4)'
              }}>
                MOSA COMMUNICATIONS HUB
              </span>
              <span style={{ color: '#93C5FD', fontSize: '0.8rem' }}>Mandela Secondary School Hoima • Est. 1997</span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Broadcast Circulars & School Announcements
            </h1>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '640px', lineHeight: '1.5' }}>
              The authoritative voice of Mandela Old Students Association. Official AGM circulars, pioneer alumni newsletters, university chapter bulletins, and welfare notices.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => { setAnnouncementToEdit(null); setIsFormOpen(true); }}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#D97706', borderColor: '#D97706' }}
            >
              <Plus size={18} /> Compose Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Communications Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setMainTab('CIRCULARS')}
          style={{
            background: mainTab === 'CIRCULARS' ? '#0B203E' : '#F1F5F9',
            color: mainTab === 'CIRCULARS' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '0.75rem 1.4rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: mainTab === 'CIRCULARS' ? '0 2px 6px rgba(11,32,62,0.2)' : 'none'
          }}
        >
          <Megaphone size={18} color={mainTab === 'CIRCULARS' ? '#F59E0B' : '#64748B'} />
          Official Circulars & Notices ({announcements.length})
        </button>

        <button
          onClick={() => setMainTab('OUTBOUND')}
          style={{
            background: mainTab === 'OUTBOUND' ? '#0B203E' : '#F1F5F9',
            color: mainTab === 'OUTBOUND' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '0.75rem 1.4rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: mainTab === 'OUTBOUND' ? '0 2px 6px rgba(11,32,62,0.2)' : 'none'
          }}
        >
          <Smartphone size={18} color={mainTab === 'OUTBOUND' ? '#F59E0B' : '#64748B'} />
          Outbound Broadcasts (Bulk SMS, WhatsApp, Email)
        </button>
      </div>

      {mainTab === 'OUTBOUND' ? (
        <BroadcastDesk currentUser={currentUser} onOpenAuth={onOpenAuth} />
      ) : (
        <>
          {/* Featured Pinned Circular Hero */}
          {pinnedAnnouncement && (
        <div 
          onClick={() => setSelectedAnnouncement(pinnedAnnouncement)}
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '2px solid #FCD34D',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <Pin size={16} /> FEATURED PINNED CIRCULAR
          </div>
          <h2 style={{ fontSize: '1.35rem', color: '#78350F', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
            {pinnedAnnouncement.title}
          </h2>
          <p style={{ color: '#92400E', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem 0', maxWidth: '800px' }}>
            {pinnedAnnouncement.summary || pinnedAnnouncement.content.slice(0, 200) + '...'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#B45309' }}>
            <div>
              By <strong>{pinnedAnnouncement.authorName}</strong> ({pinnedAnnouncement.authorRole}) • {new Date(pinnedAnnouncement.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Read Full Circular</span> &rarr;
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search announcements by title or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', width: '280px' }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Categories</option>
            <option value="CIRCULAR">Official Circulars</option>
            <option value="NEWSLETTER">Newsletters</option>
            <option value="EVENT_ALERT">Event Alerts</option>
            <option value="WELFARE_NOTICE">Welfare & Support</option>
            <option value="ACADEMIC_EXCELLENCE">Academic Excellence</option>
            <option value="OBITUARY">Obituaries</option>
          </select>

          <select
            value={selectedScope}
            onChange={e => setSelectedScope(e.target.value)}
            style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Audiences</option>
            <option value="ALL_ALUMNI">Schoolwide (All Alumni)</option>
            <option value="CHAPTER_ONLY">University Chapters</option>
            <option value="ACTIVE_MEMBERS_ONLY">Active Dues Members</option>
            <option value="COHORT_RANGE">Specific Cohort</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
          Showing <strong>{filteredAnnouncements.length}</strong> announcements
        </div>
      </div>

      {/* Announcements Feed Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748B' }}>
          Loading MOSA broadcast circulars...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
          <Megaphone size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#0B203E', marginBottom: '0.5rem' }}>No Announcements Match Your Filter</h3>
          <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem' }}>
            Try resetting your search query or selecting a different announcement category.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredAnnouncements.map(item => {
            const badge = getCategoryBadge(item.category);

            return (
              <div 
                key={item.id} 
                className="mosa-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden', 
                  padding: 0,
                  position: 'relative' 
                }}
              >
                {/* Cover Image if present */}
                {item.coverImage && (
                  <div style={{ height: '160px', background: '#0B203E', overflow: 'hidden' }}>
                    <img 
                      src={item.coverImage} 
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category & Pin Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ 
                      background: badge.bg, 
                      color: badge.color, 
                      padding: '3px 8px', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {badge.label}
                    </span>

                    {item.isPinned && (
                      <span style={{ color: '#D97706', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => setSelectedAnnouncement(item)}
                    style={{ 
                      fontSize: '1.15rem', 
                      color: '#0B203E', 
                      fontWeight: 700, 
                      margin: '0 0 0.5rem 0',
                      cursor: 'pointer',
                      lineHeight: '1.4' 
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Excerpt */}
                  <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 1rem 0', flex: 1 }}>
                    {item.summary || item.content.slice(0, 130) + '...'}
                  </p>

                  {/* Channel dispatch icons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Published on Web Portal Feed">
                      <Globe size={13} color="#059669" /> Portal
                    </div>
                    {item.smsRecipientsCount ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`Dispatched via SMS to ${item.smsRecipientsCount} alumni`}>
                        <Smartphone size={13} color="#D97706" /> SMS ({item.smsRecipientsCount})
                      </div>
                    ) : null}
                    {item.emailRecipientsCount ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`Emailed to ${item.emailRecipientsCount} inboxes`}>
                        <Mail size={13} color="#2563EB" /> Email ({item.emailRecipientsCount})
                      </div>
                    ) : null}
                  </div>

                  {/* Author & Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B', marginTop: 'auto' }}>
                    <div>
                      <strong style={{ color: '#334155' }}>{item.authorName}</strong>
                      <div style={{ fontSize: '0.7rem' }}>{new Date(item.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => setSelectedAnnouncement(item)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      >
                        Read Full
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleTogglePin(item.id, item.isPinned)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', color: item.isPinned ? '#D97706' : '#64748B' }}
                            title={item.isPinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            onClick={() => { setAnnouncementToEdit(item); setIsFormOpen(true); }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px' }}
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 6px', color: '#DC2626' }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Modals */}
      <AnnouncementDetailsModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />

      <AnnouncementFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setAnnouncementToEdit(null); }}
        chapters={chapters}
        announcementToEdit={announcementToEdit}
        adminEmail={currentUser?.email || 'admin@massh.ac.ug'}
        onSuccess={loadData}
      />
    </div>
  );
};
