import { InlineGrid, Box, Text, Button, Badge, Divider, InlineStack } from "@shopify/polaris";
import type { Plan as DatabasePlan } from "../utilities";

interface DisplayPlan {
  id: string;
  name: string;
  displayName: string;
  tier: string;
  price: number;
  billingInterval: string;
  description: string;
  features: string[];
}

interface PlanSelectorProps {
  plans?: DatabasePlan[] | null;
  currentPlanTier?: string;
  currentPeriodEnd?: string;
  onSelectPlan: (planId: string, planTier: string) => void;
}

/**
 * Build a feature list that accurately matches what is stored in the DB.
 * Every plan shows the same set of feature rows so cards stay the same height
 * regardless of how many features a plan has. Features the plan doesn't have
 * are rendered as "dimmed" (not ticked).
 */
const ALL_FEATURES: { key: string; label: (plan: DatabasePlan) => string | null }[] = [
  {
    key: 'reviewRequests',
    label: (p) =>
      p.limits.reviewRequestsPerMonth === -1
        ? 'Unlimited review requests/mo'
        : `${p.limits.reviewRequestsPerMonth.toLocaleString()} review requests/mo`,
  },
  {
    key: 'emailReviewRequests',
    label: (p) => (p.features.emailReviewRequests ? 'Email review requests' : null),
  },
  {
    key: 'smsReviewRequests',
    label: (p) => (p.features.smsReviewRequests ? 'SMS review requests' : null),
  },
  {
    key: 'autoReminders',
    label: (p) => (p.features.autoReminders ? 'Automated reminders' : null),
  },
  {
    key: 'customEmailTemplates',
    label: (p) => (p.features.customEmailTemplates ? 'Custom email templates' : null),
  },
  {
    key: 'reviewIncentives',
    label: (p) => (p.features.reviewIncentives ? 'Review incentives' : null),
  },
  {
    key: 'bulkImport',
    label: (p) => (p.features.bulkImport ? 'Bulk review import' : null),
  },
  {
    key: 'advancedAnalytics',
    label: (p) => (p.features.advancedAnalytics ? 'Advanced analytics' : null),
  },
  {
    key: 'apiAccess',
    label: (p) => (p.features.apiAccess ? 'API access' : null),
  },
  {
    key: 'whiteLabel',
    label: (p) => (p.features.whiteLabel ? 'White-label (remove branding)' : null),
  },
  {
    key: 'prioritySupport',
    label: (p) => (p.features.prioritySupport ? 'Priority support' : null),
  },
  {
    key: 'dedicatedAccountManager',
    label: (p) => (p.features.dedicatedAccountManager ? 'Dedicated account manager' : null),
  },
];

const convertToDisplayPlan = (dbPlan: DatabasePlan): DisplayPlan => {
  // Only include features that this plan actually has (non-null labels)
  const features: string[] = ALL_FEATURES
    .map((f) => f.label(dbPlan))
    .filter((label): label is string => label !== null);

  return {
    id: dbPlan.id,
    name: dbPlan.name,
    displayName: dbPlan.displayName,
    tier: dbPlan.tier,
    price: dbPlan.price,
    billingInterval: dbPlan.billingInterval,
    description: dbPlan.description,
    features,
  };
};

// Fallback plans — mirrors DB values exactly (used only if API fetch fails)
const FALLBACK_PLANS: DisplayPlan[] = [
  {
    id: '1',
    name: 'free',
    displayName: 'Free',
    tier: 'FREE',
    price: 0,
    billingInterval: 'MONTHLY',
    description: '25 review requests/month',
    features: ['25 review requests/mo', 'Email review requests'],
  },
  {
    id: '2',
    name: 'starter',
    displayName: 'Starter',
    tier: 'STARTER',
    price: 4.99,
    billingInterval: 'MONTHLY',
    description: '300 review requests/month',
    features: [
      '300 review requests/mo',
      'Email review requests',
      'SMS review requests',
      'Automated reminders',
      'Custom email templates',
    ],
  },
  {
    id: '3',
    name: 'growth',
    displayName: 'Growth',
    tier: 'GROWTH',
    price: 12.99,
    billingInterval: 'MONTHLY',
    description: '1,000 review requests/month',
    features: [
      '1,000 review requests/mo',
      'Email review requests',
      'SMS review requests',
      'Automated reminders',
      'Custom email templates',
      'Review incentives',
      'Bulk review import',
      'Advanced analytics',
      'API access',
    ],
  },
  {
    id: '4',
    name: 'pro',
    displayName: 'Pro',
    tier: 'PRO',
    price: 29.99,
    billingInterval: 'MONTHLY',
    description: '5,000 review requests/month',
    features: [
      '5,000 review requests/mo',
      'Email review requests',
      'SMS review requests',
      'Automated reminders',
      'Custom email templates',
      'Review incentives',
      'Bulk review import',
      'Advanced analytics',
      'API access',
      'White-label (remove branding)',
      'Priority support',
    ],
  },
];

export function PlanSelector({ plans, currentPlanTier, currentPeriodEnd, onSelectPlan }: PlanSelectorProps) {
  const displayPlans: DisplayPlan[] =
    plans && plans.length > 0 ? plans.map(convertToDisplayPlan) : FALLBACK_PLANS;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const isCurrentPlan = (tier: string) => tier === currentPlanTier;

  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
      {displayPlans.map((plan) => {
        const isCurrent = isCurrentPlan(plan.tier);

        return (
          <Box
            key={plan.tier}
            padding="0"
            borderRadius="300"
            borderWidth="025"
            borderColor={isCurrent ? 'border-brand' : 'border'}
            background={isCurrent ? 'bg-surface-selected' : 'bg-surface'}
            shadow={isCurrent ? '200' : '100'}
          >
            {/*
              Use a flex column so the features section stretches and the
              "Select Plan" button always sits at the bottom of every card,
              regardless of how many feature rows the plan has.
            */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* ── Header ────────────────────────────────────────────── */}
              <Box
                padding="400"
                background={isCurrent ? 'bg-fill-brand-active' : 'bg-surface-secondary'}
                borderRadius="300"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <InlineStack align="space-between" blockAlign="start">
                    <Text variant="headingMd" as="h3" fontWeight="bold">
                      {plan.displayName}
                    </Text>
                    {isCurrent && <Badge tone="success">Current</Badge>}
                  </InlineStack>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text variant="bodySm" as="span" tone="subdued">
                        /mo
                      </Text>
                    )}
                  </div>

                  <Text variant="bodySm" as="p" tone="subdued">
                    {plan.description}
                  </Text>

                  {isCurrent && currentPeriodEnd && (
                    <Text variant="bodySm" as="p" tone="subdued">
                      Renews {formatDate(currentPeriodEnd)}
                    </Text>
                  )}
                </div>
              </Box>

              {/* ── Features (grows to fill remaining height) ─────────── */}
              <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features.map((feature, index) => (
                    <InlineStack key={index} gap="200" blockAlign="start">
                      <Text variant="bodySm" as="span" tone="success">✓</Text>
                      <Text variant="bodySm" as="p">{feature}</Text>
                    </InlineStack>
                  ))}
                </div>

                <Divider />

                {/* ── Button — always at the bottom ─────────────────── */}
                <Button
                  variant={isCurrent ? 'secondary' : 'primary'}
                  size="large"
                  fullWidth
                  disabled={isCurrent}
                  onClick={() => onSelectPlan(plan.id, plan.tier)}
                >
                  {isCurrent ? 'Current Plan' : plan.tier === 'FREE' ? 'Downgrade to Free' : 'Select Plan'}
                </Button>
              </div>

            </div>
          </Box>
        );
      })}
    </InlineGrid>
  );
}
