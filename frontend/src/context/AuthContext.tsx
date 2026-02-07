import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  restaurantName: string
  restaurantKey: string
  managerId: string
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  demoLogin: (role: UserRole) => void
}

const demoUsers: Record<UserRole, AuthUser> = {
  restaurant_admin: {
    name: 'Yiannis Papadopoulos',
    email: 'admin@mykonos.com',
    restaurant: 'Mykonos Mediterranean',
    restaurantKey: 'REST-MYK2026-ATHNS',
  },
  manager: {
    name: 'Elena Dimitriou',
    email: 'elena@mykonos.com',
    restaurant: 'Mykonos Mediterranean',
    managerId: 'MGR-ELENA26-MYKNS',
  },
  pos_user: {
    name: 'Nikos Server',
    email: 'nikos@mykonos.com',
    restaurant: 'Mykonos Mediterranean',
  },
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') as UserRole | null
    if (savedToken) {
      setToken(savedToken)
      const r = savedRole || 'restaurant_admin'
      setRole(r)
      setUser(demoUsers[r])
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
    setToken(null)
    setRole(null)
    setUser(null)
  }

  const demoLogin = (selectedRole: UserRole) => {
    const demoToken = `demo-token-${selectedRole}`
    localStorage.setItem('token', demoToken)
    localStorage.setItem('role', selectedRole)
    setToken(demoToken)
    setRole(selectedRole)
    setUser(demoUsers[selectedRole])
  }

  const restaurantName = user?.restaurant || 'Mykonos Mediterranean'
  const restaurantKey = user?.restaurantKey || 'REST-MYK2026-ATHNS'
  const managerId = user?.managerId || ''

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      restaurantName,
      restaurantKey,
      managerId,
      isAuthenticated: !!token,
      login,
      logout,
      demoLogin,
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
