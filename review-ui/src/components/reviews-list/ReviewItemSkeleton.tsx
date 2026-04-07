import { FC } from 'react';

/**
 * Skeleton loader for ReviewItem component
 * Shows placeholder while reviews are loading
 */
const ReviewItemSkeleton: FC = () => {
    return (
        <article
            className="border border-[color:var(--color-border)] rounded-lg overflow-hidden flex flex-col h-full animate-pulse"
            data-testid="review-item-skeleton"
            aria-busy="true"
            aria-label="Loading review"
        >
            {/* Media skeleton */}
            <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0" />

            <div className="p-4 flex flex-col flex-1 gap-2">
                {/* Customer name skeleton */}
                <div className="flex items-center gap-1.5">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                </div>

                {/* Rating and date skeleton */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded-sm" />
                        ))}
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="h-3 bg-gray-200 rounded w-16" />
                </div>

                {/* Comment skeleton */}
                <div className="flex-1 space-y-2 mt-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 rounded w-4/6" />
                </div>
            </div>
        </article>
    );
};

export default ReviewItemSkeleton;
