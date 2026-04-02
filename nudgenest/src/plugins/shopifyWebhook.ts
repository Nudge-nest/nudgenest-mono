/*Handles receiving webhooks notification from shopify via api endpoint and publishing to exchange*/
import Hapi from '@hapi/hapi';
import crypto from 'crypto';

import * as dotenv from 'dotenv';

import {
    buildPublishJson,
    createNewReview,
    extractMessagingContentFromShopifyData,
    extractShopifyDataForRabbitMessaging,
    getMerchantWithBusinessInfo,
} from '../utils/reviews';
import { isRabbitReviewRequestMessageValid, sampleMessaging } from '../messagesSchema';
import { convertObjectToBuffer, createMerchantEmailMessagingTemplate } from './merchant';
import { enrichLineItemsWithImages } from '../utils/shopify';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        shopifyWebhook: any;
    }
}

const shopifyWebhookPlugin: Hapi.Plugin<null> = {
    name: 'shopifyWebhook',
    dependencies: ['pubsub'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'POST',
                path: '/api/v1/shopify-webhook',
                handler: webhookMessageHandler,
                options: {
                    auth: false,
                    payload: {
                        parse: false,
                        allow: 'application/json',
                        output: 'data', // Get raw string instead of buffer
                    },
                },
            },
        ]);
    },
};

const verifyShopifyHMAC = (data: string, hmacHeader: string, secret: string): boolean => {
    const hash = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64');
    return hash === hmacHeader;
};

const webhookMessageHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    request.logger.info({ headers: request.headers }, 'Shopify webhook received');

    // HMAC verification
    const hmacHeader = request.headers['x-shopify-hmac-sha256'];
    const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET || '';

    if (!hmacHeader || !shopifyWebhookSecret) {
        request.logger.warn('Missing HMAC header or Shopify webhook secret');
        return h.response({ error: 'Unauthorized' }).code(401);
    }

    // Get raw body as string (handle both Buffer and string)
    let rawBody: string;
    if (Buffer.isBuffer(request.payload)) {
        rawBody = request.payload.toString('utf8');
    } else {
        rawBody = request.payload as string;
    }

    if (!verifyShopifyHMAC(rawBody, hmacHeader as string, shopifyWebhookSecret)) {
        request.logger.warn('HMAC verification failed');
        return h.response({ error: 'Invalid HMAC' }).code(403);
    }

    request.logger.info('HMAC verification successful');

    // Parse JSON after HMAC verification
    const payload = JSON.parse(rawBody);
    const { pubsub, prisma } = request.server.app;
    const { messagingTopic, client: _client } = pubsub;
    const topic = request.headers['x-shopify-topic'];

    console.log('Webhook topic:', topic);

    // Only process orders/create — reject anything else gracefully
    if (topic !== 'orders/create') {
        console.log(`Ignoring unhandled topic: ${topic}`);
        return h.response({ message: 'Topic not handled' }).code(200);
    }

    const { customer_locale, order_number } = payload;

    if (!order_number) {
        console.log('Missing order_number, skipping webhook');
        return h.response({ message: 'Missing order_number' }).code(200);
    }

    // customer_locale is not always present, default to 'en'
    if (!customer_locale) {
        console.warn('Warning: customer_locale missing, using default "en"');
        customer_locale = 'en';
        payload.customer_locale = 'en';
    }

    try {
        const reviewDataFromPayload = extractShopifyDataForRabbitMessaging(payload);
        console.log('Extracted review data:', reviewDataFromPayload);

        // Detailed logging of line_items structure to verify image data
        console.log('🔍 Examining line_items structure (before enrichment):');
        if (reviewDataFromPayload.line_items && reviewDataFromPayload.line_items.length > 0) {
            reviewDataFromPayload.line_items.forEach((item: any, index: number) => {
                console.log(`  Item ${index + 1}:`, {
                    name: item.name,
                    price: item.price,
                    product_id: item.product_id,
                    hasImage: !!item.image,
                    imageType: typeof item.image,
                    imageKeys: item.image ? Object.keys(item.image) : 'N/A',
                    imageSrc: item.image?.src || item.image || 'No image'
                });
            });
        } else {
            console.log('  ⚠️ No line_items found in payload');
        }

        const merchantData = await getMerchantWithBusinessInfo(
            prisma,
            reviewDataFromPayload.merchant_business_entity_id
        );
        console.log('Found merchant:', merchantData.id);

        // Enrich line items with product images from Shopify API
        // Extract shop domain from headers (x-shopify-shop-domain)
        const shopDomain = request.headers['x-shopify-shop-domain'] as string;

        console.log(`🔍 Image enrichment check: shopDomain=${shopDomain}`);

        if (shopDomain) {
            // Enrich line items with images using per-merchant access token (falls back to env var)
            reviewDataFromPayload.line_items = await enrichLineItemsWithImages(
                reviewDataFromPayload.line_items,
                shopDomain,
                merchantData.shopifyAccessToken ?? null
            );

            // Log enriched line items
            console.log('🔍 Line items after image enrichment:');
            reviewDataFromPayload.line_items.forEach((item: any, index: number) => {
                console.log(`  Item ${index + 1}:`, {
                    name: item.name,
                    hasImage: !!item.image,
                    imageSrc: item.image?.src || 'No image'
                });
            });
        } else {
            console.log(`⚠️ Skipping image enrichment: shopDomain missing`);
        }

        const createNewReviewToDb = await createNewReview(prisma, reviewDataFromPayload, merchantData.id, merchantData.apiKey);
        console.log('Created review:', createNewReviewToDb.id, 'with merchantApiKey:', !!createNewReviewToDb.merchantApiKey);

        // -----------------------------------------------------------------------
        // Delayed initial email: read merchant's emailSchedule config.
        // If delayDays > 0, skip the customer email now — the reminderScheduler
        // will send it once scheduledEmailAt has elapsed.
        // The merchant notification is always sent immediately.
        // -----------------------------------------------------------------------
        const merchantConfig = await prisma.configurations.findFirst({
            where: { merchantId: merchantData.id },
        });
        const emailScheduleField = merchantConfig?.emailSchedule?.find(
            (f: any) => f.key === 'initialEmailDelayDays'
        );
        const delayDays = parseInt(emailScheduleField?.value ?? '0', 10);
        const now = new Date();
        const scheduledEmailAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);

        // Persist scheduledEmailAt (and initialEmailSentAt if sending immediately)
        await prisma.reviews.update({
            where: { id: createNewReviewToDb.id },
            data: {
                scheduledEmailAt,
                ...(delayDays === 0 ? { initialEmailSentAt: now } : {}),
            },
        });

        console.log(`📅 Email delay: ${delayDays} day(s). Scheduled for: ${scheduledEmailAt.toISOString()}`);

        // Build message payloads
        const reviewMessageContent = extractMessagingContentFromShopifyData(
            reviewDataFromPayload,
            createNewReviewToDb.id,
            merchantData.id
        );
        const reviewToMessagingChannelJSON = buildPublishJson(reviewMessageContent, sampleMessaging);
        const reviewMessageToMerchantJSON = createMerchantEmailMessagingTemplate(
            merchantData,
            sampleMessaging,
            'new-review-merchant'
        );
        if (
            !isRabbitReviewRequestMessageValid(reviewToMessagingChannelJSON) ||
            !isRabbitReviewRequestMessageValid(reviewMessageToMerchantJSON)
        )
            throw new Error('Invalid messaging data to publish');

        const messageBuffer2 = convertObjectToBuffer(reviewMessageToMerchantJSON);

        if (delayDays === 0) {
            // Send both messages immediately
            const messageBuffer1 = convertObjectToBuffer(reviewToMessagingChannelJSON);
            console.log('📤 Publishing both messages to Pub/Sub (no delay)...');
            const publishResults = await Promise.all([
                messagingTopic.publishMessage({ data: messageBuffer1 }),
                messagingTopic.publishMessage({ data: messageBuffer2 }),
            ]);
            console.log('📤 Published message IDs:', publishResults);
        } else {
            // Only send merchant notification; customer email deferred to scheduler
            console.log(`📤 Publishing merchant notification only (customer email deferred ${delayDays}d)...`);
            const merchantMsgId = await messagingTopic.publishMessage({ data: messageBuffer2 });
            console.log('📤 Merchant notification message ID:', merchantMsgId);
        }

        console.log('✅ Review processed successfully, ID:', createNewReviewToDb.id);
        return h.response({ version: '1.0.0', message: 'New review processed successfully with id ' + createNewReviewToDb.id }).code(200);
    } catch (error: any) {
        console.error('❌ Error processing webhook:', error);
        request.logger.error({ error: error.message, stack: error.stack }, 'Webhook processing error');
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

export default shopifyWebhookPlugin;
