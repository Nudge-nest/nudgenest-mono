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
  console.log("💳 [1] api.billing.request hit — method:", request.method);
  console.log("💳 [1] Authorization header present:", !!request.headers.get("authorization"));

  let billing: any, session: any;
  try {
    ({ billing, session } = await authenticate.admin(request));
    console.log("💳 [2] authenticate.admin succeeded — shop:", session.shop);
  } catch (authErr: any) {
    console.error("💳 [2] authenticate.admin THREW:", authErr?.constructor?.name, authErr?.message);
    console.error("💳 [2] If this is a Response, status:", authErr?.status);
    throw authErr; // let the SDK handle it (redirect to login etc)
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { planTier } = body;
    console.log(`💳 [3] planTier: ${planTier}`);

    if (planTier === "FREE") {
      console.log("💳 [3] FREE plan — cancelling any active Shopify subscriptions");

      // Get all active Shopify subscriptions and cancel them
      const allPlanNames = Object.values(PLAN_NAMES) as PlanName[];
      const { appSubscriptions } = await billing.check({
        plans: allPlanNames,
        isTest: process.env.NODE_ENV !== "production",
      });
      console.log(`💳 [3] Existing Shopify subscriptions:`, appSubscriptions.map((s: any) => `${s.name} (${s.id})`));

      for (const sub of appSubscriptions) {
        try {
          await billing.cancel({
            subscriptionId: sub.id,
            isTest: process.env.NODE_ENV !== "production",
            prorate: true,
          });
          console.log(`💳 [3] Cancelled Shopify subscription: ${sub.name} (${sub.id})`);
        } catch (cancelErr) {
          console.error("💳 [3] Error cancelling Shopify subscription:", cancelErr);
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
        console.log("💳 [3] Backend sync for FREE downgrade succeeded");
      } catch (syncErr) {
        console.error("💳 [3] Backend sync for FREE downgrade failed:", syncErr);
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
    console.log(`💳 [4] Existing subscriptions:`, appSubscriptions.map((s: any) => `${s.name} (${s.id})`));

    const alreadyOnPlan = appSubscriptions.find((s: any) => s.name === planName);
    if (alreadyOnPlan) {
      console.log("💳 [4] Already on this plan — returning early");
      return json({ success: true, message: "Already subscribed to this plan", planTier });
    }

    for (const sub of appSubscriptions) {
      try {
        await billing.cancel({
          subscriptionId: sub.id,
          isTest: process.env.NODE_ENV !== "production",
          prorate: true,
        });
        console.log(`💳 [5] Cancelled existing subscription: ${sub.name} (${sub.id})`);
      } catch (cancelErr) {
        console.error("💳 [5] Error cancelling subscription:", cancelErr);
      }
    }

    const returnUrl = `${process.env.SHOPIFY_APP_URL}/api/billing/callback?plan=${planTier}&shop=${session.shop}`;
    console.log("💳 [6] Calling billing.request() with returnUrl:", returnUrl);

    let billingResponse: any;
    try {
      billingResponse = await billing.request({
        plan: planName,
        isTest: process.env.NODE_ENV !== "production",
        returnUrl,
      });
      // If we somehow get here (SDK didn't throw), log what we got
      console.log("💳 [7] billing.request() RETURNED (did not throw):", JSON.stringify(billingResponse));
      return json({ success: true, confirmationUrl: billingResponse?.confirmationUrl, planTier });
    } catch (billingErr: any) {
      const isResponse = billingErr instanceof Response;
      console.log("💳 [7] billing.request() THREW — is Response:", isResponse);
      if (isResponse) {
        console.log("💳 [7] Response status:", billingErr.status);
        console.log("💳 [7] Response headers:", Object.fromEntries(billingErr.headers.entries()));
      } else {
        console.error("💳 [7] Non-Response error:", billingErr?.message);
      }
      throw billingErr; // re-throw so SDK/Remix handles the redirect
    }

  } catch (error: any) {
    // Only catches non-billing errors (body parse, plan lookup etc)
    if (error instanceof Response) throw error; // let redirect responses through
    console.error("💳 [ERR] Unexpected error:", error?.message);
    return json({ error: "Failed to create billing charge", details: error.message }, { status: 500 });
  }
};
