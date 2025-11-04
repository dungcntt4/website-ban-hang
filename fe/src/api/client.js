// src/api/client.js
import { getAuthState } from '../context/AuthStateSingleton'
import { doRefreshOnce, API_BASE_URL as API_BASE } from './session'

function isFormLike(body) {
  return body instanceof FormData || body instanceof Blob
}

function buildHeaders(options = {}) {
  const headers = new Headers(options.headers || {})
  if (!isFormLike(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const st = getAuthState()
  if (!options.skipAuth && st?.accessToken) {
    headers.set('Authorization', `Bearer ${st.accessToken}`)
  }
  return headers
}

function toUrl(path) {
  // DEV: API_BASE = '' → mọi thứ dùng đường dẫn tương đối qua proxy
  return path.startsWith('http') ? path : `${API_BASE}${path}`
}

async function doFetch(path, options = {}) {
  const url = toUrl(path)
  const headers = buildHeaders(options)
  return fetch(url, { ...options, headers, credentials: 'include' })
}

// Tự refresh 1 lần khi 401 (trừ request refresh)
export async function apiFetch(path, options = {}, { retry = true, onUnauthorized } = {}) {
  const isSelfRefresh = path.includes('/api/auth/refresh')
  let resp = await doFetch(path, options)
  if (resp.status !== 401 || isSelfRefresh) return resp
  if (!retry) {
    onUnauthorized?.(resp)
    return resp
  }
  try {
    await doRefreshOnce() // các request 401 cùng chờ 1 promise
  } catch {
    onUnauthorized?.(resp)
    return resp
  }
  return doFetch(path, options) // gọi lại đúng 1 lần
}
