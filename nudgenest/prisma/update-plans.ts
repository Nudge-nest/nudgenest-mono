import { PrismaClient } from '../generated/prisma/prisma/client';

const prisma = new PrismaClient();

// "Loox Killer" Aggressive Pricing - Undercutting competitors by 50-90%
// Email limits set to 5x review requests to account for:
// - Customer review request email
// - Merchant notification email
// - Review submission confirmation
// - Up to 2 reminder emails
const planUpdates = [
    {
        tier: 'FREE',
        price: 0,
        displayName: 'Free',
        description: '25 review requests/month',
        limits: {
            reviewRequestsPerMonth: 25,
            emailsPerMonth: 125, // 5x for email workflow
        },
    },
    {
        tier: 'STARTER',
        price: 4.99,
        displayName: 'Starter',
        description: '300 review requests/month',
        limits: {
            reviewRequestsPerMonth: 300,
            emailsPerMonth: 1500, // 5x for email workflow
        },
    },
    {
        tier: 'GROWTH',
        price: 12.99,
        displayName: 'Growth',
        description: '1,000 review requests/month',
        limits: {
            reviewRequestsPerMonth: 1000,
            emailsPerMonth: 5000, // 5x for email workflow
        },
    },
    {
        tier: 'PRO',
        price: 29.99,
        displayName: 'Pro',
        description: '5,000 review requests/month',
        limits: {
            reviewRequestsPerMonth: 5000,
            emailsPerMonth: 25000, // 5x for email workflow
        },
    },
];

async function updatePlans() {
    console.log('🔄 Updating billing plans with new pricing...');

    for (const update of planUpdates) {
        const existing = await prisma.plans.findFirst({
            where: { tier: update.tier },
        });

        if (existing) {
            await prisma.plans.update({
                where: { id: existing.id },
                data: {
                    price: update.price,
                    displayName: update.displayName,
                    description: update.description,
                    limits: {
                        ...existing.limits,
                        reviewRequestsPerMonth: update.limits.reviewRequestsPerMonth,
                        emailsPerMonth: update.limits.emailsPerMonth,
                    },
                },
            });
            console.log(`✅ Updated ${update.displayName} - $${update.price}/mo`);
        } else {
            console.log(`⚠️ Plan ${update.tier} not found`);
        }
    }

    console.log('✅ All plans updated successfully!');
}

updatePlans()
    .catch((e) => {
        console.error('❌ Error updating plans:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
