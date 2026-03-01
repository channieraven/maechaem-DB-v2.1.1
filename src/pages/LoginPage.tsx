import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'
import { useAuth } from '../contexts/AuthContext'

type AuthTab = 'login' | 'register'

export default function LoginPage() {
  const { user, isApproved } = useAuth()
  const [tab, setTab] = useState<AuthTab>('login')

  if (user && isApproved) {
    return <Navigate to="/" replace />
  }

  if (user && !isApproved) {
    return <Navigate to="/pending-approval" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-xl font-bold text-green-800">เข้าสู่ระบบโครงการ Mae Chaem DB</h1>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`rounded-md px-3 py-2 font-medium ${
              tab === 'login' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`rounded-md px-3 py-2 font-medium ${
              tab === 'register' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {tab === 'login' ? <LoginForm /> : <RegisterForm onSuccess={() => setTab('login')} />}
      </section>
    </main>
  )
}
