/**
 * GDPR Compliance Pub/Sub Consumer
 *
 * Shopify publishes compliance webhooks directly to the `nudgenest-compliance`
 * Pub/Sub topic (configured via `pubsub://nudgenest:nudgenest-compliance` in
 * shopify.app.toml). This plugin pulls from the `nudgenest-compliance-pull`
 * subscription and processes all three mandatory GDPR topics.
 *
 * Message format from Shopify:
 *   message.attributes['X-Shopify-Topic']       — e.g. "customers/data_request"
 *   message.attributes['X-Shopify-Shop-Domain'] — e.g. "store.myshopify.com"
 *   message.data                                 — JSON payload (base64, decoded by SDK)
 *
 * Topics handled:
 *   customers/data_request — acknowledge; data export is handled offline within 30 days
 *   customers/redact       — anonymise customer PII in reviews
 *   shop/redact            — anonymise all merchant + customer PII 48h after uninstall
 */
import Hapi from '@hapi/hapi';
import { Sentry } from '../lib/sentry';

const REDACTED = '[REDACTED]';
const SUBSCRIPTION_NAME = 'nudgenest-compliance-pull';

const complianceConsumerPlugin: Hapi.Plugin<null> = {
    name: 'complianceConsumer',
    dependencies: ['pubsub', 'prisma'],
    register: async (server: Hapi.Server) => {
        const { pubsub, prisma } = server.app;

        let subscription: any;
        try {
            subscription = pubsub.client.subscription(SUBSCRIPTION_NAME);
            const [exists] = await subscription.exists();
            if (!exists) {
                console.warn(
                    `⚠️  Compliance subscription "${SUBSCRIPTION_NAME}" not found — ` +
                    `GDPR Pub/Sub events will not be processed. ` +
                    `Run Pulumi to provision the topic and subscription.`
                );
                return;
            }
        } catch (err) {
            console.error('❌ Error initialising compliance subscription:', err);
            return;
        }

        const messageHandler = async (message: any) => {
            const topic: string = message.attributes?.['X-Shopify-Topic'] ?? '';
            const shopDomain: string = message.attributes?.['X-Shopify-Shop-Domain'] ?? '';

            let payload: any;
            try {
                payload = JSON.parse(message.data.toString('utf-8'));
            } catch {
                console.error('[GDPR] Failed to parse compliance message payload — nacking');
                message.nack();
                return;
            }

            console.log(`[GDPR] Received ${topic} for shop: ${shopDomain}`);

            try {
                switch (topic) {
                    // -----------------------------------------------------------------
                    // customers/data_request
                    // Customer requested a copy of their stored data.
                    // Acknowledge immediately — fulfil offline within 30 days.
                    // -----------------------------------------------------------------
                    case 'customers/data_request': {
                        const customerId = payload?.customer?.id;
                        const customerEmail = payload?.customer?.email;
                        console.log(
                            `[GDPR] data_request acknowledged — ` +
                            `shop: ${shopDomain}, customer: ${customerId} <${customerEmail}>`
                        );
                        // TODO: if a data-export feature is built, trigger it here.
                        break;
                    }

                    // -----------------------------------------------------------------
                    // customers/redact
                    // Anonymise PII for a specific customer across all their reviews.
                    // Keep review content (ratings/text) for aggregate stats.
                    // -----------------------------------------------------------------
                    case 'customers/redact': {
                        const customerEmail: string | undefined = payload?.customer?.email;
                        const customerId = payload?.customer?.id;

                        if (!customerEmail) {
                            console.warn(`[GDPR] customers/redact — no email in payload for ${shopDomain}`);
                            break;
                        }

                        const result = await prisma.reviews.updateMany({
                            where: { customerEmail },
                            data: {
                                customerEmail: `[REDACTED]-${customerId ?? 'unknown'}@redacted.invalid`,
                                customerName: REDACTED,
                                published: false,
                            },
                        });

                        console.log(
                            `[GDPR] customers/redact — ${result.count} reviews anonymised ` +
                            `for customer ${customerId} on ${shopDomain}`
                        );
                        break;
                    }

                    // -----------------------------------------------------------------
                    // shop/redact
                    // Sent 48h after app uninstall. Anonymise all merchant + customer
                    // PII. Retain non-personal data (ratings, billing history).
                    // -----------------------------------------------------------------
                    case 'shop/redact': {
                        const merchant = await prisma.merchants.findFirst({
                            where: { domains: shopDomain },
                            select: { id: true },
                        });

                        if (!merchant) {
                            console.log(`[GDPR] shop/redact — shop not found: ${shopDomain}, nothing to do`);
                            break;
                        }

                        const merchantId = merchant.id;
                        const anonToken = `redacted-${merchantId}`;

                        await prisma.reviews.updateMany({
                            where: { merchantId },
                            data: {
                                customerEmail: `${anonToken}@redacted.invalid`,
                                customerName: REDACTED,
                                published: false,
                            },
                        });

                        await prisma.merchants.update({
                            where: { id: merchantId },
                            data: {
                                email: `${anonToken}@redacted.invalid`,
                                name: anonToken,
                                shopId: anonToken,
                                domains: anonToken,
                                businessInfo: anonToken,
                                apiKey: null,
                                shopifyAccessToken: null,
                                address: {
                                    address1: REDACTED,
                                    address2: REDACTED,
                                    city: REDACTED,
                                    country: REDACTED,
                                    formatted: REDACTED,
                                    zip: REDACTED,
                                },
                                deleted: true,
                                redactedAt: new Date(),
                            },
                        });

                        console.log(
                            `[GDPR] shop/redact — all PII anonymised for ${shopDomain} (merchant: ${merchantId})`
                        );
                        break;
                    }

                    default:
                        console.warn(`[GDPR] Unknown compliance topic received: "${topic}" — acking to avoid redelivery`);
                }

                message.ack();
            } catch (err: any) {
                console.error(`[GDPR] Error processing ${topic} for ${shopDomain}:`, err.message);
                Sentry.captureException(err, {
                    tags: { component: 'complianceConsumer', topic, shopDomain },
                });
                // NACK so Pub/Sub retries — 30-day retention gives ample time
                message.nack();
            }
        };

        subscription.on('message', messageHandler);
        subscription.on('error', (err: any) => {
            console.error('[GDPR] Compliance subscription error:', err);
            Sentry.captureException(err, { tags: { component: 'complianceConsumer', type: 'subscription_error' } });
        });

        subscription.open();

        console.log(`✅ Compliance Pub/Sub consumer started — listening on "${SUBSCRIPTION_NAME}"`);

        server.ext('onPostStop', async () => {
            subscription.removeAllListeners();
            subscription.close();
        });
    },
};

export default complianceConsumerPlugin;
