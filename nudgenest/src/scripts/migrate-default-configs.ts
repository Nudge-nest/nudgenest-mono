import { PrismaClient } from '../../generated/prisma/prisma/client';

const prisma = new PrismaClient();

// Old default values — only configs that still have these exact strings get updated.
// Configs with customised values are left untouched.
const MIGRATIONS: Array<{
    array: 'emailContent' | 'reminderEmailContent';
    key: string;
    oldValue: string;
    newValue: string;
}> = [
    {
        array: 'emailContent',
        key: 'subject',
        oldValue: 'how did it go?',
        newValue: 'How was your order?',
    },
    {
        array: 'emailContent',
        key: 'body',
        oldValue: 'We would be grateful if you shared how things look and feel.',
        newValue: 'Your experience matters. A quick review helps other shoppers and takes less than a minute.',
    },
    {
        array: 'reminderEmailContent',
        key: 'reminderSubject',
        oldValue: 'how did it go? [REMINDER]',
        newValue: 'Still time to share your thoughts',
    },
    {
        array: 'reminderEmailContent',
        key: 'reminderBody',
        oldValue: 'We would be grateful if you shared how things look and feel.',
        newValue: "We noticed you haven't had a chance to leave a review yet — no pressure, it only takes a minute.",
    },
];

const SHOP_QUESTION_OLD = 'how did we do?';
const SHOP_QUESTION_NEW = 'How would you rate your overall experience?';

async function migrateDefaultConfigs() {
    console.log('🌱 Migrating default merchant email configs...\n');

    const configs = await prisma.configurations.findMany();
    console.log(`Found ${configs.length} config documents\n`);

    let updatedCount = 0;
    let skippedCustomised = 0;
    let skippedAlreadyNew = 0;

    for (const config of configs) {
        let emailContent = [...((config.emailContent as any[]) || [])];
        let reminderEmailContent = [...((config.reminderEmailContent as any[]) || [])];
        let general = { ...(config.general as any) };
        let changed = false;

        // Migrate emailContent and reminderEmailContent fields
        for (const migration of MIGRATIONS) {
            const arr = migration.array === 'emailContent' ? emailContent : reminderEmailContent;
            const idx = arr.findIndex((f: any) => f.key === migration.key);
            if (idx === -1) continue;

            const current = arr[idx].value;
            if (current === migration.oldValue) {
                arr[idx] = { ...arr[idx], value: migration.newValue };
                changed = true;
            } else if (current === migration.newValue) {
                skippedAlreadyNew++;
            } else {
                skippedCustomised++;
            }

            if (migration.array === 'emailContent') {
                emailContent = arr;
            } else {
                reminderEmailContent = arr;
            }
        }

        // Migrate shop review question in general.shopReviewQuestions
        const questions: any[] = general?.shopReviewQuestions || [];
        const qIdx = questions.findIndex((q: any) => q.key === 'reviewQuestion');
        if (qIdx !== -1) {
            const current = questions[qIdx].value;
            if (current === SHOP_QUESTION_OLD) {
                questions[qIdx] = { ...questions[qIdx], value: SHOP_QUESTION_NEW };
                general = { ...general, shopReviewQuestions: questions };
                changed = true;
            } else if (current === SHOP_QUESTION_NEW) {
                skippedAlreadyNew++;
            } else {
                skippedCustomised++;
            }
        }

        if (changed) {
            await prisma.configurations.update({
                where: { id: config.id },
                data: { emailContent, reminderEmailContent, general } as any,
            });
            updatedCount++;
            console.log(`✅ Updated config ${config.id} (merchant: ${config.merchantId})`);
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Updated:            ${updatedCount}`);
    console.log(`   Skipped (customised): ${skippedCustomised}`);
    console.log(`   Skipped (already new): ${skippedAlreadyNew}`);
    console.log(`\n✅ Done.`);
}

migrateDefaultConfigs()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
