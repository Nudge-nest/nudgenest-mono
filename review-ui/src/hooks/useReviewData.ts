import { useGetReviewQuery, useUpdateReviewMutation, useGetReviewConfigsQuery } from '../redux/nudgenest.ts';
import { useMemo } from 'react';
import defaultReview from '../defaultReview.json';
import { IReview } from '../types/review.ts';

const getDemoReview = (): IReview => defaultReview as IReview;

export const useReviewData = (reviewId: string, pathname: string) => {
    const skipFetch = !reviewId || reviewId === 'demo' || reviewId === 'store-review';
    const _storeReviewMerchantId = pathname.split('/')[3] as string;
    const { data, isError, isLoading, isFetching } = useGetReviewQuery(reviewId as string, { skip: skipFetch });
    const configMerchantId = data ? data.merchantId : _storeReviewMerchantId;
    const {
        data: merchantConf,
        isError: isMerchantConfigError,
        isLoading: isLoadingMerchantConfigs,
    } = useGetReviewConfigsQuery(configMerchantId as string, {
        skip: !configMerchantId || configMerchantId === 'undefined',
    });
    const [updateReview] = useUpdateReviewMutation();

    const review = useMemo(() => {
        if (reviewId === 'demo') return getDemoReview();
        return data || null;
    }, [data, reviewId]);

    const merchantConfigs = useMemo(() => {
        return merchantConf;
    }, [merchantConf]);

    return {
        review,
        isLoading,
        isError,
        isFetching,
        reviewStatus: review?.status,
        updateReview,
        merchantId: review ? review.merchantId : _storeReviewMerchantId,
        merchantConfigs,
        isMerchantConfigError: isMerchantConfigError,
        isLoadingMerchantConfigs,
    };
};
