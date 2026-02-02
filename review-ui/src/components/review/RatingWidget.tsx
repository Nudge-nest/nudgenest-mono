import { FC, memo, useCallback, useEffect, useState } from 'react';
import RatingStar from './Star.tsx';
import { useReview } from '../../contexts/ReviewContext.tsx';
import { IReviewItem, IReviewResult } from '../../types/review.ts';
import {MAX_RATING, RATING_ARRAY, RATING_LABELS} from "../../constants";

interface RatingWidgetProps {
    product: IReviewItem;
    result?: IReviewResult[];
    isCompleted?: boolean;
}

export const RatingWithProduct: FC<{ itemName: string; image?: string; productId: string }> = memo(({
                                                                                            itemName,
                                                                                            image,
                                                                                            productId
                                                                                        }) => {
    return (
        <>
            {image && (
                <img
                    src={image}
                    className="h-15 w-15 rounded mb-4 block mx-auto object-cover"
                    alt={`Product image for ${itemName}`}
                    loading="lazy"
                    data-testid={`image-${itemName}`}
                    onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.src = 'https://placehold.co/300x300';
                    }}
                />
            )}
            <p className="text-base text-balance" id={`rating-label-${productId}`} data-testid="item-title">
                {image ? 'Your rating for' : ''}
                <b className="font-semibold"> {itemName || 'this product'}</b>
                {image ? '?' : ''}
            </p>
        </>
    );
});

RatingWithProduct.displayName = 'RatingWithProduct';

const RatingWidget: FC<RatingWidgetProps> = memo(({ product, result, isCompleted }) => {
    const [selectedRating, setSelectedRating] = useState<number>(0);
    const { name, image, id } = product;
    const { reviewFormHook } = useReview();

    useEffect(() => {
        if (isCompleted && result) {
            const itemReview = result.find((res) => res.value);
            if (itemReview) {
                setSelectedRating(Number(itemReview.value));
            }
        }
    }, [result, isCompleted]);

    const handleSetRating = useCallback(
        (ratingValue: number) => {
            if (isCompleted) return;
            setSelectedRating(() => ratingValue);
            reviewFormHook.updateRating({ id: id, value: ratingValue });
        },
        [id, reviewFormHook, isCompleted]
    );

    return (
        <article className={`py-2`}>
            <header className={`w-full text-center`}>
                {image ? (
                    <RatingWithProduct itemName={name} image={image} productId={id} />
                ) : (
                    <p className={`text-base text-balance`} id={`rating-label-${id}`} data-testid="no-image-item-title">
                        <b>{`Your rating for ${name || ''}`}</b>
                    </p>
                )}
            </header>
            <div
                className="w-full p-2 flex justify-center gap-4"
                role="radiogroup"
                aria-labelledby={`rating-label-${id}`}
                aria-label={`Rate ${name} from 1 to ${MAX_RATING} stars`}
                aria-required={!isCompleted}
                aria-disabled={isCompleted}
                data-testid='star-container'
            >
                {RATING_ARRAY.map((_, idx) => {
                    const ratingValue: number = idx + 1;
                    const isSelected = ratingValue === selectedRating;

                    return (
                        <div
                            key={idx}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${ratingValue} star${ratingValue > 1 ? 's' : ''} - ${RATING_LABELS[idx]}`}
                            tabIndex={isCompleted ? -1 : 0}
                            className="focus:outline-none"
                        >
                            <RatingStar
                                fill="#fcc800"
                                defaultFill="#e5e7eb"
                                isFilled={ratingValue <= selectedRating}
                                onClick={() => handleSetRating(ratingValue)}
                                title={RATING_LABELS[idx]}
                                aria-hidden="true"
                            />
                        </div>
                    );
                })}
            </div>
        </article>
    );
});

RatingWidget.displayName = 'RatingWidget';

export default RatingWidget;