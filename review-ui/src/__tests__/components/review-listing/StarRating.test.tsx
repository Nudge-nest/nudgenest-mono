import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import StarRating from "../../../components/reviews-list/StarRating";

// Mock the icons - simpler mock without conflicting data-testid
vi.mock('@tabler/icons-react', () => ({
    IconStarFilled: ({ size, ...props }: any) => (
        <svg width={size} height={size} {...props}>
            ★
        </svg>
    ),
    IconStar: ({ size, className, ...props }: any) => (
        <svg width={size} height={size} className={className} {...props}>
            ☆
        </svg>
    )
}));

describe('StarRating', () => {
    describe('Rendering', () => {
        test('should render 5 stars', () => {
            render(<StarRating rating={3} />);

            expect(screen.getByTestId('star-1')).toBeInTheDocument();
            expect(screen.getByTestId('star-2')).toBeInTheDocument();
            expect(screen.getByTestId('star-3')).toBeInTheDocument();
            expect(screen.getByTestId('star-4')).toBeInTheDocument();
            expect(screen.getByTestId('star-5')).toBeInTheDocument();
        });

        test('should render correct number of filled stars for rating 3', () => {
            render(<StarRating rating={3} />);

            // Use the actual testids from the component
            expect(screen.getByTestId('star-filled-1')).toBeInTheDocument();
            expect(screen.getByTestId('star-filled-2')).toBeInTheDocument();
            expect(screen.getByTestId('star-filled-3')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-4')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-5')).toBeInTheDocument();
        });

        test('should render all empty stars for rating 0', () => {
            render(<StarRating rating={0} />);

            expect(screen.getByTestId('star-empty-1')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-2')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-3')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-4')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-5')).toBeInTheDocument();
        });
    });

    describe('Props', () => {
        test('should apply custom size to stars', () => {
            render(<StarRating rating={3} size={24} />);

            const filledStar1 = screen.getByTestId('star-filled-1');
            const filledStar2 = screen.getByTestId('star-filled-2');
            const filledStar3 = screen.getByTestId('star-filled-3');

            expect(filledStar1).toHaveAttribute('width', '24');
            expect(filledStar1).toHaveAttribute('height', '24');
            expect(filledStar2).toHaveAttribute('width', '24');
            expect(filledStar3).toHaveAttribute('width', '24');
        });

        test('should use default size of 16 when not specified', () => {
            render(<StarRating rating={3} />);

            const filledStar = screen.getByTestId('star-filled-1');

            expect(filledStar).toHaveAttribute('width', '16');
            expect(filledStar).toHaveAttribute('height', '16');
        });

        test('should hide empty stars when showEmpty is false', () => {
            render(<StarRating rating={3} showEmpty={false} />);

            expect(screen.getByTestId('star-filled-1')).toBeInTheDocument();
            expect(screen.getByTestId('star-filled-2')).toBeInTheDocument();
            expect(screen.getByTestId('star-filled-3')).toBeInTheDocument();
            expect(screen.queryByTestId('star-empty-4')).not.toBeInTheDocument();
            expect(screen.queryByTestId('star-empty-5')).not.toBeInTheDocument();
        });

        test('should show empty stars by default', () => {
            render(<StarRating rating={3} />);

            expect(screen.getByTestId('star-empty-4')).toBeInTheDocument();
            expect(screen.getByTestId('star-empty-5')).toBeInTheDocument();
        });
    });
});