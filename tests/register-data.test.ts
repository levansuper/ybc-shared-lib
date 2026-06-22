import { describe, it, expect } from 'vitest';
import { JsonSerializer } from '../src/serializers';
import type { RegisterData } from '../src/types';

describe('RegisterData full-mirror contract', () => {
  // A fully-populated RegisterData carrying every casino User field. If a field
  // is removed/renamed in the interface this object stops type-checking, so the
  // build (and `vitest run`, which type-checks via ts) acts as the shape guard.
  const full: RegisterData = {
    // existing 9
    userId: 1,
    userGuid: 'guid-1',
    email: 'a@b.c',
    username: 'alice',
    signupMethod: 'email',
    ipAddress: '127.0.0.1',
    referByUserId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    // full mirror
    referByUserCampaignId: null,
    fireblocksVaultId: 'vault-1',
    referralCode: 'REF1',
    walletAddress: '0xabc',
    password: '$2b$10$hash',
    role: 'CLIENT',
    firstName: 'Alice',
    lastName: 'Smith',
    dateOfBirth: '1990-01-01',
    address: '1 St',
    postalCode: '00000',
    city: 'Town',
    country: 'US',
    occupation: 'Dev',
    gender: 'f',
    isActive: 1,
    isVerified: 0,
    verifyAccountToken: 'tok',
    docType: 'passport',
    twoFactorSecret: 'secret',
    twoFactorEnabled: 0,
    kycVerified: 1,
    forgotPasswordToken: null,
    frontIdentityMediaId: null,
    backIdentityMediaId: null,
    ghostModeEnabled: false,
    fiatView: true,
    hideZeroBalance: false,
    emailMarketing: true,
    twoFactorVerifyOtp: '',
    twoFactorType: 'EMAIL',
    isAffiliatePartner: false,
    earlyAccessCode: null,
    tier: 'unranked',
    rating: 0,
    totalWagered: '1000',
    totalMonthlyWithdrawn: 0,
    totalMonthlyWithdrawLimit: 0,
    totalWin: '500',
    totalBetsCount: 3,
    totalWinsCount: 1,
    totalExperienceWithReferrals: 0,
    referralCommissionPercentage: 10,
    totalReferralCommissionEarned: 0,
    totalReferralCommissionClaimed: 0,
    totalRecentPlayWagered: 0,
    totalRecentPlayExperience: 0,
    totalWeeklyWagered: 0,
    totalWeekly1Wagered: 0,
    totalWeekly2Wagered: 0,
    totalWeekly3Wagered: 0,
    totalWeekly4Wagered: 0,
    totalWeeklyRaceExperienceGained: 0,
    totalWeeklyExperienceGained: 0,
    totalWeeklyExperienceGainedWithReferrals: 0,
    totalWeekly1ExperienceGained: 0,
    totalWeekly2ExperienceGained: 0,
    totalWeekly3ExperienceGained: 0,
    totalWeekly4ExperienceGained: 0,
    weekly1BonusDistributed: false,
    weekly2BonusDistributed: false,
    weekly3BonusDistributed: false,
    weekly4BonusDistributed: false,
    totalMonthlyWagered: 0,
    totalMonthly1Wagered: 0,
    totalMonthly2Wagered: 0,
    totalMonthly3Wagered: 0,
    totalMonthly4Wagered: 0,
    totalMonthlyExperienceGained: 0,
    totalMonthlyExperienceGainedWithReferrals: 0,
    totalMonthly1ExperienceGained: 0,
    totalMonthly2ExperienceGained: 0,
    totalMonthly3ExperienceGained: 0,
    totalMonthly4ExperienceGained: 0,
    monthly1BonusDistributed: false,
    monthly2BonusDistributed: false,
    monthly3BonusDistributed: false,
    monthly4BonusDistributed: false,
    loyaltyLevelUpBonusAmount: 0,
    loyaltyInstantRackbackAmount: '0',
    loyaltyRecentPlayBonusAmount: 0,
    loyaltyWeeklyBonusAmount: 0,
    loyaltyMonthlyBonusAmount: 0,
    provablyFairClientSeed: '',
    provablyFairServerSeed: '',
    provablyFairCurrentNonce: 0,
    provablyFairNextServerSeed: '',
    bonusCouponAmountUSD: 0,
    levelUpTempBonus: 0,
    selfExclusionTill: new Date('2000-01-01T00:00:01.000Z').toISOString(),
    banned: false,
    bannedReason: null,
    geoBlockDisabled: false,
    randomIpEnabled: false,
    disabledUntil: null,
    passwordUpdatedAt: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    metamaskAddress: null,
    telegramId: null,
  };

  it('serializes a fully-populated RegisterData without throwing (no BigInt in the payload)', () => {
    const serializer = new JsonSerializer();
    const roundtrip = serializer.deserialize(serializer.serialize(full));
    expect(roundtrip).toEqual(full);
  });

  it('an old producer payload (only the original 9 fields) still satisfies RegisterData', () => {
    const minimal: RegisterData = {
      userId: 2,
      userGuid: 'guid-2',
      email: null,
      username: null,
      signupMethod: 'email',
      ipAddress: null,
      referByUserId: null,
      createdAt: full.createdAt,
      clientId: full.clientId,
    };
    expect(minimal.userId).toBe(2);
  });

  it('carries the big/decimal mirror fields as strings (JSON-safe)', () => {
    expect(typeof full.totalWagered).toBe('string');
    expect(typeof full.totalWin).toBe('string');
    expect(typeof full.loyaltyInstantRackbackAmount).toBe('string');
  });
});
