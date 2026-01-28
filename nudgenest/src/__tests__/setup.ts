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

// Global test timeout
jest.setTimeout(10000);

// Mock Prisma
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));

// Mock external services by default
jest.mock('@sendgrid/mail');
jest.mock('@aws-sdk/client-s3');
jest.mock('twilio');

// Mock Google Cloud Pub/Sub
jest.mock('@google-cloud/pubsub');
