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
    storeName?: string;
    storeDomain?: string;
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
                    subject: data.subjectOverride || (data.storeName
                        ? `${data.userName}, how was your recent order from ${data.storeName}?`
                        : `${data.userName}, how was your recent purchase?`),
                    mainMessage: data.bodyOverride || `Your feedback helps other shoppers make confident decisions — and it only takes a moment. We'd love to hear what you think.`,
                    showRating: true,
                    showItems: true,
                    ctaButton: {
                        text: data.buttonTextOverride || 'Write a Review',
                        link: `${reviewBaseUrl}/review/${data.reviewId}`,
                    },
                };

            case EmailType.REVIEW_REMINDER:
                return {
                    subject: data.reminderSubjectOverride || (data.storeName
                        ? `A quick reminder — how was your order from ${data.storeName}?`
                        : `A quick reminder — how was your recent order?`),
                    mainMessage: data.reminderBodyOverride || `We noticed you haven't had a chance to review your recent purchase yet. We'd love to hear what you think!`,
                    showRating: true,
                    showItems: true,
                    additionalMessage: `Haven't received your order yet? No worries — come back to this email once it arrives.`,
                    ctaButton: {
                        text: data.reminderButtonTextOverride || 'Review Now',
                        link: `${reviewBaseUrl}/review/${data.reviewId}`,
                    },
                };

            case EmailType.MERCHANT_WELCOME:
                return {
                    subject: `Welcome to NudgeNest, ${data.userName}`,
                    mainMessage: `You're all set. NudgeNest will start helping you collect and showcase customer reviews as soon as your first order comes in.`,
                    showRating: false,
                    showItems: false,
                    ctaButton: {
                        text: 'Go to Dashboard',
                        link: data.shopId ? `https://${data.shopId}/admin/apps` : (process.env.SHOPIFY_APP_URL || '#'),
                    },
                    secondaryButtons: [
                        { text: 'Contact Support', link: 'mailto:hello@nudgenest.io' },
                    ],
                };

            case EmailType.MERCHANT_VERIFICATION:
                return {
                    subject: `Verify your NudgeNest account`,
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
                    subject: `Your NudgeNest account is scheduled for deletion`,
                    mainMessage: `Your account has been scheduled for deletion. You have 30 days to cancel before all data is permanently removed.`,
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
                    mainMessage: `Your review makes a real difference. Thank you for taking the time — it means a lot to the team.`,
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
                    subject: `Review request sent`,
                    mainMessage: `A review request has been sent to your customer on your behalf. Head to your dashboard to track responses.`,
                    showRating: false,
                    showItems: true,
                    additionalMessage: ``,
                };

            case EmailType.COMPLETED_REVIEW_MERCHANT:
                return {
                    subject: `You have a new review`,
                    mainMessage: `A customer just left a review. Visit your dashboard to read it and decide whether to publish it.`,
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
                companyName: 'NudgeNest',
                supportEmail: process.env.SUPPORT_EMAIL || 'support@nudgenest.app',
            };

            // Render HTML
            const html = ejs.render(template, templateData);

            // Send email via Resend
            const fromDisplay = data.storeName
                ? `${data.storeName} <${this.fromEmail}>`
                : `NudgeNest Team <${this.fromEmail}>`;
            const result = await this.resend.emails.send({
                from: fromDisplay,
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
