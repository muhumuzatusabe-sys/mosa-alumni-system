import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Coins, 
  Calendar, 
  Download, 
  Printer, 
  ShieldCheck, 
  Award, 
  MapPin, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import { SystemAnalytics, AuthUser } from '../types';
import { dataService } from '../services/dataService';
import { AGMReportModal } from './AGMReportModal';

interface Props {
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
}

export const AnalyticsHub: React.FC<Props> = ({ currentUser, onOpenAuth }) => {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAGMModalOpen, setIsAGMModalOpen] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await dataService.getSystemAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load system analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUGX = (val: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = async () => {
    if (!analytics) return;
    try {
      const alumni = await dataService.getAlumniList();
      
      // Build CSV rows
      const headers = [
        'Alumni Number',
        'Full Name',
        'Email',
        'Phone',
        'Gender',
        'O-Level Year',
        'A-Level Year',
        'A-Level Combination',
        'Chapter Affiliation',
        'City',
        'Country',
        'Occupation',
        'Employer',
        'Membership Status',
        'Verified Date'
      ];

      const rows = alumni.map(a => [
        `"${a.alumniNumber}"`,
        `"${[a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')}"`,
        `"${a.email}"`,
        `"${a.phone}"`,
        `"${a.gender || ''}"`,
        `"${a.schoolHistory?.oLevel?.yearCompleted || ''}"`,
        `"${a.schoolHistory?.aLevel?.yearCompleted || ''}"`,
        `"${a.schoolHistory?.aLevel?.combination || ''}"`,
        `"${a.currentInstitution || ''}"`,
        `"${a.city || ''}"`,
        `"${a.country || ''}"`,
        `"${a.occupation || ''}"`,
        `"${a.organisation || ''}"`,
        `"${a.membershipStatus || 'ACTIVE'}"`,
        `"${a.verifiedAt ? new Date(a.verifiedAt).toLocaleDateString() : ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MOSA_Alumni_Master_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to generate export file. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
        <h3 style={{ color: '#0B203E' }}>Aggregating MOSA Strategic Analytics...</h3>
        <p style={{ color: '#64748B' }}>Synthesizing records from MASSH registry, university chapters, and treasury.</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#DC2626' }}>Failed to load analytics data.</p>
      </div>
    );
  }

  const { levelsBreakdown, cohortBreakdown, duesCompliance, finances, chapters, events, topLocations, topProfessions } = analytics;
  const totalLevels = (levelsBreakdown.oLevelOnly + levelsBreakdown.aLevelOnly + levelsBreakdown.bothLevels) || 1;
  const oPct = Math.round((levelsBreakdown.oLevelOnly / totalLevels) * 100);
  const aPct = Math.round((levelsBreakdown.aLevelOnly / totalLevels) * 100);
  const bothPct = Math.round((levelsBreakdown.bothLevels / totalLevels) * 100);

  const totalCohorts = (cohortBreakdown.pioneers1997_2005 + cohortBreakdown.years2006_2015 + cohortBreakdown.years2016_2020 + cohortBreakdown.years2021_present) || 1;

  return (
    <div className="analytics-hub" style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem 4rem 1.5rem' }}>
      
      {/* Top Banner / Actions */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #0B203E 0%, #153A6D 100%)',
        padding: '2rem 2.25rem',
        borderRadius: '18px',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px -5px rgba(11, 32, 62, 0.25)'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(217, 119, 6, 0.25)', border: '1px solid rgba(217, 119, 6, 0.4)', padding: '0.35rem 0.85rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, color: '#FDE68A', marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> Official MOSA Secretariat Intelligence
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            MOSA Executive Analytics &amp; Impact
          </h1>
          <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Real-time demographic, educational stream, chapter mobilization, and treasury metrics for 
            Mandela Secondary School Hoima (MASSH, Est. 1997).
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button 
            id="print-agm-report-btn"
            onClick={() => setIsAGMModalOpen(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#D97706', 
              color: '#FFFFFF', 
              border: 'none', 
              padding: '0.75rem 1.25rem', 
              borderRadius: '10px', 
              fontWeight: 700, 
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Printer size={17} />
            <span>Print Executive AGM Report</span>
          </button>

          <button 
            id="export-csv-btn"
            onClick={handleExportCSV}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255, 255, 255, 0.12)', 
              color: '#FFFFFF', 
              border: '1px solid rgba(255, 255, 255, 0.25)', 
              padding: '0.75rem 1.25rem', 
              borderRadius: '10px', 
              fontWeight: 600, 
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={17} />
            <span>Export Registry CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Key Executive Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2rem' 
      }}>
        {/* Card 1: Verified Alumni */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: '1.5rem', 
          borderRadius: '14px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Alumni
              </span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(11, 32, 62, 0.08)', color: '#0B203E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0B203E', lineHeight: 1.1 }}>
              {analytics.totalVerified}
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <CheckCircle2 size={15} />
            <span>{analytics.verificationRate}% of {analytics.totalRegistered} registered candidates</span>
          </div>
        </div>

        {/* Card 2: Mobilized Funds */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: '1.5rem', 
          borderRadius: '14px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Treasury Mobilized
              </span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0B203E', lineHeight: 1.1 }}>
              {formatUGX(finances.totalVerifiedUGX)}
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <TrendingUp size={15} color="#D97706" />
            <span>Includes Dues, Donations &amp; Tickets</span>
          </div>
        </div>

        {/* Card 3: University Chapters */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: '1.5rem', 
          borderRadius: '14px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Institutional Chapters
              </span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0B203E', lineHeight: 1.1 }}>
              {chapters.totalChapters}
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={15} color="#2563EB" />
            <span><strong>{chapters.totalChapterMemberships}</strong> total student &amp; alumni members</span>
          </div>
        </div>

        {/* Card 4: Event Participation Rate */}
        <div style={{ 
          background: '#FFFFFF', 
          padding: '1.5rem', 
          borderRadius: '14px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Turnout &amp; Attendance
              </span>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0B203E', lineHeight: 1.1 }}>
              {events.averageAttendanceRate}%
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} color="#059669" />
            <span><strong>{events.totalAttendees}</strong> verified checked-in of {events.totalRegistrations}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Demographic & Educational Stream Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Stream Breakdown: O-Level vs A-Level vs Both */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <GraduationCap size={22} color="#0B203E" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              MASSH Educational Stream Distribution
            </h3>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
            Mandela SS Hoima offers both O-Level (UCE) and A-Level (UACE). Breakdown of alumni academic pathways:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span style={{ color: '#0B203E' }}>Both O-Level &amp; A-Level (Full MASSH Journey)</span>
                <span style={{ color: '#0B203E' }}>{levelsBreakdown.bothLevels} ({bothPct}%)</span>
              </div>
              <div style={{ height: '9px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bothPct}%`, background: 'linear-gradient(90deg, #0B203E, #1E40AF)', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span style={{ color: '#D97706' }}>A-Level Only (Joined at S.5)</span>
                <span style={{ color: '#D97706' }}>{levelsBreakdown.aLevelOnly} ({aPct}%)</span>
              </div>
              <div style={{ height: '9px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${aPct}%`, background: 'linear-gradient(90deg, #D97706, #F59E0B)', borderRadius: '6px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <span style={{ color: '#059669' }}>O-Level Only (S.1–S.4)</span>
                <span style={{ color: '#059669' }}>{levelsBreakdown.oLevelOnly} ({oPct}%)</span>
              </div>
              <div style={{ height: '9px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${oPct}%`, background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: '6px' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="#D97706" />
            <span>Alumni completing both O and A-Level form the core voting backbone of general assemblies.</span>
          </div>
        </div>

        {/* Generational Cohorts */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Layers size={22} color="#0B203E" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              Generational Cohort Distribution
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
            Classification by graduation era from MASSH founding in 1997 through contemporary years:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Pioneers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#0B203E' }}>Pioneers (1997 – 2005)</span>
                <span style={{ fontWeight: 700, color: '#0B203E' }}>{cohortBreakdown.pioneers1997_2005}</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((cohortBreakdown.pioneers1997_2005 / totalCohorts) * 100)}%`, background: '#8B5CF6' }} />
              </div>
            </div>

            {/* 2006-2015 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#0B203E' }}>Expansion Era (2006 – 2015)</span>
                <span style={{ fontWeight: 700, color: '#0B203E' }}>{cohortBreakdown.years2006_2015}</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((cohortBreakdown.years2006_2015 / totalCohorts) * 100)}%`, background: '#3B82F6' }} />
              </div>
            </div>

            {/* 2016-2020 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#0B203E' }}>Silver Era (2016 – 2020)</span>
                <span style={{ fontWeight: 700, color: '#0B203E' }}>{cohortBreakdown.years2016_2020}</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((cohortBreakdown.years2016_2020 / totalCohorts) * 100)}%`, background: '#10B981' }} />
              </div>
            </div>

            {/* 2021-Present */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: '#0B203E' }}>Contemporary (2021 – Present)</span>
                <span style={{ fontWeight: 700, color: '#0B203E' }}>{cohortBreakdown.years2021_present}</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((cohortBreakdown.years2021_present / totalCohorts) * 100)}%`, background: '#F59E0B' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Male</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>{analytics.genderBreakdown.male}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Female</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>{analytics.genderBreakdown.female}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Gender Ratio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>
                {Math.round((analytics.genderBreakdown.male / (analytics.genderBreakdown.male + analytics.genderBreakdown.female || 1)) * 100)}% M
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Dues & Solvency + University Chapters Ranking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Treasury & Dues Compliance */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Coins size={22} color="#D97706" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              Treasury &amp; Dues Compliance
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Annual Dues Compliance</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B203E' }}>
                {duesCompliance.complianceRate}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>{duesCompliance.activePaidCount} In Good Standing</span>
              <div style={{ fontSize: '0.8rem', color: '#DC2626', fontWeight: 600 }}>{duesCompliance.dueCount} Pending Dues</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>Annual Membership Dues:</span>
              <strong style={{ color: '#0B203E' }}>{formatUGX(finances.duesCollectedUGX)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>Philanthropy &amp; Projects:</span>
              <strong style={{ color: '#0B203E' }}>{formatUGX(finances.campaignsRaisedUGX)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>Event Registrations &amp; Tickets:</span>
              <strong style={{ color: '#0B203E' }}>{formatUGX(finances.eventRevenueUGX)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '0.25rem' }}>
              <strong style={{ color: '#0B203E' }}>Total Net Mobilized:</strong>
              <strong style={{ color: '#D97706' }}>{formatUGX(finances.totalVerifiedUGX)}</strong>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={15} color="#10B981" />
            <span>Audited against verified MTN MoMo, Airtel Money, and Stanbic Bank accounts.</span>
          </div>
        </div>

        {/* University Chapter Leaderboard */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Building2 size={22} color="#0B203E" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              University Chapter Mobilization
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {chapters.distribution.map((ch, idx) => (
              <div 
                key={ch.code} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 1rem', 
                  background: idx === 0 ? 'rgba(11, 32, 62, 0.04)' : '#FFFFFF', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '10px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: idx === 0 ? '#D97706' : '#0B203E', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700, 
                    fontSize: '0.75rem' 
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0B203E', display: 'block' }}>
                      {ch.name} ({ch.code})
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{ch.institution}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B203E' }}>
                    {ch.memberCount}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>members</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Chapters bridge MASSH alumni through tertiary training and career mentorship.
            </span>
          </div>
        </div>

      </div>

      {/* Row 4: Geographic Spread & Professional Domains */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Geographic Hubs */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <MapPin size={22} color="#DC2626" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              Alumni Geographic Footprint
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
            Key regional concentrations of verified MASSH alumni across Uganda and global diaspora:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topLocations.map((loc, i) => (
              <div key={loc.location} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{loc.location}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', background: '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  {loc.count} alumni
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Impact Sectors */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Briefcase size={22} color="#2563EB" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0B203E' }}>
              Professional Domains &amp; Industry Impact
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
            Top career classifications recorded in verified MOSA member profiles:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topProfessions.map((prof) => (
              <div key={prof.profession} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFC', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{prof.profession}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', background: '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  {prof.count} alumni
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Official Secretariat Footnote / Verification Stamp */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
        <p style={{ margin: 0 }}>
          Mandela Old Students Association (MOSA) • Mandela Secondary School Hoima • P.O. Box 412, Hoima, Uganda
        </p>
        <p style={{ margin: '0.35rem 0 0 0' }}>
          Data synchronized with official MASSH permanent registry &amp; atomic MA number sequence.
        </p>
      </div>

      {/* Executive Printable AGM Modal */}
      <AGMReportModal 
        isOpen={isAGMModalOpen}
        onClose={() => setIsAGMModalOpen(false)}
        analytics={analytics}
      />
    </div>
  );
};
