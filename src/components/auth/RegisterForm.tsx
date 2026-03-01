import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type RegisterFormProps = {
  onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [position, setPosition] = useState('')
  const [organization, setOrganization] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await register(email.trim(), password, fullname.trim(), position.trim(), organization.trim())
      onSuccess?.()
    } catch (submitError) {
      const code = (submitError as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกลงทะเบียนไปแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบด้วยบัญชีเดิม')
      } else {
        setError(submitError instanceof Error ? submitError.message : 'ไม่สามารถสมัครสมาชิกได้')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="register-fullname" className="mb-1 block text-sm font-medium text-gray-700">
          ชื่อ-นามสกุล
        </label>
        <input
          id="register-fullname"
          value={fullname}
          onChange={(event) => setFullname(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="register-position" className="mb-1 block text-sm font-medium text-gray-700">
          ตำแหน่ง
        </label>
        <input
          id="register-position"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="register-org" className="mb-1 block text-sm font-medium text-gray-700">
          องค์กร
        </label>
        <input
          id="register-org"
          value={organization}
          onChange={(event) => setOrganization(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || isLoading}
        className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
      >
        {submitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
      </button>
    </form>
  )
}
