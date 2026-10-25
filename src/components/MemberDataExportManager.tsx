import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Users, 
  ShieldCheck, 
  Clock, 
  Search,
  ExternalLink
} from 'lucide-react';
import { AuthUser, MemberExportFilter, LeadershipOffice } from '../types';
import { dataService } from '../services/dataService';

interface MemberDataExportManagerProps {
  currentUser: AuthUser;
}

export const MemberDataExportManager: React.FC<MemberDataExportManagerProps> = ({
  currentUser,
}) => {
  const [filter, setFilter] = useState<MemberExportFilter>({
    statusScope: 'ALL',
    cohortYear: 'ALL',
    officeId: 'ALL',
    searchTerm: '',
  });

  const [offices, setOffices] = useState<LeadershipOffice[]>([]);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generate available cohort years from 1997 to 2026
  const availableYears: number[] = [];
  for (let yr = 2026; yr >= 1997; yr--) {
    availableYears.push(yr);
  }

  useEffect(() => {
    const init = async () => {
      try {
        const [officesList, previewData] = await Promise.all([
          dataService.getLeadershipOffices(),
          dataService.getMembersForExport(filter),
        ]);
        setOffices(officesList);
        setPreviewCount(previewData.length);
      } catch (err) {
        console.error('Failed to load export options:', err);
      }
    };
    init();
  }, [filter]);

  const handleDownloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    setErrorMsg('');
    setExportingFormat('csv');
    try {
      const { filename, content } = await dataService.exportMembersToCsv(filter, currentUser);
      handleDownloadFile(filename, content, 'text/csv;charset=utf-8;');
      setSuccessMsg(`Successfully generated and downloaded ${filename}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to export CSV');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportXlsx = async () => {
    setErrorMsg('');
    setExportingFormat('xlsx');
    try {
      const { filename, content } = await dataService.exportMembersToXlsx(filter, currentUser);
      handleDownloadFile(filename, content, 'application/vnd.ms-excel;charset=utf-8;');
      setSuccessMsg(`Successfully generated and downloaded ${filename}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to export Excel file');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportPdf = async () => {
    setErrorMsg('');
    setExportingFormat('pdf');
    try {
      const { filename, doc } = await dataService.exportMembersToPdf(filter, currentUser);
      doc.save(filename);
      setSuccessMsg(`Successfully generated and downloaded ${filename}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to export PDF');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', color: '#FFFFFF' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: 800 }}>
          Secretariat Data Services
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.2rem 0' }}>
          Member Data & Registry Exports
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
          Download official member registers in Excel (.xlsx), CSV (.csv), or executive summary PDF reports with formula injection protection.
        </p>
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

      {/* Filters Card */}
      <div
        style={{
          background: 'rgba(10, 39, 27, 0.7)',
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#FCD34D', fontWeight: 800, fontSize: '0.88rem' }}>
          <Filter size={16} />
          <span>Configure Export Criteria</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
              Membership Standing
            </label>
            <select
              value={filter.statusScope}
              onChange={(e) => setFilter({ ...filter, statusScope: e.target.value as any })}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="ALL" style={{ background: '#0A271B' }}>All Records (Eligible & Pending)</option>
              <option value="VERIFIED" style={{ background: '#0A271B' }}>Verified Alumni Members Only</option>
              <option value="PENDING" style={{ background: '#0A271B' }}>Pending Verification Queue</option>
              <option value="UNREGISTERED" style={{ background: '#0A271B' }}>Unregistered User Accounts</option>
            </select>
          </div>

          {/* Cohort Year Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
              Cohort / Exit Year
            </label>
            <select
              value={filter.cohortYear}
              onChange={(e) => setFilter({ ...filter, cohortYear: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="ALL" style={{ background: '#0A271B' }}>All Cohorts (1997–2026)</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr} style={{ background: '#0A271B' }}>
                  Class of {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Leadership Office Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
              Leadership Portfolio
            </label>
            <select
              value={filter.officeId}
              onChange={(e) => setFilter({ ...filter, officeId: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="ALL" style={{ background: '#0A271B' }}>All Leaders & Members</option>
              {offices.map(o => (
                <option key={o.id} value={o.id} style={{ background: '#0A271B' }}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search term */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.35rem' }}>
              Filter by Keyword / Name / MA No.
            </label>
            <input
              type="text"
              value={filter.searchTerm || ''}
              onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
              placeholder="e.g. Mugisa or MA. 0001"
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                borderRadius: '6px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Live Filter Counter */}
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
            Matching Records: <strong style={{ color: '#FCD34D' }}>{previewCount} member(s)</strong> ready for export.
          </span>
          <button
            onClick={() => setFilter({ statusScope: 'ALL', cohortYear: 'ALL', officeId: 'ALL', searchTerm: '' })}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.76rem', cursor: 'pointer', padding: 0 }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Download Action Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Card 1: Excel (.xlsx) */}
        <div
          style={{
            background: 'rgba(10, 39, 27, 0.7)',
            border: '1.5px solid rgba(5, 150, 105, 0.4)',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} color="#34D399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Excel Spreadsheet
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 700 }}>.XLSX Format</span>
              </div>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Full XML spreadsheet with formatted header styles, column widths, typed dates, and spreadsheet formula injection sanitization.
            </p>
          </div>

          <button
            onClick={handleExportXlsx}
            disabled={exportingFormat !== null || previewCount === 0}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.7rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: previewCount === 0 || exportingFormat !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
            }}
          >
            {exportingFormat === 'xlsx' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>

        {/* Card 2: CSV (.csv) */}
        <div
          style={{
            background: 'rgba(10, 39, 27, 0.7)',
            border: '1.5px solid rgba(217, 119, 6, 0.4)',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} color="#FBBF24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Standard CSV Export
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#FDE68A', fontWeight: 700 }}>.CSV Format</span>
              </div>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              RFC 4180 standard comma-separated values compatible with Google Sheets and statistical packages. Escaped against malicious macros.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exportingFormat !== null || previewCount === 0}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#05160F',
              border: 'none',
              padding: '0.7rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: previewCount === 0 || exportingFormat !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
            }}
          >
            {exportingFormat === 'csv' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>Download CSV (.csv)</span>
          </button>
        </div>

        {/* Card 3: Executive PDF (.pdf) */}
        <div
          style={{
            background: 'rgba(10, 39, 27, 0.7)',
            border: '1.5px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="#F43F5E" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Printable Summary Report
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#FDA4AF', fontWeight: 700 }}>.PDF Format</span>
              </div>
            </div>
            <p style={{ color: '#CBD5E1', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              High-resolution administrative summary report with official MOSA insignia, generated audit timestamps, and formatted roster table.
            </p>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={exportingFormat !== null || previewCount === 0}
            style={{
              background: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.7rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: previewCount === 0 || exportingFormat !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 10px rgba(190, 24, 93, 0.3)',
            }}
          >
            {exportingFormat === 'pdf' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>Download PDF Report</span>
          </button>
        </div>

      </div>

      {/* Security & Audit notice */}
      <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>All export downloads are cryptographically registered in the immutable administrative audit log with your account identifier ({currentUser.email}).</span>
        <span style={{ color: '#FCD34D', fontWeight: 700 }}>GDPR & Data Protection Compliant</span>
      </div>
    </div>
  );
};
