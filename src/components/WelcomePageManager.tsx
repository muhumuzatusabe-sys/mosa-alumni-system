import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon, 
  Trash2, 
  RotateCcw,
  Globe,
  Loader2,
  Check,
  ArrowUp,
  ArrowDown,
  Plus,
  Star,
  Clock,
  Layers,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { AuthUser, WelcomePageConfig, CarouselImageItem } from '../types';
import { dataService, defaultCarouselImages } from '../services/dataService';

interface WelcomePageManagerProps {
  currentUser: AuthUser;
  onRefreshPortal?: () => void;
}

export const WelcomePageManager: React.FC<WelcomePageManagerProps> = ({
  currentUser,
  onRefreshPortal,
}) => {
  const [config, setConfig] = useState<WelcomePageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Form state (editing drafts)
  const [heroTitle, setHeroTitle] = useState('');
  const [slogan, setSlogan] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [carouselImages, setCarouselImages] = useState<CarouselImageItem[]>([]);
  const [carouselIntervalSeconds, setCarouselIntervalSeconds] = useState<number>(6);

  // Association Social Handles & Official Contacts
  const [socialX, setSocialX] = useState('');
  const [socialLinkedIn, setSocialLinkedIn] = useState('');
  const [socialGmail, setSocialGmail] = useState('');
  const [socialTikTok, setSocialTikTok] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [officialWhatsApp, setOfficialWhatsApp] = useState('');
  const [officialAddress, setOfficialAddress] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await dataService.getWelcomePageConfig();
      setConfig(cfg);
      setHeroTitle(cfg.draftHeroTitle || cfg.heroTitle);
      setSlogan(cfg.draftSlogan || cfg.slogan);
      setSubtitle(cfg.draftSubtitle || cfg.subtitle);
      setIntroMessage(cfg.draftIntroMessage || cfg.introMessage);
      setHeroImageUrl(cfg.draftHeroImageUrl || cfg.heroImageUrl || '');
      setSocialX(cfg.draftSocialX ?? cfg.socialX ?? 'https://x.com/Masshalumni');
      setSocialLinkedIn(cfg.draftSocialLinkedIn ?? cfg.socialLinkedIn ?? 'https://linkedin.com/company/mosa-massh');
      setSocialGmail(cfg.draftSocialGmail ?? cfg.socialGmail ?? 'secretariat@massh.ac.ug');
      setSocialTikTok(cfg.draftSocialTikTok ?? cfg.socialTikTok ?? 'https://tiktok.com/@mosa_massh');
      setOfficialPhone(cfg.draftOfficialPhone ?? cfg.officialPhone ?? '+256 782 123456');
      setOfficialWhatsApp(cfg.draftOfficialWhatsApp ?? cfg.officialWhatsApp ?? '256782123456');
      setOfficialAddress(cfg.draftOfficialAddress ?? cfg.officialAddress ?? 'Mandela Secondary School Hoima • P.O. Box 280, Hoima City, Uganda');
      setOfficialWebsite(cfg.draftOfficialWebsite ?? cfg.officialWebsite ?? 'https://mtech-46634.web.app');
      setIntroMessage(cfg.draftIntroMessage || cfg.introMessage);
      setHeroImageUrl(cfg.draftHeroImageUrl || cfg.heroImageUrl || '');
      setCarouselImages(
        cfg.draftCarouselImages && cfg.draftCarouselImages.length > 0
          ? cfg.draftCarouselImages
          : cfg.carouselImages && cfg.carouselImages.length > 0
          ? cfg.carouselImages
          : defaultCarouselImages
      );
      setCarouselIntervalSeconds(cfg.draftCarouselIntervalSeconds || cfg.carouselIntervalSeconds || 6);
    } catch (err: any) {
      setErrorMsg('Failed to load welcome page configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 3MB limit. Please compress the image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setHeroImageUrl(dataUrl);
      setSuccessMsg('Hero image loaded for preview. Click "Save as Draft" to retain.');
      setTimeout(() => setSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Carousel handlers
  const handleCarouselUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Photograph exceeds 4MB limit. Please select a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const newImg: CarouselImageItem = {
        id: `img-${Date.now()}`,
        url: dataUrl,
        title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        caption: 'Mandela Secondary School Hoima',
        isFeatured: carouselImages.length === 0,
        order: carouselImages.length + 1,
      };
      setCarouselImages((prev) => [...prev, newImg]);
      setSuccessMsg('Photograph added to carousel draft. Remember to click "Save as Draft" or "Publish".');
      setTimeout(() => setSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMoveCarouselImage = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= carouselImages.length) return;
    const items = [...carouselImages];
    const [moved] = items.splice(index, 1);
    items.splice(newIdx, 0, moved);
    const updated = items.map((img, idx) => ({ ...img, order: idx + 1 }));
    setCarouselImages(updated);
  };

  const handleToggleFeatured = (id: string) => {
    setCarouselImages((prev) =>
      prev.map((img) => ({
        ...img,
        isFeatured: img.id === id ? !img.isFeatured : false,
      }))
    );
  };

  const handleRemoveCarouselImage = (id: string) => {
    if (carouselImages.length <= 1) {
      setErrorMsg('At least one hero carousel image must remain active.');
      return;
    }
    const updated = carouselImages
      .filter((img) => img.id !== id)
      .map((img, idx) => ({ ...img, order: idx + 1 }));
    setCarouselImages(updated);
    setSuccessMsg('Photograph removed from carousel draft.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetCarouselToDefaults = () => {
    setCarouselImages(defaultCarouselImages);
    setSuccessMsg('Restored authentic default MASSH photographs.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdateImageMetadata = (id: string, field: 'title' | 'caption', val: string) => {
    setCarouselImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: val } : img))
    );
  };

  const handleSaveDraft = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const res = await dataService.saveWelcomePageDraft(
        {
          draftHeroTitle: heroTitle,
          draftSlogan: slogan,
          draftSubtitle: subtitle,
          draftIntroMessage: introMessage,
          draftHeroImageUrl: heroImageUrl,
          draftCarouselImages: carouselImages,
          draftCarouselIntervalSeconds: carouselIntervalSeconds,
          draftSocialX: socialX,
          draftSocialLinkedIn: socialLinkedIn,
          draftSocialGmail: socialGmail,
          draftSocialTikTok: socialTikTok,
          draftOfficialPhone: officialPhone,
          draftOfficialWhatsApp: officialWhatsApp,
          draftOfficialAddress: officialAddress,
          draftOfficialWebsite: officialWebsite,
        },
        currentUser
      );

      if (res.success) {
        setConfig(res.config);
        setSuccessMsg('Welcome page draft saved successfully. Changes are ready for preview or publishing.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish welcome page changes to the live public website?')) return;
    setErrorMsg('');
    setSaving(true);
    try {
      // First ensure current form state is drafted
      await dataService.saveWelcomePageDraft(
        {
          draftHeroTitle: heroTitle,
          draftSlogan: slogan,
          draftSubtitle: subtitle,
          draftIntroMessage: introMessage,
          draftHeroImageUrl: heroImageUrl,
          draftCarouselImages: carouselImages,
          draftCarouselIntervalSeconds: carouselIntervalSeconds,
          draftSocialX: socialX,
          draftSocialLinkedIn: socialLinkedIn,
          draftSocialGmail: socialGmail,
          draftSocialTikTok: socialTikTok,
          draftOfficialPhone: officialPhone,
          draftOfficialWhatsApp: officialWhatsApp,
          draftOfficialAddress: officialAddress,
          draftOfficialWebsite: officialWebsite,
        },
        currentUser
      );

      const res = await dataService.publishWelcomePage(currentUser);
      if (res.success) {
        setConfig(res.config);
        setSuccessMsg('Welcome page successfully published live!');
        setTimeout(() => setSuccessMsg(''), 4000);
        if (onRefreshPortal) onRefreshPortal();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish welcome page.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevertDefault = async () => {
    if (!window.confirm('Revert welcome page back to the official default branding and imagery?')) return;
    setSaving(true);
    try {
      const res = await dataService.revertWelcomePageToDefault(currentUser);
      setConfig(res.config);
      setHeroTitle(res.config.heroTitle);
      setSlogan(res.config.slogan);
      setSubtitle(res.config.subtitle);
      setIntroMessage(res.config.introMessage);
      setHeroImageUrl(res.config.heroImageUrl || '');
      setCarouselImages(res.config.carouselImages || defaultCarouselImages);
      setCarouselIntervalSeconds(res.config.carouselIntervalSeconds || 6);
      setSuccessMsg('Restored official MOSA welcome page defaults.');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (onRefreshPortal) onRefreshPortal();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to revert to default.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#F59E0B' }} />
        <p>Loading Welcome Page configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', color: '#FFFFFF' }}>
      
      {/* Header & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: 800 }}>
            Public Experience Management
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.2rem 0' }}>
            MOSA Welcome Page Editor
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
            Manage public welcome text, slogan, background hero image, and live publication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPreviewModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Eye size={15} />
            <span>Live Preview</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              background: 'rgba(217, 119, 6, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#FDE68A',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Save size={15} />
            <span>Save as Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#FFFFFF',
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)',
            }}
          >
            <Globe size={15} />
            <span>Publish to Live Site</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: 'rgba(5, 150, 105, 0.2)', border: '1px solid rgba(16, 185, 129, 0.45)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#6EE7B7', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} color="#34D399" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} color="#F87171" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status banner */}
      {config?.hasUnpublishedDraft && (
        <div style={{ background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#FDE68A', fontSize: '0.82rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={15} color="#FBBF24" />
            <span>You have unpublished drafts. The live site shows content published on {config.lastPublishedAt ? new Date(config.lastPublishedAt).toLocaleDateString() : 'earlier'}.</span>
          </div>
          <button
            onClick={handlePublish}
            style={{ background: '#F59E0B', color: '#05160F', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Publish Now
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <div style={{ background: 'rgba(10, 39, 27, 0.7)', border: '1.5px solid rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 1: Slogan & Main Heading */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#FDA4AF', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Official Slogan Badge
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="e.g. PROUDLY MANDELIAN"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Main Hero Heading
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g. WELCOME TO MOSA"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: '8px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Row 2: Subtitle */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#FCD34D', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Primary Tagline / Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. One family. One legacy. A lifetime of connection."
            style={{
              width: '100%',
              padding: '0.7rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Row 3: Introductory Message */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Supporting Introductory Message
          </label>
          <textarea
            value={introMessage}
            onChange={(e) => setIntroMessage(e.target.value)}
            rows={3}
            placeholder="e.g. Your journey with the Mandela Old Students Association starts here."
            style={{
              width: '100%',
              padding: '0.7rem 0.85rem',
              borderRadius: '8px',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Row 4: Hero Image Management */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hero / Background Image
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.25rem', alignItems: 'center' }}>
            {/* Image Preview Box */}
            <div
              style={{
                width: '180px',
                height: '115px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#04120C',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Hero Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ImageIcon size={32} color="#64748B" />
              )}
            </div>

            {/* Upload & Reset Controls */}
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Upload size={14} />
                  <span>Upload New Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {heroImageUrl && (
                  <button
                    type="button"
                    onClick={() => setHeroImageUrl('/images/massh-flag-unveiling-ceremony.jpg')}
                    style={{
                      background: 'transparent',
                      border: '1px dashed rgba(255, 255, 255, 0.25)',
                      color: '#CBD5E1',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Restore Default Image
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Recommended dimensions: 1200 × 750px (JPG, WebP, or PNG). Max file size 3MB.
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Dynamic Hero Carousel Management */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Layers size={17} color="#FCD34D" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Dynamic Hero Carousel Photographs ({carouselImages.length})
                </h3>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: 0, maxWidth: '600px' }}>
                Manage authentic Mandela Secondary School photographs that rotate smoothly in the welcome hero. Reorder slides, designate a featured photo, upload new memories, or configure transition speed.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Transition Speed Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <Clock size={14} color="#94A3B8" />
                <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>Interval:</span>
                <select
                  value={carouselIntervalSeconds}
                  onChange={(e) => setCarouselIntervalSeconds(Number(e.target.value))}
                  style={{
                    background: '#04120C',
                    color: '#FCD34D',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <option value={4}>4 seconds</option>
                  <option value={6}>6 seconds (Default)</option>
                  <option value={8}>8 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>

              {/* Upload New Photo Button */}
              <label
                style={{
                  background: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#FFFFFF',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(190, 24, 93, 0.3)',
                }}
              >
                <Plus size={14} />
                <span>Add Photograph</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCarouselUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Reset to Defaults */}
              <button
                type="button"
                onClick={handleResetCarouselToDefaults}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#CBD5E1',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Restore MASSH Photos
              </button>
            </div>
          </div>

          {/* Carousel Image Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {carouselImages.map((img, idx) => (
              <div
                key={img.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  background: img.isFeatured ? 'rgba(190, 24, 93, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                  border: img.isFeatured ? '1.5px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Image Thumbnail with Order badge */}
                <div style={{ position: 'relative', width: '120px', height: '75px', borderRadius: '6px', overflow: 'hidden', background: '#020B07' }}>
                  <img
                    src={img.url}
                    alt={img.title || `Slide ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#FCD34D',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    #{idx + 1}
                  </div>
                  {img.isFeatured && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: '#BE185D',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Featured
                    </div>
                  )}
                </div>

                {/* Metadata Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Photo Title / Event
                    </label>
                    <input
                      type="text"
                      value={img.title || ''}
                      onChange={(e) => handleUpdateImageMetadata(img.id, 'title', e.target.value)}
                      placeholder="e.g. Flag Unveiling Ceremony"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        color: '#FFFFFF',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      Caption / Description
                    </label>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => handleUpdateImageMetadata(img.id, 'caption', e.target.value)}
                      placeholder="e.g. Mandela Secondary School Hoima campus"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        color: '#FFFFFF',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Actions: Move Up, Move Down, Toggle Featured, Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(img.id)}
                    title={img.isFeatured ? 'Featured Image' : 'Set as Featured Photo'}
                    style={{
                      background: img.isFeatured ? 'rgba(252, 211, 77, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: img.isFeatured ? '1px solid #FCD34D' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: img.isFeatured ? '#FCD34D' : '#94A3B8',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Star size={15} fill={img.isFeatured ? '#FCD34D' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveCarouselImage(idx, 'up')}
                    disabled={idx === 0}
                    title="Move Earlier in Carousel"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: idx === 0 ? '#475569' : '#CBD5E1',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveCarouselImage(idx, 'down')}
                    disabled={idx === carouselImages.length - 1}
                    title="Move Later in Carousel"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: idx === carouselImages.length - 1 ? '#475569' : '#CBD5E1',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      cursor: idx === carouselImages.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveCarouselImage(img.id)}
                    disabled={carouselImages.length <= 1}
                    title="Remove from Carousel"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: carouselImages.length <= 1 ? '#475569' : '#F87171',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      cursor: carouselImages.length <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 6: Association Social Handles & Official Contacts (Input by Admin) */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D' }}>
              Association Presence
            </span>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0 0.35rem 0' }}>
              Official Social Media Handles & Secretariat Contacts
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
              These handles and official communication lines will be displayed directly across the Welcome page and portal headers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* X / Twitter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                X (Twitter) Handle / URL
              </label>
              <input
                type="text"
                value={socialX}
                onChange={(e) => setSocialX(e.target.value)}
                placeholder="https://x.com/Masshalumni"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                LinkedIn Page URL
              </label>
              <input
                type="text"
                value={socialLinkedIn}
                onChange={(e) => setSocialLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/company/mosa-massh"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Official Gmail / Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                Official Secretariat Email / Gmail
              </label>
              <input
                type="email"
                value={socialGmail}
                onChange={(e) => setSocialGmail(e.target.value)}
                placeholder="secretariat@massh.ac.ug"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* TikTok */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                TikTok Handle / URL
              </label>
              <input
                type="text"
                value={socialTikTok}
                onChange={(e) => setSocialTikTok(e.target.value)}
                placeholder="https://tiktok.com/@mosa_massh"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Official Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                Official Phone Number
              </label>
              <input
                type="text"
                value={officialPhone}
                onChange={(e) => setOfficialPhone(e.target.value)}
                placeholder="+256 782 123456"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Official WhatsApp */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                Official WhatsApp Contact
              </label>
              <input
                type="text"
                value={officialWhatsApp}
                onChange={(e) => setOfficialWhatsApp(e.target.value)}
                placeholder="256782123456"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Official Website */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.35rem' }}>
                Official Website URL
              </label>
              <input
                type="url"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                placeholder="https://mtech-46634.web.app"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer actions: Revert */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleRevertDefault}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F87171',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0,
            }}
          >
            <RotateCcw size={14} />
            <span>Revert All to Approved Defaults</span>
          </button>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              Publish Changes
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LIVE PREVIEW MODAL                                             */}
      {/* ============================================================== */}
      {previewModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#05160F',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Preview of Welcome Page Changes
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Render hero preview */}
            <div style={{ background: 'radial-gradient(ellipse at top, #113D2B 0%, #0A271B 65%, #05160F 100%)', padding: '2rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', background: 'rgba(236, 72, 153, 0.2)', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '0.25rem 0.75rem', borderRadius: '999px', color: '#FDA4AF', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  {slogan}
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
                  {heroTitle}
                </h1>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#FDE68A', margin: '0 0 0.75rem 0' }}>
                  {subtitle}
                </p>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
                  {introMessage}
                </p>
              </div>

              <div>
                <img
                  src={
                    carouselImages.find(c => c.isFeatured)?.url ||
                    carouselImages[0]?.url ||
                    heroImageUrl ||
                    '/images/massh-flag-unveiling-ceremony.jpg'
                  }
                  alt="Hero Preview"
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid rgba(255, 255, 255, 0.2)' }}
                />
                {carouselImages.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {carouselImages.map((img, i) => (
                      <img
                        key={img.id || i}
                        src={img.url}
                        alt={img.title || `Thumbnail ${i + 1}`}
                        style={{
                          width: '50px',
                          height: '32px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: img.isFeatured ? '2px solid #FCD34D' : '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setPreviewModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'transparent', color: '#CBD5E1', cursor: 'pointer' }}
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setPreviewModalOpen(false);
                  handlePublish();
                }}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
              >
                Publish Live Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
