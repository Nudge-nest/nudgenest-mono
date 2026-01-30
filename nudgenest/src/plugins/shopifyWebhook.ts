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
    const { messagingTopic, client } = pubsub;
    const topic = request.headers['x-shopify-topic'];

    console.log('Webhook topic:', topic);
    //console.log('Webhook payload keys:', Object.keys(payload));

    // For draft orders, check if they've been completed (converted to order)
    if (topic === 'draft_orders/create' || topic === 'draft_orders/update') {
        const { order_id } = payload;
        if (!order_id) {
            console.log('Draft order not yet completed (no order_id), skipping');
            return h.response({ message: 'Draft order not yet completed' }).code(200);
        }
        console.log('Draft order has been completed with order_id:', order_id);
    }

    let { customer_locale, order_number } = payload;

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

        const merchantData = await getMerchantWithBusinessInfo(
            prisma,
            reviewDataFromPayload.merchant_business_entity_id
        );
        console.log('Found merchant:', merchantData.id);

        const createNewReviewToDb = await createNewReview(prisma, reviewDataFromPayload, merchantData.id, merchantData.apiKey);
        console.log('Created review:', createNewReviewToDb.id, 'with merchantApiKey:', !!createNewReviewToDb.merchantApiKey);
        const reviewMessageContent = extractMessagingContentFromShopifyData(
            reviewDataFromPayload,
            createNewReviewToDb.id
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

        // Publish to Pub/Sub
        const messageBuffer1 = convertObjectToBuffer(reviewToMessagingChannelJSON);
        const messageBuffer2 = convertObjectToBuffer(reviewMessageToMerchantJSON);

        await Promise.all([
            messagingTopic.publishMessage({ data: messageBuffer1 }),
            messagingTopic.publishMessage({ data: messageBuffer2 })
        ]);

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
