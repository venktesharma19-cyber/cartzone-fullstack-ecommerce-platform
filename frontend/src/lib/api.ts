const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface ApiOptions extends RequestInit {
  auth?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const cartSessionId = localStorage.getItem('cartzone_cart_session');
  if (cartSessionId) headers.set('x-cart-session-id', cartSessionId);

  if (options.auth !== false) {
    const token = localStorage.getItem('cartzone_access_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const nextCartSession = response.headers.get('x-cart-session-id');
  if (nextCartSession) localStorage.setItem('cartzone_cart_session', nextCartSession);

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(payload?.message ?? 'Request failed');
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
