import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PendingApprovalPage() {
  const { user, isApproved, logout } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isApproved) {
    return <Navigate to="/plots" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-3 text-xl font-bold text-amber-700">บัญชีของคุณกำลังรอการอนุมัติ</h1>
        <p className="mb-6 text-sm text-gray-600">
          ผู้ดูแลระบบยังไม่อนุมัติสิทธิ์การใช้งาน กรุณารอสักครู่ หรือติดต่อผู้ดูแลระบบเพื่อเร่งการอนุมัติ
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          ออกจากระบบ
        </button>
      </section>
    </main>
  )
}
