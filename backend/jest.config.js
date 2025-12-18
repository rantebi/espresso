module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  maxWorkers: 1, // Run tests serially to avoid database conflicts
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
      DYNAMODB_ENDPOINT: 'http://localhost:8000',
      DYNAMODB_TABLE: 'issues-test'
    }
  }
};

