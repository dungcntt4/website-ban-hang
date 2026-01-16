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
export async function apiFetch(
  path,
  options = {},
  { retry = true, onUnauthorized } = {}
) {
  const isSelfRefresh = path.includes("/api/auth/refresh");

  let resp = await doFetch(path, options);

  // 1️⃣ XỬ LÝ 401 (GIỮ LOGIC REFRESH)
  if (resp.status === 401 && !isSelfRefresh) {
    if (!retry) {
      onUnauthorized?.(resp);
      throw await buildError(resp);
    }

    try {
      await doRefreshOnce();
      resp = await doFetch(path, options); // 🔁 gọi lại sau refresh
    } catch {
      onUnauthorized?.(resp);
      throw await buildError(resp);
    }
  }

  // 2️⃣ XỬ LÝ MỌI LỖI KHÁC
  if (!resp.ok) {
    throw await buildError(resp);
  }

  return resp;
}
async function buildError(resp) {
  try {
    const data = await resp.json();
    return new Error(data?.message || "Có lỗi xảy ra");
  } catch {
    const text = await resp.text();
    return new Error(text || "Có lỗi xảy ra");
  }
}
