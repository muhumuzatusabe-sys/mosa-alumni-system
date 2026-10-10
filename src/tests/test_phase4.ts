// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

import { dataService } from '../services/dataService';

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('  MOSA ALUMNI SYSTEM - PHASE 4 EVENTS & ATTENDANCE VERIFICATION');
  console.log('  Mandela Secondary School Hoima (MASSH, Est. 1997)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // TEST 1: Initial Seeded Events
    console.log('--- TEST GROUP 1: INITIAL EVENTS RETRIEVAL ---');
    const events = await dataService.getEvents();
    assert(events.length >= 3, 'System initializes with at least 3 seeded events');
    
    const convention = events.find(e => e.title.includes('Grand Alumni Convention'));
    assert(Boolean(convention), 'MASSH Grand Alumni Convention & Dinner exists');
    assert(convention?.venue.includes('MASSH Hoima') === true, 'Convention venue matches MASSH Hoima');
    assert(convention?.status === 'UPCOMING', 'Convention status is UPCOMING');

    const mentorship = events.find(e => e.title.includes('Mentorship'));
    assert(Boolean(mentorship), 'Bunyoro Youth STEM & Career Mentorship event exists');
    assert(mentorship?.eventType === 'MENTORSHIP', 'Mentorship has type MENTORSHIP');

    // TEST 2: Dynamic Event Creation (Section 12)
    console.log('\n--- TEST GROUP 2: DYNAMIC EVENT CREATION ---');
    const newEventRes = await dataService.createEvent({
      title: 'MOSA Medical Outreach & Health Camp 2026',
      description: 'Free healthcare checkups and career guidance by MASSH alumni doctors and nurses at Hoima Regional Referral Hospital grounds.',
      eventType: 'COMMUNITY_SERVICE',
      date: '2026-11-20',
      startTime: '08:00',
      endTime: '17:00',
      venue: 'Hoima Regional Referral Hospital Grounds',
      registrationDeadline: '2026-11-18',
      registrationRequirement: 'REGISTRATION_REQUIRED',
      eventImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
      status: 'UPCOMING',
      createdBy: 'admin@massh.ac.ug'
    }, 'admin@massh.ac.ug');

    assert(Boolean(newEventRes.id), 'Successfully created new event dynamically');
    const createdEventId = newEventRes.id!;

    // Verify it appears in event listing
    const updatedEvents = await dataService.getEvents();
    const foundNewEvent = updatedEvents.find(e => e.id === createdEventId);
    assert(Boolean(foundNewEvent), 'Newly created event is retrievable via getEvents()');
    assert(foundNewEvent?.eventType === 'COMMUNITY_SERVICE', 'Event type is COMMUNITY_SERVICE');

    // Fetch verified alumni
    const alumniList = await dataService.getAlumniList();
    const muhammad = alumniList.find(a => a.alumniNumber === 'MA. 0001');
    const grace = alumniList.find(a => a.alumniNumber === 'MA. 0002');
    assert(Boolean(muhammad), 'Found verified alumnus Muhammad Zatusave (MA. 0001)');
    assert(Boolean(grace), 'Found verified alumnus Grace Mary Akiiki (MA. 0002)');

    // TEST 3: Alumnus RSVP & QR Pass Token Generation
    console.log('\n--- TEST GROUP 3: RSVP & QR PASS GENERATION ---');
    const rsvp1 = await dataService.registerForEvent(createdEventId, muhammad!);

    assert(rsvp1.success === true, 'Alumnus MA. 0001 successfully RSVPd');
    assert(Boolean(rsvp1.registration?.qrCheckInToken), 'Digital QR Pass Token generated');
    assert(rsvp1.registration?.qrCheckInToken.startsWith('QR-') === true, 'QR token matches QR- prefix format');
    assert(rsvp1.registration?.status === 'REGISTERED', 'Registration status is REGISTERED');

    // Test duplicate registration prevention
    const duplicateRes = await dataService.registerForEvent(createdEventId, muhammad!);
    assert(duplicateRes.success === false, 'Duplicate RSVP attempt failed as expected');
    assert(duplicateRes.error?.includes('already registered') === true, 'Duplicate error message mentions already registered');

    // Register second alumnus (Grace Mary Akiiki)
    const rsvp2 = await dataService.registerForEvent(createdEventId, grace!);
    assert(rsvp2.success === true, 'Alumnus MA. 0002 successfully RSVPd');

    // Check event registration list
    const regList = await dataService.getEventRegistrations(createdEventId);
    assert(regList.length === 2, 'Event registrations count is 2');

    // TEST 4: QR Code Check-in Verification (Section 13)
    console.log('\n--- TEST GROUP 4: QR CODE SCAN & ATTENDANCE VERIFICATION ---');
    const qrResult = await dataService.verifyAndCheckInByQR(
      rsvp1.registration!.qrCheckInToken,
      'admin@massh.ac.ug'
    );

    assert(qrResult.success === true, 'QR Check-in succeeded');
    assert(qrResult.alumniNumber === 'MA. 0001', 'QR check-in correctly identified MA. 0001');

    // Test duplicate QR check-in prevention
    const qrDoubleScan = await dataService.verifyAndCheckInByQR(
      rsvp1.registration!.qrCheckInToken,
      'admin@massh.ac.ug'
    );
    assert(qrDoubleScan.success === false, 'Double scan on same QR pass rejected');
    assert(qrDoubleScan.error?.includes('ALREADY checked in') === true, 'Double scan error mentions already checked in');

    // TEST 5: Manual Check-In Desk by Alumni Number
    console.log('\n--- TEST GROUP 5: MANUAL CHECK-IN BY ALUMNI NUMBER ---');
    const manualCheckIn = await dataService.checkInAttendee(
      createdEventId,
      'MA. 0002',
      'admin@massh.ac.ug',
      'MANUAL_ADMIN'
    );

    assert(manualCheckIn.success === true, 'Manual check-in succeeded for MA. 0002');
    assert(manualCheckIn.attendance?.checkInMethod === 'MANUAL_ADMIN', 'Check-in method recorded as MANUAL_ADMIN');

    // Test duplicate manual check-in
    const manualDouble = await dataService.checkInAttendee(
      createdEventId,
      'MA. 0002',
      'admin@massh.ac.ug',
      'MANUAL_ADMIN'
    );
    assert(manualDouble.success === false, 'Duplicate manual check-in rejected');
    assert(manualDouble.error?.includes('ALREADY checked in') === true, 'Error message warns alumnus is already checked in');

    // Check attendance records count
    const attendanceRecords = await dataService.getEventAttendance(createdEventId);
    assert(attendanceRecords.length === 2, 'Total attendance records for event is 2');
    const ma1Record = attendanceRecords.find(a => a.alumniNumber === 'MA. 0001');
    assert(ma1Record?.checkInMethod === 'QR_SCAN', 'MA. 0001 method is QR_SCAN');

    // TEST 6: Event Update & Cancellation
    console.log('\n--- TEST GROUP 6: EVENT UPDATES & CANCELLATION ---');
    await dataService.updateEvent(createdEventId, {
      notes: 'Please bring your MASSH alumni badge or ID.'
    }, 'admin@massh.ac.ug');

    const verifiedUpdatedEvent = await dataService.getEventById(createdEventId);
    assert(verifiedUpdatedEvent?.notes === 'Please bring your MASSH alumni badge or ID.', 'Event notes updated successfully');

    await dataService.cancelEvent(createdEventId, 'admin@massh.ac.ug');
    const cancelledEvent = await dataService.getEventById(createdEventId);
    assert(cancelledEvent?.status === 'CANCELLED', 'Event status successfully transitioned to CANCELLED');

    // TEST 7: Audit Trail
    console.log('\n--- TEST GROUP 7: AUDIT TRAIL LOGGING ---');
    const auditLogs = await dataService.getAuditLogs();
    const eventCreatedLog = auditLogs.find(l => l.action === 'EVENT_CREATED');
    assert(Boolean(eventCreatedLog), 'EVENT_CREATED audit log found');

    const eventRegLog = auditLogs.find(l => l.action === 'EVENT_REGISTRATION');
    assert(Boolean(eventRegLog), 'EVENT_REGISTRATION audit log found');

    const eventCheckinLog = auditLogs.find(l => l.action === 'EVENT_ATTENDANCE_CHECKIN');
    assert(Boolean(eventCheckinLog), 'EVENT_ATTENDANCE_CHECKIN audit log found');

    console.log('\n================================================================');
    console.log(`  PHASE 4 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 4 test execution:', error);
    process.exit(1);
  }
}

runPhase4Tests();
