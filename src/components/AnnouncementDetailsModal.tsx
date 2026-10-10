import React, { useEffect } from 'react';
import { Announcement } from '../types';
import { dataService } from '../services/dataService';
import { 
  X, 
  Calendar, 
  User, 
  Eye, 
  Pin, 
  Send, 
  Share2, 
  Smartphone, 
  Mail, 
  Building2,
  Award
} from 'lucide-react';

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

export const AnnouncementDetailsModal: React.FC<Props> = ({ announcement, onClose }) => {
  if (!announcement) return null;

  useEffect(() => {
    if (announcement.id) {
      dataService.incrementAnnouncementViews(announcement.id);
    }
  }, [announcement.id]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'CIRCULAR': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'NEWSLETTER': return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
      case 'EVENT_ALERT': return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
      case 'OBITUARY': return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'ACADEMIC_EXCELLENCE': return { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF' };
      default: return { bg: '#F8FAFC', text: '#334155', border: '#E2E8F0' };
    }
  };

  const style = getCategoryColor(announcement.category);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '740px', 
          width: '95%', 
          maxHeight: '90vh', 
          padding: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '16px' 
        }}
      >
        {/* Cover Image if present */}
        {announcement.coverImage && (
          <div style={{ position: 'relative', height: '220px', background: '#0B203E' }}>
            <img 
              src={announcement.coverImage} 
              alt={announcement.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                background: 'rgba(0, 0, 0, 0.6)', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '50%', 
                width: '36px', 
                height: '36px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          {!announcement.coverImage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={22} />
              </button>
            </div>
          )}

          {/* Badges Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {announcement.isPinned && (
              <span style={{ 
                background: '#FEF3C7', 
                color: '#D97706', 
                padding: '3px 10px', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Pin size={12} /> PINNED ANNOUNCEMENT
              </span>
            )}

            <span style={{ 
              background: style.bg, 
              color: style.text, 
              border: `1px solid ${style.border}`,
              padding: '3px 10px', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: 700 
            }}>
              {announcement.category.replace('_', ' ')}
            </span>

            <span style={{ 
              background: '#F1F5F9', 
              color: '#475569', 
              padding: '3px 8px', 
              borderRadius: '6px', 
              fontSize: '0.75rem', 
              fontWeight: 600 
            }}>
              Target: {announcement.audienceScope.replace('_', ' ')}
            </span>

            {announcement.targetChapterCode && (
              <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                {announcement.targetChapterCode} Chapter
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.65rem', color: '#0B203E', fontWeight: 800, lineHeight: '1.3', margin: '0 0 1rem 0' }}>
            {announcement.title}
          </h1>

          {/* Author & Meta Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#0B203E', 
                color: '#D97706', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                {announcement.authorName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0B203E' }}>
                  {announcement.authorName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {announcement.authorRole}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                <span>{new Date(announcement.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} />
                <span>{(announcement.viewsCount || 0) + 1} views</span>
              </div>
            </div>
          </div>

          {/* Summary Quote Box if provided */}
          {announcement.summary && (
            <div style={{ 
              background: '#F8FAFC', 
              borderLeft: '4px solid #0B203E', 
              padding: '1rem 1.25rem', 
              borderRadius: '0 8px 8px 0', 
              fontSize: '0.95rem', 
              fontWeight: 500, 
              color: '#334155', 
              marginBottom: '1.5rem',
              fontStyle: 'italic',
              lineHeight: '1.6'
            }}>
              "{announcement.summary}"
            </div>
          )}

          {/* Full Content */}
          <div style={{ fontSize: '1rem', lineHeight: '1.75', color: '#1E293B', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
            {announcement.content}
          </div>

          {/* Channels & Delivery Telemetry Box */}
          <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={16} /> Multi-Channel Broadcast Telemetry
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: '#475569' }}>
              <div>• Portal Feed: <strong style={{ color: '#059669' }}>Delivered</strong></div>
              {announcement.smsRecipientsCount ? (
                <div>• SMS Broadcast: <strong style={{ color: '#059669' }}>{announcement.smsRecipientsCount} Alumni Dispatched</strong></div>
              ) : null}
              {announcement.emailRecipientsCount ? (
                <div>• Email Circular: <strong style={{ color: '#059669' }}>{announcement.emailRecipientsCount} Inboxes</strong></div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Close
          </button>

          <button 
            type="button" 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: announcement.title, text: announcement.summary || announcement.content, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Announcement link copied to clipboard!');
              }
            }} 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={16} /> Share Circular
          </button>
        </div>
      </div>
    </div>
  );
};
