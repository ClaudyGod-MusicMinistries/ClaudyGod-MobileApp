/**
 * Jest Setup Configuration
 * Global test setup, mocks, and test utilities
 */

/* global jest, beforeEach */
// Suppress console errors during tests (only show warnings and above)
global.console.error = jest.fn((message) => {
  if (typeof message === 'string' && message.includes('Non-serializable')) {
    // Ignore redux non-serializable warnings in tests
    return;
  }
  console.warn(message);
});

// Mock React Native components
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  createURL: jest.fn((path) => `claudygod://${path}`),
}));

// Mock fetch globally for tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});

// Custom test utilities
global.createMockUser = () => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  createdAt: new Date().toISOString(),
});

global.createMockAuthToken = () => ({
  accessToken: 'jwt-access-token-mock',
  refreshToken: 'jwt-refresh-token-mock',
  expiresIn: 900,
});

global.createMockResponse = (data = {}, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: jest.fn(() => Promise.resolve(data)),
  text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
  headers: new Map(),
});

// Wait utilities
 
global.waitFor = (callback, options = {}) => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(checkCondition, interval);
        }
      }
    };
    checkCondition();
  });
};
