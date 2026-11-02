import React, { useState, useEffect } from 'react';
import { 
  AuthUser, 
  AlumniProfile, 
  DonationCampaign, 
  PaymentTransaction, 
  PaymentCategory, 
  PaymentStatus 
} from '../types';
import { dataService } from '../services/dataService';
import { 
  TrendingUp, 
  HeartHandshake, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ShieldCheck, 
  Receipt, 
  CreditCard, 
  ExternalLink,
  Users,
  Award,
  Calendar,
  XCircle,
  Eye,
  Settings,
  ArrowLeft,
  Info,
  X
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CampaignFormModal } from './CampaignFormModal';
import { TreasurySettingsModal } from './TreasurySettingsModal';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onBack?: () => void;
}

export const PaymentsHub: React.FC<Props> = ({ currentUser, onOpenAuth, onBack }) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'dues' | 'my-history' | 'treasurer-desk'>('campaigns');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTreasurySettingsOpen, setIsTreasurySettingsOpen] = useState(false);
  
  // Data state
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [currentAlumnus, setCurrentAlumnus] = useState<AlumniProfile | null>(null);
  const [financialStats, setFinancialStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Treasurer Desk
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payDefaultCategory, setPayDefaultCategory] = useState<PaymentCategory>('ANNUAL_MEMBERSHIP');
  const [payDefaultCampaignId, setPayDefaultCampaignId] = useState<string | undefined>(undefined);
  const [payDefaultAmount, setPayDefaultAmount] = useState<number | undefined>(undefined);

  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentTransaction | null>(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<DonationCampaign | null>(null);

  // Treasurer action state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [camps, allPayments, stats] = await Promise.all([
        dataService.getDonationCampaigns(),
        dataService.getPayments(),
        dataService.getFinancialSummary(),
      ]);
      setCampaigns(camps);
      setPayments(allPayments);
      setFinancialStats(stats);

      if (currentUser?.alumniNumber) {
        const profile = await dataService.getAlumniByNumber(currentUser.alumniNumber);
        setCurrentAlumnus(profile);
      }
    } catch (e) {
      console.error('Failed to load financial records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  const handleOpenDonateForCampaign = (campaignId: string) => {
    setPayDefaultCategory('PROJECT_DONATION');
    setPayDefaultCampaignId(campaignId);
    setPayDefaultAmount(100000);
    setIsPayModalOpen(true);
  };

  const handleOpenPayDues = () => {
    setPayDefaultCategory('ANNUAL_MEMBERSHIP');
    setPayDefaultCampaignId(undefined);
    setPayDefaultAmount(undefined);
    setIsPayModalOpen(true);
  };

  const handleVerify = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      const res = await dataService.verifyPayment(paymentId, currentUser?.email || 'admin@massh.ac.ug');
      if (res.success) {
        await loadAllData();
      } else {
        alert(res.error || 'Verification failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason (e.g. Invalid MoMo reference, funds not received).');
      return;
    }
    setProcessingId(paymentId);
    try {
      const res = await dataService.rejectPayment(paymentId, rejectionReason.trim(), currentUser?.email || 'admin@massh.ac.ug');
      if (res.success) {
        setRejectingId(null);
        setRejectionReason('');
        await loadAllData();
      } else {
        alert(res.error || 'Failed to reject payment');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Alumni Number', 'Name', 'Email', 'Phone', 'Category', 'Amount (UGX)', 'Method', 'Reference', 'Status', 'Verified By'];
    const rows = payments.map(p => [
      `"${p.receiptNumber || 'N/A'}"`,
      `"${new Date(p.submittedAt).toLocaleDateString('en-GB')}"`,
      `"${p.alumniNumber}"`,
      `"${p.alumniName}"`,
      `"${p.alumniEmail}"`,
      `"${p.alumniPhone || ''}"`,
      `"${p.category}"`,
      p.amount,
      `"${p.paymentMethod}"`,
      `"${p.transactionReference}"`,
      `"${p.status}"`,
      `"${p.verifiedBy || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MOSA_Financial_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatUGX = (val: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered payments for Treasurer Desk
  const filteredDeskPayments = payments.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.alumniName.toLowerCase().includes(q);
      const matchNum = p.alumniNumber.toLowerCase().includes(q);
      const matchRef = p.transactionReference.toLowerCase().includes(q);
      const matchRcp = p.receiptNumber?.toLowerCase().includes(q);
      return matchName || matchNum || matchRef || matchRcp;
    }
    return true;
  });

  // User's own payments
  const userFiltered = currentUser?.alumniNumber
    ? payments.filter(p => p.alumniNumber.toUpperCase() === currentUser.alumniNumber?.toUpperCase() || (currentAlumnus && p.alumniId === currentAlumnus.internalId))
    : [];
  const myPayments = userFiltered;

  // Statement Metrics (NSSF GO-Inspired Statement Experience)
  const myTotalContributions = myPayments.reduce((acc, p) => p.status === 'VERIFIED' ? acc + p.amount : acc, 0);
  const myTotalGiving = myPayments.filter(p => p.status === 'VERIFIED' && p.category !== 'ANNUAL_MEMBERSHIP').reduce((acc, p) => acc + p.amount, 0);
  const myRecentContribution = myPayments.length > 0 ? myPayments[0].amount : 0;
  const myCampaignContributions = myPayments.filter(p => p.status === 'VERIFIED' && (p.category === 'PROJECT_DONATION' || p.campaignId)).reduce((acc, p) => acc + p.amount, 0);

  const currentYear = new Date().getFullYear();
  const isDuesCurrent = currentAlumnus?.membershipStatus === 'ACTIVE' && (currentAlumnus?.membershipPaidUntilYear || 0) >= currentYear;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. COMPACT ONE-PAGE TOP BAR                                   */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginBottom: '1.25rem' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#0B203E', letterSpacing: '-0.01em' }}>
              Donations &amp; Giving
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
              Mandela Secondary School Hoima • Voluntary Projects &amp; Philanthropy
            </div>
          </div>

          {/* Action Buttons: Donate to Project, Giving History, Clean Simple About */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => {
                setPayDefaultCategory('PROJECT_DONATION');
                setPayDefaultCampaignId(campaigns[0]?.id);
                setPayDefaultAmount(100000);
                setIsPayModalOpen(true);
              }}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0A271B',
                borderColor: '#0A271B',
                color: '#FFFFFF',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(10, 39, 27, 0.25)'
              }}
            >
              <HeartHandshake size={16} color="#FDE68A" />
              <span>Donate to Project</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'my-history' ? 'campaigns' : 'my-history')}
              style={{
                padding: '0.55rem 0.9rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeTab === 'my-history' ? '#0A271B' : '#FFFFFF',
                color: activeTab === 'my-history' ? '#FFFFFF' : '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <Receipt size={15} color={activeTab === 'my-history' ? '#FDE68A' : '#475569'} />
              <span>{activeTab === 'my-history' ? 'View Projects' : 'Giving History'}</span>
            </button>

            <button
              onClick={() => setIsAboutOpen(true)}
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#F8FAFC',
                color: '#0A271B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="About Voluntary Philanthropy & Impact"
            >
              <Info size={15} color="#14532D" />
              <span>About</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => { setCampaignToEdit(null); setIsCampaignModalOpen(true); }}
                  style={{
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>New Project</span>
                </button>

                <button
                  onClick={() => setActiveTab(activeTab === 'treasurer-desk' ? 'campaigns' : 'treasurer-desk')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: activeTab === 'treasurer-desk' ? '#0A271B' : '#FEF3C7',
                    color: activeTab === 'treasurer-desk' ? '#FFFFFF' : '#92400E',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Desk</span>
                  {financialStats?.pendingCount > 0 && (
                    <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 800 }}>
                      {financialStats.pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SCHOOL DEVELOPMENT CAMPAIGNS                            */}
      {/* ============================================================== */}
      {activeTab === 'campaigns' && (
        <div>
          {campaigns.length === 0 ? (
            <div className="mosa-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <HeartHandshake size={48} color="#94A3B8" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', marginBottom: '0.5rem' }}>No Active Campaigns</h3>
              <p style={{ color: '#64748B', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                No school development or fundraising campaigns have been launched yet.
              </p>
              {isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => { setCampaignToEdit(null); setIsCampaignModalOpen(true); }}
                >
                  <Plus size={16} /> Launch First Campaign
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {campaigns.map(camp => {
                const pct = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));

                return (
                  <div 
                    key={camp.id} 
                    className="mosa-card" 
                    style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
                  >
                  <div style={{ position: 'relative', height: '140px', background: '#0B203E', overflow: 'hidden' }}>
                    <img 
                      src={camp.coverImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'} 
                      alt={camp.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(11, 32, 62, 0.88)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {camp.category}
                    </div>
                  </div>

                  <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0B203E', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                      {camp.title}
                    </h3>
                    <p style={{ 
                      color: '#64748B', 
                      fontSize: '0.82rem', 
                      lineHeight: '1.4', 
                      marginBottom: '0.85rem', 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {camp.description}
                    </p>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#0A271B' }}>{formatUGX(camp.raisedAmount)}</span>
                        <span style={{ color: '#64748B' }}>Goal: {formatUGX(camp.targetAmount)}</span>
                      </div>
                      <div style={{ height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${pct}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #14532D, #0A271B)', 
                          borderRadius: '4px' 
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
                        <span>{pct}% Funded</span>
                        <span>{camp.donorCount} Donors</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleOpenDonateForCampaign(camp.id)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#0A271B', borderColor: '#0A271B', color: '#FFFFFF', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem' }}
                      >
                        <HeartHandshake size={15} color="#FDE68A" /> Donate to This Project
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => { setCampaignToEdit(camp); setIsCampaignModalOpen(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '0.65rem 0.85rem' }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}      {/* ============================================================== */}
      {/* TAB 2: VOLUNTARY ANNUAL ALUMNI CONTRIBUTION                    */}
      {/* ============================================================== */}
      {activeTab === 'dues' && (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="mosa-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '12px', 
                background: '#FEF3C7', 
                color: '#D97706', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Award size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                  Voluntary Annual Alumni Contribution
                </h2>
                <div style={{ color: '#64748B', fontSize: '0.9rem' }}>
                  Mandela Old Students Association • Supporting Association Programs &amp; Student Welfare
                </div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    Annual Contribution
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
                    Voluntary Amount <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ calendar year (Give as you wish)</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    display: 'inline-block',
                    background: isDuesCurrent ? '#ECFDF5' : '#F1F5F9', 
                    color: isDuesCurrent ? '#059669' : '#475569', 
                    fontWeight: 700, 
                    fontSize: '0.85rem', 
                    padding: '4px 12px', 
                    borderRadius: '9999px', 
                    border: isDuesCurrent ? '1px solid #A7F3D0' : '1px solid #CBD5E1'
                  }}>
                    {isDuesCurrent ? `Contributed for ${currentYear}` : 'Voluntary Support'}
                  </span>
                  {currentAlumnus && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                      Alumnus: <strong>{currentAlumnus.alumniNumber}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '0.75rem' }}>
              How Your Voluntary Contribution Empowers MASSH:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: '#334155' }}>
                <CheckCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Supports student bursaries, prizes, and academic awards</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: '#334155' }}>
                <CheckCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Funds career mentorship days and professional workshops</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: '#334155' }}>
                <CheckCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Provides alumni welfare &amp; community emergency support</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: '#059669' }}>
                <CheckCircle size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Coordinates university chapters, reunions &amp; annual homecomings</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleOpenPayDues}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#059669', borderColor: '#059669' }}
              >
                <HeartHandshake size={18} /> Make Voluntary Contribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MEMBER STATEMENT & GIVING HISTORY                        */}
      {/* ============================================================== */}
      {activeTab === 'my-history' && (
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          {/* Statement Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                Giving History &amp; Statements
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                Complete audit trail of all verified alumni subscriptions and project contributions
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleOpenPayDues}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#059669', borderColor: '#059669' }}
              >
                <Plus size={16} /> Submit Contribution
              </button>
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Download Official Statement (CSV)"
              >
                <Download size={15} /> Export Statement
              </button>
            </div>
          </div>

          {/* 4 Statement Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Contributions
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>
                {formatUGX(myTotalContributions)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', fontWeight: 600 }}>
                Verified by MOSA Treasury
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Giving (Donations)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                {formatUGX(myTotalGiving)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Special school projects &amp; welfare
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Recent Contribution
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>
                {formatUGX(myRecentContribution)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                {myPayments.length > 0 ? new Date(myPayments[0].submittedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Campaign Contributions
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>
                {formatUGX(myCampaignContributions)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                Bursary &amp; Science lab funds
              </div>
            </div>
          </div>

          {/* Clean Transaction List Table */}
          {myPayments.length === 0 ? (
            <div className="mosa-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <Receipt size={48} color="#CBD5E1" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#0B203E', marginBottom: '0.5rem' }}>No Payment Records Found</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                You have not submitted any dues or donation references under your verified alumni account yet.
              </p>
              <button onClick={handleOpenPayDues} className="btn btn-primary">
                Pay 2026 Annual Dues
              </button>
            </div>
          ) : (
            <div className="mosa-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.95rem' }}>
                  Transaction History &amp; Ledgers ({myPayments.length})
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Member Statement • Currency: UGX
                </span>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600 }}>Amount (UGX)</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600 }}>Contribution Category</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600 }}>Description &amp; Reference</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600 }}>Verification Status</th>
                    <th style={{ padding: '0.75rem 1.25rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1.25rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(p.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: '#0B203E', whiteSpace: 'nowrap' }}>
                        {formatUGX(p.amount)}
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0B203E' }}>
                          {p.category.replace('_', ' ')}
                        </div>
                        {p.campaignTitle && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                            {p.campaignTitle}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', color: '#475569' }}>
                        <div>{p.receiptNumber ? `Receipt: ${p.receiptNumber}` : 'Ref Pending'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                          {p.paymentMethod}: {p.transactionReference}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: p.status === 'VERIFIED' ? '#ECFDF5' : p.status === 'REJECTED' ? '#FEF2F2' : '#FEFCE8',
                          color: p.status === 'VERIFIED' ? '#059669' : p.status === 'REJECTED' ? '#DC2626' : '#854D0E',
                          border: p.status === 'VERIFIED' ? '1px solid #A7F3D0' : p.status === 'REJECTED' ? '1px solid #FECACA' : '1px solid #FEF08A'
                        }}>
                          {p.status === 'VERIFIED' ? <CheckCircle size={12} /> : p.status === 'REJECTED' ? <XCircle size={12} /> : <Clock size={12} />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {p.status === 'VERIFIED' ? (
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={13} /> View
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: TREASURER VERIFICATION DESK (ADMIN ONLY)                 */}
      {/* ============================================================== */}
      {activeTab === 'treasurer-desk' && isAdmin && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by MA. number, name, ref, receipt..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', width: '280px' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_VERIFICATION">Pending Verification Only</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Categories</option>
                <option value="ANNUAL_MEMBERSHIP">Annual Membership Dues</option>
                <option value="PROJECT_DONATION">Project Donations</option>
                <option value="EVENT_TICKET">Event Tickets</option>
                <option value="WELFARE_CONTRIBUTION">Welfare Contributions</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isAdmin && (
                <button
                  onClick={() => setIsTreasurySettingsOpen(true)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                  <Settings size={16} /> MoMo Receivers & Treasury
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
              >
                <Download size={16} /> Export Financial CSV
              </button>
            </div>
          </div>

          {/* Verification Table */}
          <div className="mosa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Alumnus</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Category & Purpose</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Amount (UGX)</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Channel & Ref</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Treasurer Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeskPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                      No payment records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredDeskPayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                        {new Date(p.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0B203E' }}>
                          {p.alumniName}
                        </div>
                        <span style={{ 
                          display: 'inline-block',
                          background: '#FEF3C7', 
                          color: '#92400E', 
                          fontWeight: 700, 
                          fontSize: '0.75rem', 
                          padding: '1px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {p.alumniNumber}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {p.category.replace('_', ' ')}
                        </div>
                        {p.campaignTitle && (
                          <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                            {p.campaignTitle}
                          </div>
                        )}
                        {p.notes && (
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            Note: {p.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0B203E' }}>
                        {formatUGX(p.amount)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#475569' }}>
                          {p.paymentMethod.replace('_', ' ')}
                        </div>
                        <code style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>
                          {p.transactionReference}
                        </code>
                        {p.payerPhoneOrAccount && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            Payer: {p.payerPhoneOrAccount}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: p.status === 'VERIFIED' ? '#ECFDF5' : p.status === 'REJECTED' ? '#FEF2F2' : '#FEFCE8',
                          color: p.status === 'VERIFIED' ? '#059669' : p.status === 'REJECTED' ? '#DC2626' : '#854D0E',
                        }}>
                          {p.status}
                        </span>
                        {p.receiptNumber && (
                          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                            {p.receiptNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        {p.status === 'PENDING_VERIFICATION' ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleVerify(p.id)}
                              disabled={processingId === p.id}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#059669', borderColor: '#059669' }}
                            >
                              {processingId === p.id ? 'Verifying...' : 'Verify'}
                            </button>

                            <button
                              onClick={() => setRejectingId(p.id)}
                              disabled={processingId === p.id}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#DC2626' }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : p.status === 'VERIFIED' ? (
                          <button
                            onClick={() => setSelectedReceiptPayment(p)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={12} /> View Receipt
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                            {p.rejectionReason || 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rejection Modal Dialog */}
          {rejectingId && (
            <div className="modal-backdrop" onClick={() => setRejectingId(null)} style={{ zIndex: 1200 }}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#DC2626', margin: '0 0 0.5rem 0' }}>
                  Reject Payment Record
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
                  Please state the reason for rejecting this payment submission so the alumnus can be notified:
                </p>
                <textarea
                  rows={3}
                  placeholder="e.g. Reference code not found on MTN MoMo merchant statement, or amount does not match..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button onClick={() => { setRejectingId(null); setRejectionReason(''); }} className="btn btn-secondary" style={{ padding: '4px 10px' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleReject(rejectingId)} className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', padding: '4px 12px' }}>
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* CLEAN SIMPLE ABOUT MODAL (EXTRA INFORMATION & POLICY DETAILS)   */}
      {/* ============================================================== */}
      {isAboutOpen && (
        <div 
          className="modal-backdrop"
          onClick={() => setIsAboutOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1.5px solid #E2E8F0',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#DCFCE7', color: '#0A271B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                    About Donations &amp; Giving
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Mandela Secondary School Hoima • Founded 1997
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAboutOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Description Body */}
            <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ margin: 0 }}>
                <strong>MOSA Philanthropy &amp; Giving</strong> is the official channel through which alumni, well-wishers, and partners voluntarily support the development of Mandela Secondary School Hoima.
              </p>

              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Verified Transparency Standard
                </div>
                <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>
                  Every contribution is reconciled by the MOSA Treasury with official Mobile Money &amp; Bank statements. Once verified, a signed digital receipt and permanent audit record are issued.
                </div>
              </div>

              {/* Verified Metrics Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ background: '#ECFDF5', borderRadius: '8px', padding: '0.75rem', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Total Verified Funds</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
                    {financialStats ? formatUGX(financialStats.totalVerifiedAmount) : 'UGX 0'}
                  </div>
                </div>

                <div style={{ background: '#FEF3C7', borderRadius: '8px', padding: '0.75rem', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 600 }}>Verified Receipts Issued</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#78350F', marginTop: '2px' }}>
                    {financialStats?.verifiedCount || 0} Receipts
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                <strong>Project Allocation Areas:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>Science and computer laboratory equipment upgrades</li>
                  <li>Academic scholarships and underprivileged student bursaries</li>
                  <li>Sports pavilion and co-curricular facility development</li>
                  <li>Alumni mentorship and career development programs</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsAboutOpen(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  background: '#0A271B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        currentUser={currentUser}
        currentAlumnus={currentAlumnus}
        campaigns={campaigns}
        defaultCategory={payDefaultCategory}
        defaultCampaignId={payDefaultCampaignId}
        defaultAmount={payDefaultAmount}
        onSuccess={loadAllData}
      />

      <ReceiptModal
        payment={selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
      />

      <CampaignFormModal
        isOpen={isCampaignModalOpen}
        onClose={() => { setIsCampaignModalOpen(false); setCampaignToEdit(null); }}
        campaignToEdit={campaignToEdit}
        adminEmail={currentUser?.email || 'admin@massh.ac.ug'}
        onSuccess={loadAllData}
      />

      <TreasurySettingsModal
        isOpen={isTreasurySettingsOpen}
        onClose={() => setIsTreasurySettingsOpen(false)}
        onUpdated={loadAllData}
      />
    </div>
  );
};
