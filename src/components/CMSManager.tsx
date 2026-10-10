import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Home, 
  BookOpen, 
  Award, 
  Users, 
  Megaphone, 
  Calendar, 
  Image as ImageIcon, 
  Mail, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { 
  WebsiteContent, 
  AuthUser, 
  Announcement, 
  MOSAEvent, 
  CampusPhoto, 
  AboutMilestone, 
  ExecutiveLeader, 
  MembershipTier, 
  FaqItem,
  PhotoCategory
} from '../types';
import { dataService } from '../services/dataService';

interface CMSManagerProps {
  currentUser: AuthUser;
  onRefreshPortal?: () => void;
}

export const CMSManager: React.FC<CMSManagerProps> = ({ currentUser, onRefreshPortal }) => {
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'membership' | 'directory' | 'news' | 'events' | 'gallery' | 'contact'>('home');
  const [cmsContent, setCmsContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // News State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> | null>(null);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);

  // Events State
  const [events, setEvents] = useState<MOSAEvent[]>([]);
  const [editingEvt, setEditingEvt] = useState<Partial<MOSAEvent> | null>(null);
  const [isEvtModalOpen, setIsEvtModalOpen] = useState(false);

  // Gallery State
  const [photos, setPhotos] = useState<CampusPhoto[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<Partial<CampusPhoto> | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Milestone Modal State
  const [editingMilestone, setEditingMilestone] = useState<{ index: number; data: AboutMilestone } | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  // Leader Modal State
  const [editingLeader, setEditingLeader] = useState<{ index: number; data: ExecutiveLeader } | null>(null);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);

  // Tier Modal State
  const [editingTier, setEditingTier] = useState<{ index: number; data: MembershipTier } | null>(null);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // FAQ Modal State
  const [editingFaq, setEditingFaq] = useState<{ index: number; data: FaqItem } | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  useEffect(() => {
    loadAllCMSData();
  }, []);

  const loadAllCMSData = async () => {
    setLoading(true);
    try {
      const [content, annList, evtList, photoList] = await Promise.all([
        dataService.getWebsiteContent(),
        dataService.getAnnouncements(),
        dataService.getEvents(),
        dataService.getCampusPhotos(),
      ]);
      setCmsContent(content);
      setAnnouncements(annList);
      setEvents(evtList);
      setPhotos(photoList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load CMS content');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleSaveSection = async (section: keyof WebsiteContent) => {
    if (!cmsContent) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      const updated = await dataService.updateWebsiteContent(
        { [section]: cmsContent[section] },
        currentUser.email
      );
      setCmsContent(updated);
      showSuccess(`Successfully saved updates to ${section.toUpperCase()} page!`);
      if (onRefreshPortal) onRefreshPortal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save updates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSection = async (section: keyof WebsiteContent) => {
    if (!window.confirm(`Are you sure you want to reset the ${section.toUpperCase()} page content back to the default institutional template?`)) {
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const updated = await dataService.resetWebsiteContent(section, currentUser.email);
      setCmsContent(updated);
      showSuccess(`Successfully reset ${section.toUpperCase()} page back to default content!`);
      if (onRefreshPortal) onRefreshPortal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset content');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // NEWS / ANNOUNCEMENTS ACTIONS
  // -------------------------------------------------------------
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn?.title || !editingAnn?.content) return;
    setIsSaving(true);
    try {
      if (editingAnn.id) {
        await dataService.updateAnnouncement(editingAnn.id, editingAnn, currentUser.email);
        showSuccess('Announcement updated successfully.');
      } else {
        await dataService.createAnnouncement({
          title: editingAnn.title,
          content: editingAnn.content,
          summary: editingAnn.summary,
          category: editingAnn.category || 'GENERAL',
          audienceScope: editingAnn.audienceScope || 'ALL_ALUMNI',
          isPinned: !!editingAnn.isPinned,
          coverImage: editingAnn.coverImage,
          channels: editingAnn.channels || ['PORTAL_FEED'],
          authorName: currentUser.displayName,
          authorRole: currentUser.role,
          publishedBy: currentUser.email,
        }, currentUser.email);
        showSuccess('New announcement published successfully.');
      }
      setIsAnnModalOpen(false);
      setEditingAnn(null);
      const updated = await dataService.getAnnouncements();
      setAnnouncements(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save announcement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await dataService.deleteAnnouncement(id, currentUser.email);
      showSuccess('Announcement deleted.');
      const updated = await dataService.getAnnouncements();
      setAnnouncements(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete announcement');
    }
  };

  // -------------------------------------------------------------
  // EVENTS ACTIONS
  // -------------------------------------------------------------
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvt?.title || !editingEvt?.date || !editingEvt?.venue) return;
    setIsSaving(true);
    try {
      if (editingEvt.id) {
        await dataService.updateEvent(editingEvt.id, editingEvt, currentUser.email);
        showSuccess('Event updated successfully.');
      } else {
        await dataService.createEvent({
          title: editingEvt.title,
          description: editingEvt.description || '',
          eventType: editingEvt.eventType || 'ANNUAL_CONVENTION',
          date: editingEvt.date,
          startTime: editingEvt.startTime || '14:00',
          endTime: editingEvt.endTime || '18:00',
          venue: editingEvt.venue,
          registrationRequirement: editingEvt.registrationRequirement || 'OPEN',
          status: editingEvt.status || 'UPCOMING',
          eventImage: editingEvt.eventImage,
          createdBy: currentUser.email,
        }, currentUser.email);
        showSuccess('New event scheduled and published.');
      }
      setIsEvtModalOpen(false);
      setEditingEvt(null);
      const updated = await dataService.getEvents();
      setEvents(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await dataService.deleteEvent(id, currentUser.email);
      showSuccess('Event removed.');
      const updated = await dataService.getEvents();
      setEvents(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete event');
    }
  };

  // -------------------------------------------------------------
  // GALLERY ACTIONS
  // -------------------------------------------------------------
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto?.title || !editingPhoto?.imageUrl) return;
    setIsSaving(true);
    try {
      if (editingPhoto.id) {
        await dataService.updateCampusPhoto(editingPhoto.id, editingPhoto);
        showSuccess('Photo details updated.');
      } else {
        await dataService.addCampusPhoto({
          title: editingPhoto.title,
          caption: editingPhoto.caption || '',
          category: (editingPhoto.category as PhotoCategory) || 'ACADEMICS',
          imageUrl: editingPhoto.imageUrl,
          date: editingPhoto.date || new Date().toISOString().split('T')[0],
          location: editingPhoto.location || 'MASSH Campus, Hoima',
          featured: !!editingPhoto.featured,
          uploadedBy: currentUser.email,
        });
        showSuccess('New photo added to the Heritage Gallery.');
      }
      setIsPhotoModalOpen(false);
      setEditingPhoto(null);
      const updated = await dataService.getCampusPhotos();
      setPhotos(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      await dataService.deleteCampusPhoto(id);
      showSuccess('Photo deleted.');
      const updated = await dataService.getCampusPhotos();
      setPhotos(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete photo');
    }
  };

  if (loading || !cmsContent) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem auto' }} />
        <p>Loading Website Content Management System...</p>
      </div>
    );
  }

  const sections = [
    { key: 'home', label: 'Home Page', icon: Home },
    { key: 'about', label: 'About & History', icon: BookOpen },
    { key: 'membership', label: 'Membership', icon: Award },
    { key: 'directory', label: 'Directory', icon: Users },
    { key: 'news', label: 'News / Articles', icon: Megaphone },
    { key: 'events', label: 'Events & Reunions', icon: Calendar },
    { key: 'gallery', label: 'Campus Gallery', icon: ImageIcon },
    { key: 'contact', label: 'Contact & FAQs', icon: Mail },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D97706', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <Sparkles size={16} /> Content Management System (CMS)
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#0B203E', margin: 0 }}>
            Live Website Content Editor
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0.25rem 0 0 0' }}>
            Modify text, headlines, historical milestones, executive members, tiers, news, and events across the entire public platform.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#FEF2F2', border: '1.5px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <AlertCircle size={18} color="#EF4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => setActiveSection(sec.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0B203E' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} color={isActive ? '#FBBF24' : '#64748B'} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. HOME PAGE EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'home' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Home Page Contents</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Configure hero banner texts, highlighted phrases, and executive welcome messages.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleResetSection('home')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveSection('home')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Home Page'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Top Badge / Eyebrow Text</label>
              <input
                type="text"
                className="form-control"
                value={cmsContent.home.badgeText}
                onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, badgeText: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hero Main Headline</label>
              <input
                type="text"
                className="form-control"
                value={cmsContent.home.heroTitle}
                onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, heroTitle: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hero Highlight Word (Colored Gold)</label>
              <input
                type="text"
                className="form-control"
                value={cmsContent.home.heroHighlightWord}
                onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, heroHighlightWord: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hero Subtitle & Introduction</label>
              <textarea
                className="form-control"
                rows={3}
                value={cmsContent.home.heroSubtitle}
                onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, heroSubtitle: e.target.value } })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Heritage Metric Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.home.statsHeritageText}
                  onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, statsHeritageText: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heritage Metric Label</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.home.statsHeritageSub}
                  onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, statsHeritageSub: e.target.value } })}
                />
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '1rem' }}>Executive Committee Message</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Message Header</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cmsContent.home.welcomeTitle}
                    onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, welcomeTitle: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Quote Headline</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cmsContent.home.welcomeHeadline}
                    onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, welcomeHeadline: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Body</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={cmsContent.home.welcomeBody}
                    onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, welcomeBody: e.target.value } })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Author Attribution</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cmsContent.home.welcomeAuthor}
                      onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, welcomeAuthor: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location Sub-title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cmsContent.home.welcomeLocation}
                      onChange={e => setCmsContent({ ...cmsContent, home: { ...cmsContent.home, welcomeLocation: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ABOUT PAGE EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'about' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>About Page & School Heritage</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Edit school profile, motto, milestone timeline, and executive leadership roster.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleResetSection('about')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveSection('about')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save About Page'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Eyebrow Tagline</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.about.tagline}
                  onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, tagline: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Page Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.about.title}
                  onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, title: e.target.value } })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subtitle Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={cmsContent.about.subtitle}
                onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, subtitle: e.target.value } })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Official School Motto</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.about.motto}
                  onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, motto: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Official Colours</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.about.colors}
                  onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, colors: e.target.value } })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alma Mater Profile Narrative (Paragraph 1)</label>
              <textarea
                className="form-control"
                rows={3}
                value={cmsContent.about.profileParagraph1}
                onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, profileParagraph1: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alma Mater Profile Narrative (Paragraph 2)</label>
              <textarea
                className="form-control"
                rows={3}
                value={cmsContent.about.profileParagraph2}
                onChange={e => setCmsContent({ ...cmsContent, about: { ...cmsContent.about, profileParagraph2: e.target.value } })}
              />
            </div>

            {/* Milestones Timeline Manager */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: 0 }}>Historical Milestones ({cmsContent.about.milestones.length})</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingMilestone({ index: -1, data: { year: `${new Date().getFullYear()}`, title: '', description: '' } });
                    setIsMilestoneModalOpen(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  <Plus size={14} /> Add Milestone
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {cmsContent.about.milestones.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 800, color: '#D97706', fontSize: '0.95rem', minWidth: '48px' }}>{m.year}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.9rem' }}>{m.title}</div>
                        <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.15rem' }}>{m.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMilestone({ index: idx, data: { ...m } });
                          setIsMilestoneModalOpen(true);
                        }}
                        style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Edit Milestone"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...cmsContent.about.milestones];
                          updated.splice(idx, 1);
                          setCmsContent({ ...cmsContent, about: { ...cmsContent.about, milestones: updated } });
                        }}
                        style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete Milestone"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Leaders Manager */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: 0 }}>Executive Committee Leaders ({cmsContent.about.leaders.length})</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingLeader({ index: -1, data: { role: '', name: '', cohort: '', profession: '' } });
                    setIsLeaderModalOpen(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  <Plus size={14} /> Add Leader
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {cmsContent.about.leaders.map((leader, idx) => (
                  <div key={idx} style={{ background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>{leader.role}</div>
                      <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.92rem', marginTop: '0.2rem' }}>{leader.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{leader.cohort}</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginTop: '0.15rem' }}>{leader.profession}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLeader({ index: idx, data: { ...leader } });
                          setIsLeaderModalOpen(true);
                        }}
                        style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Edit Leader"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...cmsContent.about.leaders];
                          updated.splice(idx, 1);
                          setCmsContent({ ...cmsContent, about: { ...cmsContent.about, leaders: updated } });
                        }}
                        style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete Leader"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MEMBERSHIP STRUCTURE EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'membership' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Membership Structure & Tiers</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Configure membership numbering explanations, official badges, and benefits lists.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleResetSection('membership')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveSection('membership')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Membership Page'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Eyebrow Tagline</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.membership.tagline}
                  onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, tagline: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Main Header</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.membership.title}
                  onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, title: e.target.value } })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subtitle Text</label>
              <textarea
                className="form-control"
                rows={2}
                value={cmsContent.membership.subtitle}
                onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, subtitle: e.target.value } })}
              />
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '0.75rem' }}>Numbering System Explainer</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Explainer Headline</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cmsContent.membership.explainerTitle}
                    onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, explainerTitle: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sample Display Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cmsContent.membership.sampleNumber}
                    onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, sampleNumber: e.target.value } })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Explainer Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={cmsContent.membership.explainerBody}
                  onChange={e => setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, explainerBody: e.target.value } })}
                />
              </div>
            </div>

            {/* Membership Tiers List */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: 0 }}>Membership Tiers ({cmsContent.membership.tiers.length})</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingTier({ index: -1, data: { title: '', target: '', description: '', badge: 'NEW', benefits: [] } });
                    setIsTierModalOpen(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  <Plus size={14} /> Add Tier
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {cmsContent.membership.tiers.map((tier, idx) => (
                  <div key={idx} style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {tier.badge}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTier({ index: idx, data: { ...tier, benefits: [...tier.benefits] } });
                              setIsTierModalOpen(true);
                            }}
                            style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Edit Tier"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...cmsContent.membership.tiers];
                              updated.splice(idx, 1);
                              setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, tiers: updated } });
                            }}
                            style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Delete Tier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h5 style={{ fontSize: '1.05rem', color: '#0B203E', margin: '0 0 0.25rem 0' }}>{tier.title}</h5>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '0.5rem' }}>{tier.target}</div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.45', marginBottom: '0.75rem' }}>{tier.description}</p>
                      
                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>Benefits ({tier.benefits.length}):</div>
                        <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                          {tier.benefits.slice(0, 3).map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                          {tier.benefits.length > 3 && (
                            <li style={{ color: '#D97706', fontWeight: 600 }}>+{tier.benefits.length - 3} more benefits</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DIRECTORY PAGE EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'directory' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Alumni Directory Banner</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Customize the top welcome headline, tagline, and greeting on the alumni directory.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleResetSection('directory')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveSection('directory')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Directory Content'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Top Ribbon Tagline</label>
              <input
                type="text"
                className="form-control"
                value={cmsContent.directory.tagline}
                onChange={e => setCmsContent({ ...cmsContent, directory: { ...cmsContent.directory, tagline: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Directory Welcome Headline</label>
              <input
                type="text"
                className="form-control"
                value={cmsContent.directory.title}
                onChange={e => setCmsContent({ ...cmsContent, directory: { ...cmsContent.directory, title: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Introductory Description</label>
              <textarea
                className="form-control"
                rows={4}
                value={cmsContent.directory.description}
                onChange={e => setCmsContent({ ...cmsContent, directory: { ...cmsContent.directory, description: e.target.value } })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. NEWS & ANNOUNCEMENTS MANAGER */}
      {/* ========================================================= */}
      {activeSection === 'news' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>News & Announcements Manager</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Create, update, or remove articles and circulars displayed on the News hub.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingAnn({
                  title: '',
                  summary: '',
                  content: '',
                  category: 'GENERAL',
                  audienceScope: 'ALL_ALUMNI',
                  isPinned: false,
                  channels: ['PORTAL_FEED'],
                });
                setIsAnnModalOpen(true);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Publish New Article</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {announcements.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No announcements published.</p>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {ann.category}
                      </span>
                      {ann.isPinned && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          PINNED
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {new Date(ann.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ann.title}
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0.25rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ann.summary || ann.content}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingAnn({ ...ann });
                        setIsAnnModalOpen(true);
                      }}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EVENTS & REUNIONS MANAGER */}
      {/* ========================================================= */}
      {activeSection === 'events' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Events & Reunions Manager</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Schedule, reschedule, or cancel conventions, galas, and webinars.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingEvt({
                  title: '',
                  description: '',
                  eventType: 'ANNUAL_CONVENTION',
                  date: new Date().toISOString().split('T')[0],
                  startTime: '10:00',
                  endTime: '17:00',
                  venue: 'MASSH Campus Hall, Hoima',
                  registrationRequirement: 'OPEN',
                  status: 'UPCOMING',
                });
                setIsEvtModalOpen(true);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Create New Event</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>No events scheduled.</p>
            ) : (
              events.map(evt => (
                <div key={evt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {evt.eventType}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: evt.status === 'UPCOMING' ? '#059669' : '#64748B', background: evt.status === 'UPCOMING' ? '#D1FAE5' : '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {evt.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {evt.date} ({evt.startTime} - {evt.endTime})
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                      {evt.title}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      Venue: <strong>{evt.venue}</strong> • Registered: <strong>{evt.registeredCount}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingEvt({ ...evt });
                        setIsEvtModalOpen(true);
                      }}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.id)}
                      style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. CAMPUS HERITAGE GALLERY MANAGER */}
      {/* ========================================================= */}
      {activeSection === 'gallery' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Campus Heritage Gallery Manager</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Add, edit captions, or remove commemorative photographs.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingPhoto({
                  title: '',
                  caption: '',
                  category: 'ACADEMICS',
                  imageUrl: '',
                  date: new Date().toISOString().split('T')[0],
                  location: 'MASSH Main Campus, Hoima',
                  featured: false,
                });
                setIsPhotoModalOpen(true);
              }}
              style={{ fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>Add Photograph</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {photos.map(p => (
              <div key={p.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                />
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D97706', marginBottom: '0.25rem' }}>{p.category}</div>
                    <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.9rem', marginBottom: '0.4rem' }}>{p.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: '1.4' }}>{p.caption}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingPhoto({ ...p });
                        setIsPhotoModalOpen(true);
                      }}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. CONTACT & FAQS EDITOR */}
      {/* ========================================================= */}
      {activeSection === 'contact' && (
        <div className="mosa-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Secretariat Contact Details & FAQs</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>Update physical campus office location, official hotline phones, and FAQ answers.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleResetSection('contact')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveSection('contact')}
                disabled={isSaving}
                style={{ fontSize: '0.85rem' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Save Contact Info'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Campus Physical Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={cmsContent.contact.campusAddress}
                onChange={e => setCmsContent({ ...cmsContent, contact: { ...cmsContent.contact, campusAddress: e.target.value } })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Postal P.O. Box</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.contact.poBox}
                  onChange={e => setCmsContent({ ...cmsContent, contact: { ...cmsContent.contact, poBox: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Secretariat Working Hours</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.contact.workingHours}
                  onChange={e => setCmsContent({ ...cmsContent, contact: { ...cmsContent.contact, workingHours: e.target.value } })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone Numbers (Comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.contact.phoneNumbers.join(', ')}
                  onChange={e => setCmsContent({
                    ...cmsContent,
                    contact: {
                      ...cmsContent.contact,
                      phoneNumbers: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    }
                  })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Official Emails (Comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsContent.contact.emails.join(', ')}
                  onChange={e => setCmsContent({
                    ...cmsContent,
                    contact: {
                      ...cmsContent.contact,
                      emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    }
                  })}
                />
              </div>
            </div>

            {/* FAQs Manager */}
            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: 0 }}>Frequently Asked Questions ({cmsContent.contact.faqs.length})</h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingFaq({ index: -1, data: { q: '', a: '' } });
                    setIsFaqModalOpen(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  <Plus size={14} /> Add FAQ
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {cmsContent.contact.faqs.map((faq, idx) => (
                  <div key={idx} style={{ background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.9rem' }}>Q: {faq.q}</div>
                      <div style={{ color: '#64748B', fontSize: '0.82rem', marginTop: '0.25rem', lineHeight: '1.45' }}>A: {faq.a}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFaq({ index: idx, data: { ...faq } });
                          setIsFaqModalOpen(true);
                        }}
                        style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Edit FAQ"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...cmsContent.contact.faqs];
                          updated.splice(idx, 1);
                          setCmsContent({ ...cmsContent, contact: { ...cmsContent.contact, faqs: updated } });
                        }}
                        style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete FAQ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Announcement Modal */}
      {isAnnModalOpen && editingAnn && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingAnn.id ? 'Edit Announcement' : 'Publish New Announcement'}
              </h3>
              <button onClick={() => setIsAnnModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Title</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingAnn.title || ''}
                  onChange={e => setEditingAnn({ ...editingAnn, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={editingAnn.category || 'GENERAL'}
                    onChange={e => setEditingAnn({ ...editingAnn, category: e.target.value as any })}
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="CIRCULAR">CIRCULAR</option>
                    <option value="NEWSLETTER">NEWSLETTER</option>
                    <option value="EVENT_ALERT">EVENT_ALERT</option>
                    <option value="WELFARE_NOTICE">WELFARE_NOTICE</option>
                    <option value="ACADEMIC_EXCELLENCE">ACADEMIC_EXCELLENCE</option>
                    <option value="OBITUARY">OBITUARY</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pin Announcement</label>
                  <select
                    className="form-control"
                    value={editingAnn.isPinned ? 'true' : 'false'}
                    onChange={e => setEditingAnn({ ...editingAnn, isPinned: e.target.value === 'true' })}
                  >
                    <option value="false">Standard Feed</option>
                    <option value="true">Pinned to Top</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Summary / Excerpt</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingAnn.summary || ''}
                  onChange={e => setEditingAnn({ ...editingAnn, summary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Full Article Content</label>
                <textarea
                  className="form-control"
                  rows={5}
                  required
                  value={editingAnn.content || ''}
                  onChange={e => setEditingAnn({ ...editingAnn, content: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAnnModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {isEvtModalOpen && editingEvt && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingEvt.id ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={() => setIsEvtModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingEvt.title || ''}
                  onChange={e => setEditingEvt({ ...editingEvt, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label required">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={editingEvt.date || ''}
                    onChange={e => setEditingEvt({ ...editingEvt, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-control"
                    value={editingEvt.eventType || 'ANNUAL_CONVENTION'}
                    onChange={e => setEditingEvt({ ...editingEvt, eventType: e.target.value as any })}
                  >
                    <option value="ANNUAL_CONVENTION">Annual Convention</option>
                    <option value="REUNION">Reunion</option>
                    <option value="GENERAL_MEETING">General Meeting / AGM</option>
                    <option value="CAREER">Career & Mentorship</option>
                    <option value="FUNDRAISING">Fundraising</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingEvt.startTime || '14:00'}
                    onChange={e => setEditingEvt({ ...editingEvt, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingEvt.endTime || '18:00'}
                    onChange={e => setEditingEvt({ ...editingEvt, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Venue</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingEvt.venue || ''}
                  onChange={e => setEditingEvt({ ...editingEvt, venue: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editingEvt.description || ''}
                  onChange={e => setEditingEvt({ ...editingEvt, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEvtModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && editingPhoto && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingPhoto.id ? 'Edit Photo Details' : 'Add Heritage Photograph'}
              </h3>
              <button onClick={() => setIsPhotoModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePhoto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Photograph Title</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingPhoto.title || ''}
                  onChange={e => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Image URL or Path</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="/images/photo.jpg or https://..."
                  value={editingPhoto.imageUrl || ''}
                  onChange={e => setEditingPhoto({ ...editingPhoto, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={editingPhoto.category || 'ACADEMICS'}
                    onChange={e => setEditingPhoto({ ...editingPhoto, category: e.target.value as any })}
                  >
                    <option value="FOUNDATION">Foundation</option>
                    <option value="ACADEMICS">Academics & Science</option>
                    <option value="CAMPUS_LIFE">Campus Life & Sports</option>
                    <option value="VIP_VISIT">VIP Visits</option>
                    <option value="ALUMNI_COMMUNITY">Alumni Community</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingPhoto.location || ''}
                    onChange={e => setEditingPhoto({ ...editingPhoto, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Caption / Historical Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editingPhoto.caption || ''}
                  onChange={e => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPhotoModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Photograph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {isMilestoneModalOpen && editingMilestone && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingMilestone.index >= 0 ? 'Edit Milestone' : 'Add Historical Milestone'}
              </h3>
              <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const updated = [...cmsContent.about.milestones];
              if (editingMilestone.index >= 0) {
                updated[editingMilestone.index] = editingMilestone.data;
              } else {
                updated.push(editingMilestone.data);
              }
              setCmsContent({ ...cmsContent, about: { ...cmsContent.about, milestones: updated } });
              setIsMilestoneModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Year</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingMilestone.data.year}
                  onChange={e => setEditingMilestone({ ...editingMilestone, data: { ...editingMilestone.data, year: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Milestone Title</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingMilestone.data.title}
                  onChange={e => setEditingMilestone({ ...editingMilestone, data: { ...editingMilestone.data, title: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={editingMilestone.data.description}
                  onChange={e => setEditingMilestone({ ...editingMilestone, data: { ...editingMilestone.data, description: e.target.value } })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMilestoneModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leader Modal */}
      {isLeaderModalOpen && editingLeader && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingLeader.index >= 0 ? 'Edit Leader' : 'Add Executive Leader'}
              </h3>
              <button onClick={() => setIsLeaderModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const updated = [...cmsContent.about.leaders];
              if (editingLeader.index >= 0) {
                updated[editingLeader.index] = editingLeader.data;
              } else {
                updated.push(editingLeader.data);
              }
              setCmsContent({ ...cmsContent, about: { ...cmsContent.about, leaders: updated } });
              setIsLeaderModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Role / Office</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Association President"
                  value={editingLeader.data.role}
                  onChange={e => setEditingLeader({ ...editingLeader, data: { ...editingLeader.data, role: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Dr. Raymond Byaruhanga"
                  value={editingLeader.data.name}
                  onChange={e => setEditingLeader({ ...editingLeader, data: { ...editingLeader.data, name: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Cohort / Class</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Class of 2004 (S6 PCM)"
                  value={editingLeader.data.cohort}
                  onChange={e => setEditingLeader({ ...editingLeader, data: { ...editingLeader.data, cohort: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Profession</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Senior Consultant & Healthcare Executive"
                  value={editingLeader.data.profession}
                  onChange={e => setEditingLeader({ ...editingLeader, data: { ...editingLeader.data, profession: e.target.value } })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLeaderModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tier Modal */}
      {isTierModalOpen && editingTier && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingTier.index >= 0 ? 'Edit Membership Tier' : 'Add Membership Tier'}
              </h3>
              <button onClick={() => setIsTierModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const updated = [...cmsContent.membership.tiers];
              if (editingTier.index >= 0) {
                updated[editingTier.index] = editingTier.data;
              } else {
                updated.push(editingTier.data);
              }
              setCmsContent({ ...cmsContent, membership: { ...cmsContent.membership, tiers: updated } });
              setIsTierModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label required">Tier Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editingTier.data.title}
                    onChange={e => setEditingTier({ ...editingTier, data: { ...editingTier.data, title: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Badge Label</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editingTier.data.badge}
                    onChange={e => setEditingTier({ ...editingTier, data: { ...editingTier.data, badge: e.target.value } })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Target Audience</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingTier.data.target}
                  onChange={e => setEditingTier({ ...editingTier, data: { ...editingTier.data, target: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={editingTier.data.description}
                  onChange={e => setEditingTier({ ...editingTier, data: { ...editingTier.data, description: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Benefits (One per line)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editingTier.data.benefits.join('\n')}
                  onChange={e => setEditingTier({
                    ...editingTier,
                    data: {
                      ...editingTier.data,
                      benefits: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTierModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {isFaqModalOpen && editingFaq && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#0B203E' }}>
                {editingFaq.index >= 0 ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              <button onClick={() => setIsFaqModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const updated = [...cmsContent.contact.faqs];
              if (editingFaq.index >= 0) {
                updated[editingFaq.index] = editingFaq.data;
              } else {
                updated.push(editingFaq.data);
              }
              setCmsContent({ ...cmsContent, contact: { ...cmsContent.contact, faqs: updated } });
              setIsFaqModalOpen(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Question</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={editingFaq.data.q}
                  onChange={e => setEditingFaq({ ...editingFaq, data: { ...editingFaq.data, q: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Answer</label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  value={editingFaq.data.a}
                  onChange={e => setEditingFaq({ ...editingFaq, data: { ...editingFaq.data, a: e.target.value } })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFaqModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
