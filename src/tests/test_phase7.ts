// Test Suite: Phase 7 - Analytics, Reporting & System Administration
// MASSH / MOSA Alumni System

// Mock Node environment localStorage before imports
const mockStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStore[k] || null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};

import { dataService } from '../services/dataService';
import { SystemAnalytics } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runPhase7Tests() {
  console.log('\n=== RUNNING PHASE 7 TESTS: ANALYTICS & STRATEGIC REPORTING ===\n');

  // Test 1: Fetch System Analytics
  console.log('--- Test Group 1: Core System Analytics Synthesis ---');
  const analytics: SystemAnalytics = await dataService.getSystemAnalytics();
  assert(!!analytics, 'getSystemAnalytics() returns non-null analytics object');
  assert(analytics.totalRegistered > 0, `Total registered candidates parsed: ${analytics.totalRegistered}`);
  assert(analytics.totalVerified > 0, `Total verified alumni parsed: ${analytics.totalVerified}`);
  assert(analytics.verificationRate > 0 && analytics.verificationRate <= 100, `Verification rate computed correctly: ${analytics.verificationRate}%`);

  // Test 2: Educational Stream Breakdown (MASSH O-Level & A-Level)
  console.log('\n--- Test Group 2: MASSH Educational Stream Distributions ---');
  const { levelsBreakdown } = analytics;
  assert(typeof levelsBreakdown.oLevelOnly === 'number', 'oLevelOnly count exists and is numeric');
  assert(typeof levelsBreakdown.aLevelOnly === 'number', 'aLevelOnly count exists and is numeric');
  assert(typeof levelsBreakdown.bothLevels === 'number', 'bothLevels count exists and is numeric');
  
  const sumLevels = levelsBreakdown.oLevelOnly + levelsBreakdown.aLevelOnly + levelsBreakdown.bothLevels;
  assert(sumLevels === analytics.totalVerified, `Sum of levels (${sumLevels}) matches total verified alumni (${analytics.totalVerified})`);
  assert(levelsBreakdown.bothLevels > 0, `Alumni completing both O & A levels detected: ${levelsBreakdown.bothLevels}`);

  // Test 3: Generational Cohort Classification
  console.log('\n--- Test Group 3: Generational Cohorts (Est. 1997 to Present) ---');
  const { cohortBreakdown } = analytics;
  assert(typeof cohortBreakdown.pioneers1997_2005 === 'number', 'Pioneers (1997-2005) cohort exists');
  assert(typeof cohortBreakdown.years2006_2015 === 'number', 'Expansion (2006-2015) cohort exists');
  assert(typeof cohortBreakdown.years2016_2020 === 'number', 'Silver Era (2016-2020) cohort exists');
  assert(typeof cohortBreakdown.years2021_present === 'number', 'Contemporary (2021-Present) cohort exists');
  
  const sumCohorts = cohortBreakdown.pioneers1997_2005 + cohortBreakdown.years2006_2015 + cohortBreakdown.years2016_2020 + cohortBreakdown.years2021_present;
  assert(sumCohorts === analytics.totalVerified, `Sum of generational cohorts (${sumCohorts}) matches total verified alumni (${analytics.totalVerified})`);

  // Test 4: Gender Distribution
  console.log('\n--- Test Group 4: Gender Distribution ---');
  const { genderBreakdown } = analytics;
  assert(genderBreakdown.male > 0, `Male alumni parsed: ${genderBreakdown.male}`);
  assert(genderBreakdown.female > 0, `Female alumni parsed: ${genderBreakdown.female}`);
  const sumGender = genderBreakdown.male + genderBreakdown.female + genderBreakdown.other;
  assert(sumGender === analytics.totalVerified, `Gender sum (${sumGender}) matches verified count (${analytics.totalVerified})`);

  // Test 5: Treasury & Dues Compliance
  console.log('\n--- Test Group 5: Treasury & Dues Compliance Metrics ---');
  const { duesCompliance, finances } = analytics;
  assert(typeof duesCompliance.activePaidCount === 'number', 'Active paid dues count exists');
  assert(typeof duesCompliance.dueCount === 'number', 'Pending dues count exists');
  assert(duesCompliance.activePaidCount + duesCompliance.dueCount === analytics.totalVerified, 'Dues compliance sum equals verified alumni');
  assert(duesCompliance.complianceRate >= 0 && duesCompliance.complianceRate <= 100, `Dues compliance rate computed: ${duesCompliance.complianceRate}%`);

  assert(finances.totalVerifiedUGX > 0, `Total verified funds mobilized: ${finances.totalVerifiedUGX.toLocaleString()} UGX`);
  assert(finances.duesCollectedUGX > 0, `Annual dues collected: ${finances.duesCollectedUGX.toLocaleString()} UGX`);
  assert(finances.campaignsRaisedUGX > 0, `Philanthropic campaigns raised: ${finances.campaignsRaisedUGX.toLocaleString()} UGX`);
  assert(finances.totalVerifiedUGX >= (finances.duesCollectedUGX + finances.campaignsRaisedUGX), 'Finances total reconciles with subcategories');

  // Test 6: University Chapters Mobilization Ranking
  console.log('\n--- Test Group 6: University Chapters Leaderboard ---');
  const { chapters } = analytics;
  assert(chapters.totalChapters >= 3, `Institutional chapters detected: ${chapters.totalChapters}`);
  assert(chapters.totalChapterMemberships > 0, `Total registered chapter members: ${chapters.totalChapterMemberships}`);
  assert(chapters.distribution.length === chapters.totalChapters, 'Distribution contains all chapters');
  
  // Verify descending sort by member count
  let isSortedDescending = true;
  for (let i = 0; i < chapters.distribution.length - 1; i++) {
    if (chapters.distribution[i].memberCount < chapters.distribution[i + 1].memberCount) {
      isSortedDescending = false;
      break;
    }
  }
  assert(isSortedDescending, 'Chapters distribution is sorted descending by member count');
  assert(chapters.distribution[0].code === 'MUMASA', `Top chapter is Makerere (MUMASA) with ${chapters.distribution[0].memberCount} members`);

  // Test 7: Event Turnout & Engagement
  console.log('\n--- Test Group 7: Events Attendance & Engagement ---');
  const { events } = analytics;
  assert(events.totalEvents > 0, `Total MOSA events registered: ${events.totalEvents}`);
  assert(events.totalRegistrations > 0, `Total event registrations: ${events.totalRegistrations}`);
  assert(events.totalAttendees >= 0, `Total verified attendees: ${events.totalAttendees}`);
  assert(events.averageAttendanceRate >= 0 && events.averageAttendanceRate <= 100, `Average event turnout rate: ${events.averageAttendanceRate}%`);

  // Test 8: Geographic & Professional Distributions
  console.log('\n--- Test Group 8: Regional Spread & Industry Sectors ---');
  const { topLocations, topProfessions } = analytics;
  assert(topLocations.length > 0 && topLocations.length <= 5, `Top locations extracted: ${topLocations.length}`);
  assert(topLocations[0].count >= topLocations[topLocations.length - 1].count, 'Top locations sorted descending');
  assert(topProfessions.length > 0 && topProfessions.length <= 5, `Top professions extracted: ${topProfessions.length}`);
  assert(topProfessions[0].count >= topProfessions[topProfessions.length - 1].count, 'Top professions sorted descending');

  // Test 9: Master Registry Data Verification for Export
  console.log('\n--- Test Group 9: Master Registry CSV Export Generation Integrity ---');
  const alumniList = await dataService.getAlumniList();
  assert(alumniList.length === analytics.totalVerified, `Export dataset count (${alumniList.length}) matches verified analytics count (${analytics.totalVerified})`);
  const allHaveMANumber = alumniList.every(a => a.alumniNumber.startsWith('MA. '));
  assert(allHaveMANumber, 'All alumni records in export have official "MA. XXXX" serial number format');

  // Summary
  console.log(`\n========================================`);
  console.log(`Phase 7 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
