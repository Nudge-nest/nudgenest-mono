"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/prisma/prisma/client");
const prisma = new client_1.PrismaClient();
const plans = [
    {
        name: 'free',
        displayName: 'Free',
        description: 'Perfect for testing and small shops',
        tier: 'FREE',
        price: 0,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: false,
            autoReminders: false,
            customEmailTemplates: false,
            reviewIncentives: false,
            bulkImport: false,
            advancedAnalytics: false,
            apiAccess: false,
            whiteLabel: false,
            prioritySupport: false,
            dedicatedAccountManager: false,
        },
        limits: {
            reviewRequestsPerMonth: 50,
            emailsPerMonth: 50,
            smsPerMonth: 0,
            storageGB: 0.5,
            apiCallsPerDay: 100,
            teamMembers: 1,
        },
    },
    {
        name: 'starter',
        displayName: 'Starter',
        description: 'For growing businesses',
        tier: 'STARTER',
        price: 29,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: true,
            autoReminders: true,
            customEmailTemplates: true,
            reviewIncentives: false,
            bulkImport: false,
            advancedAnalytics: false,
            apiAccess: false,
            whiteLabel: false,
            prioritySupport: false,
            dedicatedAccountManager: false,
        },
        limits: {
            reviewRequestsPerMonth: 500,
            emailsPerMonth: 500,
            smsPerMonth: 100,
            storageGB: 2,
            apiCallsPerDay: 1000,
            teamMembers: 2,
        },
    },
    {
        name: 'growth',
        displayName: 'Growth',
        description: 'For established stores',
        tier: 'GROWTH',
        price: 79,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: true,
            autoReminders: true,
            customEmailTemplates: true,
            reviewIncentives: true,
            bulkImport: true,
            advancedAnalytics: true,
            apiAccess: true,
            whiteLabel: false,
            prioritySupport: false,
            dedicatedAccountManager: false,
        },
        limits: {
            reviewRequestsPerMonth: 2000,
            emailsPerMonth: 2000,
            smsPerMonth: 500,
            storageGB: 10,
            apiCallsPerDay: 5000,
            teamMembers: 5,
        },
    },
    {
        name: 'pro',
        displayName: 'Pro',
        description: 'For high-volume merchants',
        tier: 'PRO',
        price: 199,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: true,
            autoReminders: true,
            customEmailTemplates: true,
            reviewIncentives: true,
            bulkImport: true,
            advancedAnalytics: true,
            apiAccess: true,
            whiteLabel: true,
            prioritySupport: true,
            dedicatedAccountManager: false,
        },
        limits: {
            reviewRequestsPerMonth: 10000,
            emailsPerMonth: 10000,
            smsPerMonth: 2000,
            storageGB: 50,
            apiCallsPerDay: 20000,
            teamMembers: 15,
        },
    },
    {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Custom solutions for large organizations',
        tier: 'ENTERPRISE',
        price: 499,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: true,
            autoReminders: true,
            customEmailTemplates: true,
            reviewIncentives: true,
            bulkImport: true,
            advancedAnalytics: true,
            apiAccess: true,
            whiteLabel: true,
            prioritySupport: true,
            dedicatedAccountManager: true,
        },
        limits: {
            reviewRequestsPerMonth: -1, // unlimited
            emailsPerMonth: -1,
            smsPerMonth: -1,
            storageGB: 200,
            apiCallsPerDay: -1,
            teamMembers: -1,
        },
    },
];
function seedPlans() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Seeding billing plans...');
        for (const plan of plans) {
            const existing = yield prisma.plans.findUnique({
                where: { name: plan.name },
            });
            if (existing) {
                console.log(`✓ Plan "${plan.displayName}" already exists, skipping...`);
                continue;
            }
            yield prisma.plans.create({
                data: plan,
            });
            console.log(`✓ Created plan: ${plan.displayName} ($${plan.price}/mo)`);
        }
        console.log('✅ Billing plans seeded successfully!');
    });
}
seedPlans()
    .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
