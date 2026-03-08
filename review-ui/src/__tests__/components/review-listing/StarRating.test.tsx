import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import StarRating from "../../../components/reviews-list/StarRating";

vi.mock('@tabler/icons-react', () => ({
    IconStar: ({ size, className, ...props }: any) => (
        <svg width={size} height={size} className={className} {...props}>☆</svg>
    )
}));

describe('StarRating', () => {
    describe('Rendering', () => {
        test('should render 5 stars', () => {
            render(<StarRating rating={3} />);
            // Component uses data-testid="star-N-filled" or "star-N-empty"
            for (let i = 1; i <= 5; i++) {
                const testId = i <= 3 ? `star-${i}-filled` : `star-${i}-empty`;
                expect(screen.getByTestId(testId)).toBeInTheDocument();
            }
        });

        test('should render correct filled/empty split for rating 3', () => {
            render(<StarRating rating={3} />);
            expect(screen.getByTestId('star-1-filled')).toBeInTheDocument();
            expect(screen.getByTestId('star-3-filled')).toBeInTheDocument();
            expect(screen.getByTestId('star-4-empty')).toBeInTheDocument();
            expect(screen.getByTestId('star-5-empty')).toBeInTheDocument();
        });

        test('should render all empty stars for rating 0', () => {
            render(<StarRating rating={0} />);
            for (let i = 1; i <= 5; i++) {
                expect(screen.getByTestId(`star-${i}-empty`)).toBeInTheDocument();
            }
        });
    });

    describe('Props', () => {
        test('should apply custom size to stars', () => {
            render(<StarRating rating={3} size={24} />);
            expect(screen.getByTestId('star-1-filled')).toHaveAttribute('width', '24');
            expect(screen.getByTestId('star-1-filled')).toHaveAttribute('height', '24');
        });

        test('should use default size of 16 when not specified', () => {
            render(<StarRating rating={3} />);
            expect(screen.getByTestId('star-1-filled')).toHaveAttribute('width', '16');
            expect(screen.getByTestId('star-1-filled')).toHaveAttribute('height', '16');
        });
    });
});
