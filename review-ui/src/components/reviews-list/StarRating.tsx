/*Readonly Star, no clicking just displaying*/
import { IconStar } from '@tabler/icons-react';
import { FC } from 'react';
import { StarRatingProps } from '../../types/review.ts';

const StarRating: FC<StarRatingProps> = ({ rating, size = 16 }) => {
    const MAX_STARS = 5;
    const validRating = Math.min(Math.max(0, rating), MAX_STARS);

    return (
        <div
            className="flex gap-1"
            data-testid="star-rating"
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= validRating;

                return (
                    <IconStar
                        key={star}
                        size={size}
                        fill={isFilled ? '#fcc800' : '#e5e7eb'}
                        stroke={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-200"
                        style={{
                            filter: isFilled ? 'drop-shadow(0 2px 4px rgba(252, 200, 0, 0.3))' : 'none',
                            color: isFilled ? '#fcc800' : '#9ca3af'
                        }}
                        data-testid={`star-${star}${isFilled ? '-filled' : '-empty'}`}
                    />
                );
            })}
        </div>
    );
};

export default StarRating;