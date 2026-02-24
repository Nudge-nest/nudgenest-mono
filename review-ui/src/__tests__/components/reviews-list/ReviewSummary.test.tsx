import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import ReviewSummary from '../../../components/reviews-list/ReviewSummary';
import type { IReview } from '../../../types/review';

vi.mock('@tabler/icons-react', () => ({
    IconCaretDown: () => <svg />,
}));
vi.mock('../../../components/reviews-list/StarRating', () => ({
    default: ({ rating }: { rating: number }) => <div data-testid="star-rating">{rating.toFixed(1)}</div>,
}));
vi.mock('../../../components/reviews-list/Dropdown', () => ({
    default: ({ trigger }: any) => <div>{trigger}</div>,
}));
vi.mock('../../../components/reviews-list/RatingDistribution', () => ({
    default: () => <div />,
}));
vi.mock('../../../utils/reviewsListing', () => ({
    calculateReviewRating: (review: IReview) => (review.result?.[0]?.value as number) ?? 0,
}));

function makeReview(rating: number): IReview {
    return {
        id: `r${rating}`,
        customerName: 'Test',
        result: [{ value: rating, comment: '' }],
    } as unknown as IReview;
}

describe('ReviewSummary', () => {
    test('calculates correct average rating from multiple reviews', () => {
        const reviews = [makeReview(4), makeReview(2), makeReview(3)];
        render(<ReviewSummary reviews={reviews} />);
        // avg = (4+2+3)/3 = 3
        expect(screen.getByTestId('star-rating')).toHaveTextContent('3.0');
    });

    test('renders plural "Reviews" for count > 1', () => {
        render(<ReviewSummary reviews={[makeReview(5), makeReview(4)]} />);
        expect(screen.getByText('2 Reviews')).toBeInTheDocument();
    });

    test('renders singular "Review" for exactly 1 review', () => {
        render(<ReviewSummary reviews={[makeReview(5)]} />);
        expect(screen.getByText('1 Review')).toBeInTheDocument();
    });

    test('renders 0 Reviews and 0.0 avg when reviews array is empty', () => {
        render(<ReviewSummary reviews={[]} />);
        expect(screen.getByText('0 Reviews')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toHaveTextContent('0.0');
    });
});
