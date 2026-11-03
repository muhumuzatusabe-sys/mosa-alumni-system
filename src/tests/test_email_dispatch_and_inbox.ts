import { dataService } from '../services/dataService';
import { emailService } from '../services/emailService';

async function runEmailTests() {
  console.log('=====================================================');
  console.log('   MOSA ALUMNI SYSTEM - EMAIL DISPATCH VERIFICATION');
  console.log('   Mandela Secondary School Hoima (MASSH, Est. 1997)');
  console.log('=====================================================\n');

  // 1. Test Verification Code (OTP) Dispatch
  console.log('1. Testing Verification Email Dispatch...');
  const testEmail = 'applicant.test@gmail.com';
  const otpRes = await emailService.sendVerificationEmail(testEmail, '582914', 'John Baptist');
  console.log('   Result:', otpRes.success ? '✓ SUCCESS' : '✗ FAILED', `(Provider: ${otpRes.provider})`);
  if (!otpRes.success) throw new Error('Verification email dispatch failed');

  // 2. Test Application Received Confirmation Email
  console.log('\n2. Testing Application Receipt Confirmation Email...');
  const appRecRes = await emailService.sendApplicationReceivedEmail(
    testEmail,
    'John Baptist Alinda',
    'MOSA-2026-00099',
    { phone: '+256 701 234567', highestQualification: "Bachelor's Degree" }
  );
  console.log('   Result:', appRecRes.success ? '✓ SUCCESS' : '✗ FAILED', `(Provider: ${appRecRes.provider})`);
  if (!appRecRes.success) throw new Error('Application received email failed');

  // 3. Test Membership Approval & Permanent MA Number Email
  console.log('\n3. Testing Membership Approval & MA Number Email...');
  const approveEmailRes = await emailService.sendMembershipApprovalEmail(
    testEmail,
    'John Baptist Alinda',
    'MA.0042',
    'MOSA-2026-00099'
  );
  console.log('   Result:', approveEmailRes.success ? '✓ SUCCESS' : '✗ FAILED', `(Provider: ${approveEmailRes.provider})`);
  if (!approveEmailRes.success) throw new Error('Membership approval email failed');

  // 4. Test Live Test Email Dispatcher
  console.log('\n4. Testing Live Test Dispatch...');
  const testRes = await emailService.sendTestEmail('admin@massh.ac.ug');
  console.log('   Result:', testRes.success ? '✓ SUCCESS' : '✗ FAILED', `(Provider: ${testRes.provider})`);
  if (!testRes.success) throw new Error('Test email failed');

  // 5. Test dataService.sendRegistrationOtp integration
  console.log('\n5. Testing dataService.sendRegistrationOtp Integration...');
  const regOtpRes = await dataService.sendRegistrationOtp('new.candidate@example.com');
  console.log('   Result:', regOtpRes.success ? '✓ SUCCESS' : '✗ FAILED', `Code: ${regOtpRes.code}`);
  if (!regOtpRes.success || !regOtpRes.code) throw new Error('dataService.sendRegistrationOtp failed');

  // 6. Verify Dispatch History Logs
  console.log('\n6. Verifying Email Dispatch History Logs...');
  const logs = emailService.getEmailLogs();
  console.log(`   Total Logs Recorded: ${logs.length}`);
  if (logs.length < 4) throw new Error('Expected at least 4 logs recorded');
  console.log('   Latest Log Category:', logs[0].category, '| To:', logs[0].to, '| Status:', logs[0].status);

  console.log('\n=====================================================');
  console.log('   ✓ ALL EMAIL DISPATCH TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

runEmailTests().catch(err => {
  console.error('\n✗ TEST RUN FAILED:', err);
  process.exit(1);
});
