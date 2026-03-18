import { useState, useCallback, useMemo, useEffect } from 'react';
import { IReview, IReviewResult, IUploadedMediaObject } from '../types/review';
import { useDeleteReviewMediaMutation, useUpdateReviewMutation } from '../redux/nudgenest';

// Updated type definitions to match original API
interface UseReviewFormReturn {
    // Data - ORIGINAL STRUCTURE
    ratings: IReviewResult[];
    media: IUploadedMediaObject[];
    comment: string;
    isSubmitting: boolean | undefined;

    // Actions - ORIGINAL FUNCTION NAMES
    setIsSubmitting: (value: boolean | undefined | ((prev: boolean | undefined) => boolean | undefined)) => void;
    updateRating: (rating: { id: string; value: number }) => void;
    addMedia: (files: IUploadedMediaObject[]) => void;
    removeMedia: (media: { id: string; mediaURL: string }) => Promise<void>;
    updateComment: (comment: string) => void;
    resetForm: () => void;
    handleSubmitReview: () => Promise<void>; // ORIGINAL NAME
    handleSubmitDemo: () => void; // ORIGINAL NAME

    // New additions (backward compatible)
    error?: string | null;
    isDirty?: boolean;
    isValid?: boolean;
}

// Helper functions with proper typing
const extractRatings = (review: IReview | null): Record<string, number> => {
    if (!review?.result) return {};

    const ratings: Record<string, number> = {};
    review.result.forEach((result: IReviewResult) => {
        if (result.id && typeof result.value === 'number') {
            ratings[result.id] = result.value;
        }
    });
    return ratings;
};

const extractMedia = (review: IReview | null): IUploadedMediaObject[] => {
    if (!review?.result) return [];

    // @ts-ignore
    return review.result.filter((result: any) => result.mediaURL);
};

const extractComment = (review: IReview | null): string => {
    if (!review?.result) return '';

    const commentResult = review.result.find((result: IReviewResult) => typeof result.comment === 'string');

    return commentResult?.comment || '';
};

// Validation helpers
const validateRating = (rating: number): boolean => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

const validateComment = (comment: string): boolean => {
    return comment.length > 0 && comment.length <= 1000;
};

export const useReviewForm = (initialData: IReview): UseReviewFormReturn => {
    // Initialize state from review data
    const extractedData = useMemo(
        () => ({
            ratings: extractRatings(initialData),
            media: extractMedia(initialData),
            comment: extractComment(initialData),
        }),
        [initialData]
    );

    // Form state - keep original structure for compatibility
    const [ratings, setRatings] = useState<IReviewResult[]>(
        Object.entries(extractedData.ratings).map(([id, value]) => ({ id, value }))
    );
    const [media, setMedia] = useState<IUploadedMediaObject[]>(extractedData.media);
    const [comment, setComment] = useState<string>(extractedData.comment);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState<boolean | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    // Mutations
    const [deleteReviewMedia] = useDeleteReviewMediaMutation();
    const [updateReview] = useUpdateReviewMutation();

    // Computed state
    const isDirty = useMemo(() => {
        const currentRatings = Object.fromEntries(ratings.map((r) => [r.id!, r.value!]));
        return (
            JSON.stringify(currentRatings) !== JSON.stringify(extractedData.ratings) ||
            JSON.stringify(media) !== JSON.stringify(extractedData.media) ||
            comment !== extractedData.comment
        );
    }, [ratings, media, comment, extractedData]);

    const isValid = useMemo(() => {
        const hasValidRatings = ratings.every((r) => validateRating(r.value || 0));
        const hasValidComment = validateComment(comment);
        const hasRatings = ratings.length > 0;

        return hasValidRatings && hasValidComment && hasRatings;
    }, [ratings, comment]);

    // Reset form when initial review changes
    useEffect(() => {
        const newRatings = Object.entries(extractedData.ratings).map(([id, value]) => ({ id, value }));
        setRatings(newRatings);
        setMedia(extractedData.media);
        setComment(extractedData.comment);
        setError(null);
    }, [extractedData]);

    // KEEP ORIGINAL FUNCTION NAMES - Actions
    const updateRating = useCallback((rating: { id: string; value: number }) => {
        if (!validateRating(rating.value)) {
            setError(`Invalid rating: ${rating.value}. Must be between 1 and 5.`);
            return;
        }

        setError(null);
        setRatings((prev) => {
            const index = prev.findIndex((r) => r.id === rating.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = rating;
                return updated;
            }
            return [...prev, rating];
        });
    }, []);

    const addMedia = useCallback((files: IUploadedMediaObject[]) => {
        if (!files || files.length === 0) return;

        const MAX_FILES = 12;
        setMedia((prev) => {
            const newTotal = prev.length + files.length;
            if (newTotal > MAX_FILES) {
                setError(`Cannot add ${files.length} files. Maximum ${MAX_FILES} total files allowed.`);
                return prev;
            }

            setError(null);
            return [...prev, ...files];
        });
    }, []);

    const removeMedia = useCallback(
        async (mediaItem: { id: string; mediaURL: string }) => {
            if (!mediaItem) {
                setError('Media not found');
                return;
            }

            try {
                // Optimistically remove from UI
                setMedia((prev) => prev.filter((m) => m.id !== mediaItem.id));
                setError(null);

                // Delete from server
                await deleteReviewMedia(mediaItem.mediaURL).unwrap();
            } catch (error: any) {
                // Revert on error
                setMedia((prev) => [...prev, mediaItem]);
                setError(`Failed to delete media: ${error.message}`);
                console.error('Delete media error:', error);
            }
        },
        [deleteReviewMedia]
    );

    const updateComment = useCallback((newComment: string) => {
        if (newComment.trim().length > 1000) {
            setError('Comment cannot exceed 1000 characters');
            return;
        }

        setError(null);
        setComment(newComment);
    }, []);

    const resetForm = useCallback(() => {
        setRatings([]);
        setMedia([]);
        setComment('');
        setError(null);
    }, []);

    // KEEP ORIGINAL FUNCTION NAMES
    const handleSubmitReview = useCallback(async (): Promise<void> => {
        if (!isValid) {
            setError('Please complete all required fields');
            return;
        }

        if (!initialData) {
            setError('No review data available');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const finalReview: IReview = {
                ...initialData,
                result: [...ratings, ...media, { comment }],
                status: 'Completed',
                updatedAt: new Date().toISOString(),
            };

            await updateReview(finalReview).unwrap();
        } catch (error: any) {
            setError(error.message || 'Failed to submit review');
            console.error('Submit review error:', error);
        }
    }, [isValid, initialData, ratings, media, comment, updateReview]);

    const handleSubmitDemo = useCallback(() => {
        setIsSubmitting(true);
        resetForm();
    }, [resetForm]);

    return {
        // Data - KEEP ORIGINAL STRUCTURE
        ratings,
        media,
        comment,
        isSubmitting,

        // Actions - KEEP ORIGINAL FUNCTION NAMES
        setIsSubmitting,
        updateRating,
        addMedia,
        removeMedia,
        updateComment,
        resetForm,
        handleSubmitReview, // ORIGINAL NAME
        handleSubmitDemo, // ORIGINAL NAME

        // New additions (existing components won't break)
        error,
        isDirty,
        isValid,
    };
};
