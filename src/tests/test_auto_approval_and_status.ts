import { dataService } from '../services/dataService';
import { AlumniApplication } from '../types';

async function runAutoApprovalAndStatusTests() {
  console.log('================================================================');
  console.log('TEST SUITE: MOSA REVISED REQUIREMENTS');
  console.log('1. Auto-Approval on Registration');
  console.log('2. Auto Membership Number Generation (MA.-XXXX)');
  console.log('3. Predefined Prefix Configuration');
  console.log('4. Manual Number Assignment by Admin');
  console.log('5. Admin Disapproval / Rejection with Reason');
  console.log('6. Member Status Lifecycle (Active, Disapproved, Suspended)');
  console.log('7. Audit Trail Integrity & Verification');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Verify Default System Settings (Predefined Prefix)
  const settings = await dataService.getSystemSettings();
  assert(settings.prefix === 'MA.-', `Predefined prefix is 'MA.-' (current: ${settings.prefix})`);
  assert(settings.autoApproveRegistrations === true, `Auto-approval flag is enabled by default`);

  // 2. Submit New Registration & Test Automatic Approval + Number Assignment
  const testReg: Omit<AlumniApplication, 'id' | 'status' | 'submittedAt'> = {
    firstName: 'Godfrey',
    lastName: 'Baguma',
    nickname: 'Capo',
    email: `godfrey.baguma.${Date.now()}@example.com`,
    phone: '+256 701 445566',
    dateOfBirth: '1998-04-12',
    gender: 'MALE',
    country: 'Uganda',
    city: 'Hoima',
    currentOccupation: 'Civil Engineer',
    currentEmployer: 'UNRA',
    schoolHistory: {
      attendedOLevel: true,
      oLevel: { yearJoined: 2011, yearCompleted: 2014 },
      attendedALevel: true,
      aLevel: { yearJoined: 2015, yearCompleted: 2016, combination: 'PCM' }
    },
    consentToShareContact: true,
    verificationDocuments: ['id_card.png']
  };

  const regResult = await dataService.submitApplication(testReg);
  assert(regResult.success === true, 'Registration submission succeeded');
  assert(!!regResult.alumniNumber, `Auto-generated membership number returned: ${regResult.alumniNumber}`);
  assert(regResult.alumniNumber.startsWith('MA.-'), `Assigned number conforms to predefined prefix 'MA.-'`);
  assert(!!regResult.alumnus, 'Auto-created alumni profile returned');
  assert(regResult.alumnus?.membershipStatus === 'ACTIVE', 'Member status is automatically ACTIVE upon registration');
  assert(regResult.alumnus?.fullName === 'Godfrey Baguma', 'Alumnus name matches registration');

  const generatedNum = regResult.alumniNumber;

  // 3. Test Public Verification of the Auto-Approved Alumnus
  const verifyActive = await dataService.verifyAlumnusByNumber(generatedNum);
  assert(verifyActive.found === true, `Verification found member by ${generatedNum}`);
  assert(verifyActive.isValidMember === true, 'Member is verified as valid and active');
  assert(verifyActive.alumnus?.nickname === 'Capo', 'Verified alumnus nickname matches');

  // 4. Test Manual Membership Number Change by Admin
  const newManualNumber = `MA.-${Math.floor(1000 + Math.random() * 9000)}`;
  const numChangeReason = 'Legacy registry harmonization for 2014 O-Level roll.';
  const adminEmail = 'admin@mandela.sc.ug';

  const changeNumResult = await dataService.updateAlumniMembershipNumber(
    generatedNum,
    newManualNumber,
    adminEmail,
    numChangeReason
  );
  assert(changeNumResult.success === true, `Admin successfully updated membership number to ${newManualNumber}`);
  assert(changeNumResult.alumnus?.alumniNumber === newManualNumber, 'Alumnus object has updated alumniNumber');
  assert(
    (changeNumResult.alumnus?.numberChangeHistory?.length || 0) >= 1,
    'numberChangeHistory has recorded the update'
  );
  const numHist = changeNumResult.alumnus?.numberChangeHistory?.[0];
  assert(numHist?.previousNumber === generatedNum, `Audit history records previousNumber: ${numHist?.previousNumber}`);
  assert(numHist?.newNumber === newManualNumber, `Audit history records newNumber: ${numHist?.newNumber}`);
  assert(numHist?.reason === numChangeReason, `Audit history records reason: ${numHist?.reason}`);
  assert(numHist?.changedBy === adminEmail, `Audit history records changedBy: ${numHist?.changedBy}`);

  // 5. Test Anti-Collision on Duplicate Number Assignment
  const collisionAttempt = await dataService.updateAlumniMembershipNumber(
    newManualNumber,
    'MA.-0001', // already used
    adminEmail,
    'Trying to assign existing number'
  );
  assert(collisionAttempt.success === false, 'Duplicate membership number was rejected by anti-collision guard');

  // 6. Test Admin Disapproval with Mandatory Reason
  const disapprovalReason = 'Academic transcripts from 2014 could not be verified by the school registrar.';
  const disapproveResult = await dataService.disapproveAlumnus(
    newManualNumber,
    disapprovalReason,
    adminEmail
  );
  assert(disapproveResult.success === true, 'Admin successfully disapproved alumnus');
  assert(disapproveResult.alumnus?.membershipStatus === 'DISAPPROVED', 'Member status changed to DISAPPROVED');
  assert(disapproveResult.alumnus?.disapprovalReason === disapprovalReason, 'Member disapprovalReason is stored');
  assert(
    (disapproveResult.alumnus?.statusHistory?.length || 0) >= 1,
    'statusHistory has recorded the disapproval action'
  );
  const statHist = disapproveResult.alumnus?.statusHistory?.find(s => s.status === 'DISAPPROVED');
  assert(statHist?.reason === disapprovalReason, 'Status audit history contains disapproval reason');
  assert(statHist?.changedBy === adminEmail, 'Status audit history contains admin email');

  // 7. Test Public Verification of Disapproved Member
  const verifyDisapproved = await dataService.verifyAlumnusByNumber(newManualNumber);
  assert(verifyDisapproved.found === true, 'Member found during verification search');
  assert(verifyDisapproved.isValidMember === false, 'Disapproved member is NOT marked as a valid member');
  assert(
    verifyDisapproved.message?.toLowerCase().includes('disapproved') ||
    verifyDisapproved.alumnus?.disapprovalReason === disapprovalReason,
    'Verification message or object reflects disapproval reason'
  );

  // 8. Test Status Change to SUSPENDED and Reactivation to ACTIVE
  const suspendResult = await dataService.updateMemberStatus(
    newManualNumber,
    'SUSPENDED',
    adminEmail,
    'Temporary administrative review pending document re-submission.'
  );
  assert(suspendResult.success === true, 'Member successfully placed on SUSPENDED status');
  assert(suspendResult.alumnus?.membershipStatus === 'SUSPENDED', 'Member status is SUSPENDED');

  const reactivateResult = await dataService.updateMemberStatus(
    newManualNumber,
    'ACTIVE',
    adminEmail,
    'Reinstated after verification of physical UNEB pass slip.'
  );
  assert(reactivateResult.success === true, 'Member successfully reactivated to ACTIVE');
  assert(reactivateResult.alumnus?.membershipStatus === 'ACTIVE', 'Member status is back to ACTIVE');
  assert(reactivateResult.alumnus?.disapprovalReason === undefined, 'Disapproval reason cleared upon reactivation');

  // 9. Verify System Audit Logs
  const auditLogs = await dataService.getAuditLogs();
  const hasAutoApproveLog = auditLogs.some(l => l.action === 'AUTO_MEMBERSHIP_APPROVED');
  const hasNumChangeLog = auditLogs.some(l => l.action === 'MEMBERSHIP_NUMBER_CHANGED');
  const hasDisapprovedLog = auditLogs.some(l => l.action === 'MEMBER_DISAPPROVED');
  const hasStatusChangeLog = auditLogs.some(l => l.action === 'MEMBER_STATUS_CHANGED');

  assert(hasAutoApproveLog, 'Audit trail contains AUTO_MEMBERSHIP_APPROVED log');
  assert(hasNumChangeLog, 'Audit trail contains MEMBERSHIP_NUMBER_CHANGED log with previous & new numbers');
  assert(hasDisapprovedLog, 'Audit trail contains MEMBER_DISAPPROVED log with reason');
  assert(hasStatusChangeLog, 'Audit trail contains MEMBER_STATUS_CHANGED log');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAutoApprovalAndStatusTests().catch(err => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
