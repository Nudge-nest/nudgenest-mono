// TODO Sprint 6: replace placeholder testimonials with real merchant testimonials
import PageSection from './PageSection';
import { LargeHeaderTextBold, MediumBodyText, MediumHeaderTextBold, SmallBodyText } from './Typography';

const testimonials = [
    {
        quote: 'Nudgenest doubled our review count in the first month. Setup took less than five minutes.',
        name: 'Sarah K.',
        store: 'The Candle Co.',
        rating: 5,
    },
    {
        quote: "Our customers love how easy the review process is. We've seen a real boost in conversions since we started using it.",
        name: 'Marcus T.',
        store: 'Urban Threads',
        rating: 5,
    },
    {
        quote: 'Finally, a review app that just works. Automated, on-brand, and our customers actually respond.',
        name: 'Priya L.',
        store: 'Bloom & Petal',
        rating: 5,
    },
];

const StarRating = ({ count }: { count: number }) => (
    <div className="flex gap-x-1">
        {Array.from({ length: count }).map((_, i) => (
            <svg key={i} className="w-4 h-4 text-[color:var(--color-main)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const SocialProofSection = () => {
    return (
        <PageSection name="social-proof">
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 py-16 items-center">
                <LargeHeaderTextBold>Merchants Love Nudgenest</LargeHeaderTextBold>
                <MediumBodyText className="text-center max-w-xl">
                    Join merchants who are already growing their stores with verified customer reviews.
                </MediumBodyText>
                <div className="w-full flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className="flex-1 flex flex-col gap-y-3 p-6 rounded-2xl bg-[color:var(--color-white)] border border-[color:var(--color-icons-border)]"
                        >
                            <StarRating count={t.rating} />
                            <MediumBodyText className="italic">"{t.quote}"</MediumBodyText>
                            <div className="mt-auto">
                                <MediumHeaderTextBold>{t.name}</MediumHeaderTextBold>
                                <SmallBodyText>{t.store}</SmallBodyText>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PageSection>
    );
};

export default SocialProofSection;
