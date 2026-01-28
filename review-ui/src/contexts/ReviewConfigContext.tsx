import { createContext, FC, ReactNode, useContext } from 'react';
import { useParams } from 'react-router';
import ErrorComponent from '../components/ErrorComponent.tsx';

import { IReviewConfiguration } from '../types/reviewConfigs.ts';
import { useReviewConfigData } from '../hooks/useReviewConfigData.ts';
import { useReviewConfigForm } from '../hooks/useReviewConfigForm.ts';

interface IReviewConfigContext {
    // Data
    reviewConfigs: IReviewConfiguration | null;
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

    // Error state
    if (isError) return <ErrorComponent message="Nothing to see here!" />;

    return (
        <ReviewConfigContext.Provider
            value={{
                reviewConfigs,
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
