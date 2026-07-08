/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
  moduleNameMapper: {
    // otplib pulls in an ESM-only dependency (@scure/base) Jest's CJS transform can't
    // parse; no test here exercises MFA/TOTP, so stub it out instead of transforming it.
    '^otplib$': '<rootDir>/test/otplibStub.ts',
    // Source files use explicit `.js` extensions in relative imports (required by the
    // tsconfig's Node16 module resolution) even though they're actually `.ts` files.
    // Jest's resolver doesn't understand that convention the way `tsc` does, so strip
    // the extension and let normal resolution find the `.ts` source.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Importing app.ts constructs BullMQ Queues, which connect to Redis immediately
  // (not lazily) and retry indefinitely on failure — forceExit ensures the process
  // still terminates cleanly in a test environment with no real Redis available.
  forceExit: true,
};
