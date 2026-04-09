import { PrismaClient } from '../generated/prisma/prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// NudgeNest Demo Merchant Seed
//
// This creates the NudgeNest demo merchant used for the landing page social
// proof widget (VITE_APP_DEMO_MERCHANT_ID). After running, copy the printed
// merchant ID into Secret Manager via Pulumi.
// =============================================================================

const MERCHANT = {
    shopId: 'nudgenest-demo.myshopify.com',
    domains: 'nudgenest-demo.myshopify.com',
    currencyCode: 'USD',
    email: 'hello@nudgenest.io',
    name: 'NudgeNest',
    businessInfo: JSON.stringify({ description: 'NudgeNest — Shopify review platform' }),
    address: {
        address1: 'Gunillantie 6',
        address2: '',
        city: 'Helsinki',
        country: 'Finland',
        formatted: { line1: 'Gunillantie 6', line2: '00870 Helsinki, Finland' },
        zip: '00870',
    },
};


async function seedDemoMerchant() {
    console.log('🌱 Seeding NudgeNest demo merchant...\n');

    // ── Check if already exists ───────────────────────────────────────────────
    const existing = await prisma.merchants.findUnique({
        where: { shopId: MERCHANT.shopId },
    });

    if (existing) {
        console.log(`⚠️  Demo merchant already exists.`);
        console.log(`   Merchant ID: ${existing.id}`);
        console.log(`\n✅ No changes made. Use the ID above for VITE_APP_DEMO_MERCHANT_ID.`);
        return;
    }

    // ── Create merchant ───────────────────────────────────────────────────────
    const merchant = await prisma.merchants.create({
        data: MERCHANT as any,
    });
    console.log(`✅ Merchant created`);
    console.log(`   Name:  ${merchant.name}`);
    console.log(`   Email: ${merchant.email}`);
    console.log(`   ID:    ${merchant.id}\n`);

    // ── Create default configurations ─────────────────────────────────────────
    await prisma.configurations.create({
        data: {
            merchantId: merchant.id,
            emailContent: [],
            reminderEmailContent: [],
            remindersFrequency: [],
            emailSchedule: [],
            publish: [],
            qrCode: [],
            general: { shopReviewQuestions: [] },
        } as any,
    });
    console.log(`✅ Default configurations created`);

    console.log(`\n🎉 Done! Update VITE_APP_DEMO_MERCHANT_ID in Secret Manager:`);
    console.log(`\n   ${merchant.id}\n`);
}

seedDemoMerchant()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
