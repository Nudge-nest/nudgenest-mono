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
import { IconStar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

/** Returns items-per-page that matches the grid column count at each breakpoint:
 *  mobile  < 640px → 1 col  → 1 per page
 *  tablet  640–767 → 2 cols → 2 per page
 *  desktop ≥ 768px → 4 cols → 4 per page
 */
const useItemsPerPage = (): number => {
    const get = () => {
        if (window.innerWidth >= 768) return 4;
        if (window.innerWidth >= 640) return 2;
        return 1;
    };
    const [itemsPerPage, setItemsPerPage] = useState<number>(get);

    useEffect(() => {
        const handleResize = () => setItemsPerPage(get());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return itemsPerPage;
};

const ReviewsListPage: FC<ReviewContainerProps> = ({ merchantId: merchantIdProp }) => {
    const { shopId } = useParams<{ shopId: string }>();
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [currentSort, setCurrentSort] = useState<SortType>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<IUploadedMediaObject[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

    const itemsPerPage = useItemsPerPage();
    const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
    const paginatedReviews = reviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    // A 24-char hex string is a MongoDB ObjectId (merchantId); anything else is a Shopify shopId
    const isObjectId = /^[0-9a-f]{24}$/.test(shopId ?? '');
    const reviewsQuery = isObjectId ? { merchantId: shopId } : (shopId ?? '');
    const { data: reviewsData, isError, isFetching } = useListReviewsQuery(reviewsQuery);
    const merchantId = merchantIdProp ?? reviewsData?.[0]?.merchantId;

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
            setReviews(sortReviews(reviewsData, 'newest'));
        }
    }, [isFetching, isError, reviews, reviewsData, setReviews, sortReviews]);

    // Reset to page 1 when sort order or viewport breakpoint changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentSort, itemsPerPage]);

    // Report page height to Shopify parent when embedded in iframe
    useEffect(() => {
        if (typeof window === 'undefined' || window.self === window.top) return;
        const el = document.documentElement;
        const sendHeight = () => {
            window.parent.postMessage({ type: 'nudgenest_resize', height: el.scrollHeight }, '*');
        };
        const observer = new ResizeObserver(sendHeight);
        observer.observe(el);
        sendHeight();
        return () => observer.disconnect();
    }, []);

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
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                        data-testid="reviews-skeleton-grid"
                    >
                        {[1, 2, 3, 4].map((i) => (
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
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                    role="list"
                    aria-label={`${reviews.length} customer reviews`}
                    data-testid="reviews-grid-container"
                >
                    {paginatedReviews.map((review, index) => (
                        <article
                            key={review.id || review.createdAt}
                            role="listitem"
                            aria-label={`Review ${(currentPage - 1) * itemsPerPage + index + 1} of ${reviews.length}`}
                            data-testid={`review-item-${index}`}
                        >
                            <ReviewItem
                                review={review}
                                onMediaClick={handleMediaClick}
                            />
                        </article>
                    ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <nav
                        className="flex items-center justify-center gap-3 mt-8"
                        aria-label="Reviews pagination"
                        data-testid="pagination-controls"
                    >
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border
                                border-[color:var(--color-border)] text-[color:var(--color-text)]
                                hover:bg-[color:var(--color-main-light)] transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Previous page"
                        >
                            <IconChevronLeft size={18} />
                        </button>

                        <span
                            className="text-sm text-[color:var(--color-text)] min-w-[6rem] text-center"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border
                                border-[color:var(--color-border)] text-[color:var(--color-text)]
                                hover:bg-[color:var(--color-main-light)] transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Next page"
                        >
                            <IconChevronRight size={18} />
                        </button>
                    </nav>
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
