export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
export type UsageMetric = 'REVIEW_REQUEST' | 'EMAIL_SENT' | 'SMS_SENT' | 'API_CALL' | 'STORAGE_GB';

export interface PlanFeatures {
    emailReviewRequests: boolean;
    smsReviewRequests: boolean;
    autoReminders: boolean;
    customEmailTemplates: boolean;
    reviewIncentives: boolean;
    bulkImport: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
}

export interface PlanLimits {
    reviewRequestsPerMonth: number; // -1 for unlimited
    emailsPerMonth: number;
    smsPerMonth: number;
    storageGB: number;
    apiCallsPerDay: number;
    teamMembers: number;
}

export interface Plan {
    id: string;
    name: string;
    displayName: string;
    description: string;
    tier: PlanTier;
    price: number;
    billingInterval: BillingInterval;
    features: PlanFeatures;
    limits: PlanLimits;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Subscription {
    id: string;
    merchantId: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAt?: Date;
    canceledAt?: Date;
    trialStart?: Date;
    trialEnd?: Date;
    shopifyChargeId?: string;
    Plans: Plan;
}

export interface UsageStats {
    REVIEW_REQUEST?: number;
    EMAIL_SENT?: number;
    SMS_SENT?: number;
    API_CALL?: number;
    STORAGE_GB?: number;
}

export interface SubscriptionDetails {
    subscription: Subscription;
    usage: UsageStats;
    limits: PlanLimits;
}
