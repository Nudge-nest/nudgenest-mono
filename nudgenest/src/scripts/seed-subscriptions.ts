import { PrismaClient } from '../../generated/prisma/prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptions() {
    console.log('🌱 Starting subscription seeding...');

    try {
        // Get all plans
        const plans = await prisma.plans.findMany();
        console.log(`Found ${plans.length} plans`);

        if (plans.length === 0) {
            console.log('❌ No plans found. Please seed plans first.');
            return;
        }

        // Get all merchants without subscriptions
        const merchants = await prisma.merchants.findMany({
            include: {
                Subscriptions: true,
            },
        });

        console.log(`Found ${merchants.length} total merchants`);

        const merchantsWithoutSubscriptions = merchants.filter(
            (merchant) => merchant.Subscriptions.length === 0
        );

        console.log(`Found ${merchantsWithoutSubscriptions.length} merchants without subscriptions`);

        if (merchantsWithoutSubscriptions.length === 0) {
            console.log('✅ All merchants already have subscriptions');
            return;
        }

        // Find the free/starter plan (assuming it's the first plan or has lowest price)
        const freePlan = plans.find((p) => p.tier === 'FREE') || plans[0];
        console.log(`Using plan: ${freePlan.name} (${freePlan.tier})`);

        // Create subscriptions for merchants without them
        let createdCount = 0;
        for (const merchant of merchantsWithoutSubscriptions) {
            try {
                await prisma.subscriptions.create({
                    data: {
                        merchantId: merchant.id,
                        planId: freePlan.id,
                        status: 'ACTIVE',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    },
                });
                createdCount++;
                console.log(`✅ Created subscription for merchant: ${merchant.name} (${merchant.email})`);
            } catch (error: any) {
                console.error(
                    `❌ Failed to create subscription for ${merchant.email}:`,
                    error.message
                );
            }
        }

        console.log(`\n🎉 Successfully created ${createdCount} subscriptions`);
    } catch (error) {
        console.error('❌ Error seeding subscriptions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedSubscriptions()
    .then(() => {
        console.log('✅ Seeding complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
