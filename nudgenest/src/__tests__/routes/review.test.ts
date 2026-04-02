import { createServer } from '../../server-factory';
import { Server, ServerInjectResponse } from '@hapi/hapi';
import { responseType } from '../../types';
import { prismaMock } from '../mocks/prisma';

const testApiKey = 'test-review-api-key';
const testMerchant = {
    id: 'test-review-merchant-id',
    shopId: 'MTY3NTgwMjk3MzU0',
    apiKey: testApiKey,
    name: 'Test Review Shop',
    email: 'test@test.com',
    currencyCode: 'EUR',
    domains: 'test.example.com',
    businessInfo: 'Test biz',
    address: { address1: '1 Test St', address2: '', city: 'City', country: 'US', zip: '12345', formatted: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
} as any;

const mockReview: any = {
    id: '68415f4bc99be1ae3f921dc1',
    merchantId: 'MTY3NTgwMjk3MzU0',
    merchantApiKey: testApiKey,
    merchantBusinessId: 'MTY3NTgwMjk3MzU0',
    shopId: '67580297354',
    customerEmail: 'ayoalabi0@gmail.com',
    customerName: 'Test Customer',
    verified: true,
    published: false,
    replies: [],
    items: [],
    status: 'Completed',
    createdAt: '1749114697542',
    updatedAt: '1749115067462',
    result: [
        { id: '14832321495178', value: '5' },
        { comment: 'I love all the products very much thank you!' },
    ],
};

describe('Reviews route', () => {
    let server: Server;
    beforeAll(async () => {
        server = await createServer();
        await server.initialize();
    });

    afterAll(async () => {
        await server.stop();
    });

    test('GET /api/v1/reviews/{reviewId} returns 200 status', async () => {
        prismaMock.reviews.findUnique.mockResolvedValue(mockReview);

        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/reviews/68415f4bc99be1ae3f921dc1',
        });

        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');

        expect(prismaMock.reviews.findUnique).toHaveBeenCalledWith({
            where: { id: '68415f4bc99be1ae3f921dc1' },
            select: {
                id: true,
                merchantId: true,
                merchantApiKey: true,
                shopId: true,
                merchantBusinessId: true,
                verified: true,
                published: true,
                replies: true,
                customerName: true,
                items: true,
                status: true,
                result: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    });
    test('GET /api/v1/reviews/{reviewId} return 500 when review does not exist', async () => {
        prismaMock.reviews.findUnique.mockRejectedValue(new Error('Invalid `prisma.reviews.findUnique()` invocation'));

        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/reviews/nonexistent',
        });
        expect(res.statusCode).toBe(500);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('error');
        expect(res.result?.version).toMatch('1.0.0');
        expect(res.result?.error).toContain('Invalid');
    });
    test.skip('PUT /api/v1/reviews/{reviewId} returns 200 status', async () => {
        const reviewId = '68415f4bc99be1ae3f921dc1';
        prismaMock.reviews.update.mockResolvedValue(mockReview);
        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'PUT',
            url: '/api/v1/reviews/' + reviewId,
            payload: { id: reviewId, status: 'completed' },
        });
        expect(res.statusCode).toBe(200);
    });
    test('PUT /api/v1/reviews/{reviewId} requires auth — returns 401 without x-api-key', async () => {
        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'PUT',
            url: '/api/v1/reviews/nonexistent',
            payload: { id: 'nonexistent' },
        });
        expect(res.statusCode).toBe(401);
    });
    test('PUT /api/v1/reviews/{reviewId} return 500 on error with valid auth', async () => {
        prismaMock.merchants.findFirst.mockResolvedValue(testMerchant);
        prismaMock.reviews.update.mockRejectedValue(new Error('Invalid `prisma.reviews.findUnique()` invocation'));
        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'PUT',
            url: '/api/v1/reviews/nonexistent',
            payload: { id: 'nonexistent' },
            headers: { 'x-api-key': testApiKey },
        });
        expect(res.statusCode).toBe(500);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('error');
        expect(res.result?.version).toMatch('1.0.0');
        expect(res.result?.error).toContain('Invalid');
    });
    test('GET /api/v1/reviews/list returns 200 status', async () => {
        prismaMock.reviews.findMany.mockResolvedValue([mockReview]);
        const res: ServerInjectResponse<{ version: string; data: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/reviews/list?shopid=MTY3NTgwMjk3MzU0',
        });
        expect(res.statusCode).toBe(200);
        expect(res.result).toHaveProperty('version');
        expect(res.result).toHaveProperty('data');
        expect(res.result?.version).toMatch('1.0.0');
    });
    test('GET /api/v1/reviews/list fails with 400 when shopid and merchantid are both missing', async () => {
        const res: ServerInjectResponse<{ version: string; error: responseType }> = await server.inject({
            method: 'GET',
            url: '/api/v1/reviews/list?hello=world',
        });
        expect(res.statusCode).toBe(400);
        expect(res.result).toHaveProperty('error');
    });
});
