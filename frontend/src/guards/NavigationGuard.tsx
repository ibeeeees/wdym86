/**
 * Navigation Guard Component
 * 
 * Prevents POS users from accessing admin pages.
 * Implements 26.md strict navigation restrictions.
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationGuardProps {
  children: React.ReactNode
  userRole?: string
}

// POS users can ONLY access these routes
const POS_ALLOWED_ROUTES = [
  '/pos',
  '/pos/dine-in',
  '/pos/takeout',
  '/pos/delivery',
  '/pos/check',
  '/pos/payment',
]

// Admin/Manager routes that POS users CANNOT access
const RESTRICTED_ROUTES = [
  '/admin',
  '/manager',
  '/dashboard',
  '/inventory',
  '/suppliers',
  '/disruptions',
  '/dishes',
  '/floor-plan',
  '/analytics',
  '/staff',
  '/payroll',
  '/settings',
]

export default function NavigationGuard({ children, userRole }: NavigationGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Get user role from localStorage if not provided
    const role = userRole || localStorage.getItem('user_role') || 'guest'

    // If user is a POS user, enforce navigation restrictions
    if (role === 'pos_user' || role === 'pos') {
      const currentPath = location.pathname

      // Check if current route is allowed for POS users
      const isAllowed = POS_ALLOWED_ROUTES.some((route) =>
        currentPath.startsWith(route)
      )

      // Check if trying to access restricted route
      const isRestricted = RESTRICTED_ROUTES.some((route) =>
        currentPath.startsWith(route)
      )

      if (isRestricted || !isAllowed) {
        console.warn(`[Navigation Guard] POS user blocked from accessing: ${currentPath}`)
        
        // Redirect to POS page
        navigate('/pos', { replace: true })
        
        // Show warning
        alert(
          'Access Denied: POS users can only access the Point of Sale system. Contact your manager for additional permissions.'
        )
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
    const role = localStorage.getItem('user_role') || 'guest'

    if (role === 'pos_user' || role === 'pos') {
      // Check if path is allowed
      const isAllowed = POS_ALLOWED_ROUTES.some((route) => path.startsWith(route))
      const isRestricted = RESTRICTED_ROUTES.some((route) => path.startsWith(route))

      return isAllowed && !isRestricted
    }

    // Non-POS users can access everything
    return true
  }

  const guardedNavigate = (path: string) => {
    if (canNavigateTo(path)) {
      navigate(path)
    } else {
      console.warn(`[Navigation Guard] Navigation to ${path} blocked`)
      alert('You do not have permission to access that page.')
    }
  }

  return { canNavigateTo, guardedNavigate }
}

/**
 * Logo Click Handler Component
 * 
 * Prevents POS users from navigating away when clicking logo
 */
interface LogoClickHandlerProps {
  children: React.ReactNode
  defaultPath?: string
}

export function LogoClickHandler({ children, defaultPath = '/' }: LogoClickHandlerProps) {
  const navigate = useNavigate()

  const handleLogoClick = (e: React.MouseEvent) => {
    const role = localStorage.getItem('user_role') || 'guest'

    if (role === 'pos_user' || role === 'pos') {
      // Prevent default navigation
      e.preventDefault()
      
      // Keep POS user on POS page
      navigate('/pos', { replace: true })
    } else {
      // Allow normal navigation for other users
      navigate(defaultPath)
    }
  }

  return <div onClick={handleLogoClick}>{children}</div>
}
