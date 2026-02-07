/**
 * Navigation Guard Component
 *
 * Prevents POS users from accessing admin pages.
 * Implements strict navigation restrictions.
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationGuardProps {
  children: React.ReactNode
  userRole?: string
}

// POS users can ONLY access these routes
const POS_ALLOWED_ROUTES = [
  '/',
  '/pos',
  '/bohpos',
]

export default function NavigationGuard({ children, userRole }: NavigationGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const role = userRole || localStorage.getItem('user_role') || 'guest'

    if (role === 'pos_user' || role === 'pos') {
      const currentPath = location.pathname

      const isAllowed = POS_ALLOWED_ROUTES.some(route =>
        currentPath === route || currentPath.startsWith('/pos/')
      )

      if (!isAllowed) {
        console.warn(`[Navigation Guard] POS user blocked from accessing: ${currentPath}`)
        navigate('/pos', { replace: true })
      }
    }
  }, [location, userRole, navigate])

  return <>{children}</>
}

/**
 * Hook to check if navigation is allowed for current user
 */
export function useNavigationGuard() {
  const navigate = useNavigate()

  const canNavigateTo = (path: string): boolean => {
    const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'guest'

    if (role === 'pos_user' || role === 'pos') {
      return POS_ALLOWED_ROUTES.some(route =>
        path === route || path.startsWith('/pos/')
      )
    }

    return true
  }

  const guardedNavigate = (path: string) => {
    if (canNavigateTo(path)) {
      navigate(path)
    } else {
      console.warn(`[Navigation Guard] Navigation to ${path} blocked`)
      navigate('/pos', { replace: true })
    }
  }

  return { canNavigateTo, guardedNavigate }
}
