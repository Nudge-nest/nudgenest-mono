import { FC } from 'react';
import { IReview, IUploadedMediaObject, ReviewContainerProps, SortType } from '../types/review';
import { useState } from 'react';
import { useCallback } from 'react';
import { calculateReviewRating } from '../utils/reviewsListing.ts';
import { useEffect } from 'react';

import Loading from '../components/Loading.tsx';
import ErrorComponent from '../components/ErrorComponent.tsx';
import ReviewSummary from '../components/reviews-list/ReviewSummary.tsx';
import SortOptions from '../components/reviews-list/SortOptions.tsx';
import ReviewItem from '../components/reviews-list/ReviewItem.tsx';
import MediaModal from '../components/reviews-list/MediaModal.tsx';
import ReviewFormModal from '../components/reviews-list/ReviewFormModal.tsx';
import { useListReviewsQuery } from '../redux/nudgenest.ts';
import { useParams } from 'react-router';

const ReviewsListPage: FC<ReviewContainerProps> = ({ merchantId = '68414ac959456a2575dd1aae' }) => {
    const { id } = useParams<{ id: string }>();
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [currentSort, setCurrentSort] = useState<SortType>('newest');
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<IUploadedMediaObject[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const { data: reviewsData, isError, isFetching } = useListReviewsQuery(id ? id : '67580297354');

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
        if (!isFetching && !isError && reviews.length === 0 && reviewsData) setReviews(reviewsData);
    }, [isFetching, isError, reviews, reviewsData, setReviews]);

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
            <div
                role="status"
                aria-live="polite"
                aria-label="Loading reviews"
                data-testid="reviews-loading"
            >
                <Loading />
                <span className="sr-only">Loading reviews...</span>
            </div>
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
                className="max-w-7xl mx-auto px-4 py-8"
                data-testid="reviews-empty"
            >
                <p
                    className="text-center text-[color:var(--color-text)]"
                    role="status"
                >
                    No reviews available at this time.
                </p>
            </main>
        );
    }

    return (
        <main
            className="w-full mx-auto px-4 py-8 min-h-[500px]"
            aria-labelledby="reviews-page-title"
            data-testid="reviews-list-page"
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
                className="max-w-full"
                aria-label="Reviews list"
                data-testid="reviews-container"
            >
                <div
                    className="flex flex-nowrap gap-4 px-4 overflow-x-scroll"
                    role="list"
                    aria-label={`${reviews.length} customer reviews`}
                    tabIndex={0}
                    aria-describedby="scroll-instructions"
                    data-testid="reviews-scroll-container"
                >
                    {reviews.map((review, index) => (
                        <article
                            key={review.id || review.createdAt}
                            className="flex-shrink-0 w-64"
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
                <span id="scroll-instructions" className="sr-only">
                    Use arrow keys to scroll through reviews horizontally
                </span>
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