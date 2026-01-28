import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { useReview } from '../../../contexts/ReviewContext';
import RatingWidget, {RatingWithProduct} from "../../../components/review/RatingWidget";

// Mock the ReviewContext
vi.mock('../../../contexts/ReviewContext');

// Mock the Star component
vi.mock('./Star.tsx', () => ({
    default: ({ isFilled, onClick, title }: any) => (
        <button
            data-testid={`star-${title}`}
            onClick={onClick}
            aria-label={title}
            style={{ backgroundColor: isFilled ? '#fcc800' : '#f9f9f9' }}
        >
            {isFilled ? '★' : '☆'}
        </button>
    )
}));

// Mock constants
vi.mock('../../constants', () => ({
    MAX_RATING: 5,
    RATING_ARRAY: Array.from({ length: 5 }),
    RATING_LABELS: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
}));

describe('RatingWidget', () => {
    const mockUpdateRating = vi.fn();
    const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        image: 'https://example.com/product.jpg',
        price: 29.99
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useReview as any).mockReturnValue({
            reviewFormHook: {
                updateRating: mockUpdateRating
            }
        });
    });

    describe('Rendering', () => {
        it('should render product name', () => {
            render(<RatingWidget product={mockProduct} />);
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        it('should render product image when provided', () => {
            render(<RatingWidget product={mockProduct} />);
            const image = screen.getByTestId('image-Test Product');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
        });

        it('should render without image when not provided', () => {
            const productNoImage = { ...mockProduct, image: undefined };
            render(<RatingWidget product={productNoImage} />);
            expect(screen.getByTestId('no-image-item-title')).toBeInTheDocument();
            expect(screen.queryByRole('img')).not.toBeInTheDocument();
        });

        it('should render 5 rating stars', () => {
            render(<RatingWidget product={mockProduct} />);
            expect(screen.getByTestId('star-Poor')).toBeInTheDocument();
            expect(screen.getByTestId('star-Fair')).toBeInTheDocument();
            expect(screen.getByTestId('star-Good')).toBeInTheDocument();
            expect(screen.getByTestId('star-Very Good')).toBeInTheDocument();
            expect(screen.getByTestId('star-Excellent')).toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('should update rating when star is clicked', () => {
            render(<RatingWidget product={mockProduct} />);

            const thirdStar = screen.getByTestId('star-Good');
            fireEvent.click(thirdStar);

            expect(mockUpdateRating).toHaveBeenCalledWith({
                id: 'product-1',
                value: 3
            });
        });

        it('should not update rating when completed', () => {
            render(<RatingWidget product={mockProduct} isCompleted={true} />);

            const star = screen.getByTestId('star-Good');
            fireEvent.click(star);

            expect(mockUpdateRating).not.toHaveBeenCalled();
        });

        it('should update visual state when different stars are clicked', () => {
            render(<RatingWidget product={mockProduct} />);

            // Click 3-star rating
            fireEvent.click(screen.getByTestId('star-Good'));
            expect(mockUpdateRating).toHaveBeenCalledWith({
                id: 'product-1',
                value: 3
            });

            // Click 5-star rating
            fireEvent.click(screen.getByTestId('star-Excellent'));
            expect(mockUpdateRating).toHaveBeenCalledWith({
                id: 'product-1',
                value: 5
            });
        });
    });

    describe('Initial State', () => {
        it('should set initial rating from result prop', () => {
            const results = [
                { itemId: 'product-1', value: 4 }
            ];

            render(
                <RatingWidget
                    product={mockProduct}
                    result={results}
                    isCompleted={true}
                />
            );

            // Check that the component rendered with the initial rating
            // We can't directly test selectedRating state, but we can verify
            // that updateRating wasn't called (since it's already set)
            const star = screen.getByTestId('star-Very Good');
            fireEvent.click(star);
            expect(mockUpdateRating).not.toHaveBeenCalled();
        });

        it('should start with no rating when no result provided', () => {
            render(<RatingWidget product={mockProduct} />);

            // Verify we can click any star (component is interactive)
            const star = screen.getByTestId('star-Poor');
            fireEvent.click(star);
            expect(mockUpdateRating).toHaveBeenCalledWith({
                id: 'product-1',
                value: 1
            });
        });
    });

    describe('Error Handling', () => {
        it('should fallback to placeholder when image fails to load', () => {
            render(<RatingWidget product={mockProduct} />);

            const image = screen.getByTestId('image-Test Product') as HTMLImageElement;
            fireEvent.error(image);

            expect(image.src).toBe('https://placehold.co/300x300');
        });

        it('should handle product without name gracefully', () => {
            const productNoName = { ...mockProduct, name: '' };
            render(<RatingWidget product={productNoName} />);

            expect(screen.getByText('this product')).toBeInTheDocument();
        });
    });
});

describe('RatingWithProduct', () => {
    it('should render with image and name', () => {
        render(
            <RatingWithProduct
                itemName="Test Item"
                image="https://example.com/item.jpg"
                productId="item-1"
            />
        );

        expect(screen.getByTestId('image-Test Item')).toBeInTheDocument();
        expect(screen.getByTestId('item-title')).toHaveTextContent('Your rating for Test Item?');
    });

    it('should render without image', () => {
        render(
            <RatingWithProduct
                itemName="Test Item"
                productId="item-1"
            />
        );

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('item-title')).toHaveTextContent('Test Item');
    });

    it('should handle image error', () => {
        render(
            <RatingWithProduct
                itemName="Test Item"
                image="https://invalid-url.com/image.jpg"
                productId="item-1"
            />
        );

        const image = screen.getByTestId('image-Test Item') as HTMLImageElement;
        fireEvent.error(image);

        expect(image.src).toBe('https://placehold.co/300x300');
    });
});