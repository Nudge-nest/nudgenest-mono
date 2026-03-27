import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL, fetchWithErrorHandling } from "../utilities";

// ENTERPRISE plan removed per user request
const PLAN_NAMES = {
  STARTER: "Starter Plan",
  GROWTH: "Growth Plan",
  PRO: "Pro Plan",
} as const;

type PlanName = typeof PLAN_NAMES[keyof typeof PLAN_NAMES];
type PlanTierKey = keyof typeof PLAN_NAMES;

export const action = async ({ request }: ActionFunctionArgs) => {
  let billing: any, session: any;
  try {
    ({ billing, session } = await authenticate.admin(request));
  } catch (authErr: any) {
    throw authErr; // let the SDK handle it (redirect to login etc)
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { planTier } = body;

    if (planTier === "FREE") {
      // Get all active Shopify subscriptions and cancel them
      const allPlanNames = Object.values(PLAN_NAMES) as PlanName[];
      const { appSubscriptions } = await billing.check({
        plans: allPlanNames,
        isTest: process.env.NODE_ENV !== "production",
      });

      for (const sub of appSubscriptions) {
        try {
          await billing.cancel({
            subscriptionId: sub.id,
            isTest: process.env.NODE_ENV !== "production",
            prorate: true,
          });
        } catch (cancelErr) {
          console.error("Error cancelling Shopify subscription:", cancelErr);
        }
      }

      // Sync downgrade to backend
      try {
        const merchantId = session.shop.replace(".myshopify.com", "");
        await fetchWithErrorHandling(`${BASE_URL}/billing/sync-shopify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId,
            shopId: session.shop,
            planTier: "FREE",
            status: "CANCELLED",
          }),
        });
      } catch (syncErr) {
        console.error("Backend sync for FREE downgrade failed:", syncErr);
        // Don't fail — backend will catch up via webhook
      }

      return json({ success: true, planTier: "FREE", downgraded: true });
    }

    const planName = PLAN_NAMES[planTier as PlanTierKey];
    if (!planName) {
      return json({ error: "Invalid plan tier" }, { status: 400 });
    }

    const allPlanNames = Object.values(PLAN_NAMES) as PlanName[];
    const { appSubscriptions } = await billing.check({
      plans: allPlanNames,
      isTest: process.env.NODE_ENV !== "production",
    });

    const alreadyOnPlan = appSubscriptions.find((s: any) => s.name === planName);
    if (alreadyOnPlan) {
      return json({ success: true, message: "Already subscribed to this plan", planTier });
    }

    // Do NOT cancel the existing subscription here — Shopify cancels it automatically
    // when the merchant approves the new charge. Cancelling eagerly means a decline
    // leaves the merchant on FREE instead of their current paid plan.

    const returnUrl = `${process.env.SHOPIFY_APP_URL}/api/billing/callback?plan=${planTier}&shop=${session.shop}`;

    let billingResponse: any;
    try {
      billingResponse = await billing.request({
        plan: planName,
        isTest: process.env.NODE_ENV !== "production",
        returnUrl,
      });
      return json({ success: true, confirmationUrl: billingResponse?.confirmationUrl, planTier });
    } catch (billingErr: any) {
      throw billingErr; // re-throw so SDK/Remix handles the redirect
    }

  } catch (error: any) {
    // Only catches non-billing errors (body parse, plan lookup etc)
    if (error instanceof Response) throw error; // let redirect responses through
    console.error("Unexpected billing error:", error?.message);
    return json({ error: "Failed to create billing charge", details: error.message }, { status: 500 });
  }
};
