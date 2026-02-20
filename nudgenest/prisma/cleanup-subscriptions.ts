/**
 * One-off cleanup script: cancel all duplicate ACTIVE subscriptions per merchant,
 * keeping only the most recently created one.
 *
 * Run with:
 *   cd nudgenest && npx ts-node --project tsconfig.json prisma/cleanup-subscriptions.ts
 */
import { PrismaClient } from '../generated/prisma/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Finding merchants with multiple ACTIVE subscriptions...\n');

    // Get all ACTIVE subscriptions
    const allActive = await prisma.subscriptions.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        include: { Plans: { select: { tier: true, name: true } } },
    });

    // Group by merchantId
    const byMerchant: Record<string, typeof allActive> = {};
    for (const sub of allActive) {
        if (!byMerchant[sub.merchantId]) byMerchant[sub.merchantId] = [];
        byMerchant[sub.merchantId].push(sub);
    }

    let totalCancelled = 0;

    for (const [merchantId, subs] of Object.entries(byMerchant)) {
        console.log(`Merchant ${merchantId}: ${subs.length} ACTIVE subscription(s)`);
        subs.forEach(s => {
            console.log(`  - id=${s.id} plan=${s.Plans.tier}/${s.Plans.name} createdAt=${s.createdAt.toISOString()}`);
        });

        if (subs.length <= 1) {
            console.log('  ✅ Only one active — nothing to do\n');
            continue;
        }

        // Keep the newest (last in sorted-asc array), cancel the rest
        const toCancel = subs.slice(0, -1);
        const toKeep = subs[subs.length - 1];

        console.log(`  🗑  Cancelling ${toCancel.length} stale subscription(s), keeping ${toKeep.id} (plan=${toKeep.Plans.tier})`);

        await prisma.subscriptions.updateMany({
            where: { id: { in: toCancel.map(s => s.id) } },
            data: { status: 'CANCELED', canceledAt: new Date() },
        });

        totalCancelled += toCancel.length;
        console.log('  ✅ Done\n');
    }

    console.log(`\n✅ Cleanup complete. Cancelled ${totalCancelled} stale subscription(s) across ${Object.keys(byMerchant).length} merchant(s).`);
}

main()
    .catch(e => {
        console.error('❌ Cleanup failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
