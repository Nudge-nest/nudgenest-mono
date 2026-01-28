import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BillingService } from '../../services/billing';
import { PrismaClient } from '../../../generated/prisma/prisma/client';

const prisma = new PrismaClient();
const billingService = new BillingService();

describe('BillingService', () => {
    let testMerchantId: string;
    let testSubscriptionId: string;

    beforeEach(async () => {
        const merchant = await prisma.merchants.create({
            data: {
                shopId: `test-shop-${Date.now()}`,
                domains: 'test-shop.example.com',
                currencyCode: 'USD',
                name: 'Test Shop',
                businessInfo: 'Test Business Info',
                email: `test-${Date.now()}@example.com`,
                address: {
                    address1: '123 Test St',
                    address2: '',
                    city: 'Test City',
                    country: 'US',
                    zip: '12345',
                    formatted: [],
                },
                apiKey: `test-key-${Date.now()}`,
            },
        });
        testMerchantId = merchant.id;
    });

    afterEach(async () => {
        if (testSubscriptionId) {
            await prisma.subscriptions.delete({ where: { id: testSubscriptionId } }).catch(() => {});
        }
        await prisma.merchants.delete({ where: { id: testMerchantId } }).catch(() => {});
    });

    describe('createSubscription', () => {
        it('should create a new subscription', async () => {
            const plans = await prisma.plans.findMany();
            const planId = plans[0].id;

            const subscription = await billingService.createSubscription({ merchantId: testMerchantId, planId });
            testSubscriptionId = subscription.id;

            expect(subscription).toBeDefined();
            expect(subscription.merchantId).toBe(testMerchantId);
            expect(subscription.planId).toBe(planId);
            expect(subscription.status).toBe('ACTIVE');
        });

        it('should throw error for non-existent merchant', async () => {
            await expect(
                billingService.createSubscription({ merchantId: 'non-existent-id', planId: 'plan-id' })
            ).rejects.toThrow();
        });
    });

    describe('trackUsage', () => {
        beforeEach(async () => {
            const plans = await prisma.plans.findMany();
            const subscription = await billingService.createSubscription({ merchantId: testMerchantId, planId: plans[0].id });
            testSubscriptionId = subscription.id;
        });

        it('should track usage for valid merchant', async () => {
            await expect(
                billingService.trackUsage({ merchantId: testMerchantId, metricType: 'REVIEW_REQUEST', quantity: 1 })
            ).resolves.not.toThrow();
        });

        it('should throw error for non-existent merchant', async () => {
            await expect(
                billingService.trackUsage({ merchantId: 'non-existent-id', metricType: 'REVIEW_REQUEST', quantity: 1 })
            ).rejects.toThrow();
        });
    });

    describe('getUsageStats', () => {
        beforeEach(async () => {
            const plans = await prisma.plans.findMany();
            const subscription = await billingService.createSubscription({ merchantId: testMerchantId, planId: plans[0].id });
            testSubscriptionId = subscription.id;
        });

        it('should return usage stats for merchant', async () => {
            await billingService.trackUsage({ merchantId: testMerchantId, metricType: 'REVIEW_REQUEST', quantity: 1 });
            await billingService.trackUsage({ merchantId: testMerchantId, metricType: 'EMAIL_SENT', quantity: 1 });

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
            const subscription = await billingService.createSubscription({ merchantId: testMerchantId, planId: plans[0].id });
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
