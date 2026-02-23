import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import * as Sentry from "@sentry/remix";

export const loader = async (_: LoaderFunctionArgs) => {
    if (process.env.NODE_ENV === "production") {
        throw new Response("Not found", { status: 404 });
    }
    const eventId = Sentry.captureMessage(
        `[sentry-test] Shopify app event @ ${new Date().toISOString()}`,
        "info"
    );
    return json({ ok: true, sentryEventId: eventId });
};
