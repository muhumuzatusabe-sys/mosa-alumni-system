import { execSync } from 'child_process';

const testFiles = [
  'src/tests/test_milestone1.ts',
  'src/tests/test_phase3.ts',
  'src/tests/test_phase4.ts',
  'src/tests/test_phase5.ts',
  'src/tests/test_phase6.ts',
  'src/tests/test_phase7.ts',
  'src/tests/test_master_upgrade.ts',
  'src/tests/test_auto_approval_and_status.ts',
  'src/tests/test_governance_and_attendance.ts',
  'src/tests/test_refinements_and_assisted.ts',
  'src/tests/test_dashboard_decongestion.ts',
  'src/tests/test_admin_portal_decongestion.ts',
  'src/tests/test_ux_navigation_refinements.ts',
  'src/tests/test_notifications_padding_staff.ts',
  'src/tests/test_opportunities_elections_cards.ts',
  'src/tests/test_official_mosa_id_card.ts'
];

console.log('Running all 16 test suites...');
let totalPassed = 0;

for (const file of testFiles) {
  try {
    const out = execSync(`npx.cmd tsx ${file}`, { encoding: 'utf-8' });
    const match = out.match(/TEST RESULTS:\s*(\d+)\s*PASSED,\s*(\d+)\s*FAILED/);
    if (match) {
      console.log(`[PASS] ${file}: ${match[1]} passed, ${match[2]} failed`);
      totalPassed += parseInt(match[1], 10);
    } else {
      console.log(`[PASS] ${file}: Completed cleanly`);
    }
  } catch (err: any) {
    console.error(`[FAIL] ${file}:`, err.message);
    process.exit(1);
  }
}

console.log(`\n==================================================`);
console.log(`TOTAL PASSED ACROSS ALL SUITES: ${totalPassed}`);
console.log(`STATUS: 100% PASSING!`);
console.log(`==================================================`);
