import { useState } from 'react'
import type { Plot } from '../../lib/database.types'
import { updatePlot } from '../../lib/database/firestoreService'
import { useAuth } from '../../contexts/AuthContext'

type PlotEditFormProps = {
  plot: Plot
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PlotEditForm({ plot, onSuccess, onCancel }: PlotEditFormProps) {
  const { profile } = useAuth()
  const [ownerName, setOwnerName] = useState(plot.owner_name || '')
  const [areaSqM, setAreaSqM] = useState(plot.area_sq_m?.toString() || '0')
  const [tambon, setTambon] = useState(plot.tambon || '')
  const [elevationM, setElevationM] = useState(plot.elevation_m?.toString() || '0')
  const [note, setNote] = useState(plot.note || '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const areaNum = parseFloat(areaSqM)
      const elevNum = parseFloat(elevationM)

      if (isNaN(areaNum) || areaNum <= 0) {
        setError('กรุณาระบุพื้นที่เป็นตัวเลขที่มากกว่า 0')
        setSubmitting(false)
        return
      }

      if (isNaN(elevNum)) {
        setError('กรุณาระบุความสูงเป็นตัวเลข')
        setSubmitting(false)
        return
      }

      await updatePlot(plot.id, {
        owner_name: ownerName.trim(),
        area_sq_m: areaNum,
        tambon: tambon.trim(),
        elevation_m: elevNum,
        note: note.trim(),
        last_edited_by: profile?.fullname || 'Unknown',
        last_edited_at: new Date().toISOString(),
      })

      onSuccess?.()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="owner-name" className="mb-1 block text-sm font-medium text-gray-700">
          เจ้าของแปลง
        </label>
        <input
          id="owner-name"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="area" className="mb-1 block text-sm font-medium text-gray-700">
          พื้นที่ (ตร.ม.)
        </label>
        <input
          id="area"
          type="number"
          step="0.01"
          value={areaSqM}
          onChange={(event) => setAreaSqM(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="tambon" className="mb-1 block text-sm font-medium text-gray-700">
          ตำบล
        </label>
        <input
          id="tambon"
          value={tambon}
          onChange={(event) => setTambon(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="elevation" className="mb-1 block text-sm font-medium text-gray-700">
          ความสูงจากระดับน้ำทะเล (ม.)
        </label>
        <input
          id="elevation"
          type="number"
          step="0.01"
          value={elevationM}
          onChange={(event) => setElevationM(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          required
        />
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-gray-700">
          หมายเหตุ
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          rows={4}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  )
}
