import { PrismaClient } from '../generated/prisma/prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateQrCodeUrls() {
    console.log('Starting QR code URL migration...');

    try {
        // Get all configurations
        const allConfigs = await prisma.configurations.findMany({
            select: {
                id: true,
                merchantId: true,
                qrCode: true,
            },
        });

        console.log(`Found ${allConfigs.length} configurations`);

        let updated = 0;
        let skipped = 0;

        for (const config of allConfigs) {
            const qrCodeArray = config.qrCode as any[];
            const qrCodeUrlField = qrCodeArray?.find((field: any) => field.key === 'qrCodeUrl');

            // Check if qrCodeUrl is empty or needs updating
            const currentUrl = qrCodeUrlField?.value || '';
            const shouldUpdate = !currentUrl || currentUrl === '' || currentUrl.includes('your-domain.com');

            if (shouldUpdate) {
                // Generate new store review URL from env
                const reviewUiBaseUrl = process.env.REVIEW_UI_BASE_URL || 'https://nudgenest-review-ui-1094805904049.europe-west1.run.app';
                const newUrl = `${reviewUiBaseUrl}/store/review/${config.merchantId}`;

                // Update the qrCode array
                const updatedQrCode = qrCodeArray.map((field: any) =>
                    field.key === 'qrCodeUrl' ? { ...field, value: newUrl } : field
                );

                // Update in database
                await prisma.configurations.update({
                    where: { id: config.id },
                    data: { qrCode: updatedQrCode as any },
                });

                console.log(`✅ Updated config for merchant ${config.merchantId}`);
                updated++;
            } else {
                console.log(`⏭️  Skipped config for merchant ${config.merchantId} (already has valid URL)`);
                skipped++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   Total configs: ${allConfigs.length}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log('\n✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
updateQrCodeUrls()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
