module.exports = {
  testEnvironment: 'node',
  
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/test/tests/',
    '/test/src/'
  ],
  
  setupFilesAfterEnv: [
    '<rootDir>/tests/utils/setup.js'
  ],
  
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/app.js',
    '!src/config/**',
    '!src/workers/**',
    '!src/sockets/**',
    '!src/utils/jobQueue.js',
    '!src/utils/performance.js',
    '!src/utils/securityHelper.js',
    '!src/utils/transactionHelper.js',
    '!src/utils/uploadHelper.js',
    '!src/modules/favorite_lawyers/**',
    '!src/modules/files/**',
    '!src/modules/lawyers_verifications/**',
    '!src/modules/subscriptions/**',
    '!**/node_modules/**',
    '!src/config/db.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 35,
      lines: 50,
      statements: 49
    }
  },
  
  testTimeout: 60000,
  
  verbose: true,
  
  detectOpenHandles: true,
  forceExit: true,
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  moduleNameMapper: {
    '^@config$': '<rootDir>/src/config',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@sockets/(.*)$': '<rootDir>/src/sockets/$1'
  },
  
  transform: {},
  
  reporters: ['default'],
  
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  maxWorkers: 1,
  
  errorOnDeprecated: true
};
