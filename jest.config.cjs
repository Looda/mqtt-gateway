/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  //preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { useESM: true }],
  },
  testMatch: [
    "**/*.test.ts"
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  rootDir: "./",
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};