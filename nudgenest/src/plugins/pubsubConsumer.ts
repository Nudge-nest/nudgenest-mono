/* Actively consumes messages from Google Cloud Pub/Sub (Pull subscription for all environments) */
import Hapi from '@hapi/hapi';
import * as dotenv from 'dotenv';
import { eventType, IRabbitDataObject, IReviewMessagePayloadContent } from '../types';
import EmailService from '../email-service';
import { trackEmailUsage, trackReviewRequestUsage } from '../middleware/usage-tracking';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        pubsubConsumer: any;
    }
}

const extractParamsFromLineItems = (lineItems: any[]) => {
    if (lineItems.length === 0 || !lineItems) return [];
    return lineItems.map((lineItem) => {
        return { name: lineItem.name, image: lineItem.image ? lineItem.image : '', price: lineItem.price };
    });
};

const sendEmailMessageToReviewer = async (messageContent: IReviewMessagePayloadContent, templateId: eventType) => {
    const { userName, email, reviewId, line_items, order_number, currency } = messageContent;
    if (templateId === 'new-review')
        return EmailService.sendReviewRequest({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items as any[]),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'reminder')
        return EmailService.sendReviewReminder({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items as any[]),
            order_number: `${order_number}`,
            currency,
        });
};

const sendEmailMessageToMerchant = async (messageContent: any, templateId: eventType) => {
    const { userName, email, reviewId, line_items, order_number, currency } = messageContent;
    if (templateId === 'merchant-welcome')
        return EmailService.sendMerchantWelcome({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'merchant-verification')
        return EmailService.sendMerchantVerification({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'merchant-deletion')
        return EmailService.sendEmail({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'completed-review')
        return EmailService.sendCompletedReview({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'new-review-merchant')
        return EmailService.sendNewReviewToMerchant({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
    if (templateId === 'completed-review-merchant')
        return EmailService.sendCompletedReviewToMerchant({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: `${order_number}`,
            currency,
        });
};

const handleSendEmailToReviewer = async (messagingContent: IRabbitDataObject<IReviewMessagePayloadContent>) => {
    const { payload, eventType } = messagingContent;
    const merchantId = payload.content.merchantId;

    await sendEmailMessageToReviewer(payload.content, eventType);

    // Track usage
    if (merchantId) {
        await trackEmailUsage(merchantId, 1);
        if (eventType === 'new-review') {
            await trackReviewRequestUsage(merchantId, 1);
        }
    }
};

const handleSendEmailToReviewee = async (messagingContent: IRabbitDataObject<IReviewMessagePayloadContent>) => {
    const { payload, eventType } = messagingContent;
    const merchantId = payload.content.merchantId;
    console.log('Payload merchant', payload, eventType);

    await sendEmailMessageToMerchant(payload.content, eventType);

    // Track usage for merchant emails
    if (merchantId) {
        await trackEmailUsage(merchantId, 1);
    }
};

const pubsubConsumerPlugin: Hapi.Plugin<null> = {
    name: 'pubsubConsumer',
    dependencies: ['pubsub'],
    register: async (server: Hapi.Server) => {
        const { pubsub } = server.app;

        // Use the pull subscription created by Pulumi
        const subscriptionName = 'nudgenest-messaging-pull';

        let subscription;
        try {
            subscription = pubsub.client.subscription(subscriptionName);
            console.log(`✅ Using pull subscription: ${subscriptionName}`);
        } catch (err) {
            console.error('❌ Error getting pull subscription:', err);
            return;
        }

        // Listen for messages (pull model)
        const messageHandler = async (message: any) => {
            try {
                console.log('📨 Received message from Pub/Sub');

                // Parse message data
                const messageData = message.data.toString('utf-8');
                const rawContent = JSON.parse(messageData) as IRabbitDataObject<IReviewMessagePayloadContent>;
                const { eventType } = rawContent;

                console.log(`Processing message with eventType: ${eventType}`);

                // Process the message
                if (eventType === 'new-review' || eventType === 'reminder') {
                    await handleSendEmailToReviewer(rawContent);
                } else {
                    await handleSendEmailToReviewee(rawContent);
                }

                // Acknowledge the message
                message.ack();
                console.log('✅ Message processed and acknowledged');

            } catch (err: any) {
                console.error(`❌ Error processing Pub/Sub message:`, err);
                // NACK the message so it can be retried
                message.nack();
            }
        };

        // Start listening for messages
        subscription.on('message', messageHandler);
        subscription.on('error', (error: any) => {
            console.error('❌ Pub/Sub subscription error:', error);
        });

        console.log('✅ Pub/Sub consumer started - actively listening for messages');

        // Cleanup on server shutdown
        server.ext('onPostStop', async () => {
            console.log('🔌 Stopping Pub/Sub message listener...');
            subscription.removeAllListeners();
        });
    },
};

export default pubsubConsumerPlugin;
