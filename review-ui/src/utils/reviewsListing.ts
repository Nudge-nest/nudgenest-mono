import { IReview } from '../types/review.ts';

export const sanitizeReviewText = (text: string): string => {
    const sanitized = text
        .replace(/&quot;|&#34;|&#x22;|&ldquo;|&rdquo;|&lsquo;|&rsquo;/gi, '')
        .replace(/["'""„''«»]/g, '')
        .trim();

    if (sanitized.length > 105) {
        return sanitized.substring(0, 101) + ' ...';
    }

    return sanitized;
};

export const calculateReviewRating = (review: IReview): number => {
    const result = review.result || [];
    const numericalResults = result.filter((res) => res.value);
    if (numericalResults.length === 0) return 5;
    const total = numericalResults.reduce((sum, res: any) => sum + res.value, 0);
    return total / numericalResults.length;
};
