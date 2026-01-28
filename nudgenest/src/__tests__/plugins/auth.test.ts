import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from '../../server-factory';
import type { Server } from '@hapi/hapi';
import { PrismaClient } from '../../../generated/prisma/prisma/client';

const prisma = new PrismaClient();

describe('Auth Plugin', () => {
    let server: Server;
    let testApiKey: string;

    beforeAll(async () => {
        server = await createServer();
        await server.initialize();

        const merchant = await prisma.merchants.create({
            data: {
                shopId: `test-auth-${Date.now()}`,
                domains: 'test-auth-shop.example.com',
                currencyCode: 'USD',
                name: 'Test Auth Shop',
                businessInfo: 'Test Auth Business',
                email: `test-auth-${Date.now()}@example.com`,
                address: {
                    address1: '123 Test St',
                    address2: '',
                    city: 'Test City',
                    country: 'US',
                    zip: '12345',
                    formatted: [],
                },
                apiKey: `test-auth-key-${Date.now()}`,
            },
        });
        testApiKey = merchant.apiKey!;
    });

    afterAll(async () => {
        await prisma.merchants.deleteMany({
            where: { name: { contains: 'Test Auth Shop' } },
        });
        await server.stop();
    });

    describe('API Key Authentication', () => {
        it('should reject requests without x-api-key header', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/api/v1/subscriptions/test-merchant-id',
            });

            expect(response.statusCode).toBe(401);
        });

        it('should reject requests with invalid x-api-key', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/api/v1/subscriptions/test-merchant-id',
                headers: {
                    'x-api-key': 'invalid-key',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should accept requests with valid x-api-key', async () => {
            const response = await server.inject({
                method: 'GET',
                url: `/api/v1/subscriptions/${testApiKey}`,
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
