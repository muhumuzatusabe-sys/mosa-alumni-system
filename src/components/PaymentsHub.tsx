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
  Coins, 
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
  ArrowLeft
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
    setPayDefaultAmount(50000);
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

  // User's own payments or sample statement
  const userFiltered = currentUser?.alumniNumber
    ? payments.filter(p => p.alumniNumber.toUpperCase() === currentUser.alumniNumber?.toUpperCase() || (currentAlumnus && p.alumniId === currentAlumnus.internalId))
    : [];
  const myPayments = userFiltered.length > 0 ? userFiltered : payments.slice(0, 5);

  // Statement Metrics (NSSF GO-Inspired Statement Experience)
  const myTotalContributions = myPayments.reduce((acc, p) => p.status === 'VERIFIED' ? acc + p.amount : acc, 0);
  const myTotalGiving = myPayments.filter(p => p.status === 'VERIFIED' && p.category !== 'ANNUAL_MEMBERSHIP').reduce((acc, p) => acc + p.amount, 0);
  const myRecentContribution = myPayments.length > 0 ? myPayments[0].amount : 0;
  const myCampaignContributions = myPayments.filter(p => p.status === 'VERIFIED' && (p.category === 'PROJECT_DONATION' || p.campaignId)).reduce((acc, p) => acc + p.amount, 0);

  const currentYear = new Date().getFullYear();
  const isDuesCurrent = currentAlumnus?.membershipStatus === 'ACTIVE' && (currentAlumnus?.membershipPaidUntilYear || 0) >= currentYear;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Hero / Executive Metrics Header */}
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
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '1rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
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
                MOSA PHILANTHROPY & GIVING
              </span>
              <span style={{ color: '#93C5FD', fontSize: '0.8rem' }}>Mandela Secondary School Hoima</span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Donations &amp; Giving
            </h1>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '640px', lineHeight: '1.5' }}>
              Supporting Mandela Secondary School Hoima through voluntary alumni philanthropy, school project campaigns, and transparent giving records.
            </p>
          </div>

          {/* Voluntary Quick Actions Header */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setPayDefaultCategory('PROJECT_DONATION');
                setPayDefaultCampaignId(campaigns[0]?.id);
                setPayDefaultAmount(100000);
                setIsPayModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#059669', borderColor: '#059669' }}
            >
              <HeartHandshake size={18} /> Donate to Project
            </button>

            <button
              onClick={() => setActiveTab('my-history')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Receipt size={18} /> Giving History
            </button>

            {isAdmin && (
              <button
                onClick={() => { setCampaignToEdit(null); setIsCampaignModalOpen(true); }}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Plus size={16} /> New Campaign
              </button>
            )}
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={16} /> Total Funds Verified
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem', color: '#34D399' }}>
              {financialStats ? formatUGX(financialStats.totalVerifiedAmount) : '...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              {financialStats?.verifiedCount || 0} verified official receipts issued
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} /> Active School Projects
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem', color: '#FBBF24' }}>
              {campaigns.filter(c => c.status === 'ACTIVE').length} Projects
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              Science labs, student bursary &amp; sports pavilion
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <div style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} /> My Giving Record
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.4rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={20} />
              {currentUser?.alumniNumber ? (myTotalContributions > 0 ? `UGX ${myTotalContributions.toLocaleString()}` : 'Registered Member') : 'Sign In to Check'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
              {currentUser?.alumniNumber ? `${currentUser.alumniNumber} • Voluntary giving records` : 'Alumni portal authentication required'}
            </div>
          </div>

          {isAdmin && (
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ color: '#FCA5A5', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Pending Verifications
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem', color: '#F87171' }}>
                {financialStats?.pendingCount || 0} Awaiting
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '4px' }}>
                Reconcile with MoMo/Bank statements
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid #E2E8F0', 
        marginBottom: '1.75rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'campaigns' ? '3px solid #0B203E' : '3px solid transparent',
            color: activeTab === 'campaigns' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'campaigns' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <HeartHandshake size={18} /> Projects ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('dues')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'dues' ? '3px solid #0B203E' : '3px solid transparent',
            color: activeTab === 'dues' ? '#0B203E' : '#64748B',
            fontWeight: activeTab === 'dues' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Award size={18} /> Annual Contribution
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('my-history')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'my-history' ? '3px solid #0B203E' : '3px solid transparent',
              color: activeTab === 'my-history' ? '#0B203E' : '#64748B',
              fontWeight: activeTab === 'my-history' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Receipt size={18} /> Giving History ({myPayments.length})
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('treasurer-desk')}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'treasurer-desk' ? '3px solid #0B203E' : '3px solid transparent',
              color: activeTab === 'treasurer-desk' ? '#0B203E' : '#64748B',
              fontWeight: activeTab === 'treasurer-desk' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldCheck size={18} /> Treasurer Verification Desk
            {financialStats?.pendingCount > 0 && (
              <span style={{ 
                background: '#EF4444', 
                color: '#FFFFFF', 
                fontSize: '0.7rem', 
                padding: '1px 6px', 
                borderRadius: '9999px', 
                fontWeight: 700 
              }}>
                {financialStats.pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SCHOOL DEVELOPMENT CAMPAIGNS                            */}
      {/* ============================================================== */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {campaigns.map(camp => {
              const pct = Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100));

              return (
                <div 
                  key={camp.id} 
                  className="mosa-card" 
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
                >
                  <div style={{ position: 'relative', height: '180px', background: '#0B203E', overflow: 'hidden' }}>
                    <img 
                      src={camp.coverImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'} 
                      alt={camp.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(11, 32, 62, 0.85)', backdropFilter: 'blur(4px)', color: '#FFFFFF', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {camp.category}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#0B203E', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                      {camp.title}
                    </h3>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem', flex: 1 }}>
                      {camp.description}
                    </p>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{formatUGX(camp.raisedAmount)}</span>
                        <span style={{ color: '#64748B' }}>Goal: {formatUGX(camp.targetAmount)}</span>
                      </div>
                      <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${pct}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #10B981, #059669)', 
                          borderRadius: '4px' 
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                        <span>{pct}% Funded</span>
                        <span>{camp.donorCount} Generous Donors</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleOpenDonateForCampaign(camp.id)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <HeartHandshake size={16} /> Donate to This Project
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
                    Suggested Annual Contribution
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
                    UGX 50,000 <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>/ calendar year (Voluntary)</span>
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
                <HeartHandshake size={18} /> Make Voluntary Contribution (UGX 50,000)
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
