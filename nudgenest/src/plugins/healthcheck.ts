import Hapi from '@hapi/hapi';
import { PrismaClient } from '../../generated/prisma/prisma/client';

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        healthcheck: any;
    }
}

const healthPlugin: Hapi.Plugin<undefined> = {
    name: 'healthcheck',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        // Basic health check
        server.route({
            method: 'GET',
            path: '/health',
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                const startTime = Date.now();
                const checks: any = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    checks: {
                        database: 'unknown',
                    },
                };

                // Database check (MongoDB doesn't support $queryRaw, use findMany)
                try {
                    const prisma: PrismaClient = request.server.app.prisma;
                    if (!prisma) {
                        throw new Error('Prisma client not initialized');
                    }
                    await prisma.merchants.findFirst();
                    checks.checks.database = 'healthy';
                } catch (error: any) {
                    checks.checks.database = 'unhealthy';
                    checks.status = 'DEGRADED';
                    request.logger.error({
                        errorMessage: error?.message || 'Unknown error',
                        errorName: error?.name,
                        errorStack: error?.stack
                    }, 'Database health check failed');
                }

                checks.responseTime = `${Date.now() - startTime}ms`;

                const statusCode = checks.status === 'OK' ? 200 : 503;
                return h.response(checks).code(statusCode);
            },
            options: {
                auth: false,
            },
        });

        // Readiness check (for k8s/cloud deployment)
        server.route({
            method: 'GET',
            path: '/ready',
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                try {
                    const prisma: PrismaClient = request.server.app.prisma;
                    if (!prisma) {
                        throw new Error('Prisma client not initialized');
                    }
                    await prisma.merchants.findFirst();
                    return h.response({ ready: true }).code(200);
                } catch (error: any) {
                    request.logger.error({ error: error.message }, 'Readiness check failed');
                    return h.response({ ready: false, error: 'Database not accessible' }).code(503);
                }
            },
            options: {
                auth: false,
            },
        });

        // Liveness check (for k8s/cloud deployment)
        server.route({
            method: 'GET',
            path: '/live',
            handler: (_, h: Hapi.ResponseToolkit) => {
                return h.response({ alive: true }).code(200);
            },
            options: {
                auth: false,
            },
        });
    },
};

export default healthPlugin;
