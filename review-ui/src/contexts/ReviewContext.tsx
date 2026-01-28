import { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import ErrorComponent from '../components/ErrorComponent.tsx';
import { IReview, IReviewItem } from '../types/review.ts';
import { useReviewData } from '../hooks/useReviewData.ts';
import { useSlider } from '../hooks/useSlider.ts';
import { useReviewForm } from '../hooks/useReviewForm.ts';
import { IConfigField, IReviewConfiguration } from '../types/reviewConfigs.ts';

interface IReviewContext {
    // Data
    review: IReview | null;
    shopReview: IReview | null;
    merchantConfigs: IReviewConfiguration | null;
    isLoading: boolean;
    isLoadingMerchantConfigs: boolean;
    isError: boolean;
    isFetching: boolean;
    reviewId: string;
    merchantId: string;
    reviewStatus: string | undefined;
    // Form state
    reviewFormHook: any;
    // Form actions

    // Slider state
    sliderHook: any;
}

const resolveReviewId = (reviewId: string, pathname: string) => {
    if (reviewId && pathname.includes('store')) return 'store-review';
    else return reviewId;
};

const getShopReview = (merchantConfigs: IReviewConfiguration[], merchantId: string): IReview | undefined => {
    if (!merchantConfigs) return;
    const { general } = merchantConfigs[0];
    const shopQuestions = general.shopReviewQuestions as IConfigField[];
    const shopReviewItems = shopQuestions.map((shopQuestion): IReviewItem => {
        return { id: '14767045378186', name: shopQuestion.value };
    });
    return {
        merchantId: merchantId,
        items: shopReviewItems,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};

const ReviewContext = createContext<IReviewContext | null>(null);

export const ReviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { id } = useParams<{ id: string }>();
    const { pathname } = useLocation();
    const reviewId = resolveReviewId(id as string, pathname);
    const {
        review,
        reviewStatus,
        isError,
        isLoading,
        isFetching,
        merchantConfigs,
        merchantId,
        isLoadingMerchantConfigs,
    } = useReviewData(reviewId, pathname);
    const sliderHook = useSlider(3);
    const formHook = useReviewForm(review as IReview);
    const [shopReview, setShopReview] = useState<IReview | null>(null);

    useEffect(() => {
        if (isLoading || isLoadingMerchantConfigs) return;
        if (merchantConfigs && !shopReview) setShopReview(getShopReview(merchantConfigs, merchantId) as IReview);
    }, [merchantConfigs, shopReview, merchantId]);

    // Error state
    if (isError) return <ErrorComponent message="Nothing to see here!" />;

    return (
        <ReviewContext.Provider
            value={{
                review,
                isLoading,
                isError,
                isFetching,
                reviewId,
                reviewFormHook: formHook,
                sliderHook,
                merchantId: merchantId,
                reviewStatus,
                merchantConfigs,
                shopReview,
                isLoadingMerchantConfigs,
            }}
        >
            {children}
        </ReviewContext.Provider>
    );
};

export const useReview = () => {
    const context = useContext(ReviewContext);
    if (!context) throw new Error('useReview must be used within a ReviewProvider');
    return context;
};
