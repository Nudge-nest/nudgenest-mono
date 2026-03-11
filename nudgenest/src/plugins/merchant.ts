/*Handles all things related to merchants*/
import Hapi from '@hapi/hapi';
import crypto from 'crypto';

import * as dotenv from 'dotenv';
import { eventType, IMerchant, IRabbitDataObject, IReviewMessagePayloadContent } from '../types';
import { isRabbitReviewRequestMessageValid, sampleMessaging } from '../messagesSchema';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        merchantsPlugin: any;
    }
}

const merchantsPlugin: Hapi.Plugin<null> = {
    name: 'merchantsPlugin',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'POST',
                path: '/api/v1/merchants/verify/{merchantPlatformId}',
                handler: verifyMerchantHandler,
                options: {
                    auth: false,
                },
            },
            {
                method: 'GET',
                path: '/api/v1/merchants/{merchantId}',
                handler: getMerchantHandler,
                options: {
                    auth: false,
                },
            },
            {
                method: 'POST',
                path: '/api/v1/merchants',
                handler: createMerchantHandler,
                options: {
                    auth: false,
                },
            },
        ]);
    },
};

export const defaultConfigs = {
    merchantId: '',
    emailContent: [
        {
            key: 'subject',
            value: 'how did it go?',
            description: 'The Subject of the review email to send to customer',
            type: 'text',
        },
        {
            key: 'body',
            value: 'We would be grateful if you shared how things look and feel.',
            description: 'The Body of the review email to send to customer',
            type: 'text',
        },
        {
            key: 'buttonText',
            value: 'Leave a review',
            description: 'The text displayed on the review button',
            type: 'text',
        },
    ],
    reminderEmailContent: [
        {
            key: 'reminderSubject',
            value: 'how did it go? [REMINDER]',
            description: 'The Subject of the reminder email',
            type: 'text',
        },
        {
            key: 'reminderBody',
            value: 'We would be grateful if you shared how things look and feel.',
            description: 'The Body of the reminder email',
            type: 'text',
        },
        {
            key: 'reminderButtonText',
            value: 'Leave a review',
            description: 'The text displayed on the reminder review button',
            type: 'text',
        },
    ],
    remindersFrequency: [
        {
            key: 'remindersQty',
            value: '2',
            description: 'Number of reminder emails to send',
            type: 'number',
        },
        {
            key: 'remindersPeriod',
            value: 'WEEKLY',
            description: 'Frequency of reminder emails (WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY)',
            type: 'select',
        },
    ],
    publish: [
        {
            key: 'autoPublish',
            value: 'THREESTARS',
            description: 'Minimum star rating for auto-publishing reviews',
            type: 'select',
        },
    ],
    emailSchedule: [
        {
            key: 'initialEmailDelayDays',
            value: '0',
            description: 'Days to wait after order before sending the review request email (0 = send immediately)',
            type: 'number',
        },
    ],
    qrCode: [
        {
            key: 'qrCodeUrl',
            value: '',
            description: 'URL for the QR code to direct to',
            type: 'url',
        },
        {
            key: 'qrCodeData',
            value: '',
            description: 'Generated QR code image data',
            type: 'image',
        },
    ],
    general: {
        shopReviewQuestions: [
            {
                key: 'reviewQuestion',
                value: 'how did we do?',
                description: 'Shop review default question',
                type: 'text',
            },
        ],
    },
};

const getMerchantHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { merchantId } = request.params as { merchantId: string };
    const { prisma } = request.server.app;
    try {
        const merchant = await prisma.merchants.findUnique({
            where: {
                id: merchantId,
            },
            select: {
                id: true,
                shopId: true,
                domains: true,
                email: true,
                name: true,
                businessInfo: true,
                apiKey: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!merchant) {
            return h.response({
                version: '1.0.0',
                error: 'Merchant not found'
            }).code(404);
        }

        return h.response({ version: '1.0.0', data: merchant }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

const verifyMerchantHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { merchantPlatformId } = request.params as { merchantPlatformId: string };
    const { prisma } = request.server.app;
    try {
        const merchant = await prisma.merchants.findFirst({
            where: {
                shopId: {
                    contains: merchantPlatformId,
                },
            },
            select: {
                // Explicitly select fields (excludes otpSecret)
                id: true,
                shopId: true,
                domains: true,
                email: true,
                name: true,
                businessInfo: true,
                apiKey: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return h.response({ version: '1.0.0', data: merchant }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

export const convertObjectToBuffer = (objectToConvert: object) => {
    return Buffer.from(JSON.stringify(objectToConvert));
};

export const createMerchantEmailMessagingTemplate = (
    merchant: any,
    sampleMessaging: IRabbitDataObject<IReviewMessagePayloadContent>,
    eventType: eventType
) => {
    return {
        ...sampleMessaging,
        eventType: eventType,
        payload: {
            ...sampleMessaging.payload,
            content: {
                ...sampleMessaging.payload.content,
                userName: merchant.name,
                type: eventType,
                email: merchant.email,
                order_number: undefined,
                merchantId: merchant.id,
            },
            context: { ...sampleMessaging.payload.context, receiver: ['reviewee'] },
        },
    } as IRabbitDataObject<IReviewMessagePayloadContent>;
};

const createRegistrationEmailMessaging = (
    merchant: any,
    sampleMessaging: IRabbitDataObject<IReviewMessagePayloadContent>
) => {
    return {
        ...sampleMessaging,
        eventType: 'merchant-welcome',
        payload: {
            ...sampleMessaging.payload,
            content: {
                ...sampleMessaging.payload.content,
                userName: merchant.name,
                type: 'merchant-welcome',
                email: merchant.email,
                order_number: undefined,
                merchantId: merchant.id,
            },
            context: { ...sampleMessaging.payload.context, receiver: ['reviewee'] },
        },
    } as IRabbitDataObject<IReviewMessagePayloadContent>;
};

const createVerificationEmailMessaging = (
    merchant: any,
    sampleMessaging: IRabbitDataObject<IReviewMessagePayloadContent>
) => {
    return {
        ...sampleMessaging,
        eventType: 'merchant-verification',
        payload: {
            ...sampleMessaging.payload,
            content: {
                ...sampleMessaging.payload.content,
                userName: merchant.name,
                type: 'merchant-verification',
                email: merchant.email,
                order_number: undefined,
                merchantId: merchant.id,
            },
            context: { ...sampleMessaging.payload.context, receiver: ['reviewee'] },
        },
    } as IRabbitDataObject<IReviewMessagePayloadContent>;
};

const createMerchantHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const merchantData = request.payload as any;
    const { prisma, pubsub } = request.server.app;
    const { messagingTopic } = pubsub;
    try {
        const apiKey = crypto.randomBytes(32).toString('hex');
        const merchant = await prisma.merchants.create({
            data: { ...(merchantData || {}), apiKey } as any,
        });

        // Generate store review QR code URL from env
        const reviewUiBaseUrl = process.env.REVIEW_UI_BASE_URL;
        if (!reviewUiBaseUrl) throw new Error('Missing required env var: REVIEW_UI_BASE_URL');
        const storeReviewUrl = `${reviewUiBaseUrl}/store/review/${merchant.id}`;

        // Update qrCode config with generated URL
        const configsWithQrUrl = {
            ...defaultConfigs,
            qrCode: defaultConfigs.qrCode.map(field =>
                field.key === 'qrCodeUrl' ? { ...field, value: storeReviewUrl } : field
            ),
            merchantId: merchant.id
        };

        const reviewConfigs = await prisma.configurations.create({
            data: configsWithQrUrl as any,
        });

        // Auto-assign FREE plan (no trial - it's free forever)
        const freePlan = await prisma.plans.findUnique({ where: { name: 'free' } });
        if (freePlan) {
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            await prisma.subscriptions.create({
                data: {
                    merchantId: merchant.id,
                    planId: freePlan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    trialStart: null,
                    trialEnd: null,
                },
            });
        }

        const merchantMessageContent = createRegistrationEmailMessaging(merchant, sampleMessaging);
        const merchantVerificationMessageContent = createVerificationEmailMessaging(merchant, sampleMessaging);
        if (!isRabbitReviewRequestMessageValid(merchantMessageContent))
            throw new Error('Invalid messaging data to publish');

        // Publish to Pub/Sub
        const messageBuffer1 = convertObjectToBuffer(merchantMessageContent);
        const messageBuffer2 = convertObjectToBuffer(merchantVerificationMessageContent);

        await Promise.all([
            messagingTopic.publishMessage({ data: messageBuffer1 }),
            messagingTopic.publishMessage({ data: messageBuffer2 })
        ]);

        return h.response({ version: '1.0.0', data: { merchant, reviewConfigs } }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

export default merchantsPlugin;
