/*Handles all things related to Reviews*/
import Hapi from '@hapi/hapi';

import * as dotenv from 'dotenv';
import { eventType, IRabbitDataObject, IReviewMessagePayloadContent } from '../types';
import { convertObjectToBuffer, createMerchantEmailMessagingTemplate } from './merchant';
import { isRabbitReviewRequestMessageValid, sampleMessaging } from '../messagesSchema';
import { getMerchantWithBusinessInfo } from '../utils/reviews';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        reviewsPlugin: any;
    }
}

// Handler functions
const getReviewById = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { reviewId } = request.params;
    const { prisma } = request.server.app;
    try {
        const review = await prisma.reviews.findUnique({
            where: {
                id: reviewId as string,
            },
            select: {
                // Explicitly select fields (excludes otpSecret)
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

        if (!review) {
            return h.response({ version: '1.0.0', error: 'Review not found' }).code(404);
        }

        return h.response({ version: '1.0.0', data: review }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

const createReview = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const reviewData = request.payload as any;
    const { prisma } = request.server.app;

    try {
        // Validate required fields
        if (!reviewData.merchantId || !reviewData.customerName || !reviewData.status) {
            return h.response({
                version: '1.0.0',
                error: 'Missing required fields: merchantId, customerName, status'
            }).code(400);
        }

        // Resolve auto-publish when review is created as Completed (e.g. store reviews)
        let published = false;
        if (reviewData.status === 'Completed' && reviewData.result) {
            published = await resolvePublished(prisma, reviewData.merchantId, reviewData.result);
        }

        // Create the review
        const newReview = await prisma.reviews.create({
            data: {
                merchantId: reviewData.merchantId,
                merchantBusinessId: reviewData.merchantBusinessId || '',
                shopId: reviewData.shopId || '',
                customerEmail: reviewData.customerEmail || '',
                customerPhone: reviewData.customerPhone || '',
                customerName: reviewData.customerName,
                items: reviewData.items || [],
                result: reviewData.result || null,
                verified: reviewData.verified ?? false,
                replies: reviewData.replies || null,
                status: reviewData.status,
                merchantApiKey: reviewData.merchantApiKey || null,
                published,
            },
        });

        return h.response({ version: '1.0.0', data: newReview }).code(201);
    } catch (error: any) {
        console.error('Error creating review:', error);
        return h.response({
            version: '1.0.0',
            error: error.message || 'Failed to create review'
        }).code(500);
    }
};

//TODo: Add order Number to review schema and everywhere

export const createReviewEmailMessagingTemplate = (
    review: any,
    sampleMessaging: IRabbitDataObject<IReviewMessagePayloadContent>,
    eventType: eventType
) => {
    return {
        ...sampleMessaging,
        eventType: eventType,
        payload: {
            ...sampleMessaging.payload,
            content: {
                ...sampleMessaging.payload.content,
                userName: review.customerName,
                type: eventType,
                email: review.customerEmail,
                order_number: undefined,
            },
            context: { ...sampleMessaging.payload.context, receiver: ['reviewer'] },
        },
    } as IRabbitDataObject<IReviewMessagePayloadContent>;
};

// Maps autoPublish config value → minimum star rating for public visibility
const AUTO_PUBLISH_THRESHOLDS: Record<string, number> = {
    THREESTARS: 3,
    FOURSTARS: 4,
    FIVESTARS: 5,
};

// Average star rating across all reviewed items (each item has a numeric `value`)
const getAverageRating = (result: any[]): number => {
    if (!Array.isArray(result) || result.length === 0) return 0;
    const ratings = result
        .map((r: any) => Number(r.value))
        .filter((v: number) => !isNaN(v) && v > 0);
    if (ratings.length === 0) return 0;
    return Math.floor(ratings.reduce((sum, v) => sum + v, 0) / ratings.length);
};

// Shared auto-publish resolution — used by both create and update paths
const resolvePublished = async (prisma: any, merchantId: string, result: any[]): Promise<boolean> => {
    const config = await prisma.configurations.findFirst({
        where: { merchantId },
        select: { publish: true },
    });
    const publishField = config?.publish?.find((f: any) => f.key === 'autoPublish');
    const autoPublishValue = publishField?.value ?? 'THREESTARS';
    const minRating = AUTO_PUBLISH_THRESHOLDS[autoPublishValue] ?? 3;
    const avgRating = getAverageRating(Array.isArray(result) ? result : []);
    return avgRating >= minRating;
};

const updateReviewById = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { reviewId } = request.params;
    const reviewUpdate = request.payload as any;
    const { prisma, pubsub } = request.server.app;
    const { messagingTopic } = pubsub;
    if (reviewUpdate) {
        if (Object.keys(reviewUpdate).length === 0) throw Error('Update data missing');
    }
    try {
        // Determine auto-publish before saving — only when completing a review
        if (reviewUpdate.status === 'Completed' && reviewUpdate.result) {
            const existingReview = await prisma.reviews.findUnique({
                where: { id: reviewId as string },
                select: { merchantId: true },
            });

            if (existingReview) {
                reviewUpdate.published = await resolvePublished(prisma, existingReview.merchantId, reviewUpdate.result);
                request.logger.info(
                    { reviewId, published: reviewUpdate.published },
                    'Auto-publish decision'
                );
            }
        }

        const updatedReview = await prisma.reviews.update({
            where: { id: reviewId as string },
            data: { ...reviewUpdate },
        });

        if (reviewUpdate.status === 'Completed' && reviewUpdate.result) {
            const merchant = await getMerchantWithBusinessInfo(prisma, updatedReview.merchantBusinessId);
            const completedReviewMessageToReviewee = createMerchantEmailMessagingTemplate(
                merchant,
                sampleMessaging,
                'completed-review-merchant'
            );
            const completedReviewMessageToReviewer = createReviewEmailMessagingTemplate(
                updatedReview,
                sampleMessaging,
                'completed-review'
            );
            if (
                !isRabbitReviewRequestMessageValid(completedReviewMessageToReviewee) ||
                !isRabbitReviewRequestMessageValid(completedReviewMessageToReviewer)
            )
                throw new Error('Invalid messaging data to publish');

            // Always send thank-you emails — completed is completed regardless of rating.
            // The `published` flag on the review controls public visibility.
            const messageBuffer1 = convertObjectToBuffer(completedReviewMessageToReviewer);
            const messageBuffer2 = convertObjectToBuffer(completedReviewMessageToReviewee);

            await Promise.all([
                messagingTopic.publishMessage({ data: messageBuffer1 }),
                messagingTopic.publishMessage({ data: messageBuffer2 })
            ]);
        } else {
            return h.response({ version: '1.0.0', data: updatedReview }).code(200);
        }

        return h.response({ version: '1.0.0', data: updatedReview }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

//test merchant id MTY3NTgwMjk3MzU0

const listReviewsByMerchantId = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { shopid, merchantid, published } = request.query as any;
    const { prisma } = request.server.app;

    try {
        // Build where clause to support filtering by either shopId or merchantId
        const whereClause: any = {};
        if (shopid) {
            whereClause.shopId = shopid as string;
        } else if (merchantid) {
            whereClause.merchantId = merchantid as string;
        } else {
            return h.response({
                version: '1.0.0',
                error: 'Either shopid or merchantid query parameter is required'
            }).code(400);
        }

        // ?published=true  → only published reviews (public widget / storefront)
        // ?published=false → only unpublished reviews (merchant moderation queue)
        // omitted          → all reviews (merchant dashboard — sees everything)
        if (published === 'true') {
            whereClause.published = true;
        } else if (published === 'false') {
            whereClause.published = false;
        }

        const reviews = await prisma.reviews.findMany({
            where: whereClause,
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
            orderBy: {
                createdAt: 'desc'
            }
        });
        return h.response({ version: '1.0.0', data: reviews }).code(200);
    } catch (error: any) {
        return h
            .response({
                version: '1.0.0',
                error: error.message,
            })
            .code(500);
    }
};

// Plugin definition
const reviewsPlugin: Hapi.Plugin<null> = {
    name: 'reviewsPlugin',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/v1/reviews/{reviewId}',
                handler: getReviewById,
                options: {
                    auth: false, // Allow unauthenticated access so customers can fetch their review
                },
            },
            {
                method: 'POST',
                path: '/api/v1/reviews',
                handler: createReview,
                options: {
                    auth: false, // Allow unauthenticated access for store reviews
                },
            },
            {
                method: 'PUT',
                path: '/api/v1/reviews/{reviewId}',
                handler: updateReviewById,
                options: {
                    auth: 'apikey',
                },
            },
            {
                method: 'GET',
                path: '/api/v1/reviews/list',
                handler: listReviewsByMerchantId,
                options: {
                    auth: false, // Public endpoint - no authentication required
                },
            },
        ]);
    },
};

export default reviewsPlugin;
