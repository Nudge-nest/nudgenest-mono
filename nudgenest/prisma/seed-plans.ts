import { PrismaClient } from '../generated/prisma/prisma/client';

const prisma = new PrismaClient();

// "Loox Killer" Aggressive Pricing - Undercutting competitors by 50-90%
const plans = [
    {
        name: 'free',
        displayName: 'Free',
        description: '25 review requests/month',
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
            reviewRequestsPerMonth: 25,
            emailsPerMonth: 125,
            smsPerMonth: 0,
            storageGB: 0.5,
            apiCallsPerDay: 100,
            teamMembers: 1,
        },
    },
    {
        name: 'starter',
        displayName: 'Starter',
        description: '300 review requests/month',
        tier: 'STARTER',
        price: 4.99,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: false,
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
            reviewRequestsPerMonth: 300,
            emailsPerMonth: 1500,
            smsPerMonth: 0,
            storageGB: 1,
            apiCallsPerDay: 500,
            teamMembers: 1,
        },
    },
    {
        name: 'growth',
        displayName: 'Growth',
        description: '1,000 review requests/month',
        tier: 'GROWTH',
        price: 12.99,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: false,
            autoReminders: true,
            customEmailTemplates: true,
            reviewIncentives: true,
            bulkImport: false,
            advancedAnalytics: true,
            apiAccess: false,
            whiteLabel: false,
            prioritySupport: true,
            dedicatedAccountManager: false,
        },
        limits: {
            reviewRequestsPerMonth: 1000,
            emailsPerMonth: 5000,
            smsPerMonth: 0,
            storageGB: 5,
            apiCallsPerDay: 2000,
            teamMembers: 3,
        },
    },
    {
        name: 'pro',
        displayName: 'Pro',
        description: '5,000 review requests/month',
        tier: 'PRO',
        price: 29.99,
        billingInterval: 'MONTHLY',
        features: {
            emailReviewRequests: true,
            smsReviewRequests: false,
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
            reviewRequestsPerMonth: 5000,
            emailsPerMonth: 25000,
            smsPerMonth: 0,
            storageGB: 20,
            apiCallsPerDay: 10000,
            teamMembers: 10,
        },
    },
];

async function seedPlans() {
    console.log('🌱 Seeding billing plans...');

    for (const plan of plans) {
        const existing = await prisma.plans.findUnique({
            where: { name: plan.name },
        });

        if (existing) {
            console.log(`✓ Plan "${plan.displayName}" already exists, skipping...`);
            continue;
        }

        await prisma.plans.create({
            data: plan as any,
        });
        console.log(`✓ Created plan: ${plan.displayName} ($${plan.price}/mo)`);
    }

    console.log('✅ Billing plans seeded successfully!');
}

seedPlans()
    .catch((e) => {
        console.error('❌ Error seeding plans:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
