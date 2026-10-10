import { dataService } from '../services/dataService';
import { governanceService } from '../services/governanceService';
import { AuthUser, Meeting } from '../types';

export async function runRefinementsAndAssistedTests() {
  console.log('=== STARTING REFINEMENTS, ATTENDANCE & ASSISTED REGISTRATION TESTS ===');
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

  const secretary: AuthUser = {
    uid: 'sec-test-01',
    email: 'secretary@massh.ac.ug',
    displayName: 'MOSA Secretary General',
    role: 'SECRETARY',
    active: true,
  };

  const memberJane: AuthUser = {
    uid: 'alm-jane-001',
    email: 'jane.akello@alumni.massh.ug',
    displayName: 'Jane Akello',
    role: 'ALUMNI',
    alumniId: 'alumni-jane-001',
    alumniNumber: 'MA.-0099',
    active: true,
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Assisted Registration for Device-Free Alumni
    // ----------------------------------------------------
    console.log('\n--- 1. Assisted Registration for Device-Free Alumni ---');
    const assistedPayload = {
      firstName: 'Francis',
      middleName: 'T',
      lastName: 'Kabagambe',
      nickname: 'Big Brother',
      gender: 'Male' as const,
      dateOfBirth: '1985-04-12',
      phone: '0772-FAMILY-CONTACT',
      email: '', // Device-free, no personal email
      country: 'Uganda',
      city: 'Hoima',
      occupation: 'Farmer & Elder',
      organisation: 'Hoima District Farmers',
      registrationMode: 'ASSISTED' as const,
      registeredBy: {
        name: secretary.displayName,
        email: secretary.email,
        uid: secretary.uid,
        role: secretary.role,
        station: 'Secretariat Registration Desk Hoima Main Hall',
        deviceNotes: 'Secretariat iPad Terminal #1',
        registeredAt: new Date().toISOString(),
      },
      accountActivated: false,
      schoolHistory: {
        attendedOLevel: true,
        oLevel: {
          yearJoined: 1999,
          yearCompleted: 2002,
          campus: 'Main Campus Hoima',
          class: 'Senior 4',
          stream: 'Blue Stream',
        },
        attendedALevel: false,
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

    const submitRes = await dataService.submitApplication(assistedPayload);
    assert(submitRes.success && !!submitRes.id, 'Assisted registration submitted successfully');

    // Retrieve the application and verify separation of Alumnus Identity vs Agent
    const apps = await dataService.getApplications();
    const recordedApp = apps.find(a => a.id === submitRes.id);
    assert(!!recordedApp, 'Recorded application found in applications registry');
    assert(recordedApp?.registrationMode === 'ASSISTED', 'Registration mode marked as ASSISTED');
    assert(recordedApp?.registeredBy?.name === secretary.displayName, 'Registered by admin name correctly attributed');
    assert(recordedApp?.registeredBy?.email === secretary.email, 'Registered by admin email correctly attributed');
    assert(recordedApp?.firstName === 'Francis' && recordedApp?.lastName === 'Kabagambe', 'Alumnus genuine identity preserved');
    assert(recordedApp?.accountActivated === false, 'Account marked as not activated (device-free)');

    // Check if MA Number was auto-allocated, or manually approve
    let finalAlumniNumber = submitRes.alumniNumber;
    if (!finalAlumniNumber) {
      const approveRes = await dataService.approveApplicationAndGenerateMA(
        submitRes.id!,
        secretary.email,
        'Approved via Assisted Registration Desk by Secretariat'
      );
      assert(approveRes.success && !!approveRes.alumniNumber, `Official MA Number generated: ${approveRes.alumniNumber}`);
      finalAlumniNumber = approveRes.alumniNumber;
    } else {
      assert(!!finalAlumniNumber, `Official MA Number auto-generated on submission: ${finalAlumniNumber}`);
    }

    // Verify member is in the official alumni registry
    const members = await dataService.getAlumniList();
    const newMember = members.find(m => m.applicationId === submitRes.id);
    assert(!!newMember, 'Assisted alumnus is active in the official Alumni Registry');
    assert(newMember?.registrationMode === 'ASSISTED', 'AlumniProfile reflects registrationMode: ASSISTED');

    // ----------------------------------------------------
    // TEST 2: Meeting Attendance Workflow & Member Self Check-in
    // ----------------------------------------------------
    console.log('\n--- 2. Meeting Attendance Workflow & Member Self Check-in ---');
    const meeting = await governanceService.createMeeting({
      title: 'MOSA Annual General Assembly 2026',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '15:00',
      venue: 'Mandela Secondary School Main Hall',
      city: 'Hoima',
      expectedAttendance: 250,
      attendanceRequirement: 'MEMBERS_AND_GUESTS',
    }, secretary);

    assert(meeting.attendanceState === 'CLOSED', 'Meeting starts in CLOSED state');

    // Attempting self-register while meeting is CLOSED should throw
    let closedErr = '';
    try {
      await governanceService.selfRegister(meeting.id, memberJane);
    } catch (e: any) {
      closedErr = e.message;
    }
    assert(closedErr.includes('not been opened'), 'Self-register blocked while meeting is CLOSED');

    // Secretary opens attendance
    await governanceService.changeAttendanceState(meeting.id, 'OPEN', secretary);
    const openedMeeting = governanceService.getMeeting(meeting.id);
    assert(openedMeeting?.attendanceState === 'OPEN', 'Secretary opened attendance successfully');

    // Member signs attendance
    const attendanceRecord = await governanceService.selfRegister(meeting.id, memberJane);
    assert(attendanceRecord.status === 'PENDING', 'Member check-in status is PENDING verification');
    assert(attendanceRecord.source === 'SELF', 'Attendance source is SELF');
    assert(attendanceRecord.fullName === memberJane.displayName, 'Member name recorded correctly');

    // Duplicate check-in prevention: second attempt must throw
    let dupErr = '';
    try {
      await governanceService.selfRegister(meeting.id, memberJane);
    } catch (e: any) {
      dupErr = e.message;
    }
    assert(dupErr.includes('already registered'), 'Duplicate member check-in correctly blocked');

    // Member assists a fellow alumnus without a smartphone
    const assistedAttRec = await governanceService.assistedMemberRegister(
      meeting.id,
      {
        fullName: 'Patrick Byaruhanga',
        alumniNumber: 'MA.-0055',
        phone: '0772999888',
      },
      memberJane
    );
    assert(assistedAttRec.status === 'PENDING', 'Assisted attendee status is PENDING');
    assert(assistedAttRec.source === 'ASSISTED', 'Assisted attendee source is ASSISTED');
    assert(assistedAttRec.addedBy?.includes(memberJane.email), 'AddedBy attributes the assisting member');

    // Live Monitoring stats check
    const liveStats = governanceService.getStats(meeting.id);
    assert(liveStats.registered >= 2, `Live monitoring registered count >= 2 (found ${liveStats.registered})`);
    assert(liveStats.pending >= 2, `Live monitoring pending count >= 2 (found ${liveStats.pending})`);

    // Secretary verifies Jane's attendance
    const verifiedCount = await governanceService.setStatus(meeting.id, [attendanceRecord.id], 'VERIFIED', secretary);
    assert(verifiedCount === 1, 'Secretary verified 1 attendance record');

    const updatedStats = governanceService.getStats(meeting.id);
    assert(updatedStats.verified >= 1, 'Verified count incremented');

    // Secretary unverifies / sets back to PENDING if needed
    const unverifiedCount = await governanceService.setStatus(meeting.id, [attendanceRecord.id], 'PENDING', secretary);
    assert(unverifiedCount === 1, 'Secretary unverified / set record back to PENDING');

    // Re-verify
    await governanceService.setStatus(meeting.id, [attendanceRecord.id], 'VERIFIED', secretary);

    // Secretary closes check-in
    await governanceService.changeAttendanceState(meeting.id, 'CHECKIN_CLOSED', secretary);
    const checkinClosedMtg = governanceService.getMeeting(meeting.id);
    assert(checkinClosedMtg?.attendanceState === 'CHECKIN_CLOSED', 'Check-in state moved to CHECKIN_CLOSED');

    // Secretary finalizes meeting attendance
    await governanceService.changeAttendanceState(meeting.id, 'FINALIZED', secretary);
    const finalizedMtg = governanceService.getMeeting(meeting.id);
    assert(finalizedMtg?.attendanceState === 'FINALIZED', 'Meeting attendance is FINALIZED');

    // Writable checks: modifying finalized meeting throws
    let finalizeErr = '';
    try {
      await governanceService.selfRegister(meeting.id, memberJane);
    } catch (e: any) {
      finalizeErr = e.message;
    }
    assert(finalizeErr.includes('finalized'), 'Finalized meeting is locked from modifications');

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed in refinements and assisted test suite`);
  }
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.includes('test_refinements_and_assisted')) {
  runRefinementsAndAssistedTests();
}
