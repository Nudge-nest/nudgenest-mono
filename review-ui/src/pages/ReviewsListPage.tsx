import { FC } from 'react';
import { IReview, IUploadedMediaObject, ReviewContainerProps, SortType } from '../types/review';
import { useState } from 'react';
import { useCallback } from 'react';
import { calculateReviewRating } from '../utils/reviewsListing.ts';
import { useEffect } from 'react';

import ErrorComponent from '../components/ErrorComponent.tsx';
import ReviewSummary from '../components/reviews-list/ReviewSummary.tsx';
import SortOptions from '../components/reviews-list/SortOptions.tsx';
import ReviewItem from '../components/reviews-list/ReviewItem.tsx';
import ReviewItemSkeleton from '../components/reviews-list/ReviewItemSkeleton.tsx';
import MediaModal from '../components/reviews-list/MediaModal.tsx';
import ReviewFormModal from '../components/reviews-list/ReviewFormModal.tsx';
import { useListReviewsQuery } from '../redux/nudgenest.ts';
import { useParams } from 'react-router';
import { useConstrainedView } from '../hooks/useConstrainedView.ts';
import { IconStar } from '@tabler/icons-react';

const ReviewsListPage: FC<ReviewContainerProps> = ({ merchantId: merchantIdProp }) => {
    const { shopId } = useParams<{ shopId: string }>();
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [currentSort, setCurrentSort] = useState<SortType>('newest');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<IUploadedMediaObject[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

    const { data: reviewsData, isError, isFetching } = useListReviewsQuery(shopId ?? '');
    const merchantId = merchantIdProp ?? reviewsData?.[0]?.merchantId;

    // Auto-detect if we're in an iframe (Shopify embedding)
    const isIframe = useConstrainedView();

    const sortReviews = useCallback((reviewsToSort: IReview[], sortType: SortType): IReview[] => {
        const sorted = [...reviewsToSort];

        switch (sortType) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'highest':
                return sorted.sort((a, b) => calculateReviewRating(b) - calculateReviewRating(a));
            case 'lowest':
                return sorted.sort((a, b) => calculateReviewRating(a) - calculateReviewRating(b));
            case 'most_helpful':
                return sorted.sort((a, b) => {
                    const mediaA = (a.result || [])
                        .filter((res) => res.media && res.media.length > 0)
                        .reduce((sum, res) => sum + (res.media?.length || 0), 0);
                    const mediaB = (b.result || [])
                        .filter((res) => res.media && res.media.length > 0)
                        .reduce((sum, res) => sum + (res.media?.length || 0), 0);
                    if (mediaB !== mediaA) return mediaB - mediaA;
                    return calculateReviewRating(b) - calculateReviewRating(a);
                });
            default:
                return sorted;
        }
    }, []);


    useEffect(() => {
        if (!isFetching && !isError && reviews.length === 0 && reviewsData) {
            // Sort by newest first (default sort)
            setReviews(sortReviews(reviewsData, 'newest'));
        }
    }, [isFetching, isError, reviews, reviewsData, setReviews, sortReviews]);

    const handleSortChange = (sortType: SortType) => {
        setCurrentSort(sortType);
        setReviews((prevReviews) => sortReviews(prevReviews, sortType));
    };

    const handleMediaClick = (media: IUploadedMediaObject[], startIndex: number) => {
        setSelectedMedia(media);
        setSelectedMediaIndex(startIndex);
        setMediaModalOpen(true);
    };

    if (isFetching) {
        return (
            <main
                className="w-full max-w-7xl mx-auto px-4 py-8"
                data-testid="reviews-loading"
                style={{
                    paddingTop: 'max(2rem, env(safe-area-inset-top))',
                    paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))'
                }}
            >
                <header className="flex flex-col md:flex-row md:justify-between mb-8 gap-4">
                    {/* Summary skeleton */}
                    <div className="flex items-center gap-4 px-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-6 h-6 bg-gray-200 rounded-sm animate-pulse" />
                            ))}
                        </div>
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Controls skeleton */}
                    <div className="flex items-center gap-4 px-4">
                        <div className="h-11 w-32 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-11 w-11 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </header>

                <section className="w-full" aria-label="Loading reviews" role="status">
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        data-testid="reviews-skeleton-grid"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <ReviewItemSkeleton key={i} />
                        ))}
                    </div>
                    <span className="sr-only">Loading reviews...</span>
                </section>
            </main>
        );
    }

    if (isError) {
        return (
            <div
                role="alert"
                data-testid="reviews-error"
            >
                <ErrorComponent />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <main
                className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen"
                data-testid="reviews-empty"
            >
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <IconStar
                            size={64}
                            className="text-[color:var(--color-disabled)] mx-auto"
                            stroke={1.5}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-[color:var(--color-text)] mb-3">
                        No Reviews Yet
                    </h2>
                    <p
                        className="text-[color:var(--color-text)] opacity-75 mb-6 leading-relaxed"
                        role="status"
                    >
                        Be the first to share your experience! Your feedback helps others make informed decisions.
                    </p>
                    {merchantId && (
                        <button
                            onClick={() => setReviewFormOpen(true)}
                            className="px-6 py-3 bg-[color:var(--color-main)] text-white rounded-lg
                            hover:opacity-90 transition-all duration-200 font-medium shadow-sm"
                            aria-label="Write the first review"
                            data-testid="empty-state-add-review"
                        >
                            Write a Review
                        </button>
                    )}
                </div>

                {merchantId && (
                    <ReviewFormModal
                        isOpen={reviewFormOpen}
                        onClose={() => setReviewFormOpen(false)}
                        merchantId={merchantId}
                        aria-label="Add review modal"
                        data-testid="review-form-modal"
                    />
                )}
            </main>
        );
    }

    return (
        <main
            className="w-full max-w-7xl mx-auto px-4 py-8"
            aria-labelledby="reviews-page-title"
            data-testid="reviews-list-page"
            style={{
                paddingTop: 'max(2rem, env(safe-area-inset-top))',
                paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))'
            }}
        >

            <header
                className="flex flex-col md:flex-row md:justify-between mb-8 gap-4"
                data-testid="reviews-header"
            >
                <ReviewSummary reviews={reviews} />
                <SortOptions
                    currentSort={currentSort}
                    onSortChange={handleSortChange}
                    onAddReview={() => setReviewFormOpen(true)}
                />
            </header>

            <section
                className="w-full"
                aria-label="Reviews list"
                data-testid="reviews-container"
            >
                {isIframe ? (
                    /* Horizontal scroll mode for iframe (Shopify) */
                    <div className="relative">
                        {/* Review count indicator */}
                        <div className="mb-4 text-sm text-[color:var(--color-text)] opacity-75">
                            Showing {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </div>

                        {/* Horizontal scrollable container */}
                        <div
                            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth
                            scrollbar-thin scrollbar-thumb-[color:var(--color-main)] scrollbar-track-gray-200"
                            role="list"
                            aria-label={`${reviews.length} customer reviews`}
                            data-testid="reviews-horizontal-scroll"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'var(--color-main) #e5e7eb'
                            }}
                        >
                            {reviews.map((review, index) => (
                                <article
                                    key={review.id || review.createdAt}
                                    className="flex-shrink-0 w-80 snap-start"
                                    role="listitem"
                                    aria-label={`Review ${index + 1} of ${reviews.length}`}
                                    data-testid={`review-item-${index}`}
                                >
                                    <ReviewItem
                                        review={review}
                                        onMediaClick={handleMediaClick}
                                    />
                                </article>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Grid mode for standalone/larger views */
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        role="list"
                        aria-label={`${reviews.length} customer reviews`}
                        data-testid="reviews-grid-container"
                    >
                        {reviews.map((review, index) => (
                            <article
                                key={review.id || review.createdAt}
                                role="listitem"
                                aria-label={`Review ${index + 1} of ${reviews.length}`}
                                data-testid={`review-item-${index}`}
                            >
                                <ReviewItem
                                    review={review}
                                    onMediaClick={handleMediaClick}
                                />
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Screen reader announcement for sort changes */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="sort-announcement"
            >
                Reviews sorted by {currentSort.replace('_', ' ')}
            </div>

            <MediaModal
                isOpen={mediaModalOpen}
                onClose={() => setMediaModalOpen(false)}
                mediaItems={selectedMedia}
                startIndex={selectedMediaIndex}
                aria-label="Media viewer modal"
                data-testid="media-modal"
            />

            <ReviewFormModal
                isOpen={reviewFormOpen}
                onClose={() => setReviewFormOpen(false)}
                merchantId={merchantId}
                aria-label="Add review modal"
                data-testid="review-form-modal"
            />
        </main>
    );
};

export default ReviewsListPage;