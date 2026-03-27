import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL } from "../utilities";

/**
 * App Subscriptions Update Webhook Handler
 * Handles subscription status changes from Shopify (ACCEPTED, ACTIVE, CANCELLED, EXPIRED, FROZEN)
 * Syncs status with Nudgenest backend.
 *
 * Shopify sends:
 *   ACCEPTED  — charge approved by merchant (fires immediately after approval)
 *   ACTIVE    — charge activated / recurring billing confirmed
 *   CANCELLED — subscription cancelled
 *   EXPIRED   — subscription expired
 *   FROZEN    — store paused
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  try {
    const subscription = payload.app_subscription;

    if (!subscription) {
      console.error("No subscription data in webhook payload");
      return new Response("No subscription data", { status: 400 });
    }

    const {
      admin_graphql_api_id: shopifyChargeId,
      name: planName,
      status: rawStatus,
      billing_on,
      current_period_end,
    } = subscription;

    const status = rawStatus.toUpperCase();

    // DECLINED — merchant cancelled an upgrade attempt, existing subscription unchanged.
    // CANCELLED — Shopify fires this for BOTH explicit cancellation AND auto-cancel when
    //   upgrading/downgrading. We cannot safely distinguish them here, so we ignore it:
    //   - FREE downgrades are handled explicitly in api.billing.request.ts
    //   - Upgrade/downgrade: the new plan's ACCEPTED webhook handles the sync
    // Only EXPIRED should trigger a FREE downgrade (plan legitimately ended, no replacement).
    if (status === "DECLINED" || status === "CANCELLED") {
      console.log(`[billing] ${status} for shop ${shop} — no action taken`);
      return new Response(`${status} — no action taken`, { status: 200 });
    }

    // Map Shopify plan name → our tier
    const planTierMap: Record<string, string> = {
      "Starter Plan": "STARTER",
      "Growth Plan": "GROWTH",
      "Pro Plan": "PRO",
    };

    const planTier = planTierMap[planName] || "FREE";
    const isActive = status === "ACTIVE" || status === "ACCEPTED";

    // Sync with Nudgenest backend
    try {
      const merchantId = shop.replace(".myshopify.com", "");

      const syncPayload = {
        merchantId,
        shopId: shop,
        planTier: isActive ? planTier : "FREE", // EXPIRED → FREE
        shopifyChargeId: shopifyChargeId.toString(),
        status,
        currentPeriodEnd: current_period_end,
        billingOn: billing_on,
        webhookTopic: topic,
      };

      const syncResponse = await fetch(`${BASE_URL}/billing/sync-shopify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      });

      if (!syncResponse.ok) {
        const errorText = await syncResponse.text();
        console.error("Failed to sync with backend:", syncResponse.status, errorText);
      }
    } catch (error) {
      console.error("Error syncing with backend:", error);
      // Don't fail the webhook if backend sync fails
    }

    return new Response("Webhook processed successfully", { status: 200 });

  } catch (error: any) {
    console.error("❌ Error processing subscription webhook:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};
