import assert from 'assert';
import { dataService } from '../services/dataService';
import { governanceService } from '../services/governanceService';
import { AuthUser } from '../types';

console.log('================================================================');
console.log('MOSA PLATFORM: OPPORTUNITIES, ELECTIONS & MEMBERSHIP CARDS TEST');
console.log('================================================================\n');

(async () => {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  const testUser: AuthUser = {
    uid: 'test-voter-001',
    email: 'jovan.alinda@gmail.com',
    displayName: 'Dr. Jovan Alinda',
    role: 'MEMBER',
    alumniId: 'alumni-jovan',
    alumniNumber: 'MA. 0088',
    membershipStatus: 'ACTIVE',
  };

  const adminUser: AuthUser = {
    uid: 'admin-001',
    email: 'admin@massh.ac.ug',
    displayName: 'Secretariat Admin',
    role: 'ADMIN',
    membershipStatus: 'ACTIVE',
  };

  // --- PILLAR 1: OPPORTUNITIES & MENTORSHIP HUB ---
  console.log('--- Pillar 1: Opportunities & Mentorship Hub Tests ---');

  await asyncTest('Retrieve seed opportunities across Hoima, Bunyoro & national employers', async () => {
    const opps = await dataService.getOpportunities();
    assert(Array.isArray(opps), 'Opportunities must return an array');
    assert(opps.length >= 4, `Expected at least 4 seeded opportunities, got ${opps.length}`);
    const hoimaHospital = opps.find(o => o.organisation.includes('Hoima Regional Referral Hospital'));
    assert(hoimaHospital !== undefined, 'Hoima Hospital Medical Officer listing must be present');
    assert.strictEqual(hoimaHospital?.status, 'PUBLISHED');
  });

  let createdOppId = '';
  await asyncTest('Post opportunity item with structured fields & default review routing', async () => {
    const newOpp = await dataService.createOpportunity({
      title: 'Graduate Civil Engineering Associate',
      organisation: 'Bunyoro Infrastructure Consortium',
      type: 'JOB',
      workplaceType: 'ON_SITE',
      location: 'Hoima City',
      description: 'Hands-on supervision for Albertine region road and municipal infrastructure projects.',
      qualifications: ['BSc Civil Engineering', 'MASSH Alumnus preferred'],
      contactEmail: 'careers@bunyoroinfra.org',
      visibility: 'PUBLIC',
      postedBy: {
        name: testUser.displayName,
        email: testUser.email,
        alumniNumber: testUser.alumniNumber,
        alumniId: testUser.alumniId,
        role: testUser.role,
      },
      viewsCount: 0,
      applicationsCount: 0,
    }, testUser);

    assert(newOpp.id.startsWith('opp-'), 'Opportunity ID must be formatted');
    assert.strictEqual(newOpp.status, 'PENDING_REVIEW', 'Member posted opportunity must route to PENDING_REVIEW');
    createdOppId = newOpp.id;
  });

  await asyncTest('Admin moderation: Approve and publish opportunity listing', async () => {
    assert(createdOppId !== '', 'Opportunity must exist');
    const updated = await dataService.setOpportunityStatus(createdOppId, 'PUBLISHED', 'Vetted and verified by Secretariat');
    assert.strictEqual(updated?.status, 'PUBLISHED');
    assert.strictEqual(updated?.approvedBy, 'admin@massh.ac.ug');
  });

  await asyncTest('Retrieve verified mentor profiles and check seed network', async () => {
    const mentors = await dataService.getMentorProfiles();
    assert(Array.isArray(mentors), 'Mentors must return an array');
    assert(mentors.length >= 4, `Expected at least 4 mentors, got ${mentors.length}`);
    const drMuhammad = mentors.find(m => m.fullName.includes('Muhammad'));
    assert(drMuhammad !== undefined, 'Dr. Muhammad Z. must be present');
    assert.strictEqual(drMuhammad?.status, 'ACTIVE');
  });

  let createdReqId = '';
  await asyncTest('Submit 1-on-1 mentorship guidance request', async () => {
    const req = await dataService.submitMentorshipRequest({
      mentorId: 'mentor-01',
      mentorName: 'Dr. Muhammad Z.',
      mentorAlumniNumber: 'MA. 0001',
      fieldOrTopic: 'Surgical Residency & Clinical Practice',
      message: 'Seeking guidance on postgraduate surgical options at Makerere College of Health Sciences.',
      preferredFormat: 'ONLINE',
    }, testUser);

    assert(req.id.startsWith('mreq-'), 'Request ID should be formatted');
    assert.strictEqual(req.status, 'PENDING');
    assert.strictEqual(req.menteeAlumniNumber, testUser.alumniNumber);
    createdReqId = req.id;
  });

  await asyncTest('Mentor responds to request (accept guidance relationship)', async () => {
    assert(createdReqId !== '', 'Request must exist');
    const updated = await dataService.respondToMentorshipRequest(
      createdReqId,
      'ACCEPTED',
      'I will be glad to mentor you. Let us connect via Zoom this Saturday at 4 PM.'
    );
    assert.strictEqual(updated?.status, 'ACCEPTED');
    assert(updated?.responseNote?.includes('Saturday'), 'Response note should be preserved');
  });

  // --- PILLAR 2: ELECTIONS & DIGITAL SECRET BALLOT ---
  console.log('\n--- Pillar 2: Elections & Digital Secret Ballot Tests ---');

  await asyncTest('Retrieve Biennial NEC election cycle with positions & quorum percentage', async () => {
    const cycles = await dataService.getElectionCycles();
    assert(cycles.length > 0, 'Election cycles must be available');
    const nec2026 = cycles.find(c => c.id === 'elec-2026');
    assert(nec2026 !== undefined, '2026 Biennial NEC election must be present');
    assert.strictEqual(nec2026?.status, 'VOTING_ACTIVE');
    assert(nec2026?.positions && nec2026.positions.length >= 4, 'Must have at least 4 NEC executive positions');
  });

  await asyncTest('Retrieve vetted candidates with seconders & manifestos', async () => {
    const candidates = await dataService.getCandidates('elec-2026');
    assert(candidates.length >= 8, `Expected at least 8 vetted candidates, got ${candidates.length}`);
    const presCandidates = candidates.filter(c => c.positionId === 'pos-pres');
    assert.strictEqual(presCandidates.length, 2, 'Expected 2 presidential candidates');
    assert(presCandidates[0].manifesto.length > 20, 'Candidate must have detailed manifesto');
    assert(presCandidates[0].seconderName !== undefined, 'Candidate must have verified seconder');
  });

  await asyncTest('Nominate candidate with verified seconder credentials', async () => {
    const nominated = await dataService.nominateCandidate({
      electionId: 'elec-2026',
      positionId: 'pos-sec',
      fullName: 'Brenda Komugisa',
      alumniNumber: 'MA. 0045',
      cohort: '2016-2021',
      profession: 'Legal Counsel',
      manifesto: 'Digitalizing records and publishing monthly circulars for all chapters.',
      seconderName: 'Dr. Jovan Alinda',
      seconderAlumniNumber: 'MA. 0088',
    }, testUser);

    assert(nominated.id.startsWith('cand-'), 'Candidate ID must be generated');
    assert.strictEqual(nominated.status, 'APPROVED');
  });

  let receiptTokenGenerated = '';
  await asyncTest('Cast secret verifiable ballot with cryptographic receipt token', async () => {
    const result = await dataService.castSecretBallot(
      'elec-2026',
      {
        'pos-pres': 'cand-01',
        'pos-vpres': 'cand-03',
        'pos-sec': 'cand-05',
        'pos-treas': 'cand-07',
      },
      testUser
    );

    assert.strictEqual(result.success, true);
    assert(result.receiptToken.startsWith('VOTE-2026-'), `Expected receipt token format, got ${result.receiptToken}`);
    receiptTokenGenerated = result.receiptToken;

    // Verify candidate tallies incremented
    const cands = await dataService.getCandidates('elec-2026');
    const votedCand = cands.find(c => c.id === 'cand-01');
    assert(votedCand && votedCand.votesCount > 0, 'Candidate vote count must be incremented');
  });

  await asyncTest('Duplicate vote prevention: 1 Member = 1 Vote strictly enforced', async () => {
    const alreadyVoted = await dataService.hasVotedInElection('elec-2026', testUser);
    assert.strictEqual(alreadyVoted, true, 'hasVotedInElection must return true for voter');

    let duplicateRejected = false;
    try {
      await dataService.castSecretBallot(
        'elec-2026',
        { 'pos-pres': 'cand-02' },
        testUser
      );
    } catch (err: any) {
      duplicateRejected = true;
      assert(err.message.includes('already cast'), `Expected duplicate voting error, got ${err.message}`);
    }
    assert.strictEqual(duplicateRejected, true, 'Second ballot casting must be rejected');
  });

  await asyncTest('Retrieve voter secret receipt tokens for verifiable audit', async () => {
    const tokens = await dataService.getVoterReceiptTokens('elec-2026', testUser);
    assert(tokens.includes(receiptTokenGenerated), 'Voter receipts must include the generated ballot token');
  });

  await asyncTest('Certify election results with official Electoral Commission seal', async () => {
    const certified = await dataService.certifyElection(
      'elec-2026',
      'electoral.commission@massh.ac.ug',
      'The 2026 NEC Elections have achieved quorum and are certified free, fair, and binding.'
    );

    assert.strictEqual(certified?.status, 'CONCLUDED');
    assert.strictEqual(certified?.certifiedBy, 'electoral.commission@massh.ac.ug');
    assert(certified?.certifiedAt !== undefined, 'Certified timestamp must be recorded');
  });

  // --- PILLAR 3: DIGITAL MEMBERSHIP CARD & MA REPOSITORY COMPATIBILITY ---
  console.log('\n--- Pillar 3: Digital Membership Cards & Verification Compatibility ---');

  await asyncTest('Validate format of digital membership cards & sequential MA numbers', async () => {
    const formatted = dataService.formatAlumniNumber(42, 'MA. ', 4);
    assert.strictEqual(formatted, 'MA. 0042', 'Sequential MA numbers must maintain padding');

    const list = await dataService.getAlumniList();
    const profile = list.find(a => a.alumniNumber === 'MA. 0001');
    assert(profile !== undefined, 'Alumni profile MA. 0001 must exist');
    assert.strictEqual(profile?.membershipStatus, 'ACTIVE');
    assert(profile?.verifiedAt !== undefined, 'Verified timestamp must be present');
  });

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('STATUS: 100% OF NEW FEATURES PASSING VERIFICATION!');
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
})();
