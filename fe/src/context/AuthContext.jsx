// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { apiFetch } from '../api/client'
import { setAuthState } from './AuthStateSingleton'
import { doRefreshOnce } from '../api/session'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Đồng bộ accessToken cho apiFetch
  useEffect(() => {
    setAuthState({ accessToken })
  }, [accessToken])

  // load /me (ổn định reference)
  const loadMe = useCallback(async () => {
    const resp = await apiFetch('/api/auth/me', { method: 'GET' })
    if (resp.ok) {
      const data = await resp.json()
      setUser(data)
    } else {
      setUser(null)
    }
  }, [])

  // Khởi động: thử refresh để khôi phục phiên (chặn StrictMode double-run)
  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    ;(async () => {
      try {
        const tok = await doRefreshOnce().catch(() => null)
        if (tok) {
          setAuthState({ accessToken: tok })
          setAccessToken(tok)
          await loadMe()
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [loadMe])

  async function login(email, password) {
    const resp = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    if (!resp.ok) {
      const msg = await safeMsg(resp)
      throw new Error(msg || 'Đăng nhập thất bại')
    }
    const data = await resp.json()
    setAccessToken(data.accessToken)
    setAuthState({ accessToken: data.accessToken })
    setUser(data.user)
    toast.success('Đăng nhập thành công')
    return data.user
  }

  async function loginWithGoogle(idToken) {
    const resp = await fetch(`/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    })
    if (!resp.ok) throw new Error('Google Sign-In thất bại')

    const data = await resp.json()
    setAccessToken(data.accessToken)
    setAuthState({ accessToken: data.accessToken })
    setUser(data.user)
    toast.success('Đăng nhập Google thành công')
    return data.user
  }

  async function register(email, password) {
    const resp = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // register thường không cần cookie, nhưng để credentials: 'include' cũng không sao
      body: JSON.stringify({ email, password }),
    })
    if (!resp.ok) {
      const msg = await safeMsg(resp)
      throw new Error(msg || 'Đăng ký thất bại')
    }
  }

  async function logout() {
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setAccessToken(null)
      setAuthState({ accessToken: null })
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      reloadMe: loadMe,
    }),
    [user, accessToken, loading, loadMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

async function safeMsg(resp) {
  try {
    const j = await resp.json()
    return j.message || j.error || JSON.stringify(j)
  } catch {
    return resp.statusText
  }
}
