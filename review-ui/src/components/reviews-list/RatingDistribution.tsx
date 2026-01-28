import { FC } from 'react';
import { RatingDistributionProps } from '../../types/review.ts';
import { calculateReviewRating } from '../../utils/reviewsListing.ts';
import StarRating from './StarRating.tsx';

const RatingDistribution: FC<RatingDistributionProps> = ({ reviews }) => {
    const calculateRatingCounts = (): Record<number, number> => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((review) => {
            const rating = Math.round(calculateReviewRating(review));
            if (rating >= 1 && rating <= 5) {
                counts[rating]++;
            }
        });
        return counts;
    };

    const counts = calculateRatingCounts();
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return (
        <section
            className="p-4"
            aria-labelledby="rating-distribution-title"
            data-testid="rating-distribution"
        >
            <h3
                id="rating-distribution-title"
                className="font-semibold mb-4"
                data-testid="distribution-title"
            >
                Ratings Distribution
            </h3>
            <div
                className="space-y-3"
                role="list"
                aria-label="Rating breakdown by stars"
                data-testid="distribution-list"
            >
                {[5, 4, 3, 2, 1].map((star) => {
                    const percentage = total > 0 ? (counts[star] / total) * 100 : 0;
                    return (
                        <div
                            key={star}
                            className="flex items-center gap-3"
                            role="listitem"
                            aria-label={`${star} star rating: ${counts[star]} reviews`}
                            data-testid={`rating-row-${star}`}
                        >
                            <div
                                className="flex-shrink-0"
                                data-testid={`star-rating-${star}`}
                            >
                                <StarRating rating={star} size={20} />
                            </div>
                            <div
                                className="flex-1 bg-[color:var(--color-light)] rounded-full h-2.5 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={Math.round(percentage)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${Math.round(percentage)}% of reviews are ${star} stars`}
                                data-testid={`progress-bar-${star}`}
                            >
                                <div
                                    className="bg-[color:var(--color-yellow)] h-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                    data-testid={`progress-fill-${star}`}
                                />
                            </div>
                            <span
                                className="text-sm text-[color:var(--color-text)] w-12 text-right"
                                data-testid={`count-${star}`}
                            >
                                ({counts[star]})
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Screen reader summary */}
            <div className="sr-only" role="status">
                Total reviews: {total}. Distribution:
                {[5, 4, 3, 2, 1].map(star =>
                    ` ${star} stars: ${counts[star]} reviews.`
                ).join('')}
            </div>
        </section>
    );
};

export default RatingDistribution;