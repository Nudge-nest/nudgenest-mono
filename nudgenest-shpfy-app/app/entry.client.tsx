import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import * as Sentry from "@sentry/remix";

declare global {
    interface Window {
        __ENV?: { SENTRY_SHOPIFY_DSN?: string; NODE_ENV?: string; COMMIT_SHA?: string };
    }
}

Sentry.init({
    dsn: window.__ENV?.SENTRY_SHOPIFY_DSN,
    environment: window.__ENV?.NODE_ENV || "development",
    release: window.__ENV?.COMMIT_SHA || "unknown",
    tracesSampleRate: window.__ENV?.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event, hint) {
        const err = hint.originalException;
        // billing.request() always throws Response(401) intentionally — never report it
        // authenticate.admin() throws Response(3xx) for auth redirects — skip those too
        if (err instanceof Response && err.status < 500) return null;
        return event;
    },
});

startTransition(() => {
    hydrateRoot(document, <StrictMode><RemixBrowser /></StrictMode>);
});
