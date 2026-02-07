import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCuisineTemplate } from '../data/cuisineTemplates'

export type UserRole = 'restaurant_admin' | 'manager' | 'pos_user'

interface AuthUser {
  name: string
  email: string
  restaurant?: string
  restaurantKey?: string
  managerId?: string
}

interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  token: string | null
  cuisineType: string
  restaurantName: string
  restaurantKey: string
  restaurantId: string
  managerId: string
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  demoLogin: (role: UserRole, cuisine?: string) => void
  setCuisineType: (cuisine: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [cuisineType, setCuisineTypeState] = useState<string>(() => {
    return localStorage.getItem('cuisineType') || 'mediterranean'
  })

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') as UserRole | null
    const savedCuisine = localStorage.getItem('cuisineType') || 'mediterranean'
    if (savedToken) {
      setToken(savedToken)
      const r = savedRole || 'restaurant_admin'
      setRole(r)
      setCuisineTypeState(savedCuisine)
      const template = getCuisineTemplate(savedCuisine)
      setUser(template.demoUsers[r] || template.demoUsers.restaurant_admin)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { login: apiLogin } = await import('../services/api')
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', 'restaurant_admin')
    setToken(data.access_token)
    setRole('restaurant_admin')
    setUser({ name: email.split('@')[0], email })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('cuisineType')
    setToken(null)
    setRole(null)
    setUser(null)
    setCuisineTypeState('mediterranean')
  }

  const demoLogin = (selectedRole: UserRole, cuisine?: string) => {
    const selectedCuisine = cuisine || cuisineType
    const demoToken = `demo-token-${selectedRole}`
    localStorage.setItem('token', demoToken)
    localStorage.setItem('role', selectedRole)
    localStorage.setItem('cuisineType', selectedCuisine)
    setToken(demoToken)
    setRole(selectedRole)
    setCuisineTypeState(selectedCuisine)
    const template = getCuisineTemplate(selectedCuisine)
    setUser(template.demoUsers[selectedRole] || template.demoUsers.restaurant_admin)
  }

  const setCuisineType = (cuisine: string) => {
    localStorage.setItem('cuisineType', cuisine)
    setCuisineTypeState(cuisine)
    // Update user data to match new cuisine
    if (role) {
      const template = getCuisineTemplate(cuisine)
      setUser(template.demoUsers[role] || template.demoUsers.restaurant_admin)
    }
  }

  const template = getCuisineTemplate(cuisineType)
  const restaurantName = user?.restaurant || template.restaurantName
  const restaurantKey = user?.restaurantKey || template.demoUsers.restaurant_admin.restaurantKey || ''
  const restaurantId = restaurantKey || 'demo-restaurant-id'
  const managerId = user?.managerId || ''

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      cuisineType,
      restaurantName,
      restaurantKey,
      restaurantId,
      managerId,
      isAuthenticated: !!token,
      login,
      logout,
      demoLogin,
      setCuisineType,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
