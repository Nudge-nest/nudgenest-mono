import { useState } from 'react';
import PageSection from './PageSection';
import { LargeHeaderTextBold, MediumBodyText, MediumHeaderTextBold } from './Typography';

const faqs = [
    {
        question: 'What is Nudgenest?',
        answer:
            'Nudgenest is an automated review platform for Shopify merchants. It sends personalised review request emails to your customers after every fulfilled order, helping you collect genuine, verified reviews at scale.',
    },
    {
        question: 'How does it integrate with my Shopify store?',
        answer:
            'Install the Nudgenest app from the Shopify App Store. Once installed, it automatically registers your store and starts monitoring order fulfilments — no coding or manual setup required.',
    },
    {
        question: 'What happens after a customer places an order?',
        answer:
            'When an order is fulfilled, Nudgenest automatically sends a review request email to your customer. You can configure the timing, the subject line, and the message body to match your brand.',
    },
    {
        question: 'Can I customise the review request emails?',
        answer:
            'Yes. On the Starter plan and above, you can customise the email subject, body, and call-to-action button text. You can also set up automated follow-up reminders for customers who haven\'t responded.',
    },
    {
        question: 'Are the reviews from real customers?',
        answer:
            'Yes — every review is tied to an actual Shopify order. Only customers who have genuinely purchased from your store can submit a review, so you never have to worry about fake or unverified submissions.',
    },
    {
        question: 'How do I display reviews on my store?',
        answer:
            'Each merchant gets a hosted public review page that you can link to from your store. Advanced display widgets for embedding reviews directly in your Shopify theme are on the roadmap.',
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <PageSection name="faq">
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 py-16 items-center">
                <LargeHeaderTextBold>Frequently Asked Questions</LargeHeaderTextBold>
                <div className="w-full flex flex-col gap-y-2">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        return (
                            <div
                                key={index}
                                className="border border-[color:var(--color-icons-border)] rounded-xl overflow-hidden"
                            >
                                <button
                                    className="w-full flex justify-between items-center px-6 py-4 text-left bg-[color:var(--color-white)] hover:bg-[color:var(--color-icons-bg)] transition-colors"
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    aria-expanded={isOpen}
                                >
                                    <MediumHeaderTextBold>{faq.question}</MediumHeaderTextBold>
                                    <span
                                        className="ml-4 text-xl font-bold text-[color:var(--color-main)] flex-shrink-0 transition-transform duration-200"
                                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                                    >
                                        +
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-6 py-4 bg-[color:var(--color-white)]">
                                        <MediumBodyText>{faq.answer}</MediumBodyText>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </PageSection>
    );
};

export default FAQSection;
