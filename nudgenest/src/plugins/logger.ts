import HapiPino from 'hapi-pino';
import type { ServerRegisterPluginObject } from '@hapi/hapi';

const loggerPlugin: ServerRegisterPluginObject<any> = {
    plugin: HapiPino,
    options: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers["x-api-key"]',
                'req.payload.password',
                'req.payload.apiKey',
                'res.payload.apiKey',
            ],
            remove: true,
        },
        transport: process.env.NODE_ENV !== 'production' && process.env.LOG_PRETTY !== 'false' ? {
            target: require.resolve('pino-pretty'),
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        } : undefined,
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
        serializers: {
            req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                path: req.path,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'content-type': req.headers['content-type'],
                },
                remoteAddress: req.info?.remoteAddress,
            }),
            res: (res: any) => ({
                statusCode: res.statusCode,
            }),
            err: (err: any) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
            }),
        },
        logEvents: ['response', 'request-error'],
        logPayload: process.env.NODE_ENV !== 'production',
        logQueryParams: process.env.NODE_ENV !== 'production',
        logPathParams: true,
        customLogLevel: (req: any, res: any, err: any) => {
            if (res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            if (res.statusCode >= 300) return 'info';
            return 'debug';
        },
    },
};

export default loggerPlugin;
