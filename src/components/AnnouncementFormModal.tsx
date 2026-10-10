import React, { useState } from 'react';
import { 
  Announcement, 
  AnnouncementCategory, 
  AudienceScope, 
  DeliveryChannel,
  Chapter 
} from '../types';
import { dataService } from '../services/dataService';
import { 
  X, 
  Send, 
  Smartphone, 
  Mail, 
  Globe, 
  Pin, 
  AlertCircle, 
  CheckCircle2,
  Users
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  announcementToEdit?: Announcement | null;
  adminEmail: string;
  onSuccess: () => void;
}

export const AnnouncementFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chapters,
  announcementToEdit,
  adminEmail,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(announcementToEdit?.title || '');
  const [summary, setSummary] = useState(announcementToEdit?.summary || '');
  const [content, setContent] = useState(announcementToEdit?.content || '');
  const [category, setCategory] = useState<AnnouncementCategory>(announcementToEdit?.category || 'CIRCULAR');
  const [audienceScope, setAudienceScope] = useState<AudienceScope>(announcementToEdit?.audienceScope || 'ALL_ALUMNI');
  const [targetChapterId, setTargetChapterId] = useState<string>(announcementToEdit?.targetChapterId || (chapters[0]?.id || ''));
  const [targetYearStart, setTargetYearStart] = useState<number>(announcementToEdit?.targetYearStart || 1997);
  const [targetYearEnd, setTargetYearEnd] = useState<number>(announcementToEdit?.targetYearEnd || new Date().getFullYear());
  const [isPinned, setIsPinned] = useState(announcementToEdit?.isPinned || false);
  const [coverImage, setCoverImage] = useState(announcementToEdit?.coverImage || '');
  const [authorName, setAuthorName] = useState(announcementToEdit?.authorName || 'MOSA Secretariat');
  const [authorRole, setAuthorRole] = useState(announcementToEdit?.authorRole || 'Executive Committee');

  // Channels
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<{ smsCount?: number; emailCount?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Please provide a title and detailed circular content.');
      return;
    }

    const channels: DeliveryChannel[] = ['PORTAL_FEED'];
    if (sendSms) channels.push('SMS_BROADCAST');
    if (sendEmail) channels.push('EMAIL_DIGEST');

    const selectedChap = chapters.find(c => c.id === targetChapterId);

    setSubmitting(true);
    try {
      if (announcementToEdit) {
        const res = await dataService.updateAnnouncement(announcementToEdit.id, {
          title: title.trim(),
          summary: summary.trim() || undefined,
          content: content.trim(),
          category,
          audienceScope,
          targetChapterId: audienceScope === 'CHAPTER_ONLY' ? targetChapterId : undefined,
          targetChapterCode: audienceScope === 'CHAPTER_ONLY' ? selectedChap?.code : undefined,
          targetYearStart: audienceScope === 'COHORT_RANGE' ? targetYearStart : undefined,
          targetYearEnd: audienceScope === 'COHORT_RANGE' ? targetYearEnd : undefined,
          isPinned,
          coverImage: coverImage.trim() || undefined,
          authorName: authorName.trim(),
          authorRole: authorRole.trim(),
        }, adminEmail);

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Failed to update announcement');
        }
      } else {
        const res = await dataService.createAnnouncement({
          title: title.trim(),
          summary: summary.trim() || undefined,
          content: content.trim(),
          category,
          audienceScope,
          targetChapterId: audienceScope === 'CHAPTER_ONLY' ? targetChapterId : undefined,
          targetChapterCode: audienceScope === 'CHAPTER_ONLY' ? selectedChap?.code : undefined,
          targetYearStart: audienceScope === 'COHORT_RANGE' ? targetYearStart : undefined,
          targetYearEnd: audienceScope === 'COHORT_RANGE' ? targetYearEnd : undefined,
          isPinned,
          channels,
          coverImage: coverImage.trim() || undefined,
          authorName: authorName.trim(),
          authorRole: authorRole.trim(),
          publishedBy: adminEmail,
        }, adminEmail);

        if (res.success) {
          setDispatchedSuccess({ smsCount: res.smsCount, emailCount: res.emailCount });
          onSuccess();
        } else {
          setError(res.error || 'Failed to publish announcement');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#0B203E', margin: 0, fontWeight: 700 }}>
              {announcementToEdit ? 'Edit Broadcast Announcement' : 'Compose Multi-Channel Broadcast'}
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Mandela Old Students Association (MOSA) • Official Secretariat Desk
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {dispatchedSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#ECFDF5', 
              color: '#059669', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem auto' 
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#0B203E', marginBottom: '0.5rem' }}>
              Broadcast Successfully Dispatched!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Your circular has been published to the portal feed and simulated across telecom broadcast channels:
            </p>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', color: '#334155', maxWidth: '360px', margin: '0 auto 1.5rem auto', textAlign: 'left' }}>
              <div>• <strong>Portal Notification:</strong> Live to target audience</div>
              <div>• <strong>SMS Broadcast:</strong> Dispatched to {dispatchedSuccess.smsCount || 0} phones</div>
              <div>• <strong>Email Circular:</strong> Delivered to {dispatchedSuccess.emailCount || 0} inboxes</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={onClose}
              style={{ padding: '0.75rem 2rem' }}
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Announcement Title <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Official Notice: 2026 MOSA Elective Annual General Meeting"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>

            {/* Category & Scope */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as AnnouncementCategory)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="CIRCULAR">Official Circular</option>
                  <option value="NEWSLETTER">Newsletter & Editorial</option>
                  <option value="EVENT_ALERT">Event & Meeting Alert</option>
                  <option value="WELFARE_NOTICE">Welfare & Support</option>
                  <option value="ACADEMIC_EXCELLENCE">Academic Excellence</option>
                  <option value="OBITUARY">Obituary & Condolence</option>
                  <option value="GENERAL">General Notice</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Target Audience Scope
                </label>
                <select
                  value={audienceScope}
                  onChange={e => setAudienceScope(e.target.value as AudienceScope)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                >
                  <option value="ALL_ALUMNI">Schoolwide (All Registered Alumni)</option>
                  <option value="CHAPTER_ONLY">Specific University Chapter</option>
                  <option value="ACTIVE_MEMBERS_ONLY">Active Dues-Paid Members Only</option>
                  <option value="COHORT_RANGE">Specific Cohort Years</option>
                </select>
              </div>
            </div>

            {/* Conditional Scope Parameters */}
            {audienceScope === 'CHAPTER_ONLY' && (
              <div style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Select Target Chapter
                </label>
                <select
                  value={targetChapterId}
                  onChange={e => setTargetChapterId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.institution}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {audienceScope === 'COHORT_RANGE' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    From Year
                  </label>
                  <input
                    type="number"
                    min={1997}
                    max={2030}
                    value={targetYearStart}
                    onChange={e => setTargetYearStart(parseInt(e.target.value, 10) || 1997)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    To Year
                  </label>
                  <input
                    type="number"
                    min={1997}
                    max={2030}
                    value={targetYearEnd}
                    onChange={e => setTargetYearEnd(parseInt(e.target.value, 10) || 2026)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {/* Author Attribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Author / Spokesperson Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Patrick Mugisa"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Designation / Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOSA Secretary General"
                  value={authorRole}
                  onChange={e => setAuthorRole(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Executive Summary / Teaser (Optional)
              </label>
              <input
                type="text"
                placeholder="One-sentence highlight shown in SMS and notification banners"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>

            {/* Full Content */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Full Announcement Body <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                required
                rows={5}
                placeholder="Write full circular, agenda points, resolution or article here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', lineHeight: '1.5' }}
              />
            </div>

            {/* Cover Image */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>

            {/* Delivery Channels & Pinned */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.6rem' }}>
                Multi-Channel Dispatch Options:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                  />
                  <span><strong>Pin to Top:</strong> Featured announcement at the top of the portal feed</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={e => setSendSms(e.target.checked)}
                  />
                  <span><strong>SMS Broadcast:</strong> Dispatch instant text alert to mobile contacts</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                  />
                  <span><strong>Email Digest:</strong> Send HTML circular to alumni email inboxes</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '0.65rem 1.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={16} /> {submitting ? 'Publishing Broadcast...' : (announcementToEdit ? 'Save Changes' : 'Publish Broadcast')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
