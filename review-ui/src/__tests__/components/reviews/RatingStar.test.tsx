import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';
import RatingStar from '../../../components/review/Star';
import { RATING_ARRAY, RATING_LABELS } from '../../../constants';

// Keep original helper for first 3 tests
const RenderStars = ({ rating }: { rating: number }) =>
    RATING_ARRAY.map((_, idx) => {
        const ratingValue: number = idx + 1;
        return <RatingStar
            isFilled={ratingValue <= rating}
            key={idx}
            fill="#fcc800"
            defaultFill="#f9f9f9"
            title={RATING_LABELS[idx]}
        />;
    });

// Add stateful version ONLY for the onClick test
const RenderStarsWithClick = () => {
    const [rating, setRating] = useState(0);

    return RATING_ARRAY.map((_, idx) => {
        const ratingValue: number = idx + 1;
        return <RatingStar
            isFilled={ratingValue <= rating}
            key={idx}
            fill="#fcc800"
            defaultFill="#f9f9f9"
            title={RATING_LABELS[idx]}
            onClick={() => setRating(ratingValue)}
        />;
    });
};

describe('RatingStar component', () => {
    test('should render five unfilled stars', () => {
        render(<RenderStars rating={0}/>);
        expect(screen.getAllByLabelText('rating-star')).toHaveLength(5);
        screen.getAllByLabelText('rating-star').forEach((star) => {
            expect(star.getAttribute('fill')).toBe('#f9f9f9');
        });
    });

    test('should render five filled stars', () => {
        render(<RenderStars rating={5}/>);
        expect(screen.getAllByLabelText('rating-star')).toHaveLength(5);
        screen.getAllByLabelText('rating-star').forEach((star) => {
            expect(star.getAttribute('fill')).toBe('#fcc800');
        });
    });

    test('should render three filled stars', () => {
        const filledArr: string[] = [];
        const unFilledArr: string[] = [];
        render(<RenderStars rating={3}/>);
        expect(screen.getAllByLabelText('rating-star')).toHaveLength(5);
        screen.getAllByLabelText('rating-star').forEach((star) => {
            const filledStatus = star.getAttribute('fill') as string;
            if (filledStatus === '#fcc800') filledArr.push(filledStatus);
            else unFilledArr.push(filledStatus);
        });
        expect(filledArr).toHaveLength(3);
        expect(unFilledArr).toHaveLength(2);
    });

    test('should render three filled stars onClick', async () => {
        const filledArr: string[] = [];
        const unFilledArr: string[] = [];
        render(<RenderStarsWithClick />); // Use stateful component here
        expect(screen.getAllByLabelText('rating-star')).toHaveLength(5);

        // Click the third star
        await waitFor(()=>fireEvent.click(screen.getByTestId('star-Good')));

        // Now check the updated state
        screen.getAllByLabelText('rating-star').forEach((star) => {
            const filledStatus = star.getAttribute('fill') as string;
            if (filledStatus === '#fcc800') filledArr.push(filledStatus);
            else unFilledArr.push(filledStatus);
        });
        expect(filledArr).toHaveLength(3);
        expect(unFilledArr).toHaveLength(2);
    });
});