import assert from 'assert';
import { isRegisteredAlumni, isStaffRole } from '../services/governanceService';
import { dataService } from '../services/dataService';
import { AuthUser } from '../types';

export async function runAlumniRegistrationAccessGateTests() {
  console.log('--- Testing Alumni Registration Access Gate & Notifications Privacy ---');

  // 1. Verification of isRegisteredAlumni logic
  const guestUser = null;
  assert.strictEqual(
    isRegisteredAlumni(guestUser), 
    false, 
    'Unauthenticated guest must NOT be considered a registered alumnus'
  );

  const unregisteredAccountUser: AuthUser = {
    uid: 'user-new-001',
    email: 'newuser@example.com',
    role: 'USER',
    displayName: 'New Visitor',
  };
  assert.strictEqual(
    isRegisteredAlumni(unregisteredAccountUser), 
    false, 
    'Account holder with role USER and no alumni number must NOT be considered a registered alumnus'
  );

  const registeredAlumnus: AuthUser = {
    uid: 'user-alumni-001',
    email: 'alumnus@example.com',
    role: 'ALUMNI',
    displayName: 'Verified Alumnus',
    alumniId: 'alumni-0001',
    alumniNumber: 'MA. 0001',
  };
  assert.strictEqual(
    isRegisteredAlumni(registeredAlumnus), 
    true, 
    'Member with role ALUMNI and alumniNumber must be considered a registered alumnus'
  );

  const adminUser: AuthUser = {
    uid: 'admin-001',
    email: 'admin@massh.ac.ug',
    role: 'ADMIN',
    displayName: 'System Admin',
  };
  assert.strictEqual(
    isRegisteredAlumni(adminUser), 
    true, 
    'Admin user must have authorized access'
  );

  const secretaryUser: AuthUser = {
    uid: 'sec-001',
    email: 'secretary@massh.ac.ug',
    role: 'SECRETARY',
    displayName: 'Secretary General',
  };
  assert.strictEqual(
    isRegisteredAlumni(secretaryUser), 
    true, 
    'Secretariat staff must have authorized access'
  );

  // 2. Notification Center Privacy Verification
  console.log('Testing notification isolation for unregistered users...');
  
  // Unregistered / empty id must receive empty notification list
  const emptyNotifs = await dataService.getAlumniNotifications('');
  assert.strictEqual(
    emptyNotifs.length, 
    0, 
    'Empty or unauthenticated alumni ID must receive zero notifications'
  );

  const guestNotifs = await dataService.getAlumniNotifications('guest');
  assert.strictEqual(
    guestNotifs.length, 
    0, 
    'Guest query must receive zero notifications'
  );

  // Registered alumnus gets their notifications
  const registeredNotifs = await dataService.getAlumniNotifications('alumni-0001');
  assert(
    Array.isArray(registeredNotifs),
    'Registered alumnus receives notifications array'
  );

  // 3. Testing isUserRegisteredAlumni in dataService
  assert.strictEqual(
    dataService.isUserRegisteredAlumni(null), 
    false, 
    'dataService.isUserRegisteredAlumni correctly returns false for null user'
  );
  assert.strictEqual(
    dataService.isUserRegisteredAlumni(unregisteredAccountUser), 
    false, 
    'dataService.isUserRegisteredAlumni correctly returns false for unregistered account user'
  );
  assert.strictEqual(
    dataService.isUserRegisteredAlumni(registeredAlumnus), 
    true, 
    'dataService.isUserRegisteredAlumni correctly returns true for registered alumnus'
  );

  console.log('✅ ALL Alumni Registration Access Gate tests PASSED successfully!');
}

if (typeof require !== 'undefined' && require.main === module) {
  runAlumniRegistrationAccessGateTests()
    .then(() => console.log('All gate checks validated.'))
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
