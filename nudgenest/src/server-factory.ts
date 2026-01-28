'use strict';

import Hapi from '@hapi/hapi';
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
    ]);
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
