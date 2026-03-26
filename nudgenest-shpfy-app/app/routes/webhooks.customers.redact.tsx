import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BASE_URL } from "../utilities";

/**
 * GDPR Mandatory Webhook: customers/redact
 *
 * Shopify sends this when a customer requests deletion of their data, or
 * when a store owner deletes a customer. The app must delete all PII
 * for that customer within 30 days.
 *
 * Required for Shopify App Store submission.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[GDPR] ${topic} received for shop: ${shop}`);

  try {
    // Forward to backend which will delete customer PII from MongoDB reviews
    const response = await fetch(`${BASE_URL}/gdpr/customers/redact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, topic, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GDPR] Backend error for customers/redact: ${response.status} ${errorText}`);
    } else {
      console.log(`[GDPR] customers/redact processed for shop: ${shop}`);
    }
  } catch (error: any) {
    console.error(`[GDPR] Failed to forward customers/redact to backend: ${error.message}`);
  }

  return new Response("Customer data redaction processed", { status: 200 });
};
