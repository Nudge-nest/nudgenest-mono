import { Link } from 'react-router';

const TermsAndConditions = () => {
    const lastUpdated = 'April 2026';
    const contactEmail = 'hello@nudgenest.io';

    return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-[color:var(--color-dark)]">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-sm opacity-60">Last updated: {lastUpdated}</p>
            </div>

            {/* Introduction */}
            <section className="mb-10">
                <p className="text-base leading-relaxed opacity-80">
                    These Terms of Service ("Terms") govern your use of the Nudgenest Shopify application and
                    associated web services ("Service") operated by Nudgenest ("we", "us", or "our"). By installing
                    or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the
                    Service.
                </p>
            </section>

            {/* 1. Service Description */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">1. Service Description</h2>
                <p className="text-base leading-relaxed opacity-80">
                    Nudgenest is a review collection and management platform for Shopify merchants. The Service
                    enables merchants to send automated review request emails to customers, collect product and store
                    reviews, display reviews via a public widget, and manage review moderation and publishing
                    settings through a merchant dashboard.
                </p>
            </section>

            {/* 2. Merchant Accounts */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">2. Merchant Accounts</h2>
                <p className="text-base leading-relaxed opacity-80 mb-3">
                    Access to the Service requires a valid Shopify store and installation of the Nudgenest app from
                    the Shopify App Store. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Maintaining the security of your Shopify account credentials</li>
                    <li>All activity that occurs under your merchant account</li>
                    <li>Ensuring your use of the Service complies with applicable laws and Shopify's Partner Program policies</li>
                    <li>Providing accurate information when configuring the Service</li>
                </ul>
            </section>

            {/* 3. Acceptable Use */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use</h2>
                <p className="text-base leading-relaxed opacity-80 mb-3">
                    You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Send unsolicited communications to individuals who have not purchased from your store</li>
                    <li>Fabricate, incentivise, or manipulate customer reviews in a misleading way</li>
                    <li>Upload or transmit content that is unlawful, harmful, or violates any third-party rights</li>
                    <li>Attempt to gain unauthorised access to the Service, its infrastructure, or other merchants' data</li>
                    <li>Use the Service in a manner that violates Shopify's Acceptable Use Policy or App Store guidelines</li>
                    <li>Reverse engineer, decompile, or otherwise attempt to extract the source code of the Service</li>
                </ul>
            </section>

            {/* 4. Customer Data */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">4. Customer Data</h2>
                <p className="text-base leading-relaxed opacity-80 mb-3">
                    The Service processes personal data belonging to your customers (such as email addresses and
                    order details) on your behalf. As a merchant, you are the data controller for this data. You
                    confirm that:
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>You have a lawful basis for sharing customer data with Nudgenest for the purpose of review requests</li>
                    <li>Your privacy policy informs customers that their data may be used for post-purchase review communications</li>
                    <li>You will promptly action any customer data deletion requests by using the tools provided in the merchant dashboard or by contacting us</li>
                </ul>
                <p className="text-base leading-relaxed opacity-80 mt-4">
                    We handle customer data in accordance with our{' '}
                    <Link to="/privacy" className="text-[color:var(--color-main)] hover:opacity-80 transition-opacity">
                        Privacy Policy
                    </Link>.
                </p>
            </section>

            {/* 5. Billing and Subscriptions */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">5. Billing and Subscriptions</h2>
                <p className="text-base leading-relaxed opacity-80 mb-3">
                    Paid plans are billed monthly or annually through Shopify's billing system. By selecting a paid
                    plan, you authorise Shopify to charge your account on our behalf.
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Subscription fees are non-refundable except where required by applicable law</li>
                    <li>Plan changes take effect at the start of the next billing cycle unless otherwise stated</li>
                    <li>We reserve the right to change pricing with at least 30 days' notice</li>
                    <li>Downgrading to the Free plan cancels your paid subscription and removes access to paid features at the end of the current billing period</li>
                </ul>
            </section>

            {/* 6. Intellectual Property */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                <p className="text-base leading-relaxed opacity-80">
                    The Service, including all software, designs, trademarks, and content created by Nudgenest,
                    remains our exclusive property. You retain ownership of your store's content and customer reviews
                    collected through the Service. You grant us a limited, non-exclusive licence to store and display
                    that content solely to provide the Service to you.
                </p>
            </section>

            {/* 7. Disclaimers */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
                <p className="text-base leading-relaxed opacity-80">
                    The Service is provided "as is" and "as available" without warranties of any kind, express or
                    implied. We do not warrant that the Service will be uninterrupted, error-free, or free from
                    security vulnerabilities. We do not guarantee the delivery of review request emails, as delivery
                    is subject to third-party email service providers and recipient email filters.
                </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-base leading-relaxed opacity-80">
                    To the maximum extent permitted by law, Nudgenest shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages, including but not limited to loss of
                    revenue, loss of data, or loss of business, arising from your use of or inability to use the
                    Service. Our total aggregate liability to you shall not exceed the fees paid by you to Nudgenest
                    in the three months preceding the event giving rise to the claim.
                </p>
            </section>

            {/* 9. Termination */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
                <p className="text-base leading-relaxed opacity-80">
                    You may stop using the Service at any time by uninstalling the Nudgenest app from your Shopify
                    store. We may suspend or terminate your access to the Service immediately, without prior notice,
                    if you breach these Terms or if we are required to do so by law. Upon termination, your right to
                    use the Service ceases. We will retain your data for a period of 30 days after termination, after
                    which it may be permanently deleted.
                </p>
            </section>

            {/* 10. Changes to Terms */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">10. Changes to These Terms</h2>
                <p className="text-base leading-relaxed opacity-80">
                    We may update these Terms from time to time. When we do, we will update the "Last updated" date
                    at the top of this page. Where changes are material, we will notify you via the email address
                    associated with your merchant account at least 14 days before the changes take effect. Your
                    continued use of the Service after the effective date constitutes acceptance of the updated Terms.
                </p>
            </section>

            {/* 11. Governing Law */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
                <p className="text-base leading-relaxed opacity-80">
                    These Terms are governed by and construed in accordance with applicable law. Any disputes arising
                    from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the
                    competent courts.
                </p>
            </section>

            {/* 12. Contact */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
                <p className="text-base leading-relaxed opacity-80">
                    If you have questions about these Terms, please contact us at{' '}
                    <a
                        href={`mailto:${contactEmail}`}
                        className="text-[color:var(--color-main)] hover:opacity-80 transition-opacity"
                    >
                        {contactEmail}
                    </a>.
                </p>
            </section>
        </div>
    );
};

export default TermsAndConditions;
