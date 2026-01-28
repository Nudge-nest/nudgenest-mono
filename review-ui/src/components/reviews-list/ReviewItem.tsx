import { FC } from 'react';
import { ReviewItemProps } from '../../types/review.ts';
import { calculateReviewRating, sanitizeReviewText } from '../../utils/reviewsListing.ts';
import { IconPhoto, IconShieldCheckFilled } from '@tabler/icons-react';
import StarRating from './StarRating.tsx';

const ReviewItem: FC<ReviewItemProps> = ({ review, onMediaClick }) => {
    const result = review.result || [];
    const nonNumericalResults = result.filter((res) => !res.value);
    const rating = calculateReviewRating(review);
    const comment = nonNumericalResults[nonNumericalResults.length - 1]?.comment || '';
    const allMedia: any[] = nonNumericalResults.filter((res: any) => res.mediaURL);
    const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '';
    const customerName = review.customerName ? review.customerName : 'Customer';

    const reviewAriaLabel = `Review by ${customerName}${review.verified ? ' (verified customer)' : ''} from ${reviewDate}`;
    const mediaAriaLabel = allMedia.length > 1 ? `View ${allMedia.length} review media items` : 'View review media';

    return (
        <article
            className="border border-[color:var(--color-border)] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 h-auto grid grid-rows-[64%_auto]"
            role="article"
            aria-label={reviewAriaLabel}
            data-testid="review-item"
        >
            {allMedia.length > 0 && (
                <button
                    className="relative cursor-pointer overflow-hidden w-full h-full bg-transparent border-none p-0"
                    onClick={() => onMediaClick(allMedia, 0)}
                    aria-label={mediaAriaLabel}
                    data-testid="review-media-button"
                    type="button"
                >
                    {allMedia.length > 1 && (
                        <div
                            className="absolute top-2.5 left-2.5 bg-[color:var(--color-bg)] bg-opacity-80 rounded-full px-2 py-1 flex items-center gap-1 text-sm font-semibold z-10"
                            aria-hidden="true"
                        >
                            <IconPhoto size={16} aria-hidden="true" />
                            <span>+{allMedia.length}</span>
                        </div>
                    )}
                    {allMedia[0].mediaURL?.includes('.mp4') || allMedia[0].mediaURL?.includes('video') ? (
                        <video
                            className="w-full h-full object-cover"
                            aria-label={`Review video by ${customerName}`}
                            tabIndex={-1}
                        >
                            <source src={allMedia[0].mediaURL} type="video/mp4" />
                        </video>
                    ) : (
                        <img
                            src={allMedia[0].mediaURL}
                            alt={`Review image by ${customerName}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                            tabIndex={-1}
                        />
                    )}
                </button>
            )}

            <div className="p-4 flex flex-col h-fit">
                <header className="flex items-center gap-1 mb-1">
                    <h3
                        className="font-bold text-[color:var(--color-text)] m-0"
                        data-testid="customer-name"
                        aria-label={`Customer: ${customerName}`}
                    >
                        {customerName}
                    </h3>
                    {review.verified && (
                        <IconShieldCheckFilled
                            size={16}
                            className="text-[color:var(--color-main)] flex-shrink-0"
                            aria-label="Verified customer"
                            data-testid="verified-badge"
                            role="img"
                        />
                    )}
                </header>

                <time
                    className="text-sm text-[color:var(--color-text)] font-light mb-2"
                    dateTime={review.createdAt}
                    data-testid="review-date"
                    aria-label={`Review date: ${reviewDate}`}
                >
                    {reviewDate}
                </time>

                <div
                    className="mb-3"
                    role="img"
                    aria-label={`Rating: ${rating} out of 5 stars`}
                    data-testid="review-rating"
                >
                    <StarRating rating={rating} />
                </div>

                {comment && (
                    <div data-testid="review-comment">
                        <p
                            className="text-sm text-[color:var(--color-text)] font-medium line-clamp-3"
                            aria-label={`Review comment: ${sanitizeReviewText(comment)}`}
                        >
                            {sanitizeReviewText(comment)}
                        </p>
                    </div>
                )}
            </div>
        </article>
    );
};

export default ReviewItem;
