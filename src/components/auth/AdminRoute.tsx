import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminRoute() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
      </main>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/plots" replace />
  }

  return <Outlet />
}
