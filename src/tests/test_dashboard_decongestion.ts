import { dataService } from '../services/dataService';
import { isStaffRole } from '../services/governanceService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

export async function runDashboardDecongestionTests() {
  console.log('\n==================================================');
  console.log('RUNNING DASHBOARD & REGISTRY DECONGESTION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;

  try {
    // 1. Actionable Deep-Linked Notifications Test Group
    console.log('--- TEST GROUP 1: ACTIONABLE DEEP-LINKED NOTIFICATIONS ---');
    const notifs = await dataService.getAlumniNotifications('alumni-0001');
    assert(notifs.length >= 5, 'At least 5 deep-linked notifications available');

    // Case 1: Attendance Sign-In Open
    const attendanceNotif = notifs.find(n => n.type === 'ATTENDANCE_OPEN');
    assert(Boolean(attendanceNotif), 'Attendance open notification exists');
    assert(attendanceNotif?.linkTab === 'attendance', 'Attendance notification deep-links to attendance tab');
    passed += 2;

    // Case 2: Membership Application Approved
    const membershipNotif = notifs.find(n => n.type === 'MEMBERSHIP_APPROVED');
    assert(Boolean(membershipNotif), 'Membership approved notification exists');
    assert(membershipNotif?.linkTab === 'my-profile' || membershipNotif?.linkTab === 'membership', 'Membership notification deep-links to profile/membership');
    passed += 2;

    // Case 3: Contribution Verified
    const paymentNotif = notifs.find(n => n.type === 'PAYMENT_VERIFIED');
    assert(Boolean(paymentNotif), 'Payment verified notification exists');
    assert(paymentNotif?.linkTab === 'payments', 'Payment notification deep-links to payments/giving');
    passed += 2;

    // Case 4: Event Announced
    const eventNotif = notifs.find(n => n.type === 'EVENT_ANNOUNCED' || n.type === 'EVENT_INVITE');
    assert(Boolean(eventNotif), 'Event announced notification exists');
    assert(eventNotif?.linkTab === 'events', 'Event notification deep-links to events tab');
    passed += 2;

    // Case 5: Registry Profile Updated
    const registryNotif = notifs.find(n => n.type === 'REGISTRY_UPDATED');
    assert(Boolean(registryNotif), 'Registry updated notification exists');
    assert(registryNotif?.linkTab === 'directory' || registryNotif?.linkTab === 'my-profile', 'Registry notification deep-links to directory/profile');
    passed += 2;

    // 2. Notification Actions & State Transitions
    console.log('\n--- TEST GROUP 2: NOTIFICATION READ STATE MANAGEMENT ---');
    if (attendanceNotif) {
      await dataService.markNotificationAsRead(attendanceNotif.id);
      const afterRead = await dataService.getAlumniNotifications('alumni-0001');
      const updatedAttendance = afterRead.find(n => n.id === attendanceNotif.id);
      assert(updatedAttendance?.isRead === true, 'Notification marked as read upon user click');
      passed++;
    }

    await dataService.markAllNotificationsAsRead('alumni-0001');
    const allRead = await dataService.getAlumniNotifications('alumni-0001');
    assert(allRead.every(n => n.isRead === true), 'All notifications marked as read');
    passed++;

    // 3. Fallback Notifications for Any Alumnus
    console.log('\n--- TEST GROUP 3: FALLBACK COVERAGE FOR ALL ALUMNI ---');
    const randomUserNotifs = await dataService.getAlumniNotifications('alumni-9999');
    assert(randomUserNotifs.length >= 5, 'New or unseeded alumni receive actionable template notifications');
    assert(randomUserNotifs.some(n => n.linkTab === 'attendance'), 'Fallback includes attendance deep-link');
    assert(randomUserNotifs.some(n => n.linkTab === 'payments'), 'Fallback includes payments deep-link');
    passed += 3;

    // 4. Admin Role Separation Check
    console.log('\n--- TEST GROUP 4: SEPARATION OF ADMIN PRIVILEGES ---');
    assert(isStaffRole('ADMIN') === true, 'ADMIN is staff role');
    assert(isStaffRole('SUPER_ADMIN') === true, 'SUPER_ADMIN is staff role');
    assert(isStaffRole('CHAIRPERSON') === true, 'CHAIRPERSON is executive staff');
    assert(isStaffRole('ALUMNI') === false, 'Standard ALUMNI is strictly member role');
    assert(isStaffRole(undefined) === false, 'Unauthenticated guest is strictly public role');
    passed += 5;

    console.log(`\n==================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, 0 FAILED`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runDashboardDecongestionTests();
