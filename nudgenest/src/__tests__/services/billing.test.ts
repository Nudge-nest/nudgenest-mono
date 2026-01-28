import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BillingService } from '../../services/billing.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const billingService = new BillingService();

describe('BillingService', () => {
    let testMerchantId: string;
    let testSubscriptionId: string;

    beforeEach(async () => {
        const merchant = await prisma.merchant.create({
            data: {
                shopId: `test-shop-${Date.now()}`,
                shopName: 'Test Shop',
                email: `test-${Date.now()}@example.com`,
                accessToken: 'test-token',
                apiKey: `test-key-${Date.now()}`,
            },
        });
        testMerchantId = merchant.id;
    });

    afterEach(async () => {
        if (testSubscriptionId) {
            await prisma.subscription.delete({ where: { id: testSubscriptionId } }).catch(() => {});
        }
        await prisma.merchant.delete({ where: { id: testMerchantId } }).catch(() => {});
    });

    describe('createSubscription', () => {
        it('should create a new subscription', async () => {
            const plans = await prisma.plans.findMany();
            const planId = plans[0].id;

            const subscription = await billingService.createSubscription(testMerchantId, planId);
            testSubscriptionId = subscription.id;

            expect(subscription).toBeDefined();
            expect(subscription.merchantId).toBe(testMerchantId);
            expect(subscription.planId).toBe(planId);
            expect(subscription.status).toBe('ACTIVE');
        });

        it('should throw error for non-existent merchant', async () => {
            await expect(
                billingService.createSubscription('non-existent-id', 'plan-id')
            ).rejects.toThrow();
        });
    });

    describe('trackUsage', () => {
        beforeEach(async () => {
            const plans = await prisma.plans.findMany();
            const subscription = await billingService.createSubscription(testMerchantId, plans[0].id);
            testSubscriptionId = subscription.id;
        });

        it('should track usage for valid merchant', async () => {
            await expect(
                billingService.trackUsage(testMerchantId, 'REVIEW_REQUEST')
            ).resolves.not.toThrow();
        });

        it('should throw error for non-existent merchant', async () => {
            await expect(
                billingService.trackUsage('non-existent-id', 'REVIEW_REQUEST')
            ).rejects.toThrow();
        });
    });

    describe('getUsageStats', () => {
        beforeEach(async () => {
            const plans = await prisma.plans.findMany();
            const subscription = await billingService.createSubscription(testMerchantId, plans[0].id);
            testSubscriptionId = subscription.id;
        });

        it('should return usage stats for merchant', async () => {
            await billingService.trackUsage(testMerchantId, 'REVIEW_REQUEST');
            await billingService.trackUsage(testMerchantId, 'EMAIL_SENT');

            const stats = await billingService.getUsageStats(testMerchantId);

            expect(stats).toBeDefined();
            expect(stats.REVIEW_REQUEST).toBe(1);
            expect(stats.EMAIL_SENT).toBe(1);
        });

        it('should return empty stats for merchant with no usage', async () => {
            const stats = await billingService.getUsageStats(testMerchantId);
            expect(stats).toEqual({});
        });
    });

    describe('cancelSubscription', () => {
        beforeEach(async () => {
            const plans = await prisma.plans.findMany();
            const subscription = await billingService.createSubscription(testMerchantId, plans[0].id);
            testSubscriptionId = subscription.id;
        });

        it('should cancel active subscription', async () => {
            const cancelled = await billingService.cancelSubscription(testSubscriptionId);

            expect(cancelled).toBeDefined();
            expect(cancelled.status).toBe('CANCELLED');
        });

        it('should throw error for non-existent subscription', async () => {
            await expect(
                billingService.cancelSubscription('non-existent-id')
            ).rejects.toThrow();
        });
    });
});
