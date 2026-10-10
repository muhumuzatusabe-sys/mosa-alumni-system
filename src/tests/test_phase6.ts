// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

import { dataService } from '../services/dataService';

async function runPhase6Tests() {
  console.log('================================================================');
  console.log('  MOSA ALUMNI SYSTEM - PHASE 6 COMMUNICATIONS VERIFICATION');
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
    // TEST 1: Initial Announcements Retrieval
    console.log('--- TEST GROUP 1: INITIAL ANNOUNCEMENTS RETRIEVAL ---');
    const announcements = await dataService.getAnnouncements();
    assert(announcements.length >= 4, 'System initializes with at least 4 seed announcements');

    // Pinned announcement ordering
    assert(announcements[0].isPinned === true, 'First item in default list is a pinned announcement');
    const agmNotice = announcements.find(a => a.title.includes('AGM') && a.title.includes('Election Notice'));
    assert(Boolean(agmNotice), 'Official AGM & Election circular exists');
    assert(agmNotice?.category === 'CIRCULAR', 'AGM notice category is CIRCULAR');
    assert(agmNotice?.authorName === 'Dr. Patrick Mugisa', 'Author is Dr. Patrick Mugisa');

    const newsletter = announcements.find(a => a.category === 'NEWSLETTER');
    assert(Boolean(newsletter), 'Headteacher address newsletter exists');

    const chapterAnn = announcements.find(a => a.targetChapterCode === 'MUMASA');
    assert(Boolean(chapterAnn), 'MUMASA Makerere Chapter announcement exists');
    assert(chapterAnn?.audienceScope === 'CHAPTER_ONLY', 'Chapter announcement scope is CHAPTER_ONLY');

    // TEST 2: Dynamic Multi-Channel Broadcast Creation (Section 15)
    console.log('\n--- TEST GROUP 2: DYNAMIC BROADCAST CREATION ---');
    const createRes = await dataService.createAnnouncement({
      title: 'KYUMASA Kyambogo University Chapter General Assembly 2026',
      summary: 'Elective gathering and career dinner for all MASSH alumni studying at Kyambogo University.',
      content: 'The executive committee of KYUMASA convenes its annual General Assembly on Saturday at West End Hall. We shall review chapter finances, welcome first-year old students, and elect new chapter leaders. All Kyambogo alumni are required to attend.',
      category: 'EVENT_ALERT',
      audienceScope: 'CHAPTER_ONLY',
      targetChapterId: 'chap-02',
      targetChapterCode: 'KYUMASA',
      isPinned: false,
      channels: ['PORTAL_FEED', 'SMS_BROADCAST', 'EMAIL_DIGEST'],
      authorName: 'Patrick Mugisa',
      authorRole: 'KYUMASA Chapter Patron',
      publishedBy: 'admin@massh.ac.ug',
    }, 'admin@massh.ac.ug');

    assert(createRes.success === true, 'Successfully created broadcast announcement');
    const createdId = createRes.id!;
    assert(Boolean(createdId), 'Created announcement assigned unique ID');

    // Retrieve and check properties
    const fetched = await dataService.getAnnouncementById(createdId);
    assert(fetched?.title === 'KYUMASA Kyambogo University Chapter General Assembly 2026', 'Title matches exactly');
    assert(fetched?.targetChapterCode === 'KYUMASA', 'Target chapter code is KYUMASA');
    assert(fetched?.channels.includes('SMS_BROADCAST') === true, 'Channels include SMS_BROADCAST');
    assert(fetched?.channels.includes('EMAIL_DIGEST') === true, 'Channels include EMAIL_DIGEST');

    // TEST 3: Category and Scope Filtering
    console.log('\n--- TEST GROUP 3: CATEGORY & SCOPE FILTERING ---');
    const circularsOnly = await dataService.getAnnouncements('CIRCULAR');
    assert(circularsOnly.every(a => a.category === 'CIRCULAR'), 'Category filter returns only CIRCULAR announcements');

    const chapterOnlyList = await dataService.getAnnouncements(undefined, 'CHAPTER_ONLY');
    assert(chapterOnlyList.every(a => a.audienceScope === 'CHAPTER_ONLY'), 'Scope filter returns only CHAPTER_ONLY');

    // TEST 4: Pinning and Unpinning Announcements
    console.log('\n--- TEST GROUP 4: PINNING & UNPINNING ---');
    const pinRes = await dataService.togglePinAnnouncement(createdId, true, 'admin@massh.ac.ug');
    assert(pinRes.success === true, 'Pinned KYUMASA announcement');

    const updatedAfterPin = await dataService.getAnnouncementById(createdId);
    assert(updatedAfterPin?.isPinned === true, 'Announcement is now pinned');

    const listWithPinned = await dataService.getAnnouncements();
    assert(listWithPinned[0].id === createdId || listWithPinned[1].id === createdId, 'Pinned announcement floats to top of feed');

    // Unpin
    await dataService.togglePinAnnouncement(createdId, false, 'admin@massh.ac.ug');
    const updatedAfterUnpin = await dataService.getAnnouncementById(createdId);
    assert(updatedAfterUnpin?.isPinned === false, 'Announcement successfully unpinned');

    // TEST 5: Views Counter Increment
    console.log('\n--- TEST GROUP 5: VIEWS COUNTER TELEMETRY ---');
    const initialViews = (await dataService.getAnnouncementById(createdId))?.viewsCount || 0;
    await dataService.incrementAnnouncementViews(createdId);
    await dataService.incrementAnnouncementViews(createdId);

    const viewsAfter = (await dataService.getAnnouncementById(createdId))?.viewsCount;
    assert(viewsAfter === initialViews + 2, 'Views counter incremented by 2');

    // TEST 6: In-Portal Notification Center
    console.log('\n--- TEST GROUP 6: IN-PORTAL NOTIFICATION CENTER ---');
    const notifications = await dataService.getAlumniNotifications('alumni-0001');
    assert(notifications.length >= 2, 'Alumnus has notifications');

    const testNotif = notifications[0];
    assert(Boolean(testNotif.id), 'Notification has valid ID');

    // Mark as read
    await dataService.markNotificationAsRead(testNotif.id);
    const updatedNotifs = await dataService.getAlumniNotifications('alumni-0001');
    const readItem = updatedNotifs.find(n => n.id === testNotif.id);
    assert(readItem?.isRead === true, 'Single notification marked as read');

    // Mark all as read
    await dataService.markAllNotificationsAsRead('alumni-0001');
    const allReadNotifs = await dataService.getAlumniNotifications('alumni-0001');
    assert(allReadNotifs.every(n => n.isRead === true), 'All notifications successfully marked as read');

    // TEST 7: Announcement Updates & Deletion
    console.log('\n--- TEST GROUP 7: UPDATES & DELETION ---');
    await dataService.updateAnnouncement(createdId, {
      summary: 'Updated: Refreshments and transport allowance provided for all attendees.'
    }, 'admin@massh.ac.ug');

    const verifiedUpdate = await dataService.getAnnouncementById(createdId);
    assert(verifiedUpdate?.summary?.includes('transport allowance') === true, 'Announcement summary updated');

    const delRes = await dataService.deleteAnnouncement(createdId, 'admin@massh.ac.ug');
    assert(delRes.success === true, 'Announcement deleted successfully');

    const postDelList = await dataService.getAnnouncements();
    assert(!postDelList.some(a => a.id === createdId), 'Deleted announcement no longer present in feed');

    // TEST 8: Audit Trail Verification
    console.log('\n--- TEST GROUP 8: AUDIT TRAIL LOGGING ---');
    const auditLogs = await dataService.getAuditLogs();
    const createdLog = auditLogs.find(l => l.action === 'ANNOUNCEMENT_CREATED');
    assert(Boolean(createdLog), 'ANNOUNCEMENT_CREATED audit log found');

    const updatedLog = auditLogs.find(l => l.action === 'ANNOUNCEMENT_UPDATED');
    assert(Boolean(updatedLog), 'ANNOUNCEMENT_UPDATED audit log found');

    const deletedLog = auditLogs.find(l => l.action === 'ANNOUNCEMENT_DELETED');
    assert(Boolean(deletedLog), 'ANNOUNCEMENT_DELETED audit log found');

    console.log('\n================================================================');
    console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 6 test execution:', error);
    process.exit(1);
  }
}

runPhase6Tests();
