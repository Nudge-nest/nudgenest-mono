import { LoaderFunctionArgs, redirect } from "@remix-run/node";

/**
 * Billing Callback Handler
 * Shopify redirects here (top-level, non-embedded) after merchant approves or
 * declines a billing charge.
 *
 * We CANNOT call authenticate.admin() here because this is a top-level redirect
 * outside the embedded app context — there is no session token in the request.
 *
 * The correct pattern is to redirect to the Shopify Admin URL for the embedded
 * app, which loads the Shopify Admin and re-embeds the app in an iframe.
 * Once embedded, authenticate.admin() succeeds via token exchange
 * (unstable_newEmbeddedAuthStrategy: true).
 *
 * Billing status is passed to the dashboard via a short-lived cookie because
 * Shopify Admin does NOT forward extra query params from the admin URL to the
 * embedded app iframe URL.
 *
 * The APP_SUBSCRIPTIONS_UPDATE webhook handles syncing the subscription with
 * the backend — we only need to navigate back here.
 *
 * Shopify Admin embedded app URL format:
 *   https://admin.shopify.com/store/{shopName}/apps/{appHandle}
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const planTier = url.searchParams.get("plan");
  const chargeId = url.searchParams.get("charge_id");
  const shop = url.searchParams.get("shop"); // e.g. "nudgenest.myshopify.com"

  // Extract shop name (strip .myshopify.com suffix)
  const shopName = shop ? shop.replace(".myshopify.com", "") : null;

  if (!shopName) {
    // No shop param — fall back to SHOPIFY_APP_URL
    const appUrl = process.env.SHOPIFY_APP_URL;
    if (!appUrl) throw new Error("Missing required env var: SHOPIFY_APP_URL");
    return redirect(`${appUrl}/app`);
  }

  // The Shopify app handle — must match `handle` in shopify.app.toml
  const appHandle = "nudgenest";

  // Encode billing status for the cookie
  // Format: "success:GROWTH" | "declined" | "success"
  let billingStatus: string;
  if (!chargeId) {
    billingStatus = "declined";
  } else if (planTier) {
    billingStatus = `success:${planTier}`;
  } else {
    billingStatus = "success";
  }

  // Redirect to the Shopify Admin embedded app URL.
  // This navigates the top-level browser window to Shopify Admin, which then
  // re-embeds the app in an iframe. Authentication via token exchange works
  // once the app is embedded again.
  // SameSite=None; Secure is required for the cookie to be sent in the
  // cross-site embedded iframe context.
  const adminAppUrl = `https://admin.shopify.com/store/${shopName}/apps/${appHandle}`;

  return redirect(adminAppUrl, {
    headers: {
      "Set-Cookie": `nudgenest_billing_status=${encodeURIComponent(billingStatus)}; Path=/; Max-Age=120; SameSite=None; Secure`,
    },
  });
};
