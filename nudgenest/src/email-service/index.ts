import { Resend } from 'resend';
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'fs/promises';
import ejs from 'ejs';

config();

export interface EmailData {
    userName: string;
    email: string;
    type?: string;
    order_number?: string;
    items?: any[];
    reviewId?: string;
    unsubscribeUrl?: string;
    currency?: string;
    // Merchant-configurable overrides for review request / reminder emails
    subjectOverride?: string;
    bodyOverride?: string;
    buttonTextOverride?: string;
    reminderSubjectOverride?: string;
    reminderBodyOverride?: string;
    reminderButtonTextOverride?: string;
    [key: string]: any; // Allow additional properties
}

export interface EmailConfig {
    subject: string;
    mainMessage: string;
    showRating?: boolean;
    showItems?: boolean;
    ctaButton?: {
        text: string;
        link: string;
    };
    incentive?: {
        title: string;
        description: string;
    };
    additionalMessage?: string;
    secondaryButtons?: Array<{
        text: string;
        link: string;
    }>;
}

enum EmailType {
    REVIEW_REQUEST = 'new-review',
    REVIEW_REMINDER = 'reminder',
    MERCHANT_WELCOME = 'merchant-welcome',
    MERCHANT_VERIFICATION = 'merchant-verification',
    MERCHANT_DELETION = 'merchant-deletion',
    COMPLETED_REVIEW = 'completed-review',
    NEW_REVIEW_MERCHANT = 'new-review-merchant',
    COMPLETED_REVIEW_MERCHANT = 'completed-review-merchant',
}

class EmailService {
    private resend: Resend;
    private templateCache = new Map<string, string>();
    private fromEmail: string;

    constructor() {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.warn('⚠️  RESEND_API_KEY not found. Email sending will fail.');
        }
        this.resend = new Resend(resendApiKey);
        if (!process.env.RESEND_FROM_EMAIL) {
            throw new Error('Missing required env var: RESEND_FROM_EMAIL');
        }
        this.fromEmail = process.env.RESEND_FROM_EMAIL;
    }

    // Load and cache template
    private async loadTemplate(templateName: string): Promise<string> {
        if (!this.templateCache.has(templateName)) {
            const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
            const template = await fs.readFile(templatePath, 'utf-8');
            this.templateCache.set(templateName, template);
        }
        return this.templateCache.get(templateName)!;
    }
    // Get configuration based on email type
    private getEmailConfig(type: EmailType, data: EmailData): EmailConfig {
        const reviewBaseUrl = process.env.REVIEW_UI_BASE_URL;

        switch (type) {
            case EmailType.REVIEW_REQUEST:
                return {
                    subject: data.subjectOverride || `${data.userName}, how was your recent purchase?`,
                    mainMessage: data.bodyOverride || `We would be grateful if you shared how things look and feel. Your review helps us and the community that supports us, and it only takes a few seconds.`,
                    showRating: true,
                    showItems: true,
                    ctaButton: {
                        text: data.buttonTextOverride || 'Write a Review',
                        link: `${reviewBaseUrl}/review/${data.reviewId}`,
                    },
                };

            case EmailType.REVIEW_REMINDER:
                return {
                    subject: data.reminderSubjectOverride || `Quick reminder: Share your thoughts on order #${data.order_number}`,
                    mainMessage: data.reminderBodyOverride || `We noticed you haven't had a chance to review your recent purchase yet. We'd love to hear what you think!`,
                    showRating: true,
                    showItems: true,
                    additionalMessage: `<strong>⏰ Limited time:</strong> Leave a review in the next 48 hours and receive 10% off your next purchase!`,
                    ctaButton: {
                        text: data.reminderButtonTextOverride || 'Review Now',
                        link: `${reviewBaseUrl}/review/${data.reviewId}`,
                    },
                };

            case EmailType.MERCHANT_WELCOME:
                return {
                    subject: `Welcome to Nudge Nest, ${data.userName}!`,
                    mainMessage: `Congratulations on joining Nudge Nest! We're excited to help you collect and showcase customer reviews.`,
                    showRating: false,
                    showItems: false,
                    ctaButton: {
                        text: 'Go to Dashboard',
                        link: process.env.MERCHANT_DASHBOARD_URL || '#',
                    },
                    secondaryButtons: [
                        { text: 'View Documentation', link: process.env.DOCS_URL || '#' },
                        { text: 'Contact Support', link: process.env.SUPPORT_URL || '#' },
                    ],
                };

            case EmailType.MERCHANT_VERIFICATION:
                return {
                    subject: `Verify your Nudge Nest merchant account`,
                    mainMessage: `Thank you for signing up! Please verify your email address to activate your merchant account.`,
                    showRating: false,
                    showItems: false,
                    ctaButton: {
                        text: 'Verify Email',
                        link: data.verificationLink || '#',
                    },
                    additionalMessage: `This verification link will expire in 24 hours.`,
                };

            case EmailType.MERCHANT_DELETION:
                return {
                    subject: `Your Nudge Nest account has been scheduled for deletion`,
                    mainMessage: `Your account has been scheduled for deletion and will be permanently deleted in 30 days.`,
                    showRating: false,
                    showItems: false,
                    additionalMessage: `If this was a mistake, you can cancel the deletion within the next 30 days.`,
                    ctaButton: {
                        text: 'Cancel Deletion',
                        link: `${process.env.MERCHANT_DASHBOARD_URL}/settings/cancel-deletion`,
                    },
                };

            case EmailType.COMPLETED_REVIEW:
                return {
                    subject: `Thank you for your review, ${data.userName}!`,
                    mainMessage: `We truly appreciate you taking the time to share your feedback.`,
                    showRating: false,
                    showItems: true,
                    incentive: data.hasIncentive
                        ? {
                              title: "🎁 Here's your reward!",
                              description: 'Use code THANKYOU10 for 10% off your next purchase',
                          }
                        : undefined,
                };

            case EmailType.NEW_REVIEW_MERCHANT:
                return {
                    subject: `New review request have been sent!`,
                    mainMessage: `Great news! we have just sent a new review request on your behalf. Check your dashboard to read the full review.`,
                    showRating: false,
                    showItems: true,
                    additionalMessage: ``,
                };

            case EmailType.COMPLETED_REVIEW_MERCHANT:
                return {
                    subject: `New review received!`,
                    mainMessage: `Great news! a client just left a review. Check your dashboard to read the full review.`,
                    showRating: false,
                    showItems: true,
                    additionalMessage: ``,
                };

            default:
                return {
                    subject: `Message from Nudge Nest`,
                    mainMessage: `Thank you for being our valued customer.`,
                };
        }
    }

    // Format items for display
    private formatItems(items: any[] = []): any[] {
        return items.map((item) => ({
            ...item,
            formattedPrice: item.price,
            imageUrl: item.image || '/placeholder.png',
        }));
    }

    // Send email
    async sendEmail(data: EmailData): Promise<boolean> {
        try {
            // Get email configuration
            const config = this.getEmailConfig(data.type as EmailType, data);

            // Load template
            const template = await this.loadTemplate('master');

            // Prepare template data
            const templateData = {
                ...data,
                ...config,
                formattedItems: this.formatItems(data.items),
                currentYear: new Date().getFullYear(),
                reviewBaseUrl: process.env.REVIEW_UI_BASE_URL,
                companyName: 'Nudge Nest',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@nudgenest.app',
            };

            // Render HTML
            const html = ejs.render(template, templateData);

            // Send email via Resend
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: data.email,
                subject: config.subject,
                html: html,
                headers: data.unsubscribeUrl ? {
                    'List-Unsubscribe': `<${data.unsubscribeUrl}>`,
                } : undefined,
            });

            if (result.error) {
                console.error(`❌ Failed to send email to ${data.email}:`, result.error);

                // Provide helpful message for validation errors
                if (result.error.name === 'validation_error' && result.error.message?.includes('verify a domain')) {
                    console.log('\n⚠️  RESEND DOMAIN VERIFICATION REQUIRED:');
                    console.log('   1. Go to https://resend.com/domains');
                    console.log('   2. Add and verify your domain');
                    console.log('   3. Update RESEND_FROM_EMAIL in .env to use your verified domain');
                    console.log('   4. For testing, you can only send to your Resend account email\n');
                }

                return false;
            }

            console.log(`✅ Email sent to ${data.email}: ${result.data?.id}`);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    // Convenience methods
    async sendReviewRequest(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.REVIEW_REQUEST });
    }

    async sendReviewReminder(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.REVIEW_REMINDER });
    }

    async sendMerchantWelcome(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.MERCHANT_WELCOME });
    }

    async sendMerchantVerification(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.MERCHANT_VERIFICATION });
    }

    async sendCompletedReview(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.COMPLETED_REVIEW });
    }

    async sendNewReviewToMerchant(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.NEW_REVIEW_MERCHANT });
    }
    async sendCompletedReviewToMerchant(data: EmailData): Promise<boolean> {
        return this.sendEmail({ ...data, type: EmailType.COMPLETED_REVIEW_MERCHANT });
    }

    // Batch send (Resend supports batch API but we'll keep it simple)
    async sendBatch(emails: EmailData[]): Promise<number> {
        let successCount = 0;
        for (const email of emails) {
            const success = await this.sendEmail(email);
            if (success) successCount++;
            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return successCount;
    }
}

export default new EmailService();
