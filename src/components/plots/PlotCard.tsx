import { Link } from 'react-router-dom'
import type { Plot } from '../../lib/database.types'

type PlotCardProps = {
  plot: Plot
  isSelected?: boolean
  onSelect?: (plot: Plot) => void
}

function calculateSurvivalRate(plot: Plot): number {
  if (plot.tree_count <= 0) {
    return 0
  }

  return (plot.alive_count / plot.tree_count) * 100
}

export default function PlotCard({ plot, isSelected = false, onSelect }: PlotCardProps) {
  const survivalRate = calculateSurvivalRate(plot)

  return (
    <article
      className={[
        'rounded-xl border bg-white p-4 transition',
        isSelected ? 'border-green-700 bg-green-50' : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}
    >
      <div className="mb-3">
        <h3 className="text-base font-semibold text-green-900">{plot.name_short || '-'}</h3>
        <p className="text-xs text-gray-500">รหัสแปลง: {plot.plot_code}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">เจ้าของแปลง</dt>
          <dd className="font-medium text-gray-800">{plot.owner_name || '-'}</dd>
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">กลุ่ม</dt>
          <dd className="font-medium text-gray-800">{plot.group_number}</dd>
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">จำนวนต้นไม้</dt>
          <dd className="font-medium text-gray-800">{plot.tree_count.toLocaleString('th-TH')}</dd>
        </div>

        <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">อัตรารอด</dt>
          <dd className="font-semibold text-emerald-700">{survivalRate.toFixed(1)}%</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(plot)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            เลือกแปลง
          </button>
        ) : (
          <Link
            to={`/plots/${encodeURIComponent(plot.plot_code)}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            ดูรายละเอียด
          </Link>
        )}
      </div>
    </article>
  )
}
