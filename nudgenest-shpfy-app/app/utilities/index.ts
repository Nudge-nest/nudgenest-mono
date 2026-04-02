
import type { SubscriptionDetails } from '@nudgenest/shared';
export type { Plan, PlanFeatures, PlanLimits, SubscriptionDetails } from '@nudgenest/shared';

export interface IShopifyBusinessAddress {
  address1: string;
  address2: string;
  city: string;
  country: string;
  formatted: string;
  phone: string;
  province: string;
  zip: string;
}

export interface IShopifyShop {
  id: string;
  name: string;
  email: string;
  contactEmail: string;
  myshopifyDomain: string;
  primaryDomain: string;
  currencyCode: string;
  plan: string;
  description: string;
  billingAddress: IShopifyBusinessAddress;
}

export interface IShopifyBusinessEntityData {
  id: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: string;
  responseRate: number;
}

export interface LoaderData {
  isRegistered: boolean;
  shopInfo: IShopifyShop | null;
  businessInfo: IShopifyBusinessEntityData | null;
  merchantData?: any;
  reviewStats?: ReviewStats | null;
  subscriptionDetails?: SubscriptionDetails | null;
  defaultPlan?: {
    id: string;
    name: string;
    displayName: string;
    tier: string;
    price: number;
    billingInterval: string;
  } | null;
  allPlans?: import('@nudgenest/shared').Plan[] | null;
  reviewUiBaseUrl?: string;
  billingStatus?: string | null;
  error?: string;
}

if (!process.env.NUDGENEST_BACKEND_URL) {
  throw new Error("Missing required env var: NUDGENEST_BACKEND_URL");
}
// Remove trailing slash to avoid double slash in URLs
export const BASE_URL = process.env.NUDGENEST_BACKEND_URL.replace(/\/$/, '');

export const fetchWithErrorHandling = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);
    // Handle different response statuses
    if (response.status === 404) {
      return { exists: false, data: null };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }


    return await response.json();
  } catch (error) {
    console.error(`Error in request to ${url}:`, error);
    throw error;
  }
};

export const getMerchantDataFromShopify = async (admin: any) => {
  const shopResponse = await admin.graphql(`#graphql
    query {
      shop {
        id
        name
        email
        myshopifyDomain
        primaryDomain { url }
        currencyCode
        plan { displayName }
        description
        billingAddress {
          address1
          address2
          city
          country
          formatted
          phone
          province
          zip
        }
      }
    }`);

  const shopData = await shopResponse.json();
  const shopInfo: IShopifyShop = shopData.data?.shop;

  const businessEntityResponse = await admin.graphql(`#graphql
    query {
      businessEntity {
        id
      }
    }`);

  const businessData = await businessEntityResponse.json();
  const businessInfo: IShopifyBusinessEntityData = businessData.data.businessEntity;

  return { shopInfo, businessInfo };
};

export const checkMerchantRegistration = async (shopId: string) => {
  const trimmedShopId = shopId.split("/")[4];
  if (!trimmedShopId) {
    throw new Error("Invalid shop ID format");
  }

  const url = `${BASE_URL}/merchants/verify/${trimmedShopId}`;
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};

export const registerMerchant = async (merchantData: any) => {
  const url = `${BASE_URL}/merchants`;
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merchantData),
  });
};

export const fetchReviewStats = async (merchantId: string, apiKey?: string): Promise<ReviewStats | null> => {
  try {
    const url = `${BASE_URL}/reviews/stats/${merchantId}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetchWithErrorHandling(url, {
      method: "GET",
      headers,
    });
    return response.data || null;
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return null;
  }
};

export const fetchSubscriptionDetails = async (merchantId: string, apiKey?: string): Promise<SubscriptionDetails | null> => {
  try {
    const url = `${BASE_URL}/billing/subscription/${merchantId}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetchWithErrorHandling(url, {
      method: "GET",
      headers,
    });
    return response.data || null;
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return null;
  }
};
