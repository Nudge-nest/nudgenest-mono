import {useFetcher, useRevalidator} from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {Banner, BlockStack, Button, Card, FormLayout, InlineStack, Layout, Page, TextField, Text} from "@shopify/polaris";
import {useCallback, useEffect, useState} from "react";
import type {IShopifyBusinessEntityData, IShopifyShop} from "../utilities";

function RegistrationPage({ shopInfo, businessInfo, defaultPlan }: {
  shopInfo: IShopifyShop;
  businessInfo: IShopifyBusinessEntityData;
  defaultPlan?: {
    id: string;
    name: string;
    displayName: string;
    tier: string;
    price: number;
    billingInterval: string;
  } | null;
}) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format plan display dynamically from database or fallback
  const planDisplay = defaultPlan
    ? `${defaultPlan.displayName} - $${defaultPlan.price.toFixed(2)}/month`
    : "Free - $0.00/month";

  const handleRegister = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsSubmitting(false);
      if (fetcher.data.success) {
        // Registration successful - give backend a moment then revalidate
        setTimeout(() => {
          revalidator.revalidate();
        }, 500);
      }
    }
  }, [fetcher, revalidator]);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Welcome Banner */}
            <Banner>
              <p>
                Thank you for installing Nudge-nest! Complete your registration
                to start collecting and displaying customer reviews.
              </p>
            </Banner>

            {/* Registration Card */}
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2">
                    Complete Your Setup
                  </Text>
                  <Text variant="bodyMd" as="p">
                    We've detected your Shopify store. Review your information
                    below and click "Complete Registration" to get started.
                  </Text>
                </BlockStack>

                <fetcher.Form method="post">
                  <input type="hidden" name="_action" value="register" />

                  <FormLayout>
                    <TextField
                      label="Store Name"
                      value={shopInfo.name}
                      disabled
                      autoComplete="off"
                    />

                    <TextField
                      label="Store Domain"
                      value={shopInfo.myshopifyDomain}
                      disabled
                      autoComplete="off"
                    />

                    <TextField
                      label="Email"
                      value={shopInfo.email}
                      disabled
                      autoComplete="off"
                    />

                    <TextField
                      label="Currency"
                      value={shopInfo.currencyCode}
                      disabled
                      autoComplete="off"
                    />

                    <TextField
                      label="Plan"
                      value={planDisplay}
                      disabled
                      autoComplete="off"
                      helpText="You can upgrade to a paid plan anytime from the dashboard"
                    />

                    {fetcher.data?.success === false && (
                      <Banner >
                        <p>{fetcher.data.message || "Registration failed. Please try again."}</p>
                      </Banner>
                    )}

                    <Button
                      size="large"
                      submit
                      loading={isSubmitting || fetcher.state === "submitting"}
                      onClick={handleRegister}
                    >
                      Complete Registration
                    </Button>
                  </FormLayout>
                </fetcher.Form>
              </BlockStack>
            </Card>

            {/* What's Next Card */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  What happens next?
                </Text>

                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Text variant="bodyMd" as="span">✓</Text>
                    <Text variant="bodyMd" as="p">
                      Your account will be created with your Shopify store details
                    </Text>
                  </InlineStack>

                  <InlineStack gap="200" align="start">
                    <Text variant="bodyMd" as="span">✓</Text>
                    <Text variant="bodyMd" as="p">
                      You'll gain access to the configuration dashboard
                    </Text>
                  </InlineStack>

                  <InlineStack gap="200" align="start">
                    <Text variant="bodyMd" as="span">✓</Text>
                    <Text variant="bodyMd" as="p">
                      Start collecting reviews immediately after setup
                    </Text>
                  </InlineStack>

                  <InlineStack gap="200" align="start">
                    <Text variant="bodyMd" as="span">✓</Text>
                    <Text variant="bodyMd" as="p">
                      Customize email templates and review widgets
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default RegistrationPage;
