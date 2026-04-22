const ContactUs = () => {
    const contactEmail = 'hello@nudgenest.io';

    return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-[color:var(--color-dark)]">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-sm opacity-60">We'd love to hear from you</p>
            </div>

            {/* Intro */}
            <section className="mb-10">
                <p className="text-base leading-relaxed opacity-80">
                    Have a question about Nudgenest, need help with your account, or want to share feedback?
                    Reach out to us and we'll get back to you as soon as possible.
                </p>
            </section>

            {/* Email */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Email Us</h2>
                <p className="text-base leading-relaxed opacity-80 mb-4">
                    Send us an email for general enquiries, billing questions, or technical support:
                </p>
                <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-x-2 text-lg font-semibold text-[color:var(--color-main)] hover:opacity-80 transition-opacity"
                >
                    {contactEmail}
                </a>
                <p className="text-sm opacity-60 mt-3">
                    We typically respond within 1–2 business days.
                </p>
            </section>

            {/* What to include */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">What to Include</h2>
                <p className="text-base leading-relaxed opacity-80 mb-3">
                    To help us respond faster, please include:
                </p>
                <ul className="list-disc pl-6 space-y-2 opacity-80">
                    <li>Your Shopify store domain (e.g. <span className="font-mono text-sm">yourstore.myshopify.com</span>)</li>
                    <li>A description of your question or issue</li>
                    <li>Any relevant screenshots or error messages</li>
                </ul>
            </section>

            {/* Feature requests */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4">Feature Requests & Feedback</h2>
                <p className="text-base leading-relaxed opacity-80">
                    We're always improving Nudgenest based on merchant feedback. If you have a feature idea or
                    suggestion, we'd love to hear it — just drop us an email at{' '}
                    <a
                        href={`mailto:${contactEmail}`}
                        className="text-[color:var(--color-main)] hover:opacity-80 transition-opacity"
                    >
                        {contactEmail}
                    </a>{' '}
                    with the subject line <span className="font-semibold">Feature Request</span>.
                </p>
            </section>
        </div>
    );
};

export default ContactUs;
