import { useState, useCallback, useEffect } from 'react';
import { IConfigField, IReviewConfiguration } from '../types/reviewConfigs.ts';
import { useReviewConfigData } from './useReviewConfigData.ts';

// Updated type definitions to match original API
interface UseReviewConfigFormReturn {
    // Data - ORIGINAL STRUCTURE
    reviewConfigs: IReviewConfiguration | null;
    isSubmitting: boolean | undefined;
    setIsSubmitting: (value: boolean | undefined | ((prev: boolean | undefined) => boolean | undefined)) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean | ((prev: boolean) => boolean)) => void;

    // Actions - ORIGINAL FUNCTION NAMES
    handleUpdateReviewConfig: () => Promise<void>; // ORIGINAL NAME
    handleSubmitDemo: () => void; // ORIGINAL NAME
    error: string | null;
    handleFieldChange: (key: string, value: string, propName: keyof Omit<IReviewConfiguration, 'merchantId'>) => void;
}

export const useReviewConfigForm = (initialData: IReviewConfiguration): UseReviewConfigFormReturn => {
    // Form state - keep original structure for compatibility
    const [reviewConfigs, setReviewConfigs] = useState<any | null>(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState<boolean | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const { updateReviewConfigs } = useReviewConfigData(reviewConfigs ? reviewConfigs.merchantId : '');
    const [isEditing, setIsEditing] = useState<boolean>(false);

    useEffect(() => {
        if (initialData && !reviewConfigs) setReviewConfigs(initialData);
    }, [reviewConfigs, initialData]);

    // KEEP ORIGINAL FUNCTION NAMES
    const handleUpdateReviewConfig = useCallback(async (): Promise<void> => {
        //TODO : Validations
        if (!reviewConfigs) return;
        setIsSubmitting(true);
        setError(null);

        try {
            updateReviewConfigs({ reviewConfigs: reviewConfigs, merchantId: reviewConfigs.merchantId });
        } catch (error: any) {
            setError(error.message || 'Failed to submit review');
            console.error('Submit review error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [reviewConfigs, updateReviewConfigs, setIsSubmitting, setError]);

    const handleFieldChange = useCallback(
        (key: string, value: string | number | boolean, propName: keyof Omit<IReviewConfiguration, 'merchantId'>) => {
            setIsEditing(true);
            setReviewConfigs((prev: any) => {
                if (!prev || !prev[propName]) return prev;

                return {
                    ...prev,
                    [propName]: prev[propName].map((field: IConfigField) =>
                        field.key === key
                            ? { ...field, value: String(value) } // Convert to string since your interface expects string
                            : field
                    ),
                };
            });
        },
        []
    );

    const handleSubmitDemo = useCallback(() => {
        setIsSubmitting(true);
    }, []);

    return {
        // Data - KEEP ORIGINAL STRUCTURE
        reviewConfigs,
        isSubmitting,
        isEditing,
        setIsEditing,

        // Actions - KEEP ORIGINAL FUNCTION NAMES
        setIsSubmitting,
        handleUpdateReviewConfig, // ORIGINAL NAME
        handleSubmitDemo, // ORIGINAL NAME
        handleFieldChange,

        // New additions (existing components won't break)
        error,
    };
};
