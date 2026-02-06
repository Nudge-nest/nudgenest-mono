import {Banner, Page} from "@shopify/polaris";
import RegistrationPage from "./app.registration";
import CustomerDashboard from "./app.dashboard";
import {useLoaderData} from "@remix-run/react";
import type { LoaderData} from "../utilities";
import {checkMerchantRegistration, getMerchantDataFromShopify, registerMerchant, fetchReviewStats} from "../utilities";
import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import { json} from "@remix-run/node";
import {authenticate} from "../shopify.server";


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

    // Fetch review stats if merchant is registered
    let reviewStats = null;
    if (registrationCheck.data?.id) {
      reviewStats = await fetchReviewStats(registrationCheck.data.id);
    }

    const loaderData: LoaderData = {
      isRegistered: !!registrationCheck.data,
      shopInfo,
      businessInfo,
      merchantData: registrationCheck.data || null,
      reviewStats,
    };

    return json(loaderData);
  } catch (error) {
    console.error("Loader error:", error);
    return json({
      isRegistered: false,
      shopInfo: null,
      businessInfo: null,
      merchantData: null,
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

  // Conditional rendering based on registration status
  return data.isRegistered ? (
    <CustomerDashboard
      merchantData={data.merchantData}
      shopInfo={data.shopInfo}
      reviewStats={data.reviewStats}
    />
  ) : (
    <RegistrationPage
      shopInfo={data.shopInfo}
      businessInfo={data.businessInfo}
    />
  );
}
