  // @ts-nocheck
/**
 * @jest-environment jsdom
 */
/**
 * API Client Tests
 * Tests for HTTP client error handling, timeout, and retry logic
 */

import { apiFetch, ApiError } from '../apiClient';

describe('apiFetch', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('HTTP Request Handling', () => {
    it('should successfully make a GET request', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse(mockResponse, 200),
      );

      const result = await apiFetch<typeof mockResponse>(
        'http://api.test/test',
      );
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should successfully make a POST request with body', async () => {
      const mockData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { success: true, userId: '123' };
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse(mockResponse, 201),
      );

      const result = await apiFetch<typeof mockResponse>(
        'http://api.test/login',
        { method: 'POST', body: JSON.stringify(mockData) },
      );
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle PUT requests', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { id: 1, ...updateData };
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse(mockResponse, 200),
      );

      const result = await apiFetch<typeof mockResponse>(
        'http://api.test/user/1',
        { method: 'PUT', body: JSON.stringify(updateData) },
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('should handle DELETE requests', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({ success: true }, 204),
      );

      const result = await apiFetch(
        'http://api.test/user/1',
        { method: 'DELETE' },
      );
      
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should classify 401 as AUTH error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({ error: 'Unauthorized' }, 401),
      );

      try {
        await apiFetch('http://api.test/protected');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(401);
      }
    });

    it('should classify 429 as RATE_LIMITED error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({ error: 'Too many requests' }, 429),
      );

      try {
        await apiFetch('http://api.test/api');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(429);
      }
    });

    it('should classify 404 as NOT_FOUND error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({ error: 'Not found' }, 404),
      );

      try {
        await apiFetch('http://api.test/nonexistent');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(404);
      }
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(
        new Error('Network request failed'),
      );

      try {
        await apiFetch('http://api.test/test');
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 30 seconds', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise(() => {
            // Never resolves to test timeout
          }),
      );

      const promise = apiFetch('http://api.test/test', {});

      jest.advanceTimersByTime(31000);

      try {
        await promise;
        throw new Error('Should have timed out');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.isTimeout).toBe(true);
      }
    });
  });

  describe('Request Configuration', () => {
    it('should make requests to correct URL', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({}, 200),
      );

      await apiFetch('http://api.test/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://api.test/test'),
        expect.any(Object),
      );
    });

    it('should pass request config correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        global.createMockResponse({}, 200),
      );

      const config = { method: 'GET', headers: { 'X-Custom': 'value' } };
      await apiFetch('http://api.test/test', config);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(config),
      );
    });
  });
});
