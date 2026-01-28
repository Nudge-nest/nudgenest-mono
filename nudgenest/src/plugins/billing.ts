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

        // Get subscription details
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

        server.log(['info', 'billing'], 'Billing routes registered');
    },
};

export default billingPlugin;
