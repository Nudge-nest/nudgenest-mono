import { configureStore, isRejected } from '@reduxjs/toolkit';
import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/react';
import { nudgeNestApi } from './nudgenest.ts';

const rtkQueryErrorLogger: Middleware = (_api: MiddlewareAPI) => (next) => (action) => {
    if (isRejected(action)) {
        const error = action.error;
        if (error?.name !== 'AbortError') {
            Sentry.captureException(new Error(error.message || 'RTK Query error'), {
                tags: {
                    type: 'api_error',
                    endpoint: (action as any).meta?.arg?.endpointName,
                },
                extra: { status: (action.payload as any)?.status },
            });
        }
    }
    return next(action);
};

export const store = configureStore({
    reducer: {
        [nudgeNestApi.reducerPath]: nudgeNestApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false })
            .concat(nudgeNestApi.middleware)
            .concat(rtkQueryErrorLogger),
});
