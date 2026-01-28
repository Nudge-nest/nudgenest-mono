import {useCallback, useEffect, useState} from "react";
import {ActionFunctionArgs, json, LoaderFunctionArgs} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Card,
  Banner,
  Toast
} from "@shopify/polaris";
import {TitleBar, useAppBridge} from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {AdminApp} from "@shopify/shopify-app-remix/dist/ts/server/types";
import * as process from "node:process";

// Keep all your existing interfaces
interface IShopifyShop {
  id:string;
  name:string;
  email:string;
  contactEmail:string;
  myshopifyDomain:string;
  primaryDomain :string;
  currencyCode:string;
  plan :string;
  description:string;
  billingAddress :IShopifyBusinessAddress;
}

interface IShopifyBusinessEntityData {
  id:string;
}

interface IShopifyBusinessAddress {
  address1:string;
  address2:string;
  city:string;
  country:string;
  formatted:string;
  phone:string;
  province:string;
  zip:string;
}

interface IShopifyMerchantData {
  shopId:string;
  domains: string;
  currencyCode:string;
  email: string;
  name: string;
  businessInfo: string;
  address: IShopifyBusinessAddress,
}

// Keep all your existing functions
const getMerchantDataFromShopify = async(admin: AdminApp)=>{
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
          billingAddress { address1, address2, city, country, formatted, zip }
        }
      }`);

  const shopData  = await shopResponse.json();
  const shopInfo: IShopifyShop = shopData.data?.shop;
  const businessEntityResponse = await admin.graphql(`#graphql
      query {
        businessEntity {
          id
        }
      }`);

  const businessData = await businessEntityResponse.json();
  const businessInfo: IShopifyBusinessEntityData = businessData.data.businessEntity;
  console.log('shopInfo', shopInfo);
  console.log('businessInfo', businessInfo);
  return{shopInfo, businessInfo}
}

const BASE_URL = "https://nudgenest-backend-1094805904049.europe-west1.run.app/api/v1/";

const fetchWithErrorHandling = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in request to ${url}:`, error);
    throw error;
  }
};

const registerMerchantToNudgeNest = async (merchantData: IShopifyMerchantData)=>{
  const url = `${BASE_URL}merchants`;
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merchantData),
  });
}

const getMerchantDataFromNudgeNest = async (shopId:string)=>{
  const trimmedShopId = shopId.split("/")[4];
  if (!trimmedShopId)return;
  const url = `${BASE_URL}merchants/verify/${trimmedShopId}`;
  console.log('URL', url)
  return fetchWithErrorHandling(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

// Keep your existing loader and action
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const merchantShop = session.shop as string;

  const { shopInfo, businessInfo } = await getMerchantDataFromShopify(admin);
  const isMerchantRegistered = await getMerchantDataFromNudgeNest(shopInfo.id);

  const merchant = isMerchantRegistered.data
    ? await getMerchantDataFromNudgeNest(merchantShop)
    : await registerMerchantToNudgeNest({
      shopId: shopInfo.id,
      domains: shopInfo.myshopifyDomain,
      currencyCode: shopInfo.currencyCode,
      email: shopInfo.email,
      name: shopInfo.name,
      businessInfo: businessInfo.id,
      address: shopInfo.billingAddress,
    });
  return json({ merchant });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  return null;
};

// Declare global functions for modal overlay
declare global {
  interface Window {
    closeNudgenestOverlay: () => void;
    handleNudgenestIframeLoad: () => void;
  }
}

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData<typeof loader>();
  const app = useAppBridge();

  // Toast state
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  // Loading state to prevent flicker
  const [isAppReady, setIsAppReady] = useState(false);

  // Immediate flicker prevention - runs before React renders
  useEffect(() => {
    // Hide the document immediately
    document.documentElement.style.visibility = 'hidden';
    document.body.style.visibility = 'hidden';

    // Small delay then show with fade in
    const timer = setTimeout(() => {
      document.documentElement.style.visibility = 'visible';
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s ease-in-out';

      // Fade in
      requestAnimationFrame(() => {
        document.body.style.opacity = '1';
      });

      setIsAppReady(true);
    }, 50); // Very short delay

    return () => {
      clearTimeout(timer);
      // Reset styles
      document.documentElement.style.visibility = '';
      document.body.style.visibility = '';
      document.body.style.opacity = '';
      document.body.style.transition = '';
    };
  }, []);

  // Additional CSS injection to prevent any flash
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent any flashing during load */
      html { visibility: hidden !important; }
      body { visibility: hidden !important; }

      /* Hide default Shopify app icons/loaders */
      .shopify-app-loading,
      .app-loading,
      [data-shopify-app-loading],
      .polarisPortalContainer > div:first-child,
      .Frame-loadingBar,
      .Shopify__AppBridge__Loading {
        display: none !important;
        visibility: hidden !important;
      }

      /* Custom loading state */
      .nudgenest-loading {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #f6f6f7 !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
    `;
    document.head.appendChild(style);

    // Show our content after a brief moment
    const timer = setTimeout(() => {
      document.documentElement.style.visibility = 'visible';
      document.body.style.visibility = 'visible';
      style.remove(); // Remove the hiding styles
    }, 100);

    return () => {
      clearTimeout(timer);
      if (style.parentNode) {
        style.remove();
      }
    };
  }, []);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  }, []);

  // Simplified modal approach - just use a large Polaris-style overlay
  const openConfigModal = useCallback(() => {
    console.log('Opening Configuration Modal');

    const shopDomain = data.merchant?.data?.domains || 'demo-shop.myshopify.com';
    const merchantId = data.merchant?.data?.shopId?.split('/')[4] || 'demo-merchant';
    const configUrl = 'https://nudgenest-review-ui-1094805904049.europe-west1.run.app/configs/68414ac959456a2575dd1aae';

    console.log('Config URL:', configUrl);

    // Create a simple fullscreen overlay modal
    const overlayHTML = `
      <div id="nudgenest-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          width: 95vw;
          height: 95vh;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            background: #f6f6f7;
            padding: 16px 20px;
            border-bottom: 1px solid #e1e3e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h2 style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: #202223;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">

            </h2>
            <button onclick="closeNudgenestOverlay()" style="
              background: #008060;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              Close
            </button>
          </div>
          <div style="flex: 1; position: relative;">
            <iframe
              id="config-iframe"
              src="${configUrl}"
              style="
                width: 100%;
                height: 100%;
                border: none;
                display: block;
              "
              onload="handleNudgenestIframeLoad()"
              title="Nudge-nest Configuration">
            </iframe>
          </div>
        </div>
      </div>
    `;

    // Remove existing overlay if present
    const existingOverlay = document.getElementById('nudgenest-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Add overlay to DOM
    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Setup global functions
    window.closeNudgenestOverlay = () => {
      const overlay = document.getElementById('nudgenest-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = 'unset';
        console.log('Overlay closed');
      }
    };

    window.handleNudgenestIframeLoad = () => {
      console.log('Configuration iframe loaded successfully');

      const iframe = document.getElementById('config-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        const shopData = {
          shop: shopDomain,
          merchantId: merchantId,
          embedded: true,
          source: 'shopify-app'
        };

        setTimeout(() => {
          iframe.contentWindow!.postMessage({
            type: 'SHOP_DATA',
            data: shopData
          }, '*');
        }, 500);
      }
    };

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.closeNudgenestOverlay();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

  }, [data, showToast]);

  // Get shop data for display
  const shopDomain = data.merchant?.data?.domains || 'demo-shop.myshopify.com';
  const merchantId = data.merchant?.data?.shopId?.split('/')[4] || 'demo-merchant';
  const configUrl = 'https://nudgenest-review-ui-1094805904049.europe-west1.run.app/configs/demo';

  // Setup iframe communication for App Bridge Modal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from iframe:', event);

      // Verify origin for security
      const allowedOrigins = ['https://nudgenest-review-ui-1094805904049.europe-west1.run.app'];
      if (!allowedOrigins.some(origin => event.origin.includes(origin.replace('https://', '').replace('http://', '')))) {
        console.log('Message from unauthorized origin:', event.origin);
        return;
      }

      const { type, data: messageData } = event.data;

      switch (type) {
        case 'CONFIG_SAVED':
          showToast('Configuration saved successfully!');
          // Close the overlay modal
          if (window.closeNudgenestOverlay) {
            window.closeNudgenestOverlay();
          }
          break;
        case 'CONFIG_ERROR':
          showToast('Failed to save configuration', true);
          break;
        case 'CLOSE_MODAL':
          if (window.closeNudgenestOverlay) {
            window.closeNudgenestOverlay();
          }
          break;
        case 'IFRAME_READY':
          console.log('Iframe is ready');
          break;
        default:
          console.log('Unknown message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
      // Clean up global functions
      if (window.closeNudgenestOverlay) {
        delete window.closeNudgenestOverlay;
      }
      if (window.handleNudgenestIframeLoad) {
        delete window.handleNudgenestIframeLoad;
      }
    };
  }, [showToast]);

  // Load App Bridge script and ensure it's ready
  useEffect(() => {
    const loadAppBridge = () => {
      if (!document.querySelector('script[src*="app-bridge"]')) {
        console.log('Loading App Bridge script...');
        const script = document.createElement('script');
        script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
        script.type = 'text/javascript';
        script.onload = () => {
          console.log('App Bridge script loaded successfully');
          // Wait for web components to register
          setTimeout(() => {
            console.log('App Bridge ready for use');
          }, 1000);
        };
        script.onerror = (error) => {
          console.error('Failed to load App Bridge script:', error);
          // Try alternative CDN
          const altScript = document.createElement('script');
          altScript.src = 'https://unpkg.com/@shopify/app-bridge@3/umd/index.js';
          altScript.onload = () => {
            console.log('App Bridge (alternative) loaded successfully');
          };
          altScript.onerror = () => {
            console.error('All App Bridge CDNs failed to load');
          };
          document.head.appendChild(altScript);
        };
        document.head.appendChild(script);
      } else {
        console.log('App Bridge script already loaded');
      }
    };

    loadAppBridge();
  }, []);

  return (
    <>
      {/* Immediate anti-flicker overlay */}
      <div
        id="nudgenest-preloader"
        className="nudgenest-loading"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f6f6f7',
          zIndex: 999999,
          display: isAppReady ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#202223'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e1e3e5',
            borderTop: '2px solid #008060',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading...
        </div>
      </div>

      <div style={{
        visibility: isAppReady ? 'visible' : 'hidden',
        opacity: isAppReady ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}>
        <Page>
          <TitleBar title="Nudge-nest Reviews Settings" />

          <BlockStack gap="500">
            {/* Welcome Banner */}
            <Banner title="Welcome to Nudge-nest Reviews!" status="info">
              <p>
                Your review system is now connected to your Shopify store.
                Configure your settings and start collecting valuable customer feedback.
              </p>
            </Banner>

            <Layout>
              {/* Main Configuration Section */}
              <Layout.Section>
                <Card sectioned>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h2">
                        Review Configuration
                      </Text>
                      <Text variant="bodyMd" as="p" color="subdued">
                        Customize your review collection settings, email templates,
                        and widget appearance through our advanced configuration panel.
                      </Text>
                    </BlockStack>

                    <Button
                      primary
                      size="large"
                      onClick={openConfigModal}
                    >
                      Open Advanced Configuration
                    </Button>
                  </BlockStack>
                </Card>
              </Layout.Section>

              {/* Stats Section */}
              <Layout.Section>
                <Card sectioned>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Quick Stats
                    </Text>

                    <InlineStack gap="400" align="space-around">
                      <BlockStack gap="100" align="center">
                        <Text variant="heading2xl" as="p">156</Text>
                        <Text variant="bodySm" as="p" color="subdued">Total Reviews</Text>
                      </BlockStack>
                      <BlockStack gap="100" align="center">
                        <Text variant="heading2xl" as="p">4.8</Text>
                        <Text variant="bodySm" as="p" color="subdued">Average Rating</Text>
                      </BlockStack>
                      <BlockStack gap="100" align="center">
                        <Text variant="heading2xl" as="p">23%</Text>
                        <Text variant="bodySm" as="p" color="subdued">Response Rate</Text>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </Layout.Section>

              {/* Merchant Info */}
              <Layout.Section>
                <Card sectioned>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Connected Store
                    </Text>

                    <BlockStack gap="200">
                      <InlineStack gap="200" align="space-between">
                        <Text variant="bodyMd" as="span" fontWeight="medium">Store:</Text>
                        <Text variant="bodyMd" as="span">{shopDomain}</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="space-between">
                        <Text variant="bodyMd" as="span" fontWeight="medium">Merchant ID:</Text>
                        <Text variant="bodyMd" as="span">{merchantId}</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="space-between">
                        <Text variant="bodyMd" as="span" fontWeight="medium">Status:</Text>
                        <Text variant="bodyMd" as="span" color="success">Connected</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="space-between">
                        <Text variant="bodyMd" as="span" fontWeight="medium">Config URL:</Text>
                        <Text variant="bodyMd" as="span" color="subdued">{configUrl.substring(0, 50)}...</Text>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </BlockStack>

          {/* Toast Notifications */}
          {toastActive && (
            <Toast
              content={toastMessage}
              error={toastError}
              onDismiss={() => setToastActive(false)}
            />
          )}
        </Page>
      </div>

      {/* Global CSS for anti-flicker */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Hide potential flicker sources */
        .Polaris-Frame-Loading,
        .Polaris-Spinner,
        [data-polaris-loading="true"],
        .shopify-app-loading {
          display: none !important;
        }
      `}</style>
    </>
  );
}
