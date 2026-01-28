/*Readonly Star, no clicking just displaying*/
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { FC } from 'react';
import { StarRatingProps } from '../../types/review.ts';

const StarRating: FC<StarRatingProps> = ({ rating, size = 16, showEmpty = true }) => {
    const MAX_STARS = 5;
    const validRating = Math.min(Math.max(0, rating), MAX_STARS);

    return (
        <div
            className="flex gap-0.5"
            data-testid="star-rating"
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= validRating;

                return (
                    <span
                        key={star}
                        className="text-[color:var(--color-yellow)]"
                        data-testid={`star-${star}`}
                    >
                        {isFilled ? (
                            <IconStarFilled
                                size={size}
                                data-testid={`star-filled-${star}`}
                            />
                        ) : showEmpty ? (
                            <IconStar
                                size={size}
                                className="text-[color:var(--color-text)]"
                                data-testid={`star-empty-${star}`}
                            />
                        ) : null}
                    </span>
                );
            })}
        </div>
    );
};

export default StarRating;