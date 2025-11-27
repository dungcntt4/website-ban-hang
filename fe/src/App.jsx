import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/user/HomePage'
import VerifyEmailPage from './pages/user/VerifyEmailPage'
import ResetPasswordPage from './pages/user/ResetPasswordPage'
import MePage from './pages/user/MePage'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/admin/Dashboard'
import ProductManagement from './pages/admin/ProductManagement'
import AttributeManagement from './pages/admin/AttributeMangement'
import OptionManagement from './pages/admin/OptionManagement'
import ProductCreate from './pages/admin/ProductCreate'
import SpecAttributeCreate from './pages/admin/SpecAttributeCreate'
import OptionCreate from './pages/admin/OptionCreate'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path='/product-management/products' element={<ProductManagement />} />
      <Route path='/product-management/attributes' element={<AttributeManagement />} />
      <Route path='/product-management/options' element={<OptionManagement />} />
      <Route path='/product-management/products/create' element={<ProductCreate />} />
      <Route path='/product-management/attributes/create' element={<SpecAttributeCreate/>}/>
      <Route path='/product-management/options/create'element={<OptionCreate/>}/>
      {/* Chỉ cần đăng nhập */}
      <Route
        path="/me"
        element={
          <ProtectedRoute>
            <MePage />
          </ProtectedRoute>
        }
      />

      {/* Chỉ ADMIN mới vào được */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['ROLE_ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
