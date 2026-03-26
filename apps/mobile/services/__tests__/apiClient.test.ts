// services/__tests__/apiClient.test.ts
/**
 * API Client Tests
 * Tests for HTTP client error handling, timeout, and retry logic
 */

import { apiClient } from '../apiClient';

describe('apiClient', () => {
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
        createMockResponse(mockResponse, 200),
      );

      const result = await apiClient.get('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should successfully make a POST request with body', async () => {
      const mockData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { success: true, userId: '123' };
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse(mockResponse, 201),
      );

      const result = await apiClient.post('/login', mockData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle PUT requests', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { id: 1, ...updateData };
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse(mockResponse, 200),
      );

      const result = await apiClient.put('/user/1', updateData);
      
      expect(result).toEqual(mockResponse);
    });

    it('should handle DELETE requests', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({ success: true }, 204),
      );

      const result = await apiClient.delete('/user/1');
      
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should classify 401 as AUTH error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({ error: 'Unauthorized' }, 401),
      );

      try {
        await apiClient.get('/protected');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('AUTH_ERROR');
        expect(error.message).toContain('Unauthorized');
      }
    });

    it('should classify 429 as RATE_LIMITED error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({ error: 'Too many requests' }, 429),
      );

      try {
        await apiClient.get('/test');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('RATE_LIMITED');
      }
    });

    it('should classify 404 as NOT_FOUND error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({ error: 'Not found' }, 404),
      );

      try {
        await apiClient.get('/nonexistent');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NOT_FOUND');
      }
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(
        new Error('Network request failed'),
      );

      try {
        await apiClient.get('/test');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 30 seconds', async () => {
      global.fetch = jest.fn(() => new Promise(() => {
        // Never resolves
      }));

      const promise = apiClient.get('/test');
      
      jest.advanceTimersByTime(31000);

      try {
        await promise;
        fail('Should have timed out');
      } catch (error: any) {
        expect(error.code).toBe('TIMEOUT');
      }
    });
  });

  describe('Request Headers', () => {
    it('should include platform headers', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({}, 200),
      );

      await apiClient.get('/test');

      const callArgs = global.fetch.mock.calls[0];
      const headers = callArgs[1]?.headers;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toContain('ClaudyGod');
    });

    it('should include auth token in Authorization header when provided', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        createMockResponse({}, 200),
      );

      const token = 'jwt-token-123';
      await apiClient.get('/protected', { headers: { Authorization: `Bearer ${token}` } });

      const callArgs = global.fetch.mock.calls[0];
      const headers = callArgs[1]?.headers;

      expect(headers['Authorization']).toBe(`Bearer ${token}`);
    });
  });
});
