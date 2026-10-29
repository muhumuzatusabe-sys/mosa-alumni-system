import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Lock, 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { MOSADocument, AuthUser } from '../types';
import { dataService } from '../services/dataService';

interface DocumentsViewProps {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  currentUser,
  onOpenAuth,
  onBack,
}) => {
  const [documents, setDocuments] = useState<MOSADocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<MOSADocument | null>(null);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await dataService.getDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };
    loadDocs();
  }, []);

  const filteredDocs = documents.filter(doc => {
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleDownload = (doc: MOSADocument) => {
    if (doc.isRestrictedToMembers && !currentUser) {
      onOpenAuth();
      return;
    }
    // Create authentic simulated download with official header and watermark
    const content = `================================================================================
MANDELA OLD STUDENTS ASSOCIATION (MOSA)
MANDELA SECONDARY SCHOOL HOIMA (MASSH) • ESTABLISHED 1997
CENTRAL SECRETARIAT • P.O. BOX 228, HOIMA CITY, UGANDA
================================================================================

DOCUMENT TITLE: ${doc.title}
CATEGORY:       ${doc.category}
PUBLISHED DATE: ${doc.publishedDate}
FILE FORMAT:    ${doc.fileType || 'Official Document'}
FILE SIZE:      ${doc.fileSize}
ACCESS LEVEL:   ${doc.isRestrictedToMembers ? 'VERIFIED MEMBERS ONLY' : 'PUBLIC RELEASE'}

--------------------------------------------------------------------------------
EXECUTIVE SUMMARY & PROVISIONS:
--------------------------------------------------------------------------------
${doc.description || 'Official verified release from the National Secretariat.'}

--------------------------------------------------------------------------------
VERIFICATION COVENANT:
--------------------------------------------------------------------------------
This document represents an official, ratified publication of the Mandela Old
Students Association (MOSA). All provisions, resolutions, and declarations
contained herein are binding under the authority of the Association Constitution
and the National Executive Committee.

Issuing Authority: Central Secretariat, Mandela Secondary School Hoima
Security Hash: MOSA-DOC-${doc.id.toUpperCase()}-${new Date().getFullYear()}
Recipient: ${currentUser?.displayName || 'Authorized Member'} (${currentUser?.alumniNumber || 'Public Access'})
Issued At: ${new Date().toISOString()}
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'CONSTITUTION': return 'Constitution';
      case 'AGM_REPORT': return 'AGM Report';
      case 'CIRCULAR': return 'Circular';
      case 'FINANCIAL_REPORT': return 'Financials';
      case 'MEMBERSHIP_FORM': return 'Guidelines';
      default: return 'General';
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem 1.25rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        {onBack && (
          <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0B203E',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', color: '#D97706', padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <FileText size={15} />
          <span>OFFICIAL PUBLICATIONS & ARCHIVES</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: '#0B203E', marginBottom: '0.75rem', fontWeight: 800 }}>
          MOSA Documents & Resources
        </h1>
        <p style={{ color: '#64748B', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: '1.6' }}>
          Access and download official circulars, the MOSA constitution, audited treasury reports, and campus chapter charters.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div 
        className="mosa-card" 
        style={{ 
          padding: '1.25rem 1.5rem', 
          marginBottom: '2rem', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            className="input-field"
            placeholder="Search documents by title or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.9rem' }}
          />
        </div>

        <div className="horizontal-scroll-touch" style={{ display: 'flex', gap: '0.5rem', maxWidth: '100%' }}>
          {['ALL', 'CONSTITUTION', 'AGM_REPORT', 'CIRCULAR', 'FINANCIAL_REPORT', 'MEMBERSHIP_FORM'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                background: selectedCategory === cat ? '#0B203E' : '#F1F5F9',
                color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {cat === 'ALL' ? 'All Documents' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="mosa-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#0B203E', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Documents Found</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredDocs.map(doc => {
            const isRestrictedAndLocked = doc.isRestrictedToMembers && !currentUser;
            return (
              <div 
                key={doc.id}
                className="mosa-card"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '4px solid #0B203E',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    {getCategoryLabel(doc.category)}
                  </span>
                  {doc.isRestrictedToMembers && (
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        color: isRestrictedAndLocked ? '#DC2626' : '#059669', 
                        background: isRestrictedAndLocked ? '#FEE2E2' : '#D1FAE5', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {isRestrictedAndLocked ? <Lock size={12} /> : <CheckCircle2 size={12} />}
                      {isRestrictedAndLocked ? 'Members Only' : 'Member Unlocked'}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.5rem', lineHeight: '1.35' }}>
                  {doc.title}
                </h3>

                <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                  {doc.description}
                </p>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>{new Date(doc.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span>{doc.fileSize} • {doc.fileType || 'PDF'}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.88rem' }}
                  >
                    {isRestrictedAndLocked ? <Lock size={15} /> : <Download size={15} />}
                    <span>{isRestrictedAndLocked ? 'Login to Download' : 'Download'}</span>
                  </button>

                  <button
                    onClick={() => setPreviewDoc(doc)}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                      borderRadius: '8px',
                      padding: '0.65rem 0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Quick Preview"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mosa-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                {getCategoryLabel(previewDoc.category)}
              </span>
              <button 
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.35rem', color: '#0B203E', marginBottom: '0.5rem' }}>{previewDoc.title}</h3>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
              Published {new Date(previewDoc.publishedDate).toLocaleDateString(undefined, { dateStyle: 'long' })} • Size: {previewDoc.fileSize}
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.92rem', color: '#334155' }}>
              {previewDoc.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPreviewDoc(null)}
                style={{ padding: '0.65rem 1.25rem' }}
              >
                Close Preview
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} /> Download Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
