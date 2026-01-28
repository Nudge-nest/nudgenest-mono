import { PrismaClient } from '../../generated/prisma/prisma/client';

const prisma = new PrismaClient();

export interface CreateSubscriptionInput {
    merchantId: string;
    planId: string;
    trialDays?: number;
}

export interface UsageTrackingInput {
    merchantId: string;
    metricType: 'REVIEW_REQUEST' | 'EMAIL_SENT' | 'SMS_SENT' | 'API_CALL' | 'STORAGE_GB';
    quantity: number;
    metadata?: any;
}

export class BillingService {
    /**
     * Create a new subscription for a merchant
     */
    async createSubscription(input: CreateSubscriptionInput) {
        const { merchantId, planId, trialDays = 0 } = input;

        const plan = await prisma.plans.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            throw new Error('Plan not found');
        }

        const now = new Date();
        const trialStart = trialDays > 0 ? now : null;
        const trialEnd = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
        const periodStart = trialEnd || now;
        const periodEnd = new Date(
            periodStart.getTime() +
                (plan.billingInterval === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000
        );

        const subscription = await prisma.subscriptions.create({
            data: {
                merchantId,
                planId,
                status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                trialStart,
                trialEnd,
            },
            include: {
                Plans: true,
            },
        });

        return subscription;
    }

    /**
     * Track usage for a merchant
     */
    async trackUsage(input: UsageTrackingInput) {
        const { merchantId, metricType, quantity, metadata } = input;

        // Get active subscription
        const subscription = await prisma.subscriptions.findFirst({
            where: {
                merchantId,
                status: { in: ['ACTIVE', 'TRIALING'] },
            },
            include: {
                Plans: true,
            },
        });

        if (!subscription) {
            throw new Error('No active subscription found');
        }

        // Check if usage is within limits
        const isWithinLimit = await this.checkUsageLimit(merchantId, metricType, quantity, subscription.Plans);

        if (!isWithinLimit) {
            throw new Error(`Usage limit exceeded for ${metricType}`);
        }

        // Record usage
        const usageRecord = await prisma.usageRecords.create({
            data: {
                subscriptionId: subscription.id,
                merchantId,
                metricType,
                quantity,
                metadata,
            },
        });

        return usageRecord;
    }

    /**
     * Check if usage is within plan limits
     */
    private async checkUsageLimit(
        merchantId: string,
        metricType: string,
        additionalQuantity: number,
        plan: any
    ): Promise<boolean> {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get current month usage
        const usageRecords = await prisma.usageRecords.findMany({
            where: {
                merchantId,
                metricType: metricType as any,
                timestamp: {
                    gte: periodStart,
                },
            },
        });

        const currentUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);
        const totalUsage = currentUsage + additionalQuantity;

        // Check limits
        const limits = plan.limits;
        switch (metricType) {
            case 'REVIEW_REQUEST':
                return limits.reviewRequestsPerMonth === -1 || totalUsage <= limits.reviewRequestsPerMonth;
            case 'EMAIL_SENT':
                return limits.emailsPerMonth === -1 || totalUsage <= limits.emailsPerMonth;
            case 'SMS_SENT':
                return limits.smsPerMonth === -1 || totalUsage <= limits.smsPerMonth;
            case 'API_CALL':
                // Daily limit check
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dailyUsage = await prisma.usageRecords.aggregate({
                    where: {
                        merchantId,
                        metricType: 'API_CALL',
                        timestamp: { gte: today },
                    },
                    _sum: { quantity: true },
                });
                const todayTotal = (dailyUsage._sum.quantity || 0) + additionalQuantity;
                return limits.apiCallsPerDay === -1 || todayTotal <= limits.apiCallsPerDay;
            default:
                return true;
        }
    }

    /**
     * Get usage statistics for a merchant
     */
    async getUsageStats(merchantId: string, periodStart?: Date, periodEnd?: Date) {
        const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = periodEnd || new Date();

        const usageRecords = await prisma.usageRecords.findMany({
            where: {
                merchantId,
                timestamp: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Aggregate by metric type
        const stats = usageRecords.reduce(
            (acc, record) => {
                if (!acc[record.metricType]) {
                    acc[record.metricType] = 0;
                }
                acc[record.metricType] += record.quantity;
                return acc;
            },
            {} as Record<string, number>
        );

        return stats;
    }

    /**
     * Get subscription with usage details
     */
    async getSubscriptionDetails(merchantId: string) {
        const subscription = await prisma.subscriptions.findFirst({
            where: {
                merchantId,
                status: { in: ['ACTIVE', 'TRIALING'] },
            },
            include: {
                Plans: true,
            },
        });

        if (!subscription) {
            return null;
        }

        const usageStats = await this.getUsageStats(
            merchantId,
            subscription.currentPeriodStart,
            subscription.currentPeriodEnd
        );

        return {
            subscription,
            usage: usageStats,
            limits: subscription.Plans.limits,
        };
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(merchantId: string, immediate: boolean = false) {
        const subscription = await prisma.subscriptions.findFirst({
            where: {
                merchantId,
                status: { in: ['ACTIVE', 'TRIALING'] },
            },
        });

        if (!subscription) {
            throw new Error('No active subscription found');
        }

        const cancelAt = immediate ? new Date() : subscription.currentPeriodEnd;

        return await prisma.subscriptions.update({
            where: { id: subscription.id },
            data: {
                status: immediate ? 'CANCELED' : subscription.status,
                cancelAt,
                canceledAt: immediate ? new Date() : null,
            },
        });
    }

    /**
     * Upgrade/downgrade subscription
     */
    async changeSubscription(merchantId: string, newPlanId: string) {
        const currentSubscription = await prisma.subscriptions.findFirst({
            where: {
                merchantId,
                status: { in: ['ACTIVE', 'TRIALING'] },
            },
        });

        if (!currentSubscription) {
            throw new Error('No active subscription found');
        }

        const newPlan = await prisma.plans.findUnique({
            where: { id: newPlanId },
        });

        if (!newPlan) {
            throw new Error('New plan not found');
        }

        // Cancel current subscription at end of period
        await this.cancelSubscription(merchantId, false);

        // Create new subscription starting at end of current period
        const now = new Date();
        const periodStart = currentSubscription.currentPeriodEnd;
        const periodEnd = new Date(
            periodStart.getTime() +
                (newPlan.billingInterval === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000
        );

        return await prisma.subscriptions.create({
            data: {
                merchantId,
                planId: newPlanId,
                status: 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
            },
            include: {
                Plans: true,
            },
        });
    }

    /**
     * Generate invoice for a billing period
     */
    async generateInvoice(subscriptionId: string) {
        const subscription = await prisma.subscriptions.findUnique({
            where: { id: subscriptionId },
            include: {
                Plans: true,
                Merchants: true,
            },
        });

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const invoiceNumber = `INV-${Date.now()}-${subscription.merchantId.slice(-6)}`;

        const lineItems = [
            {
                description: `${subscription.Plans.displayName} Plan (${subscription.Plans.billingInterval})`,
                quantity: 1,
                unitPrice: subscription.Plans.price,
                amount: subscription.Plans.price,
                metadata: {},
            },
        ];

        const subtotal = subscription.Plans.price;
        const tax = 0; // TODO: Calculate tax based on merchant location
        const total = subtotal + tax;

        return await prisma.invoices.create({
            data: {
                merchantId: subscription.merchantId,
                subscriptionId: subscription.id,
                invoiceNumber,
                status: 'PENDING',
                subtotal,
                tax,
                total,
                currency: subscription.Merchants.currencyCode,
                periodStart: subscription.currentPeriodStart,
                periodEnd: subscription.currentPeriodEnd,
                dueDate: subscription.currentPeriodEnd,
                lineItems,
            },
        });
    }

    /**
     * Get all plans
     */
    async getPlans() {
        return await prisma.plans.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
    }
}

export default new BillingService();
