const PrivacyPolicy = () => {
    const lastUpdated = 'February 2026';
    const contactEmail = 'support@nudgenest.com';

    return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-[color:var(--color-text)]">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-sm opacity-60">Last updated: {lastUpdated}</p>
            </div>

            {/* Introduction */}
            <section className="mb-10">
                <p className="text-base leading-relaxed opacity-80">
                    Nudgenest ("we", "us", or "our") operates a Shopify app and associated web services that help
                    merchants collect, manage, and display customer reviews. This Privacy Policy explains what data
                    we collect, how we use it, how long we keep it, and how you can exercise your rights.
                </p>
            </section>

            {/* 1. Who we are */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">1. Who We Are</h2>
                <p className="text-base leading-relaxed opacity-80">
                    Nudgenest is a Shopify-integrated review platform. We process data on behalf of the merchants
                    who install our app ("merchants") and the customers who interact with their stores ("customers").
                    For data protection purposes, merchants are data controllers for their customers' data, and
                    Nudgenest acts as a data processor.
                </p>
            </section>

            {/* 2. Data We Collect */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>

                <h3 className="text-lg font-semibold mb-2 mt-6">From Merchants</h3>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Shop domain and Shopify store identifier</li>
                    <li>Merchant email address and business name</li>
                    <li>Billing information (processed via Shopify's billing API — we do not store card details)</li>
                    <li>App configuration preferences (email content, reminder settings, publish thresholds)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-6">From Customers (via Merchant Orders)</h3>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Customer email address</li>
                    <li>Customer name</li>
                    <li>Customer phone number (if provided in the Shopify order)</li>
                    <li>Order details: order number, purchased items, currency</li>
                    <li>Review content: star rating, written review, uploaded media (if any)</li>
                </ul>
            </section>

            {/* 3. How We Use Data */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Send review request emails to customers on behalf of merchants</li>
                    <li>Send reminder emails according to merchant-configured schedules</li>
                    <li>Display collected reviews in the merchant's storefront widget</li>
                    <li>Provide merchants with review analytics and management tools</li>
                    <li>Process billing and subscription management via Shopify</li>
                    <li>Improve our service and diagnose technical issues</li>
                </ul>
                <p className="text-base leading-relaxed opacity-80 mt-4">
                    We never sell customer data to third parties or use it for advertising purposes.
                </p>
            </section>

            {/* 4. Data Sharing */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
                <p className="text-base leading-relaxed opacity-80 mb-4">
                    We share data only with the following service providers, under strict data processing agreements:
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li><strong>Shopify</strong> — order and merchant data originate from Shopify's platform</li>
                    <li><strong>Resend</strong> — transactional email delivery for review requests and reminders</li>
                    <li><strong>Google Cloud</strong> — infrastructure hosting (Cloud Run, Pub/Sub) in the EU (europe-west1)</li>
                    <li><strong>MongoDB Atlas</strong> — database storage for reviews and merchant configuration</li>
                    <li><strong>Sentry</strong> — error monitoring (no PII is intentionally sent to Sentry)</li>
                </ul>
            </section>

            {/* 5. Data Retention */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>
                        <strong>While the app is installed:</strong> all merchant and customer data is retained
                        to support app functionality.
                    </li>
                    <li>
                        <strong>After app uninstall:</strong> all data for the shop is permanently deleted
                        within 48 hours of receiving Shopify's shop/redact webhook, in compliance with Shopify's
                        GDPR requirements.
                    </li>
                    <li>
                        <strong>Customer data requests:</strong> upon receiving a customers/redact request from
                        Shopify, we anonymise all PII (email, name, phone) within 30 days while retaining
                        aggregate review content for merchant analytics.
                    </li>
                </ul>
            </section>

            {/* 6. Your Rights */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-base leading-relaxed opacity-80 mb-4">
                    If you are a customer whose data we hold, you have the following rights (subject to applicable law):
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li><strong>Access:</strong> request a copy of the data we hold about you</li>
                    <li><strong>Rectification:</strong> request correction of inaccurate data</li>
                    <li><strong>Erasure:</strong> request deletion of your personal data</li>
                    <li><strong>Restriction:</strong> request that we limit how we use your data</li>
                    <li><strong>Portability:</strong> receive your data in a structured, machine-readable format</li>
                    <li><strong>Objection:</strong> object to processing based on our legitimate interests</li>
                </ul>
                <p className="text-base leading-relaxed opacity-80 mt-4">
                    To exercise these rights, please contact the merchant whose store you purchased from, or
                    contact us directly at{' '}
                    <a href={`mailto:${contactEmail}`} className="underline">
                        {contactEmail}
                    </a>.
                </p>
            </section>

            {/* 7. Security */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
                <p className="text-base leading-relaxed opacity-80">
                    We implement industry-standard security measures including TLS encryption in transit,
                    encrypted storage at rest, HMAC verification for all Shopify webhook payloads, and
                    access controls limited to authorised personnel. We use Sentry for error monitoring
                    and maintain audit logs of data processing activities.
                </p>
            </section>

            {/* 8. Cookies */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
                <p className="text-base leading-relaxed opacity-80">
                    Our customer-facing review widget does not set any tracking cookies. The merchant
                    Shopify dashboard app uses session tokens managed by Shopify's authentication system.
                    Our landing page uses no analytics or advertising cookies.
                </p>
            </section>

            {/* 9. Changes */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-base leading-relaxed opacity-80">
                    We may update this policy from time to time. Material changes will be communicated to
                    merchants via email. Continued use of the app after changes constitutes acceptance of
                    the updated policy.
                </p>
            </section>

            {/* 10. Contact */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <p className="text-base leading-relaxed opacity-80">
                    For privacy-related questions or to exercise your rights, please contact us at:
                </p>
                <div className="mt-4 p-4 rounded-lg bg-[color:var(--color-surface)] opacity-80">
                    <p className="font-semibold">Nudgenest</p>
                    <p>
                        Email:{' '}
                        <a href={`mailto:${contactEmail}`} className="underline">
                            {contactEmail}
                        </a>
                    </p>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
