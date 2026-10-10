import React from 'react';
import { SystemAnalytics } from '../types';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  Users, 
  Landmark, 
  Coins, 
  Calendar 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analytics: SystemAnalytics | null;
}

export const AGMReportModal: React.FC<Props> = ({ isOpen, onClose, analytics }) => {
  if (!isOpen || !analytics) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatUGX = (val: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '850px', 
          width: '95%', 
          maxHeight: '92vh', 
          padding: 0, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '16px',
          background: '#FFFFFF'
        }}
      >
        {/* Printable Document Area */}
        <div id="mosa-agm-report-content" style={{ padding: '2.5rem', overflowY: 'auto', flex: 1, background: '#FFFFFF' }}>
          
          {/* Official Letterhead */}
          <div style={{ textAlign: 'center', borderBottom: '3px double #0B203E', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                background: '#0B203E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                fontWeight: 800,
                fontSize: '1.3rem',
                border: '2px solid #D97706'
              }}>
                MASSH
              </div>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: '1.5rem', color: '#0B203E', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                  Mandela Old Students Association (MOSA)
                </h1>
                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  Mandela Secondary School Hoima • Founded 1997 • Bunyoro Sub-Region
                </div>
                <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700, letterSpacing: '0.05em' }}>
                  OFFICIAL ANNUAL EXECUTIVE REPORT & STATISTICAL COMPENDIUM ({currentYear})
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
              Presented to the MOSA General Assembly & School Board of Governors • Ref: MOSA/AGM/{currentYear}/001
            </div>
          </div>

          {/* Section 1: Executive Overview Summary */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} color="#D97706" /> 1. Executive Performance Highlights
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
              In accordance with Section 16 of the Association Charter, the MOSA Executive Committee presents the official statistical audit of alumni affairs for Mandela Secondary School Hoima. Since establishment in 1997, the association has united thousands of scholars who have progressed into national leadership, academia, medicine, and entrepreneurship.
            </p>

            {/* 4 Primary KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Verified Alumni</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
                  {analytics.totalVerified}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#059669' }}>MA. 0001–MA. {String(analytics.totalVerified).padStart(4, '0')}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>University Chapters</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', marginTop: '2px' }}>
                  {analytics.chapters.totalChapters}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#2563EB' }}>{analytics.chapters.totalChapterMemberships} active rosters</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Funds Mobilized</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {formatUGX(analytics.finances.totalVerifiedUGX)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Dues & Campaigns</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Event Attendance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                  {analytics.events.averageAttendanceRate}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Average Turnout</div>
              </div>
            </div>
          </div>

          {/* Section 2: Cohort & Academic History Analysis */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="#D97706" /> 2. Cohort Demographics & School History (MASSH)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Table of Levels */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Education Stream Distribution:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Both O-Level & A-Level (Full MASSH):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.levelsBreakdown.bothLevels} alumni</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Ordinary Level Only (O-Level):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.levelsBreakdown.oLevelOnly} alumni</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Advanced Level Only (A-Level):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.levelsBreakdown.aLevelOnly} alumni</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 700 }}>Total Verified Database:</td>
                      <td style={{ padding: '6px 0', fontWeight: 800, textAlign: 'right', color: '#059669' }}>{analytics.totalVerified} alumni</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table of Cohorts */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Generational Cohort Clusters:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Pioneer Era (1997–2005):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.cohortBreakdown.pioneers1997_2005} alumni</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Expansion Era (2006–2015):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.cohortBreakdown.years2006_2015} alumni</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Silver Jubilee Era (2016–2020):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.cohortBreakdown.years2016_2020} alumni</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Recent Graduates (2021–Present):</td>
                      <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right', color: '#0B203E' }}>{analytics.cohortBreakdown.years2021_present} alumni</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: University Chapter Status */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={18} color="#D97706" /> 3. Institutional Chapter Enrollments
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', border: '1px solid #E2E8F0' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Chapter Code</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Association Chapter Name</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Host University</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Members</th>
                </tr>
              </thead>
              <tbody>
                {analytics.chapters.distribution.map(c => (
                  <tr key={c.code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0B203E' }}>{c.code}</td>
                    <td style={{ padding: '6px 10px' }}>{c.name}</td>
                    <td style={{ padding: '6px 10px', color: '#64748B' }}>{c.institution}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 700, textAlign: 'right', color: '#059669' }}>{c.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Financial Governance & Philanthropy */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={18} color="#D97706" /> 4. Financial Audit & Dues Compliance
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.5rem' }}>Annual Dues Compliance ({currentYear})</div>
                <div>• Fully Paid Voting Members: <strong>{analytics.duesCompliance.activePaidCount}</strong></div>
                <div>• Outstanding / Renewal Due: <strong>{analytics.duesCompliance.dueCount}</strong></div>
                <div>• Association Compliance Rate: <strong style={{ color: '#059669' }}>{analytics.duesCompliance.complianceRate}%</strong></div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.5rem' }}>Revenue Breakdown (UGX)</div>
                <div>• Annual Membership Dues: <strong>{formatUGX(analytics.finances.duesCollectedUGX)}</strong></div>
                <div>• School Projects & Bursary: <strong>{formatUGX(analytics.finances.campaignsRaisedUGX)}</strong></div>
                <div>• Event Tickets & Galas: <strong>{formatUGX(analytics.finances.eventRevenueUGX)}</strong></div>
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '4px', marginTop: '4px', fontWeight: 800, color: '#059669' }}>
                  Total Verified Treasury: {formatUGX(analytics.finances.totalVerifiedUGX)}
                </div>
              </div>
            </div>
          </div>

          {/* Attestation & Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '2px solid #0B203E' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #94A3B8', paddingBottom: '4px', marginBottom: '4px' }}>
                Muhammad Zatusave
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B203E' }}>Muhammad Zatusave</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>President, MOSA Executive Committee</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Alumnus MA. 0001</div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                border: '2px dashed #059669', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto',
                color: '#059669',
                fontSize: '0.65rem',
                fontWeight: 800,
                textAlign: 'center',
                textTransform: 'uppercase',
                lineHeight: '1.2'
              }}>
                MOSA<br/>OFFICIAL<br/>SEAL
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#0B203E', borderBottom: '1px solid #94A3B8', paddingBottom: '4px', marginBottom: '4px' }}>
                Dr. Patrick Mugisa
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0B203E' }}>Dr. Patrick Mugisa</div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Secretary General, MOSA</div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Office of the Secretariat</div>
            </div>
          </div>

        </div>

        {/* Modal Action Controls */}
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            <X size={16} /> Close Report
          </button>

          <button 
            type="button" 
            onClick={handlePrint} 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> Print / Save AGM Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
