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
                replies: true,
                customerName: true,
                items: true,
                status: true,
                result: true,
                createdAt: true,
                updatedAt: true,
            },
        });
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

const updateReviewById = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { reviewId } = request.params;
    const reviewUpdate = request.payload as any;
    const { prisma, pubsub } = request.server.app;
    const { messagingTopic } = pubsub;
    if (reviewUpdate) {
        if (Object.keys(reviewUpdate).length === 0) throw Error('Update data missing');
    }
    try {
        const updatedReview = await prisma.reviews.update({
            where: {
                id: reviewId as string,
            },
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

            // Publish to Pub/Sub
            const messageBuffer1 = convertObjectToBuffer(completedReviewMessageToReviewer);
            const messageBuffer2 = convertObjectToBuffer(completedReviewMessageToReviewee);

            await Promise.all([
                messagingTopic.publishMessage({ data: messageBuffer1 }),
                messagingTopic.publishMessage({ data: messageBuffer2 })
            ]);
        } else {
            return;
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
    const { shopid } = request.query as any;
    const { prisma } = request.server.app;

    try {
        const reviews = await prisma.reviews.findMany({
            where: {
                shopId: shopid as string
            },
            select: {
                // Explicitly select fields (excludes otpSecret)
                id: true,
                merchantId: true,
                merchantApiKey: true,
                shopId: true,
                merchantBusinessId: true,
                verified: true,
                replies: true,
                customerName: true,
                items: true,
                status: true,
                result: true,
                createdAt: true,
                updatedAt: true,
            },
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

export default reviewsPlugin;
