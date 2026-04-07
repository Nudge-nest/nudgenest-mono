import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL, fetchWithErrorHandling } from "../utilities";

// ENTERPRISE plan removed per user request
const PLAN_NAMES = {
  STARTER: "Starter Plan",
  GROWTH: "Growth Plan",
  PRO: "Pro Plan",
} as const;

// Must match shopify.server.ts billing config
const PLAN_PRICING: Record<string, number> = {
  "Starter Plan": 4.99,
  "Growth Plan": 12.99,
  "Pro Plan": 29.99,
};

type PlanName = typeof PLAN_NAMES[keyof typeof PLAN_NAMES];
type PlanTierKey = keyof typeof PLAN_NAMES;

export const action = async ({ request }: ActionFunctionArgs) => {
  let billing: any, session: any, admin: any;
  try {
    ({ billing, session, admin } = await authenticate.admin(request));
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
      // Shopify already has this plan active — sync backend in case it's stale
      try {
        const merchantId = session.shop.replace(".myshopify.com", "");
        await fetchWithErrorHandling(`${BASE_URL}/billing/sync-shopify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId,
            shopId: session.shop,
            planTier,
            status: "ACTIVE",
          }),
        });
      } catch (syncErr) {
        console.error("Backend sync for alreadyOnPlan failed:", syncErr);
      }
      return json({ success: true, alreadyOnPlan: true, planTier });
    }

    // Do NOT cancel the existing subscription here — Shopify cancels it automatically
    // when the merchant approves the new charge. Cancelling eagerly means a decline
    // leaves the merchant on FREE instead of their current paid plan.

    // Derive app base URL from the incoming request rather than SHOPIFY_APP_URL env var.
    const appBaseUrl = new URL(request.url).origin;
    const returnUrl = `${appBaseUrl}/api/billing/callback?plan=${planTier}&shop=${session.shop}`;
    const isTest = process.env.NODE_ENV !== "production";
    const price = PLAN_PRICING[planName];

    // Use appSubscriptionCreate GraphQL mutation directly instead of billing.request().
    // billing.request() always throws a 401 to trigger App Bridge's redirect mechanism,
    // but Remix strips custom headers from thrown Responses (remix-run/remix#5356),
    // so App Bridge never receives the billing URL. Calling the mutation directly
    // returns the confirmationUrl as plain JSON which the client navigates to directly.
    const gqlResponse = await admin.graphql(
      `#graphql
      mutation AppSubscriptionCreate(
        $name: String!
        $lineItems: [AppSubscriptionLineItemInput!]!
        $returnUrl: URL!
        $test: Boolean
      ) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
          appSubscription {
            id
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          name: planName,
          returnUrl,
          test: isTest,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: price, currencyCode: "USD" },
                  interval: "EVERY_30_DAYS",
                },
              },
            },
          ],
        },
      }
    );

    const gqlData = await gqlResponse.json();
    const userErrors = gqlData.data?.appSubscriptionCreate?.userErrors;
    if (userErrors?.length > 0) {
      console.error("Billing GraphQL userErrors:", userErrors);
      return json({ error: userErrors[0].message }, { status: 400 });
    }

    const confirmationUrl = gqlData.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
      console.error("No confirmationUrl in billing GraphQL response:", JSON.stringify(gqlData));
      return json({ error: "Failed to create billing charge — no confirmation URL" }, { status: 500 });
    }

    return json({ confirmationUrl, planTier });

  } catch (error: any) {
    if (error instanceof Response) throw error;
    console.error("Unexpected billing error:", error?.message);
    return json({ error: "Failed to create billing charge", details: error.message }, { status: 500 });
  }
};
