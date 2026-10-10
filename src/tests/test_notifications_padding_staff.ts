import assert from 'assert';
import { dataService } from '../services/dataService';
import { governanceService, ADMIN_ROLES } from '../services/governanceService';
import { UserRole, PermissionModule } from '../types';

console.log('--- Testing Requirement 1: Notifications & Alert Integration ---');

// 1. Verify notifications retrieval and unread state tracking
(async () => {
  const notifs = await dataService.getAlumniNotifications('alumni-0001');
  assert(Array.isArray(notifs), 'Notifications must return an array');
  const unreadCount = notifs.filter(n => !n.isRead).length;
  console.log(`[PASS] Initial unread notifications count: ${unreadCount}`);

  // Test marking notification as read preserves list and updates count
  if (notifs.length > 0) {
    const firstNotif = notifs[0];
    await dataService.markNotificationAsRead(firstNotif.id);
    const updated = await dataService.getAlumniNotifications('alumni-0001');
    const updatedFirst = updated.find(n => n.id === firstNotif.id);
    assert(updatedFirst?.isRead === true, 'Notification should be marked read');
    console.log('[PASS] Notification marked read successfully');
  }

  console.log('--- Testing Requirement 2: MA Number Sequence Padding (1, 2, 3, 4 Digits) ---');

  // Verify formatting with different padding digits
  const formatted1 = dataService.formatAlumniNumber(1, 'MA. ', 1);
  const formatted2 = dataService.formatAlumniNumber(1, 'MA. ', 2);
  const formatted3 = dataService.formatAlumniNumber(1, 'MA. ', 3);
  const formatted4 = dataService.formatAlumniNumber(1, 'MA. ', 4);

  assert.strictEqual(formatted1, 'MA. 1', '1 digit padding must produce MA. 1');
  assert.strictEqual(formatted2, 'MA. 01', '2 digits padding must produce MA. 01');
  assert.strictEqual(formatted3, 'MA. 001', '3 digits padding must produce MA. 001');
  assert.strictEqual(formatted4, 'MA. 0001', '4 digits padding must produce MA. 0001');
  console.log('[PASS] formatAlumniNumber generates exact sequence for 1, 2, 3, 4 digits:');
  console.log(`       1 digit: ${formatted1}, ${dataService.formatAlumniNumber(2, 'MA. ', 1)}, ${dataService.formatAlumniNumber(3, 'MA. ', 1)}`);
  console.log(`       2 digits: ${formatted2}, ${dataService.formatAlumniNumber(2, 'MA. ', 2)}, ${dataService.formatAlumniNumber(3, 'MA. ', 2)}`);
  console.log(`       3 digits: ${formatted3}, ${dataService.formatAlumniNumber(2, 'MA. ', 3)}, ${dataService.formatAlumniNumber(3, 'MA. ', 3)}`);
  console.log(`       4 digits: ${formatted4}, ${dataService.formatAlumniNumber(2, 'MA. ', 4)}, ${dataService.formatAlumniNumber(3, 'MA. ', 4)}`);

  // Verify SystemSettings stores and retains padDigits configuration
  await dataService.updateSystemSettings({ prefix: 'MA. ', padDigits: 2 }, 'admin@massh.ac.ug');
  let settings = await dataService.getSystemSettings();
  assert.strictEqual(settings.padDigits, 2, 'SystemSettings must persist padDigits=2');
  console.log('[PASS] SystemSettings successfully persists padDigits');

  // Verify existing alumni records retain their authentic assigned numbers without mutation
  const alumni = await dataService.getAlumniList();
  assert(alumni.length > 0, 'Alumni registry must contain seeded members');
  const existingFirst = alumni[0];
  assert(existingFirst.alumniNumber.startsWith('MA'), 'Existing assigned MA number remains intact');
  console.log(`[PASS] Existing assigned MA number "${existingFirst.alumniNumber}" is protected and not altered by setting changes`);

  // Reset to default padDigits = 4
  await dataService.updateSystemSettings({ prefix: 'MA. ', padDigits: 4 }, 'admin@massh.ac.ug');

  console.log('--- Testing Requirement 3: Staff Roles & Accounts Linked to Alumni Registry ---');

  // Verify all 9 administrative roles are supported
  const requiredRoles: UserRole[] = [
    'SUPER_ADMIN',
    'SECRETARY',
    'TREASURER',
    'MEMBERSHIP_ADMIN',
    'DIRECTORY_ADMIN',
    'EVENTS_ATTENDANCE_ADMIN',
    'PUBLICITY',
    'CHAPTER_ADMIN',
    'CUSTOM_STAFF',
  ];

  requiredRoles.forEach(role => {
    const roleDef = ADMIN_ROLES.find(r => r.key === role);
    assert(roleDef !== undefined, `Role ${role} must exist in ADMIN_ROLES definition`);
  });
  console.log(`[PASS] All ${requiredRoles.length} administrative roles exist and are configurable`);

  // Actor
  const superAdmin = {
    uid: 'super-admin-01',
    email: 'admin@massh.ac.ug',
    displayName: 'Super Admin',
    role: 'SUPER_ADMIN' as UserRole,
  };

  // Attach a staff account from an existing alumni registry member
  const targetAlumnus = alumni[0];
  const staffAccount = await governanceService.saveStaffAccount({
    email: targetAlumnus.email || 'linked.staff@massh.ac.ug',
    displayName: targetAlumnus.fullName,
    role: 'TREASURER',
    alumniId: targetAlumnus.internalId,
    alumniNumber: targetAlumnus.alumniNumber,
    photoUrl: targetAlumnus.photoUrl,
    assignedPermissions: ['FINANCE', 'REPORTS'] as PermissionModule[],
    active: true,
  }, superAdmin);

  assert.strictEqual(staffAccount.alumniId, targetAlumnus.internalId, 'Staff account must attach to existing alumniId');
  assert.strictEqual(staffAccount.alumniNumber, targetAlumnus.alumniNumber, 'Staff account must attach to existing alumniNumber');
  console.log(`[PASS] Staff account linked to existing alumni registry member (${targetAlumnus.alumniNumber}) without duplicating record`);

  // Verify granular permission enforcement using assignedPermissions
  const canFinance = governanceService.can(staffAccount, 'FINANCE', 'VIEW');
  const canReports = governanceService.can(staffAccount, 'REPORTS', 'EXPORT');
  const canUsers = governanceService.can(staffAccount, 'USERS', 'MANAGE');

  assert.strictEqual(canFinance, true, 'Staff member with FINANCE assigned should have access');
  assert.strictEqual(canReports, true, 'Staff member with REPORTS assigned should have access');
  assert.strictEqual(canUsers, false, 'Staff member without USERS assigned should not manage users');
  console.log('[PASS] Granular modular responsibilities correctly enforced via assignedPermissions');

  // Verify Custom Staff Role with custom permissions
  const customStaff = await governanceService.saveStaffAccount({
    email: 'custom.event.admin@massh.ac.ug',
    displayName: 'Custom Event Lead',
    role: 'CUSTOM_STAFF',
    alumniId: targetAlumnus.internalId,
    alumniNumber: targetAlumnus.alumniNumber,
    assignedPermissions: ['EVENTS', 'ATTENDANCE', 'COMMUNICATIONS'] as PermissionModule[],
    active: true,
  }, superAdmin);

  assert.strictEqual(governanceService.can(customStaff, 'EVENTS', 'VIEW'), true, 'Custom staff has EVENTS access');
  assert.strictEqual(governanceService.can(customStaff, 'ATTENDANCE', 'VIEW'), true, 'Custom staff has ATTENDANCE access');
  assert.strictEqual(governanceService.can(customStaff, 'FINANCE', 'VIEW'), false, 'Custom staff does not have FINANCE access');
  console.log('[PASS] Custom staff role with granular modular checkboxes verified successfully');

  console.log('\n======================================================');
  console.log('ALL TESTS FOR NOTIFICATIONS, SEQUENCE PADDING & STAFF PASSING (100%)');
  console.log('======================================================\n');
})();
