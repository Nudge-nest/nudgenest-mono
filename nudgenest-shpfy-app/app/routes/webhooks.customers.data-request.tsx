import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL } from "../utilities";

/**
 * GDPR Mandatory Webhook: customers/data_request
 *
 * Shopify sends this when a customer requests their data from a store.
 * The app must acknowledge and, within 30 days, provide the data to the merchant.
 *
 * Required for Shopify App Store submission.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);

  try {
    // Forward the request to the backend for logging and compliance tracking
    const response = await fetch(`${BASE_URL}/gdpr/customers/data-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, topic, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GDPR] Backend error for customers/data_request: ${response.status} ${errorText}`);
      // Still return 200 — Shopify requires acknowledgment regardless of backend state
    } else {
      console.log(`[GDPR] customers/data_request acknowledged for shop: ${shop}`);
    }
  } catch (error: any) {
    console.error(`[GDPR] Failed to forward customers/data_request to backend: ${error.message}`);
    // Return 200 so Shopify does not retry — we have the log
  }

  return new Response("Data request acknowledged", { status: 200 });
};
