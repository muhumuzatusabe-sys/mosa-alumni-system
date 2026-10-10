import { governanceService } from '../services/governanceService';
import { dataService } from '../services/dataService';
import { AuthUser, Meeting } from '../types';

async function runGovernanceAndAttendanceTests() {
  console.log('=== STARTING GOVERNANCE & ATTENDANCE VERIFICATION TEST SUITE ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const superAdmin: AuthUser = {
    uid: 'super-001',
    email: 'admin@massh.ac.ug',
    displayName: 'Headmaster MASSH',
    role: 'SUPER_ADMIN',
    active: true,
  };

  const secretary: AuthUser = {
    uid: 'sec-001',
    email: 'secretary@massh.ac.ug',
    displayName: 'MOSA Secretary General',
    role: 'SECRETARY',
    active: true,
  };

  const treasurer: AuthUser = {
    uid: 'tres-001',
    email: 'treasurer@massh.ac.ug',
    displayName: 'Honorary Treasurer',
    role: 'TREASURER',
    active: true,
  };

  const publicity: AuthUser = {
    uid: 'pub-001',
    email: 'publicity@massh.ac.ug',
    displayName: 'Publicity Officer',
    role: 'PUBLICITY',
    active: true,
  };

  const ordinaryAlumni: AuthUser = {
    uid: 'alumni-001',
    email: 'alumnus@example.com',
    displayName: 'Jane Akello',
    role: 'ALUMNI',
    alumniId: 'alm-jane-01',
    alumniNumber: 'MA. 0001',
    active: true,
  };

  try {
    // 1. Role Permission Matrix Enforcement
    console.log('\n--- 1. Role Permission Matrix ---');
    assert(governanceService.can(superAdmin, 'REGISTRY', 'MANAGE'), 'Super Admin has REGISTRY MANAGE');
    assert(governanceService.can(superAdmin, 'ATTENDANCE', 'MANAGE'), 'Super Admin has ATTENDANCE MANAGE');
    assert(governanceService.can(superAdmin, 'SETTINGS', 'CONFIGURE'), 'Super Admin has SETTINGS CONFIGURE');

    assert(governanceService.can(secretary, 'REGISTRY', 'VERIFY'), 'Secretary has REGISTRY VERIFY');
    assert(governanceService.can(secretary, 'ATTENDANCE', 'ADD'), 'Secretary has ATTENDANCE ADD');
    assert(governanceService.can(secretary, 'ATTENDANCE', 'EXPORT'), 'Secretary has ATTENDANCE EXPORT');
    assert(!governanceService.can(secretary, 'FINANCE', 'MANAGE'), 'Secretary does NOT have FINANCE MANAGE');
    assert(!governanceService.can(secretary, 'SETTINGS', 'CONFIGURE'), 'Secretary does NOT have SETTINGS CONFIGURE');

    assert(governanceService.can(treasurer, 'FINANCE', 'VERIFY'), 'Treasurer has FINANCE VERIFY');
    assert(!governanceService.can(treasurer, 'REGISTRY', 'EDIT'), 'Treasurer does NOT have REGISTRY EDIT');
    assert(!governanceService.can(treasurer, 'ATTENDANCE', 'MANAGE'), 'Treasurer does NOT have ATTENDANCE MANAGE');

    assert(governanceService.can(publicity, 'COMMUNICATIONS', 'PUBLISH'), 'Publicity has COMMUNICATIONS PUBLISH');
    assert(!governanceService.can(publicity, 'ATTENDANCE', 'ADD'), 'Publicity does NOT have ATTENDANCE ADD');

    assert(!governanceService.can(ordinaryAlumni, 'ATTENDANCE', 'MANAGE'), 'Ordinary alumni does NOT have ATTENDANCE MANAGE');
    assert(!governanceService.can(ordinaryAlumni, 'REGISTRY', 'EDIT'), 'Ordinary alumni does NOT have REGISTRY EDIT');

    // 2. Staff Seed Accounts
    console.log('\n--- 2. Staff Seed Accounts ---');
    governanceService.ensureSeedStaff();
    const staff = governanceService.getStaffAccounts();
    assert(staff.length >= 3, `Seeded staff accounts exist (found ${staff.length})`);
    assert(staff.some(s => s.role === 'SECRETARY'), 'Secretary account exists');
    assert(staff.some(s => s.role === 'TREASURER'), 'Treasurer account exists');
    assert(staff.some(s => s.role === 'PUBLICITY'), 'Publicity account exists');

    // 3. Meeting Creation & State Transitions
    console.log('\n--- 3. Meeting Creation & State Transitions ---');
    const meeting = await governanceService.createMeeting({
      title: 'MOSA National Executive Committee Q4',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '13:00',
      venue: 'Main Hall, Mandela Secondary School Hoima',
      city: 'Hoima',
      category: 'GENERAL',
      quorumRequired: 20,
    }, secretary);

    assert(meeting.id.startsWith('mtg-'), `Meeting created with ID: ${meeting.id}`);
    assert(meeting.attendanceState === 'CLOSED', 'New meeting initial attendance state is CLOSED');

    // Open attendance
    const opened = await governanceService.setMeetingState(meeting.id, 'OPEN', secretary);
    assert(opened.attendanceState === 'OPEN', 'Secretary opened attendance successfully');

    // 4. Meeting Check-in & Self-Registration
    console.log('\n--- 4. Meeting Attendance Check-ins ---');
    const selfRec = await governanceService.selfRegister(meeting.id, ordinaryAlumni);
    assert(selfRec.status === 'PENDING', 'Self-registered alumnus status is PENDING (cannot self-verify)');
    assert(selfRec.source === 'SELF', 'Source marked as SELF');
    assert(selfRec.attendeeType === 'ALUMNI_MEMBER', 'Attendee type marked as ALUMNI_MEMBER');

    // Prevent duplicate check-in
    let threwDup = false;
    try {
      await governanceService.selfRegister(meeting.id, ordinaryAlumni);
    } catch {
      threwDup = true;
    }
    assert(threwDup, 'Duplicate self-registration was rejected');

    // Secretary verifies the self-registration
    await governanceService.setStatus(meeting.id, [selfRec.id], 'VERIFIED', secretary);
    const verified = governanceService.getAttendance(meeting.id).find(r => r.id === selfRec.id);
    assert(verified?.status === 'VERIFIED', 'Secretary verified the attendee');
    assert(verified?.verifiedBy === secretary.email, 'VerifiedBy recorded secretary email');

    // 5. Assisted Registration (no phone required on alumnus side)
    console.log('\n--- 5. Assisted Registration for Attendees ---');
    const assistedRec = await governanceService.addGuest(meeting.id, {
      fullName: 'Elder Patrick Mugisa (MASSH 1999)',
      attendeeType: 'ALUMNI_MEMBER',
      organisation: 'Bunyoro Kingdom',
      position: 'Elder',
    }, secretary, false);

    assert(assistedRec.status === 'VERIFIED', 'Assisted attendee added by Secretary is immediately VERIFIED');
    assert(assistedRec.fullName === 'Elder Patrick Mugisa (MASSH 1999)', 'Assisted attendee name saved correctly');

    // 6. Guest Registration with Registry Profile Opening
    console.log('\n--- 6. Guest Registration ---');
    const guestRec = await governanceService.addGuest(meeting.id, {
      fullName: 'Hon. Grace Asiimwe',
      attendeeType: 'INVITED_OFFICIAL',
      organisation: 'Ministry of Education',
      position: 'Commissioner',
      category: 'Special Guest',
    }, secretary, false);

    assert(guestRec.attendeeType === 'INVITED_OFFICIAL', 'Guest attendeeType set to INVITED_OFFICIAL');
    assert(guestRec.source === 'GUEST', 'Source marked as GUEST');

    // 7. Live Statistics
    console.log('\n--- 7. Live Attendance Statistics ---');
    const stats = governanceService.getStats(meeting.id);
    assert(stats.registered >= 3, `Total registered count is ${stats.registered}`);
    assert(stats.verified >= 3, `Total verified count is ${stats.verified}`);
    assert(stats.byType.ALUMNI_MEMBER >= 2, 'Alumni member count correct');
    assert(stats.byType.INVITED_OFFICIAL >= 1, 'Invited official count correct');

    // 8. Deliberate State Transitions: Close Check-in & Finalize
    console.log('\n--- 8. Finalization and Audit Lock ---');
    await governanceService.setMeetingState(meeting.id, 'CHECKIN_CLOSED', secretary);
    const mCheckinClosed = governanceService.getMeeting(meeting.id);
    assert(mCheckinClosed?.attendanceState === 'CHECKIN_CLOSED', 'Meeting state updated to CHECKIN_CLOSED');

    await governanceService.setMeetingState(meeting.id, 'FINALIZED', secretary);
    const mFinalized = governanceService.getMeeting(meeting.id);
    assert(mFinalized?.attendanceState === 'FINALIZED', 'Meeting state updated to FINALIZED');

    // Try modifying finalized attendance (should throw)
    let threwFinalized = false;
    try {
      await governanceService.selfRegister(meeting.id, ordinaryAlumni);
    } catch {
      threwFinalized = true;
    }
    assert(threwFinalized, 'Modifying finalized attendance is blocked');

    // Super Admin reopens with audit reason
    const reopened = await governanceService.reopenFinalized(
      meeting.id,
      superAdmin,
      'Executive committee approved quorum resolution after hours'
    );
    assert(reopened.attendanceState === 'OPEN', 'Super admin reopened finalized attendance with mandatory reason');

    // 9. CSV Export
    console.log('\n--- 9. CSV Attendance Export ---');
    const csv = governanceService.toCSV(meeting.id);
    assert(csv.includes('Meeting,Date,Name,MA Number'), 'CSV header present');
    assert(csv.includes('Hon. Grace Asiimwe'), 'Guest name included in CSV');
    assert(csv.includes('Elder Patrick Mugisa'), 'Alumnus name included in CSV');

    // 10. Auth Strategy Settings
    console.log('\n--- 10. Authentication Strategy Settings ---');
    const currentAuth = governanceService.getAuthSettings();
    assert(currentAuth.allowEmailPassword === true, 'Email password allowed by default');
    assert(currentAuth.allowPhonePassword === true, 'Phone password allowed by default');

    await governanceService.updateAuthSettings({
      ...currentAuth,
      allowMANumberPassword: true,
    }, superAdmin);

    const updatedAuth = governanceService.getAuthSettings();
    assert(updatedAuth.allowMANumberPassword === true, 'Updated MA number password auth strategy persisted');

  } catch (err: any) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGovernanceAndAttendanceTests();
