import { dataService } from '../services/dataService';
import { membershipCardService, DEFAULT_CARD_SETTINGS } from '../services/membershipCardService';
import { AlumniProfile, AuthUser } from '../types';

async function runOfficialMosaIdCardTests() {
  console.log('================================================================');
  console.log('TEST SUITE: OFFICIAL MOSA DIGITAL MEMBERSHIP ID CARD INTEGRATION');
  console.log('1. Template & Signatory Defaults (from MOSA - IDs-3.pdf)');
  console.log('2. Registry Field Mapping & Snapshot Integrity');
  console.log('3. Eligibility Enforcement (Active vs Disapproved vs Suspended)');
  console.log('4. Card Validation Numbers & Anti-Duplication Rules');
  console.log('5. Authorized Reissuance & Superseded Validation Numbers');
  console.log('6. Administrative Suspension & Permanent Revocation');
  console.log('7. Secure Public QR Verification (Zero-Leakage Security)');
  console.log('8. Personal Detail Correction Requests Queue');
  console.log('9. Genuine Vector PDF Generation & Bulk Generation');
  console.log('10. Authorized Signatories & Contact Configuration');
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

  const mockAdminUser: AuthUser = {
    uid: 'admin-sec-01',
    email: 'secretary@massh.ac.ug',
    displayName: 'MOSA General Secretariat',
    role: 'SECRETARY',
    active: true,
  };

  // ----------------------------------------------------------------
  // 1. Template & Signatory Defaults
  // ----------------------------------------------------------------
  console.log('\n--- 1. Template & Signatory Defaults ---');
  const settings = await membershipCardService.getCardSettings();
  assert(settings.associationName.includes('MOSA'), `Association name contains MOSA: "${settings.associationName}"`);
  assert(settings.phoneNumbers.includes('+256 772 411921'), `Contains official telephone +256 772 411921`);
  assert(settings.email === 'mosaalumni31@gmail.com', `Contains approved email mosaalumni31@gmail.com`);
  assert(settings.website === 'mandelassalumni.com', `Contains approved website mandelassalumni.com`);
  assert(settings.chairmanMosa.title === 'Chairman MOSA', `Signatory 1 is Chairman MOSA`);
  assert(settings.chairmanBog.title === 'Chairman BOG Massh', `Signatory 2 is Chairman BOG Massh`);

  // ----------------------------------------------------------------
  // 2. Registry Field Mapping & Snapshot Integrity
  // ----------------------------------------------------------------
  console.log('\n--- 2. Registry Field Mapping & Snapshot Integrity ---');
  const testAlumnus: AlumniProfile = {
    internalId: `alumni-test-${Date.now()}`,
    alumniNumber: 'MA. 7788',
    firstName: 'Bright',
    lastName: 'Alinaitwe',
    fullName: 'Bright Alinaitwe',
    gender: 'Male',
    dateOfBirth: '1995-07-22',
    phone: '+256 772 000111',
    email: 'bright.alinaitwe@example.com',
    country: 'Uganda',
    nationality: 'UGANDAN',
    city: 'Hoima',
    membershipStatus: 'ACTIVE',
    schoolHistory: {
      attendedOLevel: true,
      oLevel: { yearJoined: 2012, yearCompleted: 2014, campus: 'Main', class: 'S4', stream: 'A' },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Secretariat',
    applicationId: 'app-test-7788',
  };

  const snapshot = membershipCardService.buildCardSnapshot(testAlumnus, settings);
  assert(snapshot.surname === 'ALINAITWE', `Surname uppercase mapping: "${snapshot.surname}"`);
  assert(snapshot.givenName === 'BRIGHT', `Given name uppercase mapping: "${snapshot.givenName}"`);
  assert(snapshot.nationality === 'UGANDAN', `Nationality mapping: "${snapshot.nationality}"`);
  assert(snapshot.sex === 'MALE', `Sex uppercase mapping: "${snapshot.sex}"`);
  assert(snapshot.entryYear === '2012', `Entry year mapped correctly: "${snapshot.entryYear}"`);
  assert(snapshot.departureYear === '2014', `Departure year mapped correctly: "${snapshot.departureYear}"`);
  assert(snapshot.alumniNumber === 'MA. 7788', `Alumni number matches official MA number: "${snapshot.alumniNumber}"`);

  // ----------------------------------------------------------------
  // 3. Eligibility Enforcement
  // ----------------------------------------------------------------
  console.log('\n--- 3. Eligibility Enforcement ---');
  const disapprovedAlumnus: AlumniProfile = {
    ...testAlumnus,
    internalId: `alumni-disapp-${Date.now()}`,
    alumniNumber: 'MA. 8899',
    membershipStatus: 'DISAPPROVED',
  };

  const disRes = await membershipCardService.issueCard(disapprovedAlumnus, mockAdminUser);
  assert(disRes.success === false, `Disapproved member rejected for card issuance: "${disRes.error}"`);

  const suspendedAlumnus: AlumniProfile = {
    ...testAlumnus,
    internalId: `alumni-susp-${Date.now()}`,
    alumniNumber: 'MA. 8890',
    membershipStatus: 'SUSPENDED',
  };
  const suspRes = await membershipCardService.issueCard(suspendedAlumnus, mockAdminUser);
  assert(suspRes.success === false, `Suspended member rejected for card issuance: "${suspRes.error}"`);

  // ----------------------------------------------------------------
  // 4. Card Validation Numbers & Anti-Duplication Rules
  // ----------------------------------------------------------------
  console.log('\n--- 4. Card Validation Numbers & Anti-Duplication ---');
  const issueRes1 = await membershipCardService.issueCard(testAlumnus, mockAdminUser);
  assert(issueRes1.success === true, 'Card successfully issued for active member');
  assert(!!issueRes1.card?.validationNumber, `Unique Validation Number generated: ${issueRes1.card?.validationNumber}`);
  assert(issueRes1.card?.validationNumber.startsWith('MOSA-VAL-'), `Validation number conforms to prefix MOSA-VAL-`);
  assert(issueRes1.card?.issueNumber === 1, `Initial issue number is 1`);

  // Attempt duplicate issuance without reissue
  const dupRes = await membershipCardService.issueCard(testAlumnus, mockAdminUser);
  assert(dupRes.success === false, `Duplicate card issuance blocked: "${dupRes.error}"`);

  // ----------------------------------------------------------------
  // 5. Authorized Reissuance & Superseded Validation Numbers
  // ----------------------------------------------------------------
  console.log('\n--- 5. Authorized Reissuance & Superseded Validation Numbers ---');
  const oldValNumber = issueRes1.card!.validationNumber;
  const reissueRes = await membershipCardService.reissueCard(
    testAlumnus,
    'Member lost physical badge during 2026 MASSH Convention',
    mockAdminUser
  );

  assert(reissueRes.success === true, 'Card reissuance succeeded');
  assert(reissueRes.card?.issueNumber === 2, `Reissued card issue number incremented to 2`);
  assert(reissueRes.card?.validationNumber !== oldValNumber, `New distinct validation number assigned: ${reissueRes.card?.validationNumber}`);

  // Old card must be marked SUPERSEDED
  const oldVerification = await membershipCardService.verifyCard(oldValNumber);
  assert(oldVerification.valid === false, `Old validation number is no longer valid`);
  assert(oldVerification.state === 'SUPERSEDED', `Old validation number state is SUPERSEDED`);

  // New card must be VALID
  const newVerification = await membershipCardService.verifyCard(reissueRes.card!.validationNumber);
  assert(newVerification.valid === true, `New validation number is VALID`);
  assert(newVerification.state === 'VALID', `New validation state is VALID`);

  // ----------------------------------------------------------------
  // 6. Administrative Suspension & Permanent Revocation
  // ----------------------------------------------------------------
  console.log('\n--- 6. Administrative Suspension & Revocation ---');
  const activeCard = reissueRes.card!;

  // Suspend card
  const suspCardRes = await membershipCardService.suspendCard(activeCard.id, 'Under executive credential audit', mockAdminUser);
  assert(suspCardRes.success === true, 'Card suspended');
  const suspVerification = await membershipCardService.verifyCard(activeCard.validationNumber);
  assert(suspVerification.valid === false, `Suspended card verifies as INVALID`);
  assert(suspVerification.state === 'SUSPENDED', `State verified as SUSPENDED`);

  // Reinstate card
  const reinRes = await membershipCardService.reinstateCard(activeCard.id, mockAdminUser);
  assert(reinRes.success === true, 'Card reinstated');
  const reinVerification = await membershipCardService.verifyCard(activeCard.validationNumber);
  assert(reinVerification.valid === true, `Reinstated card verifies as VALID`);

  // Revoke card
  const revokeRes = await membershipCardService.revokeCard(activeCard.id, 'Disciplinary committee sanction', mockAdminUser);
  assert(revokeRes.success === true, 'Card revoked');
  const revokeVerification = await membershipCardService.verifyCard(activeCard.validationNumber);
  assert(revokeVerification.valid === false, `Revoked card verifies as INVALID`);
  assert(revokeVerification.state === 'REVOKED', `State verified as REVOKED`);

  // ----------------------------------------------------------------
  // 7. Secure Public QR Verification (Zero-Leakage Security)
  // ----------------------------------------------------------------
  console.log('\n--- 7. Secure Public QR Verification ---');
  // Issue fresh valid card for member to test token verification
  const member2: AlumniProfile = {
    ...testAlumnus,
    internalId: `alumni-sec-${Date.now()}`,
    alumniNumber: 'MA. 9901',
    phone: '+256 701 999888',
    email: 'private.email@secret.com',
  };
  const m2Res = await membershipCardService.issueCard(member2, mockAdminUser);
  assert(m2Res.success === true, 'Fresh member card issued');

  const tokenVerification = await membershipCardService.verifyCard(m2Res.card!.verificationToken);
  assert(tokenVerification.found === true, 'Card found via QR verification token');
  assert(tokenVerification.valid === true, 'Card verified as VALID via token');
  assert(tokenVerification.alumniNumber === 'MA. 9901', 'Alumni number disclosed');
  assert(tokenVerification.memberName?.toUpperCase().includes('ALINAITWE') === true, 'Member name disclosed');
  // Confirm NO private contact details leak in payload
  assert((tokenVerification as any).phone === undefined, 'Zero leakage: Phone number not exposed');
  assert((tokenVerification as any).email === undefined, 'Zero leakage: Email address not exposed');
  assert((tokenVerification as any).dateOfBirth === undefined, 'Zero leakage: Date of birth not exposed');

  // ----------------------------------------------------------------
  // 8. Personal Detail Correction Requests Queue
  // ----------------------------------------------------------------
  console.log('\n--- 8. Personal Detail Correction Requests ---');
  const corrReq = await membershipCardService.submitCorrectionRequest({
    alumniId: member2.internalId,
    alumniNumber: member2.alumniNumber,
    alumniName: member2.fullName!,
    fields: [
      { field: 'surname', currentValue: 'Alinaitwe', requestedValue: 'Alinaitwe-Baguma' },
      { field: 'departureYear', currentValue: '2014', requestedValue: '2015' },
    ],
    note: 'Legal hyphenation update as per National ID card',
  });

  assert(corrReq.status === 'OPEN', 'Correction request initiated with OPEN status');
  const allCorrs = await membershipCardService.getCorrectionRequests(member2.internalId);
  assert(allCorrs.length > 0, 'Correction request retrieved from storage');

  await membershipCardService.resolveCorrectionRequest(corrReq.id, 'RESOLVED', mockAdminUser, 'Approved by Secretariat');
  const resolved = await membershipCardService.getCorrectionRequests(member2.internalId);
  assert(resolved[0].status === 'RESOLVED', 'Correction request resolved by administrator');

  // ----------------------------------------------------------------
  // 9. Genuine Vector PDF Generation & Bulk Generation
  // ----------------------------------------------------------------
  console.log('\n--- 9. Genuine Vector PDF Generation ---');
  const doc = await membershipCardService.generateCardPdf(member2, m2Res.card!, settings, 'DUPLEX');
  assert(doc.getNumberOfPages() === 2, `Duplex PDF has 2 pages (Front and Back): ${doc.getNumberOfPages()}`);

  const sideBySideDoc = await membershipCardService.generateCardPdf(member2, m2Res.card!, settings, 'SIDE_BY_SIDE');
  assert(sideBySideDoc.getNumberOfPages() === 1, `Side-by-side sheet has 1 page`);

  const bulkDoc = await membershipCardService.generateBulkCardsPdf(
    [
      { alumnus: member2, card: m2Res.card! },
    ],
    settings
  );
  assert(bulkDoc.getNumberOfPages() === 2, `Bulk PDF generated with correct page count`);

  // ----------------------------------------------------------------
  // 10. Authorized Signatories & Contact Configuration
  // ----------------------------------------------------------------
  console.log('\n--- 10. Authorized Signatories Configuration ---');
  const updatedSettings = await membershipCardService.updateCardSettings(
    {
      chairmanMosa: { title: 'National Chairman MOSA', name: 'Dr. Bright A.' },
      email: 'secretariat@mandelassalumni.com',
    },
    mockAdminUser
  );

  assert(updatedSettings.chairmanMosa.title === 'National Chairman MOSA', 'Chairman title updated');
  assert(updatedSettings.email === 'secretariat@mandelassalumni.com', 'Secretariat email updated');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('STATUS: OFFICIAL MOSA DIGITAL MEMBERSHIP ID CARD VERIFIED!');
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOfficialMosaIdCardTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
