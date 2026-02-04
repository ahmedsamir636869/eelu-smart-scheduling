/**
 * Authentication utilities for token management
 */

const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * Store access token in localStorage
 */
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove access token from localStorage
 */
export function removeAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Decode JWT token to get payload (without verification)
 * Note: This is only for reading token data, not for security validation
 */
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

