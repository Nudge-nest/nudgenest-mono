module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/server.ts', // Exclude main server file
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^plugins/(.*)$': '<rootDir>/src/plugins/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1',
    },
    transformIgnorePatterns: ['node_modules/(?!(@hapi)/)'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
};
