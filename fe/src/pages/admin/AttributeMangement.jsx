// src/pages/admin/Dashboard.jsx
import { useState } from 'react'
import Sidebar from '../../components/admin/Sidebar.jsx'
import HeaderAdmin from '../../components/admin/HeaderAdmin.jsx'
function AttributeManagement() {
  // ---- State tối thiểu để truyền vào Sidebar ----
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState('product-attribute')
  const [notificationCount, setNotificationCount] = useState(3)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // ---- Handlers ----
  const toggleSidebar = () => setSidebarCollapsed(v => !v)
  const toggleUserDropdown = () => setShowUserDropdown(v => !v)
  return (
    <div className="d-flex vh-100 bg-light text-dark">
      <Sidebar
          collapsed={sidebarCollapsed}
          activeMenu={activeMenu}
          onToggle={toggleSidebar}
          onSelectMenu={setActiveMenu}
          notificationCount={notificationCount}
          showUserDropdown={showUserDropdown}
          toggleUserDropdown={toggleUserDropdown}
      />
<div className="flex-grow-1 d-flex flex-column overflow-hidden">
          {/* Header */}
          <HeaderAdmin
                    title="Quản lí thuộc tính"
                    sidebarCollapsed={sidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                    showUserDropdown={showUserDropdown}
                    toggleUserDropdown={toggleUserDropdown}
          />

          {/* Main Content Area */}
         
        </div>
    </div>
  );
}

export default AttributeManagement;
