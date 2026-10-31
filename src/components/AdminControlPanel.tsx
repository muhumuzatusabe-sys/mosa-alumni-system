import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  FileText, 
  History, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  Plus, 
  Trash2, 
  Hash, 
  Sliders, 
  Sparkles,
  Award,
  Layers,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  RefreshCw,
  X,
  UserPlus,
  KeyRound,
  UserCheck,
  CheckSquare,
  Square,
  Filter,
  AlertTriangle,
  Globe,
  ChevronDown,
  Clock,
  Search,
  Edit3,
  Briefcase,
  Vote,
  XCircle,
  ExternalLink,
  CreditCard,
  LayoutDashboard,
  Download,
  Key,
  Phone,
  BookOpen,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { 
  AuthUser, 
  SystemSettings, 
  ModuleSettings, 
  MOSADocument, 
  AuditLog,
  AuthSettings,
  UserRole,
  AlumniProfile,
  PermissionModule,
  OpportunityItem,
  MentorProfile,
  ElectionCycle,
  Candidate,
  AlumniApplication
} from '../types';
import { dataService } from '../services/dataService';
import { governanceService, ADMIN_ROLES, PERMISSION_MODULES } from '../services/governanceService';
import { AdminApplicationReview } from './AdminApplicationReview';
import { AttendanceManager } from './AttendanceManager';
import { CMSManager } from './CMSManager';
import { MembershipCardAdmin } from './MembershipCardAdmin';
import { WelcomePageManager } from './WelcomePageManager';
import { LeadershipOfficesManager } from './LeadershipOfficesManager';
import { MemberDataExportManager } from './MemberDataExportManager';
import { SecretariatManager } from './SecretariatManager';

const DEFAULT_MODULES_BY_ROLE: Record<string, PermissionModule[]> = {
  SUPER_ADMIN: ['REGISTRY', 'FINANCE', 'ATTENDANCE', 'EVENTS', 'COMMUNICATIONS', 'CHAPTERS', 'DOCUMENTS', 'USERS', 'REPORTS', 'SETTINGS', 'AUDIT', 'OPPORTUNITIES', 'ELECTIONS'],
  ADMIN: ['REGISTRY', 'FINANCE', 'ATTENDANCE', 'EVENTS', 'COMMUNICATIONS', 'CHAPTERS', 'DOCUMENTS', 'USERS', 'REPORTS', 'OPPORTUNITIES', 'ELECTIONS'],
  SECRETARY: ['REGISTRY', 'ATTENDANCE', 'DOCUMENTS', 'REPORTS', 'ELECTIONS'],
  TREASURER: ['FINANCE', 'REPORTS', 'DOCUMENTS'],
  MEMBERSHIP_ADMIN: ['REGISTRY', 'REPORTS', 'DOCUMENTS'],
  DIRECTORY_ADMIN: ['REGISTRY', 'CHAPTERS', 'REPORTS', 'OPPORTUNITIES'],
  EVENTS_ATTENDANCE_ADMIN: ['EVENTS', 'ATTENDANCE', 'REPORTS'],
  PUBLICITY: ['COMMUNICATIONS', 'EVENTS', 'DOCUMENTS'],
  CHAPTER_ADMIN: ['CHAPTERS', 'ATTENDANCE', 'COMMUNICATIONS'],
  CUSTOM_STAFF: ['REGISTRY', 'COMMUNICATIONS'],
};

const AVAILABLE_STAFF_MODULES: Array<{ key: PermissionModule; label: string; desc: string }> = [
  { key: 'REGISTRY', label: 'Alumni Registry & Verification', desc: 'Member directory, application queue, MA numbers, assisted registration, export registry' },
  { key: 'FINANCE', label: 'Contributions & Finance', desc: 'Voluntary contributions, verified receipts, donation tiers, financial reports' },
  { key: 'ATTENDANCE', label: 'Meeting Attendance Roll Call', desc: 'Assemblies, dynamic QR check-in, attendance verification, quorum tracking' },
  { key: 'OPPORTUNITIES', label: 'Opportunities & Mentorship Hub', desc: 'Job reviews, internships, scholarship listings, mentor verification' },
  { key: 'ELECTIONS', label: 'Elections & Digital Voting', desc: 'Electoral commission controls, nomination vetting, voting periods, certifications' },
  { key: 'EVENTS', label: 'Events & Reunions', desc: 'Annual reunions, calendar, ticketing/RSVPs, agendas and schedules' },
  { key: 'COMMUNICATIONS', label: 'Communications & Heritage', desc: 'Announcements, official circulars, news broadcasts, campus heritage gallery' },
  { key: 'CHAPTERS', label: 'Chapters Hub', desc: 'Regional and university chapter coordination, leaders, and chapter members' },
  { key: 'DOCUMENTS', label: 'Official Documents Archive', desc: 'Constitution, financial statements, resolutions, and governance archives' },
  { key: 'USERS', label: 'Staff Roles & Accounts', desc: 'Executive administrator accounts, role assignments, and permission boundaries' },
  { key: 'REPORTS', label: 'Reports & Analytics', desc: 'Executive summaries, cohort breakdowns, statistical exports and data insights' },
];

interface AdminControlPanelProps {
  currentUser: AuthUser;
  onReturnToMemberPortal: () => void;
  onRefreshData?: () => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  currentUser,
  onReturnToMemberPortal,
  onRefreshData,
}) => {
  // Consolidated navigation structure:
  const [activeSection, setActiveSection] = useState<'overview' | 'registry' | 'leadership' | 'secretariat' | 'welcome_page' | 'exports' | 'approvals' | 'security'>('overview');
  const [registrySubTab, setRegistrySubTab] = useState<'members' | 'ma_numbers' | 'legacy' | 'applications' | 'verification' | 'assisted'>('members');
  const [approvalsSubTab, setApprovalsSubTab] = useState<'cards' | 'attendance' | 'opportunities' | 'elections' | 'modules' | 'staff' | 'documents' | 'audit' | 'cms'>('cards');
  const [registryDropdownOpen, setRegistryDropdownOpen] = useState(false);
  const [approvalsDropdownOpen, setApprovalsDropdownOpen] = useState(false);

  // Executive Overview State
  const [overviewStats, setOverviewStats] = useState({
    totalAccounts: 0,
    verifiedAlumni: 0,
    pendingApplications: 0,
    unregisteredAccounts: 0,
    withMANumbers: 0,
    registeredLeaders: 0,
    totalOffices: 0,
  });
  const [recentApplications, setRecentApplications] = useState<AlumniApplication[]>([]);

  // Super Admin Security state
  const [securityCurrentPass, setSecurityCurrentPass] = useState('');
  const [securityNewPass, setSecurityNewPass] = useState('');
  const [securityConfirmPass, setSecurityConfirmPass] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Executive and Super Admin credential update states
  const [execAdminPassInput, setExecAdminPassInput] = useState('');
  const [confirmExecAdminPassInput, setConfirmExecAdminPassInput] = useState('');
  const [execPassMsg, setExecPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [superAdminNewPassInput, setSuperAdminNewPassInput] = useState('');
  const [confirmSuperAdminNewPassInput, setConfirmSuperAdminNewPassInput] = useState('');
  const [superPassMsg, setSuperPassMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({
    home: true,
    about: true,
    membership: true,
    directory: true,
    news: true,
    events: true,
    gallery: true,
    documents: true,
    contact: true,
    giving: true,
    chapters: true,
    attendance: true,
    opportunities: true,
    elections: true,
  });

  // Settings Edit State
  const [prefixInput, setPrefixInput] = useState('MA. ');
  const [padDigitsInput, setPadDigitsInput] = useState(4);
  const [autoApproveInput, setAutoApproveInput] = useState(true);
  const [allowSelfAssignedInput, setAllowSelfAssignedInput] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Authentication Strategy State
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    allowEmailPassword: true,
    allowPhonePassword: true,
    allowPhoneOtp: false,
    allowMANumberPassword: false,
  });
  const [isSavingAuth, setIsSavingAuth] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // Opportunities Admin State
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [oppFilter, setOppFilter] = useState<string>('ALL');
  const [oppActionLoading, setOppActionLoading] = useState(false);
  const [oppStatusNotice, setOppStatusNotice] = useState('');

  // Elections Admin State
  const [electionCycles, setElectionCycles] = useState<ElectionCycle[]>([]);
  const [adminCandidates, setAdminCandidates] = useState<Candidate[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('elec-2026');
  const [electionNotice, setElectionNotice] = useState('');
  const [certifyingLoading, setCertifyingLoading] = useState(false);

  // Staff Management State (Linked to Alumni Registry & Modular Permissions)
  const [allAlumni, setAllAlumni] = useState<AlumniProfile[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<AuthUser[]>([]);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaffAccount, setEditingStaffAccount] = useState<AuthUser | null>(null);
  const [selectedAlumnusForStaff, setSelectedAlumnusForStaff] = useState<AlumniProfile | null>(null);
  const [alumniSearchQuery, setAlumniSearchQuery] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('SECRETARY');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [assignedModules, setAssignedModules] = useState<PermissionModule[]>([
    'REGISTRY', 'ATTENDANCE', 'DOCUMENTS', 'REPORTS', 'OPPORTUNITIES', 'ELECTIONS'
  ]);
  const [staffSuccessMessage, setStaffSuccessMessage] = useState('');

  // Documents Management State
  const [documents, setDocuments] = useState<MOSADocument[]>([]);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<MOSADocument['category']>('CIRCULAR');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocSize, setNewDocSize] = useState('1.2 MB');
  const [newDocRestricted, setNewDocRestricted] = useState(false);

  // Audit Logs State & Controls
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState('ALL');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);
  const [auditConfirmModal, setAuditConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'prune' | 'purge_test_data';
    targetId?: string;
    pruneDays?: number;
    title: string;
    description: string;
  } | null>(null);
  const [auditActionNotice, setAuditActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessingAudit, setIsProcessingAudit] = useState(false);

  // Active Session & Super Admin Elevation State
  const [activeUser, setActiveUser] = useState<AuthUser>(currentUser);
  const [isElevateModalOpen, setIsElevateModalOpen] = useState(false);
  const [superAdminPassInput, setSuperAdminPassInput] = useState('');
  const [showSuperAdminPass, setShowSuperAdminPass] = useState(false);
  const [superAdminError, setSuperAdminError] = useState('');
  const [superAdminSuccess, setSuperAdminSuccess] = useState('');
  const [isElevating, setIsElevating] = useState(false);

  useEffect(() => {
    setActiveUser(currentUser);
  }, [currentUser]);

  const handleElevateToSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError('');
    setSuperAdminSuccess('');
    if (!superAdminPassInput.trim()) {
      setSuperAdminError('Please enter the Super Admin password.');
      return;
    }
    setIsElevating(true);
    try {
      const res = await dataService.elevateToSuperAdmin(superAdminPassInput);
      if (res.success && res.user) {
        setActiveUser(res.user);
        setSuperAdminSuccess('Super Admin elevation granted! Master administrative powers active.');
        setTimeout(() => {
          setIsElevateModalOpen(false);
          setSuperAdminPassInput('');
          setSuperAdminSuccess('');
        }, 1200);
      } else {
        setSuperAdminError(res.error || 'Invalid Super Admin password.');
      }
    } catch (err: any) {
      setSuperAdminError(err.message || 'Error verifying Super Admin password.');
    } finally {
      setIsElevating(false);
    }
  };

  const handleDowngradeToAdmin = async () => {
    const res = await dataService.downgradeToStandardAdmin();
    if (res.user) {
      setActiveUser(res.user);
    }
  };

  // Permissions helpers evaluated against activeUser
  const isSuperAdmin = activeUser.role === 'SUPER_ADMIN';
  const canAccessRegistry = governanceService.can(activeUser, 'REGISTRY', 'VIEW');
  const canAccessAttendance = governanceService.can(activeUser, 'ATTENDANCE', 'VIEW');
  const canAccessOpportunities = governanceService.can(activeUser, 'OPPORTUNITIES', 'VIEW');
  const canAccessElections = governanceService.can(activeUser, 'ELECTIONS', 'VIEW');
  const canAccessSettings = governanceService.can(activeUser, 'SETTINGS', 'VIEW') || isSuperAdmin;
  const canAccessStaff = governanceService.can(activeUser, 'USERS', 'VIEW') || isSuperAdmin;
  const canAccessDocs = governanceService.can(activeUser, 'DOCUMENTS', 'VIEW');
  const canAccessAudit = governanceService.can(activeUser, 'AUDIT', 'VIEW');
  const canAccessCMS = governanceService.can(activeUser, 'SETTINGS', 'EDIT') || isSuperAdmin || activeUser.role === 'ADMIN' || activeUser.role === 'PUBLICITY';
  const canAccessLeadership = isSuperAdmin || activeUser.role === 'ADMIN' || governanceService.can(activeUser, 'USERS', 'VIEW');
  const canAccessSecretariat = isSuperAdmin || activeUser.role === 'ADMIN' || activeUser.role === 'SECRETARY' || governanceService.can(activeUser, 'COMMUNICATIONS', 'EDIT');
  const canAccessWelcomePage = isSuperAdmin || activeUser.role === 'ADMIN' || governanceService.can(activeUser, 'SETTINGS', 'EDIT');
  const canAccessExports = isSuperAdmin || activeUser.role === 'ADMIN' || governanceService.can(activeUser, 'REPORTS', 'EXPORT');
  const canAccessSecurity = true; // Always visible in nav; content restricted to Super Admin

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      governanceService.ensureSeedStaff();

      const settings = await dataService.getSystemSettings();
      setSystemSettings(settings);
      setPrefixInput(settings.prefix || 'MA. ');
      setPadDigitsInput(settings.padDigits || 4);
      setAutoApproveInput(settings.autoApproveRegistrations !== false);
      setAllowSelfAssignedInput(settings.allowSelfAssignedAlumniNumber === true);

      const modules = await dataService.getModuleSettings();
      setModuleSettings(modules);

      const auth = governanceService.getAuthSettings();
      setAuthSettings(auth);

      const staff = governanceService.getStaffAccounts();
      setStaffAccounts(staff);

      const alumni = await dataService.getAlumniList();
      setAllAlumni(alumni);

      const docs = await dataService.getDocuments();
      setDocuments(docs);

      const logs = await dataService.getAuditLogs();
      setAuditLogs(logs);

      const opps = await dataService.getOpportunities();
      setOpportunities(opps);

      const m = await dataService.getMentorProfiles();
      setMentors(m);

      const elecs = await dataService.getElectionCycles();
      setElectionCycles(elecs);
      if (elecs.length > 0) {
        const cands = await dataService.getCandidates(elecs[0].id);
        setAdminCandidates(cands);
      }

      // Compute Live Executive Overview Statistics
      const [exportMembers, applicationsList, officesList] = await Promise.all([
        dataService.getMembersForExport(),
        dataService.getApplications(),
        dataService.getLeadershipOffices(),
      ]);

      const usersRaw = JSON.parse(localStorage.getItem('mosa_users') || '[]');
      const totalAcc = Math.max(usersRaw.length, exportMembers.length);
      const verifiedCount = exportMembers.filter(mb => (mb as any).verificationStatus === 'VERIFIED' || mb.status === 'VERIFIED_ALUMNUS').length;
      const pendingCount = applicationsList.filter(a => a.status === 'PENDING').length;
      const maCount = exportMembers.filter(mb => !!mb.alumniNumber && mb.alumniNumber !== 'NOT ASSIGNED').length;
      const unregCount = exportMembers.filter(mb => (mb as any).alumniRegistrationStatus === 'NOT_STARTED' || mb.status === 'UNREGISTERED_ACCOUNT').length;
      const activeOffices = officesList.length;
      const leadersCount = officesList.filter(o => !!o.assignedAlumniId || !!o.assignedAlumniNumber).length;

      setOverviewStats({
        totalAccounts: totalAcc,
        verifiedAlumni: verifiedCount,
        pendingApplications: pendingCount,
        unregisteredAccounts: unregCount,
        withMANumbers: maCount,
        registeredLeaders: leadersCount,
        totalOffices: activeOffices,
      });
      setRecentApplications(applicationsList.slice(0, 6));
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  // Activity / Audit History Controls
  const executeDeleteSingleAudit = async (id: string) => {
    setIsProcessingAudit(true);
    try {
      await dataService.deleteAuditLog(id, currentUser.email);
      setSelectedAuditIds(prev => prev.filter(x => x !== id));
      await loadAllAdminData();
      setAuditActionNotice({ text: 'Activity record successfully deleted.', type: 'success' });
    } catch (err: any) {
      setAuditActionNotice({ text: err.message || 'Failed to delete activity log.', type: 'error' });
    } finally {
      setIsProcessingAudit(false);
      setAuditConfirmModal(null);
    }
  };

  const executeDeleteSelectedAudits = async () => {
    if (selectedAuditIds.length === 0) return;
    setIsProcessingAudit(true);
    try {
      const res = await dataService.deleteAuditLogs(selectedAuditIds, currentUser.email);
      setSelectedAuditIds([]);
      await loadAllAdminData();
      setAuditActionNotice({ text: `${res.deletedCount} activity records deleted.`, type: 'success' });
    } catch (err: any) {
      setAuditActionNotice({ text: err.message || 'Failed to delete records.', type: 'error' });
    } finally {
      setIsProcessingAudit(false);
      setAuditConfirmModal(null);
    }
  };

  const executePruneAudits = async (days?: number) => {
    setIsProcessingAudit(true);
    try {
      const res = await dataService.pruneAuditLogs(currentUser.email, days, auditActionFilter);
      setSelectedAuditIds([]);
      await loadAllAdminData();
      setAuditActionNotice({ text: `Activity history successfully pruned (${res.deletedCount} entries removed).`, type: 'success' });
    } catch (err: any) {
      setAuditActionNotice({ text: err.message || 'Failed to prune logs.', type: 'error' });
    } finally {
      setIsProcessingAudit(false);
      setAuditConfirmModal(null);
    }
  };

  const executePurgeTestData = async () => {
    setIsProcessingAudit(true);
    try {
      const res = await dataService.purgeDemoData(currentUser.email);
      setSelectedAuditIds([]);
      await loadAllAdminData();
      setAuditActionNotice({ text: res.message, type: 'success' });
    } catch (err: any) {
      setAuditActionNotice({ text: err.message || 'Failed to purge test data.', type: 'error' });
    } finally {
      setIsProcessingAudit(false);
      setAuditConfirmModal(null);
    }
  };

  const handleExportAudits = (format: 'csv' | 'json', logsToExport: AuditLog[]) => {
    try {
      const content = dataService.exportAuditLogs(format, logsToExport);
      const mime = format === 'json' ? 'application/json' : 'text/csv';
      const ext = format === 'json' ? 'json' : 'csv';
      const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mosa_activity_history_${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAuditActionNotice({ text: `Activity history exported as ${format.toUpperCase()}.`, type: 'success' });
    } catch (err: any) {
      setAuditActionNotice({ text: 'Export failed: ' + err.message, type: 'error' });
    }
  };

  const handleUpdateOppStatus = async (oppId: string, newStatus: any, notes?: string) => {
    setOppActionLoading(true);
    try {
      await dataService.setOpportunityStatus(oppId, newStatus, notes);
      setOppStatusNotice(`Opportunity updated to ${newStatus}`);
      const updated = await dataService.getOpportunities();
      setOpportunities(updated);
      setTimeout(() => setOppStatusNotice(''), 3500);
    } catch (e: any) {
      setOppStatusNotice(`Failed: ${e.message}`);
    } finally {
      setOppActionLoading(false);
    }
  };

  const handleDeleteOpp = async (oppId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await dataService.deleteOpportunity(oppId);
      const updated = await dataService.getOpportunities();
      setOpportunities(updated);
      setOppStatusNotice('Opportunity listing removed.');
      setTimeout(() => setOppStatusNotice(''), 3500);
    } catch (e: any) {
      setOppStatusNotice(`Failed: ${e.message}`);
    }
  };

  const handleUpdateCycleStatus = async (cycleId: string, status: any) => {
    try {
      await dataService.updateElectionCycle({ id: cycleId, status });
      const updated = await dataService.getElectionCycles();
      setElectionCycles(updated);
      setElectionNotice(`Election cycle status updated to ${status}`);
      setTimeout(() => setElectionNotice(''), 3500);
    } catch (e: any) {
      setElectionNotice(`Failed: ${e.message}`);
    }
  };

  const handleCertifyElection = async (cycleId: string) => {
    if (!confirm('Are you sure you want to officially certify and seal this election cycle?')) return;
    setCertifyingLoading(true);
    try {
      await dataService.certifyElection(cycleId, currentUser.email, `Officially certified by ${currentUser.displayName || currentUser.email} (${currentUser.role}) on ${new Date().toLocaleDateString()}`);
      const updated = await dataService.getElectionCycles();
      setElectionCycles(updated);
      setElectionNotice('Election has been officially certified and declaration recorded.');
      setTimeout(() => setElectionNotice(''), 4500);
    } catch (e: any) {
      setElectionNotice(`Failed: ${e.message}`);
    } finally {
      setCertifyingLoading(false);
    }
  };

  const handleToggleModule = (key: keyof ModuleSettings) => {
    setModuleSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSystemSettings = async () => {
    setIsSavingSettings(true);
    setSaveSuccessMessage('');
    try {
      await dataService.updateModuleSettings(moduleSettings, currentUser.email);
      await dataService.updateSystemSettings({
        prefix: prefixInput,
        padDigits: Number(padDigitsInput),
        autoApproveRegistrations: autoApproveInput,
        allowSelfAssignedAlumniNumber: allowSelfAssignedInput,
      });

      setSaveSuccessMessage('Settings and feature toggles updated successfully.');
      if (onRefreshData) onRefreshData();
      await loadAllAdminData();
      setTimeout(() => setSaveSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAuthSettings = async () => {
    setIsSavingAuth(true);
    setAuthSuccessMessage('');
    try {
      await governanceService.updateAuthSettings(authSettings, currentUser);
      setAuthSuccessMessage('Authentication strategy updated successfully.');
      setTimeout(() => setAuthSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Failed to update auth settings:', err);
    } finally {
      setIsSavingAuth(false);
    }
  };

  const handleOpenAddStaff = () => {
    setEditingStaffAccount(null);
    setSelectedAlumnusForStaff(null);
    setAlumniSearchQuery('');
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffRole('SECRETARY');
    setAssignedModules(DEFAULT_MODULES_BY_ROLE['SECRETARY'] || ['REGISTRY', 'ATTENDANCE', 'DOCUMENTS', 'REPORTS']);
    setIsAddStaffOpen(true);
  };

  const handleOpenEditStaff = (account: AuthUser) => {
    setEditingStaffAccount(account);
    const matched = allAlumni.find(a => 
      (account.alumniId && a.internalId === account.alumniId) ||
      (account.alumniNumber && a.alumniNumber === account.alumniNumber) ||
      (account.email && a.email?.toLowerCase() === account.email.toLowerCase())
    ) || null;
    setSelectedAlumnusForStaff(matched);
    setAlumniSearchQuery('');
    setNewStaffName(account.displayName);
    setNewStaffEmail(account.email);
    setNewStaffPhone(account.phone || '');
    setNewStaffRole(account.role);
    setAssignedModules(account.assignedPermissions || DEFAULT_MODULES_BY_ROLE[account.role] || ['REGISTRY']);
    setIsAddStaffOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setNewStaffRole(role);
    const defaults = DEFAULT_MODULES_BY_ROLE[role] || ['REGISTRY'];
    setAssignedModules(defaults);
  };

  const handleToggleStaffModule = (module: PermissionModule) => {
    setAssignedModules(prev => 
      prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
    );
  };

  const handleSelectAlumnusForStaff = (alumnus: AlumniProfile) => {
    setSelectedAlumnusForStaff(alumnus);
    setNewStaffName(alumnus.fullName || `${alumnus.firstName || ''} ${alumnus.lastName || ''}`.trim());
    setNewStaffEmail(alumnus.email || `${alumnus.alumniNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@massh.ac.ug`);
    setNewStaffPhone(alumnus.phone || '');
  };

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail.trim() || !newStaffName.trim()) {
      alert('Please select an alumnus from the registry or enter a name and official email.');
      return;
    }
    try {
      await governanceService.saveStaffAccount({
        uid: editingStaffAccount ? editingStaffAccount.uid : undefined,
        email: newStaffEmail.trim(),
        displayName: newStaffName.trim(),
        role: newStaffRole,
        phone: newStaffPhone.trim() || undefined,
        alumniId: selectedAlumnusForStaff?.internalId || editingStaffAccount?.alumniId,
        alumniNumber: selectedAlumnusForStaff?.alumniNumber || editingStaffAccount?.alumniNumber,
        photoUrl: selectedAlumnusForStaff?.photoUrl || editingStaffAccount?.photoUrl,
        assignedPermissions: assignedModules,
        active: editingStaffAccount ? editingStaffAccount.active : true,
      }, currentUser);

      setIsAddStaffOpen(false);
      setEditingStaffAccount(null);
      setSelectedAlumnusForStaff(null);
      setAlumniSearchQuery('');
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffPhone('');
      setStaffAccounts(governanceService.getStaffAccounts());
      setStaffSuccessMessage(editingStaffAccount ? 'Staff role and responsibilities updated successfully.' : 'Staff account linked to alumni registry successfully without duplicate records.');
      setTimeout(() => setStaffSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save staff account');
    }
  };

  const handleToggleStaffStatus = async (account: AuthUser) => {
    try {
      await governanceService.saveStaffAccount({
        ...account,
        active: !account.active,
      }, currentUser);
      setStaffAccounts(governanceService.getStaffAccounts());
    } catch (err: any) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    try {
      const doc = await dataService.addDocument({
        title: newDocTitle.trim(),
        category: newDocCategory,
        description: newDocDescription.trim() || undefined,
        fileSize: newDocSize.trim() || '1.0 MB',
        fileType: 'PDF Document',
        isRestrictedToMembers: newDocRestricted,
      }, currentUser.email);

      setDocuments(prev => [doc, ...prev]);
      setIsAddDocModalOpen(false);
      setNewDocTitle('');
      setNewDocDescription('');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this official document?')) return;
    try {
      await dataService.deleteDocument(id, currentUser.email);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const roleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' };
      case 'SECRETARY':
        return { bg: '#DBEAFE', fg: '#1E40AF', border: '#BFDBFE' };
      case 'TREASURER':
        return { bg: '#DCFCE7', fg: '#166534', border: '#BBF7D0' };
      case 'MEMBERSHIP_ADMIN':
        return { bg: '#FEE2E2', fg: '#B91C1C', border: '#FECACA' };
      case 'DIRECTORY_ADMIN':
        return { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' };
      case 'EVENTS_ATTENDANCE_ADMIN':
        return { bg: '#FCE7F3', fg: '#BE185D', border: '#FBCFE8' };
      case 'PUBLICITY':
        return { bg: '#F3E8FF', fg: '#6B21A8', border: '#E9D5FF' };
      case 'CHAPTER_ADMIN':
        return { bg: '#E0E7FF', fg: '#3730A3', border: '#C7D2FE' };
      case 'CUSTOM_STAFF':
        return { bg: '#FEF9C3', fg: '#854D0E', border: '#FEF08A' };
      default:
        return { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' };
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'ADMIN': return 'Administrator';
      case 'SECRETARY': return 'Secretary / Registry Administrator';
      case 'TREASURER': return 'Treasurer / Finance';
      case 'MEMBERSHIP_ADMIN': return 'Membership & Verification';
      case 'DIRECTORY_ADMIN': return 'Alumni Directory Manager';
      case 'EVENTS_ATTENDANCE_ADMIN': return 'Events & Attendance Manager';
      case 'PUBLICITY': return 'Communications / Publicity';
      case 'CHAPTER_ADMIN': return 'Chapter Administrator';
      case 'CUSTOM_STAFF': return 'Custom Administrative Role';
      default: return role;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F0', paddingBottom: '4rem' }}>
      {/* Top Administrative Header Bar */}
      <header 
        style={{
          background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 60%, #18533B 100%)',
          color: '#FFFFFF',
          borderBottom: '3px solid #C68A24',
          padding: '1.25rem 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: '0 4px 20px rgba(10, 39, 27, 0.25)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onReturnToMemberPortal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              title="Switch back to public member environment"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Return to Member Portal</span>
              <span className="sm:hidden">Exit Admin</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#FBBF24" />
                <h1 style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
                  MOSA Administrative Control Panel
                </h1>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                Mandela Secondary School Hoima • Executive Governance Suite
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Super Admin Status or Unlock Button */}
            {isSuperAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1.5px solid #F59E0B',
                  color: '#FDE68A',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <Crown size={15} color="#FBBF24" />
                  <span>SUPER ADMIN (Master Powers Active)</span>
                </div>
                <button
                  type="button"
                  onClick={handleDowngradeToAdmin}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '0.4rem 0.7rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
                  }}
                  title="Relinquish Super Admin master powers and return to Executive Administrator mode"
                >
                  <Lock size={13} />
                  <span>Lock</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-unlock-super-admin"
                onClick={() => {
                  setSuperAdminPassInput('');
                  setSuperAdminError('');
                  setSuperAdminSuccess('');
                  setIsElevateModalOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#0A271B',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.95rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
                  transition: 'transform 0.15s ease',
                }}
                title="Authenticate with Super Admin password to unlock overall system control"
              >
                <Crown size={15} color="#0A271B" />
                <span>Sign In as Super Admin</span>
              </button>
            )}

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{activeUser.displayName}</div>
              <div style={{ fontSize: '0.72rem', color: isSuperAdmin ? '#FBBF24' : '#CBD5E1', fontWeight: 600 }}>
                {isSuperAdmin ? 'Super Administrator' : 'Executive Administrator'}
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isSuperAdmin ? '#D97706' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#FFFFFF' }}>
              {activeUser.displayName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        
        {/* Consolidated Expandable Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          
          <div className="admin-tabs-nav horizontal-scroll-touch" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* 0. OVERVIEW BUTTON */}
            <button
              onClick={() => {
                setActiveSection('overview');
                setRegistryDropdownOpen(false);
                setApprovalsDropdownOpen(false);
              }}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                border: activeSection === 'overview' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                background: activeSection === 'overview' ? '#0B203E' : '#FFFFFF',
                color: activeSection === 'overview' ? '#FFFFFF' : '#334155',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: activeSection === 'overview' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutDashboard size={17} color={activeSection === 'overview' ? '#FBBF24' : '#D97706'} />
              <span>Overview</span>
            </button>

            {/* 1. EXPANDABLE "Members Registry" BUTTON */}
            {canAccessRegistry && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setRegistryDropdownOpen(!registryDropdownOpen);
                    setApprovalsDropdownOpen(false);
                  }}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '10px',
                    border: activeSection === 'registry' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                    background: activeSection === 'registry' ? '#0B203E' : '#FFFFFF',
                    color: activeSection === 'registry' ? '#FFFFFF' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: activeSection === 'registry' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  aria-expanded={registryDropdownOpen}
                >
                  <Users size={17} color={activeSection === 'registry' ? '#FBBF24' : '#D97706'} />
                  <span>Members Registry</span>
                  <ChevronDown size={15} style={{ transform: registryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.8 }} />
                </button>

                {/* Dropdown Menu */}
                {registryDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setRegistryDropdownOpen(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120 }}
                    />
                    <div
                      className="admin-dropdown-menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 12px 30px rgba(11, 32, 62, 0.18)',
                        minWidth: '260px',
                        padding: '0.5rem',
                        zIndex: 130,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {[
                        { key: 'members', label: 'Members Registry', icon: Users, desc: 'Search & browse active registry' },
                        { key: 'ma_numbers', label: 'MA Number Management', icon: Award, desc: 'Sequential prefixes & auto rules' },
                        { key: 'legacy', label: 'Legacy Physical Register', icon: BookOpen, desc: 'Physical book records & auto-verify' },
                        { key: 'applications', label: 'Applications Queue', icon: Clock, desc: 'Review & approve new signups' },
                        { key: 'verification', label: 'Verification Desk', icon: ShieldCheck, desc: 'Credential search & validation' },
                        { key: 'assisted', label: 'Assisted Registration', icon: UserPlus, desc: 'In-person desk for device-free alumni' },
                      ].map(item => {
                        const Icon = item.icon;
                        const isSelected = activeSection === 'registry' && registrySubTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              setActiveSection('registry');
                              setRegistrySubTab(item.key as any);
                              setRegistryDropdownOpen(false);
                            }}
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: isSelected ? '#EFF6FF' : 'transparent',
                              color: isSelected ? '#1E40AF' : '#1E293B',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              transition: 'background 0.15s',
                            }}
                          >
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isSelected ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={15} color={isSelected ? '#1D4ED8' : '#64748B'} />
                            </div>
                            <div>
                              <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.85rem' }}>{item.label}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. EXPANDABLE "Members & Approvals" BUTTON */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setApprovalsDropdownOpen(!approvalsDropdownOpen);
                  setRegistryDropdownOpen(false);
                }}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  border: activeSection === 'approvals' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                  background: activeSection === 'approvals' ? '#0B203E' : '#FFFFFF',
                  color: activeSection === 'approvals' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeSection === 'approvals' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                aria-expanded={approvalsDropdownOpen}
              >
                <Sliders size={17} color={activeSection === 'approvals' ? '#FBBF24' : '#D97706'} />
                <span>Members & Approvals</span>
                <ChevronDown size={15} style={{ transform: approvalsDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.8 }} />
              </button>

              {/* Dropdown Menu */}
              {approvalsDropdownOpen && (
                <>
                  <div 
                    onClick={() => setApprovalsDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120 }}
                  />
                  <div
                    className="admin-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 12px 30px rgba(11, 32, 62, 0.18)',
                      minWidth: '280px',
                      padding: '0.5rem',
                      zIndex: 130,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    {[
                      { key: 'cards', label: 'Membership ID Cards', icon: CreditCard, visible: canAccessRegistry, desc: 'Official template, bulk generation & printing' },
                      { key: 'attendance', label: 'Meeting Attendance', icon: Calendar, visible: canAccessAttendance, desc: 'Assembly roll call & verification' },
                      { key: 'opportunities', label: 'Opportunities & Mentorship', icon: Briefcase, visible: canAccessOpportunities, desc: `${opportunities.filter(o => o.status === 'PENDING_REVIEW').length} Pending review` },
                      { key: 'elections', label: 'Elections & Secret Ballot', icon: Vote, visible: canAccessElections, desc: 'Cycles, candidate vetting & certification' },
                      { key: 'modules', label: 'System & Feature Controls', icon: Sliders, visible: canAccessSettings, desc: 'Module switches & auth strategy' },
                      { key: 'staff', label: 'Staff Roles & Accounts', icon: ShieldCheck, visible: canAccessStaff, desc: `${staffAccounts.length} Executive accounts` },
                      { key: 'documents', label: 'Documents Manager', icon: FileText, visible: canAccessDocs, desc: `${documents.length} Official publications` },
                      { key: 'audit', label: 'System Audit Trail', icon: History, visible: canAccessAudit, desc: 'Immutable log of system operations' },
                      { key: 'cms', label: 'Website Content CMS', icon: Globe, visible: canAccessCMS, desc: 'Live homepage & gallery management' },
                    ].filter(i => i.visible).map(item => {
                      const Icon = item.icon;
                      const isSelected = activeSection === 'approvals' && approvalsSubTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setActiveSection('approvals');
                            setApprovalsSubTab(item.key as any);
                            setApprovalsDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: isSelected ? '#EFF6FF' : 'transparent',
                            color: isSelected ? '#1E40AF' : '#1E293B',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isSelected ? '#DBEAFE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color={isSelected ? '#1D4ED8' : '#64748B'} />
                          </div>
                          <div>
                            <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.85rem' }}>{item.label}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 3. LEADERSHIP & OFFICES */}
            {canAccessLeadership && (
              <button
                onClick={() => {
                  setActiveSection('leadership');
                  setRegistryDropdownOpen(false);
                  setApprovalsDropdownOpen(false);
                }}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  border: activeSection === 'leadership' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                  background: activeSection === 'leadership' ? '#0B203E' : '#FFFFFF',
                  color: activeSection === 'leadership' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeSection === 'leadership' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Award size={17} color={activeSection === 'leadership' ? '#FBBF24' : '#D97706'} />
                <span>Leadership & Offices</span>
              </button>
            )}

            {/* SECRETARIAT & WHATSAPP COMMUNICATIONS */}
            {canAccessSecretariat && (
              <button
                onClick={() => {
                  setActiveSection('secretariat');
                  setRegistryDropdownOpen(false);
                  setApprovalsDropdownOpen(false);
                }}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  border: activeSection === 'secretariat' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                  background: activeSection === 'secretariat' ? '#0B203E' : '#FFFFFF',
                  color: activeSection === 'secretariat' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeSection === 'secretariat' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Phone size={17} color={activeSection === 'secretariat' ? '#FBBF24' : '#D97706'} />
                <span>Secretariat & WhatsApp</span>
              </button>
            )}

            {/* 4. WELCOME PAGE MANAGEMENT */}
            {canAccessWelcomePage && (
              <button
                onClick={() => {
                  setActiveSection('welcome_page');
                  setRegistryDropdownOpen(false);
                  setApprovalsDropdownOpen(false);
                }}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  border: activeSection === 'welcome_page' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                  background: activeSection === 'welcome_page' ? '#0B203E' : '#FFFFFF',
                  color: activeSection === 'welcome_page' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeSection === 'welcome_page' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={17} color={activeSection === 'welcome_page' ? '#FBBF24' : '#D97706'} />
                <span>Welcome Page</span>
              </button>
            )}

            {/* 5. MEMBER DATA EXPORTS */}
            {canAccessExports && (
              <button
                onClick={() => {
                  setActiveSection('exports');
                  setRegistryDropdownOpen(false);
                  setApprovalsDropdownOpen(false);
                }}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '10px',
                  border: activeSection === 'exports' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                  background: activeSection === 'exports' ? '#0B203E' : '#FFFFFF',
                  color: activeSection === 'exports' ? '#FFFFFF' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: activeSection === 'exports' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Download size={17} color={activeSection === 'exports' ? '#FBBF24' : '#D97706'} />
                <span>Data Exports</span>
              </button>
            )}

            {/* 6. SUPER ADMIN SECURITY */}
            <button
              onClick={() => {
                setActiveSection('security');
                setRegistryDropdownOpen(false);
                setApprovalsDropdownOpen(false);
              }}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                border: activeSection === 'security' ? '2px solid #0B203E' : '1px solid #CBD5E1',
                background: activeSection === 'security' ? '#0B203E' : (isSuperAdmin ? '#FEF3C7' : '#FFFFFF'),
                color: activeSection === 'security' ? '#FFFFFF' : (isSuperAdmin ? '#92400E' : '#334155'),
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: activeSection === 'security' ? '0 4px 12px rgba(11, 32, 62, 0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Crown size={17} color={activeSection === 'security' ? '#FBBF24' : '#D97706'} />
              <span>Security & Passwords</span>
              {!isSuperAdmin && <Lock size={12} color="#94A3B8" />}
            </button>

          </div>

          {/* Active Breadcrumb Indicator */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', color: '#475569' }}>
            <span style={{ fontWeight: 600, color: '#0B203E' }}>
              {activeSection === 'overview' ? 'Executive Overview' :
               activeSection === 'registry' ? 'Members Registry' :
               activeSection === 'leadership' ? 'Leadership & Offices' :
               activeSection === 'welcome_page' ? 'Welcome Page' :
               activeSection === 'exports' ? 'Data Exports' :
               activeSection === 'security' ? 'Super Admin Security' :
               'Members & Approvals'}
            </span>
            <span>&rsaquo;</span>
            <span style={{ fontWeight: 700, color: '#D97706' }}>
              {activeSection === 'overview' ? 'KPI Summary & Live Metrics' :
               activeSection === 'leadership' ? 'Offices & Delegated Permissions' :
               activeSection === 'welcome_page' ? 'Hero Content & Public Theme' :
               activeSection === 'exports' ? 'Excel, CSV & PDF Reports' :
               activeSection === 'security' ? 'Password & Authorization Controls' :
               activeSection === 'registry' 
                ? (registrySubTab === 'members' ? 'Members Registry Table' : registrySubTab === 'ma_numbers' ? 'MA Number Management' : registrySubTab === 'applications' ? 'Applications Queue' : registrySubTab === 'verification' ? 'Verification Desk' : 'Assisted Registration')
                : (approvalsSubTab === 'cards' ? 'Membership ID Cards' : approvalsSubTab === 'attendance' ? 'Meeting Attendance' : approvalsSubTab === 'opportunities' ? 'Opportunities & Mentorship' : approvalsSubTab === 'elections' ? 'Elections & Secret Ballot' : approvalsSubTab === 'modules' ? 'System & Feature Controls' : approvalsSubTab === 'staff' ? 'Staff Roles' : approvalsSubTab === 'documents' ? 'Documents Manager' : approvalsSubTab === 'audit' ? 'System Audit Trail' : 'Website CMS')
              }
            </span>
          </div>

        </div>

        {/* SECTION 0: EXECUTIVE OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Header Greeting Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)',
              borderRadius: '16px',
              padding: '1.75rem 2rem',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(10, 39, 27, 0.25)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={22} color="#FBBF24" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FCD34D' }}>
                    Executive Governance & Administration
                  </span>
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
                  Welcome, {currentUser.displayName}
                </h2>
                <p style={{ color: '#E2E8F0', fontSize: '0.9rem', margin: 0, maxWidth: '640px' }}>
                  Centralized command console for Mandela Old Students Association (MOSA). Monitor live alumni metrics, verify applicants, delegate office portfolios, and publish welcome page content.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setActiveSection('registry'); setRegistrySubTab('applications'); }}
                  style={{
                    background: '#FBBF24',
                    color: '#0A271B',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Clock size={16} />
                  <span>Review Applications ({overviewStats.pendingApplications})</span>
                </button>
                <button
                  onClick={() => setActiveSection('exports')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Download size={16} />
                  <span>Export Data</span>
                </button>
              </div>
            </div>

            {/* Live KPI Metric Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}>
              {/* 1. Total User Accounts */}
              <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3B82F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Registered Accounts</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#3B82F6" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0B203E' }}>
                  {overviewStats.totalAccounts}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Authenticated portal user accounts
                </div>
              </div>

              {/* 2. Total Verified Alumni */}
              <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Verified Alumni</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#10B981" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#065F46' }}>
                  {overviewStats.verifiedAlumni}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.25rem' }}>
                  Officially verified MASSH Mandelians
                </div>
              </div>

              {/* 3. Pending Alumni Applications */}
              <div 
                className="mosa-card" 
                onClick={() => { setActiveSection('registry'); setRegistrySubTab('applications'); }}
                style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B', cursor: 'pointer' }}
                title="Click to view queue"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending Applications</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#F59E0B" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B45309' }}>
                  {overviewStats.pendingApplications}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#D97706', marginTop: '0.25rem' }}>
                  Awaiting secretariat verification &rsaquo;
                </div>
              </div>

              {/* 4. Accounts Without Completed Registration */}
              <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Unregistered Passes</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={18} color="#8B5CF6" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#6D28D9' }}>
                  {overviewStats.unregisteredAccounts}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Accounts that skipped or deferred onboarding
                </div>
              </div>

              {/* 5. Members with MA Numbers */}
              <div className="mosa-card" style={{ padding: '1.25rem', borderLeft: '4px solid #D97706' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned MA Numbers</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} color="#D97706" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0B203E' }}>
                  {overviewStats.withMANumbers}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Official credentials generated
                </div>
              </div>

              {/* 6. Leadership & Office Appointments */}
              <div 
                className="mosa-card" 
                onClick={() => setActiveSection('leadership')}
                style={{ padding: '1.25rem', borderLeft: '4px solid #EC4899', cursor: 'pointer' }}
                title="Manage leadership offices"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Leadership Offices</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} color="#EC4899" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#9D174D' }}>
                  {overviewStats.registeredLeaders} <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: 500 }}>/ {overviewStats.totalOffices}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#BE185D', marginTop: '0.25rem' }}>
                  Active office portfolios &rsaquo;
                </div>
              </div>

              {/* 7. Audit & Accountability Trail */}
              <div 
                className="mosa-card" 
                onClick={() => { setActiveSection('approvals'); setApprovalsSubTab('audit'); }}
                style={{ padding: '1.25rem', borderLeft: '4px solid #64748B', cursor: 'pointer' }}
                title="View audit logs"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Audit Logs</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <History size={18} color="#64748B" />
                  </div>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1E293B' }}>
                  {auditLogs.length}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Immutable system event entries &rsaquo;
                </div>
              </div>

              {/* 8. Super Admin Security */}
              <div 
                className="mosa-card" 
                onClick={() => setActiveSection('security')}
                style={{ padding: '1.25rem', borderLeft: '4px solid #059669', cursor: 'pointer' }}
                title="Manage security controls"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Security State</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={18} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46', marginTop: '0.35rem' }}>
                  Enforced
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.25rem' }}>
                  Rate limiting & password hashing active &rsaquo;
                </div>
              </div>
            </div>

            {/* Split Panel: Recent Applications Queue & Audit Stream */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              {/* Panel 1: Recent Applications */}
              <div className="mosa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="#D97706" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                      Recent Alumni Applications
                    </h3>
                  </div>
                  <button
                    onClick={() => { setActiveSection('registry'); setRegistrySubTab('applications'); }}
                    style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All ({overviewStats.pendingApplications}) &rsaquo;
                  </button>
                </div>

                {recentApplications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                    <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Queue is clear. No pending applications.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentApplications.map(app => (
                      <div
                        key={app.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          background: '#F8FAFC',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: '#0B203E', fontSize: '0.9rem' }}>
                            {app.firstName} {app.lastName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                            Cohort: {app.cohortYear || app.exitYear || app.schoolHistory?.aLevel?.yearCompleted || app.schoolHistory?.oLevel?.yearCompleted || 'Not Specified'} • {app.email}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: app.status === 'APPROVED' ? '#ECFDF5' : app.status === 'PENDING' ? '#FFFBEB' : '#FEF2F2',
                            color: app.status === 'APPROVED' ? '#065F46' : app.status === 'PENDING' ? '#92400E' : '#991B1B',
                          }}>
                            {app.status}
                          </span>
                          <button
                            onClick={() => { setActiveSection('registry'); setRegistrySubTab('applications'); }}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel 2: Recent Audit Activity */}
              <div className="mosa-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="#D97706" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E', margin: 0 }}>
                      Administrative Audit Trail
                    </h3>
                  </div>
                  <button
                    onClick={() => { setActiveSection('approvals'); setApprovalsSubTab('audit'); }}
                    style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Full Log ({auditLogs.length}) &rsaquo;
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                    <p style={{ margin: 0 }}>No audit logs recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {auditLogs.slice(0, 5).map(log => (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.75rem 0.95rem',
                          background: '#F8FAFC',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: '#0B203E' }}>{log.action}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.78rem' }}>
                          By: <strong style={{ color: '#334155' }}>{log.performedBy}</strong> • {log.details || log.affectedRecord || 'Audit Action'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: LEADERSHIP & OFFICES */}
        {activeSection === 'leadership' && canAccessLeadership && (
          <LeadershipOfficesManager
            currentUser={activeUser}
            onRefreshData={loadAllAdminData}
          />
        )}

        {/* SECTION: WELCOME PAGE MANAGEMENT */}
        {activeSection === 'welcome_page' && canAccessWelcomePage && (
          <WelcomePageManager
            currentUser={activeUser}
            onRefreshPortal={onRefreshData}
          />
        )}

        {/* SECTION: MEMBER DATA EXPORTS */}
        {activeSection === 'exports' && canAccessExports && (
          <MemberDataExportManager
            currentUser={activeUser}
          />
        )}

        {/* SECTION: SECRETARIAT & WHATSAPP COMMUNICATIONS */}
        {activeSection === 'secretariat' && canAccessSecretariat && (
          <SecretariatManager
            currentUser={activeUser}
          />
        )}

        {/* SECTION: SUPER ADMIN SECURITY & CREDENTIALS */}
        {activeSection === 'security' && !isSuperAdmin && (
          <div className="mosa-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '620px', margin: '2rem auto' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FEF3C7',
              border: '2px solid #FCD34D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <Crown size={32} color="#D97706" />
            </div>
            <h2 style={{ fontSize: '1.45rem', color: '#0B203E', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
              Super Admin Authentication Required
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.55, margin: '0 0 1.75rem 0' }}>
              Credential security, administrative master keys, and system governance overrides are restricted exclusively to the Super Admin. Please sign in with the Super Admin password to configure executive credentials and powers.
            </p>
            <button
              onClick={() => {
                setSuperAdminPassInput('');
                setSuperAdminError('');
                setSuperAdminSuccess('');
                setIsElevateModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#0A271B',
                border: 'none',
                borderRadius: '10px',
                padding: '0.85rem 1.85rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              }}
            >
              <Crown size={18} />
              <span>Unlock Super Admin Powers</span>
            </button>
          </div>
        )}

        {activeSection === 'security' && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Header Card */}
            <div className="mosa-card" style={{ padding: '1.75rem', borderLeft: '4px solid #D97706' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <Crown size={24} color="#D97706" />
                <h2 style={{ fontSize: '1.4rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                  Super Admin Credential & Master Governance Suite
                </h2>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 0.5rem 0' }}>
                As Super Admin, you hold overall system powers. Configure the single Executive Admin Password used by executive members to access the panel, as well as your Super Admin master password.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {/* CARD 1: Executive Admin Password */}
              <div className="mosa-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                    1. Executive Admin Password
                  </h3>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
                  The single password required for executive members to access the administration dashboard. Nothing else is asked at the gate.
                </p>

                {execPassMsg && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: execPassMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: execPassMsg.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${execPassMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  }}>
                    {execPassMsg.text}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setExecPassMsg(null);
                    if (!execAdminPassInput || execAdminPassInput.length < 4) {
                      setExecPassMsg({ text: 'Admin password must be at least 4 characters long.', type: 'error' });
                      return;
                    }
                    if (execAdminPassInput !== confirmExecAdminPassInput) {
                      setExecPassMsg({ text: 'Passwords do not match.', type: 'error' });
                      return;
                    }
                    dataService.setAdminPasswords({ adminPass: execAdminPassInput });
                    setExecPassMsg({ text: 'Executive Admin password successfully updated!', type: 'success' });
                    setExecAdminPassInput('');
                    setConfirmExecAdminPassInput('');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      New Executive Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      value={execAdminPassInput}
                      onChange={e => setExecAdminPassInput(e.target.value)}
                      placeholder="e.g. admin123"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmExecAdminPassInput}
                      onChange={e => setConfirmExecAdminPassInput(e.target.value)}
                      placeholder="Re-enter password"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    <Save size={16} />
                    <span>Save Executive Admin Password</span>
                  </button>
                </form>
              </div>

              {/* CARD 2: Super Admin Master Password */}
              <div className="mosa-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Crown size={20} color="#D97706" />
                  <h3 style={{ fontSize: '1.15rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>
                    2. Super Admin Master Password
                  </h3>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
                  The master authorization password used inside the admin panel to elevate to overall powers and assign executive staff privileges.
                </p>

                {superPassMsg && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: superPassMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: superPassMsg.type === 'success' ? '#065F46' : '#991B1B',
                    border: `1px solid ${superPassMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                  }}>
                    {superPassMsg.text}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSuperPassMsg(null);
                    if (!superAdminNewPassInput || superAdminNewPassInput.length < 6) {
                      setSuperPassMsg({ text: 'Super Admin password must be at least 6 characters long.', type: 'error' });
                      return;
                    }
                    if (superAdminNewPassInput !== confirmSuperAdminNewPassInput) {
                      setSuperPassMsg({ text: 'Passwords do not match.', type: 'error' });
                      return;
                    }
                    dataService.setAdminPasswords({ superAdminPass: superAdminNewPassInput });
                    setSuperPassMsg({ text: 'Super Admin master password successfully updated!', type: 'success' });
                    setSuperAdminNewPassInput('');
                    setConfirmSuperAdminNewPassInput('');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      New Super Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      value={superAdminNewPassInput}
                      onChange={e => setSuperAdminNewPassInput(e.target.value)}
                      placeholder="e.g. superadmin123"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Confirm Super Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmSuperAdminNewPassInput}
                      onChange={e => setConfirmSuperAdminNewPassInput(e.target.value)}
                      placeholder="Re-enter password"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#0A271B',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    <Crown size={16} />
                    <span>Save Super Admin Password</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Security Protections Summary */}
            <div className="mosa-card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0B203E', margin: '0 0 1rem 0', fontWeight: 800 }}>
                Active Security & Audit Protections
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.25rem' }}>Login Rate Limiting</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>5 consecutive failed admin logins temporarily lock the account for 5 minutes.</div>
                </div>
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.25rem' }}>Credential Hashing</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Salted SHA-256 cryptographic hashes protect stored administrative passwords.</div>
                </div>
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0B203E', marginBottom: '0.25rem' }}>Role-Based Access Enforcement</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Granular permissions verified on each action; ordinary users cannot elevate privileges.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: MEMBERS REGISTRY & SUB-FUNCTIONS */}
        {activeSection === 'registry' && canAccessRegistry && (
          <div>
            <AdminApplicationReview
              currentUser={activeUser}
              adminEmail={activeUser.email}
              activeTab={registrySubTab}
              onTabChange={(tab) => setRegistrySubTab(tab)}
              onAlumniCreated={() => {
                loadAllAdminData();
                if (onRefreshData) onRefreshData();
              }}
            />
          </div>
        )}
        {activeSection === 'registry' && !canAccessRegistry && (
          <div className="mosa-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <ShieldAlert size={44} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: '0 0 0.5rem 0' }}>Registry Access Restricted</h3>
            <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto' }}>
              Your current administrative role (<strong>{activeUser.role}</strong>) does not have authorization to view or manage the alumni membership registry.
            </p>
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (MEMBERSHIP ID CARDS) */}
        {activeSection === 'approvals' && approvalsSubTab === 'cards' && canAccessRegistry && (
          <div>
            <MembershipCardAdmin currentUser={activeUser} />
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (ATTENDANCE) */}
        {activeSection === 'approvals' && approvalsSubTab === 'attendance' && canAccessAttendance && (
          <div>
            <AttendanceManager currentUser={activeUser} />
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (OPPORTUNITIES & MENTORSHIP) */}
        {activeSection === 'approvals' && approvalsSubTab === 'opportunities' && canAccessOpportunities && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header & Status Alert */}
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Briefcase size={20} color="#D97706" />
                    <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Opportunities & Mentorship Moderation Desk</h2>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Vet, approve, or reject career listings, graduate training, scholarships, and verified mentor profiles.
                  </p>
                </div>
                {oppStatusNotice && (
                  <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #A7F3D0' }}>
                    {oppStatusNotice}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Listings</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>{opportunities.length}</div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Pending Review</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>
                    {opportunities.filter(o => o.status === 'PENDING_REVIEW').length}
                  </div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>Published & Active</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                    {opportunities.filter(o => o.status === 'PUBLISHED').length}
                  </div>
                </div>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Registered Mentors</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '0.2rem' }}>{mentors.length}</div>
                </div>
              </div>
            </div>

            {/* Opportunities Table */}
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0B203E', margin: 0, fontWeight: 700 }}>Career & Educational Postings</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'DRAFT', 'CLOSED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setOppFilter(st)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: oppFilter === st ? 700 : 500,
                        background: oppFilter === st ? '#0B203E' : '#F1F5F9',
                        color: oppFilter === st ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Title & Organization</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities
                      .filter(o => oppFilter === 'ALL' || o.status === oppFilter)
                      .map(opp => (
                        <tr key={opp.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#0B203E' }}>{opp.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{opp.organisation} &bull; Posted by {opp.postedBy?.name || 'Alumnus'}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {opp.type}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                            {opp.location} ({opp.workplaceType})
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: opp.status === 'PUBLISHED' ? '#DCFCE7' : opp.status === 'PENDING_REVIEW' ? '#FEF3C7' : '#F1F5F9',
                              color: opp.status === 'PUBLISHED' ? '#166534' : opp.status === 'PENDING_REVIEW' ? '#92400E' : '#475569',
                            }}>
                              {opp.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              {opp.status !== 'PUBLISHED' && (
                                <button
                                  disabled={oppActionLoading}
                                  onClick={() => handleUpdateOppStatus(opp.id, 'PUBLISHED')}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    background: '#059669',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                  title="Approve and publish to all alumni"
                                >
                                  Publish
                                </button>
                              )}
                              {opp.status === 'PUBLISHED' && (
                                <button
                                  disabled={oppActionLoading}
                                  onClick={() => handleUpdateOppStatus(opp.id, 'CLOSED')}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #CBD5E1',
                                    cursor: 'pointer',
                                  }}
                                  title="Mark as closed / archived"
                                >
                                  Close
                                </button>
                              )}
                              <button
                                disabled={oppActionLoading}
                                onClick={() => handleDeleteOpp(opp.id)}
                                style={{
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background: '#FEE2E2',
                                  color: '#DC2626',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                                title="Delete listing"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mentors Moderation */}
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0B203E', margin: '0 0 1rem 0', fontWeight: 700 }}>Verified Alumni Mentors ({mentors.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {mentors.map(m => (
                  <div key={m.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div style={{ fontWeight: 700, color: '#0B203E' }}>{m.fullName}</div>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: m.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7', color: m.status === 'ACTIVE' ? '#166534' : '#92400E', fontWeight: 700 }}>
                        {m.status === 'ACTIVE' ? 'ACTIVE MENTOR' : 'PAUSED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{m.alumniNumber} &bull; {m.currentRole} at {m.organisation}</div>
                    <div style={{ fontSize: '0.78rem', color: '#0B203E', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      "{m.bio.substring(0, 85)}..."
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748B' }}>
                      <strong>Capacity:</strong> {m.currentMenteesCount || 0} / {m.maxMentees} mentees
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (ELECTIONS & SECRET BALLOT) */}
        {activeSection === 'approvals' && approvalsSubTab === 'elections' && canAccessElections && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header & Electoral Commission Controls */}
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <Vote size={20} color="#D97706" />
                    <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>MOSA Electoral Commission Operations Desk</h2>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Oversee biennial NEC general elections, open or close secret ballot voting, track quorum thresholds, and certify declarations.
                  </p>
                </div>
                {electionNotice && (
                  <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #A7F3D0' }}>
                    {electionNotice}
                  </div>
                )}
              </div>

              {/* Active Cycle Status Overview */}
              {electionCycles.map(ec => {
                const quorumCount = Math.round((ec.eligibleVotersCount || 250) * ((ec.quorumRequiredPercentage || 25) / 100));
                const isQuorumMet = (ec.totalBallotsCast || 0) >= quorumCount;
                return (
                  <div key={ec.id} style={{ marginTop: '1.25rem', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0B203E' }}>{ec.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Cycle ID: <code>{ec.id}</code> &bull; Electoral Term: {ec.term}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Current Stage:</span>
                        <span style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          background: ec.status === 'VOTING_ACTIVE' ? '#DCFCE7' : ec.status === 'CONCLUDED' ? '#E0E7FF' : '#FEF3C7',
                          color: ec.status === 'VOTING_ACTIVE' ? '#166534' : ec.status === 'CONCLUDED' ? '#3730A3' : '#92400E',
                        }}>
                          {ec.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Quorum & Ballots Count */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Ballots Tallied</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B203E', marginTop: '0.2rem' }}>{ec.totalBallotsCast || 0}</div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Quorum Required</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>
                          {quorumCount} ({ec.quorumRequiredPercentage}%)
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Quorum Status</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isQuorumMet ? '#059669' : '#D97706', marginTop: '0.4rem' }}>
                          {isQuorumMet ? 'Quorum Met' : 'Quorum Pending'}
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Electoral Positions</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E40AF', marginTop: '0.2rem' }}>{ec.positions.length}</div>
                      </div>
                    </div>

                    {/* Stage Switcher Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B203E' }}>
                        Advance Electoral Commission Stage:
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {(['NOMINATIONS_OPEN', 'VOTING_ACTIVE', 'TALLYING', 'CONCLUDED'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateCycleStatus(ec.id, st)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.75rem',
                              fontWeight: ec.status === st ? 800 : 600,
                              borderRadius: '6px',
                              border: ec.status === st ? '1.5px solid #0B203E' : '1px solid #CBD5E1',
                              background: ec.status === st ? '#0B203E' : '#F8FAFC',
                              color: ec.status === st ? '#FFFFFF' : '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                        {ec.status !== 'CONCLUDED' && (
                          <button
                            disabled={certifyingLoading}
                            onClick={() => handleCertifyElection(ec.id)}
                            style={{
                              padding: '0.4rem 0.9rem',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              background: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <ShieldCheck size={14} />
                            <span>Certify Results & Declaration</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {ec.certifiedAt && (
                      <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', fontSize: '0.8rem', color: '#3730A3' }}>
                        <strong>Official Electoral Seal:</strong> Certified by {ec.certifiedBy} on {new Date(ec.certifiedAt).toLocaleString()}. {ec.declarationSummary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Candidates & Tallies Roster */}
            <div className="mosa-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0B203E', margin: '0 0 1rem 0', fontWeight: 700 }}>
                Vetted Candidates & Secret Vote Tallies ({adminCandidates.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Candidate</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Position</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Seconder</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tallied Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminCandidates.map(c => {
                      const posTitle = electionCycles.find(e => e.id === c.electionId)?.positions.find(p => p.id === c.positionId)?.title || c.positionId;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#0B203E' }}>{c.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.alumniNumber} &bull; Cohort {c.cohort}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: 600 }}>
                            {posTitle}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748B' }}>
                            {c.seconderName} ({c.seconderAlumniNumber})
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
                              {c.status === 'APPROVED' ? 'VETTED' : c.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0B203E' }}>
                              {c.votesCount || 0}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.25rem' }}>votes</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (SYSTEM & FEATURE CONTROLS) */}
        {activeSection === 'approvals' && approvalsSubTab === 'modules' && canAccessSettings && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
            
            {/* Feature Toggles Column */}
            <div className="mosa-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Layers size={22} color="#D97706" />
                <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Member Portal Feature Toggles</h2>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Turn member features on or off. Disabled modules are immediately hidden from member navigation and made inaccessible to ordinary users.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { key: 'home', title: 'Home Overview Page', desc: 'Welcoming hero banner, statistics, and quick action cards' },
                  { key: 'about', title: 'About MASSH & MOSA', desc: 'School heritage, mission, executive leadership, and timeline' },
                  { key: 'membership', title: 'Membership & Verification Guide', desc: 'Number explanation, membership categories, and public verification desk' },
                  { key: 'directory', title: 'Alumni Directory', desc: 'Searchable roster of registered alumni with privacy filters' },
                  { key: 'news', title: 'News / Announcements', desc: 'Official broadcasts and administrative circulars' },
                  { key: 'events', title: 'Events Calendar & RSVPs', desc: 'Annual homecomings, dinners, sports galas, and attendance tracking' },
                  { key: 'attendance', title: 'Smart Meeting Attendance', desc: 'Meetings, live check-ins, guest tracking, and quorum management' },
                  { key: 'gallery', title: 'Campus Heritage Gallery', desc: 'Historical and current MASSH campus photographs' },
                  { key: 'documents', title: 'Official Documents Archive', desc: 'Downloadable Constitution, AGM reports, and audited financials' },
                  { key: 'contact', title: 'Contact Secretariat', desc: 'Headquarters contact details, dispatch form, and FAQ' },
                  { key: 'giving', title: 'Giving & Dues Portal', desc: 'Alumni contributions, Mobile Money instructions, and dues tracking' },
                  { key: 'chapters', title: 'University & Regional Chapters', desc: 'Campus chapters across Makerere, Mbarara, Kyambogo, and diaspora' },
                  { key: 'opportunities', title: 'Opportunities & Mentorship Hub', desc: 'Career listings, graduate training, scholarships, and 1-on-1 alumni mentorship matching' },
                  { key: 'elections', title: 'Elections & Digital Voting', desc: 'Secret ballot voting, candidate manifestos, and certified election declarations' },
                ].map(item => {
                  const isEnabled = moduleSettings[item.key as keyof ModuleSettings];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => handleToggleModule(item.key as keyof ModuleSettings)}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: isEnabled ? '#F0FDF4' : '#F8FAFC',
                        border: isEnabled ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: isEnabled ? '#166534' : '#64748B', fontSize: '0.95rem' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: isEnabled ? '#15803D' : '#94A3B8' }}>
                          {item.desc}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isEnabled ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16A34A', fontWeight: 700, fontSize: '0.85rem' }}>
                            <ToggleRight size={28} />
                            <span>ON</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94A3B8', fontWeight: 700, fontSize: '0.85rem' }}>
                            <ToggleLeft size={28} />
                            <span>OFF</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Membership Numbering & Auth Strategy Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Membership Numbering Configuration */}
              <div className="mosa-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <Hash size={22} color="#2563EB" />
                  <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Membership Number System</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Configure the predefined prefix and formatting for automatically generated alumni numbers.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Predefined Number Prefix *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. MA. or MOSA- or MASSH-"
                      value={prefixInput}
                      onChange={e => setPrefixInput(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                      Examples: "MA. " creates <strong>MA. 0001</strong>; "MOSA-" creates <strong>MOSA-000001</strong>.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Number Padding Digits *
                    </label>
                    <select
                      className="input-field"
                      value={padDigitsInput}
                      onChange={e => setPadDigitsInput(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.75rem' }}
                    >
                      <option value={1}>1 Digit (e.g. MA. 1, MA. 2, MA. 3)</option>
                      <option value={2}>2 Digits (e.g. MA. 01, MA. 02, MA. 03)</option>
                      <option value={3}>3 Digits (e.g. MA. 001, MA. 002, MA. 003)</option>
                      <option value={4}>4 Digits (e.g. MA. 0001, MA. 0002, MA. 0003)</option>
                      <option value={5}>5 Digits (e.g. MA. 00001)</option>
                      <option value={6}>6 Digits (e.g. MA. 000001)</option>
                    </select>
                  </div>

                  {/* Auto-approval toggle */}
                  <div 
                    onClick={() => setAutoApproveInput(!autoApproveInput)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: autoApproveInput ? '#EFF6FF' : '#F8FAFC',
                      border: autoApproveInput ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: autoApproveInput ? '#1D4ED8' : '#334155', fontSize: '0.92rem' }}>
                        Automatic Membership Approval
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        Immediately approve member applications upon submission without manual intervention.
                      </div>
                    </div>
                    {autoApproveInput ? (
                      <ToggleRight size={28} color="#2563EB" />
                    ) : (
                      <ToggleLeft size={28} color="#94A3B8" />
                    )}
                  </div>

                  {/* Allow Members Self-Assigning / Claiming Alumni Numbers */}
                  <div
                    onClick={() => setAllowSelfAssignedInput(!allowSelfAssignedInput)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: allowSelfAssignedInput ? '#FFFBEB' : '#F8FAFC',
                      border: allowSelfAssignedInput ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: allowSelfAssignedInput ? '#B45309' : '#334155', fontSize: '0.92rem' }}>
                        Allow Members to Self-Assign / Claim Alumni Numbers
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {allowSelfAssignedInput
                          ? 'Active: Members can input an existing physical register number during registration.'
                          : 'Paused: Members cannot self-assign numbers. The system strictly generates sequential numbers automatically.'}
                      </div>
                    </div>
                    {allowSelfAssignedInput ? (
                      <ToggleRight size={28} color="#D97706" />
                    ) : (
                      <ToggleLeft size={28} color="#94A3B8" />
                    )}
                  </div>

                  {/* Live Sample Preview */}
                  <div style={{ background: '#0B203E', color: '#FFFFFF', padding: '1.25rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Live Number Format Preview
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {prefixInput}{'1'.padStart(padDigitsInput, '0')}
                    </div>
                  </div>
                </div>

                {saveSuccessMessage && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#D1FAE5', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>{saveSuccessMessage}</span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleSaveSystemSettings}
                  disabled={isSavingSettings}
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  <Save size={16} />
                  <span>{isSavingSettings ? 'Saving Settings...' : 'Save Module & Number Settings'}</span>
                </button>
              </div>

              {/* Authentication & Sign-in Strategy */}
              <div className="mosa-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <KeyRound size={22} color="#059669" />
                  <h2 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Authentication Strategy</h2>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  Enable or disable permitted login mechanisms across both web and mobile environments.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    {
                      key: 'allowEmailPassword',
                      title: 'Email Address & Password',
                      desc: 'Standard login for alumni and administrators with email access.',
                      value: authSettings.allowEmailPassword,
                    },
                    {
                      key: 'allowPhonePassword',
                      title: 'Phone Number & Password',
                      desc: 'Allows alumni to sign in using their registered Ugandan mobile number and password.',
                      value: authSettings.allowPhonePassword,
                    },
                    {
                      key: 'allowPhoneOtp',
                      title: 'Phone Number SMS / OTP',
                      desc: 'One-time SMS verification code login for smartphone users.',
                      value: authSettings.allowPhoneOtp,
                    },
                    {
                      key: 'allowMANumberPassword',
                      title: 'Membership Number (MA) & Password',
                      desc: 'Direct sign-in using assigned MOSA membership number (e.g. MA. 0001).',
                      value: authSettings.allowMANumberPassword,
                    },
                  ].map(strat => (
                    <div
                      key={strat.key}
                      onClick={() => setAuthSettings(prev => ({ ...prev, [strat.key]: !prev[strat.key as keyof AuthSettings] }))}
                      style={{
                        padding: '0.9rem',
                        borderRadius: '8px',
                        background: strat.value ? '#F0FDF4' : '#F8FAFC',
                        border: strat.value ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: strat.value ? '#166534' : '#334155', fontSize: '0.9rem' }}>
                          {strat.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {strat.desc}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {strat.value ? (
                          <ToggleRight size={26} color="#16A34A" />
                        ) : (
                          <ToggleLeft size={26} color="#94A3B8" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {authSuccessMessage && (
                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#D1FAE5', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>{authSuccessMessage}</span>
                  </div>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={handleSaveAuthSettings}
                  disabled={isSavingAuth}
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  <KeyRound size={16} />
                  <span>{isSavingAuth ? 'Updating Strategy...' : 'Update Authentication Strategy'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (STAFF ROLES & ACCOUNTS) */}
        {activeSection === 'approvals' && approvalsSubTab === 'staff' && canAccessStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header & Account Creation Card */}
            <div className="mosa-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.35rem', color: '#0B203E', margin: 0, fontWeight: 800 }}>Executive Leadership & Admin Powers</h2>
                    <span style={{ fontSize: '0.75rem', background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700 }}>
                      Assigned by Super Admin
                    </span>
                  </div>
                  <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                    Executive members sign in using the Admin Password. The Super Admin assigns distinct roles and modular administrative powers to each officer.
                  </p>
                </div>
                {(isSuperAdmin || governanceService.can(activeUser, 'USERS', 'MANAGE')) && (
                  <button
                    className="btn btn-primary"
                    onClick={handleOpenAddStaff}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem' }}
                  >
                    <UserPlus size={16} /> Add Staff from Alumni Registry
                  </button>
                )}
              </div>

              {!isSuperAdmin && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '10px',
                  padding: '0.85rem 1.15rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Crown size={22} color="#D97706" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                        Super Admin Powers Assignment
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.15rem' }}>
                        Executive administrators receive different admin powers configured by the Super Admin. You are in standard view.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSuperAdminPassInput('');
                      setSuperAdminError('');
                      setSuperAdminSuccess('');
                      setIsElevateModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#0A271B',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Crown size={15} />
                    <span>Unlock Super Admin to Assign Powers</span>
                  </button>
                </div>
              )}

              {staffSuccessMessage && (
                <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: '#D1FAE5', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>{staffSuccessMessage}</span>
                </div>
              )}

              {/* Staff Accounts Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Staff Member & MA Number</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Administrative Role</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Assigned Responsibilities</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Phone Number</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffAccounts.map(account => {
                      const colors = roleBadgeColor(account.role);
                      const matchedAlumnus = allAlumni.find(a => 
                        (account.alumniId && a.internalId === account.alumniId) ||
                        (account.alumniNumber && a.alumniNumber === account.alumniNumber) ||
                        (account.email && a.email?.toLowerCase() === account.email.toLowerCase())
                      );
                      const maNum = account.alumniNumber || matchedAlumnus?.alumniNumber;
                      const activeModules = account.role === 'SUPER_ADMIN' || account.role === 'ADMIN'
                        ? ['ALL']
                        : (account.assignedPermissions || DEFAULT_MODULES_BY_ROLE[account.role] || []);

                      return (
                        <tr key={account.uid} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              {matchedAlumnus?.photoUrl ? (
                                <img 
                                  src={matchedAlumnus.photoUrl} 
                                  alt={account.displayName} 
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0B203E', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                  {account.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, color: '#0B203E', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <span>{account.displayName}</span>
                                  {maNum ? (
                                    <span style={{ 
                                      background: '#0B203E', 
                                      color: '#FCD34D', 
                                      fontFamily: 'monospace', 
                                      fontSize: '0.72rem', 
                                      fontWeight: 800, 
                                      padding: '0.12rem 0.45rem', 
                                      borderRadius: '4px' 
                                    }}>
                                      {maNum}
                                    </span>
                                  ) : (
                                    <span style={{ 
                                      background: '#F1F5F9', 
                                      color: '#64748B', 
                                      fontSize: '0.68rem', 
                                      padding: '0.1rem 0.35rem', 
                                      borderRadius: '4px' 
                                    }}>
                                      Executive
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{account.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span 
                              style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                background: colors.bg, 
                                color: colors.fg, 
                                border: `1px solid ${colors.border}`,
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <ShieldCheck size={13} />
                              {getRoleLabel(account.role)}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '300px' }}>
                              {activeModules[0] === 'ALL' ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                  Full System Control
                                </span>
                              ) : activeModules.length === 0 ? (
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>No specific scope</span>
                              ) : (
                                activeModules.map(m => (
                                  <span key={m} style={{ fontSize: '0.7rem', fontWeight: 600, background: '#EFF6FF', color: '#1E40AF', padding: '0.12rem 0.4rem', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
                                    {m}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.85rem' }}>
                            {account.phone || 'Not recorded'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span 
                              style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 600, 
                                padding: '0.2rem 0.55rem', 
                                borderRadius: '4px',
                                background: account.active !== false ? '#DCFCE7' : '#FEE2E2',
                                color: account.active !== false ? '#15803D' : '#B91C1C',
                              }}
                            >
                              {account.active !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                              {(isSuperAdmin || governanceService.can(activeUser, 'USERS', 'MANAGE')) && (
                                <button
                                  onClick={() => handleOpenEditStaff(account)}
                                  style={{
                                    background: '#F1F5F9',
                                    border: '1px solid #CBD5E1',
                                    color: '#0B203E',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                  title="Edit Role & Permissions"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit Powers</span>
                                </button>
                              )}
                              {(isSuperAdmin || governanceService.can(activeUser, 'USERS', 'MANAGE')) && account.role !== 'SUPER_ADMIN' && (
                                <button
                                  onClick={() => handleToggleStaffStatus(account)}
                                  style={{
                                    background: 'none',
                                    border: '1px solid #CBD5E1',
                                    color: account.active !== false ? '#DC2626' : '#16A34A',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {account.active !== false ? 'Suspend' : 'Reactivate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Permissions Matrix Overview */}
            <div className="mosa-card" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0B203E', margin: 0 }}>Executive Role-Permissions Matrix</h3>
                <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                  Predefined administrative duties and functional scope for each executive branch.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>System Module</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#92400E' }}>Super Admin</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#1E40AF' }}>Secretary General</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#166534' }}>Honorary Treasurer</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#6B21A8' }}>Publicity Secretary</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#3730A3' }}>Chapter Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { module: 'Alumni Registry & Verification', super: 'Full Control', sec: 'View, Add, Edit, Verify, Reject, Export', treas: 'None', pub: 'None', chap: 'None' },
                      { module: 'Smart Meeting Attendance', super: 'Full Control', sec: 'Create, Check-in, Verify, Finalize, Export', treas: 'None', pub: 'None', chap: 'View, Add' },
                      { module: 'Contributions & Dues (Finance)', super: 'Full Control', sec: 'None', treas: 'View, Add, Verify, Export, Reconcile', pub: 'None', chap: 'None' },
                      { module: 'Announcements & News', super: 'Full Control', sec: 'None', treas: 'None', pub: 'Draft, Publish, Broadcast', chap: 'View, Add' },
                      { module: 'Events & Reunions', super: 'Full Control', sec: 'View', treas: 'None', pub: 'Publish, Manage RSVPs', chap: 'View' },
                      { module: 'Regional & University Chapters', super: 'Full Control', sec: 'View', treas: 'None', pub: 'None', chap: 'Assigned Chapter Only' },
                      { module: 'Official Documents Archive', super: 'Full Control', sec: 'Publish Circulars, Constitution', treas: 'Financial Statements', pub: 'View', chap: 'View' },
                      { module: 'Feature Toggles & Number Settings', super: 'Full Control', sec: 'None', treas: 'None', pub: 'None', chap: 'None' },
                      { module: 'Staff Accounts & Roles', super: 'Full Control', sec: 'None', treas: 'None', pub: 'None', chap: 'None' },
                      { module: 'Tamper-Evident Audit Trail', super: 'Full Control', sec: 'None', treas: 'None', pub: 'None', chap: 'None' },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0B203E' }}>{row.module}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#92400E', fontWeight: 600 }}>{row.super}</td>
                        <td style={{ padding: '0.75rem 1rem', color: row.sec === 'None' ? '#94A3B8' : '#1E40AF', fontWeight: row.sec === 'None' ? 400 : 600 }}>{row.sec}</td>
                        <td style={{ padding: '0.75rem 1rem', color: row.treas === 'None' ? '#94A3B8' : '#166534', fontWeight: row.treas === 'None' ? 400 : 600 }}>{row.treas}</td>
                        <td style={{ padding: '0.75rem 1rem', color: row.pub === 'None' ? '#94A3B8' : '#6B21A8', fontWeight: row.pub === 'None' ? 400 : 600 }}>{row.pub}</td>
                        <td style={{ padding: '0.75rem 1rem', color: row.chap === 'None' ? '#94A3B8' : '#3730A3', fontWeight: row.chap === 'None' ? 400 : 600 }}>{row.chap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (DOCUMENTS MANAGER) */}
        {activeSection === 'approvals' && approvalsSubTab === 'documents' && canAccessDocs && (
          <div className="mosa-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: '#0B203E', margin: 0 }}>Official Documents Repository</h2>
                <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
                  Manage the constitution, financial audits, circulars, and chapter guidelines available to alumni.
                </p>
              </div>

              {governanceService.can(currentUser, 'DOCUMENTS', 'ADD') && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddDocModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem' }}
                >
                  <Plus size={16} /> Add New Document
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Document Title</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Date Published</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Size</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569' }}>Access</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0B203E' }}>
                        {doc.title}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {doc.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>
                        {doc.publishedDate}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748B' }}>
                        {doc.fileSize}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {doc.isRestrictedToMembers ? (
                          <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Lock size={12} /> Members Only
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                            Public
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {governanceService.can(currentUser, 'DOCUMENTS', 'DELETE') && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            style={{
                              background: '#FEE2E2',
                              border: '1px solid #FCA5A5',
                              color: '#DC2626',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 2: MEMBERS & APPROVALS (AUDIT & ACTIVITY HISTORY) */}
        {activeSection === 'approvals' && approvalsSubTab === 'audit' && canAccessAudit && (() => {
          const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action))).sort();
          const uniqueActors = Array.from(new Set(auditLogs.map(l => l.performedBy))).sort();

          const filteredLogs = auditLogs.filter(log => {
            if (auditSearchQuery.trim()) {
              const q = auditSearchQuery.toLowerCase();
              const matchAction = (log.action || '').toLowerCase().includes(q);
              const matchActor = (log.performedBy || '').toLowerCase().includes(q);
              const matchTarget = (log.affectedRecord || '').toLowerCase().includes(q);
              const matchMeta = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(q) : false;
              if (!matchAction && !matchActor && !matchTarget && !matchMeta) return false;
            }
            if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
            if (auditActorFilter !== 'ALL' && log.performedBy !== auditActorFilter) return false;
            if (auditDateFrom) {
              const logDate = new Date(log.timestamp).toISOString().split('T')[0];
              if (logDate < auditDateFrom) return false;
            }
            if (auditDateTo) {
              const logDate = new Date(log.timestamp).toISOString().split('T')[0];
              if (logDate > auditDateTo) return false;
            }
            return true;
          });

          const isAllFilteredSelected = filteredLogs.length > 0 && filteredLogs.every(l => selectedAuditIds.includes(l.id));

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Notification Banner */}
              {auditActionNotice && (
                <div 
                  style={{
                    padding: '0.9rem 1.25rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: auditActionNotice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    border: auditActionNotice.type === 'success' ? '1px solid #10B981' : '1px solid #EF4444',
                    color: auditActionNotice.type === 'success' ? '#065F46' : '#991B1B',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {auditActionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{auditActionNotice.text}</span>
                  </div>
                  <button 
                    onClick={() => setAuditActionNotice(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Header Card */}
              <div className="mosa-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: '#0B203E', margin: '0 0 0.35rem 0', fontWeight: 800 }}>
                      Activity History &amp; System Audit Trail
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0, maxWidth: '650px' }}>
                      Comprehensive, searchable record of member actions, registrations, approvals, and administrative operations. Filter, bulk-manage, export, or prune historical records.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      onClick={loadAllAdminData}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                      onClick={() => handleExportAudits('csv', filteredLogs)}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                    >
                      <Download size={14} /> Export CSV
                    </button>
                    <button
                      onClick={() => handleExportAudits('json', filteredLogs)}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                    >
                      <Download size={14} /> Export JSON
                    </button>
                    {currentUser.role === 'SUPER_ADMIN' && (
                      <>
                        <button
                          onClick={() => setAuditConfirmModal({
                            isOpen: true,
                            type: 'prune',
                            pruneDays: 30,
                            title: 'Prune Activity History',
                            description: 'Select retention criteria to clear older audit records and maintain optimal system performance.'
                          })}
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.82rem', borderColor: '#CBD5E1' }}
                        >
                          <Clock size={14} /> Prune History
                        </button>
                        <button
                          onClick={() => setAuditConfirmModal({
                            isOpen: true,
                            type: 'purge_test_data',
                            title: 'Purge Demo Records & Reset Test Baseline',
                            description: 'This will purge residual dummy alumni, sample events, test donations, and placeholder records from local storage and reset all counters to 1. Real admin/staff accounts are preserved.'
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.85rem',
                            fontSize: '0.82rem',
                            background: '#FFF1F2',
                            color: '#E11D48',
                            border: '1px solid #FDA4AF',
                            borderRadius: '6px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <ShieldAlert size={14} /> Purge Test Data
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative' }}>
                      <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input
                        type="text"
                        placeholder="Search action, actor, record, metadata..."
                        value={auditSearchQuery}
                        onChange={e => setAuditSearchQuery(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', height: '38px', borderRadius: '6px' }}
                      />
                    </div>

                    {/* Action Filter */}
                    <div>
                      <select
                        value={auditActionFilter}
                        onChange={e => setAuditActionFilter(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', height: '38px', borderRadius: '6px' }}
                      >
                        <option value="ALL">All Activity Types ({auditLogs.length})</option>
                        {uniqueActions.map(act => (
                          <option key={act} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>

                    {/* Actor Filter */}
                    <div>
                      <select
                        value={auditActorFilter}
                        onChange={e => setAuditActorFilter(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', height: '38px', borderRadius: '6px' }}
                      >
                        <option value="ALL">All Users / Performers</option>
                        {uniqueActors.map(actor => (
                          <option key={actor} value={actor}>{actor}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range Inputs */}
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="date"
                        title="From Date"
                        value={auditDateFrom}
                        onChange={e => setAuditDateFrom(e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', width: '50%' }}
                      />
                      <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>to</span>
                      <input
                        type="date"
                        title="To Date"
                        value={auditDateTo}
                        onChange={e => setAuditDateTo(e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.78rem', width: '50%' }}
                      />
                    </div>
                  </div>

                  {/* Filter Status & Reset */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B', paddingTop: '0.25rem', borderTop: '1px solid #EEF2F6' }}>
                    <div>
                      Showing <strong>{filteredLogs.length}</strong> of <strong>{auditLogs.length}</strong> activity records
                      {(auditSearchQuery || auditActionFilter !== 'ALL' || auditActorFilter !== 'ALL' || auditDateFrom || auditDateTo) && (
                        <button
                          onClick={() => {
                            setAuditSearchQuery('');
                            setAuditActionFilter('ALL');
                            setAuditActorFilter('ALL');
                            setAuditDateFrom('');
                            setAuditDateTo('');
                          }}
                          style={{ marginLeft: '0.75rem', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {selectedAuditIds.length > 0 && (
                      <span style={{ color: '#0B203E', fontWeight: 700 }}>
                        {selectedAuditIds.length} records selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Action Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={() => {
                        if (isAllFilteredSelected) {
                          setSelectedAuditIds([]);
                        } else {
                          setSelectedAuditIds(filteredLogs.map(l => l.id));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Select All Filtered ({filteredLogs.length})</span>
                  </label>

                  {selectedAuditIds.length > 0 && (
                    <button
                      onClick={() => setAuditConfirmModal({
                        isOpen: true,
                        type: 'selected',
                        title: `Delete ${selectedAuditIds.length} Selected Records`,
                        description: `Are you sure you want to permanently delete these ${selectedAuditIds.length} selected activity records? This action cannot be undone.`
                      })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} /> Delete Selected ({selectedAuditIds.length})
                    </button>
                  )}
                </div>

                {/* Audit Logs List */}
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
                    <History size={40} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
                    <h3 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 0.35rem 0' }}>No Activity Records Found</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: 0 }}>
                      {auditLogs.length === 0 
                        ? 'No activity records have been logged yet. Actions will automatically appear here as administrators and users interact with the system.'
                        : 'No activity records match your current filter criteria. Try adjusting or clearing your filters.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
                    {filteredLogs.map(log => {
                      const isSelected = selectedAuditIds.includes(log.id);

                      return (
                        <div 
                          key={log.id}
                          style={{
                            padding: '0.85rem 1rem',
                            background: isSelected ? '#F0F9FF' : '#F8FAFC',
                            border: isSelected ? '1px solid #38BDF8' : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedAuditIds(prev => 
                                  prev.includes(log.id) ? prev.filter(x => x !== log.id) : [...prev, log.id]
                                );
                              }}
                              style={{ marginTop: '0.3rem', cursor: 'pointer' }}
                            />

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0B203E', background: '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                  {log.action}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>
                                  by {log.performedBy}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>•</span>
                                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                                Target: <strong>{log.affectedRecord}</strong>
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.3rem', fontFamily: 'monospace', background: '#FFFFFF', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #E2E8F0', wordBreak: 'break-all' }}>
                                  {JSON.stringify(log.metadata)}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => setAuditConfirmModal({
                              isOpen: true,
                              type: 'single',
                              targetId: log.id,
                              title: 'Delete Activity Record',
                              description: `Delete audit entry for "${log.action}" on record "${log.affectedRecord}"?`
                            })}
                            title="Delete this record"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirmation Modal */}
              {auditConfirmModal && auditConfirmModal.isOpen && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(11, 32, 62, 0.65)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '1rem'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '2rem',
                    maxWidth: '480px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={22} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0B203E', fontWeight: 800 }}>
                        {auditConfirmModal.title}
                      </h3>
                    </div>

                    <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
                      {auditConfirmModal.description}
                    </p>

                    {auditConfirmModal.type === 'prune' && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.4rem' }}>
                          Select Retention Threshold:
                        </label>
                        <select
                          value={auditConfirmModal.pruneDays ?? 30}
                          onChange={e => setAuditConfirmModal(prev => prev ? { ...prev, pruneDays: Number(e.target.value) } : null)}
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value={7}>Prune entries older than 7 days</option>
                          <option value={30}>Prune entries older than 30 days (Recommended)</option>
                          <option value={90}>Prune entries older than 90 days</option>
                          <option value={0}>Clear all entries (Complete wipe)</option>
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        onClick={() => setAuditConfirmModal(null)}
                        disabled={isProcessingAudit}
                        className="btn btn-secondary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (auditConfirmModal.type === 'single' && auditConfirmModal.targetId) {
                            await executeDeleteSingleAudit(auditConfirmModal.targetId);
                          } else if (auditConfirmModal.type === 'selected') {
                            await executeDeleteSelectedAudits();
                          } else if (auditConfirmModal.type === 'prune') {
                            await executePruneAudits(auditConfirmModal.pruneDays);
                          } else if (auditConfirmModal.type === 'purge_test_data') {
                            await executePurgeTestData();
                          }
                        }}
                        disabled={isProcessingAudit}
                        style={{
                          padding: '0.55rem 1.25rem',
                          fontSize: '0.85rem',
                          background: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isProcessingAudit ? 'Processing...' : 'Confirm Action'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION 2: MEMBERS & APPROVALS (LIVE CMS) */}
        {activeSection === 'approvals' && approvalsSubTab === 'cms' && canAccessCMS && (
          <div>
            <CMSManager currentUser={currentUser} onRefreshPortal={loadAllAdminData} />
          </div>
        )}
      </div>

      {/* Add / Edit Staff Account Modal (Linked to Alumni Registry & Modular Permissions) */}
      {isAddStaffOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div className="mosa-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} color="#D97706" />
                  <h3 style={{ fontSize: '1.3rem', color: '#0B203E', margin: 0, fontWeight: 700 }}>
                    {editingStaffAccount ? 'Edit Staff Role & Modular Scope' : 'Add Staff from Alumni Registry'}
                  </h3>
                </div>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0.3rem 0 0 0' }}>
                  {editingStaffAccount 
                    ? 'Update administrative title and granular modular permissions for this executive officer.' 
                    : 'Search existing registered alumni by name or MA number and attach executive responsibilities without duplicate records.'}
                </p>
              </div>
              <button 
                onClick={() => setIsAddStaffOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaffAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* STEP 1: ALUMNI REGISTRY ATTACHMENT */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.4rem' }}>
                  1. Registered Alumni Identity *
                </label>

                {selectedAlumnusForStaff ? (
                  <div style={{ 
                    padding: '0.9rem 1.1rem', 
                    background: '#F0FDF4', 
                    border: '1.5px solid #86EFAC', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '1rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {selectedAlumnusForStaff.photoUrl ? (
                        <img 
                          src={selectedAlumnusForStaff.photoUrl} 
                          alt="" 
                          style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10B981' }} 
                        />
                      ) : (
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#0B203E', color: '#FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {(selectedAlumnusForStaff.fullName || selectedAlumnusForStaff.firstName || 'MA').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>{selectedAlumnusForStaff.fullName || `${selectedAlumnusForStaff.firstName} ${selectedAlumnusForStaff.lastName}`}</span>
                          <span style={{ 
                            background: '#0B203E', 
                            color: '#FCD34D', 
                            fontFamily: 'monospace', 
                            fontSize: '0.78rem', 
                            fontWeight: 800, 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '4px' 
                          }}>
                            {selectedAlumnusForStaff.alumniNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.15rem' }}>
                          {selectedAlumnusForStaff.email || 'No email'} • {selectedAlumnusForStaff.phone || 'No phone'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 600, marginTop: '0.2rem' }}>
                          ✓ Existing Alumnus Record Linked (No Duplicate Created)
                        </div>
                      </div>
                    </div>
                    {!editingStaffAccount && (
                      <button
                        type="button"
                        onClick={() => { setSelectedAlumnusForStaff(null); setAlumniSearchQuery(''); }}
                        style={{ 
                          background: '#FFFFFF', 
                          border: '1px solid #86EFAC', 
                          color: '#065F46', 
                          borderRadius: '6px', 
                          padding: '0.35rem 0.75rem', 
                          cursor: 'pointer', 
                          fontSize: '0.78rem', 
                          fontWeight: 700 
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Search alumni by name, MA number (e.g. MA. 0001), or email..."
                        value={alumniSearchQuery}
                        onChange={e => setAlumniSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#FFFFFF' }}>
                      {allAlumni
                        .filter(a => {
                          if (!alumniSearchQuery.trim()) return true;
                          const q = alumniSearchQuery.toLowerCase();
                          return (
                            a.fullName?.toLowerCase().includes(q) ||
                            a.alumniNumber?.toLowerCase().includes(q) ||
                            a.email?.toLowerCase().includes(q) ||
                            a.phone?.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 6)
                        .map(alumnus => (
                          <div
                            key={alumnus.internalId}
                            onClick={() => handleSelectAlumnusForStaff(alumnus)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.55rem 0.85rem',
                              borderBottom: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ 
                                background: '#0B203E', 
                                color: '#FCD34D', 
                                fontFamily: 'monospace', 
                                fontSize: '0.74rem', 
                                fontWeight: 800, 
                                padding: '0.12rem 0.45rem', 
                                borderRadius: '4px' 
                              }}>
                                {alumnus.alumniNumber}
                              </span>
                              <span style={{ fontWeight: 700, color: '#0B203E', fontSize: '0.85rem' }}>{alumnus.fullName}</span>
                              <span style={{ color: '#64748B', fontSize: '0.78rem' }}>({alumnus.email || 'No email'})</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleSelectAlumnusForStaff(alumnus); }}
                              style={{ 
                                background: '#EFF6FF', 
                                border: '1px solid #BFDBFE', 
                                color: '#1D4ED8', 
                                borderRadius: '6px', 
                                padding: '0.25rem 0.6rem', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                cursor: 'pointer' 
                              }}
                            >
                              Select Member
                            </button>
                          </div>
                        ))}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', display: 'block' }}>
                      * Search and select the person from the existing alumni registry to anchor their staff role directly to their authentic MA number.
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 2: ACCOUNT PARTICULARS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Full Name & Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Full Name"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="official@massh.ac.ug"
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
              </div>

              {/* STEP 3: EXECUTIVE ROLE SELECTION */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', marginBottom: '0.35rem' }}>
                  2. Executive Administrative Role *
                </label>
                <select
                  className="input-field"
                  value={newStaffRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  style={{ width: '100%', padding: '0.7rem', fontWeight: 600 }}
                >
                  {ADMIN_ROLES.map(role => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: '0.35rem', padding: '0.55rem 0.85rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}>
                  <strong>Role Scope: </strong>
                  {ADMIN_ROLES.find(r => r.key === newStaffRole)?.description || 'Configurable administrative role.'}
                </div>
              </div>

              {/* STEP 4: ASSIGNED SPECIFIC RESPONSIBILITIES (MODULAR PERMISSION CHECKBOXES) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B203E', margin: 0 }}>
                    3. Assigned Operational Responsibilities (Modular Scope) *
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#D97706', fontWeight: 600 }}>
                    Super Admin Configured
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0 0 0.65rem 0' }}>
                  Check or uncheck specific functional modules this executive officer is authorized to manage:
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '0.55rem', 
                  maxHeight: '220px', 
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.65rem',
                  background: '#FAFAFA'
                }}>
                  {AVAILABLE_STAFF_MODULES.map(mod => {
                    const isChecked = assignedModules.includes(mod.key);
                    return (
                      <div 
                        key={mod.key} 
                        onClick={() => handleToggleStaffModule(mod.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '6px',
                          background: isChecked ? '#EFF6FF' : '#FFFFFF',
                          border: isChecked ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} // handled by parent onClick
                          style={{ marginTop: '0.2rem', accentColor: '#1D4ED8', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isChecked ? '#1E40AF' : '#0B203E' }}>
                            {mod.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.25, marginTop: '0.15rem' }}>
                            {mod.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 5: PHONE NUMBER */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Contact Phone Number (Uganda / International)
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+256 700 000000"
                  value={newStaffPhone}
                  onChange={e => setNewStaffPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddStaffOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.4rem', fontWeight: 700 }}
                >
                  <ShieldCheck size={16} />
                  <span>{editingStaffAccount ? 'Save Updated Role & Scope' : 'Attach Staff Role to Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isAddDocModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mosa-card" style={{ maxWidth: '550px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#0B203E', margin: 0 }}>Add Official Document</h3>
              <button 
                onClick={() => setIsAddDocModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. 2026 Annual General Meeting Resolutions"
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Category *
                  </label>
                  <select
                    className="input-field"
                    value={newDocCategory}
                    onChange={e => setNewDocCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="CONSTITUTION">Constitution</option>
                    <option value="AGM_REPORT">AGM Report</option>
                    <option value="CIRCULAR">Executive Circular</option>
                    <option value="FINANCIAL_REPORT">Financial Statement</option>
                    <option value="MEMBERSHIP_FORM">Chapter Charter / Guidelines</option>
                    <option value="OTHER">Other Publication</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                    Estimated Size
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 2.4 MB"
                    value={newDocSize}
                    onChange={e => setNewDocSize(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Description / Synopsis
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Summary of document contents..."
                  value={newDocDescription}
                  onChange={e => setNewDocDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', resize: 'vertical' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newDocRestricted}
                  onChange={e => setNewDocRestricted(e.target.checked)}
                />
                <span>Restrict download to verified members only</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddDocModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Publish Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* SUPER ADMIN ELEVATION MODAL                                 */}
      {/* ========================================================= */}
      {isElevateModalOpen && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(10, 39, 27, 0.75)', 
            backdropFilter: 'blur(5px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1200, 
            padding: '1.25rem' 
          }}
        >
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              background: '#FFFFFF', 
              borderRadius: '16px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.3)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #0A271B 0%, #113D2B 100%)', 
                borderBottom: '3px solid #D97706', 
                padding: '1.5rem', 
                color: '#FFFFFF',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <Crown size={22} color="#0A271B" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                      MOSA GOVERNANCE SUITE
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Super Admin Authentication
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsElevateModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#FFFFFF'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                Enter the Super Admin master password to elevate this session to overall system control, configure executive credentials, and assign administrative powers to executive officers.
              </p>

              {superAdminError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{superAdminError}</div>
                </div>
              )}

              {superAdminSuccess && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                  <div>{superAdminSuccess}</div>
                </div>
              )}

              <form onSubmit={handleElevateToSuperAdmin}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label 
                    htmlFor="super-admin-pass-input"
                    style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.45rem' }}
                  >
                    Super Admin Master Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      color="#94A3B8"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="super-admin-pass-input"
                      type={showSuperAdminPass ? 'text' : 'password'}
                      autoFocus
                      required
                      value={superAdminPassInput}
                      onChange={e => setSuperAdminPassInput(e.target.value)}
                      placeholder="Enter Super Admin password"
                      style={{
                        width: '100%',
                        padding: '0.8rem 2.6rem 0.8rem 2.5rem',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuperAdminPass(!showSuperAdminPass)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8'
                      }}
                    >
                      {showSuperAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.45rem' }}>
                    Default Master Password: <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>superadmin123</code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsElevateModalOpen(false)}
                    style={{
                      padding: '0.75rem 1.15rem',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isElevating}
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: '#0A271B',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: isElevating ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    <Crown size={16} />
                    <span>{isElevating ? 'Authenticating...' : 'Unlock Super Admin'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControlPanel;
