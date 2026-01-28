// src/__tests__/routes/webhooks.test.ts
import { createServer } from '../../server-factory';
import { Server, ServerInjectResponse } from '@hapi/hapi';
import { prismaMock } from '../mocks/prisma';

// Mock the validation and schema functions
jest.mock('@/messagesSchema', () => ({
    isRabbitReviewRequestMessageValid: jest.fn(),
    sampleMessaging: {
        payload: {
            content: {},
        },
    },
}));

// Mock the utils/reviews functions
jest.mock('utils/reviews', () => ({
    buildPublishJson: jest.fn(),
    createNewReview: jest.fn(),
    extractMessagingContentFromShopifyData: jest.fn(),
    extractShopifyDataForRabbitMessaging: jest.fn(),
    getMerchantWithBusinessInfo: jest.fn(),
}));

// Mock the merchant module
jest.mock('plugins/merchant', () => ({
    plugin: {
        name: 'merchant',
        register: async () => {},
    },
    convertObjectToBuffer: jest.fn(),
    createMerchantEmailMessagingTemplate: jest.fn(),
}));

// After mocking, we can access the mocked functions
const { isRabbitReviewRequestMessageValid } = require('../../messagesSchema');
const {
    buildPublishJson,
    createNewReview,
    extractMessagingContentFromShopifyData,
    extractShopifyDataForRabbitMessaging,
    getMerchantWithBusinessInfo,
} = require('../../utils/reviews');
const { convertObjectToBuffer, createMerchantEmailMessagingTemplate } = require('../../plugins/merchant');

describe('Shopify Webhook route', () => {
    let server: Server;
    let mockTopic: any;

    beforeAll(async () => {
        try {
            server = await createServer();
            await server.initialize();

            // Set up mock Pub/Sub topic
            mockTopic = {
                name: 'nudgenest-messaging',
                publishMessage: jest.fn().mockResolvedValue('message-id'),
            };

            server.app.pubsub = {
                client: {
                    topic: jest.fn(() => mockTopic),
                    subscription: jest.fn(),
                    close: jest.fn(),
                } as any,
                messagingTopic: mockTopic,
            };

            // Set up mock Prisma
            server.app.prisma = prismaMock;
        } catch (error) {
            console.error('Failed to initialize server:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (server) {
            await server.stop();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Set up all the mock return values
        extractShopifyDataForRabbitMessaging.mockReturnValue({
            mocked: 'shopifyData',
            merchant_business_entity_id: 'merchant-123',
        });
        getMerchantWithBusinessInfo.mockResolvedValue({
            id: 'merchant-id-456',
            name: 'Test Merchant',
            email: 'merchant@example.com',
        });
        createNewReview.mockResolvedValue({ id: 'review-123' });
        extractMessagingContentFromShopifyData.mockReturnValue({ mocked: 'messagingContent' });
        buildPublishJson.mockReturnValue({ mocked: 'publishJson' });
        createMerchantEmailMessagingTemplate.mockReturnValue({ mocked: 'merchantEmailJson' });
        isRabbitReviewRequestMessageValid.mockReturnValue(true);
        convertObjectToBuffer.mockImplementation((obj: any) => Buffer.from(JSON.stringify(obj)));
    });

    const validPayload = {
        customer_locale: 'en',
        order_number: '12345',
        id: 'order-123',
        order_status_url: 'https://shop.com/order/123',
        merchant_business_entity_id: 'merchant-123',
        customer: {
            id: 'cust-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            state: 'CA',
            verified_email: true,
        },
        line_items: [],
    };

    test('POST /api/v1/shopify-webhook returns 200 when webhook is processed successfully', async () => {
        const res: ServerInjectResponse<{ version: string; message: string }> = await server.inject({
            method: 'POST',
            url: '/api/v1/shopify-webhook',
            payload: validPayload,
        });

        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version', '1.0.0');
        expect(res.result?.message).toContain('New review processed successfully');

        // Should publish twice - once for review, once for merchant
        expect(mockTopic.publishMessage).toHaveBeenCalledTimes(2);

        expect(getMerchantWithBusinessInfo).toHaveBeenCalledWith(prismaMock, 'merchant-123');
        expect(createNewReview).toHaveBeenCalledWith(
            prismaMock,
            { mocked: 'shopifyData', merchant_business_entity_id: 'merchant-123' },
            'merchant-id-456'
        );
    });

    test('POST /api/v1/shopify-webhook returns null when order_number is missing', async () => {
        const invalidPayload = { ...validPayload, order_number: undefined };

        const res = await server.inject({
            method: 'POST',
            url: '/api/v1/shopify-webhook',
            payload: invalidPayload,
        });

        expect(res.statusCode).toBe(204);
        expect(mockTopic.publishMessage).not.toHaveBeenCalled();
        expect(createNewReview).not.toHaveBeenCalled();
    });

    test('POST /api/v1/shopify-webhook returns null when customer_locale is missing', async () => {
        const invalidPayload = { ...validPayload, customer_locale: undefined };

        const res = await server.inject({
            method: 'POST',
            url: '/api/v1/shopify-webhook',
            payload: invalidPayload,
        });

        expect(res.statusCode).toBe(204);
        expect(mockTopic.publishMessage).not.toHaveBeenCalled();
    });

    test('POST /api/v1/shopify-webhook returns 500 when review creation fails', async () => {
        createNewReview.mockRejectedValue(new Error('Database error'));

        const res: ServerInjectResponse<{ version: string; error: string }> = await server.inject({
            method: 'POST',
            url: '/api/v1/shopify-webhook',
            payload: validPayload,
        });

        expect(res.statusCode).toBe(500);
        expect(res.result?.error).toBe('Database error');
        expect(mockTopic.publishMessage).not.toHaveBeenCalled();
    });

    test('POST /api/v1/shopify-webhook returns 500 when publishing fails', async () => {
        mockTopic.publishMessage.mockRejectedValueOnce(new Error('Failed to publish to Pub/Sub'));

        const res: ServerInjectResponse<{ version: string; error: string }> = await server.inject({
            method: 'POST',
            url: '/api/v1/shopify-webhook',
            payload: validPayload,
        });

        expect(res.statusCode).toBe(500);
        expect(res.result?.error).toBe('Failed to publish to Pub/Sub');
    });
});
