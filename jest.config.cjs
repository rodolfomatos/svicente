module.exports = {
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/', '/docs/templates/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/docs/templates/'],
  verbose: true,
};