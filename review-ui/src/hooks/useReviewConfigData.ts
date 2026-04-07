import { useGetReviewConfigsQuery, useUpdateReviewConfigsMutation } from '../redux/nudgenest.ts';
import { useMemo } from 'react';
import defaultReviewConfig from '../defaultReviewConfig.json';

const getDemoReview = () => defaultReviewConfig;

export const useReviewConfigData = (merchantId: string) => {
    const skipFetch = !merchantId || merchantId === 'demo' || merchantId === 'undefined';
    const { data, isError, isLoading, isFetching } = useGetReviewConfigsQuery(merchantId as string, {
        skip: skipFetch,
    });
    const [updateReviewConfigs] = useUpdateReviewConfigsMutation();

    const reviewConfigs = useMemo(() => {
        if (merchantId === 'demo' || !merchantId) return getDemoReview();
        if (data) return data[0];
        else return null;
    }, [data, merchantId]);

    return {
        reviewConfigs,
        isLoading,
        isError,
        isFetching,
        updateReviewConfigs,
    };
};
