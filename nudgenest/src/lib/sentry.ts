import * as Sentry from '@sentry/node';

export function initSentry(): void {
    const dsn = process.env.SENTRY_BACKEND_DSN;
    if (!dsn) return; // empty in local dev — Sentry is a no-op

    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.COMMIT_SHA || 'unknown',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [Sentry.httpIntegration()],
    });
}

export { Sentry };
