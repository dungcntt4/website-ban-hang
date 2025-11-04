import { useState } from 'react'
import AuthModal from '../../components/AuthModal'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

function HomePage() {
  const [open, setOpen] = useState(false)
  const [initialTab, setInitialTab] = useState('login')
  const { user, logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()        // gọi API logout, xoá cookie + state
    } finally {
      window.location.replace('/') // điều hướng về trang chủ
    }
  }

  return (
    <div className="center">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <img src="/images/LogoNgang.png" alt="logo" />
        </div>

        <h2>Welcome to the Shop</h2>

        {!user ? (
          <>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { setInitialTab('login'); setOpen(true) }}>Sign in</button>
              <button onClick={() => { setInitialTab('register'); setOpen(true) }}>Sign up</button>
            </div>
            <p style={{ marginTop: 12 }}>
              Đã xác thực email? <Link to="/verify-email">Nhấn vào đây</Link> để hoàn tất (có token trong URL).
            </p>
          </>
        ) : (
          <>
            <p>Xin chào, <b>{user?.email}</b></p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Link to="/me"><button>Vào trang cá nhân</button></Link>
              <button onClick={handleLogout}>Đăng xuất</button> {/* ⬅️ sửa chỗ này */}
            </div>
          </>
        )}

        <AuthModal open={open} onClose={() => setOpen(false)} initialTab={initialTab} />
      </div>
    </div>
  )
}

export default HomePage
