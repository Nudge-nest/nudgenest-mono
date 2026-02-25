import { useEffect, useState } from 'react';
import PageSection from './PageSection';
import { LargeHeaderTextBold, MediumBodyText, MediumHeaderTextBold, SmallBodyText } from './Typography';

type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';

interface PlanFeatures {
    emailReviewRequests: boolean;
    smsReviewRequests: boolean;
    autoReminders: boolean;
    customEmailTemplates: boolean;
    reviewIncentives: boolean;
    bulkImport: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
}

interface Plan {
    id: string;
    displayName: string;
    description: string;
    tier: PlanTier;
    price: number;
    features: PlanFeatures;
}

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
    emailReviewRequests: 'Email review requests',
    smsReviewRequests: 'SMS review requests',
    autoReminders: 'Automated reminders',
    customEmailTemplates: 'Custom email templates',
    reviewIncentives: 'Review incentives',
    bulkImport: 'Bulk import',
    advancedAnalytics: 'Advanced analytics',
    apiAccess: 'API access',
    whiteLabel: 'White label',
    prioritySupport: 'Priority support',
    dedicatedAccountManager: 'Dedicated account manager',
};

const DISPLAY_TIERS: PlanTier[] = ['FREE', 'STARTER', 'GROWTH', 'PRO'];

const backendUrl = `${import.meta.env.VITE_APP_BACKEND_URL}`;
const signupUrl = `${import.meta.env.VITE_APP_SIGNUP_URL}`;

const PricingSection = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${backendUrl}/plans`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch plans');
                return res.json();
            })
            .then((data: Plan[]) => {
                const filtered = DISPLAY_TIERS.map((tier) => data.find((p) => p.tier === tier)).filter(
                    (p): p is Plan => p !== undefined
                );
                setPlans(filtered);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    return (
        <PageSection name="pricing">
            <div className="col-span-full md:w-4/5 mx-auto flex flex-col gap-y-10 py-16 items-center">
                <LargeHeaderTextBold>Simple, Transparent Pricing</LargeHeaderTextBold>
                <MediumBodyText className="text-center max-w-xl">
                    Start for free and upgrade as your store grows. No hidden fees.
                </MediumBodyText>

                {loading && (
                    <div className="w-full flex flex-col gap-y-4 md:flex-row md:gap-x-4">
                        {DISPLAY_TIERS.map((tier) => (
                            <div key={tier} className="flex-1 h-64 rounded-2xl bg-[color:var(--color-icons-bg)] animate-pulse" />
                        ))}
                    </div>
                )}

                {error && (
                    <SmallBodyText className="!text-[color:var(--color-main)]">
                        Pricing unavailable right now — please check back later.
                    </SmallBodyText>
                )}

                {!loading && !error && (
                    <div className="w-full flex flex-col gap-y-4 md:flex-row md:gap-x-4 items-stretch">
                        {plans.map((plan) => {
                            const isPopular = plan.tier === 'GROWTH';
                            const enabledFeatures = (Object.keys(plan.features) as Array<keyof PlanFeatures>)
                                .filter((key) => plan.features[key])
                                .slice(0, 5);

                            return (
                                <div
                                    key={plan.id}
                                    className={`flex-1 flex flex-col gap-y-4 p-6 rounded-2xl border ${
                                        isPopular
                                            ? 'border-[color:var(--color-main)] bg-[color:var(--color-white)]'
                                            : 'border-[color:var(--color-icons-border)] bg-[color:var(--color-white)]'
                                    }`}
                                >
                                    {isPopular && (
                                        <span className="self-start text-xs font-bold px-3 py-1 rounded-full bg-[color:var(--color-main)] text-white">
                                            Most Popular
                                        </span>
                                    )}
                                    <MediumHeaderTextBold>{plan.displayName}</MediumHeaderTextBold>
                                    <p className="text-3xl font-black text-[color:var(--color-dark)]">
                                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                                        {plan.price > 0 && (
                                            <span className="text-sm font-normal text-[color:var(--color-icons)]">/mo</span>
                                        )}
                                    </p>
                                    <SmallBodyText>{plan.description}</SmallBodyText>
                                    <ul className="flex flex-col gap-y-2 flex-1">
                                        {enabledFeatures.map((key) => (
                                            <li key={key} className="flex items-center gap-x-2">
                                                <span className="text-[color:var(--color-main)] font-bold">✓</span>
                                                <SmallBodyText>{FEATURE_LABELS[key]}</SmallBodyText>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href={signupUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`mt-auto text-center px-4 py-3 rounded-3xl font-semibold text-sm transition-opacity hover:opacity-90 ${
                                            isPopular
                                                ? 'bg-[color:var(--color-main)] text-white'
                                                : 'bg-[color:var(--color-dark)] text-[color:var(--color-text)]'
                                        }`}
                                    >
                                        Get Started
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageSection>
    );
};

export default PricingSection;
