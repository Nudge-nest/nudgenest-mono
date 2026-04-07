import { describe, it, expect, beforeEach } from '@jest/globals';
import { BillingService } from '../../services/billing';
import { prismaMock } from '../mocks/prisma';

const billingService = new BillingService();

const mockPlan = {
    id: 'test-plan-id',
    name: 'Free',
    displayName: 'Free Plan',
    tier: 'FREE',
    price: 0,
    billingInterval: 'MONTHLY',
    isActive: true,
    limits: {
        reviewRequestsPerMonth: 50,
        emailsPerMonth: 50,
        smsPerMonth: 0,
        apiCallsPerDay: 100,
    },
    features: {},
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const mockMerchant = {
    id: 'test-merchant-id',
    shopId: `test-shop-${Date.now()}`,
    domains: 'test-shop.example.com',
    currencyCode: 'USD',
    name: 'Test Shop',
    businessInfo: 'Test Business Info',
    email: `test-${Date.now()}@example.com`,
    apiKey: `test-key-${Date.now()}`,
    address: {
        address1: '123 Test St',
        address2: '',
        city: 'Test City',
        country: 'US',
        zip: '12345',
        formatted: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const mockSubscription = {
    id: 'test-subscription-id',
    merchantId: 'test-merchant-id',
    planId: 'test-plan-id',
    status: 'ACTIVE',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trialStart: null,
    trialEnd: null,
    cancelAt: null,
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    Plans: mockPlan,
} as any;

describe('BillingService', () => {
    beforeEach(() => {
        prismaMock.merchants.create.mockResolvedValue(mockMerchant);
        prismaMock.plans.findMany.mockResolvedValue([mockPlan]);
        prismaMock.plans.findUnique.mockResolvedValue(mockPlan);
        prismaMock.subscriptions.create.mockResolvedValue(mockSubscription);
        prismaMock.subscriptions.findFirst.mockResolvedValue(mockSubscription);
        prismaMock.subscriptions.update.mockResolvedValue({ ...mockSubscription, status: 'CANCELED' });
        prismaMock.subscriptions.delete.mockResolvedValue(mockSubscription);
        prismaMock.usageRecords.create.mockResolvedValue({ id: 'usage-id', metricType: 'REVIEW_REQUEST', quantity: 1 } as any);
        prismaMock.usageRecords.findMany.mockResolvedValue([]);
        prismaMock.merchants.delete.mockResolvedValue(mockMerchant);
    });

    describe('createSubscription', () => {
        it('should create a new subscription', async () => {
            const subscription = await billingService.createSubscription({
                merchantId: mockMerchant.id,
                planId: mockPlan.id,
            });

            expect(subscription).toBeDefined();
            expect(prismaMock.plans.findUnique).toHaveBeenCalledWith({ where: { id: mockPlan.id } });
            expect(prismaMock.subscriptions.create).toHaveBeenCalled();
        });

        it('should throw error for non-existent plan', async () => {
            prismaMock.plans.findUnique.mockResolvedValue(null as any);

            await expect(
                billingService.createSubscription({ merchantId: mockMerchant.id, planId: 'non-existent-plan' })
            ).rejects.toThrow('Plan not found');
        });
    });

    describe('trackUsage', () => {
        it('should track usage for valid merchant', async () => {
            await expect(
                billingService.trackUsage({ merchantId: mockMerchant.id, metricType: 'REVIEW_REQUEST', quantity: 1 })
            ).resolves.not.toThrow();

            expect(prismaMock.usageRecords.create).toHaveBeenCalled();
        });

        it('should throw error when no active subscription found', async () => {
            prismaMock.subscriptions.findFirst.mockResolvedValue(null as any);

            await expect(
                billingService.trackUsage({ merchantId: mockMerchant.id, metricType: 'REVIEW_REQUEST', quantity: 1 })
            ).rejects.toThrow('No active subscription found');
        });
    });

    describe('getUsageStats', () => {
        it('should return usage stats for merchant', async () => {
            prismaMock.usageRecords.findMany.mockResolvedValue([
                { id: 'u1', metricType: 'REVIEW_REQUEST', quantity: 1 } as any,
                { id: 'u2', metricType: 'EMAIL_SENT', quantity: 1 } as any,
            ]);

            const stats = await billingService.getUsageStats(mockMerchant.id);

            expect(stats).toBeDefined();
            expect(stats['REVIEW_REQUEST']).toBe(1);
            expect(stats['EMAIL_SENT']).toBe(1);
        });

        it('should return empty stats for merchant with no usage', async () => {
            prismaMock.usageRecords.findMany.mockResolvedValue([]);

            const stats = await billingService.getUsageStats(mockMerchant.id);
            expect(stats).toEqual({});
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel active subscription', async () => {
            // cancelSubscription takes merchantId, finds subscription, then cancels at period end
            const result = await billingService.cancelSubscription(mockMerchant.id);

            expect(result).toBeDefined();
            expect(prismaMock.subscriptions.findFirst).toHaveBeenCalled();
            expect(prismaMock.subscriptions.update).toHaveBeenCalled();
        });

        it('should throw error when no active subscription found', async () => {
            prismaMock.subscriptions.findFirst.mockResolvedValue(null as any);

            await expect(
                billingService.cancelSubscription('non-existent-merchant')
            ).rejects.toThrow('No active subscription found');
        });
    });
});
