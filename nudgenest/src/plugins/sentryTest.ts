import Hapi from '@hapi/hapi';
import { Sentry } from '../lib/sentry';

const sentryTestPlugin: Hapi.Plugin<{}> = {
    name: 'sentryTest',
    register: async (server: Hapi.Server) => {
        if (process.env.NODE_ENV === 'production') return;

        server.route({
            method: 'GET',
            path: '/api/v1/sentry-test',
            options: { auth: false },
            handler: async (_request, h) => {
                const eventId = Sentry.captureMessage(
                    `[sentry-test] Backend event @ ${new Date().toISOString()}`,
                    'info'
                );
                return h.response({ ok: true, sentryEventId: eventId }).code(200);
            },
        });
    },
};

export default sentryTestPlugin;
