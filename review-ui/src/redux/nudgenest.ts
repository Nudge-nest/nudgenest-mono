import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IReview } from '../types/review.ts';
import { IReviewConfiguration } from '../types/reviewConfigs.ts';

export const nudgeNestApi = createApi({
    reducerPath: 'nudgeNestApi',
    tagTypes: ['review', 'media', 'config'],
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_APP_BACKEND_HOST_LOCAL,
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
} = nudgeNestApi;

export const { endpoints, reducerPath, reducer, middleware } = nudgeNestApi;
