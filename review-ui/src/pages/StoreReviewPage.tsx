import { useState } from 'react';
import { useParams } from 'react-router';
import { IconStar } from '@tabler/icons-react';
import Loading from '../components/Loading.tsx';
import { useGetReviewConfigsQuery, useGetMerchantQuery, useCreateReviewMutation } from '../redux/nudgenest.ts';
import { useSlider } from '../hooks/useSlider.ts';

const StoreReviewPage = () => {
    const { merchantId } = useParams<{ merchantId: string }>();
    const { data: merchantConfigs, isLoading: configsLoading } = useGetReviewConfigsQuery(merchantId as string);
    const { data: merchantData, isLoading: merchantLoading } = useGetMerchantQuery(merchantId as string);
    const [createReview] = useCreateReviewMutation();

    const isLoading = configsLoading || merchantLoading;

    // Simple state management
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const sliderHook = useSlider(3);

    // Get question text from configs
    const questionText = merchantConfigs?.[0]?.general?.shopReviewQuestions?.[0]?.value || 'How would you rate your experience?';

    // Extract numeric ID from GraphQL ID (gid://shopify/Shop/67580297354 -> 67580297354)
    const extractIdFromGid = (gid: string | undefined): string => {
        if (!gid) return '';
        const parts = gid.split('/');
        return parts[parts.length - 1] || '';
    };

    const handleSubmit = async () => {
        if (!rating || !comment.trim() || !customerName.trim()) {
            alert('Please complete all fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create review object with extracted IDs (not GID URLs)
            const storeReview = {
                merchantId: merchantId as string,
                items: [{
                    id: 'store-general',
                    name: questionText
                }],
                result: [
                    { id: 'store-general', value: rating, comment: comment }
                ],
                status: 'Completed' as const,
                customerName: customerName,
                verified: false,
                merchantBusinessId: extractIdFromGid(merchantData?.businessInfo),
                shopId: extractIdFromGid(merchantData?.shopId),
                customerEmail: '',
                customerPhone: '',
                merchantApiKey: merchantData?.apiKey || null,
                replies: null
            };

            // Submit to API
            await createReview(storeReview).unwrap();

            setSubmitSuccess(true);

            // Notify parent window if in iframe
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'review_submitted' }, '*');
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <Loading />;

    if (submitSuccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-bold text-[color:var(--color-text)]">Thank you!</h2>
                <p className="text-[color:var(--color-text)] opacity-75">Your review has been submitted successfully.</p>
            </div>
        );
    }

    return (
        <div
            className="h-full text-center grid grid-rows-[95%_auto]"
            style={{
                paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                paddingRight: 'max(1rem, env(safe-area-inset-right))',
                paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
                paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))'
            }}
        >
            <div ref={sliderHook.sliderRef} className="h-full scroll-auto keen-slider">
                {/* Slide 1: Rating */}
                <div className="h-full flex flex-col gap-4 justify-center keen-slider__slide px-4">
                    <h2 className="text-xl font-medium text-[color:var(--color-text)] mb-4">
                        {questionText}
                    </h2>
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                                <IconStar
                                    size={45}
                                    fill={star <= rating ? '#fcc800' : '#e5e7eb'}
                                    stroke={1.5}
                                    style={{
                                        filter: star <= rating ? 'drop-shadow(0 2px 4px rgba(252, 200, 0, 0.3))' : 'none',
                                        color: star <= rating ? '#fcc800' : '#9ca3af'
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-[color:var(--color-text)] opacity-75 mt-2">
                            {rating} star{rating !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* Slide 2: Comment */}
                <div className="h-full flex flex-col gap-4 justify-center keen-slider__slide px-4">
                    <h2 className="text-xl font-medium text-[color:var(--color-text)] mb-4">
                        Tell us more about your experience
                    </h2>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:border-[color:var(--color-main)]"
                    />
                    <textarea
                        placeholder="Share your thoughts..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 bg-[color:var(--color-bg)] border border-[color:var(--color-border)] rounded-lg text-[color:var(--color-text)] focus:outline-none focus:border-[color:var(--color-main)] resize-none"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !comment.trim() || !customerName.trim()}
                        className="mt-4 px-6 py-3 bg-[color:var(--color-main)] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>

            {/* Navigation dots */}
            {sliderHook.loaded && sliderHook.instanceRef.current && (
                <div className="w-full dots flex justify-center gap-2 py-4">
                    {[0, 1].map((idx) => {
                        const isCurrent = idx === sliderHook.currentSlide;
                        const isCompleted = idx < sliderHook.currentSlide;

                        return (
                            <button
                                key={idx}
                                onClick={() => sliderHook.instanceRef.current?.moveToIdx(idx)}
                                className={`
                                    dot transition-all duration-300 ease-out rounded-full
                                    ${isCurrent
                                        ? 'w-8 h-2 bg-[color:var(--color-main)]'
                                        : isCompleted
                                        ? 'w-2 h-2 bg-[color:var(--color-main)] opacity-60'
                                        : 'w-2 h-2 bg-[color:var(--color-disabled)]'}
                                    hover:scale-110 hover:opacity-100
                                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-main)] focus:ring-offset-1
                                `}
                                aria-label={`Go to ${idx === 0 ? 'rating' : 'comment'} section`}
                                aria-current={isCurrent ? 'step' : undefined}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StoreReviewPage;
