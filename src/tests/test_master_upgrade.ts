import { dataService } from '../services/dataService';

async function runMasterUpgradeTests() {
  console.log('=== STARTING MOSA MASTER UPGRADE VERIFICATION TEST SUITE ===');
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

  try {
    // 1. Reference ID Generation on Application Submission
    console.log('\n--- 1. Application Submission & Reference ID ---');
    const appRes = await dataService.submitApplication({
      firstName: 'Kato',
      lastName: 'Patrick',
      nickname: 'Patro',
      gender: 'Male',
      dateOfBirth: '1998-05-12',
      phone: '+256772998877',
      email: `kato.patrick.${Date.now()}@example.com`,
      country: 'Uganda',
      city: 'Hoima',
      declarationAccepted: true,
      schoolHistory: {
        attendedOLevel: true,
        oLevel: {
          yearJoined: 2012,
          yearCompleted: 2015,
          campus: 'Main Campus Hoima',
          class: 'Senior 4',
          stream: 'Blue Stream',
        },
        attendedALevel: true,
        aLevel: {
          yearJoined: 2016,
          yearCompleted: 2017,
          campus: 'Main Campus Hoima',
          class: 'Senior 6',
          combination: 'PCM/ICT',
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

    assert(appRes.success === true, 'Application submission returns success');
    assert(!!appRes.id, 'Application returns unique database id');
    assert(!!appRes.referenceId, 'Application returns formatted sequential referenceId');
    assert(
      /^MOSA-\d{4}-\d{5}$/.test(appRes.referenceId || ''),
      `referenceId matches pattern MOSA-YYYY-XXXXX: "${appRes.referenceId}"`
    );

    const appId = appRes.id!;

    // 2. Request Correction Workflow
    console.log('\n--- 2. Request Correction Workflow ---');
    const corrReason = 'Please upload a clearer passport photo and verify S6 year.';
    const corrRes = await dataService.requestCorrection(appId, corrReason, 'admin@massh.ac.ug');
    assert(corrRes.success === true, 'Request correction succeeds');

    const appUnderCorr = await dataService.getApplicationById(appId);
    assert(appUnderCorr?.status === 'NEEDS_CORRECTION', 'Application status updated to NEEDS_CORRECTION');
    assert(appUnderCorr?.correctionReason === corrReason, 'Application stores exact correctionReason');
    assert((appUnderCorr?.correctionHistory?.length || 0) >= 1, 'Application records correction history item');

    // 3. Resubmit Application Workflow
    console.log('\n--- 3. Resubmit Application Workflow ---');
    const resubmitRes = await dataService.resubmitApplication(appId, {
      photoUrl: 'https://images.unsplash.com/photo-example.jpg',
      bio: 'Corrected profile with updated records',
    });
    assert(resubmitRes.success === true, 'Resubmission succeeds');

    const appResubmitted = await dataService.getApplicationById(appId);
    assert(appResubmitted?.status === 'PENDING', 'Application status reset to PENDING after resubmission');
    assert(appResubmitted?.photoUrl === 'https://images.unsplash.com/photo-example.jpg', 'Application data updated');

    // 4. Approval with Manual MA Number Assignment
    console.log('\n--- 4. Manual MA Number Assignment & Anti-Collision ---');
    const manualNumber = 'MA. 0472';
    const approveManualRes = await dataService.approveApplicationAndGenerateMA(
      appId,
      'admin@massh.ac.ug',
      'Verified with Pioneer class records',
      manualNumber
    );
    assert(approveManualRes.success === true, 'Manual MA number approval succeeds');
    assert(approveManualRes.alumniNumber === manualNumber, `Alumnus assigned exact manual number "${manualNumber}"`);

    // Verify it is registered in anti-reuse registry
    const settings = await dataService.getSystemSettings();
    assert(
      settings.usedMANumbersRegistry?.includes(manualNumber) === true,
      'Manual MA number is permanently registered in usedMANumbersRegistry'
    );

    // 5. Anti-Collision Protection: Attempt to reuse the same number
    console.log('\n--- 5. Anti-Collision Protection ---');
    const secondApp = await dataService.submitApplication({
      firstName: 'Jane',
      lastName: 'Akello',
      gender: 'Female',
      dateOfBirth: '2000-01-01',
      phone: '+256701112233',
      email: `jane.akello.${Date.now()}@example.com`,
      country: 'Uganda',
      city: 'Kampala',
      declarationAccepted: true,
      schoolHistory: {
        attendedOLevel: true,
        oLevel: { yearJoined: 2014, yearCompleted: 2017, campus: 'Main Campus Hoima', class: 'S4', stream: 'Red' },
        attendedALevel: false,
      },
      privacySettings: {
        showName: true,
        showNickname: false,
        showProfession: true,
        showOrganisation: true,
        showCountry: true,
        showPhone: false,
        showEmail: false,
      },
    });

    const collisionRes = await dataService.updateAlumniMembershipNumber(
      secondApp.alumniNumber!,
      manualNumber, // Reusing manualNumber!
      'admin@massh.ac.ug',
      'Attempt collision'
    );
    assert(collisionRes.success === false, 'Collision blocked when attempting to reuse MA. 0472');
    assert(
      (collisionRes.error || '').toLowerCase().includes('already assigned') || (collisionRes.error || '').toLowerCase().includes('already registered'),
      `Correct collision error message: "${collisionRes.error}"`
    );

    // Sequential number verified
    const seqRes = await dataService.verifyAlumnusByNumber(secondApp.alumniNumber!);
    assert(seqRes.found === true, 'Sequential assignment succeeds after registration');
    assert(seqRes.alumniNumber !== manualNumber, 'Sequential number differs from manual number');

    // 6. Public Alumni Verification Portal Test
    console.log('\n--- 6. Public Alumni Verification Endpoint ---');
    // Test canonical format "MA. 0001"
    const pubVerify1 = await dataService.verifyAlumnusByNumber('MA. 0001');
    assert(pubVerify1.found === true, 'Found MA. 0001 via public verification');
    assert(pubVerify1.verified === true, 'MA. 0001 verified as ACTIVE');
    assert(!!pubVerify1.fullName, `Full name returned: "${pubVerify1.fullName}"`);
    assert((pubVerify1 as any).phone === undefined, 'Personal phone is NOT exposed in public verification');
    assert((pubVerify1 as any).email === undefined, 'Personal email is NOT exposed in public verification');

    // Test digits-only input "0001"
    const pubVerify2 = await dataService.verifyAlumnusByNumber('0001');
    assert(pubVerify2.found === true, 'Numeric digits "0001" auto-normalized and verified');
    assert(pubVerify2.alumniNumber === 'MA. 0001', 'Normalized correctly to "MA. 0001"');

    // Test nonexistent number
    const pubVerifyNone = await dataService.verifyAlumnusByNumber('MA. 9998');
    assert(pubVerifyNone.found === false, 'Nonexistent alumni number reports not found');

    // 7. Notification Delivery
    console.log('\n--- 7. Notification Delivery ---');
    const notif = await dataService.sendNotification({
      alumniId: 'alumni-0001',
      title: 'Annual General Meeting 2026',
      message: 'You are cordially invited to the 2026 MASSH Grand Convention.',
      type: 'EVENT',
    });
    assert(!!notif.id, 'Notification created with ID');
    assert(notif.isRead === false, 'Notification defaults to unread');

    const notifs = await dataService.getAlumniNotifications('alumni-0001');
    assert(notifs.some(n => n.id === notif.id), 'Notification retrieved in user notification inbox');

  } catch (error) {
    console.error('Fatal error during test run:', error);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterUpgradeTests();
