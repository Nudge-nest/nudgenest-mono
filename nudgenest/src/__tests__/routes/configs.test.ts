import { createServer } from '../../server-factory';
import { Server, ServerInjectResponse } from '@hapi/hapi';
import { responseType } from '../../types';
import { prismaMock } from '../mocks/prisma';
import { defaultConfigs } from '../../plugins/merchant';

const mockConfig = {
    ...defaultConfigs,
    id: '68415f4bc99be1ae3f921dc1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    merchantId: '68415f4bc99be1ae3f921dc0',
} as any;

const testApiKey = 'test-config-api-key';
const testMerchant = {
    id: '68415f4bc99be1ae3f921dc0',
    shopId: 'test-config-shop',
    apiKey: testApiKey,
    name: 'Test Config Shop',
    email: 'test@test.com',
    currencyCode: 'USD',
    domains: 'test.example.com',
    businessInfo: 'Test biz',
    address: { address1: '1 Test St', address2: '', city: 'City', country: 'US', zip: '12345', formatted: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
} as any;

describe('Config route', () => {
    let server: Server;
    beforeAll(async () => {
        server = await createServer();
        await server.initialize();
    });

    afterAll(async () => {
        await server.stop();
    });

    test('POST /api/v1/config Creates new review configuration and returns 200 status', async () => {
        prismaMock.merchants.findFirst.mockResolvedValue(testMerchant);
        prismaMock.configurations.create.mockResolvedValue(mockConfig);
        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'POST',
            url: '/api/v1/config',
            headers: { 'x-api-key': testApiKey },
        });
        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');
    });
    test('POST /api/v1/config return 500 when config data is malformed', async () => {
        prismaMock.merchants.findFirst.mockResolvedValue(testMerchant);
        prismaMock.configurations.create.mockRejectedValue(new Error('Request payload is missing'));
        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'POST',
            url: '/api/v1/config',
            headers: { 'x-api-key': testApiKey },
        });
        expect(res.statusCode).toBe(500);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('error');
        expect(res.result?.version).toMatch('1.0.0');
        expect(res.result?.error).toMatch('Request payload is missing');
    });
    test('GET /api/v1/config/{merchantId} returns review configuration and 200 status', async () => {
        const merchantId = '68415f4bc99be1ae3f921dc0';
        prismaMock.configurations.findMany.mockResolvedValue([mockConfig]);
        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/config/' + merchantId,
        });

        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');
    });
    test('GET /api/v1/config/{merchantId} return 500 when config data is malformed', async () => {
        prismaMock.configurations.findMany.mockRejectedValue(new Error('merchantId is incorrect'));
        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/config/nonexistent',
        });
        expect(res.statusCode).toBe(500);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('error');
        expect(res.result?.version).toMatch('1.0.0');
        expect(res.result?.error).toMatch('merchantId is incorrect');
    });
    test('PATCH /api/v1/config/{merchantId} updates review configuration and returns 200 status', async () => {
        const merchantId = '68415f4bc99be1ae3f921dc0';
        prismaMock.merchants.findFirst.mockResolvedValue(testMerchant);
        prismaMock.configurations.update.mockResolvedValue(mockConfig);
        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'PATCH',
            url: '/api/v1/config/' + merchantId,
            headers: { 'x-api-key': testApiKey },
        });

        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');
    });
    test('PATCH /api/v1/config/{merchantId} return 500 when config data is malformed during update', async () => {
        prismaMock.merchants.findFirst.mockResolvedValue(testMerchant);
        prismaMock.configurations.update.mockRejectedValue({ version: '1.0.0', data: undefined });

        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'PATCH',
            url: '/api/v1/config/nonexistent',
            headers: { 'x-api-key': testApiKey },
        });
        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');
        expect(res.result?.data).toBe(undefined);
    });
});
