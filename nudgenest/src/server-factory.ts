'use strict';

import Hapi from '@hapi/hapi';
import { Sentry } from './lib/sentry';
import * as dotenv from 'dotenv';
import loggerPlugin from './plugins/logger';
import pubsubPlugin from './plugins/googlePubSub';
import shopifyWebhookPlugin from './plugins/shopifyWebhook';
import pubsubConsumerPlugin from './plugins/pubsubConsumer';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import merchantsPlugin from './plugins/merchant';
import reviewsPlugin from './plugins/review';
import healthcheck from './plugins/healthcheck';
import reviewConfigsPlugin from './plugins/configs';
import reviewMediaPlugin from './plugins/media';
import billingPlugin from './plugins/billing';
import reviewStatsPlugin from './plugins/reviewStats';
import reminderSchedulerPlugin from './plugins/reminderScheduler';
import gdprPlugin from './plugins/gdpr';
import sentryTestPlugin from './plugins/sentryTest';
import importExportPlugin from './plugins/importExport';

dotenv.config();

export const createServer = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 8080,
        host: '0.0.0.0',
        debug: false,
        routes: {
            log: { collect: true },
            cors: {
                origin: ['*'],
                credentials: false,
                additionalHeaders: ['x-api-key'],
                additionalExposedHeaders: ['x-api-key'],
            },
        },
    });
    await server.register([
        require('@hapi/inert'),
        loggerPlugin,
        healthcheck,
        prismaPlugin,
        authPlugin,
        pubsubPlugin,
        pubsubConsumerPlugin,  // Pull subscription for dev and production
        shopifyWebhookPlugin,
        merchantsPlugin,
        reviewsPlugin,
        reviewConfigsPlugin,
        reviewMediaPlugin,
        billingPlugin,
        reviewStatsPlugin,
        reminderSchedulerPlugin,
        gdprPlugin,
        sentryTestPlugin,
        importExportPlugin,
    ]);

    if (process.env.SENTRY_BACKEND_DSN) {
        await Sentry.setupHapiErrorHandler(server);
        // Hooks into onPreResponse; captures 5xx errors; skips intentional 4xx boom errors
    }

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true,
            },
        },
    });

    return server;
};
