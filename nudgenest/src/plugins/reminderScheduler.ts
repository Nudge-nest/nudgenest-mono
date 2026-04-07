/**
 * Reminder Scheduler Plugin
 *
 * Runs a background job once daily at 00:00 UTC that handles two phases:
 *
 * Phase 1 — Initial review request emails (delayed send)
 *   Queries Pending reviews where scheduledEmailAt has arrived but
 *   initialEmailSentAt is still null, then publishes a 'new-review' event.
 *   Reviews with scheduledEmailAt = null predate this feature and already
 *   had their initial email sent by the webhook — they are skipped here.
 *
 * Phase 2 — Reminder emails
 *   For reviews whose initial email was sent (initialEmailSentAt IS NOT NULL)
 *   or legacy reviews (scheduledEmailAt IS NULL), reads the merchant's reminder
 *   config and sends follow-up emails based on remindersQty / remindersPeriod.
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
// Helper: build a Pub/Sub initial review-request message payload
// Used by Phase 1 (delayed send) to trigger the first customer email.
// ---------------------------------------------------------------------------
function buildInitialEmailMessage(
    review: any
): IRabbitDataObject<IReviewMessagePayloadContent> {
    const items = Array.isArray(review.items) ? review.items : [];
    return {
        messageId: uuidv4(),
        timestamp: new Date().toISOString(),
        eventType: 'new-review',
        priority: 'NORMAL',
        payload: {
            userId: review.merchantId,
            context: {
                action: 'send_review_request',
                details: `Delayed initial review request for review ${review.id}`,
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
// Core: process all pending reviews
// Phase 1: send deferred initial emails whose scheduledEmailAt has arrived.
// Phase 2: send follow-up reminders per merchant configuration.
// Returns a result summary so the manual-trigger endpoint can report back.
// ---------------------------------------------------------------------------
export async function processReminders(server: Hapi.Server): Promise<{
    initialEmailsSent: number;
    reminded: number;
    skipped: number;
    evaluated: number;
}> {
    const prisma = server.app.prisma;
    const { pubsub } = server.app;
    const { messagingTopic } = pubsub;
    const now = new Date();

    server.log(['info', 'reminderScheduler'], '🔔 Scheduler job started');

    // ==========================================================================
    // Phase 1 — Initial review request emails (delayed send)
    // Query: Pending reviews whose scheduledEmailAt has arrived AND whose
    // initial email hasn't been sent yet.
    // ==========================================================================
    const reviewsDueForInitialEmail = await prisma.reviews.findMany({
        where: {
            status: 'Pending',
            scheduledEmailAt: { not: null, lte: now },
            initialEmailSentAt: null,
        },
    });

    server.log(
        ['info', 'reminderScheduler'],
        `📧 Phase 1: ${reviewsDueForInitialEmail.length} review(s) due for initial email`
    );

    let initialEmailsSent = 0;

    for (const review of reviewsDueForInitialEmail) {
        try {
            const msg = buildInitialEmailMessage(review);
            const msgBuffer = convertObjectToBuffer(msg);
            await messagingTopic.publishMessage({ data: msgBuffer });

            await prisma.reviews.update({
                where: { id: review.id },
                data: { initialEmailSentAt: now },
            });

            initialEmailsSent++;
            server.log(
                ['info', 'reminderScheduler'],
                `✅ Initial email queued for review ${review.id} (${review.customerEmail})`
            );
        } catch (err: any) {
            server.log(
                ['error', 'reminderScheduler'],
                `❌ Failed to send initial email for review ${review.id}: ${err.message}`
            );
            Sentry.captureException(err, {
                tags: { component: 'reminderScheduler', phase: 'initialEmail' },
                extra: { reviewId: review.id, merchantId: review.merchantId },
            });
        }
    }

    // ==========================================================================
    // Phase 2 — Follow-up reminder emails
    // Only consider reviews where:
    //   - initialEmailSentAt IS NOT NULL (initial email already sent), OR
    //   - scheduledEmailAt IS NULL (legacy reviews created before this feature,
    //     whose initial email was sent immediately by the webhook at order time).
    // ==========================================================================
    const pendingReviews = await prisma.reviews.findMany({
        where: {
            status: 'Pending',
            createdAt: {
                lt: new Date(now.getTime() - MS_PER_DAY),
            },
            OR: [
                { initialEmailSentAt: { not: null } },
                { scheduledEmailAt: null },
            ],
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
        `📋 Phase 2: evaluating ${pendingReviews.length} review(s) for reminders`
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
            // 3. Skip if the cooldown period hasn't elapsed yet.
            //    For legacy reviews (scheduledEmailAt null): reference = lastReminderAt ?? createdAt.
            //    For new reviews (scheduledEmailAt set): reference = initialEmailSentAt ?? lastReminderAt.
            // -------------------------------------------------------------------
            const periodMs = PERIOD_MS[period];
            const referenceDate =
                review.lastReminderAt ??
                review.initialEmailSentAt ??
                review.createdAt;
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
                tags: { component: 'reminderScheduler', phase: 'reminder' },
                extra: { reviewId: review.id, merchantId: review.merchantId },
            });
        }
    }

    server.log(
        ['info', 'reminderScheduler'],
        `🏁 Scheduler job complete — initial: ${initialEmailsSent}, reminded: ${reminded}, skipped: ${skipped}`
    );

    return { initialEmailsSent, reminded, skipped, evaluated: pendingReviews.length };
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
                        message: 'Scheduler job completed',
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
