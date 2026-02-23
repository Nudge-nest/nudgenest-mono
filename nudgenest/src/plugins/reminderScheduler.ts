/**
 * Reminder Scheduler Plugin
 *
 * Runs a background job once daily at 00:00 UTC that:
 * 1. Queries all Pending reviews where the customer hasn't submitted a review yet
 * 2. For each review, reads the merchant's reminder configuration
 *    - remindersQty  → max number of reminders to send (default: 2)
 *    - remindersPeriod → WEEKLY | BIWEEKLY | MONTHLY | BIMONTHLY (default: WEEKLY)
 * 3. Publishes a 'reminder' event to Pub/Sub if the review is eligible
 * 4. Increments remindersSent and updates lastReminderAt on the review record
 *
 * The pubsubConsumer plugin already handles 'reminder' eventType and routes
 * it to EmailService.sendReviewReminder().
 *
 * Manual trigger: POST /api/v1/reminders/run  (no auth required, for testing)
 */
import Hapi from '@hapi/hapi';
import * as dotenv from 'dotenv';
import { Sentry } from '../lib/sentry';
import { v4 as uuidv4 } from 'uuid';
import { IRabbitDataObject, IReviewMessagePayloadContent } from '../types';
import { convertObjectToBuffer } from './merchant';

dotenv.config();

// ---------------------------------------------------------------------------
// Period → milliseconds mapping
// ---------------------------------------------------------------------------
const PERIOD_MS: Record<string, number> = {
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
    BIWEEKLY: 14 * 24 * 60 * 60 * 1000,
    MONTHLY: 30 * 24 * 60 * 60 * 1000,
    BIMONTHLY: 60 * 24 * 60 * 60 * 1000,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the number of milliseconds until the next 00:00 UTC.
 * If it's already 00:00 UTC (within a 1-second window) returns 24 h
 * so we don't immediately re-fire on startup.
 */
function msUntilMidnightUTC(): number {
    const now = new Date();
    const midnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return midnight.getTime() - now.getTime();
}

// ---------------------------------------------------------------------------
// Helper: build a Pub/Sub reminder message payload
// ---------------------------------------------------------------------------
function buildReminderMessage(
    review: any
): IRabbitDataObject<IReviewMessagePayloadContent> {
    const items = Array.isArray(review.items) ? review.items : [];
    return {
        messageId: uuidv4(),
        timestamp: new Date().toISOString(),
        eventType: 'reminder',
        priority: 'NORMAL',
        payload: {
            userId: review.merchantId,
            context: {
                action: 'send_reminder',
                details: `Reminder ${review.remindersSent + 1} for review ${review.id}`,
                receiver: ['reviewer'],
            },
            content: {
                userName: review.customerName || 'Valued Customer',
                type: 'email',
                email: review.customerEmail,
                line_items: items,
                order_number: undefined,
                reviewId: review.id,
                currency: undefined,
                merchantId: review.merchantId,
            },
        },
        metadata: {
            retries: 0,
        },
    };
}

// ---------------------------------------------------------------------------
// Core: process all pending reviews due for a reminder
// Returns a result summary so the manual-trigger endpoint can report back.
// ---------------------------------------------------------------------------
export async function processReminders(server: Hapi.Server): Promise<{ reminded: number; skipped: number; evaluated: number }> {
    const prisma = server.app.prisma;
    const { pubsub } = server.app;
    const { messagingTopic } = pubsub;
    const now = new Date();

    server.log(['info', 'reminderScheduler'], '🔔 Reminder job started');

    const pendingReviews = await prisma.reviews.findMany({
        where: {
            status: 'Pending',
            createdAt: {
                // Only consider reviews created at least 24 h ago so the
                // initial review request email has been delivered first.
                lt: new Date(now.getTime() - MS_PER_DAY),
            },
        },
        include: {
            Merchants: {
                include: {
                    Configurations: true,
                },
            },
        },
    });

    server.log(
        ['info', 'reminderScheduler'],
        `📋 Evaluating ${pendingReviews.length} pending review(s)`
    );

    let reminded = 0;
    let skipped = 0;

    for (const review of pendingReviews) {
        try {
            // -------------------------------------------------------------------
            // 1. Read merchant's reminder configuration
            // -------------------------------------------------------------------
            const config = review.Merchants?.Configurations?.[0];

            // Defaults: 2 reminders, 1 week apart (overridable per merchant)
            let maxReminders = 2;
            let period = 'WEEKLY';

            if (config) {
                const qtyField = config.remindersFrequency?.find(
                    (f: any) => f.key === 'remindersQty'
                );
                const periodField = config.remindersFrequency?.find(
                    (f: any) => f.key === 'remindersPeriod'
                );
                if (qtyField?.value) maxReminders = parseInt(qtyField.value, 10) || 2;
                if (periodField?.value && PERIOD_MS[periodField.value]) {
                    period = periodField.value;
                }
            }

            // -------------------------------------------------------------------
            // 2. Skip if max reminders already reached
            // -------------------------------------------------------------------
            if (review.remindersSent >= maxReminders) {
                skipped++;
                continue;
            }

            // -------------------------------------------------------------------
            // 3. Skip if the cooldown period hasn't elapsed yet
            //    Reference: lastReminderAt (subsequent reminders) or createdAt (first)
            // -------------------------------------------------------------------
            const periodMs = PERIOD_MS[period];
            const referenceDate = review.lastReminderAt ?? review.createdAt;
            const nextReminderDue = new Date(referenceDate.getTime() + periodMs);

            if (now < nextReminderDue) {
                skipped++;
                continue;
            }

            // -------------------------------------------------------------------
            // 4. Skip if merchant's plan doesn't include autoReminders
            // -------------------------------------------------------------------
            const subscription = await prisma.subscriptions.findFirst({
                where: {
                    merchantId: review.merchantId,
                    status: { in: ['ACTIVE', 'TRIALING'] },
                },
                include: { Plans: true },
            });

            if (!subscription?.Plans?.features?.autoReminders) {
                skipped++;
                continue;
            }

            // -------------------------------------------------------------------
            // 5. Publish reminder event to Pub/Sub
            // -------------------------------------------------------------------
            const reminderMsg = buildReminderMessage(review);
            const msgBuffer = convertObjectToBuffer(reminderMsg);
            await messagingTopic.publishMessage({ data: msgBuffer });

            // -------------------------------------------------------------------
            // 6. Update the review record
            // -------------------------------------------------------------------
            await prisma.reviews.update({
                where: { id: review.id },
                data: {
                    remindersSent: { increment: 1 },
                    lastReminderAt: now,
                },
            });

            reminded++;
            server.log(
                ['info', 'reminderScheduler'],
                `✅ Reminder #${review.remindersSent + 1} queued for review ${review.id} (${review.customerEmail})`
            );
        } catch (err: any) {
            server.log(
                ['error', 'reminderScheduler'],
                `❌ Failed to process reminder for review ${review.id}: ${err.message}`
            );
            Sentry.captureException(err, {
                tags: { component: 'reminderScheduler' },
                extra: { reviewId: review.id, merchantId: review.merchantId },
            });
        }
    }

    server.log(
        ['info', 'reminderScheduler'],
        `🏁 Reminder job complete — queued: ${reminded}, skipped: ${skipped}`
    );

    return { reminded, skipped, evaluated: pendingReviews.length };
}

// ---------------------------------------------------------------------------
// Hapi Plugin
// ---------------------------------------------------------------------------
const reminderSchedulerPlugin: Hapi.Plugin<null> = {
    name: 'reminderScheduler',
    dependencies: ['prisma', 'pubsub'],
    register: async (server: Hapi.Server) => {
        // -------------------------------------------------------------------
        // Manual trigger endpoint — useful for testing without waiting for midnight
        // POST /api/v1/reminders/run
        // -------------------------------------------------------------------
        server.route({
            method: 'POST',
            path: '/api/v1/reminders/run',
            options: { auth: false },
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                request.logger.info('Manual reminder job triggered');
                try {
                    const result = await processReminders(server);
                    return h.response({
                        message: 'Reminder job completed',
                        ...result,
                    }).code(200);
                } catch (err: any) {
                    request.logger.error({ err }, 'Manual reminder job failed');
                    return h.response({ error: err.message }).code(500);
                }
            },
        });

        // -------------------------------------------------------------------
        // Daily scheduler — fires at 00:00 UTC, then every 24 h thereafter
        // -------------------------------------------------------------------
        const delayMs = msUntilMidnightUTC();
        const nextMidnight = new Date(Date.now() + delayMs).toISOString();

        server.log(
            ['info', 'reminderScheduler'],
            `⏰ Reminder job scheduled — next run at ${nextMidnight} (in ${Math.round(delayMs / 1000 / 60)} min)`
        );

        let dailyIntervalId: ReturnType<typeof setInterval>;

        const midnightTimeoutId = setTimeout(() => {
            // First fire at midnight
            processReminders(server).catch((err) => {
                server.log(['error', 'reminderScheduler'], `Daily run error: ${err.message}`);
                Sentry.captureException(err, { tags: { component: 'reminderScheduler', trigger: 'scheduled' } });
            });

            // Then repeat every 24 h
            dailyIntervalId = setInterval(() => {
                processReminders(server).catch((err) => {
                    server.log(['error', 'reminderScheduler'], `Daily run error: ${err.message}`);
                    Sentry.captureException(err, { tags: { component: 'reminderScheduler', trigger: 'scheduled' } });
                });
            }, MS_PER_DAY);
        }, delayMs);

        // Clean up on server shutdown
        server.ext('onPreStop', () => {
            clearTimeout(midnightTimeoutId);
            clearInterval(dailyIntervalId);
            server.log(['info', 'reminderScheduler'], '🛑 Reminder scheduler stopped');
        });

        server.log(['info', 'reminderScheduler'], '✅ Reminder scheduler registered');
    },
};

export default reminderSchedulerPlugin;
