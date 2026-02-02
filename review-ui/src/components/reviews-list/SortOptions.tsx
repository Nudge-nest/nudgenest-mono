import { FC } from 'react';
import { SortOption, SortOptionsProps } from '../../types/review.ts';
import Dropdown from './Dropdown.tsx';
import { IconArrowsUpDown } from '@tabler/icons-react';

const SortOptions: FC<SortOptionsProps> = ({ currentSort, onSortChange, onAddReview }) => {
    const sortOptions: SortOption[] = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'highest', label: 'Highest Rated' },
        { value: 'lowest', label: 'Lowest Rated' },
        { value: 'most_helpful', label: 'Most Helpful' },
    ];

    const currentSortLabel = sortOptions.find((opt) => opt.value === currentSort)?.label || 'Newest First';

    return (
        <nav
            className="flex items-center gap-4 px-4"
            aria-label="Review controls"
            data-testid="sort-options"
        >
            <button
                onClick={onAddReview}
                className="px-6 py-3 min-h-[44px] bg-[color:var(--color-main)] text-white rounded-lg
                hover:opacity-90 transition-all duration-200 font-medium shadow-sm"
                aria-label="Add a new review"
                data-testid="add-review-button"
                type="button"
            >
                Add Review
            </button>

            <Dropdown
                trigger={
                    <button
                        className="px-4 py-3 min-h-[44px] min-w-[44px] border-2 border-[color:var(--color-main)]
                        text-[color:var(--color-main)] hover:bg-[color:var(--color-main-light)]
                        transition-all duration-200 rounded-lg relative group flex items-center justify-center"
                        aria-label={`Sort reviews. Currently: ${currentSortLabel}`}
                        data-testid="sort-trigger-button"
                        type="button"
                    >
                        <IconArrowsUpDown size={24} aria-hidden="true" stroke={2} />
                        <span
                            className="absolute -top-10 right-0 bg-[color:var(--color-dark)] text-[color:var(--color-white)]
                             text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                            role="tooltip"
                            aria-hidden="true"
                            data-testid="sort-tooltip"
                        >
                            Sort: {currentSortLabel}
                        </span>
                    </button>
                }
                position="right"
                width="180px"
            >
                <ul
                    className="py-1"
                    role="menu"
                    aria-label="Sort options"
                    data-testid="sort-menu"
                >
                    {sortOptions.map((option) => (
                        <li key={option.value} role="none">
                            <button
                                onClick={() => onSortChange(option.value)}
                                className={`w-full text-left px-4 py-3 min-h-[44px] hover:bg-[color:var(--color-main-light)]
                                hover:text-[color:var(--color-text)] transition-colors
                                flex items-center justify-between
                                ${currentSort === option.value ? 'bg-[color:var(--color-main-light)] font-semibold' : ''}`}
                                role="menuitem"
                                aria-current={currentSort === option.value ? 'true' : undefined}
                                aria-label={`Sort by ${option.label}`}
                                data-testid={`sort-option-${option.value}`}
                                type="button"
                            >
                                <span>{option.label}</span>
                                {currentSort === option.value && (
                                    <span
                                        className="text-[color:var(--color-main)]"
                                        aria-label="Selected"
                                        data-testid={`checkmark-${option.value}`}
                                    >
                                        ✓
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </Dropdown>

            {/* Screen reader announcement for sort changes */}
            <div
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                data-testid="sort-announcement"
            >
                Reviews sorted by {currentSortLabel}
            </div>
        </nav>
    );
};

export default SortOptions;