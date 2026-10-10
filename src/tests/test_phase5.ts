// Mock localStorage for Node environment
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

import { dataService } from '../services/dataService';

async function runPhase5Tests() {
  console.log('================================================================');
  console.log('  MOSA ALUMNI SYSTEM - PHASE 5 PAYMENTS & DONATIONS VERIFICATION');
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
    // TEST 1: Initial Campaigns Retrieval
    console.log('--- TEST GROUP 1: INITIAL CAMPAIGNS & SEED PAYMENTS ---');
    const campaigns = await dataService.getDonationCampaigns();
    assert(campaigns.length >= 3, 'System has at least 3 initial development campaigns');

    const labCamp = campaigns.find(c => c.title.includes('Laboratory Complex'));
    assert(Boolean(labCamp), 'MASSH Science Laboratory Complex Expansion campaign exists');
    assert(labCamp?.targetAmount === 45000000, 'Science Lab target is UGX 45M');
    assert(labCamp?.category === 'INFRASTRUCTURE', 'Science Lab category is INFRASTRUCTURE');

    const initialPayments = await dataService.getPayments();
    assert(initialPayments.length >= 3, 'System initializes with seed payments');
    const verifiedDues = initialPayments.find(p => p.receiptNumber === 'MOSA-RCP-2026-0001');
    assert(Boolean(verifiedDues), 'Seed verified payment MOSA-RCP-2026-0001 exists');
    assert(verifiedDues?.category === 'ANNUAL_MEMBERSHIP', 'Payment category is ANNUAL_MEMBERSHIP');

    // TEST 2: Dynamic Campaign Creation & Updates
    console.log('\n--- TEST GROUP 2: DYNAMIC CAMPAIGN CREATION ---');
    const newCampRes = await dataService.createDonationCampaign({
      title: 'MASSH ICT Lab 50 Modern Computers Fund',
      description: 'Equipping the secondary school ICT lab with 50 high-performance desktop computers for UNEB computer studies.',
      category: 'ACADEMIC',
      targetAmount: 50000000,
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      status: 'ACTIVE',
      startDate: '2026-10-01T00:00:00.000Z',
    }, 'admin@massh.ac.ug');

    assert(Boolean(newCampRes.id), 'Successfully created new school campaign');
    const createdCampId = newCampRes.id!;

    const fetchedCamp = await dataService.getDonationCampaignById(createdCampId);
    assert(fetchedCamp?.title === 'MASSH ICT Lab 50 Modern Computers Fund', 'Campaign retrievable with correct title');
    assert(fetchedCamp?.raisedAmount === 0, 'Initial raised amount is 0');
    assert(fetchedCamp?.donorCount === 0, 'Initial donor count is 0');

    // TEST 3: Alumnus Submitting Dues Payment
    console.log('\n--- TEST GROUP 3: ALUMNUS ANNUAL DUES SUBMISSION ---');
    const alumniList = await dataService.getAlumniList();
    const testAlumnus = alumniList.find(a => a.alumniNumber === 'MA. 0001')!;
    assert(Boolean(testAlumnus), 'Found verified alumnus MA. 0001 (Muhammad Zatusave)');

    const currentYear = new Date().getFullYear();
    const duesPaymentRes = await dataService.submitPayment({
      alumniId: testAlumnus.internalId,
      alumniNumber: testAlumnus.alumniNumber,
      alumniName: `${testAlumnus.firstName} ${testAlumnus.lastName}`,
      alumniEmail: testAlumnus.email,
      alumniPhone: testAlumnus.phone,
      category: 'ANNUAL_MEMBERSHIP',
      subscriptionYear: currentYear,
      amount: 50000,
      currency: 'UGX',
      paymentMethod: 'MTN_MOMO',
      transactionReference: 'MP261003.1530.T99881',
      payerPhoneOrAccount: '0772123456',
      notes: 'MASSH 2026 annual alumni dues via MTN MoMo',
    });

    assert(Boolean(duesPaymentRes.id), 'Payment reference submitted successfully');
    const submittedDuesId = duesPaymentRes.id!;

    const pendingPayment = await dataService.getPaymentById(submittedDuesId);
    assert(pendingPayment?.status === 'PENDING_VERIFICATION', 'Status is PENDING_VERIFICATION');
    assert(pendingPayment?.amount === 50000, 'Recorded amount is UGX 50,000');

    // TEST 4: MOSA Treasurer Verification & Receipt Issuance
    console.log('\n--- TEST GROUP 4: TREASURER VERIFICATION & RECEIPT ISSUANCE ---');
    const verifyRes = await dataService.verifyPayment(
      submittedDuesId,
      'treasurer@massh.ac.ug',
      'Reconciled against MTN MoMo Merchant statement 654321'
    );

    assert(verifyRes.success === true, 'Payment successfully verified by Treasurer');
    assert(Boolean(verifyRes.receiptNumber), 'Official receipt number generated');
    assert(verifyRes.receiptNumber?.startsWith(`MOSA-RCP-${currentYear}-`) === true, 'Receipt format matches MOSA-RCP-YYYY-XXXX');

    // Verify Alumnus membership status was updated
    const updatedAlumni = await dataService.getAlumniByNumber(testAlumnus.alumniNumber);
    assert(updatedAlumni?.membershipStatus === 'ACTIVE', 'Alumnus membershipStatus is ACTIVE');
    assert(updatedAlumni?.membershipPaidUntilYear === currentYear, `Alumnus membership is paid until ${currentYear}`);

    // TEST 5: Project Donation & Campaign Counter Increment
    console.log('\n--- TEST GROUP 5: PROJECT DONATION & PROGRESS COUNTER ---');
    const graceAlumnus = alumniList.find(a => a.alumniNumber === 'MA. 0002')!;

    const donationRes = await dataService.submitPayment({
      alumniId: graceAlumnus.internalId,
      alumniNumber: graceAlumnus.alumniNumber,
      alumniName: `${graceAlumnus.firstName} ${graceAlumnus.lastName}`,
      alumniEmail: graceAlumnus.email,
      alumniPhone: graceAlumnus.phone,
      category: 'PROJECT_DONATION',
      campaignId: createdCampId,
      campaignTitle: 'MASSH ICT Lab 50 Modern Computers Fund',
      amount: 2500000,
      currency: 'UGX',
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'STB-UG-88776655',
      payerPhoneOrAccount: 'Stanbic Bank Hoima',
      notes: 'Contribution towards 2 Dell OptiPlex computers',
    });

    assert(Boolean(donationRes.id), 'Donation reference submitted');
    const donationPayId = donationRes.id!;

    // Verify donation
    const verifyDonationRes = await dataService.verifyPayment(
      donationPayId,
      'treasurer@massh.ac.ug',
      'Deposit confirmed in Stanbic Account 9030012345678'
    );
    assert(verifyDonationRes.success === true, 'Treasurer verified campaign donation');

    // Check campaign counters incremented
    const updatedCamp = await dataService.getDonationCampaignById(createdCampId);
    assert(updatedCamp?.raisedAmount === 2500000, 'Campaign raisedAmount incremented to UGX 2,500,000');
    assert(updatedCamp?.donorCount === 1, 'Campaign donorCount incremented to 1');

    // TEST 6: Payment Rejection Workflow
    console.log('\n--- TEST GROUP 6: PAYMENT REJECTION WORKFLOW ---');
    const bogusPaymentRes = await dataService.submitPayment({
      alumniId: testAlumnus.internalId,
      alumniNumber: testAlumnus.alumniNumber,
      alumniName: 'Muhammad Zatusave',
      alumniEmail: testAlumnus.email,
      category: 'ANNUAL_MEMBERSHIP',
      amount: 50000,
      currency: 'UGX',
      paymentMethod: 'AIRTEL_MONEY',
      transactionReference: 'BOGUS-REF-000000',
    });

    const rejectRes = await dataService.rejectPayment(
      bogusPaymentRes.id!,
      'Reference code BOGUS-REF-000000 not found on Airtel Money statement',
      'treasurer@massh.ac.ug'
    );

    assert(rejectRes.success === true, 'Payment rejection executed');
    const rejectedRecord = await dataService.getPaymentById(bogusPaymentRes.id!);
    assert(rejectedRecord?.status === 'REJECTED', 'Status changed to REJECTED');
    assert(rejectedRecord?.rejectionReason?.includes('not found') === true, 'Rejection reason recorded');

    // TEST 7: Financial Summary & Analytics
    console.log('\n--- TEST GROUP 7: FINANCIAL SUMMARY & ANALYTICS ---');
    const summary = await dataService.getFinancialSummary();
    assert(summary.totalVerifiedAmount > 0, 'Total verified funds > 0');
    assert(summary.verifiedCount >= 4, 'At least 4 verified receipts counted');
    assert(summary.categoryBreakdown.ANNUAL_MEMBERSHIP >= 100000, 'Annual dues breakdown has collected funds');
    assert(summary.categoryBreakdown.PROJECT_DONATION >= 3000000, 'Project donations collected funds recorded');
    assert(summary.methodBreakdown.MTN_MOMO > 0, 'MTN MoMo payments recorded');
    assert(summary.methodBreakdown.BANK_TRANSFER > 0, 'Bank transfer payments recorded');

    // TEST 8: Audit Logs Tracking
    console.log('\n--- TEST GROUP 8: AUDIT TRAIL LOGGING ---');
    const auditLogs = await dataService.getAuditLogs();
    const campLog = auditLogs.find(l => l.action === 'CAMPAIGN_CREATED');
    assert(Boolean(campLog), 'CAMPAIGN_CREATED audit log found');

    const paySubLog = auditLogs.find(l => l.action === 'PAYMENT_SUBMITTED');
    assert(Boolean(paySubLog), 'PAYMENT_SUBMITTED audit log found');

    const payVerLog = auditLogs.find(l => l.action === 'PAYMENT_VERIFIED');
    assert(Boolean(payVerLog), 'PAYMENT_VERIFIED audit log found');

    const payRejLog = auditLogs.find(l => l.action === 'PAYMENT_REJECTED');
    assert(Boolean(payRejLog), 'PAYMENT_REJECTED audit log found');

    console.log('\n================================================================');
    console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 5 test execution:', error);
    process.exit(1);
  }
}

runPhase5Tests();
