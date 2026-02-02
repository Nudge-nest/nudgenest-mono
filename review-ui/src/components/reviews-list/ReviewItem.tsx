import { FC, memo, useState } from 'react';
import { ReviewItemProps } from '../../types/review.ts';
import { calculateReviewRating, sanitizeReviewText } from '../../utils/reviewsListing.ts';
import { formatRelativeDate } from '../../utils/dateFormat.ts';
import { IconPhoto, IconShieldCheckFilled, IconStar } from '@tabler/icons-react';
import StarRating from './StarRating.tsx';

const ReviewItem: FC<ReviewItemProps> = memo(({ review, onMediaClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const result = review.result || [];
    const nonNumericalResults = result.filter((res) => !res.value);
    const rating = calculateReviewRating(review);
    const comment = nonNumericalResults[nonNumericalResults.length - 1]?.comment || '';
    const allMedia: any[] = nonNumericalResults.filter((res: any) => res.mediaURL);
    const reviewDate = review.createdAt ? formatRelativeDate(review.createdAt) : '';
    const customerName = review.customerName ? review.customerName : 'Customer';

    const sanitizedComment = sanitizeReviewText(comment);
    const CHAR_LIMIT = 150;
    const isLongComment = sanitizedComment.length > CHAR_LIMIT;

    const reviewAriaLabel = `Review by ${customerName}${review.verified ? ' (verified customer)' : ''} from ${reviewDate}`;
    const mediaAriaLabel = allMedia.length > 1 ? `View ${allMedia.length} review media items` : 'View review media';

    return (
        <article
            className="border border-[color:var(--color-border)] hover:shadow-xl hover:shadow-[color:var(--color-main)]/10
            transition-all duration-300 ease-out transform hover:-translate-y-2 hover:border-[color:var(--color-main)]/30
            rounded-lg overflow-hidden flex flex-col h-full bg-[color:var(--color-bg)] cursor-pointer"
            role="article"
            aria-label={reviewAriaLabel}
            data-testid="review-item"
        >
            {allMedia.length > 0 ? (
                <button
                    className="relative cursor-pointer overflow-hidden w-full aspect-square bg-gray-100 border-none p-0 flex-shrink-0"
                    onClick={() => onMediaClick(allMedia, 0)}
                    aria-label={mediaAriaLabel}
                    data-testid="review-media-button"
                    type="button"
                >
                    {/* Loading skeleton for media */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                    )}

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
                            onLoadedData={() => setImageLoaded(true)}
                        >
                            <source src={allMedia[0].mediaURL} type="video/mp4" />
                        </video>
                    ) : (
                        <img
                            src={allMedia[0].mediaURL}
                            alt={`Review image by ${customerName}`}
                            className={`w-full h-full object-cover hover:scale-105 transition-all duration-200 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                            tabIndex={-1}
                            onLoad={() => setImageLoaded(true)}
                        />
                    )}
                </button>
            ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                    <IconStar size={48} className="text-gray-300" />
                </div>
            )}

            <div className="p-4 flex flex-col flex-1 gap-2">
                <header className="flex items-center gap-1.5">
                    <h3
                        className="font-semibold text-base text-[color:var(--color-text)] m-0"
                        data-testid="customer-name"
                        aria-label={`Customer: ${customerName}`}
                    >
                        {customerName}
                    </h3>
                    {review.verified && (
                        <div className="relative group/badge">
                            <IconShieldCheckFilled
                                size={16}
                                className="text-[color:var(--color-main)] flex-shrink-0 transition-transform duration-200 group-hover/badge:scale-110"
                                aria-label="Verified customer"
                                data-testid="verified-badge"
                                role="img"
                            />
                            <span
                                className="absolute left-1/2 -translate-x-1/2 -top-10 bg-[color:var(--color-dark)] text-[color:var(--color-white)]
                                text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                                role="tooltip"
                                aria-hidden="true"
                            >
                                Verified Purchase
                            </span>
                        </div>
                    )}
                </header>

                <div className="flex items-center gap-2">
                    <div
                        role="img"
                        aria-label={`Rating: ${rating} out of 5 stars`}
                        data-testid="review-rating"
                    >
                        <StarRating rating={rating} size={14} />
                    </div>
                    <span className="text-gray-400">•</span>
                    <time
                        className="text-xs text-[color:var(--color-text)] opacity-70"
                        dateTime={review.createdAt}
                        data-testid="review-date"
                        aria-label={`Review date: ${reviewDate}`}
                    >
                        {reviewDate}
                    </time>
                </div>

                {comment && (
                    <div data-testid="review-comment" className="flex-1">
                        <p
                            className="text-sm text-[color:var(--color-text)] leading-relaxed"
                            aria-label={`Review comment: ${sanitizedComment}`}
                        >
                            {isLongComment && !isExpanded
                                ? `${sanitizedComment.slice(0, CHAR_LIMIT)}...`
                                : sanitizedComment}
                        </p>
                        {isLongComment && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[color:var(--color-main)] text-sm font-semibold mt-2 hover:opacity-80 transition-opacity"
                                aria-label={isExpanded ? 'Show less' : 'Read more'}
                                data-testid="read-more-button"
                            >
                                {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
});

ReviewItem.displayName = 'ReviewItem';

export default ReviewItem;
