import React, { useState, useEffect } from 'react';
import {
  AlumniProfile,
  AuthUser,
  CardCorrectionRequest,
  MembershipCardRecord,
  MembershipCardSettings,
} from '../types';
import { dataService } from '../services/dataService';
import { membershipCardService, DEFAULT_CARD_SETTINGS } from '../services/membershipCardService';
import { DigitalMembershipCard } from './DigitalMembershipCard';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Printer,
  RotateCw,
  Eye,
  Settings,
  Layers,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Send,
  X,
  Plus,
  HelpCircle,
  FileEdit,
  History,
  Check,
} from 'lucide-react';

interface Props {
  currentUser: AuthUser;
}

export const MembershipCardAdmin: React.FC<Props> = ({ currentUser }) => {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [cards, setCards] = useState<MembershipCardRecord[]>([]);
  const [corrections, setCorrections] = useState<CardCorrectionRequest[]>([]);
  const [settings, setSettings] = useState<MembershipCardSettings>(DEFAULT_CARD_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'PENDING' | 'SUSPENDED' | 'REVOKED'>('ALL');
  const [selectedAlumniIds, setSelectedAlumniIds] = useState<string[]>([]);

  // Modals & Panels
  const [previewAlumnus, setPreviewAlumnus] = useState<AlumniProfile | null>(null);
  const [reissueTarget, setReissueTarget] = useState<AlumniProfile | null>(null);
  const [reissueReason, setReissueReason] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<{ alumnus: AlumniProfile; card: MembershipCardRecord } | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [historyTarget, setHistoryTarget] = useState<AlumniProfile | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'corrections'>('cards');

  // Operation Notices
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allAlumni, allCards, allSettings, allCorrections] = await Promise.all([
        dataService.getAlumniList(),
        membershipCardService.getAllCards(),
        membershipCardService.getCardSettings(),
        membershipCardService.getCorrectionRequests(),
      ]);
      setAlumni(allAlumni);
      setCards(allCards);
      setSettings(allSettings);
      setCorrections(allCorrections);
    } catch (err) {
      console.error('Failed to load card admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Map each alumnus to their card
  const getCardForMember = (alumniId: string): MembershipCardRecord | undefined => {
    return cards.find(c => c.alumniId === alumniId && c.status === 'ISSUED') ||
      cards.filter(c => c.alumniId === alumniId).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
  };

  // Filtered members list
  const filteredAlumni = alumni.filter(a => {
    const card = getCardForMember(a.internalId);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      a.alumniNumber.toLowerCase().includes(q) ||
      (a.fullName || `${a.firstName} ${a.lastName}`).toLowerCase().includes(q) ||
      (card && card.validationNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ISSUED') return card && card.status === 'ISSUED';
    if (statusFilter === 'PENDING') return !card || card.status === 'SUPERSEDED';
    if (statusFilter === 'SUSPENDED') return card && card.status === 'SUSPENDED';
    if (statusFilter === 'REVOKED') return card && card.status === 'REVOKED';

    return true;
  });

  // Single card issuance
  const handleIssueCard = async (alumnus: AlumniProfile) => {
    const res = await membershipCardService.issueCard(alumnus, currentUser);
    if (res.success && res.card) {
      showNotice(`Card ${res.card.validationNumber} successfully issued for ${alumnus.alumniNumber}`);
      await loadAll();
    } else {
      showNotice(res.error || 'Issuance failed', 'error');
    }
  };

  // Card reissuance
  const handleConfirmReissue = async () => {
    if (!reissueTarget || !reissueReason.trim()) return;
    const res = await membershipCardService.reissueCard(reissueTarget, reissueReason.trim(), currentUser);
    if (res.success && res.card) {
      showNotice(`Card reissued with new Validation No. ${res.card.validationNumber} (old number retired)`);
      setReissueTarget(null);
      setReissueReason('');
      await loadAll();
    } else {
      showNotice(res.error || 'Reissuance failed', 'error');
    }
  };

  // Card suspension / reinstatement
  const handleToggleSuspension = async (card: MembershipCardRecord, alumnus: AlumniProfile) => {
    if (card.status === 'SUSPENDED') {
      const res = await membershipCardService.reinstateCard(card.id, currentUser);
      if (res.success) {
        showNotice(`Card ${card.validationNumber} reinstated to VALID status.`);
        await loadAll();
      } else {
        showNotice(res.error || 'Reinstatement failed', 'error');
      }
    } else {
      const reason = prompt(`Enter mandatory suspension reason for ${alumnus.alumniNumber}:`);
      if (!reason || !reason.trim()) return;
      const res = await membershipCardService.suspendCard(card.id, reason.trim(), currentUser);
      if (res.success) {
        showNotice(`Card ${card.validationNumber} suspended.`);
        await loadAll();
      } else {
        showNotice(res.error || 'Suspension failed', 'error');
      }
    }
  };

  // Card revocation
  const handleConfirmRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    const res = await membershipCardService.revokeCard(revokeTarget.card.id, revokeReason.trim(), currentUser);
    if (res.success) {
      showNotice(`Card ${revokeTarget.card.validationNumber} permanently revoked.`);
      setRevokeTarget(null);
      setRevokeReason('');
      await loadAll();
    } else {
      showNotice(res.error || 'Revocation failed', 'error');
    }
  };

  // Individual PDF download
  const handleDownloadSinglePdf = async (alumnus: AlumniProfile) => {
    const card = getCardForMember(alumnus.internalId) || {
      id: 'temp',
      alumniId: alumnus.internalId,
      alumniNumber: alumnus.alumniNumber,
      validationNumber: 'MOSA-VAL-SAMPLE',
      verificationToken: alumnus.alumniNumber,
      status: 'ISSUED',
      issueNumber: 1,
      issuedAt: new Date().toISOString(),
      issuedBy: currentUser.displayName || currentUser.email,
      snapshot: membershipCardService.buildCardSnapshot(alumnus, settings),
      history: [],
    };
    const doc = await membershipCardService.generateCardPdf(alumnus, card, settings, 'DUPLEX');
    doc.save(`MOSA_Card_${alumnus.alumniNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // Bulk Issuance
  const handleBulkIssue = async () => {
    const selected = alumni.filter(a => selectedAlumniIds.includes(a.internalId));
    if (selected.length === 0) {
      alert('Please select at least one member using the table checkboxes.');
      return;
    }

    if (!confirm(`Generate official membership cards for ${selected.length} selected member(s)?`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await membershipCardService.bulkIssueCards(selected, currentUser);
      let msg = `Bulk generation complete: ${result.issued.length} card(s) issued.`;
      if (result.skipped.length > 0) {
        msg += ` (${result.skipped.length} skipped: ${result.skipped.map(s => `${s.alumnus.alumniNumber}: ${s.reason}`).slice(0, 2).join('; ')}...)`;
      }
      showNotice(msg, result.issued.length > 0 ? 'success' : 'error');
      setSelectedAlumniIds([]);
      await loadAll();
    } catch (err: any) {
      showNotice(`Bulk generation error: ${err.message}`, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk PDF download
  const handleBulkDownloadPdf = async () => {
    const selected = alumni.filter(a => selectedAlumniIds.includes(a.internalId));
    if (selected.length === 0) {
      alert('Please select at least one member.');
      return;
    }

    setIsBulkProcessing(true);
    try {
      const items = selected.map(a => {
        const c = getCardForMember(a.internalId) || {
          id: 'temp',
          alumniId: a.internalId,
          alumniNumber: a.alumniNumber,
          validationNumber: 'MOSA-VAL-SAMPLE',
          verificationToken: a.alumniNumber,
          status: 'ISSUED',
          issueNumber: 1,
          issuedAt: new Date().toISOString(),
          issuedBy: currentUser.displayName || currentUser.email,
          snapshot: membershipCardService.buildCardSnapshot(a, settings),
          history: [],
        };
        return { alumnus: a, card: c };
      });

      const doc = await membershipCardService.generateBulkCardsPdf(items, settings);
      doc.save(`MOSA_Bulk_Cards_${selected.length}_Members.pdf`);
      showNotice(`Bulk PDF generated for ${selected.length} members.`);
    } catch (err: any) {
      showNotice(`Failed to generate bulk PDF: ${err.message}`, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Selection helpers
  const handleToggleSelect = (id: string) => {
    setSelectedAlumniIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlumniIds.length === filteredAlumni.length) {
      setSelectedAlumniIds([]);
    } else {
      setSelectedAlumniIds(filteredAlumni.map(a => a.internalId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Banner Notice */}
      {notice && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: notice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${notice.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notice.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Sub-Navigation */}
      <div className="mosa-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <CreditCard size={20} color="#D97706" />
              <h2 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                Official Membership ID Card Management
              </h2>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>
              Authorized issuance, reissuance, verification tracking, and bulk PDF generation for Mandela Secondary School Hoima.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSubTab('cards')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: activeSubTab === 'cards' ? '1.5px solid #0B203E' : '1px solid #CBD5E1',
                background: activeSubTab === 'cards' ? '#0B203E' : '#FFFFFF',
                color: activeSubTab === 'cards' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Registry Cards ({cards.filter(c => c.status === 'ISSUED').length} Active)
            </button>

            <button
              onClick={() => setActiveSubTab('corrections')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: activeSubTab === 'corrections' ? '1.5px solid #0B203E' : '1px solid #CBD5E1',
                background: activeSubTab === 'corrections' ? '#0B203E' : '#FFFFFF',
                color: activeSubTab === 'corrections' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <FileEdit size={14} />
              <span>Correction Requests ({corrections.filter(c => c.status === 'OPEN').length})</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Settings size={14} />
              <span>Card Template & Signatories</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: CARDS MANAGEMENT TABLE */}
      {activeSubTab === 'cards' && (
        <div className="mosa-card" style={{ padding: '1.25rem' }}>
          
          {/* Search, Filter & Bulk Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search member name, MA number, or validation number..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.65rem 0.55rem 2.1rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#FFFFFF',
                }}
              >
                <option value="ALL">All Card Statuses</option>
                <option value="ISSUED">Valid / Issued</option>
                <option value="PENDING">Pending Issuance</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>

            {/* Bulk Action Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {selectedAlumniIds.length > 0 && (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>
                    {selectedAlumniIds.length} Selected
                  </span>
                  
                  <button
                    onClick={handleBulkIssue}
                    disabled={isBulkProcessing}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#0B203E' }}
                  >
                    <Layers size={13} />
                    <span>{isBulkProcessing ? 'Processing...' : 'Bulk Generate Cards'}</span>
                  </button>

                  <button
                    onClick={handleBulkDownloadPdf}
                    disabled={isBulkProcessing}
                    className="btn btn-gold"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={13} />
                    <span>Download Bulk PDF</span>
                  </button>
                </>
              )}

              <button
                onClick={loadAll}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}
                title="Refresh Table"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Table of Members & ID Cards */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem', width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredAlumni.length > 0 && selectedAlumniIds.length === filteredAlumni.length}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '0.75rem' }}>Member Profile</th>
                  <th style={{ padding: '0.75rem' }}>MA Number</th>
                  <th style={{ padding: '0.75rem' }}>Card Status</th>
                  <th style={{ padding: '0.75rem' }}>Validation Number</th>
                  <th style={{ padding: '0.75rem' }}>Issue Date / No.</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlumni.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No alumni records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAlumni.map(alumnus => {
                    const card = getCardForMember(alumnus.internalId);
                    const isSelected = selectedAlumniIds.includes(alumnus.internalId);
                    const isEligible = alumnus.membershipStatus === 'ACTIVE' || alumnus.membershipStatus === 'APPROVED';

                    return (
                      <tr 
                        key={alumnus.internalId}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(alumnus.internalId)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        {/* Name & Photo */}
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {alumnus.photoUrl ? (
                              <img
                                src={alumnus.photoUrl}
                                alt={alumnus.firstName}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #D97706' }}
                              />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0B203E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                                {alumnus.firstName[0]}{alumnus.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0B203E' }}>
                                {alumnus.fullName || `${alumnus.firstName} ${alumnus.lastName}`}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Class of {alumnus.schoolHistory?.aLevel?.yearCompleted || alumnus.schoolHistory?.oLevel?.yearCompleted || 2022} • {alumnus.nationality || alumnus.country || 'Uganda'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* MA Number */}
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0B203E', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                            {alumnus.alumniNumber}
                          </span>
                        </td>

                        {/* Card Status */}
                        <td style={{ padding: '0.75rem' }}>
                          {!isEligible ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>
                              <XCircle size={12} /> Ineligible ({alumnus.membershipStatus})
                            </span>
                          ) : card?.status === 'ISSUED' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                              <CheckCircle2 size={12} /> Issued & Valid
                            </span>
                          ) : card?.status === 'SUSPENDED' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#D97706', fontWeight: 700, fontSize: '0.75rem' }}>
                              <AlertTriangle size={12} /> Suspended
                            </span>
                          ) : card?.status === 'REVOKED' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#991B1B', fontWeight: 700, fontSize: '0.75rem' }}>
                              <XCircle size={12} /> Revoked
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#64748B', fontWeight: 600, fontSize: '0.75rem' }}>
                              <Clock size={12} /> Pending Issuance
                            </span>
                          )}
                        </td>

                        {/* Validation Number */}
                        <td style={{ padding: '0.75rem' }}>
                          {card?.validationNumber ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0B203E', fontSize: '0.8rem' }}>
                              {card.validationNumber}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>

                        {/* Issue Date & Issue Number */}
                        <td style={{ padding: '0.75rem' }}>
                          {card?.issuedAt ? (
                            <div>
                              <div style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>
                                {new Date(card.issuedAt).toLocaleDateString('en-GB')}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                Issue #{card.issueNumber}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Not issued</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Preview Card */}
                            <button
                              onClick={() => setPreviewAlumnus(alumnus)}
                              style={{
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                color: '#1E293B',
                                fontWeight: 600,
                              }}
                              title="Preview personalized card"
                            >
                              <Eye size={12} /> Preview
                            </button>

                            {/* Issue Card (if not issued yet and eligible) */}
                            {(!card || card.status !== 'ISSUED') && isEligible && (
                              <button
                                onClick={() => handleIssueCard(alumnus)}
                                style={{
                                  background: '#0B203E',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                Issue Card
                              </button>
                            )}

                            {/* Reissue Card */}
                            {card && card.status === 'ISSUED' && isEligible && (
                              <button
                                onClick={() => {
                                  setReissueTarget(alumnus);
                                  setReissueReason('');
                                }}
                                style={{
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  border: '1px solid #FCD34D',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                                title="Reissue with new validation number"
                              >
                                Reissue
                              </button>
                            )}

                            {/* Download PDF */}
                            <button
                              onClick={() => handleDownloadSinglePdf(alumnus)}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: '#334155',
                              }}
                              title="Download Print-Ready PDF"
                            >
                              <Download size={12} />
                            </button>

                            {/* Suspend / Reinstate */}
                            {card && (
                              <button
                                onClick={() => handleToggleSuspension(card, alumnus)}
                                style={{
                                  background: card.status === 'SUSPENDED' ? '#DCFCE7' : '#FEE2E2',
                                  color: card.status === 'SUSPENDED' ? '#166534' : '#991B1B',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                                title={card.status === 'SUSPENDED' ? 'Reinstate Card' : 'Suspend Card'}
                              >
                                {card.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
                              </button>
                            )}

                            {/* History */}
                            <button
                              onClick={() => setHistoryTarget(alumnus)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                              title="View Issuance History"
                            >
                              <History size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CORRECTIONS QUEUE */}
      {activeSubTab === 'corrections' && (
        <div className="mosa-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#0B203E', marginBottom: '0.75rem', fontWeight: 800 }}>
            Member ID Correction Requests Queue
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            Review requested spelling, date, or identity updates submitted by members. Approved corrections can trigger automated card reissuance.
          </p>

          {corrections.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
              No card correction requests currently pending.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {corrections.map(req => (
                <div
                  key={req.id}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    background: req.status === 'OPEN' ? '#FFFFFF' : '#F8FAFC',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0B203E', fontSize: '0.95rem' }}>
                        {req.alumniName} ({req.alumniNumber})
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Requested on {new Date(req.createdAt).toLocaleString()} • Status: <strong style={{ color: req.status === 'OPEN' ? '#D97706' : req.status === 'RESOLVED' ? '#059669' : '#DC2626' }}>{req.status}</strong>
                      </div>
                    </div>

                    {req.status === 'OPEN' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={async () => {
                            const note = prompt('Resolution note for member:');
                            await membershipCardService.resolveCorrectionRequest(req.id, 'RESOLVED', currentUser, note || undefined);
                            showNotice('Correction request marked as RESOLVED.');
                            await loadAll();
                          }}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#059669' }}
                        >
                          <Check size={12} /> Approve / Resolve
                        </button>
                        <button
                          onClick={async () => {
                            const note = prompt('Rejection reason:');
                            await membershipCardService.resolveCorrectionRequest(req.id, 'REJECTED', currentUser, note || undefined);
                            showNotice('Correction request REJECTED.');
                            await loadAll();
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#DC2626' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', margin: '0.5rem 0' }}>
                    {req.fields.map((f, i) => (
                      <div key={i} style={{ background: '#F1F5F9', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                        <div style={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>{f.field}</div>
                        <div>Current: <del style={{ color: '#991B1B' }}>{f.currentValue}</del></div>
                        <div>Requested: <strong style={{ color: '#047857' }}>{f.requestedValue}</strong></div>
                      </div>
                    ))}
                  </div>

                  {req.note && (
                    <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginTop: '0.35rem' }}>
                      Member Note: "{req.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PREVIEW PERSONALIZED CARD */}
      {previewAlumnus && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <button
              onClick={() => setPreviewAlumnus(null)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', marginBottom: '0.2rem', fontWeight: 800 }}>
              Personalized ID Card Preview
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              {previewAlumnus.fullName || `${previewAlumnus.firstName} ${previewAlumnus.lastName}`} ({previewAlumnus.alumniNumber})
            </p>

            <DigitalMembershipCard
              alumnus={previewAlumnus}
              card={getCardForMember(previewAlumnus.internalId)}
              settings={settings}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: REISSUE JUSTIFICATION MODAL */}
      {reissueTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
          }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0B203E', marginBottom: '0.35rem', fontWeight: 800 }}>
              Authorized Card Reissuance
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Reissuing an ID card will assign a new, unique Validation Number to <strong>{reissueTarget.alumniNumber}</strong>. The old validation number will be permanently retired and invalidated in the public verification desk.
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Mandatory Reissuance Reason:
            </label>
            <textarea
              value={reissueReason}
              onChange={e => setReissueReason(e.target.value)}
              placeholder="e.g. Lost physical card badge; Updated legal name; Re-registration verification..."
              rows={3}
              required
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                onClick={() => setReissueTarget(null)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReissue}
                disabled={!reissueReason.trim()}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', background: '#D97706' }}
              >
                Confirm Reissuance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUANCE HISTORY MODAL */}
      {historyTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.75rem',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                Card Issuance History: {historyTarget.alumniNumber}
              </h3>
              <button onClick={() => setHistoryTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cards.filter(c => c.alumniId === historyTarget.internalId).map((c, i) => (
                <div key={c.id} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem', background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0B203E' }}>
                      {c.validationNumber}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: c.status === 'ISSUED' ? '#DCFCE7' : c.status === 'SUPERSEDED' ? '#FEF3C7' : '#FEE2E2',
                      color: c.status === 'ISSUED' ? '#166534' : c.status === 'SUPERSEDED' ? '#92400E' : '#991B1B',
                    }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Issue #{c.issueNumber} • Issued on {new Date(c.issuedAt).toLocaleString()} by {c.issuedBy}
                  </div>
                  {c.reissueReason && (
                    <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.25rem' }}>
                      Reissue Reason: {c.reissueReason}
                    </div>
                  )}
                  {c.supersededAt && (
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                      Superseded on: {new Date(c.supersededAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TEMPLATE & OFFICIAL SIGNATORIES SETTINGS */}
      {isSettingsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 21, 43, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                  Official ID Template Configuration
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.78rem', margin: 0 }}>
                  Manage authorized association signatories and contact details.
                </p>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                await membershipCardService.updateCardSettings(settings, currentUser);
                showNotice('Official card template settings updated successfully.');
                setIsSettingsModalOpen(false);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              {/* Association Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                  Association Name (Printed on Band):
                </label>
                <input
                  type="text"
                  value={settings.associationName}
                  onChange={e => setSettings({ ...settings, associationName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Official Contact Phone Numbers */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                  Official Phone Numbers (Comma Separated):
                </label>
                <input
                  type="text"
                  value={settings.phoneNumbers.join(', ')}
                  onChange={e => setSettings({ ...settings, phoneNumbers: e.target.value.split(',').map(s => s.trim()) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Email & Website */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                    Secretariat Email:
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                    Official Website:
                  </label>
                  <input
                    type="text"
                    value={settings.website}
                    onChange={e => setSettings({ ...settings, website: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Signatories */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                    Signatory 1 Title:
                  </label>
                  <input
                    type="text"
                    value={settings.chairmanMosa.title}
                    onChange={e => setSettings({ ...settings, chairmanMosa: { ...settings.chairmanMosa, title: e.target.value } })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                    Signatory 2 Title:
                  </label>
                  <input
                    type="text"
                    value={settings.chairmanBog.title}
                    onChange={e => setSettings({ ...settings, chairmanBog: { ...settings.chairmanBog, title: e.target.value } })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Cohort Year Basis */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                  Printed Cohort Year Basis:
                </label>
                <select
                  value={settings.cohortYearBasis}
                  onChange={e => setSettings({ ...settings, cohortYearBasis: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  <option value="ENTRY">Entry Year (Default template standard e.g. 2012)</option>
                  <option value="COMPLETION">Departure / Completion Year</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', background: '#0B203E' }}
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipCardAdmin;
