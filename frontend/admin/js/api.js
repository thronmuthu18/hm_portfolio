/**
 * API Handlers with Automatic Session Refresh & Token Rotation
 */

'use strict';

const API_BASE = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
)
  ? 'http://localhost:5000/api/v1/admin'
  : 'https://sudalaimuthu-portfolio.onrender.com/api/v1/admin';

const api = {
  /**
   * Universal fetch helper injecting token headers and refreshing sessions if expired
   */
  fetch: async (path, options = {}) => {
    let token = localStorage.getItem('admin_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchOptions = {
      credentials: 'include',
      headers,
      ...options
    };

    let response = await fetch(`${API_BASE}${path}`, fetchOptions);

    // If Access Token expired, attempt transparent rotation using Refresh Token cookie
    if (response.status === 401 && path !== '/login' && path !== '/refresh-token') {
      const refreshed = await api.rotateSession();
      if (refreshed) {
        // Re-read new token and re-attempt original request
        token = localStorage.getItem('admin_token');
        headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(`${API_BASE}${path}`, fetchOptions);
      } else {
        // Refresh token failed/compromised. Log out and send to login screen.
        api.clearAuth();
        window.location.href = './index.html';
        return null;
      }
    }

    return response;
  },

  /**
   * Call session refresh endpoint to rotate refresh tokens and receive new access token
   */
  rotateSession: async () => {
    try {
      const res = await fetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const body = await res.json();
        if (body && body.token) {
          localStorage.setItem('admin_token', body.token);
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  },

  /**
   * Delete token parameters locally
   */
  clearAuth: () => {
    localStorage.removeItem('admin_token');
  }
};
