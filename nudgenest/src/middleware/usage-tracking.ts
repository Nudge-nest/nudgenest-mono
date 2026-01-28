import Hapi from '@hapi/hapi';
import BillingService from '../services/billing';

/**
 * Middleware to track API usage
 */
export const apiUsageTracking = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    if (request.auth.isAuthenticated && request.auth.credentials) {
        const { merchantId } = request.auth.credentials as any;

        try {
            await BillingService.trackUsage({
                merchantId,
                metricType: 'API_CALL',
                quantity: 1,
            });
        } catch (error: any) {
            request.log(['warn', 'usage-tracking'], `API usage tracking failed: ${error.message}`);
            // Don't block the request if usage tracking fails, but log it
            if (error.message.includes('limit exceeded')) {
                return h.response({ error: 'API usage limit exceeded' }).code(429).takeover();
            }
        }
    }

    return h.continue;
};

/**
 * Track email sending usage
 */
export async function trackEmailUsage(merchantId: string, count: number = 1) {
    try {
        await BillingService.trackUsage({
            merchantId,
            metricType: 'EMAIL_SENT',
            quantity: count,
        });
    } catch (error: any) {
        console.error('Email usage tracking failed:', error.message);
        throw error;
    }
}

/**
 * Track SMS sending usage
 */
export async function trackSMSUsage(merchantId: string, count: number = 1) {
    try {
        await BillingService.trackUsage({
            merchantId,
            metricType: 'SMS_SENT',
            quantity: count,
        });
    } catch (error: any) {
        console.error('SMS usage tracking failed:', error.message);
        throw error;
    }
}

/**
 * Track review request usage
 */
export async function trackReviewRequestUsage(merchantId: string, count: number = 1) {
    try {
        await BillingService.trackUsage({
            merchantId,
            metricType: 'REVIEW_REQUEST',
            quantity: count,
        });
    } catch (error: any) {
        console.error('Review request usage tracking failed:', error.message);
        throw error;
    }
}

/**
 * Track storage usage
 */
export async function trackStorageUsage(merchantId: string, sizeGB: number) {
    try {
        await BillingService.trackUsage({
            merchantId,
            metricType: 'STORAGE_GB',
            quantity: sizeGB,
        });
    } catch (error: any) {
        console.error('Storage usage tracking failed:', error.message);
        throw error;
    }
}
