import Hapi from '@hapi/hapi';
import { getReviewStats } from '../utils/reviewStats';

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        reviewStatsPlugin: any;
    }
}

const reviewStatsPlugin: Hapi.Plugin<null> = {
    name: 'reviewStatsPlugin',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/v1/reviews/stats/{merchantId}',
                handler: getReviewStatsHandler,
                options: {
                    auth: false, // Public endpoint - stats are not sensitive
                },
            },
        ]);
    },
};

const getReviewStatsHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { merchantId } = request.params as { merchantId: string };
    const { prisma } = request.server.app;

    try {
        const stats = await getReviewStats(prisma, merchantId);

        return h
            .response({
                version: '1.0.0',
                data: stats,
            })
            .code(200);
    } catch (error: any) {
        console.error('Error fetching review stats:', error);
        return h
            .response({
                version: '1.0.0',
                error: error.message || 'Failed to fetch review statistics',
            })
            .code(500);
    }
};

export default reviewStatsPlugin;
