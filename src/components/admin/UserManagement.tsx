import { useEffect, useMemo, useState } from 'react'
import type { Profile, UserRole } from '../../lib/database.types'
import { getProfiles, updateProfileRole } from '../../lib/database/firestoreService'
import { getRoleLabel } from '../../utils/formatters'

const ROLE_OPTIONS: UserRole[] = ['pending', 'staff', 'researcher', 'executive', 'external', 'admin']

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getProfiles()
      setProfiles(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'โหลดผู้ใช้ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfiles()
  }, [])

  const pendingUsers = useMemo(() => profiles.filter((profile) => profile.role === 'pending' || !profile.approved), [profiles])

  const handleUpdate = async (profileId: string, role: UserRole, approved: boolean) => {
    await updateProfileRole(profileId, role, approved)
    await loadProfiles()
  }

  return (
    <section className="card rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-green-800">จัดการผู้ใช้งาน</h3>
        <button
          type="button"
          onClick={() => void loadProfiles()}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">กำลังโหลดผู้ใช้...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">รออนุมัติ</p>
            <ul className="space-y-2">
              {pendingUsers.map((profile) => (
                <li key={profile.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-gray-800">{profile.fullname}</p>
                  <p className="text-xs text-gray-600">{profile.email}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdate(profile.id, 'staff', true)}
                      className="rounded-md bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-800"
                    >
                      อนุมัติเป็นเจ้าหน้าที่
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleUpdate(profile.id, 'pending', false)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      คงสถานะรออนุมัติ
                    </button>
                  </div>
                </li>
              ))}
              {pendingUsers.length === 0 && <li className="text-sm text-gray-500">ไม่มีผู้ใช้รออนุมัติ</li>}
            </ul>
          </div>

          <div className="overflow-x-auto">
            <p className="mb-2 text-sm font-semibold text-gray-700">จัดการบทบาทผู้ใช้</p>
            <table className="fluent-table min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">ชื่อ</th>
                  <th className="px-3 py-2">อีเมล</th>
                  <th className="px-3 py-2">บทบาท</th>
                  <th className="px-3 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-3 py-2">{profile.fullname}</td>
                    <td className="px-3 py-2">{profile.email}</td>
                    <td className="px-3 py-2">
                      <select
                        value={profile.role}
                        onChange={(event) => void handleUpdate(profile.id, event.target.value as UserRole, profile.approved)}
                        className="rounded-md border border-gray-300 px-2 py-1"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profile.approved}
                          onChange={(event) => void handleUpdate(profile.id, profile.role, event.target.checked)}
                        />
                        อนุมัติแล้ว
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
