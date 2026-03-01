import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGrowthLogs } from '../../hooks/useGrowthLogs'
import type { TreeStatus } from '../../lib/database.types'
import { addGrowthLog } from '../../lib/database/firestoreService'

type GrowthLogListProps = {
  treeId: string | null
}

export default function GrowthLogList({ treeId }: GrowthLogListProps) {
  const { user } = useAuth()
  const { growthLogs, isLoading, error, refresh } = useGrowthLogs(treeId)
  const [surveyDate, setSurveyDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [heightM, setHeightM] = useState('')
  const [status, setStatus] = useState<TreeStatus>('alive')
  const [flowering, setFlowering] = useState(false)
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = Boolean(treeId && user?.uid && heightM.trim() && !isSubmitting)

  const handleSubmit = async () => {
    if (!treeId || !user?.uid || !heightM.trim()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await addGrowthLog({
        tree_id: treeId,
        survey_date: surveyDate,
        recorder_id: user.uid,
        height_m: Number(heightM),
        status,
        flowering,
        note,
        synced_from: 'web',
        created_at: new Date().toISOString(),
      })

      setHeightM('')
      setFlowering(false)
      setNote('')
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'บันทึกข้อมูลการเจริญเติบโตไม่สำเร็จ'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-green-800">Growth Logs</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!treeId}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          รีเฟรช
        </button>
      </div>

      {!treeId && <p className="text-sm text-gray-500">กรุณาเลือกต้นไม้ก่อน</p>}
      {treeId && (
        <div className="mb-4 grid gap-2 rounded-lg border border-gray-200 p-3">
          <input
            type="date"
            value={surveyDate}
            onChange={(event) => setSurveyDate(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
          <input
            type="number"
            value={heightM}
            onChange={(event) => setHeightM(event.target.value)}
            placeholder="ความสูง (เมตร)"
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TreeStatus)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="alive">alive</option>
            <option value="dead">dead</option>
            <option value="missing">missing</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={flowering}
              onChange={(event) => setFlowering(event.target.checked)}
            />
            มีดอก (flowering)
          </label>

          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="หมายเหตุ"
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          />

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่ม Growth Log'}
          </button>
        </div>
      )}

      {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
      {treeId && isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลการเจริญเติบโต...</p>}
      {treeId && error && <p className="text-sm text-red-600">{error.message}</p>}

      {treeId && !isLoading && !error && (
        <ul className="space-y-2">
          {growthLogs.map((log) => (
            <li key={log.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              <p className="font-medium">วันที่สำรวจ: {String(log.survey_date)}</p>
              <p className="text-xs text-gray-600">ความสูง: {log.height_m} ม. | สถานะ: {log.status}</p>
            </li>
          ))}
          {growthLogs.length === 0 && <li className="text-sm text-gray-500">ยังไม่มีบันทึกการสำรวจ</li>}
        </ul>
      )}
    </section>
  )
}
