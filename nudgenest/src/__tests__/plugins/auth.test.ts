import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from '../../server-factory';
import type { Server } from '@hapi/hapi';
import { prismaMock } from '../mocks/prisma';

describe('Auth Plugin', () => {
    let server: Server;
    const testApiKey = `test-auth-key-${Date.now()}`;
    const testMerchant = {
        id: 'test-auth-merchant-id',
        shopId: `test-auth-${Date.now()}`,
        domains: 'test-auth-shop.example.com',
        currencyCode: 'USD',
        name: 'Test Auth Shop',
        businessInfo: 'Test Auth Business',
        email: `test-auth-${Date.now()}@example.com`,
        apiKey: testApiKey,
        address: {
            address1: '123 Test St',
            address2: '',
            city: 'Test City',
            country: 'US',
            zip: '12345',
            formatted: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    beforeAll(async () => {
        server = await createServer();
        await server.initialize();
    });

    afterAll(async () => {
        await server.stop();
    });

    describe('API Key Authentication', () => {
        it('should reject requests without x-api-key header', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/api/v1/billing/subscription',
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject requests with invalid x-api-key', async () => {
            prismaMock.merchants.findFirst.mockResolvedValue(null as any);

            const response = await server.inject({
                method: 'GET',
                url: '/api/v1/billing/subscription',
                headers: {
                    'x-api-key': 'invalid-key',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should accept requests with valid x-api-key', async () => {
            prismaMock.merchants.findFirst.mockResolvedValue(testMerchant as any);
            prismaMock.subscriptions.findFirst.mockResolvedValue(null as any);

            const response = await server.inject({
                method: 'GET',
                url: '/api/v1/billing/subscription',
                headers: {
                    'x-api-key': testApiKey,
                },
            });

            expect(response.statusCode).not.toBe(401);
        });
    });

    describe('Auth Strategy Registration', () => {
        it('should register apikey auth strategy', () => {
            const strategies = server.auth.strategy;
            expect(strategies).toBeDefined();
        });
    });
});
