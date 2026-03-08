import { PrismaClient } from '../generated/prisma/prisma/client';

const prisma = new PrismaClient();

async function deleteEnterprisePlan() {
    console.log('🗑️  Deleting ENTERPRISE plan from database...');

    try {
        // Check if ENTERPRISE plan exists
        const enterprisePlan = await prisma.plans.findFirst({
            where: { tier: 'ENTERPRISE' },
        });

        if (!enterprisePlan) {
            console.log('⚠️  ENTERPRISE plan not found in database');
            return;
        }

        // Check if any merchants are subscribed to ENTERPRISE
        const subscriptions = await prisma.subscriptions.findMany({
            where: { planId: enterprisePlan.id },
        });

        if (subscriptions.length > 0) {
            console.log(`⚠️  Found ${subscriptions.length} subscription(s) using ENTERPRISE plan`);
            console.log('💡 Migrating subscriptions to PRO plan...');

            // Get PRO plan
            const proPlan = await prisma.plans.findFirst({
                where: { tier: 'PRO' },
            });

            if (proPlan) {
                // Update all ENTERPRISE subscriptions to PRO
                await prisma.subscriptions.updateMany({
                    where: { planId: enterprisePlan.id },
                    data: { planId: proPlan.id },
                });
                console.log(`✅ Migrated ${subscriptions.length} subscription(s) to PRO plan`);
            } else {
                console.error('❌ PRO plan not found. Cannot migrate subscriptions.');
                return;
            }
        }

        // Delete the ENTERPRISE plan
        await prisma.plans.delete({
            where: { id: enterprisePlan.id },
        });

        console.log('✅ ENTERPRISE plan deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting ENTERPRISE plan:', error);
        throw error;
    }
}

deleteEnterprisePlan()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
