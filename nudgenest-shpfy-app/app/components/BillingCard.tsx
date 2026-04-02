import { Card, BlockStack, InlineStack, Text, Badge, ProgressBar, Box, Divider } from "@shopify/polaris";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { PlanSelector } from "./PlanSelector";
import type { Plan } from "../utilities";

interface SimplifiedPlan {
  id: string;
  name: string;
  displayName: string;
  tier: string;
  price: number;
  billingInterval: string;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  Plans: SimplifiedPlan;
}

interface UsageStats {
  REVIEW_REQUEST?: number;
  EMAIL_SENT?: number;
  API_CALL?: number;
}

interface PlanLimits {
  reviewRequestsPerMonth: number;
  emailsPerMonth: number;
  apiCallsPerDay: number;
}

interface BillingCardProps {
  subscription?: Subscription | null;
  usage?: UsageStats;
  limits?: PlanLimits;
  allPlans?: Plan[] | null;
  onUpgrade?: () => void;
  onManagePlan?: () => void;
}

export function BillingCard({ subscription, usage, limits, allPlans, onUpgrade, onManagePlan }: BillingCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const shopify = useAppBridge();

  const handleSelectPlan = async (planId: string, planTier: string) => {
    setIsProcessing(true);
    try {
      const token = await shopify.idToken();
      const response = await fetch("/api/billing/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ planTier }),
      });

      if (!response.ok) {
        console.error("Billing request failed:", response.status, await response.text().catch(() => ""));
        setIsProcessing(false);
        return;
      }

      const data = await response.json();

      // Paid plan upgrade — navigate top frame to Shopify billing approval page
      if (data.confirmationUrl) {
        try {
          window.top!.location.href = data.confirmationUrl;
        } catch (_navErr) {
          window.location.href = data.confirmationUrl;
        }
        return;
      }

      // FREE downgrade — server handled it synchronously
      if (data.downgraded || planTier === "FREE") {
        document.cookie = `nudgenest_billing_status=${encodeURIComponent("success:FREE")}; path=/; max-age=120; SameSite=None; Secure`;
        window.location.reload();
        return;
      }

      // Already on this plan (backend synced) — reload to reflect current state
      setIsProcessing(false);
      window.location.reload();
    } catch (e: any) {
      console.error("Billing request error:", e);
      setIsProcessing(false);
    }
  };

  // Calculate usage percentages
  const reviewUsagePercent = limits?.reviewRequestsPerMonth && limits.reviewRequestsPerMonth > 0
    ? Math.min(((usage?.REVIEW_REQUEST || 0) / limits.reviewRequestsPerMonth) * 100, 100)
    : 0;

  const emailUsagePercent = limits?.emailsPerMonth && limits.emailsPerMonth > 0
    ? Math.min(((usage?.EMAIL_SENT || 0) / limits.emailsPerMonth) * 100, 100)
    : 0;

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge tone="success">Active</Badge>;
      case 'TRIALING':
        return <Badge tone="info">Trial</Badge>;
      case 'PAST_DUE':
        return <Badge tone="warning">Past Due</Badge>;
      case 'CANCELED':
        return <Badge tone="critical">Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="headingMd" as="h3">
            Billing & Usage
          </Text>
          {subscription && getStatusBadge(subscription.status)}
        </InlineStack>

        {/* Processing Message */}
        {isProcessing && (
          <Box padding="400" background="bg-fill-info" borderRadius="200">
            <Text variant="bodySm" as="p">
              Processing your billing request... You will be redirected to approve the charge.
            </Text>
          </Box>
        )}

        {/* Plan Selector - always visible */}
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3" fontWeight="semibold">
            {subscription ? 'Change Your Plan' : 'Choose a Plan'}
          </Text>
          <PlanSelector
            plans={allPlans}
            currentPlanTier={subscription?.Plans.tier}
            currentPeriodEnd={subscription?.currentPeriodEnd}
            onSelectPlan={handleSelectPlan}
          />
        </BlockStack>

        {subscription && usage && limits && (
          <>
            <Divider />
            <BlockStack gap="300">
              <Text variant="headingSm" as="h4" fontWeight="semibold">
                Current Usage
              </Text>

              {/* Review Requests */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="bodySm" as="span">
                    Review Requests
                  </Text>
                  <Text variant="bodySm" as="span" tone="subdued">
                    {usage.REVIEW_REQUEST || 0} / {limits.reviewRequestsPerMonth === -1 ? '∞' : limits.reviewRequestsPerMonth}
                  </Text>
                </InlineStack>
                {limits.reviewRequestsPerMonth > 0 && (
                  <ProgressBar
                    progress={reviewUsagePercent}
                    size="small"
                    tone={reviewUsagePercent > 90 ? 'critical' : reviewUsagePercent > 75 ? 'attention' : 'success'}
                  />
                )}
              </BlockStack>

              {/* Emails Sent */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text variant="bodySm" as="span">
                    Emails Sent
                  </Text>
                  <Text variant="bodySm" as="span" tone="subdued">
                    {usage.EMAIL_SENT || 0} / {limits.emailsPerMonth === -1 ? '∞' : limits.emailsPerMonth}
                  </Text>
                </InlineStack>
                {limits.emailsPerMonth > 0 && (
                  <ProgressBar
                    progress={emailUsagePercent}
                    size="small"
                    tone={emailUsagePercent > 90 ? 'critical' : emailUsagePercent > 75 ? 'attention' : 'success'}
                  />
                )}
              </BlockStack>

              {/* API Calls */}
              {limits.apiCallsPerDay > 0 && (
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodySm" as="span">
                      API Calls (Today)
                    </Text>
                    <Text variant="bodySm" as="span" tone="subdued">
                      {usage.API_CALL || 0} / {limits.apiCallsPerDay}
                    </Text>
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </>
        )}
      </BlockStack>
    </Card>
  );
}
