import { useReview } from '../../contexts/ReviewContext.tsx';
import { ChangeEvent } from 'react';
import ThankYouComponent from '../ThankYouComponent.tsx';
import ErrorComponent from '../ErrorComponent.tsx';

const CommentWidget = () => {
    const { reviewFormHook, review, reviewId } = useReview();

    const submitReview = () => {
        if (reviewId === 'demo') {
            reviewFormHook.handleSubmitDemo();
            return;
        }
        reviewFormHook.handleSubmitReview();
    };

    const isCompleted = review?.status === 'Completed';
    const isCommentEmpty = reviewFormHook.comment.length === 0;
    const isSubmitDisabled = isCompleted || isCommentEmpty;

    if (reviewFormHook.isSubmitting === true) return <ThankYouComponent />;
    if (reviewFormHook.isSubmitting === false) return <ErrorComponent />;

    if (reviewFormHook.isSubmitting === undefined) {
        return (
            <section
                className="text-center text-[color:var(--color-text)]"
                aria-labelledby="comment-widget-title"
                data-testid="comment-widget"
            >
                <header className="w-full mb-8 text-center text-[color:var(--color-text)]">
                    <h3
                        id="comment-widget-title"
                        className="text-[color:var(--color-text)] font-bold text-xl"
                        data-testid="comment-title"
                    >
                        Tell us more!
                    </h3>
                    <p className="text-[color:var(--color-text)] font-normal text-base"></p>
                </header>

                <form onSubmit={(e) => { e.preventDefault(); submitReview(); }}>
                    <div className="mb-8">
                        <label htmlFor="review-comment" className="sr-only">
                            Share your experience
                        </label>
                        <textarea
                            id="review-comment"
                            className="border-1 rounded w-full p-2 text-[color:var(--color-text)]"
                            rows={5}
                            placeholder="Share your experience"
                            value={reviewFormHook.comment}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                reviewFormHook.updateComment(event.target.value)
                            }
                            aria-label="Review comment"
                            aria-required="true"
                            aria-invalid={isCommentEmpty}
                            aria-describedby="comment-requirements"
                            data-testid="comment-textarea"
                            disabled={isCompleted}
                        />
                        <span id="comment-requirements" className="sr-only">
                            Please enter your review comment before submitting
                        </span>
                    </div>

                    <div className="w-full mb-8 text-center text-[color:var(--color-text)]">
                        <p
                            className="text-[color:var(--color-text)] font-normal text-sm text-balance"
                            data-testid="terms-text"
                        >
                            By submitting, I acknowledge the Terms of Service and Privacy Policy and that my review will be
                            publicly posted and shared online.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={`w-full h-12 ${isCompleted ? 'bg-[color:var(--color-disabled)]' :
                            'bg-[color:var(--color-main)]'} rounded-lg cursor-pointer transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:hover:opacity-100`}
                        onClick={(e) => { e.preventDefault(); submitReview(); }}
                        disabled={isSubmitDisabled}
                        aria-label={isSubmitDisabled ? 'Submit button disabled' : 'Submit review'}
                        data-testid="submit-button"
                    >
                        <span className="text-[color:var(--color-text)] text-lg font-semibold">
                            Submit
                        </span>
                    </button>
                </form>

                {/* Screen reader announcement for form state */}
                <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {isCompleted && 'Review already completed'}
                    {isCommentEmpty && 'Please add a comment before submitting'}
                </div>
            </section>
        );
    }
};

export default CommentWidget;