import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IngredientDetail from './pages/IngredientDetail'
import GeminiChat from './pages/GeminiChat'
import Dishes from './pages/Dishes'
import Suppliers from './pages/Suppliers'
import Login from './pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Layout onLogout={() => {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredient/:id" element={<IngredientDetail />} />
          <Route path="/dishes" element={<Dishes />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/chat" element={<GeminiChat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  )
}

export default App
