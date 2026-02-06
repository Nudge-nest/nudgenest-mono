import { TitleBar } from "@shopify/app-bridge-react";
import {Banner, BlockStack, Button, Card, InlineStack, Layout, Page, Toast, Text} from "@shopify/polaris";
import {useCallback, useState} from "react";
import type {IShopifyShop} from "../utilities";

function CustomerDashboard({ merchantData, shopInfo }: {
  merchantData: any;
  shopInfo: IShopifyShop;
}) {
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  }, []);

  const openConfigModal = useCallback(() => {
    const shopDomain = merchantData?.domains || shopInfo.myshopifyDomain;
    const merchantId = merchantData?.id || merchantData?.shopId?.split('/')[4] || shopInfo.id.split('/')[4];
    const configUrl = `https://nudgenest-review-ui-1094805904049.europe-west1.run.app/configs/${merchantId}`;

    const overlayHTML = `
      <div id="nudgenest-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
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
              Review Configuration
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
              style="width: 100%; height: 100%; border: none; display: block;"
              title="Nudge-nest Configuration">
            </iframe>
          </div>
        </div>
      </div>
    `;

    const existingOverlay = document.getElementById('nudgenest-overlay');
    if (existingOverlay) existingOverlay.remove();

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    document.body.style.overflow = 'hidden';

    (window as any).closeNudgenestOverlay = () => {
      const overlay = document.getElementById('nudgenest-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = 'unset';
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        (window as any).closeNudgenestOverlay();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }, [merchantData, shopInfo]);

  const shopDomain = merchantData?.domains || shopInfo.myshopifyDomain;
  const merchantId = merchantData?.id || merchantData?.shopId?.split('/')[4] || shopInfo.id.split('/')[4];

  return (
    <Page>
      <BlockStack gap="500">
        {/* Welcome Banner */}
        <Banner title="Welcome Back!" >
          <p>
            Your review system is active and collecting customer feedback.
            Manage your settings and view analytics below.
          </p>
        </Banner>

        <Layout>
          {/* Configuration Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2">
                    Review Configuration
                  </Text>
                  <Text variant="bodyMd" as="p" >
                    Customize your review collection settings, email templates,
                    and widget appearance.
                  </Text>
                </BlockStack>

                <Button size="large" onClick={openConfigModal}>
                  Open Configuration
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Stats Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Quick Stats
                </Text>

                <InlineStack gap="400" align="space-around">
                  <BlockStack gap="100" align="center">
                    <Text variant="heading2xl" as="p">
                      {merchantData?.totalReviews || 0}
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Total Reviews
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100" align="center">
                    <Text variant="heading2xl" as="p">
                      {merchantData?.averageRating || '0.0'}
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Average Rating
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100" align="center">
                    <Text variant="heading2xl" as="p">
                      {merchantData?.responseRate || '0'}%
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Response Rate
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Store Info Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Connected Store
                </Text>

                <BlockStack gap="200">
                  <InlineStack gap="200" align="space-between">
                    <Text variant="bodyMd" as="span" fontWeight="medium">
                      Store:
                    </Text>
                    <Text variant="bodyMd" as="span">
                      {shopDomain}
                    </Text>
                  </InlineStack>

                  <InlineStack gap="200" align="space-between">
                    <Text variant="bodyMd" as="span" fontWeight="medium">
                      Merchant ID:
                    </Text>
                    <Text variant="bodyMd" as="span">
                      {merchantId}
                    </Text>
                  </InlineStack>

                  <InlineStack gap="200" align="space-between">
                    <Text variant="bodyMd" as="span" fontWeight="medium">
                      Status:
                    </Text>
                    <Text variant="bodyMd" as="span">
                      Active
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </Page>
  );
}


export default CustomerDashboard;
