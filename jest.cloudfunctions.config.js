module.exports = {
  testMatch: ['<rootDir>/cloudfunctions/**/__tests__/**/*.test.js'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    '<rootDir>/cloudfunctions/**/*.js',
    '!<rootDir>/cloudfunctions/**/package.json',
    '!<rootDir>/cloudfunctions/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 84,
      branches: 50,
      functions: 90,
      lines: 90
    }
  }
}
