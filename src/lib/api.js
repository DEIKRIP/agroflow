// Simple API client for Netlify Functions
// Uses Fetch and includes the Supabase access token if available
import { supabase } from './supabase';

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;

  // Try to use Supabase access token from localStorage (if using supabase-js auth)
  let authHeader = {};
  try {
    const { data } = await supabase.auth.getSession();
    const access_token = data?.session?.access_token;
    if (access_token) {
      authHeader = { Authorization: `Bearer ${access_token}` };
    }
  } catch (_) {}

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (isJson && data?.error) ? data.error : `HTTP ${res.status}`;
    const details = isJson ? data?.details : undefined;
    const err = new Error(message);
    err.status = res.status;
    if (details) err.details = details;
    throw err;
  }

  return data;
}

const api = {
  post: (path, payload) => apiRequest(path, { method: 'POST', body: payload }),
  get: (path) => apiRequest(path, { method: 'GET' }),
};

export default api;
