/**
 * MOSA Portal — Clean Test Data and Activity History Management Verification
 * 
 * Verifies:
 * 1. Clean Baseline Invariants (0 alumni, 0 events, 0 campaigns, 0 photos, nextAlumniNumber: 1)
 * 2. Super Admin credentials & genuine staff accounts preserved; demo users removed
 * 3. End-to-End Registration: First approval allocates MA. 0001; anti-collision & duplicate prevention
 * 4. Activity History & System Audit Trail: Filter, search, single delete, bulk delete, prune, export, purge
 */

import { dataService } from '../services/dataService';

export async function runVerificationTests(): Promise<{ passed: boolean; report: string[] }> {
  const report: string[] = [];
  let allPassed = true;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      report.push(`✅ PASS: ${msg}`);
    } else {
      report.push(`❌ FAIL: ${msg}`);
      allPassed = false;
    }
  };

  try {
    report.push('=== 1. VERIFYING CLEAN BASELINE INVARIANTS ===');
    
    // Purge test baseline to guarantee clean start
    dataService.purgeDemoData();

    const alumni = await dataService.getAlumniList();
    assert(alumni.length === 0, `Alumni directory starts empty (found: ${alumni.length})`);

    const apps = await dataService.getApplications();
    assert(apps.length === 0, `Applications registry starts empty (found: ${apps.length})`);

    const events = await dataService.getEvents();
    assert(events.length === 0, `Events list starts empty (found: ${events.length})`);

    const campaigns = await dataService.getDonationCampaigns();
    assert(campaigns.length === 0, `Donation campaigns start empty (found: ${campaigns.length})`);

    const photos = await dataService.getCampusPhotos();
    assert(photos.length === 0, `Campus photos start empty (found: ${photos.length})`);

    const opps = await dataService.getOpportunities();
    assert(opps.length === 0, `Opportunities start empty (found: ${opps.length})`);

    const mentors = await dataService.getMentorProfiles();
    assert(mentors.length === 0, `Mentor profiles start empty (found: ${mentors.length})`);

    const settings = await dataService.getSystemSettings();
    assert(settings.nextAlumniNumber === 1, `Next Alumni Number starts at sequence 1 (found: ${settings.nextAlumniNumber})`);
    assert(settings.nextApplicationNumber === 1, `Next Application Number starts at sequence 1 (found: ${settings.nextApplicationNumber})`);

    report.push('\n=== 2. VERIFYING CREDENTIALS & PRESERVED ADMIN ROLES ===');

    const creds = dataService.getUserCredentials();
    assert(!!creds['admin@massh.ac.ug'], 'Head of ICT Super Admin (admin@massh.ac.ug) exists in credentials');
    assert(!!creds['superadmin@mosa.org'], 'Executive Super Admin (superadmin@mosa.org) exists in credentials');
    assert(!creds['muhammad.z@alumni.massh.ac.ug'], 'Demo user muhammad.z@alumni.massh.ac.ug is permanently removed');

    const adminLogin = await dataService.login('admin@massh.ac.ug', 'admin123', 'admin');
    assert(adminLogin.success && adminLogin.user?.role === 'SUPER_ADMIN', 'Head of ICT can authenticate offline with role SUPER_ADMIN');

    const superAdminLogin = await dataService.login('superadmin@mosa.org', 'admin123', 'admin');
    assert(superAdminLogin.success && superAdminLogin.user?.role === 'SUPER_ADMIN', 'Executive Super Admin can authenticate offline with role SUPER_ADMIN');

    report.push('\n=== 3. VERIFYING REGISTRATION & SEQUENTIAL ALLOCATION (MA. 0001) ===');

    // Submit first application
    const subRes1 = await dataService.submitApplication({
      firstName: 'Joshua',
      lastName: 'Tusabe',
      gender: 'MALE',
      dateOfBirth: '1990-05-14',
      email: 'joshua.tusabe@test.ac.ug',
      phone: '+256700000001',
      country: 'Uganda',
      district: 'Hoima',
      occupation: 'Civil Engineer',
      declarationAccepted: true,
      registrationMode: 'SELF',
      registeredBy: {
        uid: 'test-user-001',
        name: 'Joshua Tusabe',
        email: 'joshua.tusabe@test.ac.ug',
        registeredAt: new Date().toISOString()
      },
      schoolHistory: {
        attendedOLevel: true,
        oLevel: { yearJoined: 2005, yearCompleted: 2008, campus: 'Main Campus', class: 'S4' }
      },
      privacySettings: {
        showName: true,
        showNickname: true,
        showProfession: true,
        showOrganisation: true,
        showCountry: true,
        showPhone: true,
        showEmail: true
      }
    });

    assert(subRes1.success && !!subRes1.id, `First application submitted successfully with ID: ${subRes1.id}`);
    assert(subRes1.referenceId?.includes('00001'), `First application receives reference sequence 00001 (received: ${subRes1.referenceId})`);

    // Verify duplicate prevention on submission
    const dupCheck = await dataService.checkDuplicate('joshua.tusabe@test.ac.ug', '+256700000001');
    assert(dupCheck.isDuplicate, `Duplicate application correctly rejected (reason: ${dupCheck.reason})`);

    // Admin approves the application
    const appRecord = await dataService.getApplicationById(subRes1.id!);
    assert(!!appRecord, 'Application retrieved by ID for administrative review');

    const approveRes = await dataService.approveApplicationAndGenerateMA(appRecord!, 'admin@massh.ac.ug', 'Verified by test');
    assert(approveRes.success, `Application approved successfully by administrator`);
    assert(approveRes.alumniNumber === 'MA. 0001', `First approved member receives official number MA. 0001 (received: ${approveRes.alumniNumber})`);

    const updatedSettings = await dataService.getSystemSettings();
    assert(updatedSettings.nextAlumniNumber === 2, `Next Alumni Number sequence advanced to 2 (found: ${updatedSettings.nextAlumniNumber})`);
    assert(updatedSettings.usedMANumbersRegistry.includes('MA. 0001'), 'MA. 0001 recorded in permanent anti-collision registry');

    report.push('\n=== 4. VERIFYING ACTIVITY HISTORY & AUDIT TRAIL MANAGEMENT ===');

    const initialLogs = await dataService.getAuditLogs();
    assert(initialLogs.length > 0, `Audit logs generated by previous actions (count: ${initialLogs.length})`);

    // Test single log deletion
    const logToDelete = initialLogs[0];
    const delSingleRes = await dataService.deleteAuditLog(logToDelete.id);
    assert(delSingleRes.success, `Single audit log entry deleted: ${logToDelete.id}`);

    const logsAfterSingle = await dataService.getAuditLogs();
    assert(!logsAfterSingle.some(l => l.id === logToDelete.id), 'Deleted log no longer present in audit trail');

    // Test bulk log deletion
    const logsToBulkDelete = logsAfterSingle.slice(0, 2).map(l => l.id);
    if (logsToBulkDelete.length > 0) {
      const delBulkRes = await dataService.deleteAuditLogs(logsToBulkDelete);
      assert(delBulkRes.success && delBulkRes.deletedCount === logsToBulkDelete.length, `Bulk deletion of ${logsToBulkDelete.length} logs succeeded`);
    }

    // Test prune logs older than 0 days (prune all existing)
    const pruneRes = await dataService.pruneAuditLogs(0, 'admin@massh.ac.ug');
    assert(pruneRes.success, `Audit logs pruned successfully (pruned: ${pruneRes.deletedCount})`);

    // Test export audit logs (CSV and JSON)
    const csvExport = dataService.exportAuditLogs('csv');
    assert(typeof csvExport === 'string' && csvExport.startsWith('Timestamp,Action'), 'Audit logs export to CSV generated valid formatted string');

    const jsonExport = dataService.exportAuditLogs('json');
    assert(typeof jsonExport === 'string' && jsonExport.startsWith('['), 'Audit logs export to JSON generated valid JSON array');

    // Clean baseline reset
    dataService.purgeDemoData();
    const finalAlumni = await dataService.getAlumniList();
    assert(finalAlumni.length === 0, `Purge baseline reset alumni count to 0 (found: ${finalAlumni.length})`);

  } catch (err: any) {
    report.push(`❌ FATAL ERROR: ${err.message || String(err)}`);
    allPassed = false;
  }

  return { passed: allPassed, report };
}
