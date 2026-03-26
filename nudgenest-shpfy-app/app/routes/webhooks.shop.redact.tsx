import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL } from "../utilities";

/**
 * GDPR Mandatory Webhook: shop/redact
 *
 * Shopify sends this 48 hours after a merchant uninstalls the app.
 * The app must delete all data stored for that shop (reviews, configs,
 * merchant record, subscriptions).
 *
 * Required for Shopify App Store submission.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);

  try {
    // Forward to backend which will delete all data for this shop from MongoDB
    const response = await fetch(`${BASE_URL}/gdpr/shop/redact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, topic, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GDPR] Backend error for shop/redact: ${response.status} ${errorText}`);
    } else {
      console.log(`[GDPR] shop/redact processed for shop: ${shop}`);
    }
  } catch (error: any) {
    console.error(`[GDPR] Failed to forward shop/redact to backend: ${error.message}`);
  }

  return new Response("Shop data redaction processed", { status: 200 });
};
