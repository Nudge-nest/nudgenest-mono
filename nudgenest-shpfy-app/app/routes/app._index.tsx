import {Banner, BlockStack, Page, Text} from "@shopify/polaris";
import RegistrationPage from "./app.registration";
import CustomerDashboard from "./app.dashboard";
import {useLoaderData} from "@remix-run/react";
import {useEffect, useState} from "react";
import type { LoaderData} from "../utilities";
import {checkMerchantRegistration, getMerchantDataFromShopify, registerMerchant} from "../utilities";
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

    const loaderData: LoaderData = {
      isRegistered: !!registrationCheck.data,
      shopInfo,
      businessInfo,
      merchantData: registrationCheck.data || null,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent flash of content
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  if (isLoading || !data) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f6f6f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <BlockStack gap="200" align="center">
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e1e3e5',
            borderTop: '3px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <Text variant="bodyMd" as="p">Loading...</Text>
        </BlockStack>
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
    />
  ) : (
    <RegistrationPage
      shopInfo={data.shopInfo}
      businessInfo={data.businessInfo}
    />
  );
}
