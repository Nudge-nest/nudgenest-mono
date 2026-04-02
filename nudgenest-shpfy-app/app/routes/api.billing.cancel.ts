import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL, fetchWithErrorHandling } from "../utilities";

// Define plan names as const for type safety
// ENTERPRISE plan removed per user request
const PLAN_NAMES = {
  STARTER: "Starter Plan",
  GROWTH: "Growth Plan",
  PRO: "Pro Plan",
} as const;

type PlanName = typeof PLAN_NAMES[keyof typeof PLAN_NAMES];

/**
 * Billing Cancellation Handler
 * Cancels a Shopify subscription and downgrades merchant to FREE plan
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Get current subscriptions
    const { appSubscriptions } = await billing.check({
      plans: Object.values(PLAN_NAMES) as PlanName[],
      isTest: process.env.NODE_ENV !== "production",
    });

    if (appSubscriptions.length === 0) {
      return json({
        success: true,
        message: "No active subscriptions to cancel"
      });
    }

    // Cancel all active subscriptions
    for (const subscription of appSubscriptions) {
      try {
        await billing.cancel({
          subscriptionId: subscription.id,
          isTest: process.env.NODE_ENV !== "production",
          prorate: true,
        });
      } catch (error) {
        console.error(`Error cancelling subscription ${subscription.id}:`, error);
        // Continue with other subscriptions even if one fails
      }
    }

    // Sync with Nudgenest backend - downgrade to FREE
    try {
      const merchantId = session.shop.replace(".myshopify.com", "");

      await fetchWithErrorHandling(`${BASE_URL}/billing/sync-shopify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          shopId: session.shop,
          planTier: "FREE",
          status: "CANCELLED",
        }),
      });
    } catch (error) {
      console.error("Error syncing cancellation with backend:", error);
      // Don't fail the entire flow if backend sync fails
    }

    return json({
      success: true,
      message: "Subscription cancelled successfully. Downgraded to FREE plan.",
      planTier: "FREE"
    });

  } catch (error: any) {
    console.error("Billing cancellation error:", error);
    return json(
      {
        error: "Failed to cancel billing subscription",
        details: error.message
      },
      { status: 500 }
    );
  }
};
