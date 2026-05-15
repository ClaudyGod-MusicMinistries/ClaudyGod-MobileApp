import { apiFetchWithMobileSession } from './authService';

interface AccountActionResponse {
  message: string;
}

export async function requestEmailChange(input: {
  newEmail: string;
  currentPassword: string;
}): Promise<AccountActionResponse> {
  return apiFetchWithMobileSession<AccountActionResponse>('/v1/me/account/email-change/request', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function confirmEmailChange(token: string): Promise<AccountActionResponse & { email: string }> {
  return apiFetchWithMobileSession<AccountActionResponse & { email: string }>('/v1/me/account/email-change/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function requestPasswordChange(currentPassword: string): Promise<AccountActionResponse> {
  return apiFetchWithMobileSession<AccountActionResponse>('/v1/me/account/password-change/request', {
    method: 'POST',
    body: JSON.stringify({ currentPassword }),
  });
}
