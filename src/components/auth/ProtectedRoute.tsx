import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../../lib/database.types'
import { useAuth } from '../../contexts/AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isApproved, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isApproved) {
    return <Navigate to="/pending" replace />
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    if (role === 'pending') {
      return <Navigate to="/pending" replace />
    }

    return <Navigate to="/plots" replace />
  }

  return <>{children}</>
}
