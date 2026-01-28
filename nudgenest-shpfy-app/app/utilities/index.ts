
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

export interface LoaderData {
  isRegistered: boolean;
  shopInfo: IShopifyShop | null;
  businessInfo: IShopifyBusinessEntityData | null;
  merchantData?: any;
  error?: string;
}

export const BASE_URL = "https://nudgenest-backend-1094805904049.europe-west1.run.app/api/v1/";

export const fetchWithErrorHandling = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);
    console.log("Fetch ", response);
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

  const url = `${BASE_URL}merchants/verify/${trimmedShopId}`;
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
};

export const registerMerchant = async (merchantData: any) => {
  const url = `${BASE_URL}merchants`;
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merchantData),
  });
};



