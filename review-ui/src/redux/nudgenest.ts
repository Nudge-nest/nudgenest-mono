import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IReview } from '../types/review.ts';
import { IReviewConfiguration } from '../types/reviewConfigs.ts';

export const nudgeNestApi = createApi({
    reducerPath: 'nudgeNestApi',
    tagTypes: ['review', 'media', 'config', 'billing'],
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_APP_BACKEND_HOST_LOCAL,
        prepareHeaders: (headers) => {
            const apiKey = localStorage.getItem('apiKey');
            if (apiKey) {
                headers.set('x-api-key', apiKey);
            }
            return headers;
        },
    }),
    endpoints: (builder) => {
        return {
            getReview: builder.query({
                query: (reviewId: string) => ({
                    url: `reviews/${reviewId}`,
                    method: 'GET',
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['review'],
            }),
            listReviews: builder.query({
                query: (shopId: string) => ({
                    url: `reviews/list?shopid=${shopId}`,
                    method: 'GET',
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['review'],
            }),
            updateReview: builder.mutation({
                query: (review: IReview) => ({
                    url: `reviews/${review.id}`,
                    method: 'PUT',
                    body: { result: review.result, status: review.status },
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['review'],
            }),
            uploadReviewMedia: builder.mutation({
                query: (formData) => ({
                    url: `media`,
                    method: 'POST',
                    body: formData,
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['media'],
            }),
            deleteReviewMedia: builder.mutation({
                query: (mediaUrl: string) => ({
                    url: `media/${mediaUrl}`,
                    method: 'DELETE',
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['media'],
            }),
            getReviewConfigs: builder.query({
                query: (merchantId: string) => ({
                    url: `config/${merchantId}`,
                    method: 'GET',
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['config'],
            }),
            updateReviewConfigs: builder.mutation({
                query: (updateObject: { reviewConfigs: IReviewConfiguration; merchantId: string }) => ({
                    url: `config/${updateObject.merchantId}`,
                    method: 'PATCH',
                    body: updateObject.reviewConfigs,
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['config'],
            }),
            // Billing endpoints
            getPlans: builder.query({
                query: () => ({
                    url: 'api/v1/plans',
                    method: 'GET',
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['billing'],
            }),
            getSubscription: builder.query({
                query: () => ({
                    url: 'api/v1/billing/subscription',
                    method: 'GET',
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['billing'],
            }),
            createSubscription: builder.mutation({
                query: (data: { planId: string; trialDays?: number }) => ({
                    url: 'api/v1/billing/subscription',
                    method: 'POST',
                    body: data,
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['billing'],
            }),
            changeSubscription: builder.mutation({
                query: (data: { planId: string }) => ({
                    url: 'api/v1/billing/subscription',
                    method: 'PUT',
                    body: data,
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['billing'],
            }),
            cancelSubscription: builder.mutation({
                query: (immediate: boolean = false) => ({
                    url: `api/v1/billing/subscription?immediate=${immediate}`,
                    method: 'DELETE',
                }),
                transformResponse: (response: { data: any }) => response.data,
                invalidatesTags: ['billing'],
            }),
            getUsageStats: builder.query({
                query: (params?: { periodStart?: string; periodEnd?: string }) => ({
                    url: 'api/v1/billing/usage',
                    method: 'GET',
                    params,
                }),
                transformResponse: (response: { data: any }) => response.data,
                providesTags: ['billing'],
            }),
        };
    },
});

export const {
    useGetReviewQuery,
    useListReviewsQuery,
    useUpdateReviewMutation,
    useUploadReviewMediaMutation,
    useDeleteReviewMediaMutation,
    useGetReviewConfigsQuery,
    useUpdateReviewConfigsMutation,
    useGetPlansQuery,
    useGetSubscriptionQuery,
    useCreateSubscriptionMutation,
    useChangeSubscriptionMutation,
    useCancelSubscriptionMutation,
    useGetUsageStatsQuery,
} = nudgeNestApi;

export const { endpoints, reducerPath, reducer, middleware } = nudgeNestApi;
