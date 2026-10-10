// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

import { dataService } from '../services/dataService';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('  MOSA ALUMNI SYSTEM - PHASE 3 CHAPTERS VERIFICATION SUITE');
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
    // TEST 1: Initial Seed Chapters
    console.log('--- TEST GROUP 1: INITIAL CHAPTERS (SECTION 11) ---');
    const chapters = await dataService.getChapters();
    assert(chapters.length >= 5, 'System has initial university chapters');
    const mumasa = chapters.find(c => c.code === 'MUMASA');
    assert(Boolean(mumasa), 'MUMASA (Makerere University) exists');
    assert(mumasa?.institution === 'Makerere University', 'MUMASA institution is Makerere University');
    assert(mumasa?.status === 'ACTIVE', 'MUMASA is ACTIVE');

    const kyumasa = chapters.find(c => c.code === 'KYUMASA');
    assert(Boolean(kyumasa), 'KYUMASA (Kyambogo University) exists');

    const mbumasa = chapters.find(c => c.code === 'MBUMASA');
    assert(Boolean(mbumasa), 'MBUMASA (Mbarara University MUST) exists');

    // TEST 2: Dynamic Chapter Creation (Not Hard-coded)
    console.log('\n--- TEST GROUP 2: DYNAMIC CHAPTER CREATION ---');
    const createRes = await dataService.createChapter({
      code: 'UCUMASA',
      name: 'Uganda Christian University Mandela Old Students Association',
      institution: 'Uganda Christian University (UCU)',
      location: 'Mukono',
      country: 'Uganda',
      status: 'ACTIVE',
      description: 'Connecting MASSH alumni studying law, theology, and mass communication at UCU Mukono.',
      adminEmails: ['admin@massh.ac.ug'],
      leaderName: 'Mercy Atugonza',
      leaderContact: '+256 705 998877',
    }, 'admin@massh.ac.ug');

    assert(createRes.success === true && Boolean(createRes.id), 'Admin successfully created new chapter (UCUMASA)');
    const createdChapter = await dataService.getChapterById(createRes.id!);
    assert(createdChapter?.code === 'UCUMASA', 'Created chapter code is UCUMASA');
    assert(createdChapter?.location === 'Mukono', 'Location is Mukono');

    // TEST 3: Chapter Details Update & Status Toggle
    console.log('\n--- TEST GROUP 3: CHAPTER UPDATES & STATUS TOGGLE ---');
    await dataService.updateChapter(createRes.id!, {
      leaderName: 'Mercy Atugonza (President)',
      description: 'Updated mission: Promoting alumni excellence and legal aid mentorship.',
    }, 'admin@massh.ac.ug');
    const updatedChapter = await dataService.getChapterById(createRes.id!);
    assert(updatedChapter?.leaderName === 'Mercy Atugonza (President)', 'Chapter coordinator name updated');

    await dataService.toggleChapterStatus(createRes.id!, 'INACTIVE', 'admin@massh.ac.ug');
    const inactiveChap = await dataService.getChapterById(createRes.id!);
    assert(inactiveChap?.status === 'INACTIVE', 'Chapter status successfully set to INACTIVE');

    await dataService.toggleChapterStatus(createRes.id!, 'ACTIVE', 'admin@massh.ac.ug');
    const activeAgain = await dataService.getChapterById(createRes.id!);
    assert(activeAgain?.status === 'ACTIVE', 'Chapter status restored to ACTIVE');

    // TEST 4: Verified Alumnus Joining a Chapter (Section 11)
    console.log('\n--- TEST GROUP 4: CHAPTER MEMBERSHIP JOINING ---');
    const alumniList = await dataService.getAlumniList();
    const testAlumnus = alumniList.find(a => a.alumniNumber === 'MA. 0001');
    assert(Boolean(testAlumnus), 'Verified alumnus MA. 0001 found');

    // Join UCUMASA
    const joinRes = await dataService.joinChapter(createRes.id!, testAlumnus!);
    assert(joinRes.success === true, 'Alumnus MA. 0001 successfully joined UCUMASA');

    const ucuMembers = await dataService.getChapterMembers(createRes.id!);
    assert(ucuMembers.length === 1, 'Chapter member roster updated to 1');
    assert(ucuMembers[0].alumniNumber === 'MA. 0001', 'Member record contains permanent MA. 0001 number');

    const ucuUpdated = await dataService.getChapterById(createRes.id!);
    assert(ucuUpdated?.memberCount === 1, 'Chapter memberCount field synchronized to 1');

    // TEST 5: Duplicate Membership Guard
    console.log('\n--- TEST GROUP 5: DUPLICATE MEMBERSHIP GUARD ---');
    const duplicateJoin = await dataService.joinChapter(createRes.id!, testAlumnus!);
    assert(duplicateJoin.success === false, 'Joining the same chapter twice is blocked with error');

    // TEST 6: Alumnus Belongs to Multiple Chapters Without Losing MOSA Membership
    console.log('\n--- TEST GROUP 6: MULTI-CHAPTER BELONGING ---');
    const myChapters = await dataService.getAlumnusChapters(testAlumnus!.internalId);
    assert(myChapters.length >= 2, 'Alumnus belongs to multiple university chapters simultaneously');
    assert(testAlumnus?.membershipStatus === 'ACTIVE', 'Overall MOSA membership remains ACTIVE');

    // TEST 7: Alumnus Leaving Chapter
    console.log('\n--- TEST GROUP 7: LEAVING A CHAPTER ---');
    const leaveRes = await dataService.leaveChapter(createRes.id!, testAlumnus!.internalId, testAlumnus!.email);
    assert(leaveRes.success === true, 'Alumnus successfully left the chapter');
    const ucuMembersAfter = await dataService.getChapterMembers(createRes.id!);
    assert(ucuMembersAfter.length === 0, 'Active member count in chapter roster is now 0');

    // TEST 8: Assign Chapter Administrator & Role Elevation (Section 10)
    console.log('\n--- TEST GROUP 8: CHAPTER ADMINISTRATOR DELEGATION ---');
    const assignRes = await dataService.assignChapterAdmin(createRes.id!, 'muhammad.z@alumni.massh.ac.ug', 'admin@massh.ac.ug');
    assert(assignRes.success === true, 'Admin successfully assigned chapter administrator');
    const chapWithAdmin = await dataService.getChapterById(createRes.id!);
    assert(chapWithAdmin?.adminEmails.includes('muhammad.z@alumni.massh.ac.ug') === true, 'Chapter record has new admin email in adminEmails array');

    // TEST 9: Audit Trail for Chapter Actions
    console.log('\n--- TEST GROUP 9: AUDIT TRAIL VERIFICATION ---');
    const auditLogs = await dataService.getAuditLogs();
    assert(auditLogs.some(l => l.action === 'CHAPTER_CREATED'), 'Audit log contains CHAPTER_CREATED');
    assert(auditLogs.some(l => l.action === 'CHAPTER_UPDATED'), 'Audit log contains CHAPTER_UPDATED');
    assert(auditLogs.some(l => l.action === 'CHAPTER_MEMBER_JOINED'), 'Audit log contains CHAPTER_MEMBER_JOINED');
    assert(auditLogs.some(l => l.action === 'CHAPTER_ADMIN_ASSIGNED'), 'Audit log contains CHAPTER_ADMIN_ASSIGNED');

    console.log('\n================================================================');
    console.log(`  PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Phase 3 test suite error:', error);
    process.exit(1);
  }
}

runPhase3Tests();
