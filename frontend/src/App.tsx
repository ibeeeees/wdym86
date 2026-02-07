import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IngredientDetail from './pages/IngredientDetail'
import GeminiChat from './pages/GeminiChat'
import Dishes from './pages/Dishes'
import Suppliers from './pages/Suppliers'
import POS from './pages/POS'
import Delivery from './pages/Delivery'
import Pricing from './pages/Pricing'
import SolanaPay from './pages/SolanaPay'
import Downloads from './pages/Downloads'
import Login from './pages/Login'
import StaffLogin from './pages/StaffLogin'
import AdminDashboard from './pages/AdminDashboard'
import RestaurantSettings from './pages/RestaurantSettings'
import KeyManagement from './pages/KeyManagement'
import UserManagement from './pages/UserManagement'
import TeamManagement from './pages/TeamManagement'

function AppRoutes() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // POS user: only POS page
  if (role === 'pos_user') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<POS />} />
          <Route path="/pos" element={<POS />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  // Manager: operational pages + team management
  if (role === 'manager') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredient/:id" element={<IngredientDetail />} />
          <Route path="/dishes" element={<Dishes />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/solana-pay" element={<SolanaPay />} />
          <Route path="/chat" element={<GeminiChat />} />
          <Route path="/team" element={<TeamManagement />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  // Restaurant Admin: full access
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ingredient/:id" element={<IngredientDetail />} />
        <Route path="/dishes" element={<Dishes />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/solana-pay" element={<SolanaPay />} />
        <Route path="/chat" element={<GeminiChat />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/restaurant/settings" element={<RestaurantSettings />} />
        <Route path="/restaurant/keys" element={<KeyManagement />} />
        <Route path="/restaurant/users" element={<UserManagement />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
