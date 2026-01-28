import { FC } from 'react';
import { ReviewSummaryProps } from '../../types/review.ts';
import { calculateReviewRating } from '../../utils/reviewsListing.ts';
import StarRating from './StarRating.tsx';
import Dropdown from './Dropdown.tsx';
import { IconCaretDown } from '@tabler/icons-react';
import RatingDistribution from './RatingDistribution.tsx';

const ReviewSummary: FC<ReviewSummaryProps> = ({ reviews }) => {
    const reviewCount = reviews.length;
    const avgRating =
        reviewCount > 0 ? reviews.reduce((sum, review) => sum + calculateReviewRating(review), 0) / reviewCount : 0;

    return (
        <div className="flex items-center gap-4 px-4">
            <StarRating rating={avgRating} size={24} />
            <span className="text-[color:var(--color-text)]">
                {reviewCount} Review{reviewCount !== 1 ? 's' : ''}
            </span>
            <Dropdown
                trigger={
                    <button className="hover:bg-[color:var(--color-bg)] p-1 rounded transition-colors">
                        <IconCaretDown size={24} />
                    </button>
                }
                width="350px"
            >
                <RatingDistribution reviews={reviews} />
            </Dropdown>
        </div>
    );
};

export default ReviewSummary;
