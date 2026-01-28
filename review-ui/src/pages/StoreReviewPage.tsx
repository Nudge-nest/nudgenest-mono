import { useEffect, useState } from 'react';
import { useReview } from '../contexts/ReviewContext';
import Loading from '../components/Loading.tsx';
import { IReviewItem, IReviewResult } from '../types/review.ts';
import RatingWidget from '../components/review/RatingWidget.tsx';
import MediaWidget from '../components/review/MediaWidget.tsx';
import CommentWidget from '../components/review/CommentWidget.tsx';

const StoreReviewPage = () => {
    const { shopReview, sliderHook, isLoadingMerchantConfigs } = useReview();
    const [items, setItems] = useState<IReviewItem[]>([]);
    const [result, setResult] = useState<IReviewResult[] | undefined>(undefined);
    useEffect(() => {
        if (shopReview) {
            setItems(shopReview.items);
            if (shopReview.result) setResult(shopReview.result);
        }
    }, [shopReview]);
    if (isLoadingMerchantConfigs) return <Loading />;
    return (
        <div className={`h-full px-4 text-center grid grid-rows-[95%_auto]`}>
            <div ref={sliderHook.sliderRef} className="h-full scroll-auto keen-slider">
                <div
                    className={`h-full flex flex-col gap-2 ${items.length <= 1 ? 'justify-center' : 'justify-start'} pt-4 keen-slider__slide overflow-auto`}
                >
                    {items.map((item: IReviewItem, i: number) => {
                        return (
                            <RatingWidget
                                product={item}
                                key={i}
                                result={result}
                                isCompleted={result && result.length > 0}
                            />
                        );
                    })}
                </div>
                <div className="h-full flex flex-col gap-2 justify-center keen-slider__slide">
                    <MediaWidget />
                </div>
                <div className="h-full flex flex-col gap-2 justify-center keen-slider__slide">
                    <CommentWidget />
                </div>
            </div>
            {sliderHook.loaded && sliderHook.instanceRef.current && (
                <div className="w-full dots flex justify-center-safe gap-4 py-2">
                    {[...Array(sliderHook.instanceRef.current.track.details.slides.length).keys()].map((idx) => {
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    sliderHook.instanceRef.current?.moveToIdx(idx);
                                }}
                                className={`dot w-20 h-1.5 rounded ${idx <= sliderHook.currentSlide ? 'active bg-[color:var(--color-main)]' : 'bg-[color:var(--color-disabled)]'}`}
                            ></button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StoreReviewPage;
