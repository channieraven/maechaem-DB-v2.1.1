import { useMemo } from 'react'
import { useGrowthLogs } from '../../hooks/useGrowthLogs'
import { formatDate, formatNumber, getStatusLabel } from '../../utils/formatters'

type GrowthLogTableProps = {
  treeId: string
}

export default function GrowthLogTable({ treeId }: GrowthLogTableProps) {
  const { growthLogs, isLoading, error, refresh } = useGrowthLogs(treeId)

  const rows = useMemo(
    () =>
      [...growthLogs].sort(
        (a, b) => new Date(String(b.survey_date)).getTime() - new Date(String(a.survey_date)).getTime()
      ),
    [growthLogs]
  )

  return (
    <section className="card rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-green-800">บันทึกการเจริญเติบโต</h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดบันทึก...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!isLoading && !error && rows.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีข้อมูลสำรวจ</p>}

      {!isLoading && !error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="fluent-table min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">วันที่</th>
                <th className="px-3 py-2">ความสูง (ม.)</th>
                <th className="px-3 py-2">สถานะ</th>
                <th className="px-3 py-2">มีดอก</th>
                <th className="px-3 py-2">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-gray-700">{formatDate(log.survey_date)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatNumber(log.height_m)}</td>
                  <td className="px-3 py-2 text-gray-700">{getStatusLabel(log.status)}</td>
                  <td className="px-3 py-2 text-gray-700">{log.flowering ? 'ใช่' : 'ไม่'}</td>
                  <td className="px-3 py-2 text-gray-700">{log.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
