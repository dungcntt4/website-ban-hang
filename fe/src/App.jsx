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
import InventoryManagement from './pages/admin/InventoryManagement'
import InventoryCreate from './pages/admin/InventoryCreate'
import InventoryDetail from './pages/admin/InventoryDetail'
import ProductPage from './pages/user/ProductPage'
import ProductDetail from './pages/user/ProductDetail'
import Cart from './pages/user/Cart'
import Checkout from './pages/user/CheckOut'
import UserProfile from './pages/user/UserProfile'
import VNPayReturn from './pages/user/VNPayReturn'
import PaymentReturn from './pages/user/PaymentReturn'
import OrderManagement from './pages/admin/OrderManagement'
import ReportsStatistics from './pages/admin/ReportsStatistics'
import CustomerManagement from './pages/admin/CustomerMangement'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path='/cart' element={<Cart/>}/>
      <Route path='/checkout' element={<Checkout/>}/>
      <Route path='/profile' element={<UserProfile/>}/>
      <Route path="/payment/return" element={<PaymentReturn />} />
      <Route path="/vnpay-return" element={<VNPayReturn />} />
      <Route path="/products/:category" element={<ProductPage />} />
      <Route path="/products/detail/:slug" element={<ProductDetail />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path='/product-management/products' element={<ProductManagement />} />
      <Route path='/product-management/attributes' element={<AttributeManagement />} />
      <Route path='/product-management/options' element={<OptionManagement />} />
      <Route path='/product-management/products/create' element={<ProductCreate />} />
      <Route path='/product-management/attributes/create' element={<SpecAttributeCreate/>}/>
      <Route path='/product-management/options/create'element={<OptionCreate/>}/>
      <Route path="/product-management/inventory" element={<InventoryManagement />} />
      <Route path="/product-management/inventory/create" element={<InventoryCreate />} />
      <Route path="/product-management/inventory/:id" element={<InventoryDetail />}/>
      <Route path="/order-management" element={<OrderManagement/>}/>
      <Route path="/reports&statistics" element={<ReportsStatistics/>}/>
      <Route path="/customer-management" element={<CustomerManagement/>}/>
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
          <ProtectedRoute roles={['ROLE_ADMIN','ROLE_SUPER_ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
