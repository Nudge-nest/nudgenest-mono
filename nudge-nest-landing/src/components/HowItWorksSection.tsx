import PageSection from './PageSection';
import { LargeHeaderTextBold, MediumBodyText, MediumHeaderTextBold } from './Typography';

const steps = [
    {
        number: '01',
        title: 'Install',
        description: 'Add Nudgenest from the Shopify App Store in seconds. No coding required.',
    },
    {
        number: '02',
        title: 'Automate',
        description: 'Customers automatically receive personalised review request emails after every fulfilled order.',
    },
    {
        number: '03',
        title: 'Grow',
        description: 'Collect verified reviews and display them on your store to build trust and drive more sales.',
    },
];

const HowItWorksSection = () => {
    return (
        <PageSection name="how-it-works">
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 py-16 items-center">
                <LargeHeaderTextBold>How It Works</LargeHeaderTextBold>
                <div className="flex flex-col gap-y-8 md:flex-row md:gap-x-8 w-full">
                    {steps.map((step) => (
                        <div key={step.number} className="flex-1 flex flex-col gap-y-3">
                            <span className="text-4xl font-black text-[color:var(--color-main)]">{step.number}</span>
                            <MediumHeaderTextBold>{step.title}</MediumHeaderTextBold>
                            <MediumBodyText>{step.description}</MediumBodyText>
                        </div>
                    ))}
                </div>
            </div>
        </PageSection>
    );
};

export default HowItWorksSection;
