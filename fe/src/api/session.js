// src/api/session.js
import { getAuthState, setAuthState } from '../context/AuthStateSingleton'

// Trong DEV, dùng đường dẫn tương đối để qua proxy.
// Nếu cần base URL cho PROD, export biến này nhưng để rỗng ở DEV.
export const API_BASE_URL = ''

let refreshPromise = null

export async function doRefreshOnce() {
  if (!refreshPromise) {
    refreshPromise = fetch(`/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(txt || `Refresh failed: ${res.status}`)
        }
        const data = await res.json()
        const state = getAuthState()
        setAuthState({ ...state, accessToken: data.accessToken })
        return data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}
