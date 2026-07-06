/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }],
  },
  // Source files use explicit `.js` extensions in relative imports (required by the
  // tsconfig's Node16 module resolution) even though they're actually `.ts` files.
  // Jest's resolver doesn't understand that convention the way `tsc` does, so strip the
  // extension and let normal resolution find the `.ts` source.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
