import { useMemo } from 'react'
import type { Plot } from '../../lib/database.types'
import { usePlots } from '../../hooks/usePlots'
import PlotCard from './PlotCard'

type PlotListProps = {
  selectedPlotId?: string | null
  onSelectPlot?: (plot: Plot) => void
  maxItems?: number
}

export default function PlotList({ selectedPlotId = null, onSelectPlot, maxItems }: PlotListProps) {
  const { plots, isLoading, error, refresh } = usePlots()
  const visiblePlots = useMemo(() => {
    const sorted = [...plots].sort((a, b) => a.plot_code.localeCompare(b.plot_code))
    return maxItems ? sorted.slice(0, maxItems) : sorted
  }, [plots, maxItems])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-green-800">แปลงปลูก</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแปลง...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!isLoading && !error && (
        <>
          {visiblePlots.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePlots.map((plot) => (
                <li key={plot.id}>
                  <PlotCard
                    plot={plot}
                    isSelected={selectedPlotId === plot.id}
                    onSelect={onSelectPlot}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลแปลง</p>
          )}
        </>
      )}
    </section>
  )
}
