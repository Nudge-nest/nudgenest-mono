import { createContext, FC, ReactNode, useContext, useEffect } from 'react';
import { useParams } from 'react-router';
import ErrorComponent from '../components/ErrorComponent.tsx';

import { IReviewConfiguration } from '../types/reviewConfigs.ts';
import { useReviewConfigData } from '../hooks/useReviewConfigData.ts';
import { useReviewConfigForm } from '../hooks/useReviewConfigForm.ts';

interface IReviewConfigContext {
    // Data
    reviewConfigs: IReviewConfiguration | null;
    merchantId: string | undefined;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    // Form state
    reviewConfigFormHoook: any;
    // Form actions
}

const ReviewConfigContext = createContext<IReviewConfigContext | null>(null);

export const ReviewConfigProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { merchantId } = useParams<{ merchantId: string }>();
    const { reviewConfigs, isError, isLoading, isFetching } = useReviewConfigData(merchantId as string);
    const formHook = useReviewConfigForm(reviewConfigs);

    // Read apiKey from URL param (passed by Shopify app dashboard) and persist to localStorage
    // so that the Redux prepareHeaders can attach x-api-key to authenticated requests (e.g. PATCH config)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const apiKey = params.get('apiKey');
        if (apiKey) localStorage.setItem('nn-apiKey', apiKey);
    }, []);

    // Error state
    if (isError) return <ErrorComponent message="Nothing to see here!" />;

    return (
        <ReviewConfigContext.Provider
            value={{
                reviewConfigs,
                merchantId,
                isLoading,
                isError,
                isFetching,
                reviewConfigFormHoook: formHook,
            }}
        >
            {children}
        </ReviewConfigContext.Provider>
    );
};

export const useReviewConfig = () => {
    const context = useContext(ReviewConfigContext);
    if (!context) throw new Error('useReviewConfig must be used within a ReviewConfigContext');
    return context;
};
