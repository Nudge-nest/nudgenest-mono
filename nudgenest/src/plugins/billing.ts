'use strict';

import Hapi from '@hapi/hapi';
import Joi from 'joi';
import BillingService from '../services/billing';

const billingPlugin: Hapi.Plugin<any> = {
    name: 'billing',
    version: '1.0.0',
    dependencies: ['prisma', 'auth'],
    register: async (server: Hapi.Server) => {
        // API usage tracking middleware (runs on all authenticated routes)
        server.ext('onPostAuth', async (request, h) => {
            if (request.auth.isAuthenticated && request.auth.credentials) {
                const { merchantId } = request.auth.credentials as any;

                try {
                    await BillingService.trackUsage({
                        merchantId,
                        metricType: 'API_CALL',
                        quantity: 1,
                    });
                    request.logger.debug({ merchantId, metricType: 'API_CALL' }, 'API usage tracked');
                } catch (error: any) {
                    request.logger.warn({ merchantId, error: error.message }, 'API usage tracking failed');
                    if (error.message.includes('limit exceeded')) {
                        request.logger.error({ merchantId }, 'API usage limit exceeded');
                        return h.response({ error: 'API usage limit exceeded' }).code(429).takeover();
                    }
                }
            }
            return h.continue;
        });
        // Get all plans
        server.route({
            method: 'GET',
            path: '/api/v1/plans',
            options: {
                auth: false,
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const plans = await BillingService.getPlans();
                        request.logger.info('Retrieved billing plans');
                        return h.response({ data: { plans } }).code(200);
                    } catch (error: any) {
                        request.logger.error({ error }, 'Failed to retrieve billing plans');
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Get subscription details (authenticated)
        server.route({
            method: 'GET',
            path: '/api/v1/billing/subscription',
            options: {
                auth: 'apikey',
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const details = await BillingService.getSubscriptionDetails(merchantId);

                        if (!details) {
                            request.logger.warn({ merchantId }, 'No active subscription found');
                            return h.response({ error: 'No active subscription found' }).code(404);
                        }

                        request.logger.info({ merchantId, planTier: details.subscription.Plans.tier }, 'Retrieved subscription details');
                        return h.response({ data: details }).code(200);
                    } catch (error: any) {
                        request.logger.error({ merchantId: (request.auth.credentials as any)?.merchantId, error }, 'Failed to retrieve subscription details');
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Get subscription details by merchantId (public endpoint for Shopify app)
        server.route({
            method: 'GET',
            path: '/api/v1/billing/subscription/{merchantId}',
            options: {
                auth: { mode: 'try' },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.params as { merchantId: string };
                        const details = await BillingService.getSubscriptionDetails(merchantId);

                        if (!details) {
                            request.logger.warn({ merchantId }, 'No active subscription found');
                            return h.response({ data: null }).code(200);
                        }

                        request.logger.info({ merchantId, planTier: details.subscription.Plans.tier }, 'Retrieved subscription details');
                        return h.response({ data: details }).code(200);
                    } catch (error: any) {
                        request.logger.error({ merchantId: request.params.merchantId, error }, 'Failed to retrieve subscription details');
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Create subscription
        server.route({
            method: 'POST',
            path: '/api/v1/billing/subscription',
            options: {
                auth: 'apikey',
                validate: {
                    payload: Joi.object({
                        planId: Joi.string().required(),
                        trialDays: Joi.number().integer().min(0).default(0),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const { planId, trialDays } = request.payload as any;

                        const subscription = await BillingService.createSubscription({
                            merchantId,
                            planId,
                            trialDays,
                        });

                        return h.response({ data: { subscription } }).code(201);
                    } catch (error: any) {
                        server.log(['error', 'billing'], error);
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Change subscription plan
        server.route({
            method: 'PUT',
            path: '/api/v1/billing/subscription',
            options: {
                auth: 'apikey',
                validate: {
                    payload: Joi.object({
                        planId: Joi.string().required(),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const { planId } = request.payload as any;

                        const subscription = await BillingService.changeSubscription(merchantId, planId);

                        return h.response({ data: { subscription } }).code(200);
                    } catch (error: any) {
                        server.log(['error', 'billing'], error);
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Cancel subscription
        server.route({
            method: 'DELETE',
            path: '/api/v1/billing/subscription',
            options: {
                auth: 'apikey',
                validate: {
                    query: Joi.object({
                        immediate: Joi.boolean().default(false),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const { immediate } = request.query as any;

                        const subscription = await BillingService.cancelSubscription(merchantId, immediate);

                        return h.response({ data: { subscription } }).code(200);
                    } catch (error: any) {
                        server.log(['error', 'billing'], error);
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Get usage statistics
        server.route({
            method: 'GET',
            path: '/api/v1/billing/usage',
            options: {
                auth: 'apikey',
                validate: {
                    query: Joi.object({
                        periodStart: Joi.date().optional(),
                        periodEnd: Joi.date().optional(),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const { periodStart, periodEnd } = request.query as any;

                        const stats = await BillingService.getUsageStats(
                            merchantId,
                            periodStart ? new Date(periodStart) : undefined,
                            periodEnd ? new Date(periodEnd) : undefined
                        );

                        return h.response({ data: { usage: stats } }).code(200);
                    } catch (error: any) {
                        server.log(['error', 'billing'], error);
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        // Track usage (internal endpoint)
        server.route({
            method: 'POST',
            path: '/api/v1/billing/usage',
            options: {
                auth: 'apikey',
                validate: {
                    payload: Joi.object({
                        metricType: Joi.string()
                            .valid('REVIEW_REQUEST', 'EMAIL_SENT', 'SMS_SENT', 'API_CALL', 'STORAGE_GB')
                            .required(),
                        quantity: Joi.number().integer().min(1).required(),
                        metadata: Joi.object().optional(),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const { merchantId } = request.auth.credentials as any;
                        const { metricType, quantity, metadata } = request.payload as any;

                        const usageRecord = await BillingService.trackUsage({
                            merchantId,
                            metricType,
                            quantity,
                            metadata,
                        });

                        return h.response({ data: { usageRecord } }).code(201);
                    } catch (error: any) {
                        server.log(['error', 'billing'], error);
                        const code = error.message.includes('limit exceeded') ? 429 : 500;
                        return h.response({ error: error.message }).code(code);
                    }
                },
            },
        });

        // Sync Shopify subscription (webhook endpoint from Shopify app)
        server.route({
            method: 'POST',
            path: '/api/v1/billing/sync-shopify',
            options: {
                auth: { mode: 'try' },
                validate: {
                    payload: Joi.object({
                        merchantId: Joi.string().required(),
                        shopId: Joi.string().required(),
                        planTier: Joi.string().valid('FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE').required(),
                        shopifyChargeId: Joi.string().optional(),
                        status: Joi.string().valid('ACTIVE', 'ACCEPTED', 'CANCELLED', 'EXPIRED', 'FROZEN', 'PENDING').required(),
                        currentPeriodEnd: Joi.date().optional(),
                        billingOn: Joi.date().optional(),
                        webhookTopic: Joi.string().optional(),
                    }),
                },
                handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    try {
                        const {
                            merchantId,
                            shopId,
                            planTier,
                            shopifyChargeId,
                            status,
                            currentPeriodEnd,
                            billingOn,
                            webhookTopic,
                        } = request.payload as any;

                        request.logger.info(
                            {
                                merchantId,
                                shopId,
                                planTier,
                                status,
                                webhookTopic,
                            },
                            'Syncing Shopify subscription'
                        );

                        // Find the plan by tier
                        const plan = await BillingService.getPlanByTier(planTier);
                        if (!plan) {
                            request.logger.error({ planTier }, 'Plan not found');
                            return h.response({ error: `Plan not found for tier: ${planTier}` }).code(404);
                        }

                        // Get merchant
                        // shopId in DB is a Shopify GID (e.g. gid://shopify/Shop/67580297354)
                        // but the webhook sends the plain domain (e.g. nudgenest.myshopify.com)
                        // so we also check the domains field which stores the plain domain
                        const merchant = await request.server.app.prisma.merchants.findFirst({
                            where: {
                                OR: [
                                    { shopId: { contains: shopId } },
                                    { shopId: { contains: merchantId } },
                                    { domains: { contains: shopId } },
                                    { domains: { contains: merchantId } },
                                ],
                            },
                        });

                        if (!merchant) {
                            request.logger.error({ shopId, merchantId }, 'Merchant not found');
                            return h.response({ error: `Merchant not found for shopId: ${shopId}` }).code(404);
                        }

                        // Find existing active subscription
                        const existingSubscription = await request.server.app.prisma.subscriptions.findFirst({
                            where: {
                                merchantId: merchant.id,
                                status: 'ACTIVE',
                            },
                        });

                        const periodEnd = currentPeriodEnd
                            ? new Date(currentPeriodEnd)
                            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                        // Handle CANCELLED / EXPIRED — downgrade to FREE by switching the existing
                        // subscription's plan in-place. Never create a new subscription here because
                        // FREE subscriptions have shopifyChargeId = null, and the @unique constraint
                        // only allows one null value across the whole collection.
                        if (status === 'CANCELLED' || status === 'EXPIRED') {
                            const freePlan = await BillingService.getPlanByTier('FREE');
                            if (freePlan && existingSubscription) {
                                await request.server.app.prisma.subscriptions.update({
                                    where: { id: existingSubscription.id },
                                    data: {
                                        planId: freePlan.id,
                                        shopifyChargeId: null,
                                        currentPeriodEnd: periodEnd,
                                    },
                                });

                                request.logger.info({ merchantId: merchant.id, shopId }, 'Downgraded to FREE plan');
                                return h.response({
                                    data: {
                                        message: 'Subscription downgraded to FREE',
                                        planTier: 'FREE',
                                    },
                                }).code(200);
                            }
                            // No active subscription to downgrade — nothing to do
                            request.logger.info({ merchantId: merchant.id, shopId }, 'No active subscription to downgrade');
                            return h.response({
                                data: { message: 'No active subscription to update', planTier: 'FREE', status },
                            }).code(200);
                        }

                        // Handle ACTIVE / ACCEPTED — upgrade/switch to the new paid plan.
                        // We set shopifyChargeId directly in the create call to avoid a
                        // two-step create→update that could race, and to satisfy the @unique
                        // constraint atomically.
                        if (status === 'ACTIVE' || status === 'ACCEPTED') {
                            const now = new Date();

                            if (existingSubscription) {
                                if (existingSubscription.planId !== plan.id) {
                                    // Plan changed — cancel old subscription, create new one with
                                    // shopifyChargeId set in a single create call.
                                    await request.server.app.prisma.subscriptions.update({
                                        where: { id: existingSubscription.id },
                                        data: {
                                            status: 'CANCELED',
                                            canceledAt: now,
                                            shopifyChargeId: null,
                                        },
                                    });

                                    await request.server.app.prisma.subscriptions.create({
                                        data: {
                                            merchantId: merchant.id,
                                            planId: plan.id,
                                            status: 'ACTIVE',
                                            currentPeriodStart: now,
                                            currentPeriodEnd: periodEnd,
                                            shopifyChargeId: shopifyChargeId || null,
                                        },
                                    });

                                    request.logger.info(
                                        { merchantId: merchant.id, oldPlan: existingSubscription.planId, newPlan: plan.id },
                                        'Plan upgraded/changed'
                                    );
                                } else {
                                    // Same plan — just update metadata (e.g. renewal)
                                    await request.server.app.prisma.subscriptions.update({
                                        where: { id: existingSubscription.id },
                                        data: {
                                            shopifyChargeId: shopifyChargeId || existingSubscription.shopifyChargeId,
                                            currentPeriodEnd: periodEnd,
                                        },
                                    });
                                }
                            } else {
                                // No existing subscription — create one with shopifyChargeId set directly
                                await request.server.app.prisma.subscriptions.create({
                                    data: {
                                        merchantId: merchant.id,
                                        planId: plan.id,
                                        status: 'ACTIVE',
                                        currentPeriodStart: now,
                                        currentPeriodEnd: periodEnd,
                                        shopifyChargeId: shopifyChargeId || null,
                                    },
                                });

                                request.logger.info({ merchantId: merchant.id, planId: plan.id }, 'Created new subscription');
                            }
                        }

                        return h.response({
                            data: {
                                message: 'Subscription synced successfully',
                                planTier,
                                status,
                            },
                        }).code(200);
                    } catch (error: any) {
                        request.logger.error({ error }, 'Failed to sync Shopify subscription');
                        return h.response({ error: error.message }).code(500);
                    }
                },
            },
        });

        server.log(['info', 'billing'], 'Billing routes registered');
    },
};

export default billingPlugin;
