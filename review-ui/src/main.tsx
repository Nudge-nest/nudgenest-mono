import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import { Provider } from 'react-redux';
import { store } from './redux/store.ts';
import { BrowserRouter } from 'react-router';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import * as Sentry from '@sentry/react';

import './index.css';

Sentry.init({
    dsn: import.meta.env.VITE_APP_SENTRY_FE_DSN || '',
    environment: import.meta.env.PROD ? 'production' : 'development',
    release: import.meta.env.VITE_COMMIT_SHA || 'unknown',
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    enabled: !!import.meta.env.VITE_APP_SENTRY_FE_DSN,
    integrations: [Sentry.browserTracingIntegration()],
});

const apiKey = localStorage.getItem('nn-apiKey');
if (apiKey) Sentry.setUser({ id: apiKey });

if (new URLSearchParams(window.location.search).has('sentry-test')) {
    Sentry.captureMessage(
        `[sentry-test] Review UI event @ ${new Date().toISOString()}`,
        'info'
    );
}

// eslint-disable-next-line react-refresh/only-export-components
function Fallback({ error }: FallbackProps) {
    // react-error-boundary v6 widened error to `unknown` — narrow before accessing .message
    const message = error instanceof Error ? error.message : String(error);
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{message}</pre>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ErrorBoundary
                    FallbackComponent={Fallback}
                    onError={(error, info) =>
                        Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
                    }
                >
                    <App />
                </ErrorBoundary>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
