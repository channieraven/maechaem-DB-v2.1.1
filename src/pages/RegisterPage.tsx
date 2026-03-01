import { Link, Navigate } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const { user, isApproved, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-600">กำลังโหลด...</p>
      </main>
    )
  }

  if (user && isApproved) {
    return <Navigate to="/plots" replace />
  }

  if (user && !isApproved) {
    return <Navigate to="/pending" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-xl font-bold text-green-800">สมัครสมาชิกโครงการ Mae Chaem DB</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          มีบัญชีแล้ว?{' '}
          <Link to="/login" className="font-medium text-green-700 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </main>
  )
}
