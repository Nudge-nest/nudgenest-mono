import { useEffect, useState, useCallback, useMemo } from 'react';
import { useReview } from '../contexts/ReviewContext';
import Loading from '../components/Loading.tsx';
import { IReviewItem, IReviewResult } from '../types/review.ts';
import RatingWidget from '../components/review/RatingWidget.tsx';
import MediaWidget from '../components/review/MediaWidget.tsx';
import CommentWidget from '../components/review/CommentWidget.tsx';

const ReviewPage = () => {
    const { review, sliderHook, isFetching, isError } = useReview();
    const [items, setItems] = useState<IReviewItem[]>([]);
    const [result, setResult] = useState<IReviewResult[] | undefined>(undefined);

    // Get slide count - recalculate when slider is loaded
    const slideCount = useMemo(() => {
        return sliderHook.instanceRef.current?.track.details.slides.length || 3; // Default to 3 slides
    }, [sliderHook.loaded]); // Depend on loaded state, not ref

    // Update state when review changes
    useEffect(() => {
        if (review) {
            setItems(review.items);
            if (review.result) setResult(review.result);
        }
    }, [review]);

    // Handle keyboard navigation for slider
    const handleKeyDown = useCallback((event: React.KeyboardEvent, targetIndex: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            sliderHook.instanceRef.current?.moveToIdx(targetIndex);
        }
    }, []); // Refs don't need to be in dependencies

    // Navigate to specific slide
    const navigateToSlide = useCallback((idx: number) => {
        sliderHook.instanceRef.current?.moveToIdx(idx);
    }, []); // Refs don't need to be in dependencies

    // Get slide label for accessibility
    const getSlideLabel = useCallback((index: number): string => {
        switch (index) {
            case 0:
                return 'Rating section';
            case 1:
                return 'Media upload section';
            case 2:
                return 'Comment section';
            default:
                return `Slide ${index + 1}`;
        }
    }, []);

    // Loading state
    if (isFetching) {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label="Loading reviews"
                data-testid="review-loading"
                className="flex justify-center items-center h-screen"
            >
                <Loading />
                <span className="sr-only text-red-600">Loading reviews...</span>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div
                role="alert"
                className="flex flex-col items-center justify-center h-full p-4"
                data-testid="review-error"
            >
                <p className="text-red-600 mb-4">Failed to load reviews</p>
                <p className="text-gray-600 text-sm">{'Please try again later'}</p>
            </div>
        );
    }

    // Empty state
    if (!items || items.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center h-full p-4"
                data-testid="review-empty"
            >
                <p className="text-gray-600">No items to review</p>
            </div>
        );
    }

    return (
        <div
            className="h-screen px-4 text-center grid grid-rows-[95%_auto] safe-area-inset"
            data-testid="review-page"
            style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* Main content area with slider */}
            <section
                ref={sliderHook.sliderRef}
                className="h-full overflow-hidden keen-slider"
                role="region"
                aria-label="Review sections"
                aria-roledescription="carousel"
                data-testid="review-slider"
            >
                {/* Slide 1: Rating Widgets */}
                <article
                    className="h-full keen-slider__slide"
                    role="tabpanel"
                    aria-label="Product ratings"
                    data-testid="rating-slide"
                >
                    <div className={`h-full flex flex-col gap-2 p-4 ${items.length === 1 ? 'justify-center' : 'justify-start pt-8'}`}>
                        <h2 className="sr-only">Rate Your Products</h2>

                        {/* Scrollable container for rating widgets */}
                        <div
                            className={`flex-1 overflow-y-auto overflow-x-hidden ${items.length > 3 ? 'space-y-6' : items.length === 1 ? 'flex items-center justify-center' : 'flex flex-col justify-evenly'}`}
                            role="list"
                            aria-label="Products to rate"
                            data-testid="rating-widgets-container"
                            style={{
                                maxHeight: 'calc(100% - 2rem)',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'var(--color-main) transparent'
                            }}
                        >
                            <div className={items.length > 3 ? 'space-y-4' : items.length === 1 ? '' : 'flex flex-col justify-evenly h-full'}>
                                {items.map((item: IReviewItem, index: number) => (
                                    <div
                                        key={item.id || index}
                                        role="listitem"
                                        aria-label={`Product ${index + 1} of ${items.length}: ${item.name || 'Unnamed product'}`}
                                        data-testid={`rating-widget-${index}`}
                                    >
                                        <RatingWidget
                                            product={item}
                                            result={result}
                                            isCompleted={!!(result && result.length > 0)}
                                            aria-describedby={`rating-status-${index}`}
                                        />
                                        {/*<span
                                            id={`rating-status-${index}`}
                                            className="sr-only"
                                        >
                      {result?.find(r => r.id === item.id)
                          ? 'Rating completed'
                          : 'Rating pending'}
                    </span>*/}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>

                {/* Slide 2: Media Widget */}
                <article
                    className="h-full keen-slider__slide flex items-center justify-center"
                    role="tabpanel"
                    aria-label="Upload media"
                    data-testid="media-slide"
                >
                    <div className="w-full max-w-2xl">
                        <MediaWidget aria-label="Media upload widget" />
                    </div>
                </article>

                {/* Slide 3: Comment Widget */}
                <article
                    className="h-full keen-slider__slide flex items-center justify-center"
                    role="tabpanel"
                    aria-label="Add comments"
                    data-testid="comment-slide"
                >
                    <div className="w-full max-w-2xl">
                        <h2 className="sr-only">Add Your Comments</h2>
                        <CommentWidget aria-label="Comment input widget" />
                    </div>
                </article>
            </section>

            {/* Navigation dots */}
            {sliderHook.loaded && sliderHook.instanceRef.current && (
                <nav
                    className="w-full py-4"
                    role="navigation"
                    aria-label="Review sections navigation"
                    data-testid="slider-navigation"
                >
                    <ul className="dots flex justify-center gap-4 list-none">
                        {[...Array(slideCount).keys()].map((idx) => {
                            const isActive = idx <= sliderHook.currentSlide;
                            const slideLabel = getSlideLabel(idx);

                            return (
                                <li key={idx}>
                                    <button
                                        onClick={() => navigateToSlide(idx)}
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        className={`
                      dot w-20 h-1.5 rounded transition-all duration-200
                      ${isActive
                                            ? 'bg-[color:var(--color-main)]'
                                            : 'bg-[color:var(--color-disabled)]'}
                      hover:opacity-80 focus:outline-none focus:ring-2 
                      focus:ring-[color:var(--color-main)] focus:ring-offset-2
                    `}
                                        aria-label={`Go to ${slideLabel}`}
                                        aria-current={idx === sliderHook.currentSlide ? 'step' : undefined}
                                        aria-pressed={idx === sliderHook.currentSlide}
                                        data-testid={`slider-dot-${idx}`}
                                        tabIndex={0}
                                    >
                    <span className="sr-only">
                      {slideLabel} - {idx === sliderHook.currentSlide ? 'Current' : 'Navigate to'}
                    </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Progress indicator for screen readers */}
                    <div
                        className="sr-only"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        Step {sliderHook.currentSlide + 1} of {slideCount}
                    </div>
                </nav>
            )}
        </div>
    );
};

export default ReviewPage;