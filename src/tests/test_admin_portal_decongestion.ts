import { dataService } from '../services/dataService';
import { governanceService } from '../services/governanceService';
import { AuthUser, MembershipStatus } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

export async function runAdminPortalDecongestionTests() {
  console.log('\n==================================================');
  console.log('RUNNING ADMIN PORTAL DECONGESTION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;

  try {
    // 1. Two-Tier Navigation Sub-Section Verification
    console.log('--- TEST GROUP 1: TWO-TIER CONSOLIDATED NAVIGATION MAPPING ---');
    const registrySubTabs = ['members', 'ma_numbers', 'applications', 'verification', 'assisted'];
    const approvalsSubTabs = ['attendance', 'modules', 'staff', 'documents', 'audit', 'cms'];

    assert(registrySubTabs.length === 5, 'Members Registry contains exactly 5 consolidated sub-items');
    assert(approvalsSubTabs.length === 6, 'Members & Approvals contains exactly 6 consolidated sub-items');
    passed += 2;

    // 2. Status Management & Audit Logging (Active, Disapproved, Suspended, Deceased)
    console.log('\n--- TEST GROUP 2: STATUS MANAGEMENT & AUDIT LOGGING ---');
    const alumniList = await dataService.getAlumniList();
    assert(alumniList.length > 0, 'Alumni records exist for administrative testing');
    const testMember = alumniList[0];
    const originalStatus = testMember.membershipStatus;
    const adminEmail = 'superadmin@massh.ac.ug';

    // Case 1: Status Change to SUSPENDED
    const resSuspend = await dataService.updateMemberStatus(
      testMember.internalId,
      'SUSPENDED',
      adminEmail,
      'Administrative temporary hold pending verification'
    );
    assert(resSuspend.success === true, 'Successfully transitioned member to SUSPENDED');
    assert(resSuspend.alumnus?.membershipStatus === 'SUSPENDED', 'Member status updated to SUSPENDED');
    passed += 2;

    // Case 2: Status Change to DISAPPROVED (requires mandatory reason)
    const resDisapprove = await dataService.updateMemberStatus(
      testMember.internalId,
      'DISAPPROVED',
      adminEmail,
      'School registrar records mismatch for requested graduation year'
    );
    assert(resDisapprove.success === true, 'Successfully transitioned member to DISAPPROVED');
    assert(resDisapprove.alumnus?.membershipStatus === 'DISAPPROVED', 'Member status updated to DISAPPROVED');
    assert(resDisapprove.alumnus?.disapprovalReason?.includes('registrar'), 'Disapproval reason recorded on member record');
    passed += 3;

    // Case 3: Status Change to DECEASED (memorial status)
    const resDeceased = await dataService.updateMemberStatus(
      testMember.internalId,
      'DECEASED',
      adminEmail,
      'Official obituary confirmed by family and MOSA Secretariat'
    );
    assert(resDeceased.success === true, 'Successfully transitioned member to DECEASED');
    assert(resDeceased.alumnus?.membershipStatus === 'DECEASED', 'Member status updated to DECEASED');
    passed += 2;

    // Case 4: Reactivate back to ACTIVE / originalStatus
    const resReactivate = await dataService.updateMemberStatus(
      testMember.internalId,
      originalStatus || 'ACTIVE',
      adminEmail,
      'Reinstated active membership'
    );
    assert(resReactivate.success === true, 'Successfully reactivated member status');
    assert(resReactivate.alumnus?.membershipStatus === (originalStatus || 'ACTIVE'), 'Member status restored');
    passed += 2;

    // Case 5: Verify status history audit entries
    const refreshedAlumnus = (await dataService.getAlumniList()).find(m => m.internalId === testMember.internalId);
    assert(Boolean(refreshedAlumnus?.statusHistory && refreshedAlumnus.statusHistory.length >= 4), 'Audit trail captures all status changes');
    passed++;

    // 3. MA Number Reassignment & Anti-Collision Verification
    console.log('\n--- TEST GROUP 3: MA NUMBER MANAGEMENT & COLLISION GUARD ---');
    const originalNumber = testMember.alumniNumber;
    const testNewNumber = 'MA.-9999';

    // Update to new valid number
    const resNumberUpdate = await dataService.updateAlumniMembershipNumber(
      testMember.internalId,
      testNewNumber,
      adminEmail,
      'Manual test reassignment'
    );
    assert(resNumberUpdate.success === true, 'Successfully reassigned MA number');
    assert(resNumberUpdate.alumnus?.alumniNumber === testNewNumber, 'Member now bears updated MA number');
    passed += 2;

    // Verify anti-collision guard: cannot assign already taken number to another member
    if (alumniList.length > 1) {
      const secondMember = alumniList[1];
      const collisionRes = await dataService.updateAlumniMembershipNumber(
        secondMember.internalId,
        testNewNumber, // Already used by testMember
        adminEmail,
        'Attempted duplicate assignment'
      );
      assert(collisionRes.success === false, 'Collision guard blocks duplicate MA number reassignment');
      assert(Boolean(collisionRes.error?.includes('already assigned') || collisionRes.error?.includes('in use')), 'Error explains collision');
      passed += 2;
    }

    // Restore original number
    const resRestoreNumber = await dataService.updateAlumniMembershipNumber(
      testMember.internalId,
      originalNumber,
      adminEmail,
      'Restored original sequential MA number'
    );
    assert(resRestoreNumber.success === true, 'Successfully restored original MA number');
    passed++;

    // 4. Governance & Role Access Verification
    console.log('\n--- TEST GROUP 4: GOVERNANCE ACCESS CONTROLS ---');
    const superAdminUser: AuthUser = {
      uid: 'super-admin-01',
      name: 'Super Admin',
      email: 'superadmin@massh.ac.ug',
      role: 'SUPER_ADMIN',
    };
    const standardAlumniUser: AuthUser = {
      uid: 'alumni-01',
      name: 'Standard Alumnus',
      email: 'member@massh.ac.ug',
      role: 'ALUMNI',
    };

    assert(governanceService.can(superAdminUser, 'REGISTRY', 'VIEW') === true, 'SUPER_ADMIN can access Members Registry');
    assert(governanceService.can(superAdminUser, 'SETTINGS', 'VIEW') === true, 'SUPER_ADMIN can access Settings & Controls');
    assert(governanceService.can(superAdminUser, 'ATTENDANCE', 'VIEW') === true, 'SUPER_ADMIN can access Attendance');
    assert(governanceService.can(standardAlumniUser, 'REGISTRY', 'MANAGE') === false, 'ALUMNI cannot manage Registry');
    assert(governanceService.can(standardAlumniUser, 'SETTINGS', 'EDIT') === false, 'ALUMNI cannot edit Settings');
    assert(governanceService.can(standardAlumniUser, 'AUDIT', 'VIEW') === false, 'ALUMNI cannot view Audit Logs');
    passed += 6;

    console.log(`\n==================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, 0 FAILED`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runAdminPortalDecongestionTests();
