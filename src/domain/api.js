import { apiBase } from '../../config.js';
import { session } from './session.js';

export const segment = value => encodeURIComponent(value);

export async function api(path, { method = 'GET', body, signal, query, auth = true } = {}) {
  const url = new URL('/api/' + path, apiBase);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  const headers = new Headers({ Accept: 'application/json' });
  if (auth && session.token) headers.set('Authorization', 'Bearer ' + session.token);
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(url, { method, headers, body, signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con GameTracker. Comprueba que el API Gateway esté disponible.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && headers.has('Authorization')) {
      session.clear();
      location.hash = '#/login';
    }
    throw Object.assign(new Error(result?.message || 'La solicitud falló (' + response.status + ').'), {
      status: response.status
    });
  }
  return result;
}

export const items = result => result?.results ?? [];
