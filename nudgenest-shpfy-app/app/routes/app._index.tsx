import {Banner, Page} from "@shopify/polaris";
import RegistrationPage from "./app.registration";
import CustomerDashboard from "./app.dashboard";
import {useLoaderData} from "@remix-run/react";
import type { LoaderData} from "../utilities";
import {BASE_URL, checkMerchantRegistration, fetchWithErrorHandling, getMerchantDataFromShopify, registerMerchant, fetchReviewStats, fetchSubscriptionDetails} from "../utilities";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import { json} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import * as Sentry from "@sentry/remix";

/** Parse a cookie header string and return the value for a given key */
function parseCookie(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(";").find(c => c.trim().startsWith(`${key}=`));
  return match ? decodeURIComponent(match.trim().slice(key.length + 1)) : null;
}


// ============================================================================
// LOADER - Authentication & Registration Check
// ============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Get shop data from Shopify
    const { shopInfo, businessInfo } = await getMerchantDataFromShopify(admin);

    // Check if merchant is already registered in Nudge-nest
    const registrationCheck = await checkMerchantRegistration(shopInfo.id);

    // Fetch review stats and subscription details if merchant is registered
    let reviewStats = null;
    let subscriptionDetails = null;
    if (registrationCheck.data?.id) {
      const merchantApiKey = registrationCheck.data.apiKey;
      reviewStats = await fetchReviewStats(registrationCheck.data.id, merchantApiKey);
      subscriptionDetails = await fetchSubscriptionDetails(registrationCheck.data.id, merchantApiKey);
    }

    // Fetch all plans from backend (used for registration and billing cards)
    let allPlans = null;
    let defaultPlan = null;
    try {
      const merchantApiKey = registrationCheck.data?.apiKey;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (merchantApiKey) headers['x-api-key'] = merchantApiKey;

      const plansData = await fetchWithErrorHandling(`${BASE_URL}/plans`, { headers });
      const allPlansFromAPI = plansData.data?.plans || [];
      allPlans = allPlansFromAPI.filter((p: any) => p.tier !== 'ENTERPRISE');
      defaultPlan = allPlans?.find((p: any) => p.tier === 'FREE') || null;
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }

    // Read and immediately clear the billing status cookie set by api.billing.callback
    const cookieHeader = request.headers.get("Cookie");
    const billingStatus = parseCookie(cookieHeader, "nudgenest_billing_status");

    const loaderData: LoaderData = {
      isRegistered: !!registrationCheck.data,
      shopInfo,
      businessInfo,
      merchantData: registrationCheck.data || null,
      reviewStats,
      subscriptionDetails,
      defaultPlan,
      allPlans,
      reviewUiBaseUrl: process.env.REVIEW_UI_BASE_URL,
      billingStatus: billingStatus || null,
    };

    const responseHeaders: Record<string, string> = {};
    if (billingStatus) {
      // Clear the cookie now that we've read it
      responseHeaders["Set-Cookie"] = "nudgenest_billing_status=; Path=/; Max-Age=0; SameSite=None; Secure";
    }

    return json(loaderData, { headers: responseHeaders });
  } catch (error) {
    console.error("Loader error:", error);
    return json({
      isRegistered: false,
      shopInfo: null,
      businessInfo: null,
      merchantData: null,
      subscriptionDetails: null,
      defaultPlan: null,
      allPlans: null,
      error: error instanceof Error ? error.message : "Failed to load merchant data"
    } as LoaderData);
  }
};

// ============================================================================
// ACTION - Handle Registration
// ============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");

  try {
    if (actionType === "register") {
      const { shopInfo, businessInfo } = await getMerchantDataFromShopify(admin);

      const merchantData = {
        shopId: shopInfo.id,
        domains: shopInfo.myshopifyDomain,
        currencyCode: shopInfo.currencyCode,
        email: shopInfo.email,
        name: shopInfo.name,
        businessInfo: businessInfo.id,
        address: shopInfo.billingAddress,
      };

      const result = await registerMerchant(merchantData);

      return json({
        success: true,
        message: "Registration successful!",
        data: result
      });
    }

    return json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("Action error:", error);
    return json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed"
    });
  }
};

export default function Index() {
  const data = useLoaderData<LoaderData>();

  if (!data) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f6f6f7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e1e3e5',
          borderTop: '3px solid #ef4444',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 400,
          color: '#202223'
        }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <Page>
        <Banner >
          <p>Failed to load application: {data.error}</p>
          <p>Please refresh the page or contact support if the issue persists.</p>
        </Banner>
      </Page>
    );
  }

  // Missing shop info
  if (!data.shopInfo || !data.businessInfo) {
    return (
      <Page>
        <Banner>
          <p>Unable to retrieve store information. Please try reinstalling the app.</p>
        </Banner>
      </Page>
    );
  }

  // Set Sentry user context now that shop identity is confirmed
  Sentry.setUser({ username: data.shopInfo.myshopifyDomain });
  Sentry.setTag("shop", data.shopInfo.myshopifyDomain);

  // Conditional rendering based on registration status
  return data.isRegistered ? (
    <CustomerDashboard
      merchantData={data.merchantData}
      shopInfo={data.shopInfo}
      reviewStats={data.reviewStats}
      subscriptionDetails={data.subscriptionDetails}
      allPlans={data.allPlans}
      reviewUiBaseUrl={data.reviewUiBaseUrl}
      billingStatus={data.billingStatus}
    />
  ) : (
    <RegistrationPage
      shopInfo={data.shopInfo}
      businessInfo={data.businessInfo}
      defaultPlan={data.defaultPlan}
    />
  );
}
