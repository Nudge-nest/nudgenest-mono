import { Context, createMockContext, MockContext } from '../prismaContext';
import { defaultConfigs } from '../../plugins/merchant';
import { IReviewConfiguration } from '../../types/reviewConfigs';

export async function createConfig(config: IReviewConfiguration, ctx: Context) {
    return ctx.prisma.configurations.create({
        data: config as any,
    });
}

export async function getReviewConfigByMerchantId(merchantId: string, ctx: Context): Promise<IReviewConfiguration> {
    return ctx.prisma.configurations.findMany({
        where: {
            merchantId: merchantId,
        },
    }) as any;
}

export async function updateReviewConfigsByMerchantId(
    configId: string,
    configUpdate: IReviewConfiguration,
    ctx: Context
): Promise<IReviewConfiguration> {
    return ctx.prisma.configurations.update({
        where: {
            id: configId,
        },
        data: configUpdate as any,
    }) as any;
}

const createTestReviewConfigData = (): IReviewConfiguration => {
    return {
        ...defaultConfigs,
        id: '507f1f77bcf86cd799439011',
        merchantId: '507f1f77bcf86cd799439055',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as IReviewConfiguration;
};

describe('Review Configurations Unit Tests', () => {
    let mockCtx: MockContext;
    let ctx: Context;
    const reviewConfigData = createTestReviewConfigData();
    const expectedReviewConfigData = {
        ...reviewConfigData,
        id: '507f1f77bcf86cd799439011',
        merchantId: '507f1f77bcf86cd799439055',
    } as any;
    beforeEach(() => {
        mockCtx = createMockContext();
        ctx = mockCtx as unknown as Context;
    });
    test('should create new review configuration', async () => {
        mockCtx.prisma.configurations.create.mockResolvedValue(expectedReviewConfigData);
        const result = await createConfig(reviewConfigData, ctx);
        expect(result).toEqual(expectedReviewConfigData);
        expect(mockCtx.prisma.configurations.create).toHaveBeenCalledWith({
            data: reviewConfigData,
        });
        expect(mockCtx.prisma.configurations.create).toHaveBeenCalledTimes(1);
    });

    test('should return configuration provided with a correct merchant ID', async () => {
        const merchantId = '507f1f77bcf86cd799439055';
        mockCtx.prisma.configurations.findMany.mockResolvedValue([expectedReviewConfigData]);
        const result = await getReviewConfigByMerchantId(merchantId, ctx);
        expect(result).toEqual([expectedReviewConfigData]);
        expect(mockCtx.prisma.configurations.findMany).toHaveBeenCalledWith({
            where: {
                merchantId: merchantId,
            },
        });
        expect(mockCtx.prisma.configurations.findMany).toHaveBeenCalledTimes(1);
    });

    test('should update review config given configId and correct update data', async () => {
        const configId = '507f1f77bcf86cd799439011';
        mockCtx.prisma.configurations.update.mockResolvedValue(expectedReviewConfigData as any);
        expectedReviewConfigData.emailContent = [
            ...expectedReviewConfigData.emailContent,
            {
                key: 'buttonTextTest',
                value: 'Leave a review - test',
                description: 'The text displayed on the review button -Test',
                type: 'text',
            },
        ];
        const result = await updateReviewConfigsByMerchantId(
            configId,
            {
                ...expectedReviewConfigData,
                emailContent: [
                    ...expectedReviewConfigData.emailContent,
                    {
                        key: 'buttonTextTest',
                        value: 'Leave a review - test',
                        description: 'The text displayed on the review button -Test',
                        type: 'text',
                    },
                ],
            },
            ctx
        );
        expect(result).toEqual(expectedReviewConfigData);
        expect(mockCtx.prisma.configurations.update).toHaveBeenCalledWith({
            where: {
                id: configId as string,
            },
            data: {
                ...expectedReviewConfigData,
                emailContent: [
                    ...expectedReviewConfigData.emailContent,
                    {
                        key: 'buttonTextTest',
                        value: 'Leave a review - test',
                        description: 'The text displayed on the review button -Test',
                        type: 'text',
                    },
                ],
            },
        });
        expect(mockCtx.prisma.configurations.update).toHaveBeenCalledTimes(1);
    });
});
