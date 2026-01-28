import { PrismaClient } from '../generated/prisma/prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function migrateApiKeys() {
    const allMerchants = await prisma.merchants.findMany();
    const merchants = allMerchants.filter(m => !m.apiKey);

    console.log(`Found ${merchants.length} merchants without API keys (out of ${allMerchants.length} total)`);

    for (const merchant of merchants) {
        const apiKey = crypto.randomBytes(32).toString('hex');
        await prisma.merchants.update({
            where: { id: merchant.id },
            data: { apiKey },
        });
        console.log(`✓ Generated API key for ${merchant.email}: ${apiKey}`);
    }

    console.log('Migration complete!');
}

migrateApiKeys()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
