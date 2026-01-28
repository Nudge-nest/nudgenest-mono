import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

import { Provider } from 'react-redux';
import { store } from './redux/store.ts';
import { BrowserRouter } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';

import './index.css';

function Fallback({ error }: { error: Error }) {
    // Call resetErrorBoundary() to reset the error boundary and retry the render.

    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error.message}</pre>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ErrorBoundary FallbackComponent={Fallback}>
                    <App />
                </ErrorBoundary>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
