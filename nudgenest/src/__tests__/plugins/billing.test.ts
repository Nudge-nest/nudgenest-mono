import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { init } from '../../server.js';
import type { Server } from '@hapi/hapi';

describe('Billing Plugin', () => {
    let server: Server;

    beforeAll(async () => {
        server = await init();
    });

    afterAll(async () => {
        await server.stop();
    });

    describe('Route Registration', () => {
        it('should register GET /api/v1/plans route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/plans' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register GET /api/v1/subscriptions/{merchantId} route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{merchantId}' && r.method === 'get');
            expect(route).toBeDefined();
        });

        it('should register POST /api/v1/subscriptions route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions' && r.method === 'post');
            expect(route).toBeDefined();
        });

        it('should register PUT /api/v1/subscriptions/{id} route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{id}' && r.method === 'put');
            expect(route).toBeDefined();
        });

        it('should register DELETE /api/v1/subscriptions/{id} route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{id}' && r.method === 'delete');
            expect(route).toBeDefined();
        });

        it('should register GET /api/v1/usage/{merchantId} route', () => {
            const route = server.table().find((r) => r.path === '/api/v1/usage/{merchantId}' && r.method === 'get');
            expect(route).toBeDefined();
        });
    });

    describe('Route Authentication', () => {
        it('GET /api/v1/plans should not require auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/plans' && r.method === 'get');
            expect(route?.settings.auth).toBe(false);
        });

        it('GET /api/v1/subscriptions/{merchantId} should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{merchantId}' && r.method === 'get');
            expect(route?.settings.auth).toEqual({ strategy: 'apikey' });
        });

        it('POST /api/v1/subscriptions should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions' && r.method === 'post');
            expect(route?.settings.auth).toEqual({ strategy: 'apikey' });
        });

        it('PUT /api/v1/subscriptions/{id} should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{id}' && r.method === 'put');
            expect(route?.settings.auth).toEqual({ strategy: 'apikey' });
        });

        it('DELETE /api/v1/subscriptions/{id} should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/subscriptions/{id}' && r.method === 'delete');
            expect(route?.settings.auth).toEqual({ strategy: 'apikey' });
        });

        it('GET /api/v1/usage/{merchantId} should require apikey auth', () => {
            const route = server.table().find((r) => r.path === '/api/v1/usage/{merchantId}' && r.method === 'get');
            expect(route?.settings.auth).toEqual({ strategy: 'apikey' });
        });
    });
});
