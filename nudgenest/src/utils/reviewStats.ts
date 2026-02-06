import type { PrismaClient } from '../../generated/prisma/prisma/client';

export interface ReviewStats {
    totalReviews: number;
    averageRating: string;
    responseRate: number;
}

interface Review {
    result: any;
    replies: any;
}

/**
 * Get review statistics for a merchant
 * @param prisma - Prisma client instance
 * @param merchantId - MongoDB ObjectID of the merchant
 * @returns Review statistics including total, average rating, and response rate
 */
export async function getReviewStats(prisma: PrismaClient, merchantId: string): Promise<ReviewStats> {
    // Fetch all completed reviews for the merchant
    const reviews = await prisma.reviews.findMany({
        where: {
            merchantId,
            status: 'Completed',
        },
        select: {
            result: true,
            replies: true,
        },
    });

    const totalReviews = reviews.length;

    // If no reviews, return zero stats
    if (totalReviews === 0) {
        return {
            totalReviews: 0,
            averageRating: '0.0',
            responseRate: 0,
        };
    }

    const averageRating = calculateAverageRating(reviews);
    const responseRate = calculateResponseRate(reviews);

    return {
        totalReviews,
        averageRating,
        responseRate,
    };
}

/**
 * Calculate average rating from reviews
 * @param reviews - Array of reviews with result field
 * @returns Average rating formatted to 1 decimal place
 */
export function calculateAverageRating(reviews: Review[]): string {
    let totalRating = 0;
    let ratingCount = 0;

    for (const review of reviews) {
        // Handle null or undefined result
        if (!review.result) {
            continue;
        }

        // result is a JSON array of question-answer pairs
        // Example: [{ id: '...', value: '5', comment: '...' }, ...]
        let resultArray: any[];

        try {
            // Parse if it's a string, otherwise use as-is
            resultArray = typeof review.result === 'string' ? JSON.parse(review.result) : review.result;

            if (!Array.isArray(resultArray)) {
                continue;
            }
        } catch (error) {
            // Skip malformed JSON
            console.warn('Failed to parse review result JSON:', error);
            continue;
        }

        // Extract ratings from all questions in the review
        for (const item of resultArray) {
            if (item && item.value !== undefined && item.value !== null) {
                const rating = parseFloat(item.value);
                if (!isNaN(rating)) {
                    totalRating += rating;
                    ratingCount++;
                }
            }
        }
    }

    // If no valid ratings found, return 0.0
    if (ratingCount === 0) {
        return '0.0';
    }

    const average = totalRating / ratingCount;
    return average.toFixed(1);
}

/**
 * Calculate response rate (percentage of reviews with merchant replies)
 * @param reviews - Array of reviews with replies field
 * @returns Response rate as a percentage (0-100)
 */
export function calculateResponseRate(reviews: Review[]): number {
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
        return 0;
    }

    // Count reviews that have replies
    const reviewsWithReplies = reviews.filter((review) => {
        if (!review.replies) {
            return false;
        }

        // Handle both string and object replies
        if (typeof review.replies === 'string') {
            try {
                const parsed = JSON.parse(review.replies);
                // Check if parsed object has meaningful content
                return parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0);
            } catch {
                // If parsing fails but string exists and isn't empty, count it
                return review.replies.trim().length > 0;
            }
        }

        // For object replies, check if it has content
        if (Array.isArray(review.replies)) {
            return review.replies.length > 0;
        }

        return Object.keys(review.replies).length > 0;
    }).length;

    const responseRate = (reviewsWithReplies / totalReviews) * 100;
    return Math.round(responseRate);
}
