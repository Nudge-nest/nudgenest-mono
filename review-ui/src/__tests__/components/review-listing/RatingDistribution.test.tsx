import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import {IReview} from "../../../types/review";
import RatingDistribution from "../../../components/reviews-list/RatingDistribution";


// Mock dependencies
vi.mock('../../utils/reviewsListing', () => ({
    calculateReviewRating: vi.fn((review: IReview) => {
        // Extract rating from result array
        const ratingResult = review.result?.find((r: any) => r.value);
        return ratingResult?.value || 0;
    })
}));

vi.mock('../../../components/reviews-list/StarRating', () => ({
    default: ({ rating, size }: any) => (
        <div data-testid={`star-component-${rating}`}>
            {rating} stars (size: {size})
        </div>
    )
}));

describe('RatingDistribution', () => {
    const mockReviews: IReview[] = [
        {
            id: 'review-1',
            merchantId: 'merchant-123',
            customerName: 'John Doe',
            items: [{ id: 'item-1', name: 'Product 1', price: '25.00', quantity: 1 }],
            result: [
                { comment: 'Excellent product!' },
                { id: '123', value: 5 }
            ],
            status: 'Completed',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-2',
            merchantId: 'merchant-123',
            customerName: 'Jane Smith',
            items: [{ id: 'item-2', name: 'Product 2', price: '30.00', quantity: 1 }],
            result: [
                { comment: 'Amazing!' },
                { id: '124', value: 5 }
            ],
            status: 'Completed',
            createdAt: '2024-01-02T10:00:00Z',
            updatedAt: '2024-01-02T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-3',
            merchantId: 'merchant-123',
            customerName: 'Bob Wilson',
            items: [{ id: 'item-3', name: 'Product 3', price: '35.00', quantity: 1 }],
            result: [
                { comment: 'Very good' },
                { id: '125', value: 4 }
            ],
            status: 'Completed',
            createdAt: '2024-01-03T10:00:00Z',
            updatedAt: '2024-01-03T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-4',
            merchantId: 'merchant-123',
            customerName: 'Alice Brown',
            items: [{ id: 'item-4', name: 'Product 4', price: '40.00', quantity: 1 }],
            result: [
                { comment: 'Good' },
                { id: '126', value: 3 }
            ],
            status: 'Completed',
            createdAt: '2024-01-04T10:00:00Z',
            updatedAt: '2024-01-04T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-5',
            merchantId: 'merchant-123',
            customerName: 'Charlie Davis',
            items: [{ id: 'item-5', name: 'Product 5', price: '45.00', quantity: 1 }],
            result: [
                { comment: 'Okay' },
                { id: '127', value: 3 }
            ],
            status: 'Completed',
            createdAt: '2024-01-05T10:00:00Z',
            updatedAt: '2024-01-05T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-6',
            merchantId: 'merchant-123',
            customerName: 'Eva Martinez',
            items: [{ id: 'item-6', name: 'Product 6', price: '50.00', quantity: 1 }],
            result: [
                { comment: 'Average' },
                { id: '128', value: 3 }
            ],
            status: 'Completed',
            createdAt: '2024-01-06T10:00:00Z',
            updatedAt: '2024-01-06T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-7',
            merchantId: 'merchant-123',
            customerName: 'Frank Garcia',
            items: [{ id: 'item-7', name: 'Product 7', price: '55.00', quantity: 1 }],
            result: [
                { comment: 'Not great' },
                { id: '129', value: 2 }
            ],
            status: 'Completed',
            createdAt: '2024-01-07T10:00:00Z',
            updatedAt: '2024-01-07T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        },
        {
            id: 'review-8',
            merchantId: 'merchant-123',
            customerName: 'Grace Lee',
            items: [{ id: 'item-8', name: 'Product 8', price: '60.00', quantity: 1 }],
            result: [
                { comment: 'Poor' },
                { id: '130', value: 1 }
            ],
            status: 'Completed',
            createdAt: '2024-01-08T10:00:00Z',
            updatedAt: '2024-01-08T10:00:00Z',
            merchantBusinessId: 'business-123',
            replies: [],
            verified: true
        }
    ] as IReview[];

    describe('Rendering', () => {
        test('should render the component with title', () => {
            render(<RatingDistribution reviews={mockReviews} />);

            expect(screen.getByTestId('rating-distribution')).toBeInTheDocument();
            expect(screen.getByTestId('distribution-title')).toHaveTextContent('Ratings Distribution');
        });

        test('should render all 5 rating rows', () => {
            render(<RatingDistribution reviews={mockReviews} />);

            expect(screen.getByTestId('rating-row-5')).toBeInTheDocument();
            expect(screen.getByTestId('rating-row-4')).toBeInTheDocument();
            expect(screen.getByTestId('rating-row-3')).toBeInTheDocument();
            expect(screen.getByTestId('rating-row-2')).toBeInTheDocument();
            expect(screen.getByTestId('rating-row-1')).toBeInTheDocument();
        });
    });

    describe('Counts and Percentages', () => {
        test('should display correct review counts', () => {
            render(<RatingDistribution reviews={mockReviews} />);

            expect(screen.getByTestId('count-5')).toHaveTextContent('(2)');
            expect(screen.getByTestId('count-4')).toHaveTextContent('(1)');
            expect(screen.getByTestId('count-3')).toHaveTextContent('(3)');
            expect(screen.getByTestId('count-2')).toHaveTextContent('(1)');
            expect(screen.getByTestId('count-1')).toHaveTextContent('(1)');
        });

        test('should calculate correct percentages for progress bars', () => {
            render(<RatingDistribution reviews={mockReviews} />);

            // Total reviews: 8
            // 5 stars: 2/8 = 25%
            // 3 stars: 3/8 = 37.5%

            const fiveStarProgress = screen.getByTestId('progress-fill-5');
            const threeStarProgress = screen.getByTestId('progress-fill-3');

            expect(fiveStarProgress).toHaveStyle({ width: '25%' });
            expect(threeStarProgress).toHaveStyle({ width: '37.5%' });
        });
    });

    describe('Empty State', () => {
        test('should handle empty reviews array', () => {
            render(<RatingDistribution reviews={[]} />);

            expect(screen.getByTestId('count-5')).toHaveTextContent('(0)');
            expect(screen.getByTestId('count-4')).toHaveTextContent('(0)');
            expect(screen.getByTestId('count-3')).toHaveTextContent('(0)');
            expect(screen.getByTestId('count-2')).toHaveTextContent('(0)');
            expect(screen.getByTestId('count-1')).toHaveTextContent('(0)');

            // All progress bars should be 0%
            const progressBars = [1, 2, 3, 4, 5].map(star =>
                screen.getByTestId(`progress-fill-${star}`)
            );

            progressBars.forEach(bar => {
                expect(bar).toHaveStyle({ width: '0%' });
            });
        });
    });

    describe('Star Rating Integration', () => {
        test('should render StarRating components with correct props', () => {
            render(<RatingDistribution reviews={mockReviews} />);

            expect(screen.getByTestId('star-component-5')).toHaveTextContent('5 stars (size: 20)');
            expect(screen.getByTestId('star-component-4')).toHaveTextContent('4 stars (size: 20)');
            expect(screen.getByTestId('star-component-3')).toHaveTextContent('3 stars (size: 20)');
            expect(screen.getByTestId('star-component-2')).toHaveTextContent('2 stars (size: 20)');
            expect(screen.getByTestId('star-component-1')).toHaveTextContent('1 stars (size: 20)');
        });
    });
});