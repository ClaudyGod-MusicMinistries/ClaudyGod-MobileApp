/**
 * Hook for making guest-aware API calls
 * Automatically checks guest mode and uses appropriate endpoints
 */

import { useCallback } from 'react';
import { useGuestMode } from '../context/GuestModeContext';
import { apiFetch, ApiError } from '../services/apiClient';
import { apiFetchWithMobileSession } from '../services/authService';

export interface GuestAwareFetchOptions {
  /**
   * Whether this endpoint requires authentication
   * If true and user is in guest mode, this will be disabled
   */
  requiresAuth?: boolean;
  /**
   * Optional public endpoint to use when in guest mode
   * If not provided and requiresAuth is true, error is thrown
   */
  guestEndpoint?: string;
}

/**
 * Hook for making guest-aware API calls
 * 
 * Usage:
 * const { fetch } = useGuestAwareFetch();
 * 
 * // For public endpoints (works in guest mode)
 * const data = await fetch('/v1/content/discover');
 * 
 * // For authenticated endpoints (disabled in guest mode)
 * const data = await fetch('/v1/user/library', { requiresAuth: true });
 * 
 * // For authenticated endpoints with guest alternative
 * const data = await fetch('/v1/user/recommendations', {
 *   requiresAuth: true,
 *   guestEndpoint: '/v1/content/trending',
 * });
 */
export function useGuestAwareFetch() {
  const { isGuestMode } = useGuestMode();

  const fetch = useCallback(
    async function guestAwareFetch<T>(
      path: string,
      init?: RequestInit,
      options?: GuestAwareFetchOptions,
    ): Promise<T> {
      const { requiresAuth = false, guestEndpoint } = options || {};

      // If guest mode and endpoint requires auth
      if (isGuestMode && requiresAuth) {
        // Use guest endpoint if available
        if (guestEndpoint) {
          return apiFetch<T>(guestEndpoint, init);
        }

        // Otherwise throw a user-friendly error
        throw new ApiError(
          401,
          'This feature requires signing in. Browse other content in guest mode.',
        );
      }

      // If guest mode, use public fetch
      if (isGuestMode) {
        return apiFetch<T>(path, init);
      }

      // If authenticated mode, use session-aware fetch (which includes token)
      return apiFetchWithMobileSession<T>(path, init);
    },
    [isGuestMode],
  );

  return { fetch, isGuestMode };
}
