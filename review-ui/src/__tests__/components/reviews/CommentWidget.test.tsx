import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import {useReview} from "../../../contexts/ReviewContext";
import CommentWidget from "../../../components/review/CommentWidget";

// Mock dependencies
vi.mock('../../../contexts/ReviewContext');

vi.mock('../../../components/ThankYouComponent.tsx', () => ({
    default: () => <div data-testid="thank-you-component">Thank You!</div>
}));

vi.mock('../../../components/ErrorComponent.tsx', () => ({
    default: () => <div data-testid="error-component">Error!</div>
}));

describe('CommentWidget', () => {
    const mockUpdateComment = vi.fn();
    const mockHandleSubmitReview = vi.fn();
    const mockHandleSubmitDemo = vi.fn();

    const defaultContextValue = {
        reviewId: 'review-123',
        review: { status: 'Pending' },
        reviewFormHook: {
            comment: '',
            updateComment: mockUpdateComment,
            handleSubmitReview: mockHandleSubmitReview,
            handleSubmitDemo: mockHandleSubmitDemo,
            isSubmitting: undefined
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useReview as any).mockReturnValue(defaultContextValue);
    });

    describe('Rendering', () => {
        it('should render the comment widget with title', () => {
            render(<CommentWidget />);

            expect(screen.getByTestId('comment-widget')).toBeInTheDocument();
            expect(screen.getByTestId('comment-title')).toHaveTextContent('Tell us more!');
        });

        it('should render textarea for comment input', () => {
            render(<CommentWidget />);

            const textarea = screen.getByTestId('comment-textarea');
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveAttribute('placeholder', 'Share your experience');
        });

        it('should render submit button', () => {
            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            expect(submitButton).toBeInTheDocument();
            expect(submitButton).toHaveTextContent('Submit');
        });

        it('should render terms text', () => {
            render(<CommentWidget />);

            const termsText = screen.getByTestId('terms-text');
            expect(termsText).toBeInTheDocument();
            expect(termsText).toHaveTextContent('By submitting, I acknowledge the Terms of Service');
        });
    });

    describe('Comment Input', () => {
        it('should update comment when typing in textarea', () => {
            render(<CommentWidget />);

            const textarea = screen.getByTestId('comment-textarea');
            fireEvent.change(textarea, { target: { value: 'Great product!' } });

            expect(mockUpdateComment).toHaveBeenCalledWith('Great product!');
        });

        it('should display existing comment value', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Existing comment'
                }
            });

            render(<CommentWidget />);

            const textarea = screen.getByTestId('comment-textarea');
            expect(textarea).toHaveValue('Existing comment');
        });
    });

    describe('Submit Button', () => {
        it('should be disabled when comment is empty', () => {
            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            expect(submitButton).toBeDisabled();
        });

        it('should be enabled when comment has text', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Some review text'
                }
            });

            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            expect(submitButton).not.toBeDisabled();
        });

        it('should be disabled when review is completed', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                review: { status: 'Completed' },
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Some review text'
                }
            });

            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            expect(submitButton).toBeDisabled();
        });

        it('should call handleSubmitReview when clicked in regular mode', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Great product!'
                }
            });

            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            fireEvent.click(submitButton);

            expect(mockHandleSubmitReview).toHaveBeenCalledTimes(1);
            expect(mockHandleSubmitDemo).not.toHaveBeenCalled();
        });

        it('should call handleSubmitDemo when in demo mode', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewId: 'demo',
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Demo review'
                }
            });

            render(<CommentWidget />);

            const submitButton = screen.getByTestId('submit-button');
            fireEvent.click(submitButton);

            expect(mockHandleSubmitDemo).toHaveBeenCalledTimes(1);
            expect(mockHandleSubmitReview).not.toHaveBeenCalled();
        });
    });

    describe('Component States', () => {
        it('should render ThankYouComponent when isSubmitting is true', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    isSubmitting: true
                }
            });

            render(<CommentWidget />);

            expect(screen.getByTestId('thank-you-component')).toBeInTheDocument();
            expect(screen.queryByTestId('comment-widget')).not.toBeInTheDocument();
        });

        it('should render ErrorComponent when isSubmitting is false', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    isSubmitting: false
                }
            });

            render(<CommentWidget />);

            expect(screen.getByTestId('error-component')).toBeInTheDocument();
            expect(screen.queryByTestId('comment-widget')).not.toBeInTheDocument();
        });

        it('should render form when isSubmitting is undefined', () => {
            render(<CommentWidget />);

            expect(screen.getByTestId('comment-widget')).toBeInTheDocument();
            expect(screen.queryByTestId('thank-you-component')).not.toBeInTheDocument();
            expect(screen.queryByTestId('error-component')).not.toBeInTheDocument();
        });
    });

    describe('Form Interaction', () => {
        it('should disable textarea when review is completed', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                review: { status: 'Completed' }
            });

            render(<CommentWidget />);

            const textarea = screen.getByTestId('comment-textarea');
            expect(textarea).toBeDisabled();
        });

        it('should handle form submission with enter key prevention', () => {
            (useReview as any).mockReturnValue({
                ...defaultContextValue,
                reviewFormHook: {
                    ...defaultContextValue.reviewFormHook,
                    comment: 'Test comment'
                }
            });

            render(<CommentWidget />);

            const form = screen.getByTestId('comment-widget').querySelector('form');
            fireEvent.submit(form!);

            expect(mockHandleSubmitReview).toHaveBeenCalledTimes(1);
        });
    });
});