import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
// Import React for the mock
import * as React from 'react';
import SortOptions from "../../../components/reviews-list/SortOptions";

// Mock the Dropdown component to simplify testing
vi.mock('./Dropdown', () => ({
    default: ({ trigger, children }: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isOpen, setIsOpen] = React.useState(false);
        return (
            <div data-testid="dropdown-wrapper">
                <div onClick={() => setIsOpen(!isOpen)}>
                    {trigger}
                </div>
                {isOpen && (
                    <div data-testid="dropdown-content">
                        {children}
                    </div>
                )}
            </div>
        );
    }
}));

// Mock the icon
vi.mock('@tabler/icons-react', () => ({
    IconArrowsUpDown: ({ size }: any) => (
        <svg data-testid="sort-icon" width={size} height={size}>Icon</svg>
    )
}));

describe('SortOptions', () => {
    const mockOnSortChange = vi.fn();
    const mockOnAddReview = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        test('should render add review button and sort trigger', () => {
            render(
                <SortOptions
                    currentSort="newest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            expect(screen.getByTestId('sort-options')).toBeInTheDocument();
            expect(screen.getByTestId('add-review-button')).toBeInTheDocument();
            expect(screen.getByTestId('sort-trigger-button')).toBeInTheDocument();
        });

        test('should display current sort in trigger button', () => {
            render(
                <SortOptions
                    currentSort="highest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            const trigger = screen.getByTestId('sort-trigger-button');
            expect(trigger).toHaveAttribute('aria-label', 'Sort reviews. Currently: Highest Rated');
        });
    });

    describe('Add Review Button', () => {
        test('should call onAddReview when clicked', () => {
            render(
                <SortOptions
                    currentSort="newest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            fireEvent.click(screen.getByTestId('add-review-button'));
            expect(mockOnAddReview).toHaveBeenCalledTimes(1);
        });
    });

    describe('Sort Dropdown', () => {
        test('should display all sort options when dropdown is opened', () => {
            render(
                <SortOptions
                    currentSort="newest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('sort-trigger-button'));

            // Check all options are present
            expect(screen.getByTestId('sort-option-newest')).toBeInTheDocument();
            expect(screen.getByTestId('sort-option-oldest')).toBeInTheDocument();
            expect(screen.getByTestId('sort-option-highest')).toBeInTheDocument();
            expect(screen.getByTestId('sort-option-lowest')).toBeInTheDocument();
            expect(screen.getByTestId('sort-option-most_helpful')).toBeInTheDocument();
        });

        test('should show checkmark for current sort option', () => {
            render(
                <SortOptions
                    currentSort="highest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('sort-trigger-button'));

            // Check checkmark is present for current sort
            expect(screen.getByTestId('checkmark-highest')).toBeInTheDocument();
            expect(screen.queryByTestId('checkmark-newest')).not.toBeInTheDocument();
            expect(screen.queryByTestId('checkmark-oldest')).not.toBeInTheDocument();
        });

        test('should call onSortChange when an option is clicked', () => {
            render(
                <SortOptions
                    currentSort="newest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('sort-trigger-button'));

            // Click on a different sort option
            fireEvent.click(screen.getByTestId('sort-option-oldest'));

            expect(mockOnSortChange).toHaveBeenCalledWith('oldest');
        });

        test('should highlight current sort option', () => {
            render(
                <SortOptions
                    currentSort="lowest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('sort-trigger-button'));

            const lowestOption = screen.getByTestId('sort-option-lowest');
            expect(lowestOption).toHaveClass('bg-blue-50', 'font-semibold');

            const newestOption = screen.getByTestId('sort-option-newest');
            expect(newestOption).not.toHaveClass('bg-blue-50');
        });
    });

    describe('Sort Options Labels', () => {
        test('should display correct labels for all sort options', () => {
            render(
                <SortOptions
                    currentSort="newest"
                    onSortChange={mockOnSortChange}
                    onAddReview={mockOnAddReview}
                />
            );

            // Open dropdown
            fireEvent.click(screen.getByTestId('sort-trigger-button'));

            expect(screen.getByTestId('sort-option-newest')).toHaveTextContent('Newest First');
            expect(screen.getByTestId('sort-option-oldest')).toHaveTextContent('Oldest First');
            expect(screen.getByTestId('sort-option-highest')).toHaveTextContent('Highest Rated');
            expect(screen.getByTestId('sort-option-lowest')).toHaveTextContent('Lowest Rated');
            expect(screen.getByTestId('sort-option-most_helpful')).toHaveTextContent('Most Helpful');
        });
    });
});