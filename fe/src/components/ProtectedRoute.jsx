import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Component bảo vệ route.
 * 
 * - Nếu chưa login → điều hướng về "/"
 * - Nếu có `roles` và user.role không thuộc `roles` → chặn, trả về "/"
 * - Khi đang loading (đợi xác thực phiên) → hiển thị spinner
 *
 * Cách dùng:
 * <ProtectedRoute roles={['ROLE_ADMIN']}>
 *   <Dashboard />
 * </ProtectedRoute>
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loading)
    return (
      <div className="center">
        <div className="card">
          <div className="spinner" />
          Đang kiểm tra phiên…
        </div>
      </div>
    )

  // Nếu chưa đăng nhập
  if (!user) return <Navigate to="/" replace state={{ from: loc }} />

  // Nếu có role yêu cầu và user không nằm trong roles đó
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  // Nếu hợp lệ → cho phép vào
  return children
}

export default ProtectedRoute
