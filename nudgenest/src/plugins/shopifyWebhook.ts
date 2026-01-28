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
                        parse: true,
                        allow: 'application/json',
                    },
                },
            },
        ]);
    },
};

const verifyShopifyHMAC = (rawBody: string, hmacHeader: string, secret: string): boolean => {
    try {
        const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
        const hashBuffer = Buffer.from(hash);
        const hmacBuffer = Buffer.from(hmacHeader);

        if (hashBuffer.length !== hmacBuffer.length) {
            console.log('HMAC verification failed: length mismatch');
            return false;
        }

        const isValid = crypto.timingSafeEqual(hashBuffer, hmacBuffer);
        if (!isValid) {
            console.log('HMAC verification failed: hash mismatch');
        }
        return isValid;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
};

const webhookMessageHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    request.logger.info({ headers: request.headers }, 'Shopify webhook received');

    // HMAC verification
    const hmacHeader = request.headers['x-shopify-hmac-sha256'];
    const shopifySecret = process.env.SHOPIFY_API_SECRET || '';

    if (!hmacHeader || !shopifySecret) {
        request.logger.warn('Missing HMAC header or Shopify secret');
        return h.response({ error: 'Unauthorized' }).code(401);
    }

    // Shopify sends the webhook with the raw JSON body, so we need to re-serialize it
    // in the exact same way to verify the HMAC
    const rawBody = JSON.stringify(request.payload);

    if (!verifyShopifyHMAC(rawBody, hmacHeader as string, shopifySecret)) {
        request.logger.warn('HMAC verification failed');
        return h.response({ error: 'Invalid HMAC' }).code(403);
    }

    request.logger.info('HMAC verification successful');

    const { pubsub, prisma } = request.server.app;
    const { messagingTopic, client } = pubsub;
    const { customer_locale, order_number } = request.payload as any;
    if (!order_number || !customer_locale) return null;
    try {
        const reviewDataFromPayload = extractShopifyDataForRabbitMessaging(request.payload);
        const merchantData = await getMerchantWithBusinessInfo(
            prisma,
            reviewDataFromPayload.merchant_business_entity_id
        );
        const createNewReviewToDb = await createNewReview(prisma, reviewDataFromPayload, merchantData.id);
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

        return h.response({ version: '1.0.0', message: 'New review processed successfully with id ' + createNewReviewToDb.id }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

export default shopifyWebhookPlugin;
