import { useMemo, useState } from 'react'
import type { Plot } from '../../lib/database.types'
import TreeMap from '../trees/TreeMap'
import TreeBatchImport from '../trees/TreeBatchImport'
import TreeTable from '../trees/TreeTable'
import { formatDate, formatNumber } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import PlotEditForm from './PlotEditForm'

type PlotDetailProps = {
  plot: Plot
  onUpdate?: () => void
}

type PlotDetailTab = 'overview' | 'metrics' | 'trees' | 'notes'

const tabLabels: Record<PlotDetailTab, string> = {
  overview: 'ข้อมูลทั่วไป',
  metrics: 'สถิติแปลง',
  trees: 'ต้นไม้',
  notes: 'บันทึก',
}

export default function PlotDetail({ plot, onUpdate }: PlotDetailProps) {
  const [activeTab, setActiveTab] = useState<PlotDetailTab>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const { canWrite } = useAuth()

  const survivalRate = useMemo(() => {
    if (plot.tree_count <= 0) {
      return 0
    }

    return (plot.alive_count / plot.tree_count) * 100
  }, [plot.alive_count, plot.tree_count])

  const deadCount = Math.max(plot.tree_count - plot.alive_count, 0)

  const handleEditSuccess = async () => {
    setIsEditing(false)
    await onUpdate?.()
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <header className="mb-4 border-b border-gray-200 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-green-900">{plot.plot_code}</h1>
            <p className="text-sm text-gray-500">{plot.name_short}</p>
          </div>
          {canWrite && !isEditing && activeTab === 'overview' && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-green-700 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              แก้ไข
            </button>
          )}
        </div>
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
        <>
          {isEditing ? (
            <PlotEditForm
              plot={plot}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
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
              {plot.last_edited_by && plot.last_edited_at && (
                <div className="rounded-lg bg-blue-50 px-3 py-2 sm:col-span-2">
                  <dt className="text-xs text-blue-700">แก้ไขล่าสุด</dt>
                  <dd className="font-medium text-blue-900">
                    {plot.last_edited_by} - {formatDate(plot.last_edited_at)}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </>
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
        <section className="space-y-4">
          {canWrite && <TreeBatchImport plot={plot} onImported={onUpdate} />}

          <div className="grid gap-4 xl:grid-cols-2">
            <TreeTable plotId={plot.id} />
            <TreeMap plotId={plot.id} />
          </div>
        </section>
      )}
    </section>
  )
}
