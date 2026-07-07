module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  setupFiles: ['./jest.setup.js'],
  // React Query schedules internal GC timers on each QueryClient that outlive
  // a test's own assertions — force exit rather than waiting on them to drain.
  forceExit: true,
};
