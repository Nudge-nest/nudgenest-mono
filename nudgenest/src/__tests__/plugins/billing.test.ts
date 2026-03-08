import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from '../../server-factory';
import type { Server } from '@hapi/hapi';

describe('Billing Plugin', () => {
    let server: Server;

    beforeAll(async () => {
        server = await createServer();
        await server.initialize();
    });

    afterAll(async () => {
        await server.stop();
    });

    describe('Route Registration', () => {
        it('should register GET /api/v1/plans route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/plans' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register GET /api/v1/billing/subscription route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register GET /api/v1/billing/subscription/{merchantId} route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription/{merchantId}' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register POST /api/v1/billing/subscription route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'post');
            expect(route).toBeDefined();
        });

        it('should register PUT /api/v1/billing/subscription route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'put');
            expect(route).toBeDefined();
        });

        it('should register DELETE /api/v1/billing/subscription route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'delete');
            expect(route).toBeDefined();
        });

        it('should register GET /api/v1/billing/usage route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/usage' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register POST /api/v1/billing/usage route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/usage' && r.method === 'post');
            expect(route).toBeDefined();
        });

        it('should register POST /api/v1/billing/sync-shopify route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/sync-shopify' && r.method === 'post');
            expect(route).toBeDefined();
        });
    });

    describe('Route Authentication', () => {
        it('GET /api/v1/plans should not require auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/plans' && r.method === 'get');
            expect(route?.settings.auth).toBe(false);
        });

        it('GET /api/v1/billing/subscription should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'get');
            expect(route?.settings.auth).toMatchObject({ strategies: ['apikey'] });
        });

        it('POST /api/v1/billing/subscription should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'post');
            expect(route?.settings.auth).toMatchObject({ strategies: ['apikey'] });
        });

        it('PUT /api/v1/billing/subscription should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'put');
            expect(route?.settings.auth).toMatchObject({ strategies: ['apikey'] });
        });

        it('DELETE /api/v1/billing/subscription should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/subscription' && r.method === 'delete');
            expect(route?.settings.auth).toMatchObject({ strategies: ['apikey'] });
        });

        it('GET /api/v1/billing/usage should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/billing/usage' && r.method === 'get');
            expect(route?.settings.auth).toMatchObject({ strategies: ['apikey'] });
        });
    });
});
