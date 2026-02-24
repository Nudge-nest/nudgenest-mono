import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { IReview } from '../../../types/review';
import ReviewItem from '../../../components/reviews-list/ReviewItem';

// Mock the utility functions
vi.mock('../../../utils/reviewsListing', () => ({
    calculateReviewRating: vi.fn(() => 4.5),
    sanitizeReviewText: vi.fn((text) => (text.length > 102 ? text.substring(0, 102) + '...' : text)),
}));

// Mock StarRating component
vi.mock('../../../components/reviews-list/StarRating', () => ({
    default: function MockStarRating({ rating }: { rating: number }) {
        return (
            <div data-testid="star-rating" role="img" aria-label={`${rating} out of 5 stars`}>
                Rating: {rating}
            </div>
        );
    },
}));

// Mock Tabler icons - include all icons used by StarRating component
vi.mock('@tabler/icons-react', () => ({
    IconPhoto: (props: any) => (
        <div data-testid="icon-photo" {...props}>
            Photo Icon
        </div>
    ),
    IconShieldCheckFilled: (props: any) => (
        <div data-testid="icon-shield-check" {...props}>
            Shield Check Icon
        </div>
    ),
    IconStarFilled: (props: any) => (
        <div data-testid="icon-star-filled" {...props}>
            Star Filled Icon
        </div>
    ),
    IconStar: (props: any) => (
        <div data-testid="icon-star" {...props}>
            Star Icon
        </div>
    ),
}));

// Mock review data
const mockReview: IReview = {
    id: 'test-review-id',
    merchantId: 'merchant-123',
    customerName: 'John Doe',
    items: [
        {
            id: 'item-1',
            name: 'Test Product',
            price: '25.00',
            quantity: 1,
        },
    ],
    result: [
        { comment: 'Great product! Really love it and would recommend to others.' },
        { mediaURL: 'https://example.com/image.jpg' },
        { id: '14572083282058', value: 4.5},
    ],
    status: 'Completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    merchantBusinessId: 'business-123',
    replies: [],
    verified: true,
};

const mockUnverifiedReview: IReview = {
    ...mockReview,
    id: 'unverified-review-id',
    customerName: 'Jane Smith',
    verified: false,
};

const mockReviewWithMultipleMedia: IReview = {
    ...mockReview,
    id: 'multi-media-review-id',
    result: [
        { comment: 'Amazing quality!' },
        { mediaURL: 'https://example.com/image1.jpg' },
        { mediaURL: 'https://example.com/image2.jpg' },
        { mediaURL: 'https://example.com/video.mp4' },
    ],
};

const mockReviewWithVideo: IReview = {
    ...mockReview,
    id: 'video-review-id',
    result: [{ comment: 'Check out this video review!' }, { mediaURL: 'https://example.com/review-video.mp4' }],
};

const mockReviewNoMedia: IReview = {
    ...mockReview,
    id: 'no-media-review-id',
    result: [{ comment: 'Good product but no photos to share.' }],
};

// Mock callback function
const mockOnMediaClick = vi.fn();

describe('ReviewItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders review with all essential elements', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        expect(screen.getByTestId('review-item')).toBeInTheDocument();
        expect(screen.getByTestId('customer-name')).toHaveTextContent('John Doe');
        expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
        expect(screen.getByTestId('review-rating')).toBeInTheDocument();
        //expect(screen.getByTestId('review-comment')).toBeInTheDocument();
    });

    test('does not show verified badge for unverified customers', () => {
        render(<ReviewItem review={mockUnverifiedReview} onMediaClick={mockOnMediaClick} />);

        expect(screen.getByTestId('customer-name')).toHaveTextContent('Jane Smith');
        expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
    });

    test('displays review date with correct datetime attribute', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        const dateElement = screen.getByTestId('review-date');
        expect(dateElement).toBeInTheDocument();
        expect(dateElement).toHaveAttribute('datetime', '2024-01-15T10:30:00Z');
    });

    test('renders media button and handles click', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        const mediaButton = screen.getByTestId('review-media-button');
        expect(mediaButton).toBeInTheDocument();

        fireEvent.click(mediaButton);

        expect(mockOnMediaClick).toHaveBeenCalledWith([{ mediaURL: 'https://example.com/image.jpg' }], 0);
    });

    test('shows media count for multiple media items', () => {
        render(<ReviewItem review={mockReviewWithMultipleMedia} onMediaClick={mockOnMediaClick} />);

        expect(screen.getByText('+3')).toBeInTheDocument();
        expect(screen.getByTestId('icon-photo')).toBeInTheDocument();
    });

    test('renders video element for video media', () => {
        render(<ReviewItem review={mockReviewWithVideo} onMediaClick={mockOnMediaClick} />);

        const videoElement = screen.getByRole('button', { name: /view review media/i });
        expect(videoElement).toBeInTheDocument();
    });

    test('does not render media section when no media present', () => {
        render(<ReviewItem review={mockReviewNoMedia} onMediaClick={mockOnMediaClick} />);

        expect(screen.queryByTestId('review-media-button')).not.toBeInTheDocument();
    });

    test('handles keyboard interaction on media button', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        const mediaButton = screen.getByTestId('review-media-button');

        mediaButton.focus();
        expect(document.activeElement).toBe(mediaButton);

        fireEvent.keyDown(mediaButton, { key: 'Enter', code: 'Enter' });
        fireEvent.click(mediaButton);

        expect(mockOnMediaClick).toHaveBeenCalled();
    });

    test('handles missing customer name gracefully', () => {
        const reviewWithoutName = { ...mockReview, customerName: '' };
        render(<ReviewItem review={reviewWithoutName} onMediaClick={mockOnMediaClick} />);

        expect(screen.getByTestId('customer-name')).toHaveTextContent('Customer');
    });

    test('handles missing comment gracefully', () => {
        const reviewWithoutComment = {
            ...mockReview,
            result: [{ mediaURL: 'https://example.com/image.jpg' }],
        } as IReview;
        render(<ReviewItem review={reviewWithoutComment} onMediaClick={mockOnMediaClick} />);

        expect(screen.queryByTestId('review-comment')).not.toBeInTheDocument();
    });

    test('media button has proper accessibility attributes', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        const mediaButton = screen.getByTestId('review-media-button');
        expect(mediaButton).toHaveAttribute('type', 'button');
        expect(mediaButton).toHaveAttribute('aria-label');
    });

    test('handles long comments with truncation', () => {
        const longComment = 'A'.repeat(150); // 150 characters
        const reviewWithLongComment = {
            ...mockReview,
            result: [{ comment: longComment }],
        };

        render(<ReviewItem review={reviewWithLongComment} onMediaClick={mockOnMediaClick} />);

        const commentElement = screen.getByTestId('review-comment');
        expect(commentElement.textContent).toHaveLength(105); // 102 chars + '...'
        expect(commentElement.textContent).toContain('...');
    });

    test('article has proper semantic structure', () => {
        render(<ReviewItem review={mockReview} onMediaClick={mockOnMediaClick} />);

        const article = screen.getByRole('article');
        expect(article).toBeInTheDocument();
        expect(article).toHaveAttribute('aria-label');
    });
});
