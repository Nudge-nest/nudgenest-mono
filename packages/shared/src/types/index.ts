/**
 * Shared TypeScript types and interfaces
 *
 * These types are used across backend, frontend, and Shopify app
 * to ensure type consistency throughout the monorepo.
 */

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
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

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type ReviewStatus = 'Pending' | 'Completed' | 'Failed';

export interface IUploadedMediaObject {
    id: string;
    mediaURL: string;
}

export interface IReviewItem {
    id: string;
    name: string;
    image?: string;
    [key: string]: any;
}

export interface IReviewResult {
    id?: string;
    value?: number;
    mediaURL?: string;
    media?: IUploadedMediaObject[];
    comment?: string;
}

export interface IReview {
    id?: string;
    merchantId: string;
    merchantBusinessId: string;
    shopId?: string;
    customerName?: string;
    customerEmail?: string;
    verified: boolean;
    replies?: any;
    items: IReviewItem[];
    result?: IReviewResult[];
    status: ReviewStatus;
    published?: boolean;
    merchantApiKey?: string;
    createdAt: string;
    updatedAt: string;
}

// ---------------------------------------------------------------------------
// Review Configuration
// ---------------------------------------------------------------------------

export type FieldType = 'text' | 'number' | 'select' | 'url' | 'image' | 'boolean' | 'json';

export enum ReminderPeriod {
    BIWEEKLY = 'BIWEEKLY',
    WEEKLY = 'WEEKLY',
    BIMONTHLY = 'BIMONTHLY',
    MONTHLY = 'MONTHLY',
}

export enum AutoPublishThreshold {
    THREESTARS = 'THREESTARS',
    FOURSTARS = 'FOURSTARS',
    FIVESTARS = 'FIVESTARS',
}

export interface IConfigField {
    key: string;
    value: string;
    description: string;
    type: FieldType;
}

export interface IPublishField extends IConfigField {
    key: 'autoPublish';
    type: 'select';
    value: 'THREESTARS' | 'FOURSTARS' | 'FIVESTARS';
}

export interface IReviewConfiguration {
    id?: string;
    merchantId: string;
    emailContent: IConfigField[];
    reminderEmailContent: IConfigField[];
    remindersFrequency: IConfigField[];
    emailSchedule?: IConfigField[];
    publish: IConfigField[];
    qrCode: IConfigField[];
    general: {
        shopReviewQuestions: IConfigField[];
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface IStrictReviewConfiguration {
    id?: string;
    merchantId: string;
    emailContent: Array<IConfigField & { key: 'subject' | 'body' | 'buttonText'; type: 'text' }>;
    reminderEmailContent: Array<IConfigField & { key: 'reminderSubject' | 'reminderBody' | 'reminderButtonText'; type: 'text' }>;
    remindersFrequency: Array<IConfigField & { key: 'remindersQty' | 'remindersPeriod'; type: 'number' | 'select' }>;
    emailSchedule?: Array<IConfigField & { key: 'initialEmailDelayDays'; type: 'number' }>;
    publish: IPublishField[];
    qrCode: Array<IConfigField & { key: 'qrCodeUrl' | 'qrCodeData'; type: 'url' | 'image' }>;
    general: {
        shopReviewQuestions: IConfigField[];
    };
    createdAt?: string;
    updatedAt?: string;
}
