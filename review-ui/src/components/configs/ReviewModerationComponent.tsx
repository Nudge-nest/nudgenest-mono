import { useState, useMemo } from 'react';
import { IconTrash, IconSearch, IconStar, IconStarFilled } from '@tabler/icons-react';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import {
    useListReviewsQuery,
    useToggleReviewPublishedMutation,
    useDeleteReviewMutation,
} from '../../redux/nudgenest.ts';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import type { IReview, IReviewResult } from '../../types/review.ts';

type FilterType = 'all' | 'published' | 'unpublished' | 'pending';

const getAverageRating = (result?: IReviewResult[]): number | null => {
    if (!result || result.length === 0) return null;
    const ratings = result.map((r) => r.value ?? 0).filter((v) => v > 0);
    if (ratings.length === 0) return null;
    return Math.round(ratings.reduce((s, v) => s + v, 0) / ratings.length);
};

const StarRating = ({ rating }: { rating: number | null }) => {
    if (rating === null)
        return <span className="text-xs text-[color:var(--color-disabled)]">No rating</span>;
    return (
        <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) =>
                i <= rating ? (
                    <IconStarFilled key={i} size={12} className="text-yellow-400" />
                ) : (
                    <IconStar key={i} size={12} className="text-[color:var(--color-disabled)]" />
                )
            )}
        </span>
    );
};

const StatusBadge = ({ status, published }: { status: string; published?: boolean }) => {
    if (status !== 'Completed')
        return (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                Pending
            </span>
        );
    return published ? (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            Published
        </span>
    ) : (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
            Unpublished
        </span>
    );
};

const PublishToggle = ({
    review,
    busy,
    onToggle,
}: {
    review: IReview;
    busy: boolean;
    onToggle: () => void;
}) => {
    const disabled = busy || review.status !== 'Completed';
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            title={
                review.status !== 'Completed'
                    ? 'Only completed reviews can be published'
                    : review.published
                    ? 'Unpublish'
                    : 'Publish'
            }
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                ${review.published ? 'bg-[color:var(--color-main)]' : 'bg-gray-300'}`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                    ${review.published ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
        </button>
    );
};

const ReviewModerationComponent = () => {
    const { merchantId } = useReviewConfig();
    const { data: reviews = [], isFetching } = useListReviewsQuery(
        { merchantId: merchantId ?? '' },
        { skip: !merchantId }
    );
    const [togglePublished, { isLoading: isToggling }] = useToggleReviewPublishedMutation();
    const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const busy = isToggling || isDeleting;

    const filterCounts = useMemo(() => {
        const all = reviews as IReview[];
        return {
            all: all.length,
            published: all.filter((r) => r.published).length,
            unpublished: all.filter((r) => r.status === 'Completed' && !r.published).length,
            pending: all.filter((r) => r.status !== 'Completed').length,
        };
    }, [reviews]);

    const filtered = useMemo(() => {
        let list = reviews as IReview[];
        if (filter === 'published') list = list.filter((r) => r.published);
        else if (filter === 'unpublished') list = list.filter((r) => r.status === 'Completed' && !r.published);
        else if (filter === 'pending') list = list.filter((r) => r.status !== 'Completed');

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    r.customerName?.toLowerCase().includes(q) ||
                    r.customerEmail?.toLowerCase().includes(q) ||
                    r.items?.some((item) => item.name?.toLowerCase().includes(q))
            );
        }
        return list;
    }, [reviews, filter, search]);

    const handleToggle = async (review: IReview) => {
        if (!review.id || review.status !== 'Completed') return;
        await togglePublished({ id: review.id, published: !review.published });
    };

    const handleDelete = async (id: string) => {
        await deleteReview(id);
        setConfirmDeleteId(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <HeaderTextComponent
                title="Reviews"
                subTitle="Manage visibility and moderation of all your reviews."
                hideSaveButton
            />

            {/* Search */}
            <div className="relative">
                <IconSearch
                    size={15}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-disabled)] pointer-events-none"
                />
                <input
                    type="text"
                    placeholder="Search by name, email or product…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[color:var(--color-border)] bg-white focus:outline-none focus:ring-1 focus:ring-[color:var(--color-main)]"
                />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 flex-wrap">
                {(['all', 'published', 'unpublished', 'pending'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                            filter === f
                                ? 'bg-[color:var(--color-main)] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {f} ({filterCounts[f]})
                    </button>
                ))}
            </div>

            {/* Content */}
            {isFetching ? (
                <p className="text-sm text-[color:var(--color-disabled)]">Loading reviews…</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-[color:var(--color-disabled)]">No reviews found.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((review) => {
                        const rating = getAverageRating(review.result as IReviewResult[]);
                        const productNames = review.items?.map((i) => i.name).filter(Boolean).join(', ') || '—';
                        const date = review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : '—';

                        return (
                            <div
                                key={review.id}
                                className="rounded-xl border border-[color:var(--color-border)] bg-white p-3 flex flex-col gap-2"
                            >
                                {/* Top row: name + status + date */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-gray-800 truncate">
                                            {review.customerName}
                                        </p>
                                        {review.customerEmail && (
                                            <p className="text-xs text-[color:var(--color-disabled)] truncate">
                                                {review.customerEmail}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <StatusBadge status={review.status} published={review.published} />
                                        <span className="text-xs text-[color:var(--color-disabled)]">{date}</span>
                                    </div>
                                </div>

                                {/* Product + rating */}
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-gray-500 truncate flex-1">{productNames}</p>
                                    <StarRating rating={rating} />
                                </div>

                                {/* Actions row */}
                                {review.status === 'Completed' && <div className="flex items-center justify-between pt-1 border-t border-[color:var(--color-border)]">
                                    <div className="flex items-center gap-2">
                                        {review.status === 'Completed' && (
                                            <>
                                                <span className="text-xs text-gray-500">
                                                    {review.published ? 'Published' : 'Unpublished'}
                                                </span>
                                                <PublishToggle
                                                    review={review}
                                                    busy={busy}
                                                    onToggle={() => handleToggle(review)}
                                                />
                                            </>
                                        )}
                                    </div>

                                    {review.status === 'Completed' && confirmDeleteId === review.id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Delete?</span>
                                            <button
                                                onClick={() => handleDelete(review.id!)}
                                                disabled={isDeleting}
                                                className="text-xs text-red-600 font-medium hover:underline"
                                            >
                                                Yes
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs text-gray-500 hover:underline"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : review.status === 'Completed' ? (
                                        <button
                                            onClick={() => setConfirmDeleteId(review.id!)}
                                            disabled={busy}
                                            className="text-[color:var(--color-disabled)] hover:text-red-500 transition-colors disabled:opacity-40 p-1"
                                            title="Delete review"
                                        >
                                            <IconTrash size={15} />
                                        </button>
                                    ) : null}
                                </div>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReviewModerationComponent;
