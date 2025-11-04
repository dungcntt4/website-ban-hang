// src/components/admin/HeaderAdmin.jsx
import React from 'react'
import { useAuth } from '../../context/AuthContext' // chỉnh path đúng cấu trúc của bạn

function HeaderAdmin({
  title,
  sidebarCollapsed,
  toggleSidebar,
  showUserDropdown,
  toggleUserDropdown,
}) {
  const { user, loading, logout } = useAuth()

  const displayName =
    (user?.name && user.name.trim()) ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'Tài khoản'

  return (
    <>
      <header className="bg-white shadow-sm position-sticky top-0" style={{ zIndex: 1020 }}>
        <div
          className="d-flex align-items-center justify-content-between px-4"
          style={{ height: '64px' }}
        >
          {/* Left: toggle + title */}
          <div className="d-flex align-items-center">
            <button
              onClick={toggleSidebar}
              className="btn btn-link text-secondary p-0 me-3"
              aria-label="Toggle sidebar"
            >
              <i className={`fas ${sidebarCollapsed ? 'fa-bars' : 'fa-times'} fs-4`} />
            </button>
            <h1 className="h5 m-0">{title}</h1>
          </div>

          {/* Right: user dropdown */}
          <div className="d-flex align-items-center gap-3" style={{ position: 'relative', zIndex: 1030 }}>
            <div className="dropdown">
              <button
                className="btn d-flex align-items-center gap-2 text-secondary"
                onClick={toggleUserDropdown}
                type="button"
                aria-expanded={showUserDropdown}
                style={{ textDecoration: 'none' }}
                disabled={loading}
                title={loading ? 'Đang tải phiên...' : displayName}
              >
                <div
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                  style={{ width: '32px', height: '32px' }}
                >
                  <i className="fas fa-user text-white" />
                </div>

                <span className="fw-medium">
                  {loading ? 'Đang tải…' : displayName}
                </span>

                <i
                  className={`fas fa-chevron-down transition-transform ${
                    showUserDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showUserDropdown && !loading && (
                <ul className="dropdown-menu dropdown-menu-end show shadow-sm mt-2">
                  <li>
                    <button
                      className="dropdown-item"
                      // tuỳ bạn có ProfileModal thì mở ở đây; nếu dùng modal nội bộ thì
                      // hãy truyền thêm handler từ Dashboard hoặc quản lý state ở đây.
                      onClick={() => console.debug('Open profile modal')}
                    >
                      Hồ sơ
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={async () => {
                        await logout()      // gọi logout từ AuthContext
                        window.location.href = '/' // điều hướng về trang chủ/đăng nhập
                      }}
                    >
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default HeaderAdmin
