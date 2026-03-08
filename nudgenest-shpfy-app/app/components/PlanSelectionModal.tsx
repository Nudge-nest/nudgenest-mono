import { Modal, BlockStack, RadioButton, Text, Button, InlineStack, Box, Divider } from "@shopify/polaris";
import { useState } from "react";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  tier: string;
  price: number;
  billingInterval: string;
  description: string;
  features: string[];
}

interface PlanSelectionModalProps {
  active: boolean;
  onClose: () => void;
  currentPlanTier?: string;
  onSelectPlan: (planId: string) => void;
}

// Mock plans - in production, fetch these from your API
const AVAILABLE_PLANS: Plan[] = [
  {
    id: '1',
    name: 'free',
    displayName: 'Free Plan',
    tier: 'FREE',
    price: 0,
    billingInterval: 'MONTHLY',
    description: 'Perfect for getting started',
    features: [
      '50 review requests/month',
      '100 emails/month',
      'Basic email templates',
      'Email support'
    ]
  },
  {
    id: '2',
    name: 'starter',
    displayName: 'Starter Plan',
    tier: 'STARTER',
    price: 19.99,
    billingInterval: 'MONTHLY',
    description: 'Great for small businesses',
    features: [
      '500 review requests/month',
      '1,000 emails/month',
      'Custom email templates',
      'Auto reminders',
      'Priority email support'
    ]
  },
  {
    id: '3',
    name: 'growth',
    displayName: 'Growth Plan',
    tier: 'GROWTH',
    price: 49.99,
    billingInterval: 'MONTHLY',
    description: 'For growing businesses',
    features: [
      '2,000 review requests/month',
      '5,000 emails/month',
      'Custom email templates',
      'Auto reminders',
      'Review incentives',
      'Advanced analytics',
      'API access',
      'Priority support'
    ]
  },
  {
    id: '4',
    name: 'pro',
    displayName: 'Pro Plan',
    tier: 'PRO',
    price: 99.99,
    billingInterval: 'MONTHLY',
    description: 'For established businesses',
    features: [
      'Unlimited review requests',
      'Unlimited emails',
      'Custom email templates',
      'Auto reminders',
      'Review incentives',
      'Advanced analytics',
      'API access',
      'White label',
      'Dedicated support'
    ]
  }
];

export function PlanSelectionModal({ active, onClose, currentPlanTier, onSelectPlan }: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlanTier || 'FREE');

  const handleConfirm = () => {
    const plan = AVAILABLE_PLANS.find(p => p.tier === selectedPlan);
    if (plan) {
      onSelectPlan(plan.id);
    }
    onClose();
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}/month`;
  };

  return (
    <Modal
      open={active}
      onClose={onClose}
      title="Choose Your Plan"
      primaryAction={{
        content: 'Confirm Selection',
        onAction: handleConfirm,
        disabled: selectedPlan === currentPlanTier
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text variant="bodyMd" as="p" tone="subdued">
            Select a plan that best fits your business needs. You can change your plan anytime.
          </Text>

          <BlockStack gap="300">
            {AVAILABLE_PLANS.map((plan) => (
              <Box
                key={plan.tier}
                padding="400"
                background={selectedPlan === plan.tier ? 'bg-surface-selected' : 'bg-surface-secondary'}
                borderRadius="200"
                borderWidth="025"
                borderColor={selectedPlan === plan.tier ? 'border-brand' : 'border'}
              >
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                      <InlineStack gap="200" blockAlign="center">
                        <RadioButton
                          label=""
                          checked={selectedPlan === plan.tier}
                          id={plan.tier}
                          name="plan"
                          onChange={() => setSelectedPlan(plan.tier)}
                        />
                        <BlockStack gap="050">
                          <Text variant="headingSm" as="h3" fontWeight="semibold">
                            {plan.displayName}
                            {currentPlanTier === plan.tier && (
                              <Text variant="bodySm" as="span" tone="success"> (Current)</Text>
                            )}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            {plan.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>

                    <Text variant="headingMd" as="p" fontWeight="bold">
                      {formatPrice(plan.price)}
                    </Text>
                  </InlineStack>

                  {selectedPlan === plan.tier && (
                    <>
                      <Divider />
                      <BlockStack gap="200">
                        <Text variant="headingXs" as="h4" fontWeight="semibold">
                          Features included:
                        </Text>
                        <BlockStack gap="100">
                          {plan.features.map((feature, index) => (
                            <Text key={index} variant="bodySm" as="p">
                              ✓ {feature}
                            </Text>
                          ))}
                        </BlockStack>
                      </BlockStack>
                    </>
                  )}
                </BlockStack>
              </Box>
            ))}
          </BlockStack>

          {selectedPlan !== currentPlanTier && (
            <Box
              padding="400"
              background="bg-fill-info"
              borderRadius="200"
            >
              <Text variant="bodySm" as="p">
                {selectedPlan > (currentPlanTier || 'FREE')
                  ? '⬆️ Upgrading your plan will give you immediate access to all new features.'
                  : '⬇️ Downgrading will take effect at the end of your current billing period.'}
              </Text>
            </Box>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
