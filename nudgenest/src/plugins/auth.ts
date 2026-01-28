'use strict';

import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import { PrismaClient } from '../../generated/prisma/prisma/client';

const authPlugin: Hapi.Plugin<any> = {
    name: 'auth',
    version: '1.0.0',
    register: async (server: Hapi.Server) => {
        const prisma: PrismaClient = server.app.prisma;

        const scheme = () => {
            return {
                authenticate: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                    const apiKey = request.headers['x-api-key'];

                    if (!apiKey) {
                        request.logger.warn({ path: request.path }, 'Auth failed: Missing API key');
                        throw Boom.unauthorized('Missing API key');
                    }

                    try {
                        const merchant = await prisma.merchants.findFirst({
                            where: { apiKey: apiKey as string },
                        });

                        if (!merchant) {
                            request.logger.warn({ path: request.path }, 'Auth failed: Invalid API key');
                            throw Boom.unauthorized('Invalid API key');
                        }

                        request.logger.debug({ merchantId: merchant.id, shopId: merchant.shopId }, 'Auth successful');
                        return h.authenticated({
                            credentials: {
                                merchantId: merchant.id,
                                shopId: merchant.shopId,
                                email: merchant.email,
                            },
                        });
                    } catch (error) {
                        if (Boom.isBoom(error)) {
                            throw error;
                        }
                        request.logger.error({ error, path: request.path }, 'Auth error');
                        throw Boom.unauthorized('Invalid API key');
                    }
                },
            };
        };

        server.auth.scheme('apikey', scheme);
        server.auth.strategy('apikey', 'apikey');
        server.auth.default('apikey');
    },
};

export default authPlugin;
