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
  /** Ordered list of feature strings to display on this plan card. */
  features: string[];
}

interface PlanSelectorProps {
  plans?: DatabasePlan[] | null;
  currentPlanTier?: string;
  currentPeriodEnd?: string;
  onSelectPlan: (planId: string, planTier: string) => void;
}

/**
 * Build the feature list for a plan card.
 *
 * Only features that are FULLY BUILT and working are shown here:
 *   - Email review requests        ✅ built (Resend + EJS)
 *   - Auto reminders               ✅ built (daily scheduler, all plans)
 *   - Custom email templates       ✅ built (subject / body / button overrides)
 *   - QR code                      ✅ built (auto-generated, downloadable)
 *   - Review analytics             ✅ built (total, avg rating, response rate)
 *   - Review volume limit          ✅ enforced via usage tracking
 *
 * Features intentionally NOT listed (flag only, not implemented):
 *   SMS requests, review incentives, bulk import, advanced analytics,
 *   API access, white-label, priority/dedicated support.
 */
const convertToDisplayPlan = (dbPlan: DatabasePlan): DisplayPlan => {
  const features: string[] = [];

  // 1. Review request volume — always first, anchors the value proposition
  if (dbPlan.limits.reviewRequestsPerMonth === -1) {
    features.push('Unlimited review requests/month');
  } else {
    features.push(`${dbPlan.limits.reviewRequestsPerMonth.toLocaleString()} review requests/month`);
  }

  // 2. Email review requests — built on all plans
  features.push('Email review requests');

  // 3. Auto reminders — scheduler is built and works on all plans
  features.push('Automated review reminders');

  // 4. Custom email templates — built, gated on plan feature flag
  if (dbPlan.features.customEmailTemplates) {
    features.push('Custom email templates');
  }

  // 5. QR code — built (ReviewQrCodeComponent + merchant endpoint)
  features.push('QR code for in-store reviews');

  // 6. Review analytics — basic stats endpoint built on all plans
  features.push('Review analytics & stats');

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

/**
 * Fallback plan data — mirrors DB values exactly.
 * Used only when the API fetch fails.
 */
const FALLBACK_PLANS: DisplayPlan[] = [
  {
    id: '1',
    name: 'free',
    displayName: 'Free',
    tier: 'FREE',
    price: 0,
    billingInterval: 'MONTHLY',
    description: '25 review requests/month',
    features: [
      '25 review requests/month',
      'Email review requests',
      'Automated review reminders',
      'QR code for in-store reviews',
      'Review analytics & stats',
    ],
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
      '300 review requests/month',
      'Email review requests',
      'Automated review reminders',
      'Custom email templates',
      'QR code for in-store reviews',
      'Review analytics & stats',
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
      '1,000 review requests/month',
      'Email review requests',
      'Automated review reminders',
      'Custom email templates',
      'QR code for in-store reviews',
      'Review analytics & stats',
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
      '5,000 review requests/month',
      'Email review requests',
      'Automated review reminders',
      'Custom email templates',
      'QR code for in-store reviews',
      'Review analytics & stats',
    ],
  },
];

export function PlanSelector({
  plans,
  currentPlanTier,
  currentPeriodEnd,
  onSelectPlan,
}: PlanSelectorProps) {
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
              flex-column + flex:1 on the feature list ensures the Divider and
              "Select Plan" button are always pinned to the bottom of every card
              at the same level, regardless of how many feature rows exist.
            */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* ── Header ──────────────────────────────────────────── */}
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

              {/* ── Features (grows to fill remaining height) ────────── */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features.map((feature, index) => (
                    <InlineStack key={index} gap="200" blockAlign="start">
                      <Text variant="bodySm" as="span" tone="success">
                        ✓
                      </Text>
                      <Text variant="bodySm" as="p">
                        {feature}
                      </Text>
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
                  {isCurrent
                    ? 'Current Plan'
                    : plan.tier === 'FREE'
                    ? 'Downgrade to Free'
                    : 'Select Plan'}
                </Button>
              </div>

            </div>
          </Box>
        );
      })}
    </InlineGrid>
  );
}
