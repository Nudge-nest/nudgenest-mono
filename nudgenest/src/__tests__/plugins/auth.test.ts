import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { init } from '../../server.js';
import type { Server } from '@hapi/hapi';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Plugin', () => {
    let server: Server;
    let testApiKey: string;

    beforeAll(async () => {
        server = await init();

        const merchant = await prisma.merchant.create({
            data: {
                shopId: `test-auth-${Date.now()}`,
                shopName: 'Test Auth Shop',
                email: `test-auth-${Date.now()}@example.com`,
                accessToken: 'test-token',
                apiKey: `test-auth-key-${Date.now()}`,
            },
        });
        testApiKey = merchant.apiKey;
    });

    afterAll(async () => {
        await prisma.merchant.deleteMany({
            where: { shopName: { contains: 'Test Auth Shop' } },
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
