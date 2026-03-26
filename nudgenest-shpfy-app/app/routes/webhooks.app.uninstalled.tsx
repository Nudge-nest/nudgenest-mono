import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { BASE_URL } from "../utilities";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session } = await authenticate.webhook(request);

  // 1. Delete local SQLite session (may already be gone if webhook fired twice)
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // 2. Soft-delete merchant — fire-and-forget so Shopify gets an immediate 200.
  //    Awaiting the backend risks breaching Shopify's 5s webhook timeout (cold start).
  //    shop/redact fires 48h later for full GDPR erasure regardless.
  fetch(`${BASE_URL}/api/v1/merchants/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId: shop }),
  })
    .then((res) => {
      if (!res.ok) res.text().then((t) => console.error(`[uninstalled] Deactivate failed: ${res.status} ${t}`));
      else console.log(`[uninstalled] Merchant soft-deleted: ${shop}`);
    })
    .catch((err) => console.error(`[uninstalled] Failed to reach backend: ${err.message}`));

  // Respond to Shopify immediately — never block on the backend call
  return new Response();
};
