import axios from 'axios';

export function readValue(event) {
  return event && event.target ? event.target.value : '';
}

export function readChecked(event) {
  return Boolean(event && event.target ? event.target.checked : false);
}

export function toErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    const errorCode = String(error.code || '').toUpperCase();
    const errorMessage = String(error.message || '').toLowerCase();

    if (errorCode === 'ECONNABORTED' || errorMessage.includes('timeout')) {
      return 'This action took too long. Please try again.';
    }
    if (error.response?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission for this action.';
    }
    if (!error.response) {
      return 'We could not complete that request right now. Please try again shortly.';
    }
    const data = error.response && error.response.data ? error.response.data : {};
    return data.message || data.error || error.message || fallback;
  }
  if (error && error.message) return error.message;
  return fallback;
}

export function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

export function truncate(value, size = 180) {
  if (!value) return '';
  if (value.length <= size) return value;
  return `${value.slice(0, size - 1)}...`;
}

export function humanizeToken(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function parseCsvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function describeHealthCheckDetail(payload) {
  const services = payload && payload.services ? payload.services : null;
  const capabilities = payload && payload.capabilities ? payload.capabilities : null;
  if (!services) return 'Studio ready';

  const details = [];
  if (services.postgres) {
    details.push(`Library: ${services.postgres === 'up' ? 'ready' : 'attention needed'}`);
  }
  if (services.redis) {
    details.push(`Sessions: ${services.redis === 'up' ? 'ready' : 'attention needed'}`);
  }
  if (capabilities && capabilities.youtube === false) {
    details.push('Video import unavailable');
  }

  return details.length > 0 ? details.join(' • ') : 'Studio ready';
}

export function acceptFromPolicy(policy) {
  if (!policy || !Array.isArray(policy.allowedExtensions) || policy.allowedExtensions.length === 0) return undefined;
  return policy.allowedExtensions.join(',');
}

export function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}
