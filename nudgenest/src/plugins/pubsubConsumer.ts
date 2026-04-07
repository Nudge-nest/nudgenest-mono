/* Actively consumes messages from Google Cloud Pub/Sub (Pull subscription for all environments) */
import Hapi from '@hapi/hapi';
import * as dotenv from 'dotenv';
import { Sentry } from '../lib/sentry';
import { eventType, IRabbitDataObject, IReviewMessagePayloadContent } from '../types';
import EmailService from '../email-service';
// import { trackEmailUsage, trackReviewRequestUsage } from '../middleware/usage-tracking';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        pubsubConsumer: any;
    }
}

const extractParamsFromLineItems = (lineItems: any[]) => {
    if (lineItems.length === 0 || !lineItems) return [];
    return lineItems.map((lineItem) => {
        // Extract image URL from Shopify's image object structure
        // According to Shopify API docs, image can be either:
        // 1. An object with 'src' property: { id, product_id, position, src, ... }
        // 2. A direct string URL (legacy/fallback)
        let imageUrl = '';
        if (lineItem.image) {
            if (typeof lineItem.image === 'object' && lineItem.image.src) {
                imageUrl = lineItem.image.src;
            } else if (typeof lineItem.image === 'string') {
                imageUrl = lineItem.image;
            }
        }

        return {
            name: lineItem.name,
            image: imageUrl,
            price: lineItem.price
        };
    });
};

// Fetch merchant config overrides (subject / body / buttonText) and store identity for customer-facing emails
const getMerchantEmailConfig = async (server: Hapi.Server, merchantId?: string) => {
    if (!merchantId) return {};
    try {
        const prisma = server.app.prisma;
        const [config, merchant] = await Promise.all([
            prisma.configurations.findFirst({
                where: { merchantId },
                select: { emailContent: true, reminderEmailContent: true },
            }),
            prisma.merchants.findFirst({
                where: { id: merchantId },
                select: { name: true, domains: true },
            }),
        ]);

        const getVal = (fields: any[], key: string) =>
            fields?.find((f: any) => f.key === key)?.value;

        return {
            storeName: merchant?.name || undefined,
            storeDomain: merchant?.domains || undefined,
            ...(config ? {
                subjectOverride: getVal(config.emailContent, 'subject'),
                bodyOverride: getVal(config.emailContent, 'body'),
                buttonTextOverride: getVal(config.emailContent, 'buttonText'),
                reminderSubjectOverride: getVal(config.reminderEmailContent, 'reminderSubject'),
                reminderBodyOverride: getVal(config.reminderEmailContent, 'reminderBody'),
                reminderButtonTextOverride: getVal(config.reminderEmailContent, 'reminderButtonText'),
            } : {}),
        };
    } catch (err: any) {
        console.warn(`⚠️ Could not load merchant config for ${merchantId}:`, err.message);
        return {};
    }
};

const sendEmailMessageToReviewer = async (
    messageContent: IReviewMessagePayloadContent,
    templateId: eventType,
    server: Hapi.Server
) => {
    const { userName, email, reviewId, line_items, order_number, currency, merchantId } = messageContent;
    console.log(`📧 Sending ${templateId} email to reviewer: ${email}`);

    // Log line_items before extraction
    console.log('🔍 Line items received in message:', JSON.stringify(line_items, null, 2));
    const extractedItems = extractParamsFromLineItems(line_items as any[]);
    console.log('🔍 Extracted items for email:', JSON.stringify(extractedItems, null, 2));

    // Load merchant-configurable overrides
    const configOverrides = await getMerchantEmailConfig(server, merchantId);

    if (templateId === 'new-review') {
        const result = await EmailService.sendReviewRequest({
            userName,
            email,
            reviewId,
            items: extractedItems,
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
            ...configOverrides,
        });
        console.log(`✅ Review request email sent to ${email}`);
        return result;
    }
    if (templateId === 'reminder') {
        const result = await EmailService.sendReviewReminder({
            userName,
            email,
            reviewId,
            items: extractedItems,
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
            ...configOverrides,
        });
        console.log(`✅ Reminder email sent to ${email}`);
        return result;
    }
};

const sendEmailMessageToMerchant = async (messageContent: any, templateId: eventType) => {
    const { userName, email, reviewId, line_items, order_number, currency } = messageContent;
    if (templateId === 'merchant-welcome')
        return EmailService.sendMerchantWelcome({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
    if (templateId === 'merchant-verification')
        return EmailService.sendMerchantVerification({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
    if (templateId === 'merchant-deletion')
        return EmailService.sendEmail({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
    if (templateId === 'completed-review')
        return EmailService.sendCompletedReview({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
    if (templateId === 'new-review-merchant')
        return EmailService.sendNewReviewToMerchant({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
    if (templateId === 'completed-review-merchant')
        return EmailService.sendCompletedReviewToMerchant({
            userName,
            email,
            reviewId,
            items: extractParamsFromLineItems(line_items),
            order_number: order_number != null ? `${order_number}` : undefined,
            currency,
        });
};

const handleSendEmailToReviewer = async (
    messagingContent: IRabbitDataObject<IReviewMessagePayloadContent>,
    server: Hapi.Server
) => {
    const { payload, eventType } = messagingContent;
    const merchantId = payload.content.merchantId;

    console.log(`📬 Handling email to reviewer - eventType: ${eventType}, merchantId: ${merchantId}`);
    await sendEmailMessageToReviewer(payload.content, eventType, server);

    // Track usage
    /*if (merchantId) {
        await trackEmailUsage(merchantId, 1);
        if (eventType === 'new-review') {
            await trackReviewRequestUsage(merchantId, 1);
        }
    }*/
};

const handleSendEmailToReviewee = async (messagingContent: IRabbitDataObject<IReviewMessagePayloadContent>) => {
    const { payload, eventType } = messagingContent;
    const merchantId = payload.content.merchantId;
    console.log(`📬 Handling email to merchant - eventType: ${eventType}, merchantId: ${merchantId}`);
    console.log('Payload merchant', payload, eventType);

    await sendEmailMessageToMerchant(payload.content, eventType);

    // Track usage for merchant emails
    /*if (merchantId) {
        await trackEmailUsage(merchantId, 1);
    }*/
};

const pubsubConsumerPlugin: Hapi.Plugin<null> = {
    name: 'pubsubConsumer',
    dependencies: ['pubsub', 'prisma'],
    register: async (server: Hapi.Server) => {
        const { pubsub } = server.app;

        // Use the pull subscription created by Pulumi
        const subscriptionName = 'nudgenest-messaging-pull';

        let subscription;
        try {
            subscription = pubsub.client.subscription(subscriptionName);

            // Check if subscription exists
            const [exists] = await subscription.exists();
            if (!exists) {
                console.error(`❌ Subscription ${subscriptionName} does not exist!`);
                return;
            }

            // Set flow control options to ensure messages are pulled immediately
            subscription.setOptions({
                flowControl: {
                    maxMessages: 10,
                    allowExcessMessages: true,
                },
                ackDeadline: 60, // 60 seconds to process messages
            });

            console.log(`✅ Using pull subscription: ${subscriptionName}`);
            console.log(`📡 Subscription flow control configured - listening for messages...`);
        } catch (err) {
            console.error('❌ Error getting pull subscription:', err);
            return;
        }

        // Listen for messages (pull model)
        const messageHandler = async (message: any) => {
            let rawContent: IRabbitDataObject<IReviewMessagePayloadContent> | undefined;
            try {
                console.log('📨 Received message from Pub/Sub');

                // Parse message data
                const messageData = message.data.toString('utf-8');
                rawContent = JSON.parse(messageData) as IRabbitDataObject<IReviewMessagePayloadContent>;
                const { eventType } = rawContent;

                console.log(`Processing message with eventType: ${eventType}`);

                // Process the message
                if (eventType === 'new-review' || eventType === 'reminder') {
                    await handleSendEmailToReviewer(rawContent, server);
                } else {
                    await handleSendEmailToReviewee(rawContent);
                }

                // Acknowledge the message
                message.ack();
                console.log('✅ Message processed and acknowledged');

            } catch (err: any) {
                console.error(`❌ Error processing Pub/Sub message:`, err);
                Sentry.withScope((scope) => {
                    scope.setTag('component', 'pubsubConsumer');
                    scope.setContext('message', {
                        eventType: rawContent?.eventType ?? 'unknown',
                        merchantId: rawContent?.payload?.content?.merchantId,
                    });
                    Sentry.captureException(err);
                });
                // NACK the message so it can be retried
                message.nack();
            }
        };

        // Start listening for messages
        subscription.on('message', messageHandler);
        subscription.on('error', (error: any) => {
            console.error('❌ Pub/Sub subscription error:', error);
            Sentry.captureException(error, { tags: { component: 'pubsubConsumer', type: 'subscription_error' } });
        });

        // Add debug listener to verify subscription is active
        subscription.on('debug', (msg: any) => {
            console.log('🐛 Pub/Sub debug:', msg);
        });

        // Explicitly open the subscription to start pulling messages
        // This ensures the subscription actively polls for new messages
        subscription.open();

        console.log('✅ Pub/Sub consumer started - actively listening for messages');
        console.log(`   Subscription path: ${subscription.name}`);

        // Cleanup on server shutdown
        server.ext('onPostStop', async () => {
            console.log('🔌 Stopping Pub/Sub message listener...');
            subscription.removeAllListeners();
            subscription.close();
        });
    },
};

export default pubsubConsumerPlugin;
