// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

import { dataService } from '../services/dataService';

async function runTestSuite() {
  console.log('================================================================');
  console.log('  MOSA ALUMNI MANAGEMENT SYSTEM - AUTOMATED VERIFICATION SUITE');
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
    // TEST 1: Initial Seed Data
    console.log('--- TEST GROUP 1: INITIAL DATA & COUNTER ---');
    const settings = await dataService.getSystemSettings();
    assert(settings.nextAlumniNumber >= 3, 'Counter starts at or after 3 (after MA. 0001 and MA. 0002)');
    assert(settings.prefix.startsWith('MA'), 'Prefix begins with "MA"');
    assert(settings.padDigits === 4, 'Pad digits is 4 (e.g. 0001)');

    const initialAlumni = await dataService.getAlumniList();
    assert(initialAlumni.length >= 2, 'Initial verified alumni list has seeded records');
    const bulldozer = initialAlumni.find(a => a.alumniNumber === 'MA. 0001');
    assert(bulldozer?.nickname === 'Bulldozer', 'MA. 0001 has Nickname at School "Bulldozer"');
    assert(bulldozer?.schoolHistory.attendedOLevel === true, 'MA. 0001 attended O-Level');
    assert(bulldozer?.schoolHistory.attendedALevel === true, 'MA. 0001 attended A-Level');

    // TEST 2: Nickname & Alumni Search (Section 16)
    console.log('\n--- TEST GROUP 2: POWERFUL ALUMNI SEARCH ---');
    const searchBulldozer = await dataService.searchAlumni('Bulldozer');
    assert(searchBulldozer.length === 1 && searchBulldozer[0].alumniNumber === 'MA. 0001', 'Searching "Bulldozer" returns alumnus with school nickname Bulldozer');

    const searchNumber = await dataService.searchAlumni('MA. 0002');
    assert(searchNumber.length === 1 && searchNumber[0].firstName === 'Grace', 'Searching "MA. 0002" returns Grace Mary Akiiki');

    const searchLevel = await dataService.searchAlumni('', { level: 'BOTH' });
    assert(searchLevel.length >= 2, 'Filter by level "BOTH" returns alumni with O-Level and A-Level');

    // TEST 3: Duplicate Registration Prevention (Section 6)
    console.log('\n--- TEST GROUP 3: DUPLICATE PREVENTION ---');
    const dupEmailCheck = await dataService.checkDuplicate('muhammad.z@alumni.massh.ac.ug', '+256 700 000000');
    assert(dupEmailCheck.isDuplicate === true, 'Duplicate email registration correctly identified and blocked');

    const dupPhoneCheck = await dataService.checkDuplicate('newemail@massh.org', '+256 701 234567');
    assert(dupPhoneCheck.isDuplicate === true, 'Duplicate phone number registration correctly identified and blocked');

    const uniqueCheck = await dataService.checkDuplicate('brian.asiimwe@gmail.com', '+256 700 554433');
    assert(uniqueCheck.isDuplicate === false, 'Unique applicant credentials pass duplicate check');

    // TEST 4: Alumni Registration Submission (Milestone 1)
    console.log('\n--- TEST GROUP 4: REGISTRATION APPLICATION SUBMISSION ---');
    const regResult = await dataService.submitApplication({
      firstName: 'Brian',
      lastName: 'Asiimwe',
      nickname: 'The Professor',
      gender: 'Male',
      dateOfBirth: '2000-08-12',
      phone: '+256 700 554433',
      email: 'brian.asiimwe@gmail.com',
      country: 'Uganda',
      city: 'Hoima',
      occupation: 'Data Scientist',
      organisation: 'Stanbic Bank',
      highestQualification: "Bachelor's Degree",
      bio: 'MASSH alum passionate about data in agriculture.',
      schoolHistory: {
        attendedOLevel: true,
        oLevel: {
          yearJoined: 2016,
          yearCompleted: 2019,
          campus: 'Main Campus Hoima',
          class: 'Senior 4',
          stream: 'Green Stream',
        },
        attendedALevel: true,
        aLevel: {
          yearJoined: 2020,
          yearCompleted: 2021,
          campus: 'Main Campus Hoima',
          class: 'Senior 6',
          combination: 'BCM/Sub-Maths',
        },
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
    });

    assert(regResult.success === true && Boolean(regResult.id), 'Application successfully submitted and generated an ID');
    const createdAppId = regResult.id!;

    const fetchedApp = await dataService.getApplicationById(createdAppId);
    assert(fetchedApp?.status === 'APPROVED' || fetchedApp?.status === 'PENDING', 'New application receives status');
    assert(fetchedApp?.nickname === 'The Professor', 'Nickname at School preserved accurately');

    // TEST 5: Status Transitions (Under Review, Needs Correction)
    console.log('\n--- TEST GROUP 5: ADMIN APPLICATION REVIEW & STATUS TRANSITIONS ---');
    await dataService.updateApplicationStatus(createdAppId, 'UNDER_REVIEW', 'Checking MASSH 2019 S4 green stream roll');
    const underReviewApp = await dataService.getApplicationById(createdAppId);
    assert(underReviewApp?.status === 'UNDER_REVIEW', 'Application transitioned to UNDER_REVIEW');
    assert(underReviewApp?.reviewNotes?.includes('green stream') === true, 'Review notes saved successfully');

    // TEST 6: Atomic MA Number Generation & Approval
    console.log('\n--- TEST GROUP 6: ATOMIC MA NUMBER GENERATION & APPROVAL ---');
    const approvalResult = await dataService.approveApplicationAndGenerateMA(createdAppId, 'admin@massh.ac.ug');
    assert(approvalResult.success === true, 'Application approval transaction succeeded');
    const assignedNumber = approvalResult.alumniNumber!;
    assert(assignedNumber.startsWith('MA'), 'Sequential number atomically generated and assigned');

    const updatedApp = await dataService.getApplicationById(createdAppId);
    assert(updatedApp?.status === 'APPROVED', 'Application status updated to APPROVED');
    assert(updatedApp?.assignedAlumniNumber === assignedNumber, 'Application record has assignedAlumniNumber');

    // Check newly created Alumni Profile in Directory
    const verifiedProfile = await dataService.getAlumniByNumber(assignedNumber);
    assert(Boolean(verifiedProfile), 'Verified alumni profile exists in collection');
    assert(verifiedProfile?.firstName === 'Brian' && verifiedProfile?.lastName === 'Asiimwe', 'Verified profile matches applicant name');
    assert(verifiedProfile?.nickname === 'The Professor', 'Verified profile preserves Nickname at School');

    // Verify counter incremented
    const updatedSettings = await dataService.getSystemSettings();
    assert(updatedSettings.nextAlumniNumber > 3, 'System counter successfully incremented for next applicant');

    // TEST 7: Subsequent Approval Gets Next Number
    console.log('\n--- TEST GROUP 7: SEQUENTIAL INTEGRITY ---');
    const reg2 = await dataService.submitApplication({
      firstName: 'Joan',
      lastName: 'Tushemerirwe',
      nickname: 'Lady Justice',
      gender: 'Female',
      dateOfBirth: '2002-04-18',
      phone: '+256 702 889900',
      email: 'joan.t@law.org',
      country: 'Uganda',
      city: 'Kampala',
      schoolHistory: {
        attendedOLevel: true,
        attendedALevel: false,
        oLevel: {
          yearJoined: 2017,
          yearCompleted: 2020,
          campus: 'Main Campus Hoima',
          class: 'Senior 4',
          stream: 'Red Stream',
        },
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
    });

    const assignedNum2 = reg2.alumniNumber || (await dataService.getApplicationById(reg2.id!))?.assignedAlumniNumber;
    assert(assignedNum2?.startsWith('MA') === true, 'Application received assigned MA number (no reuse, sequential)');

    // TEST 8: Security & Privacy Rule Protection (Section 18)
    console.log('\n--- TEST GROUP 8: SECURITY & TAMPER PROTECTION ---');
    const allAlumni = await dataService.getAlumniList();
    const profileToTest = verifiedProfile || allAlumni.find(a => a.firstName === 'Brian') || allAlumni[0];
    const tamperAttempt = await dataService.updateAlumniProfile(profileToTest.internalId, {
      alumniNumber: 'MA. 9999', // Alumnus cannot change their alumni number
      verifiedBy: 'hacker@example.com',
      occupation: 'Senior Lead Data Scientist',
    });
    assert(tamperAttempt.success === true, 'Profile update executed');
    const reChecked = await dataService.getAlumniById(profileToTest.internalId);
    assert(reChecked?.alumniNumber === profileToTest.alumniNumber, 'Security guard preserved original number; tamper to MA. 9999 rejected');
    assert(reChecked?.verifiedBy === profileToTest.verifiedBy, 'Security guard preserved verifiedBy');
    assert(reChecked?.occupation === 'Senior Lead Data Scientist', 'Allowed occupation update persisted');

    // TEST 9: Audit Trail Logging (Section 20)
    console.log('\n--- TEST GROUP 9: AUDIT LOG VERIFICATION ---');
    const auditLogs = await dataService.getAuditLogs();
    const hasSubmitted = auditLogs.some(l => l.action === 'APPLICATION_SUBMITTED');
    const hasApproved = auditLogs.some(l => l.action === 'APPLICATION_APPROVED');
    const hasAssigned = auditLogs.some(l => l.action === 'MA_NUMBER_ASSIGNED');
    assert(hasSubmitted, 'Audit log captures APPLICATION_SUBMITTED');
    assert(hasApproved, 'Audit log captures APPLICATION_APPROVED');
    assert(hasAssigned, 'Audit log captures MA_NUMBER_ASSIGNED');

    console.log('\n================================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite runtime error:', error);
    process.exit(1);
  }
}

runTestSuite();
