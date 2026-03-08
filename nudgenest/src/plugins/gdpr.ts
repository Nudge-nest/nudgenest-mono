/**
 * GDPR Compliance Plugin
 *
 * Handles the three mandatory GDPR webhooks required for Shopify App Store submission:
 *
 * POST /api/v1/gdpr/customers/data-request
 *   Acknowledge a customer data request. Log the request for compliance.
 *
 * POST /api/v1/gdpr/customers/redact
 *   Redact customer PII from all reviews for the given customer email.
 *   Replaces customerEmail, customerName, customerPhone with anonymised values.
 *
 * POST /api/v1/gdpr/shop/redact
 *   Delete all data for a shop 48 hours after uninstall:
 *   reviews, configurations, subscriptions, merchant record.
 */
import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import { Sentry } from '../lib/sentry';

const REDACTED = '[REDACTED]';

const gdprPlugin: Hapi.Plugin<null> = {
    name: 'gdpr',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {

        // -----------------------------------------------------------------------
        // POST /api/v1/gdpr/customers/data-request
        // Acknowledge a customer data request — no deletion needed, just log it.
        // -----------------------------------------------------------------------
        server.route({
            method: 'POST',
            path: '/api/v1/gdpr/customers/data-request',
            options: {
                auth: false,
                tags: ['api', 'gdpr'],
            },
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                const { shop, payload } = request.payload as any;
                const customerId = payload?.customer?.id;
                const customerEmail = payload?.customer?.email;

                request.logger.info(
                    { shop, customerId, customerEmail },
                    '[GDPR] customers/data_request received — acknowledged'
                );

                // Shopify requires a 200 acknowledgment within 48 hours.
                // Actual data export (if needed) would be fulfilled offline.
                return h.response({
                    ok: true,
                    message: 'Data request acknowledged',
                    shop,
                    customerId,
                }).code(200);
            },
        });

        // -----------------------------------------------------------------------
        // POST /api/v1/gdpr/customers/redact
        // Anonymise all reviews for the given customer email.
        // -----------------------------------------------------------------------
        server.route({
            method: 'POST',
            path: '/api/v1/gdpr/customers/redact',
            options: {
                auth: false,
                tags: ['api', 'gdpr'],
            },
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                const { prisma } = request.server.app;
                const { shop, payload } = request.payload as any;

                const customerEmail = payload?.customer?.email;
                const customerId = payload?.customer?.id;

                request.logger.info(
                    { shop, customerId, customerEmail },
                    '[GDPR] customers/redact — starting PII removal'
                );

                try {
                    if (!customerEmail) {
                        request.logger.warn({ shop, customerId }, '[GDPR] customers/redact — no email in payload');
                        return h.response({ ok: true, message: 'No customer email to redact' }).code(200);
                    }

                    // Find all reviews for this customer email across all merchants
                    const reviews = await prisma.reviews.findMany({
                        where: { customerEmail },
                        select: { id: true },
                    });

                    if (reviews.length === 0) {
                        request.logger.info({ shop, customerEmail }, '[GDPR] No reviews found for customer');
                        return h.response({ ok: true, redacted: 0 }).code(200);
                    }

                    // Anonymise PII fields — keep review content (ratings/text) for aggregate stats
                    await prisma.reviews.updateMany({
                        where: { customerEmail },
                        data: {
                            customerEmail: `${REDACTED}-${customerId ?? 'unknown'}@redacted.invalid`,
                            customerName: REDACTED,
                            customerPhone: REDACTED,
                        },
                    });

                    request.logger.info(
                        { shop, customerEmail, count: reviews.length },
                        '[GDPR] customers/redact — PII removed from reviews'
                    );

                    return h.response({ ok: true, redacted: reviews.length }).code(200);
                } catch (err: any) {
                    request.logger.error({ err }, '[GDPR] customers/redact failed');
                    Sentry.captureException(err, { tags: { component: 'gdpr', action: 'customers/redact' } });
                    throw Boom.internal('Failed to process customer redaction');
                }
            },
        });

        // -----------------------------------------------------------------------
        // POST /api/v1/gdpr/shop/redact
        // Delete ALL data for a shop 48 hours after it uninstalls the app.
        // -----------------------------------------------------------------------
        server.route({
            method: 'POST',
            path: '/api/v1/gdpr/shop/redact',
            options: {
                auth: false,
                tags: ['api', 'gdpr'],
            },
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                const { prisma } = request.server.app;
                const { shop } = request.payload as any;

                request.logger.info({ shop }, '[GDPR] shop/redact — starting full shop data deletion');

                try {
                    // Find the merchant by shopId
                    const merchant = await prisma.merchants.findFirst({
                        where: { shopId: shop },
                        select: { id: true },
                    });

                    if (!merchant) {
                        request.logger.info({ shop }, '[GDPR] shop/redact — shop not found, nothing to delete');
                        return h.response({ ok: true, message: 'Shop not found' }).code(200);
                    }

                    const merchantId = merchant.id;

                    // Delete in dependency order:
                    // 1. Usage records (reference subscriptions)
                    await prisma.usageRecords.deleteMany({ where: { merchantId } });
                    // 2. Subscriptions (reference merchant)
                    await prisma.subscriptions.deleteMany({ where: { merchantId } });
                    // 3. Reviews (reference merchant)
                    await prisma.reviews.deleteMany({ where: { merchantId } });
                    // 4. Configurations (reference merchant)
                    await prisma.configurations.deleteMany({ where: { merchantId } });
                    // 5. Merchant record itself
                    await prisma.merchants.delete({ where: { id: merchantId } });

                    request.logger.info({ shop, merchantId }, '[GDPR] shop/redact — all data deleted');

                    return h.response({ ok: true, deleted: true, merchantId }).code(200);
                } catch (err: any) {
                    request.logger.error({ err }, '[GDPR] shop/redact failed');
                    Sentry.captureException(err, { tags: { component: 'gdpr', action: 'shop/redact' } });
                    throw Boom.internal('Failed to process shop redaction');
                }
            },
        });

        server.log(['info', 'gdpr'], '✅ GDPR plugin registered — 3 mandatory endpoints active');
    },
};

export default gdprPlugin;
