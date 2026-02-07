import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCuisineTemplate } from '../data/cuisineTemplates'

export type UserRole = 'restaurant_admin' | 'manager' | 'pos_user'

export interface OnboardingData {
  subscriptionTier: string
  restaurantName: string
  restaurantLocation?: string
  cuisineType?: string
  menuItems?: string[]
  notificationsEnabled: boolean
  themePreference: string
  profilePictureUrl?: string | null
}

interface AuthUser {
  name: string
  email: string
  restaurant?: string
  restaurantKey?: string
  managerId?: string
  profilePictureUrl?: string | null
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
  onboardingCompleted: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  demoLogin: (role: UserRole, cuisine?: string) => void
  setCuisineType: (cuisine: string) => void
  completeOnboarding: (data: OnboardingData) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('onboardingCompleted') === 'true'
  })
  const [cuisineType, setCuisineTypeState] = useState<string>(() => {
    return localStorage.getItem('cuisineType') || 'mediterranean'
  })

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') as UserRole | null
    const savedCuisine = localStorage.getItem('cuisineType') || 'mediterranean'
    const savedOnboarding = localStorage.getItem('onboardingCompleted') === 'true'
    const savedProfilePic = localStorage.getItem('profilePicture') || null
    if (savedToken) {
      setToken(savedToken)
      const r = savedRole || 'restaurant_admin'
      setRole(r)
      setCuisineTypeState(savedCuisine)
      setOnboardingCompleted(savedOnboarding)
      if (savedToken.startsWith('demo-token-')) {
        const template = getCuisineTemplate(savedCuisine)
        setUser(template.demoUsers[r] || template.demoUsers.restaurant_admin)
      } else {
        const savedName = localStorage.getItem('userName') || ''
        const savedEmail = localStorage.getItem('userEmail') || ''
        setUser({
          name: savedName,
          email: savedEmail,
          profilePictureUrl: savedProfilePic,
        })
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { login: apiLogin } = await import('../services/api')
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', 'restaurant_admin')
    setToken(data.access_token)
    setRole('restaurant_admin')

    // Try to fetch user profile from backend
    try {
      const api = (await import('../services/api')).default
      const meResponse = await api.get('/auth/me')
      const userData = meResponse.data
      const userName = userData.name || email.split('@')[0]
      localStorage.setItem('userName', userName)
      localStorage.setItem('userEmail', userData.email || email)
      setUser({ name: userName, email: userData.email || email, profilePictureUrl: userData.profile_picture_url })
      const completed = userData.onboarding_completed || false
      localStorage.setItem('onboardingCompleted', String(completed))
      setOnboardingCompleted(completed)
    } catch {
      // Backend might not be available
      const userName = email.split('@')[0]
      localStorage.setItem('userName', userName)
      localStorage.setItem('userEmail', email)
      setUser({ name: userName, email })
      const saved = localStorage.getItem('onboardingCompleted') === 'true'
      setOnboardingCompleted(saved)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('cuisineType')
    localStorage.removeItem('onboardingCompleted')
    localStorage.removeItem('profilePicture')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('restaurantName')
    localStorage.removeItem('subscriptionTier')
    setToken(null)
    setRole(null)
    setUser(null)
    setOnboardingCompleted(false)
    setCuisineTypeState('mediterranean')
  }

  const demoLogin = (selectedRole: UserRole, cuisine?: string) => {
    const selectedCuisine = cuisine || cuisineType
    const demoToken = `demo-token-${selectedRole}`
    localStorage.setItem('token', demoToken)
    localStorage.setItem('role', selectedRole)
    localStorage.setItem('cuisineType', selectedCuisine)
    localStorage.setItem('onboardingCompleted', 'true')
    setToken(demoToken)
    setRole(selectedRole)
    setCuisineTypeState(selectedCuisine)
    setOnboardingCompleted(true)
    const template = getCuisineTemplate(selectedCuisine)
    setUser(template.demoUsers[selectedRole] || template.demoUsers.restaurant_admin)
  }

  const setCuisineType = (cuisine: string) => {
    localStorage.setItem('cuisineType', cuisine)
    setCuisineTypeState(cuisine)
    if (role) {
      const template = getCuisineTemplate(cuisine)
      setUser(template.demoUsers[role] || template.demoUsers.restaurant_admin)
    }
  }

  const completeOnboarding = async (data: OnboardingData) => {
    // Try to persist to backend
    try {
      const currentToken = localStorage.getItem('token')
      if (currentToken && !currentToken.startsWith('demo-token-')) {
        const api = (await import('../services/api')).default
        await api.post('/auth/complete-onboarding', {
          subscription_tier: data.subscriptionTier,
          restaurant_name: data.restaurantName,
          restaurant_location: data.restaurantLocation,
          cuisine_type: data.cuisineType,
          menu_items: data.menuItems,
          notifications_enabled: data.notificationsEnabled,
          theme_preference: data.themePreference,
          profile_picture_url: data.profilePictureUrl,
        })
      }
    } catch {
      // Backend not available, continue in demo mode
    }

    // Always persist locally
    localStorage.setItem('onboardingCompleted', 'true')
    localStorage.setItem('cuisineType', data.cuisineType || 'mediterranean')
    localStorage.setItem('restaurantName', data.restaurantName)
    localStorage.setItem('subscriptionTier', data.subscriptionTier)
    if (data.profilePictureUrl) {
      localStorage.setItem('profilePicture', data.profilePictureUrl)
    }
    setCuisineTypeState(data.cuisineType || 'mediterranean')
    setOnboardingCompleted(true)
    setUser(prev => prev ? {
      ...prev,
      restaurant: data.restaurantName,
      profilePictureUrl: data.profilePictureUrl,
    } : prev)
  }

  const template = getCuisineTemplate(cuisineType)
  const restaurantName = user?.restaurant || localStorage.getItem('restaurantName') || template.restaurantName
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
      onboardingCompleted,
      login,
      logout,
      demoLogin,
      setCuisineType,
      completeOnboarding,
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
