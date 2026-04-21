import { jest } from '@jest/globals';
import { prismaMock } from './mocks/prisma';

// Mock environment variables FIRST, before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mongodb://test:test@localhost:27017/test';
process.env.GOOGLE_CLOUD_PROJECT_ID = 'nudgenest-test';
process.env.APP_AWS_BUCKET_NAME = 'test-bucket';
process.env.APP_AWS_REGION = 'us-east-1';
process.env.APP_AWS_ACCESS_KEY = 'test-key';
process.env.APP_AWS_SECRET_KEY = 'test-secret';
process.env.SHOPIFY_API_SECRET = 'test-shopify-secret';
process.env.RESEND_FROM_EMAIL = 'reviews@mail.nudgenest.io';
process.env.REVIEW_UI_BASE_URL = 'https://review-staging.nudgenest.io';

// Global test timeout
jest.setTimeout(10000);

// Mock Prisma
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

// Mock external services by default
jest.mock('@aws-sdk/client-s3');
jest.mock('twilio');

// Mock Google Cloud Pub/Sub
// getTopics() / createTopic() return tuples. The auto-mock returns undefined,
// making `const [topics] = await pubsubClient.getTopics()` throw
// "not iterable". Use mockImplementation + Promise.resolve so TypeScript's
// strict "never" constraints don't block the factory.
jest.mock('@google-cloud/pubsub', () => {
    const mockTopic = {
        name: 'projects/nudgenest-test/topics/nudgenest-messaging',
        publish: jest.fn().mockImplementation(() => Promise.resolve('mock-message-id')),
        publishMessage: jest.fn().mockImplementation(() => Promise.resolve('mock-message-id')),
    };
    return {
        PubSub: jest.fn().mockImplementation(() => ({
            getTopics: jest.fn().mockImplementation(() => Promise.resolve([[mockTopic]])),
            createTopic: jest.fn().mockImplementation(() => Promise.resolve([mockTopic])),
            topic: jest.fn().mockImplementation(() => mockTopic),
            subscription: jest.fn().mockImplementation(() => ({
                exists: jest.fn().mockImplementation(() => Promise.resolve([false])),
                on: jest.fn(),
                setOptions: jest.fn(),
            })),
            close: jest.fn().mockImplementation(() => Promise.resolve()),
        })),
        Topic: jest.fn(),
    };
});
