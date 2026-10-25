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
  Check
} from 'lucide-react';
import { AuthUser, WelcomePageConfig } from '../types';
import { dataService } from '../services/dataService';

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

  const handleSaveDraft = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      const res = await dataService.saveWelcomePageDraft({
        draftHeroTitle: heroTitle,
        draftSlogan: slogan,
        draftSubtitle: subtitle,
        draftIntroMessage: introMessage,
        draftHeroImageUrl: heroImageUrl,
      }, currentUser);

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
      await dataService.saveWelcomePageDraft({
        draftHeroTitle: heroTitle,
        draftSlogan: slogan,
        draftSubtitle: subtitle,
        draftIntroMessage: introMessage,
        draftHeroImageUrl: heroImageUrl,
      }, currentUser);

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
                  src={heroImageUrl || '/images/massh-flag-unveiling-ceremony.jpg'}
                  alt="Hero Preview"
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', border: '1.5px solid rgba(255, 255, 255, 0.2)' }}
                />
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
