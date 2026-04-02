import {BlockStack, Button, Card, InlineStack, Layout, Page, Toast, Text, Frame} from "@shopify/polaris";
import {useCallback, useState, useEffect} from "react";
import { useLocation } from "@remix-run/react";
import type {IShopifyShop, ReviewStats, SubscriptionDetails, Plan} from "../utilities";
import {BillingCard} from "../components/BillingCard";

function CustomerDashboard({ merchantData, shopInfo, reviewStats, subscriptionDetails, allPlans, reviewUiBaseUrl, billingStatus: initialBillingStatus }: {
  merchantData: any;
  shopInfo: IShopifyShop;
  reviewStats?: ReviewStats | null;
  subscriptionDetails?: SubscriptionDetails | null;
  allPlans?: Plan[] | null;
  reviewUiBaseUrl?: string | null;
  billingStatus?: string | null;
}) {
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  }, []);

  const location = useLocation();

  // Check for billing status from the cookie (set by api.billing.callback and
  // passed via loader data). Format: "success:PLANNAME" | "declined" | "success"
  useEffect(() => {
    if (!initialBillingStatus) return;
    if (initialBillingStatus.startsWith('success')) {
      const plan = initialBillingStatus.includes(':') ? initialBillingStatus.split(':')[1] : null;
      const message = plan === 'FREE'
        ? '✅ Downgraded to Free plan.'
        : plan
          ? `✅ Successfully upgraded to ${plan} plan!`
          : '✅ Plan updated successfully!';
      showToast(message);
    } else if (initialBillingStatus === 'declined') {
      showToast('❌ Billing charge was declined. Please try again.', true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also check for billing status messages from URL params (legacy / direct nav)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const billingStatus = params.get('billing_status');
    const billingError = params.get('billing_error');
    const plan = params.get('plan');

    if (billingStatus === 'success') {
      showToast(plan === 'FREE' ? '✅ Downgraded to Free plan.' : `✅ Successfully upgraded to ${plan} plan!`);
      window.history.replaceState({}, '', location.pathname);
    } else if (billingStatus === 'already_active') {
      showToast(`You are already on the ${plan} plan.`);
      window.history.replaceState({}, '', location.pathname);
    } else if (billingStatus === 'declined') {
      showToast('❌ Billing charge was declined. Please try again.', true);
      window.history.replaceState({}, '', location.pathname);
    } else if (billingError) {
      showToast(`❌ Billing error: ${decodeURIComponent(billingError)}`, true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, showToast]);

  const openConfigModal = useCallback(() => {
    const merchantId = merchantData?.id || merchantData?.shopId?.split('/')[4] || shopInfo.id.split('/')[4];
    const configUrl = `${reviewUiBaseUrl}/configs/${merchantId}?apiKey=${merchantData?.apiKey ?? ''}`;

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
  }, [merchantData, shopInfo, reviewUiBaseUrl]);

  const shopDomain = merchantData?.domains || shopInfo.myshopifyDomain;
  const merchantId = merchantData?.id || merchantData?.shopId?.split('/')[4] || shopInfo.id.split('/')[4];

  return (
    <Frame>
      <Page>
        <BlockStack gap="500">
          {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #6b7280',
          borderRadius: '8px',
          padding: '16px 20px',
        }}>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h2" fontWeight="semibold" tone="base">
              Welcome Back! 👋
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Your review system is active and collecting customer feedback.
              Manage your settings and view analytics below.
            </Text>
          </BlockStack>
        </div>

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
                      {reviewStats?.totalReviews ?? 0}
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Total Reviews
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100" align="center">
                    <Text variant="heading2xl" as="p">
                      {reviewStats?.averageRating ?? '0.0'}
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Average Rating
                    </Text>
                  </BlockStack>

                  {/*<BlockStack gap="100" align="center">
                    <Text variant="heading2xl" as="p">
                      {reviewStats?.responseRate ?? 0}%
                    </Text>
                    <Text variant="bodySm" as="p" >
                      Response Rate
                    </Text>
                  </BlockStack>*/}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Billing Section */}
          <Layout.Section>
            <BillingCard
              subscription={subscriptionDetails?.subscription}
              usage={subscriptionDetails?.usage}
              limits={subscriptionDetails?.limits}
              allPlans={allPlans}
            />
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
    </Frame>
  );
}


export default CustomerDashboard;
