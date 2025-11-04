import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function GoogleLoginButton() {
  const btnRef = useRef(null)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !(window.google && window.google.accounts)) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const user = await loginWithGoogle(response.credential) // ⬅️ nhận user
          // ⬇️ điều hướng theo role
          if (user?.role === 'ROLE_ADMIN') navigate('/dashboard', { replace: true })
          else navigate('/me', { replace: true })
        } catch (e) {
          toast.error(e.message || 'Google Sign-In thất bại')
        }
      },
    })

    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      })
    }
  }, [loginWithGoogle, navigate])

  return <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }} />
}
export default GoogleLoginButton
