import React, { useState, useEffect } from 'react';
import { 
  AlumniApplication, 
  AlumniProfile, 
  ApplicationStatus, 
  MembershipStatus, 
  SystemSettings,
  LegacyAlumniRecord
} from '../types';
import { dataService } from '../services/dataService';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Award, 
  Search, 
  Filter, 
  GraduationCap, 
  ShieldAlert, 
  FileText,
  UserCheck,
  RefreshCw,
  Sparkles,
  Users,
  Edit3,
  ShieldCheck,
  History,
  Ban,
  UserX,
  AlertCircle,
  Check,
  ArrowRight,
  UserPlus,
  Settings,
  Printer,
  Copy,
  Save,
  X,
  BookOpen,
  Upload,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { AuthUser } from '../types';
import { DigitalMembershipCardModal } from './DigitalMembershipCardModal';

interface Props {
  adminEmail: string;
  onAlumniCreated: () => void;
  currentUser?: AuthUser;
  activeTab?: AdminRegistryTab;
  onTabChange?: (tab: AdminRegistryTab) => void;
}

export type AdminRegistryTab = 'members' | 'ma_numbers' | 'legacy' | 'applications' | 'verification' | 'assisted';

export const AdminApplicationReview: React.FC<Props> = ({ 
  adminEmail, 
  onAlumniCreated, 
  currentUser,
  activeTab,
  onTabChange,
}) => {
  const [applications, setApplications] = useState<AlumniApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AlumniApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [approvalModalApp, setApprovalModalApp] = useState<AlumniApplication | null>(null);
  const [approvalResult, setApprovalResult] = useState<{ alumniNumber: string; applicantName: string } | null>(null);

  // Request Correction State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTargetApp, setCorrectionTargetApp] = useState<AlumniApplication | null>(null);
  const [correctionReasonInput, setCorrectionReasonInput] = useState('');

  // Manual MA Number Assignment in Approval
  const [useManualMA, setUseManualMA] = useState(false);
  const [manualMANumberInput, setManualMANumberInput] = useState('');
  const [manualMAError, setManualMAError] = useState('');

  // Horizontal Slide Navigation or Consolidated Two-Tier: Members, MA Numbers, Applications, Verification, Assisted Registration
  const [internalActiveTab, setInternalActiveTab] = useState<AdminRegistryTab>('members');
  const activeAdminTab = activeTab ?? internalActiveTab;
  const setActiveAdminTab = (tab: AdminRegistryTab) => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [members, setMembers] = useState<AlumniProfile[]>([]);
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('ALL');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [cardPreviewMember, setCardPreviewMember] = useState<AlumniProfile | null>(null);

  // MA Numbers Configuration Tab State
  const [prefixInput, setPrefixInput] = useState('');
  const [padDigitsInput, setPadDigitsInput] = useState(4);
  const [nextNumberInput, setNextNumberInput] = useState(1);
  const [autoApproveInput, setAutoApproveInput] = useState(true);
  const [allowSelfAssignedInput, setAllowSelfAssignedInput] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Legacy Physical Register Tab State
  const [legacyRecords, setLegacyRecords] = useState<LegacyAlumniRecord[]>([]);
  const [legacySearchTerm, setLegacySearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{ record: LegacyAlumniRecord; duplicate: boolean; reason?: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [legacyNotice, setLegacyNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [editingLegacy, setEditingLegacy] = useState<Partial<LegacyAlumniRecord> | null>(null);

  // Verification Desk Tab State
  const [verifySearchQuery, setVerifySearchQuery] = useState('');
  const [searchedMember, setSearchedMember] = useState<AlumniProfile | null>(null);
  const [verifySearched, setVerifySearched] = useState(false);

  // Assisted Registration (Device-Free Alumni) Tab State
  const [assistedForm, setAssistedForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '',
    attendedOLevel: true,
    oYearJoined: 2017,
    oYearCompleted: 2020,
    oCampus: 'Main Campus Hoima',
    attendedALevel: true,
    aYearJoined: 2021,
    aYearCompleted: 2022,
    aCampus: 'Main Campus Hoima',
    aCombination: 'PCM/ICT',
    phone: '',
    email: '',
    city: 'Hoima',
    country: 'Uganda',
    occupation: '',
    organisation: '',
    registrationDeskStation: 'Secretariat Registration Desk Hoima',
    registrationDeviceNotes: 'Official Secretariat In-Person Station',
    immediateApproval: true,
  });
  const [assistedLoading, setAssistedLoading] = useState(false);
  const [assistedSuccess, setAssistedSuccess] = useState<{ alumniNumber: string; name: string; referenceId: string } | null>(null);
  const [assistedError, setAssistedError] = useState('');

  // Manual Number Assignment Modal State
  const [editingNumberMember, setEditingNumberMember] = useState<AlumniProfile | null>(null);
  const [newNumberInput, setNewNumberInput] = useState('');
  const [numberChangeReason, setNumberChangeReason] = useState('');
  const [numberError, setNumberError] = useState('');

  // Status Management & Disapproval Modal State
  const [statusMember, setStatusMember] = useState<AlumniProfile | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<MembershipStatus>('ACTIVE');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [statusError, setStatusError] = useState('');

  // History Drawer / Modal State
  const [historyMember, setHistoryMember] = useState<AlumniProfile | null>(null);

  // Single Discreet Admin Management Modal State
  const [adminManagingMember, setAdminManagingMember] = useState<AlumniProfile | null>(null);
  const [adminModalTab, setAdminModalTab] = useState<'status' | 'number' | 'history' | 'profile' | 'delete'>('status');

  const handleOpenAdminManagement = (member: AlumniProfile, defaultTab: 'status' | 'number' | 'history' | 'profile' | 'delete' = 'status') => {
    setAdminManagingMember(member);
    setAdminModalTab(defaultTab);
    setSelectedNewStatus(member.membershipStatus || 'ACTIVE');
    setStatusChangeReason(member.disapprovalReason || '');
    setStatusError('');
    setNewNumberInput(member.alumniNumber);
    setNumberChangeReason('');
    setNumberError('');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, alumniList, settings, leg] = await Promise.all([
        dataService.getApplications(),
        dataService.getAlumniList(),
        dataService.getSystemSettings(),
        dataService.getLegacyAlumni(),
      ]);
      setApplications(apps);
      setMembers(alumniList);
      setSystemSettings(settings);
      setLegacyRecords(leg);
      if (settings) {
        setPrefixInput(settings.prefix || 'MA. ');
        setPadDigitsInput(settings.padDigits || 4);
        setNextNumberInput(settings.nextAlumniNumber || 1);
        setAutoApproveInput(settings.autoApproveRegistrations !== false);
        setAllowSelfAssignedInput(settings.allowSelfAssignedAlumniNumber === true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!systemSettings) return;
    setSavingSettings(true);
    setSettingsNotice(null);
    try {
      const updated: SystemSettings = {
        ...systemSettings,
        prefix: prefixInput.trim() || systemSettings.prefix,
        padDigits: Number(padDigitsInput) || systemSettings.padDigits,
        nextAlumniNumber: Number(nextNumberInput) || systemSettings.nextAlumniNumber,
        autoApproveRegistrations: autoApproveInput,
        allowSelfAssignedAlumniNumber: allowSelfAssignedInput,
      };
      await dataService.updateSystemSettings(updated);
      await loadData();
      setSettingsNotice({ text: 'MA Number formatting, sequence counter, and auto-approval settings saved successfully!', type: 'success' });
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (e: any) {
      setSettingsNotice({ text: e.message || 'Failed to update system settings', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteMemberPermanently = async () => {
    if (!adminManagingMember) return;
    const reason = prompt(`Please enter the official audit reason for deleting ${adminManagingMember.fullName || adminManagingMember.firstName}. Under permanent ledger rules, membership number ${adminManagingMember.alumniNumber} will remain permanently reserved.`);
    if (!reason || !reason.trim()) {
      alert('A valid reason is required for permanent deletion audit.');
      return;
    }

    setActionLoading(true);
    try {
      await dataService.deleteAlumnus(adminManagingMember.internalId, adminEmail, reason.trim());
      setAdminManagingMember(null);
      await loadData();
      onAlumniCreated();
      alert(`Member record deleted. Membership number ${adminManagingMember.alumniNumber} remains permanently reserved in the ledger.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete member record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewImport = () => {
    if (!importRawText.trim()) return;
    const lines = importRawText.split('\n').map(l => l.trim()).filter(Boolean);
    const existingNums = new Set([
      ...legacyRecords.map(r => r.membershipNumber.toLowerCase()),
      ...members.map(m => m.alumniNumber.toLowerCase())
    ]);

    const results: Array<{ record: LegacyAlumniRecord; duplicate: boolean; reason?: string }> = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const rawNum = parts[0];
        const normalized = dataService.normalizeAlumniNumber(rawNum);
        const name = parts[1];
        const cohort = parts[2] ? parseInt(parts[2].replace(/[^0-9]/g, '')) || undefined : undefined;
        const page = parts[3] || `Entry #${idx + 1}`;

        const isDuplicate = existingNums.has(normalized.toLowerCase());
        results.push({
          record: {
            id: `legacy-${Date.now()}-${idx}`,
            membershipNumber: normalized,
            fullName: name,
            cohortYear: cohort,
            physicalRegisterPage: page,
            verifiedStatus: 'VERIFIED',
          },
          duplicate: isDuplicate,
          reason: isDuplicate ? `Membership number ${normalized} is already registered or allocated in ledger` : undefined
        });
      }
    });

    setImportPreview(results);
  };

  const handleCommitImport = async () => {
    const validRecords = importPreview.filter(p => !p.duplicate).map(p => p.record);
    if (validRecords.length === 0) {
      alert('No new valid legacy records to import. All entries were duplicates or empty.');
      return;
    }

    setIsImporting(true);
    try {
      await dataService.importLegacyAlumni(validRecords);
      setIsImportModalOpen(false);
      setImportRawText('');
      setImportPreview([]);
      await loadData();
      setLegacyNotice({ text: `Successfully imported ${validRecords.length} legacy physical register records!`, type: 'success' });
      setTimeout(() => setLegacyNotice(null), 4000);
    } catch (err: any) {
      setLegacyNotice({ text: err.message || 'Failed to import legacy records.', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePerformVerification = () => {
    if (!verifySearchQuery.trim()) {
      setSearchedMember(null);
      setVerifySearched(false);
      return;
    }
    const q = verifySearchQuery.trim().toLowerCase();
    const match = members.find(m => 
      m.alumniNumber.toLowerCase() === q ||
      m.alumniNumber.toLowerCase().replace(/[^a-z0-9]/g, '') === q.replace(/[^a-z0-9]/g, '') ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase() === q) ||
      (m.phone && m.phone.toLowerCase().includes(q))
    );
    setSearchedMember(match || null);
    setVerifySearched(true);
  };

  const handleAssistedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistedForm.firstName.trim() || !assistedForm.lastName.trim()) {
      setAssistedError('First Name and Last Name are mandatory for assisted registration.');
      return;
    }

    setAssistedLoading(true);
    setAssistedError('');
    try {
      const appPayload = {
        firstName: assistedForm.firstName.trim(),
        middleName: assistedForm.middleName.trim() || undefined,
        lastName: assistedForm.lastName.trim(),
        nickname: assistedForm.nickname.trim() || undefined,
        gender: assistedForm.gender,
        dateOfBirth: assistedForm.dateOfBirth || '2000-01-01',
        phone: assistedForm.phone.trim() || 'No Phone (Device-Free)',
        email: assistedForm.email.trim() || '',
        city: assistedForm.city.trim() || 'Hoima',
        country: assistedForm.country.trim() || 'Uganda',
        occupation: assistedForm.occupation.trim() || undefined,
        organisation: assistedForm.organisation.trim() || undefined,
        registrationMode: 'ASSISTED' as const,
        registeredBy: {
          name: currentUser?.displayName || 'MOSA Secretariat Admin',
          email: adminEmail,
          uid: currentUser?.uid || 'admin-001',
          role: currentUser?.role || 'SECRETARY',
          station: assistedForm.registrationDeskStation.trim(),
          deviceNotes: assistedForm.registrationDeviceNotes.trim(),
          registeredAt: new Date().toISOString(),
        },
        accountActivated: false,
        schoolHistory: {
          attendedOLevel: assistedForm.attendedOLevel,
          oLevel: assistedForm.attendedOLevel ? {
            yearJoined: Number(assistedForm.oYearJoined),
            yearCompleted: Number(assistedForm.oYearCompleted),
            campus: assistedForm.oCampus,
            class: 'Senior 4',
            stream: 'Main Stream',
          } : undefined,
          attendedALevel: assistedForm.attendedALevel,
          aLevel: assistedForm.attendedALevel ? {
            yearJoined: Number(assistedForm.aYearJoined),
            yearCompleted: Number(assistedForm.aYearCompleted),
            campus: assistedForm.aCampus,
            class: 'Senior 6',
            combination: assistedForm.aCombination || 'General',
          } : undefined,
        },
        privacySettings: {
          showName: true,
          showNickname: true,
          showProfession: true,
          showOrganisation: true,
          showCountry: true,
          showPhone: false,
          showEmail: false,
        },
      };

      const res = await dataService.submitApplication(appPayload);
      if (!res.success || !res.id) {
        throw new Error(res.error || 'Failed to submit assisted registration.');
      }

      let finalMANumber = res.alumniNumber;

      if (assistedForm.immediateApproval && !finalMANumber) {
        const approveRes = await dataService.approveApplicationAndGenerateMA(
          res.id,
          adminEmail,
          `In-person assisted registration at ${assistedForm.registrationDeskStation}. Device-free alumnus.`
        );
        if (approveRes.success && approveRes.alumniNumber) {
          finalMANumber = approveRes.alumniNumber;
        }
      }

      setAssistedSuccess({
        alumniNumber: finalMANumber || 'Pending Allocation',
        name: `${assistedForm.firstName} ${assistedForm.lastName}`,
        referenceId: res.referenceId || res.id,
      });

      await loadData();
      onAlumniCreated();
    } catch (err: any) {
      setAssistedError(err.message || 'Error executing assisted registration.');
    } finally {
      setAssistedLoading(false);
    }
  };

  const handleOpenNumberModal = (member: AlumniProfile) => {
    setEditingNumberMember(member);
    setNewNumberInput(member.alumniNumber);
    setNumberChangeReason('');
    setNumberError('');
  };

  const handleSaveMembershipNumber = async (target?: AlumniProfile) => {
    const targetMember = target || editingNumberMember || adminManagingMember;
    if (!targetMember) return;
    if (!newNumberInput.trim()) {
      setNumberError('Membership number cannot be empty.');
      return;
    }
    if (!numberChangeReason.trim()) {
      setNumberError('Please provide an audit reason for changing the membership number.');
      return;
    }

    setActionLoading(true);
    setNumberError('');
    try {
      const res = await dataService.updateAlumniMembershipNumber(
        targetMember.internalId,
        newNumberInput.trim(),
        adminEmail,
        numberChangeReason.trim() || 'Manual administrative reassignment'
      );
      if (res.success && res.alumnus) {
        setEditingNumberMember(null);
        if (adminManagingMember && adminManagingMember.internalId === targetMember.internalId) {
          setAdminManagingMember(res.alumnus);
        }
        await loadData();
        onAlumniCreated();
      } else {
        setNumberError(res.error || 'Failed to update membership number');
      }
    } catch (e: any) {
      setNumberError(e.message || 'Error updating membership number');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStatusModal = (member: AlumniProfile) => {
    setStatusMember(member);
    setSelectedNewStatus(member.membershipStatus || 'ACTIVE');
    setStatusChangeReason(member.disapprovalReason || '');
    setStatusError('');
  };

  const handleSaveMemberStatus = async (target?: AlumniProfile) => {
    const targetMember = target || statusMember || adminManagingMember;
    if (!targetMember) return;
    if ((selectedNewStatus === 'DISAPPROVED' || selectedNewStatus === 'REJECTED') && !statusChangeReason.trim()) {
      setStatusError('Please provide a reason for disapproving this member.');
      return;
    }

    setActionLoading(true);
    setStatusError('');
    try {
      const res = await dataService.updateMemberStatus(
        targetMember.internalId,
        selectedNewStatus,
        adminEmail,
        statusChangeReason.trim()
      );
      if (res.success && res.alumnus) {
        setStatusMember(null);
        if (adminManagingMember && adminManagingMember.internalId === targetMember.internalId) {
          setAdminManagingMember(res.alumnus);
        }
        await loadData();
        onAlumniCreated();
      } else {
        setStatusError(res.error || 'Failed to update status');
      }
    } catch (e: any) {
      setStatusError(e.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = `${app.firstName} ${app.lastName} ${app.nickname || ''}`.toLowerCase().includes(term);
      const matchEmail = app.email.toLowerCase().includes(term);
      const matchPhone = app.phone.toLowerCase().includes(term);
      const matchId = app.id.toLowerCase().includes(term);
      const matchRef = (app.referenceId || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchPhone && !matchId && !matchRef) return false;
    }
    return true;
  });

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    setActionLoading(true);
    try {
      await dataService.updateApplicationStatus(appId, status, reviewNotes, adminEmail);
      await loadData();
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status, reviewNotes } : null);
      }
      setReviewNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCorrectionModal = (app: AlumniApplication) => {
    setCorrectionTargetApp(app);
    setCorrectionReasonInput(app.correctionReason || '');
    setIsCorrectionModalOpen(true);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionTargetApp) return;
    if (!correctionReasonInput.trim()) {
      alert('Please specify the exact correction instructions for the applicant.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await dataService.requestCorrection(correctionTargetApp.id, correctionReasonInput.trim(), adminEmail);
      if (res.success) {
        setIsCorrectionModalOpen(false);
        setCorrectionReasonInput('');
        setCorrectionTargetApp(null);
        await loadData();
        if (selectedApp?.id === correctionTargetApp.id) {
          setSelectedApp(null);
        }
      } else {
        alert(res.error || 'Failed to submit correction request');
      }
    } catch (e: any) {
      alert(e.message || 'Error requesting correction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvalModalApp) return;
    setManualMAError('');

    const manualNumToPass = useManualMA && manualMANumberInput.trim() ? manualMANumberInput.trim() : undefined;

    setActionLoading(true);
    try {
      const res = await dataService.approveApplicationAndGenerateMA(
        approvalModalApp.id, 
        adminEmail, 
        reviewNotes || 'Approved by MOSA Credentials Verification Committee',
        manualNumToPass
      );

      if (res.success && res.alumniNumber) {
        setApprovalResult({
          alumniNumber: res.alumniNumber,
          applicantName: `${approvalModalApp.firstName} ${approvalModalApp.lastName}`,
        });
        setApprovalModalApp(null);
        setUseManualMA(false);
        setManualMANumberInput('');
        await loadData();
        onAlumniCreated();
      } else {
        setManualMAError(res.error || 'Failed to approve application');
        alert(res.error || 'Failed to approve application');
      }
    } catch (e: any) {
      setManualMAError(e.message || 'Error executing approval transaction');
      alert(e.message || 'Error executing approval transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  const underReviewCount = applications.filter(a => a.status === 'UNDER_REVIEW').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;

  const activeMembersCount = members.filter(m => m.membershipStatus === 'ACTIVE' || m.membershipStatus === 'APPROVED').length;
  const disapprovedMembersCount = members.filter(m => m.membershipStatus === 'DISAPPROVED' || m.membershipStatus === 'REJECTED').length;
  const suspendedMembersCount = members.filter(m => m.membershipStatus === 'SUSPENDED').length;
  const deceasedMembersCount = members.filter(m => m.membershipStatus === 'DECEASED').length;
  const pendingMembersCount = members.filter(m => m.membershipStatus === 'PENDING').length;

  const nextNumberPreview = systemSettings 
    ? dataService.formatAlumniNumber(systemSettings.nextAlumniNumber, systemSettings.prefix, systemSettings.padDigits)
    : 'MA.-000X';

  const filteredMembers = members.filter(m => {
    if (memberStatusFilter !== 'ALL') {
      if (memberStatusFilter === 'ACTIVE' && !(m.membershipStatus === 'ACTIVE' || m.membershipStatus === 'APPROVED')) return false;
      if (memberStatusFilter === 'DISAPPROVED' && !(m.membershipStatus === 'DISAPPROVED' || m.membershipStatus === 'REJECTED')) return false;
      if (memberStatusFilter === 'SUSPENDED' && m.membershipStatus !== 'SUSPENDED') return false;
      if (memberStatusFilter === 'DECEASED' && m.membershipStatus !== 'DECEASED') return false;
      if (memberStatusFilter === 'PENDING' && m.membershipStatus !== 'PENDING') return false;
    }
    if (memberSearchTerm) {
      const term = memberSearchTerm.toLowerCase();
      const displayName = m.fullName || `${m.firstName} ${m.lastName}`;
      const campusStr = m.schoolHistory?.oLevel?.campus || m.schoolHistory?.aLevel?.campus || '';
      const matchName = `${displayName} ${m.nickname || ''}`.toLowerCase().includes(term);
      const matchNumber = m.alumniNumber.toLowerCase().includes(term);
      const matchEmail = (m.email || '').toLowerCase().includes(term);
      const matchPhone = (m.phone || '').toLowerCase().includes(term);
      const matchCampus = campusStr.toLowerCase().includes(term);
      if (!matchName && !matchNumber && !matchEmail && !matchPhone && !matchCampus) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Navigation / Header */}
      {!activeTab ? (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.65rem', 
          borderBottom: '2px solid #E2E8F0', 
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
            <button
              onClick={() => setActiveAdminTab('members')}
              className="btn"
              style={{
                background: activeAdminTab === 'members' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'members' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Users size={16} />
              Members Registry ({members.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('ma_numbers')}
              className="btn"
              style={{
                background: activeAdminTab === 'ma_numbers' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'ma_numbers' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Award size={16} />
              MA Number Management
            </button>

            <button
              onClick={() => setActiveAdminTab('legacy')}
              className="btn"
              style={{
                background: activeAdminTab === 'legacy' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'legacy' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <BookOpen size={16} />
              Legacy Physical Register ({legacyRecords.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('applications')}
              className="btn"
              style={{
                background: activeAdminTab === 'applications' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'applications' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Clock size={16} />
              Applications Queue ({applications.length})
            </button>

            <button
              onClick={() => setActiveAdminTab('verification')}
              className="btn"
              style={{
                background: activeAdminTab === 'verification' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'verification' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={16} />
              Verification Desk
            </button>

            <button
              onClick={() => setActiveAdminTab('assisted')}
              className="btn"
              style={{
                background: activeAdminTab === 'assisted' ? '#0B203E' : '#F1F5F9',
                color: activeAdminTab === 'assisted' ? '#FFFFFF' : '#475569',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.05rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={16} />
              Assisted Registration (Device-Free)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} color="#059669" /> Auto: <strong>{systemSettings?.autoApproveRegistrations !== false ? 'Active' : 'Manual'}</strong> (Prefix: <code style={{ color: '#0B203E', fontWeight: 700 }}>{systemSettings?.prefix || 'MA.-'}</code>)
            </span>
            <button className="btn btn-secondary" onClick={loadData} title="Reload Data" style={{ padding: '0.45rem 0.75rem' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1rem', 
          flexWrap: 'wrap',
          marginBottom: '0.25rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0B203E' }}>
              {activeAdminTab === 'members' && 'Alumni Registry Roster'}
              {activeAdminTab === 'ma_numbers' && 'MA Number Sequential Controls'}
              {activeAdminTab === 'applications' && `Pending Applications Queue (${applications.length})`}
              {activeAdminTab === 'verification' && 'Official Verification Desk'}
              {activeAdminTab === 'assisted' && 'Assisted In-Person Registration Desk'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F8FAFC', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <Sparkles size={14} color="#059669" /> Auto: <strong>{systemSettings?.autoApproveRegistrations !== false ? 'Active' : 'Manual'}</strong> (Prefix: <code style={{ color: '#0B203E', fontWeight: 700 }}>{systemSettings?.prefix || 'MA.-'}</code>)
            </span>
            <button className="btn btn-secondary" onClick={loadData} title="Reload Data" style={{ padding: '0.45rem 0.75rem' }}>
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      )}

      {activeAdminTab === 'members' && (
        <>
          {/* Members Search and Horizontal Summary Filter */}
          <div className="mosa-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `All (${members.length})` },
                  { id: 'ACTIVE', label: `Active (${activeMembersCount})` },
                  { id: 'DISAPPROVED', label: `Disapproved (${disapprovedMembersCount})` },
                  { id: 'SUSPENDED', label: `Suspended (${suspendedMembersCount})` },
                  { id: 'DECEASED', label: `Deceased (${deceasedMembersCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMemberStatusFilter(tab.id)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: memberStatusFilter === tab.id ? '1px solid #0B203E' : '1px solid #E2E8F0',
                      background: memberStatusFilter === tab.id ? '#0B203E' : '#FFFFFF',
                      color: memberStatusFilter === tab.id ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search member, MA number, email..."
                  value={memberSearchTerm}
                  onChange={e => setMemberSearchTerm(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    width: '280px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="mosa-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Member Name & Nickname</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Official MA Number</th>
                  <th style={{ padding: '0.85rem 1rem' }}>MASSH Cohort / Campus</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Membership Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status Reason / Notes</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Admin Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <Users size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5, display: 'block' }} />
                      No members match the current filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(member => {
                    const isDisapproved = member.membershipStatus === 'DISAPPROVED' || member.membershipStatus === 'REJECTED';
                    const isSuspended = member.membershipStatus === 'SUSPENDED';
                    const hasNumberChanges = (member.numberChangeHistory?.length || 0) > 0;
                    const hasStatusChanges = (member.statusHistory?.length || 0) > 0;

                    return (
                      <tr key={member.internalId} style={{ borderBottom: '1px solid #F1F5F9', background: isDisapproved ? '#FFF1F2' : undefined }}>
                        {/* Name & Photo */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#0B203E',
                              color: '#D4AF37',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              flexShrink: 0
                            }}>
                              {(member.fullName || member.firstName).charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0B203E' }}>
                                {member.fullName || `${member.firstName} ${member.lastName}`}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                {member.nickname ? `"${member.nickname}" • ` : ''}{member.email || member.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* MA Number */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className="alumni-no-pill" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                            {member.alumniNumber}
                          </span>
                          {hasNumberChanges && (
                            <span 
                              title={`${member.numberChangeHistory?.length} number change(s) recorded in audit log`}
                              style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#4F46E5', background: '#EEF2FF', padding: '0.15rem 0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => setHistoryMember(member)}
                            >
                              Edited ({member.numberChangeHistory?.length})
                            </span>
                          )}
                        </td>

                        {/* Cohort & Campus */}
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                          <div>
                            {member.schoolHistory?.oLevel?.yearCompleted ? `O-Level ${member.schoolHistory.oLevel.yearCompleted}` : ''}
                            {member.schoolHistory?.aLevel?.yearCompleted ? ` • A-Level ${member.schoolHistory.aLevel.yearCompleted}` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {member.schoolHistory?.oLevel?.campus || member.schoolHistory?.aLevel?.campus || 'Main Campus'}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className={`status-badge ${member.membershipStatus}`}>
                            {member.membershipStatus}
                          </span>
                        </td>

                        {/* Status Reason / Note */}
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem' }}>
                          {isDisapproved && member.disapprovalReason ? (
                            <div style={{ color: '#991B1B', background: '#FEE2E2', padding: '0.35rem 0.55rem', borderRadius: '6px', maxWidth: '240px', lineHeight: 1.3 }}>
                              <strong>Disapproved:</strong> {member.disapprovalReason}
                            </div>
                          ) : isSuspended ? (
                            <span style={{ color: '#D97706', fontStyle: 'italic' }}>Account suspended</span>
                          ) : (
                            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={13} /> Active Alumnus
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.42rem 0.75rem', 
                                fontSize: '0.8rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.35rem', 
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1E40AF',
                                cursor: 'pointer'
                              }}
                              onClick={() => setCardPreviewMember(member)}
                              title="View & Export Official Digital Membership Card"
                            >
                              <Award size={14} color="#1E40AF" />
                              <span>Card</span>
                            </button>

                            <button
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.42rem 0.85rem', 
                                fontSize: '0.8rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.45rem', 
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                color: '#0B203E',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenAdminManagement(member)}
                              title="Manage membership status, MA number, and audit history"
                            >
                              <Settings size={14} color="#0B203E" />
                              <span>Admin</span>
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
        </>
      )}

      {/* TAB 2: MA NUMBER MANAGEMENT */}
      {activeAdminTab === 'ma_numbers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Compact Administrative Summary Strip */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Award size={18} color="#D97706" />
              <span style={{ fontSize: '0.88rem', color: '#64748B' }}>Allocated MA Numbers:</span>
              <strong style={{ fontSize: '1.05rem', color: '#0B203E' }}>{members.length}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Zero Duplicate Collisions (Strictly Unique)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#64748B' }}>Next Auto Number:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#1D4ED8', background: '#EFF6FF', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                {nextNumberPreview}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>(Counter: #{systemSettings?.nextAlumniNumber || 1})</span>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="mosa-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#D97706" /> Sequential Numbering Configuration &amp; Auto-Approval
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              Control prefix formatting (MASSH standard: <code>MA. </code>), zero padding, starting sequence counter, and auto-approval.
            </p>

            {settingsNotice && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: settingsNotice.type === 'success' ? '#DCFCE7' : '#FEE2E2', 
                color: settingsNotice.type === 'success' ? '#166534' : '#991B1B', 
                fontSize: '0.85rem', 
                marginBottom: '1rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {settingsNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{settingsNotice.text}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Official Prefix</label>
                <input
                  className="form-control"
                  value={prefixInput}
                  onChange={e => setPrefixInput(e.target.value)}
                  placeholder="e.g. MA. "
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>MASSH standard is <code>MA. </code></span>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Zero Padding Digits</label>
                <select
                  className="form-control"
                  value={padDigitsInput}
                  onChange={e => setPadDigitsInput(Number(e.target.value))}
                >
                  <option value={1}>1 digit (e.g. MA. 1, MA. 2)</option>
                  <option value={2}>2 digits (e.g. MA. 01, MA. 02)</option>
                  <option value={3}>3 digits (e.g. MA. 001, MA. 002)</option>
                  <option value={4}>4 digits (e.g. MA. 0001, MA. 0002)</option>
                  <option value={5}>5 digits (e.g. MA. 00001)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Leading zero formatting</span>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Next Starting Number (e.g. 5000)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={nextNumberInput}
                  onChange={e => setNextNumberInput(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sets sequence counter for new cohorts</span>
              </div>

              <div style={{ paddingBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#0B203E' }}>
                  <input
                    type="checkbox"
                    checked={autoApproveInput}
                    onChange={e => setAutoApproveInput(e.target.checked)}
                  />
                  <span>Auto-Verify / Approve Registrations</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                  {autoApproveInput
                    ? 'Active: Registrations are automatically verified & approved immediately upon signup'
                    : 'Paused: Applications require manual review before verification'}
                </span>
              </div>

              <div style={{ paddingBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#0B203E' }}>
                  <input
                    type="checkbox"
                    checked={allowSelfAssignedInput}
                    onChange={e => setAllowSelfAssignedInput(e.target.checked)}
                  />
                  <span>Allow Members to Self-Assign Numbers</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                  {allowSelfAssignedInput
                    ? 'Active: Members can input an existing physical register number'
                    : 'Paused: Members cannot self-assign numbers; system generates sequential numbers'}
                </span>
              </div>

              <div>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>

          {/* Sequence Preview & Ledger Information */}
          <div className="grid-2">
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: '0 0 0.5rem 0' }}>
                Upcoming Number Sequence Projection
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.85rem 0' }}>
                Preview of next permanent sequential membership numbers allocated to upcoming alumni applicants:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                  const num = (systemSettings?.nextAlumniNumber || 1) + offset;
                  const formatted = dataService.formatAlumniNumber(num, prefixInput || 'MA. ', padDigitsInput || 4);
                  return (
                    <div key={num} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.5rem 0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>#{num}</div>
                      <div style={{ fontWeight: 800, color: '#0B203E', fontSize: '0.95rem', fontFamily: 'monospace' }}>{formatted}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mosa-card" style={{ padding: '1.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '1rem', color: '#0B203E', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#059669" /> Permanent Non-Repeating Ledger
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Every allocated membership number is permanently recorded in the database ledger. Even if a member record is deactivated or deleted, their number remains strictly reserved and is never reused for any future alumnus.
              </p>
              <div style={{ marginTop: '0.85rem', padding: '0.5rem 0.75rem', background: '#DCFCE7', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                ✓ Concurrency-safe unique ledger active. Zero collisions guaranteed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEGACY PHYSICAL REGISTER & AUTO-VERIFICATION */}
      {activeAdminTab === 'legacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div className="mosa-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <BookOpen size={22} color="#0B203E" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                    Authoritative Legacy Physical Register
                  </h2>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Authoritative records from Mandela Secondary School Hoima physical registers (Est. 1997). When an applicant inputs their existing number, matching records are automatically verified and linked.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.15rem' }}
                >
                  <Upload size={16} /> Import Physical Book Records
                </button>
              </div>
            </div>

            {legacyNotice && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.85rem', 
                fontWeight: 600,
                background: legacyNotice.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: legacyNotice.type === 'success' ? '#166534' : '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {legacyNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{legacyNotice.text}</span>
              </div>
            )}

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Legacy Records</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>{legacyRecords.length}</div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Linked to Digital Accounts</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {legacyRecords.filter(r => r.verifiedStatus === 'LINKED' || !!r.linkedAlumniId).length}
                </div>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Available for Matching</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>
                  {legacyRecords.filter(r => r.verifiedStatus !== 'LINKED' && !r.linkedAlumniId).length}
                </div>
              </div>
            </div>
          </div>

          {/* Search and Table */}
          <div className="mosa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                className="form-control"
                placeholder="Search legacy records by MA Number, Name, or Year..."
                value={legacySearchTerm}
                onChange={e => setLegacySearchTerm(e.target.value)}
                style={{ maxWidth: '380px', padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Normalized MASSH Format: <code>MA. XXXX</code>
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Physical Register #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Alumnus Full Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Exit Cohort Year</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Register Book Reference</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Verification State</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legacyRecords
                    .filter(r => {
                      if (!legacySearchTerm.trim()) return true;
                      const q = legacySearchTerm.toLowerCase();
                      return (
                        r.membershipNumber.toLowerCase().includes(q) ||
                        r.fullName.toLowerCase().includes(q) ||
                        (r.cohortYear && r.cohortYear.toString().includes(q)) ||
                        (r.physicalRegisterPage && r.physicalRegisterPage.toLowerCase().includes(q))
                      );
                    })
                    .map((record, idx) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className="alumni-no-pill small" style={{ fontWeight: 800 }}>
                            {record.membershipNumber}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0B203E' }}>
                          {record.fullName}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                          {record.cohortYear ? `Class of ${record.cohortYear}` : 'Historical Record'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.8rem' }}>
                          {record.physicalRegisterPage || 'Register Book'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {record.verifiedStatus === 'LINKED' || record.linkedAlumniId ? (
                            <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Linked to Member
                            </span>
                          ) : (
                            <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              Verified Physical Record
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete legacy record for ${record.fullName} (${record.membershipNumber})?`)) {
                                await dataService.deleteLegacyAlumniRecord(record.id);
                                await loadData();
                              }
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#991B1B' }}
                            title="Delete Legacy Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Modal */}
          {isImportModalOpen && (
            <div className="modal-overlay" style={{ zIndex: 1000 }}>
              <div className="modal-content" style={{ maxWidth: '640px', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={20} color="#0B203E" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0B203E', fontWeight: 800 }}>
                      Import Physical Alumni Register
                    </h3>
                  </div>
                  <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                  Paste CSV lines from the physical book registers. Format: <code>MA. Number, Full Name, Exit Year, Page Reference</code>. Duplicate numbers will be automatically detected and highlighted.
                </p>

                <textarea
                  rows={5}
                  className="form-control"
                  placeholder="MA. 0001, John Kagoro, 1999, Page 12&#10;MA. 0002, Sarah Atugonza, 2001, Page 14&#10;MA. 0003, David Byaruhanga, 2003, Page 18"
                  value={importRawText}
                  onChange={e => setImportRawText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button
                    onClick={handlePreviewImport}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    <FileSpreadsheet size={15} /> Analyze &amp; Detect Duplicates
                  </button>

                  {importPreview.length > 0 && (
                    <button
                      onClick={handleCommitImport}
                      disabled={isImporting || importPreview.every(p => p.duplicate)}
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <CheckCircle2 size={15} /> {isImporting ? 'Importing...' : `Confirm Import (${importPreview.filter(p => !p.duplicate).length} Records)`}
                    </button>
                  )}
                </div>

                {importPreview.length > 0 && (
                  <div style={{ marginTop: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Number</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Full Name</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Year</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Duplicate Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: item.duplicate ? '#FFF1F2' : '#FFFFFF' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>
                              {item.record.membershipNumber}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{item.record.fullName}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{item.record.cohortYear || '-'}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              {item.duplicate ? (
                                <span style={{ color: '#991B1B', fontWeight: 700 }}>
                                  ⚠️ Duplicate: {item.reason}
                                </span>
                              ) : (
                                <span style={{ color: '#166534', fontWeight: 700 }}>
                                  ✓ Valid New Entry
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPLICATIONS REVIEW QUEUE */}
      {activeAdminTab === 'applications' && (
        <>
          {/* Applications Summary Cards */}
          <div className="grid-3">
            <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Pending Review
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>
                    {pendingCount}
                  </div>
                </div>
                <div style={{ background: '#FEF3C7', padding: '0.65rem', borderRadius: '10px' }}>
                  <Clock size={24} color="#D97706" />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                Awaiting manual credential verification
              </div>
            </div>

            <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Under Review
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>
                    {underReviewCount}
                  </div>
                </div>
                <div style={{ background: '#EEF2FF', padding: '0.65rem', borderRadius: '10px' }}>
                  <FileText size={24} color="#4F46E5" />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                Cross-referencing MASSH class rolls
              </div>
            </div>

            <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    Approved Registrations
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                    {approvedCount}
                  </div>
                </div>
                <div style={{ background: '#D1FAE5', padding: '0.65rem', borderRadius: '10px' }}>
                  <Award size={24} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                Official alumni assigned MA numbers
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="mosa-card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Applications' },
                  { id: 'PENDING', label: `Pending (${pendingCount})` },
                  { id: 'UNDER_REVIEW', label: `Under Review (${underReviewCount})` },
                  { id: 'APPROVED', label: `Approved (${approvedCount})` },
                  { id: 'NEEDS_CORRECTION', label: 'Needs Correction' },
                  { id: 'REJECTED', label: 'Rejected' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: statusFilter === tab.id ? '1px solid #0B203E' : '1px solid #E2E8F0',
                      background: statusFilter === tab.id ? '#0B203E' : '#FFFFFF',
                      color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search box & Refresh */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search applicant name, nickname, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem 0.45rem 2rem',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.85rem',
                      width: '260px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="mosa-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Applicant Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Nickname at School</th>
                  <th style={{ padding: '0.85rem 1rem' }}>MASSH Cohort</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Submitted</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <AlertTriangle size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5, display: 'block' }} />
                      No applications found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const oHist = app.schoolHistory?.attendedOLevel && app.schoolHistory.oLevel ? `O-Level (${app.schoolHistory.oLevel.yearJoined}–${app.schoolHistory.oLevel.yearCompleted})` : null;
                    const aHist = app.schoolHistory?.attendedALevel && app.schoolHistory.aLevel ? `A-Level (${app.schoolHistory.aLevel.yearJoined}–${app.schoolHistory.aLevel.yearCompleted})` : null;
                    const cohortSummary = [oHist, aHist].filter(Boolean).join(' • ') || 'Alumnus Record';

                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {/* Name */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0B203E' }}>
                            {app.firstName} {app.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Ref: {app.referenceId || app.id}
                          </div>
                        </td>

                        {/* Nickname */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {app.nickname ? (
                            <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', border: '1px solid #FDE68A' }}>
                              "{app.nickname}"
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>

                        {/* School History */}
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155' }}>
                          {cohortSummary}
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                          <div>{app.phone}</div>
                          <div style={{ color: '#64748B' }}>{app.email}</div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className={`status-badge ${app.status}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                          {app.assignedAlumniNumber && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <span className="alumni-no-pill" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                                {app.assignedAlumniNumber}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => setSelectedApp(app)}
                            >
                              <Eye size={14} /> Review Details
                            </button>
                            {app.status !== 'APPROVED' && (
                              <button
                                className="btn btn-gold"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                onClick={() => setApprovalModalApp(app)}
                              >
                                <Award size={14} /> Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 4: VERIFICATION DESK */}
      {activeAdminTab === 'verification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="mosa-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={22} color="#D97706" />
              <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0 }}>
                MOSA Official Credential Verification Desk
              </h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              Search any alumnus by Official MA Number, Full Name, Email, or Mobile Phone to confirm validity and view official credentials.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '640px' }}>
              <input
                className="form-control"
                placeholder="Enter MA Number (e.g. MA. 0248 or MA.-0001), Name, or Phone"
                value={verifySearchQuery}
                onChange={e => setVerifySearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePerformVerification(); }}
                style={{ fontSize: '0.95rem', padding: '0.65rem 0.85rem' }}
              />
              <button
                className="btn btn-primary"
                onClick={handlePerformVerification}
                style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
              >
                <Search size={16} /> Verify Credential
              </button>
            </div>
          </div>

          {verifySearched && searchedMember && (
            <div className="mosa-card" style={{ padding: '1.75rem', border: '2px solid #059669', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#0B203E', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' }}>
                    {searchedMember.firstName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.35rem', color: '#0B203E', margin: 0 }}>
                        {searchedMember.fullName || `${searchedMember.firstName} ${searchedMember.lastName}`}
                      </h3>
                      {searchedMember.nickname && (
                        <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          "{searchedMember.nickname}"
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {searchedMember.email} • {searchedMember.phone}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="alumni-no-pill large" style={{ fontSize: '1.15rem' }}>
                    {searchedMember.alumniNumber}
                  </span>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className={`status-badge ${searchedMember.membershipStatus}`}>
                      {searchedMember.membershipStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid-3" style={{ fontSize: '0.85rem', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>O-Level History</div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem' }}>
                    {searchedMember.schoolHistory?.oLevel ? `${searchedMember.schoolHistory.oLevel.yearJoined} – ${searchedMember.schoolHistory.oLevel.yearCompleted} (${searchedMember.schoolHistory.oLevel.campus})` : 'Not recorded'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>A-Level History</div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem' }}>
                    {searchedMember.schoolHistory?.aLevel ? `${searchedMember.schoolHistory.aLevel.yearJoined} – ${searchedMember.schoolHistory.aLevel.yearCompleted} (${searchedMember.schoolHistory.aLevel.campus})` : 'Not recorded'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location &amp; Career</div>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginTop: '0.2rem' }}>
                    {searchedMember.city || 'Hoima'}, {searchedMember.country || 'Uganda'} • {searchedMember.occupation || 'Alumnus'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenNumberModal(searchedMember)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <Edit3 size={14} /> Reassign MA Number
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenStatusModal(searchedMember)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <UserX size={14} /> Change Status / Suspend
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setHistoryMember(searchedMember)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <History size={14} /> Audit Trail
                </button>
              </div>
            </div>
          )}

          {verifySearched && !searchedMember && (
            <div className="mosa-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              <AlertTriangle size={36} color="#D97706" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0B203E' }}>
                No Verified Alumnus Found
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: '440px', margin: '0.35rem auto 0 auto' }}>
                No record matched "{verifySearchQuery}". Verify spelling or check the Applications Queue to see if the applicant is pending verification.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ASSISTED REGISTRATION DESK */}
      {activeAdminTab === 'assisted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="mosa-card" style={{ padding: '1.5rem', background: '#F8FAFC', borderLeft: '4px solid #D97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <UserPlus size={22} color="#D97706" />
              <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0 }}>
                Assisted Registration Desk (For Device-Free Alumni)
              </h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              Register alumni present at meetings, AGMs, or homecoming events who do not own smartphones, computers, or internet access.
              The system records the alumnus's genuine identity while logging the administrator/station details separately in the audit trail.
            </p>
          </div>

          {assistedSuccess ? (
            <div className="mosa-card" style={{ padding: '2.5rem', textAlign: 'center', background: '#FFFFFF', border: '2px solid #059669' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={38} />
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#0B203E', margin: '0 0 0.25rem 0' }}>
                Assisted Registration Successfully Completed!
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
                <strong>{assistedSuccess.name}</strong> is now registered as an official MASSH alumnus.
              </p>

              <div style={{ display: 'inline-block', background: '#0B203E', color: '#FBBF24', padding: '1rem 2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Official MOSA Membership Number</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace', marginTop: '0.25rem' }}>
                  {assistedSuccess.alumniNumber}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.25rem' }}>Ref ID: {assistedSuccess.referenceId}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setAssistedSuccess(null);
                    setAssistedForm(prev => ({
                      ...prev,
                      firstName: '',
                      middleName: '',
                      lastName: '',
                      nickname: '',
                      phone: '',
                      email: '',
                      occupation: '',
                      organisation: '',
                    }));
                  }}
                >
                  <UserPlus size={15} /> Register Another Alumnus
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print Registration Slip
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAssistedSubmit} className="mosa-card" style={{ padding: '1.75rem' }}>
              {assistedError && (
                <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                  {assistedError}
                </div>
              )}

              {/* SECTION 1: ALUMNUS IDENTITY */}
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#0B203E', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={18} color="#D97706" /> 1. Alumnus Identity (The Person Being Registered)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label required">First Name</label>
                    <input
                      required
                      className="form-control"
                      value={assistedForm.firstName}
                      onChange={e => setAssistedForm({ ...assistedForm, firstName: e.target.value })}
                      placeholder="e.g. Robert"
                    />
                  </div>
                  <div>
                    <label className="form-label">Middle Name</label>
                    <input
                      className="form-control"
                      value={assistedForm.middleName}
                      onChange={e => setAssistedForm({ ...assistedForm, middleName: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="form-label required">Last Name</label>
                    <input
                      required
                      className="form-control"
                      value={assistedForm.lastName}
                      onChange={e => setAssistedForm({ ...assistedForm, lastName: e.target.value })}
                      placeholder="e.g. Mugisa"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nickname at MASSH</label>
                    <input
                      className="form-control"
                      value={assistedForm.nickname}
                      onChange={e => setAssistedForm({ ...assistedForm, nickname: e.target.value })}
                      placeholder="e.g. Bobby"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      value={assistedForm.gender}
                      onChange={e => setAssistedForm({ ...assistedForm, gender: e.target.value as any })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={assistedForm.dateOfBirth}
                      onChange={e => setAssistedForm({ ...assistedForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Primary or Guardian Phone</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 0772... (Family phone if device-free)"
                      value={assistedForm.phone}
                      onChange={e => setAssistedForm({ ...assistedForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email (Optional / Leave blank if none)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Optional"
                      value={assistedForm.email}
                      onChange={e => setAssistedForm({ ...assistedForm, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Cohort & Campus */}
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0B203E', marginBottom: '0.5rem' }}>
                    MASSH School History:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>O-Level Joined</label>
                      <input
                        type="number"
                        className="form-control"
                        value={assistedForm.oYearJoined}
                        onChange={e => setAssistedForm({ ...assistedForm, oYearJoined: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>O-Level Completed</label>
                      <input
                        type="number"
                        className="form-control"
                        value={assistedForm.oYearCompleted}
                        onChange={e => setAssistedForm({ ...assistedForm, oYearCompleted: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>A-Level Completed</label>
                      <input
                        type="number"
                        className="form-control"
                        value={assistedForm.aYearCompleted}
                        onChange={e => setAssistedForm({ ...assistedForm, aYearCompleted: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Campus</label>
                      <select
                        className="form-control"
                        value={assistedForm.oCampus}
                        onChange={e => setAssistedForm({ ...assistedForm, oCampus: e.target.value, aCampus: e.target.value })}
                      >
                        <option value="Main Campus Hoima">Main Campus Hoima</option>
                        <option value="Annex Campus">Annex Campus</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECRETARIAT & AGENT METADATA */}
              <div style={{ marginBottom: '1.5rem', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem 1.25rem', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '1rem', color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={18} color="#D97706" /> 2. Registration Desk &amp; Agent Metadata (Who is Performing Registration)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#78350F' }}>Registering Administrator</label>
                    <input
                      disabled
                      className="form-control"
                      value={`${currentUser?.displayName || 'Secretariat Staff'} (${adminEmail})`}
                      style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#78350F' }}>Station / Registration Desk Location</label>
                    <input
                      className="form-control"
                      value={assistedForm.registrationDeskStation}
                      onChange={e => setAssistedForm({ ...assistedForm, registrationDeskStation: e.target.value })}
                      placeholder="e.g. Secretariat Main Hall Desk"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#78350F' }}>Device / Terminal Notes</label>
                    <input
                      className="form-control"
                      value={assistedForm.registrationDeviceNotes}
                      onChange={e => setAssistedForm({ ...assistedForm, registrationDeviceNotes: e.target.value })}
                      placeholder="e.g. Secretariat Terminal iPad #1"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', color: '#92400E', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={assistedForm.immediateApproval}
                      onChange={e => setAssistedForm({ ...assistedForm, immediateApproval: e.target.checked })}
                    />
                    <span>Immediately Approve &amp; Assign Official MA Number upon Submission</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={assistedLoading}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Award size={18} />
                  <span>{assistedLoading ? 'Submitting & Allocating...' : 'Register Alumnus & Assign Official MA Number'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#0B203E' }}>
                  Application Review: {selectedApp.firstName} {selectedApp.lastName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                  <span>Ref: <strong style={{ fontFamily: 'monospace', color: '#0B203E' }}>{selectedApp.referenceId || selectedApp.id}</strong></span>
                  <span>•</span>
                  <span>Submitted: {new Date(selectedApp.submittedAt).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <XCircle size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Correction Alert if previously requested */}
              {selectedApp.correctionReason && (
                <div style={{
                  background: '#FFFBEB',
                  borderLeft: '4px solid #D97706',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={16} /> Active Correction Request
                  </div>
                  <div style={{ color: '#78350F' }}>
                    {selectedApp.correctionReason}
                  </div>
                  {selectedApp.correctionHistory && selectedApp.correctionHistory.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.4rem' }}>
                      Correction rounds: {selectedApp.correctionHistory.length}
                    </div>
                  )}
                </div>
              )}

              {/* Status Header */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Status:</span>
                  <span className={`status-badge ${selectedApp.status}`}>
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedApp.assignedAlumniNumber && (
                  <div>
                    <span style={{ fontSize: '0.85rem', marginRight: '0.5rem', color: '#64748B' }}>Assigned Number:</span>
                    <span className="alumni-no-pill large">{selectedApp.assignedAlumniNumber}</span>
                  </div>
                )}
              </div>

              {/* Personal & Nickname at School */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={18} color="#D97706" /> 1. Personal Identity & MASSH Nickname
                </h4>
                <div className="grid-3" style={{ fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Full Name:</span>
                    <div style={{ fontWeight: 600 }}>{selectedApp.firstName} {selectedApp.middleName} {selectedApp.lastName}</div>
                  </div>
                  <div style={{ background: '#FEF3C7', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                    <span style={{ color: '#92400E', fontWeight: 700 }}>Nickname at School:</span>
                    <div style={{ fontWeight: 700, color: '#B45309', fontSize: '1rem' }}>
                      {selectedApp.nickname ? `"${selectedApp.nickname}"` : 'None registered'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Gender & DOB:</span>
                    <div style={{ fontWeight: 600 }}>{selectedApp.gender} • {selectedApp.dateOfBirth}</div>
                  </div>
                </div>
              </div>

              {/* School History */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} color="#059669" /> 2. MASSH School History Verification
                </h4>

                {/* O-Level */}
                <div style={{ padding: '0.75rem', background: selectedApp.schoolHistory.attendedOLevel ? '#F0FDF4' : '#F8FAFC', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '0.25rem' }}>
                    Ordinary Level (O-Level): {selectedApp.schoolHistory.attendedOLevel ? 'Attended at MASSH' : 'Not attended at MASSH'}
                  </div>
                  {selectedApp.schoolHistory.attendedOLevel && selectedApp.schoolHistory.oLevel && (
                    <div className="grid-3" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <div><span style={{ color: '#64748B' }}>Years:</span> <strong>{selectedApp.schoolHistory.oLevel.yearJoined} – {selectedApp.schoolHistory.oLevel.yearCompleted}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Campus:</span> <strong>{selectedApp.schoolHistory.oLevel.campus}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Class & Stream:</span> <strong>{selectedApp.schoolHistory.oLevel.class} ({selectedApp.schoolHistory.oLevel.stream})</strong></div>
                    </div>
                  )}
                </div>

                {/* A-Level */}
                <div style={{ padding: '0.75rem', background: selectedApp.schoolHistory.attendedALevel ? '#EFF6FF' : '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '0.25rem' }}>
                    Advanced Level (A-Level): {selectedApp.schoolHistory.attendedALevel ? 'Attended at MASSH' : 'Not attended at MASSH'}
                  </div>
                  {selectedApp.schoolHistory.attendedALevel && selectedApp.schoolHistory.aLevel && (
                    <div className="grid-3" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <div><span style={{ color: '#64748B' }}>Years:</span> <strong>{selectedApp.schoolHistory.aLevel.yearJoined} – {selectedApp.schoolHistory.aLevel.yearCompleted}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Campus:</span> <strong>{selectedApp.schoolHistory.aLevel.campus}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Combination:</span> <strong>{selectedApp.schoolHistory.aLevel.combination}</strong></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Current Info */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#0B203E', marginBottom: '0.75rem' }}>
                  3. Contact & Current Career
                </h4>
                <div className="grid-2" style={{ fontSize: '0.85rem' }}>
                  <div><span style={{ color: '#64748B' }}>Phone:</span> <strong>{selectedApp.phone}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Email:</span> <strong>{selectedApp.email}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Location:</span> <strong>{selectedApp.city}, {selectedApp.country}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Occupation:</span> <strong>{selectedApp.occupation || 'N/A'} ({selectedApp.organisation || 'N/A'})</strong></div>
                </div>
              </div>

              {/* Review notes input */}
              <div className="form-group">
                <label className="form-label">Review / Verification Committee Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Notes on records checked, confirmation with MASSH archives, etc..."
                  value={reviewNotes || selectedApp.reviewNotes || ''}
                  onChange={e => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedApp.id, 'UNDER_REVIEW')}
                >
                  Mark Under Review
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  onClick={() => handleOpenCorrectionModal(selectedApp)}
                  style={{ color: '#C2410C', borderColor: '#FDBA74', background: '#FFF7ED', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <AlertTriangle size={14} /> Request Correction
                </button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')}
                >
                  Reject
                </button>
              </div>

              <div>
                {selectedApp.status !== 'APPROVED' ? (
                  <button
                    className="btn btn-gold"
                    onClick={() => {
                      setApprovalModalApp(selectedApp);
                      setSelectedApp(null);
                    }}
                  >
                    <Award size={16} /> Approve & Assign MA Number
                  </button>
                ) : (
                  <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={18} /> Verified Alumni Record
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MA GENERATION WITH OPTIONAL MANUAL NUMBER */}
      {approvalModalApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header" style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#D97706" /> Confirm Alumni Approval
              </h3>
              <button onClick={() => setApprovalModalApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="#92400E" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                You are about to approve the application for:
              </p>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', marginBottom: '0.2rem' }}>
                {approvalModalApp.firstName} {approvalModalApp.lastName}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                Ref: {approvalModalApp.referenceId || approvalModalApp.id}
              </div>

              {approvalModalApp.nickname && (
                <div style={{ color: '#92400E', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Nickname at School: "{approvalModalApp.nickname}"
                </div>
              )}

              {/* MA Number generation box */}
              <div style={{ background: '#F8FAFC', border: '2px dashed #059669', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.05em' }}>
                  Official Alumni Number to be Assigned:
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#065F46', margin: '0.5rem 0', fontFamily: 'var(--font-heading)' }}>
                  {useManualMA && manualMANumberInput.trim() ? manualMANumberInput.trim().toUpperCase() : nextNumberPreview}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {useManualMA ? 'Manual assignment mode active • Checked for registry collision' : 'Generated atomically via sequential counter • Cannot be reused'}
                </div>
              </div>

              {/* Manual MA Assignment Toggle & Input */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#0B203E' }}>
                  <input
                    type="checkbox"
                    checked={useManualMA}
                    onChange={e => {
                      setUseManualMA(e.target.checked);
                      setManualMAError('');
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#0B203E' }}
                  />
                  <span>Manually specify Alumni Number (e.g. for Pioneer Cohorts)</span>
                </label>

                {useManualMA && (
                  <div style={{ marginTop: '0.65rem' }}>
                    <input
                      type="text"
                      value={manualMANumberInput}
                      onChange={e => {
                        setManualMANumberInput(e.target.value);
                        setManualMAError('');
                      }}
                      placeholder="e.g. MA. 0472 or 0472"
                      className="form-control"
                      style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Validated against permanent anti-reuse registry. Collisions are blocked.
                    </div>
                    {manualMAError && (
                      <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                        {manualMAError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#475569', background: '#F1F5F9', padding: '0.75rem', borderRadius: '8px' }}>
                <strong>Actions to occur on approval:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
                  <li>Application marked <code>APPROVED</code></li>
                  <li>Permanent <code>{useManualMA && manualMANumberInput.trim() ? manualMANumberInput.trim().toUpperCase() : nextNumberPreview}</code> assigned to applicant</li>
                  <li>Official profile created in the MOSA verified directory</li>
                  <li>Number registered permanently in anti-collision ledger</li>
                  <li>Action logged in permanent audit trail</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setApprovalModalApp(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="btn btn-emerald" onClick={handleConfirmApproval} disabled={actionLoading}>
                {actionLoading ? 'Assigning MA Number...' : `Confirm & Assign ${useManualMA && manualMANumberInput.trim() ? manualMANumberInput.trim().toUpperCase() : nextNumberPreview}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CORRECTION MODAL */}
      {isCorrectionModalOpen && correctionTargetApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ background: '#FFF7ED', borderBottom: '1px solid #FFEDD5' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#D97706" /> Request Application Correction
              </h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="#9A3412" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Specify instructions for <strong>{correctionTargetApp.firstName} {correctionTargetApp.lastName}</strong> ({correctionTargetApp.referenceId || correctionTargetApp.id}) explaining what information needs correction.
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                  Correction Instructions / Feedback <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  className="form-control"
                  placeholder="e.g. Please update your A-Level completion year. School records indicate class of 2021 rather than 2022. Also please provide your school nickname."
                  value={correctionReasonInput}
                  onChange={e => setCorrectionReasonInput(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  This message will be recorded in the applicant's notification ledger, and the application status will change to <strong>NEEDS_CORRECTION</strong>.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsCorrectionModalOpen(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#C2410C', borderColor: '#C2410C' }}
                onClick={handleSubmitCorrection}
                disabled={actionLoading || !correctionReasonInput.trim()}
              >
                {actionLoading ? 'Sending Request...' : 'Send Correction Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL SUCCESS CELEBRATION MODAL */}
      {approvalResult && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={36} color="#059669" />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#0B203E', marginBottom: '0.5rem' }}>
              Alumni Successfully Approved!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <strong>{approvalResult.applicantName}</strong> is now an official verified member of the Mandela Old Students Association.
            </p>

            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>Assigned Official Alumni Number</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#92400E', letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}>
                {approvalResult.alumniNumber}
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setApprovalResult(null)}>
              Continue Reviewing
            </button>
          </div>
        </div>
      )}

      {/* MANUAL MEMBERSHIP NUMBER ASSIGNMENT MODAL */}
      {editingNumberMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0B203E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={18} color="#0B203E" /> Change Membership Number
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Alumnus: <strong>{editingNumberMember.fullName}</strong>
                </div>
              </div>
              <button onClick={() => setEditingNumberMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="#64748B" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#4338CA', textTransform: 'uppercase', fontWeight: 700 }}>Current Membership Number</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B', marginTop: '0.2rem' }}>
                  {editingNumberMember.alumniNumber}
                </div>
              </div>

              {numberError && (
                <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> {numberError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                  New Membership Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. MA.-0042"
                    value={newNumberInput}
                    onChange={e => setNewNumberInput(e.target.value)}
                    style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.05em' }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                    onClick={() => {
                      if (systemSettings) {
                        const formatted = dataService.formatAlumniNumber(systemSettings.nextAlumniNumber, systemSettings.prefix, systemSettings.padDigits);
                        setNewNumberInput(formatted);
                      }
                    }}
                  >
                    Suggest Next
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  Anti-collision guard is active: Duplicate numbers across all alumni profiles will be blocked.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                  Audit Reason for Number Change <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="e.g. Corrected to legacy manual register number from 2004 class roll."
                  value={numberChangeReason}
                  onChange={e => setNumberChangeReason(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  This reason will be permanently recorded in the system audit trail and member history.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingNumberMember(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveMembershipNumber()}
                disabled={actionLoading || !newNumberInput.trim() || !numberChangeReason.trim()}
              >
                {actionLoading ? 'Updating Number...' : 'Save & Record Audit Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MANAGEMENT & DISAPPROVAL MODAL */}
      {statusMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{
              background: selectedNewStatus === 'DISAPPROVED' ? '#FFF1F2' : '#F8FAFC',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.15rem',
                  color: selectedNewStatus === 'DISAPPROVED' ? '#991B1B' : '#0B203E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {selectedNewStatus === 'DISAPPROVED' ? <UserX size={18} color="#EF4444" /> : <ShieldCheck size={18} color="#0B203E" />}
                  Manage Membership Status
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Alumnus: <strong>{statusMember.fullName}</strong> ({statusMember.alumniNumber})
                </div>
              </div>
              <button onClick={() => setStatusMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="#64748B" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Current Status</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`status-badge ${statusMember.membershipStatus}`}>
                      {statusMember.membershipStatus}
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} color="#94A3B8" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>New Status</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className={`status-badge ${selectedNewStatus}`}>
                      {selectedNewStatus}
                    </span>
                  </div>
                </div>
              </div>

              {statusError && (
                <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> {statusError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                  Select Membership Status <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={selectedNewStatus}
                  onChange={e => setSelectedNewStatus(e.target.value as MembershipStatus)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="ACTIVE">ACTIVE / APPROVED (Full privileges)</option>
                  <option value="DISAPPROVED">DISAPPROVED (Revoke membership with official reason)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporary hold)</option>
                  <option value="PENDING">PENDING (Pending verification)</option>
                </select>
              </div>

              {selectedNewStatus === 'DISAPPROVED' && (
                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={15} /> Admin Disapproval Notice
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7F1D1D', lineHeight: 1.4 }}>
                    Disapproving a member will invalidate their verification status in public directory queries and revoke their voting privileges. You must specify a clear reason.
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                  {selectedNewStatus === 'DISAPPROVED' ? 'Official Disapproval Reason' : 'Status Change Reason / Notes'} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder={
                    selectedNewStatus === 'DISAPPROVED'
                      ? 'e.g. School registrar confirmed no enrollment records for the requested 2012-2015 cohort.'
                      : 'e.g. Reactivated upon submission of certified UCE certificate.'
                  }
                  value={statusChangeReason}
                  onChange={e => setStatusChangeReason(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                  Recorded in the system audit trail and sent in member notification.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStatusMember(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{
                  background: selectedNewStatus === 'DISAPPROVED' ? '#DC2626' : undefined,
                  borderColor: selectedNewStatus === 'DISAPPROVED' ? '#DC2626' : undefined
                }}
                onClick={() => handleSaveMemberStatus()}
                disabled={actionLoading || (selectedNewStatus === 'DISAPPROVED' && !statusChangeReason.trim())}
              >
                {actionLoading ? 'Updating Status...' : selectedNewStatus === 'DISAPPROVED' ? 'Confirm Disapproval' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER AUDIT TRAIL / HISTORY MODAL */}
      {historyMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0B203E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="#0B203E" /> Audit Trail: {historyMember.fullName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  MA Number: <strong style={{ color: '#0B203E' }}>{historyMember.alumniNumber}</strong> • Status: <strong>{historyMember.membershipStatus}</strong>
                </div>
              </div>
              <button onClick={() => setHistoryMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} color="#64748B" />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem' }}>
              {/* Membership Number Change Log */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Edit3 size={15} color="#2563EB" /> Membership Number Audit History
                </div>
                {!historyMember.numberChangeHistory || historyMember.numberChangeHistory.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    No manual number changes recorded. Assigned original number upon registration.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {historyMember.numberChangeHistory.map((entry, idx) => (
                      <div key={idx} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#1E3A8A' }}>
                          <span>
                            Changed: <code style={{ textDecoration: 'line-through', color: '#DC2626' }}>{entry.previousNumber}</code> → <code style={{ color: '#059669', fontWeight: 800 }}>{entry.newNumber}</code>
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {new Date(entry.changedAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ color: '#334155', marginTop: '0.35rem' }}>
                          <strong>Reason:</strong> {entry.reason || 'No reason specified'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                          Changed by: {entry.changedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Change Log */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} color="#059669" /> Membership Status Audit History
                </div>
                {!historyMember.statusHistory || historyMember.statusHistory.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    Initial status: <strong>{historyMember.membershipStatus}</strong> (Approved automatically upon registration).
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {historyMember.statusHistory.map((entry, idx) => {
                      const isDis = entry.status === 'DISAPPROVED' || entry.status === 'REJECTED';
                      return (
                        <div key={idx} style={{
                          background: isDis ? '#FFF1F2' : '#F0FDF4',
                          border: isDis ? '1px solid #FECDD3' : '1px solid #BBF7D0',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`status-badge ${entry.status}`}>
                              {entry.status}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              {new Date(entry.changedAt).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <div style={{ color: isDis ? '#991B1B' : '#166534', marginTop: '0.35rem' }}>
                              <strong>Reason:</strong> {entry.reason}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                            Admin: {entry.changedBy}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHistoryMember(null)}>
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED ADMIN MEMBER MANAGEMENT MODAL */}
      {adminManagingMember && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1100 }}>
          <div className="mosa-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 20px 40px rgba(11, 32, 62, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ background: '#0B203E', color: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>
                  {adminManagingMember.firstName ? adminManagingMember.firstName[0] : 'M'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {adminManagingMember.fullName || `${adminManagingMember.firstName} ${adminManagingMember.lastName}`}
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.15)', color: '#FBBF24', fontFamily: 'monospace' }}>
                      {adminManagingMember.alumniNumber}
                    </span>
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span>Status: <strong style={{ color: adminManagingMember.membershipStatus === 'ACTIVE' || adminManagingMember.membershipStatus === 'APPROVED' ? '#4ADE80' : adminManagingMember.membershipStatus === 'DISAPPROVED' || adminManagingMember.membershipStatus === 'REJECTED' ? '#F87171' : '#FBBF24' }}>{adminManagingMember.membershipStatus}</strong></span>
                    <span>•</span>
                    <span>{adminManagingMember.email || 'No email registered'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setAdminManagingMember(null)}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Internal Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', padding: '0.5rem 1rem 0 1rem', gap: '0.5rem', overflowX: 'auto' }}>
              {[
                { id: 'status', label: 'Membership Status', icon: ShieldCheck },
                { id: 'number', label: 'Change MA Number', icon: Award },
                { id: 'history', label: 'Audit Trail & History', icon: History },
                { id: 'profile', label: 'Profile Summary', icon: UserCheck },
                { id: 'delete', label: 'Delete Record', icon: Trash2 },
              ].map(t => {
                const Icon = t.icon;
                const isActive = adminModalTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAdminModalTab(t.id as any)}
                    style={{
                      padding: '0.65rem 0.95rem',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #D97706' : '3px solid transparent',
                      background: 'transparent',
                      color: isActive ? '#0B203E' : '#64748B',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon size={15} color={isActive ? '#D97706' : '#64748B'} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
              
              {/* TAB 1: MEMBERSHIP STATUS */}
              {adminModalTab === 'status' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Current Status</div>
                      <div style={{ marginTop: '0.2rem' }}>
                        <span className={`status-badge ${adminManagingMember.membershipStatus}`}>
                          {adminManagingMember.membershipStatus}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={18} color="#94A3B8" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>New Status</div>
                      <div style={{ marginTop: '0.2rem' }}>
                        <span className={`status-badge ${selectedNewStatus}`}>
                          {selectedNewStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {statusError && (
                    <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> {statusError}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                      Select Target Status <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      className="form-control"
                      value={selectedNewStatus}
                      onChange={e => setSelectedNewStatus(e.target.value as MembershipStatus)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="ACTIVE">ACTIVE / APPROVED (Full privileges & directory access)</option>
                      <option value="DISAPPROVED">DISAPPROVED (Revoke membership with official reason)</option>
                      <option value="SUSPENDED">SUSPENDED (Temporary hold)</option>
                      <option value="DECEASED">DECEASED (Archived in memorial record)</option>
                      <option value="PENDING">PENDING (Pending credentials verification)</option>
                    </select>
                  </div>

                  {selectedNewStatus === 'DISAPPROVED' && (
                    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                        <AlertTriangle size={15} /> Official Disapproval Notice
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7F1D1D', lineHeight: 1.4 }}>
                        Disapproving a member revokes portal access and invalidates their verification in public queries. You must state an official audit reason.
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                      {selectedNewStatus === 'DISAPPROVED' ? 'Official Disapproval Reason' : 'Status Change Reason / Notes'} <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder={
                        selectedNewStatus === 'DISAPPROVED'
                          ? 'e.g. School registrar confirmed no enrollment records for the requested 2012-2015 cohort.'
                          : 'e.g. Reactivated upon submission of certified UCE certificate.'
                      }
                      value={statusChangeReason}
                      onChange={e => setStatusChangeReason(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                      Recorded permanently in the system governance audit trail.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{
                        background: selectedNewStatus === 'DISAPPROVED' ? '#DC2626' : undefined,
                        borderColor: selectedNewStatus === 'DISAPPROVED' ? '#DC2626' : undefined,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onClick={() => handleSaveMemberStatus(adminManagingMember)}
                      disabled={actionLoading || ((selectedNewStatus === 'DISAPPROVED' || selectedNewStatus === 'REJECTED') && !statusChangeReason.trim())}
                    >
                      <Save size={16} />
                      {actionLoading ? 'Saving...' : selectedNewStatus === 'DISAPPROVED' ? 'Confirm Disapproval' : 'Save Status Update'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CHANGE MA NUMBER */}
              {adminModalTab === 'number' && (
                <div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Currently Allocated MA Number</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B203E', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      {adminManagingMember.alumniNumber}
                    </div>
                  </div>

                  {numberError && (
                    <div style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> {numberError}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                      New Membership Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. MA.-0042"
                        value={newNumberInput}
                        onChange={e => setNewNumberInput(e.target.value)}
                        style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.05em' }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                        onClick={() => {
                          if (systemSettings) {
                            const formatted = dataService.formatAlumniNumber(systemSettings.nextAlumniNumber, systemSettings.prefix, systemSettings.padDigits);
                            setNewNumberInput(formatted);
                          }
                        }}
                      >
                        Suggest Next
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                      Anti-collision guard active: Duplicate numbers across all alumni profiles will be blocked.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#0B203E' }}>
                      Audit Reason for Number Change <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="e.g. Corrected to legacy manual register number from 2004 class roll."
                      value={numberChangeReason}
                      onChange={e => setNumberChangeReason(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                      This reason will be permanently recorded in the system audit trail and member history.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveMembershipNumber(adminManagingMember)}
                      disabled={actionLoading || !newNumberInput.trim() || !numberChangeReason.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Save size={16} />
                      {actionLoading ? 'Updating Number...' : 'Save & Record Audit Log'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL & HISTORY */}
              {adminModalTab === 'history' && (
                <div>
                  {/* Membership Number Change Log */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Edit3 size={15} color="#2563EB" /> Membership Number Audit History
                    </div>
                    {!adminManagingMember.numberChangeHistory || adminManagingMember.numberChangeHistory.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        No manual number changes recorded. Assigned original number upon registration.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {adminManagingMember.numberChangeHistory.map((entry, idx) => (
                          <div key={idx} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#1E3A8A' }}>
                              <span>
                                Changed: <code style={{ textDecoration: 'line-through', color: '#DC2626' }}>{entry.previousNumber}</code> → <code style={{ color: '#059669', fontWeight: 800 }}>{entry.newNumber}</code>
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                {new Date(entry.changedAt).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ color: '#334155', marginTop: '0.35rem' }}>
                              <strong>Reason:</strong> {entry.reason || 'No reason specified'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                              Changed by: {entry.changedBy}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Change Log */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={15} color="#059669" /> Membership Status Audit History
                    </div>
                    {!adminManagingMember.statusHistory || adminManagingMember.statusHistory.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        Initial status: <strong>{adminManagingMember.membershipStatus}</strong> (Approved automatically upon registration).
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {adminManagingMember.statusHistory.map((entry, idx) => {
                          const isDis = entry.status === 'DISAPPROVED' || entry.status === 'REJECTED';
                          return (
                            <div key={idx} style={{
                              background: isDis ? '#FFF1F2' : '#F0FDF4',
                              border: isDis ? '1px solid #FECDD3' : '1px solid #BBF7D0',
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              fontSize: '0.8rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`status-badge ${entry.status}`}>
                                  {entry.status}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                  {new Date(entry.changedAt).toLocaleString()}
                                </span>
                              </div>
                              {entry.reason && (
                                <div style={{ color: isDis ? '#991B1B' : '#166534', marginTop: '0.35rem' }}>
                                  <strong>Reason:</strong> {entry.reason}
                                </div>
                              )}
                              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.2rem' }}>
                                Admin: {entry.changedBy}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE SUMMARY */}
              {adminModalTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>CONTACT INFORMATION</span>
                      <div style={{ marginTop: '0.35rem', color: '#0B203E' }}>
                        <div><strong>Email:</strong> {adminManagingMember.email || 'None'}</div>
                        <div><strong>Phone:</strong> {adminManagingMember.phone || 'None'}</div>
                        <div><strong>Location:</strong> {adminManagingMember.city || 'Hoima'}, {adminManagingMember.country || 'Uganda'}</div>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>EDUCATION & CAMPUS</span>
                      <div style={{ marginTop: '0.35rem', color: '#0B203E' }}>
                        {adminManagingMember.schoolHistory?.oLevel && (
                          <div><strong>O-Level:</strong> {adminManagingMember.schoolHistory.oLevel.yearJoined}–{adminManagingMember.schoolHistory.oLevel.yearCompleted} ({adminManagingMember.schoolHistory.oLevel.campus})</div>
                        )}
                        {adminManagingMember.schoolHistory?.aLevel && (
                          <div><strong>A-Level:</strong> {adminManagingMember.schoolHistory.aLevel.yearJoined}–{adminManagingMember.schoolHistory.aLevel.yearCompleted} ({adminManagingMember.schoolHistory.aLevel.combination})</div>
                        )}
                        {adminManagingMember.gender && (
                          <div><strong>Gender:</strong> {adminManagingMember.gender}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>PROFESSION & WORK</span>
                      <div style={{ marginTop: '0.35rem', color: '#0B203E' }}>
                        <div><strong>Occupation:</strong> {adminManagingMember.occupation || 'Alumnus'}</div>
                        <div><strong>Organisation:</strong> {adminManagingMember.organisation || 'N/A'}</div>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>REGISTRATION DETAILS</span>
                      <div style={{ marginTop: '0.35rem', color: '#0B203E' }}>
                        <div><strong>Internal ID:</strong> <code style={{ fontSize: '0.75rem' }}>{adminManagingMember.internalId}</code></div>
                        {adminManagingMember.registeredBy?.name && (
                          <div><strong>Recorded By:</strong> {adminManagingMember.registeredBy.name}</div>
                        )}
                        {adminManagingMember.registrationMode && (
                          <div><strong>Mode:</strong> {adminManagingMember.registrationMode}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DELETE RECORD WITH PERMANENT LEDGER RETENTION */}
              {adminModalTab === 'delete' && (
                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '10px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>
                    <Trash2 size={18} /> Permanent Record Removal with Ledger Preservation
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#7F1D1D', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    Removing this member record will permanently deactivate their account. Under Phase 4 permanent non-repeating rules, membership number <strong>{adminManagingMember.alumniNumber}</strong> will remain permanently reserved in the system ledger and can never be reissued to another person.
                  </p>
                  <button
                    onClick={handleDeleteMemberPermanently}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} /> {actionLoading ? 'Deleting...' : 'Confirm Deletion & Reserve MA Number'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setAdminManagingMember(null)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close Management Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Membership Card Preview Modal */}
      {cardPreviewMember && (
        <DigitalMembershipCardModal
          alumnus={cardPreviewMember}
          isOpen={!!cardPreviewMember}
          onClose={() => setCardPreviewMember(null)}
          onOpenPublicVerification={(alumniNo) => {
            setCardPreviewMember(null);
            setActiveAdminTab('verification');
            setVerifySearchQuery(alumniNo);
          }}
        />
      )}
    </div>
  );
};
