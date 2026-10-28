import { PrismaClient, TransactionStatus, PropertyStatus, UserRole, PropertyType, PaymentMethod, PaymentGateway } from "@prisma/client";
import { transactionService } from "../src/services/transactionService";

const prisma = new PrismaClient();

async function runSmokeTest() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("🚀 RENTHUB END-TO-END SMOKE TEST: TENANT PAY -> OTP -> PAYOUT");
  console.log("════════════════════════════════════════════════════════════════\n");

  const testSuffix = Date.now().toString().slice(-6);
  const testLandlordClerkId = `clerk_smoke_landlord_${testSuffix}`;
  const testTenantClerkId = `clerk_smoke_tenant_${testSuffix}`;

  let testLandlord: any = null;
  let testTenant: any = null;
  let testProperty: any = null;
  let testTransaction: any = null;

  try {
    // Step 1: Create or find test users
    console.log("▶ Step 1: Setting up test Landlord and Tenant accounts in Neon DB...");
    testLandlord = await prisma.user.create({
      data: {
        clerkId: testLandlordClerkId,
        email: `landlord_${testSuffix}@example.com`,
        phone: `+234801${testSuffix}`,
        firstName: "Smoke",
        lastName: "Landlord",
        role: UserRole.LANDLORD,
      },
    });

    testTenant = await prisma.user.create({
      data: {
        clerkId: testTenantClerkId,
        email: `tenant_${testSuffix}@example.com`,
        phone: `+234802${testSuffix}`,
        firstName: "Smoke",
        lastName: "Tenant",
        role: UserRole.TENANT,
      },
    });
    console.log(`  ✓ Created test Landlord (${testLandlord.id}) and Tenant (${testTenant.id})`);

    // Step 2: Create a test listing
    console.log("\n▶ Step 2: Creating test property in AVAILABLE status...");
    testProperty = await prisma.property.create({
      data: {
        title: `Smoke Test Luxury Apartment ${testSuffix}`,
        description: "Automated end-to-end smoke test property",
        address: "123 Smoke Test Blvd",
        city: "Lagos",
        state: "Lagos",
        pricePerYear: 2500000,
        cautionFee: 250000,
        serviceFee: 150000,
        legalFee: 125000,
        agentFee: 0,
        propertyType: PropertyType.APARTMENT_2BED,
        bedrooms: 2,
        bathrooms: 2,
        toilets: 2,
        status: PropertyStatus.AVAILABLE,
        landlordId: testLandlord.id,
      },
    });
    console.log(`  ✓ Property created: ${testProperty.title} (${testProperty.id}), Status: ${testProperty.status}`);

    // Step 3: Tenant initiates rental transaction
    console.log("\n▶ Step 3: Tenant initiates rental transaction...");
    const rentAmount = testProperty.pricePerYear;
    const cautionDeposit = testProperty.cautionFee || 0;
    const serviceCharge = testProperty.serviceFee || 0;
    const legalFee = testProperty.legalFee || 0;
    const platformFee = 50000;
    const totalAmount = rentAmount + cautionDeposit + serviceCharge + legalFee + platformFee;

    testTransaction = await prisma.transaction.create({
      data: {
        propertyId: testProperty.id,
        tenantId: testTenant.id,
        rentAmount,
        cautionFee: cautionDeposit,
        serviceFee: serviceCharge,
        legalFee,
        platformFee,
        totalAmount,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentGateway: PaymentGateway.PAYSTACK,
        paystackRef: `SMOKE-REF-${testSuffix}`,
        status: TransactionStatus.PENDING,
      },
    });
    console.log(`  ✓ Transaction initiated: ${testTransaction.id}, Total: ₦${totalAmount.toLocaleString()}, Status: ${testTransaction.status}`);

    // Step 4: Payment confirmed -> Escrow locked & Property under offer
    console.log("\n▶ Step 4: Simulating Paystack payment gateway confirmation...");
    await prisma.transaction.update({
      where: { id: testTransaction.id },
      data: {
        status: TransactionStatus.ESCROWED,
        escrowHeld: true,
      },
    });

    await prisma.property.update({
      where: { id: testProperty.id },
      data: { status: PropertyStatus.UNDER_OFFER },
    });

    const fundedTx = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    const updatedProp = await prisma.property.findUniqueOrThrow({ where: { id: testProperty.id } });
    console.log(`  ✓ Escrow Funded. Transaction Status: ${fundedTx.status}, Property Status: ${updatedProp.status}`);
    if (updatedProp.status !== PropertyStatus.UNDER_OFFER) {
      throw new Error(`Assertion failed: Property should be UNDER_OFFER, got ${updatedProp.status}`);
    }

    // Step 5: OTP Generation with HMAC hash via transactionService
    console.log("\n▶ Step 5: Tenant generates 6-digit Key Handover Release OTP via transactionService...");
    const otpGenResult = await transactionService.generateHandoverOTP(testTransaction.id, testTenant.id);
    const rawOtp = otpGenResult.otp;

    const txWithOtp = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    console.log(`  ✓ OTP generated and stored as HMAC hash: ${txWithOtp.releaseOtp?.slice(0, 16)}...`);
    console.log(`  ✓ Plaintext code (${rawOtp}) is never persisted in database`);
    if (txWithOtp.releaseOtp === rawOtp) {
      throw new Error("Security failure: Plaintext OTP was stored in the database!");
    }

    // Step 6: Test DB-persisted atomic concurrency under parallel brute-force attack (10 concurrent requests)
    console.log("\n▶ Step 6: Testing atomic concurrency under parallel brute-force attack (10 concurrent requests)...");
    const concurrentAttempts = 10;
    const burstResults = await Promise.allSettled(
      Array.from({ length: concurrentAttempts }, () =>
        transactionService.releaseEscrowWithOTP(testTransaction.id, "000000", testLandlord.id)
      )
    );

    let invalidOtpCount = 0;
    let lockedCount = 0;
    for (const r of burstResults) {
      if (r.status === "rejected") {
        if (r.reason.message.includes("Invalid Handover Release OTP")) {
          invalidOtpCount++;
        } else if (r.reason.message.includes("max 5 exceeded")) {
          lockedCount++;
        }
      }
    }
    console.log(`  ✓ Concurrent attack outcomes: ${invalidOtpCount} invalid-OTP rejections, ${lockedCount} locked rejections`);

    // Verify all attempts were accounted for (no unhandled or swallowed error types)
    if (invalidOtpCount + lockedCount !== concurrentAttempts) {
      throw new Error(`Step 6 error accounting failure: ${invalidOtpCount + lockedCount} errors accounted for out of ${concurrentAttempts}`);
    }

    // Concurrency guarantee: No more than 5 requests could have slipped in before the atomic lock closed
    if (invalidOtpCount > 5) {
      throw new Error(`Concurrency race condition detected: ${invalidOtpCount} requests got "Invalid OTP" (expected <= 5)`);
    }

    const txAfterFails = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    console.log(`  ✓ Recorded invalid attempts in PostgreSQL: ${txAfterFails.otpAttempts} attempts`);
    if (txAfterFails.otpAttempts < 5) {
      throw new Error(`Expected at least 5 attempts recorded, got ${txAfterFails.otpAttempts}`);
    }

    // Attempting with valid rawOtp must now be permanently blocked by the lock
    let lockedThrew = false;
    try {
      await transactionService.releaseEscrowWithOTP(testTransaction.id, rawOtp, testLandlord.id);
    } catch (err: any) {
      lockedThrew = true;
      if (err.message.includes("max 5 exceeded")) {
        console.log(`  ✓ Security gate confirmed: Valid OTP blocked after lock (${err.message.slice(0, 48)}...)`);
      } else {
        throw err;
      }
    }
    if (!lockedThrew) {
      throw new Error("Step 6 security assertion failed: Valid OTP was accepted despite account being locked!");
    }

    // Step 7: Tenant regenerates fresh OTP via transactionService (resets attempts to 0)
    console.log("\n▶ Step 7: Tenant regenerates fresh OTP via transactionService (resets attempt counter)...");
    const freshResult = await transactionService.generateHandoverOTP(testTransaction.id, testTenant.id);
    const freshOtp = freshResult.otp;

    const txAfterReset = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    if (txAfterReset.otpAttempts !== 0) {
      throw new Error(`Expected otpAttempts to be reset to 0 by generateHandoverOTP, got ${txAfterReset.otpAttempts}`);
    }
    console.log(`  ✓ Fresh OTP generated via service, attempts atomically reset to ${txAfterReset.otpAttempts}`);

    // Step 7b: Test OTP Expiry handling
    console.log("\n▶ Step 7b: Testing expired OTP rejection...");
    await prisma.transaction.update({
      where: { id: testTransaction.id },
      data: { otpExpiresAt: new Date(Date.now() - 5000) },
    });
    let expiryThrew = false;
    try {
      await transactionService.releaseEscrowWithOTP(testTransaction.id, freshOtp, testLandlord.id);
    } catch (err: any) {
      expiryThrew = true;
      if (err.message.includes("expired")) {
        console.log(`  ✓ Security gate confirmed: Expired OTP rejected (${err.message})`);
      } else {
        throw err;
      }
    }
    if (!expiryThrew) {
      throw new Error("Step 7b failure: Expired OTP was accepted without error!");
    }

    // Restore active expiration window for handover
    await prisma.transaction.update({
      where: { id: testTransaction.id },
      data: { otpExpiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
    });

    // Step 8: Test boundary policy (4 failed guesses, then 5th attempt succeeds with valid OTP)
    console.log("\n▶ Step 8: Testing boundary policy (4 wrong guesses, 5th attempt with valid OTP succeeds)...");
    for (let wrongAttempt = 1; wrongAttempt <= 4; wrongAttempt++) {
      try {
        await transactionService.releaseEscrowWithOTP(testTransaction.id, "000000", testLandlord.id);
        throw new Error(`Boundary test failure: Wrong attempt ${wrongAttempt} did not throw!`);
      } catch (err: any) {
        if (!err.message.includes("Invalid Handover Release OTP code")) {
          throw err;
        }
      }
    }
    const txAtBoundary = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    console.log(`  ✓ 4 failed attempts recorded in PostgreSQL (attempts: ${txAtBoundary.otpAttempts} / 5)`);
    if (txAtBoundary.otpAttempts !== 4) {
      throw new Error(`Expected exactly 4 attempts before boundary release, got ${txAtBoundary.otpAttempts}`);
    }

    // 5th attempt is the CORRECT code: Must be evaluated and succeed!
    const releaseResult = await transactionService.releaseEscrowWithOTP(testTransaction.id, freshOtp, testLandlord.id);
    console.log(`  ✓ Boundary verified: 5th attempt with valid OTP succeeded! Status: ${releaseResult.status}`);

    const finalTx = await prisma.transaction.findUniqueOrThrow({ where: { id: testTransaction.id } });
    const finalProp = await prisma.property.findUniqueOrThrow({ where: { id: testProperty.id } });

    console.log(`  ✓ Transaction status: ${finalTx.status} (escrowReleased: ${finalTx.escrowReleased})`);
    console.log(`  ✓ Property status: ${finalProp.status} (now officially RENTED)`);
    console.log(`  ✓ OTP cleared from database: ${finalTx.releaseOtp === null ? "YES (nullified)" : "NO"}`);

    if (finalTx.status !== TransactionStatus.RELEASED || finalProp.status !== PropertyStatus.RENTED) {
      throw new Error(`Smoke test assertion failure: Expected RELEASED & RENTED, got ${finalTx.status} & ${finalProp.status}`);
    }

    // Step 9: Landlord Payout record creation & verification
    console.log("\n▶ Step 9: Validating Landlord Payout record and Notification created by AfriExchangePayoutService...");
    let payout: any = null;
    // Poll up to 6 seconds for async disburseLandlordPayout to complete and reach terminal status
    for (let i = 0; i < 24; i++) {
      payout = await prisma.landlordPayout.findUnique({
        where: { transactionId: testTransaction.id },
        include: { transaction: true },
      });
      if (payout && payout.status !== "PENDING") {
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    if (!payout) {
      throw new Error("Step 9 failure: afriExchangePayoutService failed to create a LandlordPayout record!");
    }

    if (payout.status !== "SKIPPED") {
      throw new Error(`Step 9 failure: Expected LandlordPayout status to be SKIPPED, but got ${payout.status}`);
    }

    console.log(`  ✓ LandlordPayout verified (ID: ${payout.id}, Net: ₦${payout.netAmount.toLocaleString()}, Status: ${payout.status})`);
    console.log(`  ✓ Foreign key relation verified: payout.transaction.id = ${payout.transaction?.id}`);

    // Verify landlord notification was dispatched prompting settlement link with exact title match
    const notification = await prisma.notification.findFirst({
      where: {
        userId: testLandlord.id,
        type: "SYSTEM",
        title: "Action Required: Link AfriExchange Account",
      },
    });
    if (!notification) {
      throw new Error("Step 9 failure: Landlord settlement notification with title 'Action Required: Link AfriExchange Account' was not created!");
    }
    console.log(`  ✓ Landlord settlement notification verified: "${notification.title}" (ID: ${notification.id})`);

    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("✅ ALL END-TO-END SMOKE TEST PHASES PASSED WITH ZERO ERRORS!");
    console.log("════════════════════════════════════════════════════════════════\n");
  } finally {
    // Cleanup smoke test rows from database
    console.log("▶ Cleaning up smoke test artifacts from Neon DB...");
    if (testTransaction) {
      await prisma.landlordPayout.deleteMany({ where: { transactionId: testTransaction.id } });
      await prisma.transaction.deleteMany({ where: { id: testTransaction.id } });
    }
    if (testProperty) {
      await prisma.property.deleteMany({ where: { id: testProperty.id } });
    }
    if (testTenant) {
      await prisma.user.deleteMany({ where: { id: testTenant.id } });
    }
    if (testLandlord) {
      await prisma.notification.deleteMany({ where: { userId: testLandlord.id } });
      await prisma.user.deleteMany({ where: { id: testLandlord.id } });
    }
    console.log("  ✓ Database cleaned up cleanly.");
    await prisma.$disconnect();
  }
}

runSmokeTest().catch((err) => {
  console.error("❌ Smoke test failed:", err);
  process.exit(1);
});
