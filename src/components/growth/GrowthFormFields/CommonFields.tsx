import type { TreeStatus } from '../../../lib/database.types'

type CommonValues = {
  surveyDate: string
  heightM: number
  status: TreeStatus
  flowering: boolean
  note: string
}

type CommonFieldsProps = {
  values: CommonValues
  onChange: <K extends keyof CommonValues>(key: K, value: CommonValues[K]) => void
}

export default function CommonFields({ values, onChange }: CommonFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label htmlFor="surveyDate" className="mb-1 block text-xs font-medium text-gray-600">
          วันที่สำรวจ
        </label>
        <input
          id="surveyDate"
          type="date"
          value={values.surveyDate}
          onChange={(event) => onChange('surveyDate', event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="heightM" className="mb-1 block text-xs font-medium text-gray-600">
          ความสูง (เมตร)
        </label>
        <input
          id="heightM"
          type="number"
          min={0}
          step="0.01"
          value={values.heightM}
          onChange={(event) => onChange('heightM', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-xs font-medium text-gray-600">
          สถานะ
        </label>
        <select
          id="status"
          value={values.status}
          onChange={(event) => onChange('status', event.target.value as TreeStatus)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="alive">มีชีวิต</option>
          <option value="dead">ตาย</option>
          <option value="missing">ไม่พบต้น</option>
        </select>
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.flowering}
          onChange={(event) => onChange('flowering', event.target.checked)}
        />
        มีดอก
      </label>

      <div className="md:col-span-2">
        <label htmlFor="note" className="mb-1 block text-xs font-medium text-gray-600">
          หมายเหตุ
        </label>
        <textarea
          id="note"
          rows={3}
          value={values.note}
          onChange={(event) => onChange('note', event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
