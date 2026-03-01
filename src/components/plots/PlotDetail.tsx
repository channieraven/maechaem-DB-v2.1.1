import { useMemo, useState } from 'react'
import type { Plot } from '../../lib/database.types'
import TreeMap from '../trees/TreeMap'
import TreeTable from '../trees/TreeTable'
import { formatDate, formatNumber } from '../../utils/formatters'

type PlotDetailProps = {
  plot: Plot
}

type PlotDetailTab = 'overview' | 'metrics' | 'trees' | 'notes'

const tabLabels: Record<PlotDetailTab, string> = {
  overview: 'ข้อมูลทั่วไป',
  metrics: 'สถิติแปลง',
  trees: 'ต้นไม้',
  notes: 'บันทึก',
}

export default function PlotDetail({ plot }: PlotDetailProps) {
  const [activeTab, setActiveTab] = useState<PlotDetailTab>('overview')

  const survivalRate = useMemo(() => {
    if (plot.tree_count <= 0) {
      return 0
    }

    return (plot.alive_count / plot.tree_count) * 100
  }, [plot.alive_count, plot.tree_count])

  const deadCount = Math.max(plot.tree_count - plot.alive_count, 0)

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <header className="mb-4 border-b border-gray-200 pb-3">
        <h1 className="text-xl font-semibold text-green-900">{plot.name_short}</h1>
        <p className="text-sm text-gray-500">รหัสแปลง: {plot.plot_code}</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['overview', 'metrics', 'trees', 'notes'] as PlotDetailTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              activeTab === tab ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ].join(' ')}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">เจ้าของแปลง</dt>
            <dd className="font-medium text-gray-800">{plot.owner_name || '-'}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">กลุ่ม</dt>
            <dd className="font-medium text-gray-800">{formatNumber(plot.group_number)}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">พื้นที่ (ตร.ม.)</dt>
            <dd className="font-medium text-gray-800">{formatNumber(plot.area_sq_m)}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">ตำบล</dt>
            <dd className="font-medium text-gray-800">{plot.tambon || '-'}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
            <dt className="text-xs text-gray-500">ความสูงจากระดับน้ำทะเล (ม.)</dt>
            <dd className="font-medium text-gray-800">{formatNumber(plot.elevation_m)}</dd>
          </div>
        </dl>
      )}

      {activeTab === 'metrics' && (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <dt className="text-xs text-emerald-700">จำนวนต้นไม้ทั้งหมด</dt>
            <dd className="text-lg font-semibold text-emerald-900">{formatNumber(plot.tree_count)}</dd>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <dt className="text-xs text-emerald-700">จำนวนต้นรอด</dt>
            <dd className="text-lg font-semibold text-emerald-900">{formatNumber(plot.alive_count)}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">จำนวนต้นตาย/หาย</dt>
            <dd className="font-semibold text-gray-800">{formatNumber(deadCount)}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <dt className="text-xs text-gray-500">อัตรารอด</dt>
            <dd className="font-semibold text-emerald-700">{survivalRate.toFixed(1)}%</dd>
          </div>
        </dl>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-3 text-sm">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">สำรวจล่าสุด</p>
            <p className="font-medium text-gray-800">{formatDate(plot.latest_survey_date)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">หมายเหตุ</p>
            <p className="whitespace-pre-wrap font-medium text-gray-800">{plot.note || '-'}</p>
          </div>
        </div>
      )}

      {activeTab === 'trees' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <TreeTable plotId={plot.id} />
          <TreeMap plotId={plot.id} />
        </section>
      )}
    </section>
  )
}
