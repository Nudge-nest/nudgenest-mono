import { configureStore } from '@reduxjs/toolkit';
import { nudgeNestApi } from './nudgenest.ts';

export const store = configureStore({
    reducer: {
        [nudgeNestApi.reducerPath]: nudgeNestApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }).concat(nudgeNestApi.middleware),
});
