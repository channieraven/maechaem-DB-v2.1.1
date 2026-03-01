import type { Plot } from '../../lib/database.types'
import { usePlots } from '../../hooks/usePlots'

type PlotListProps = {
  selectedPlotId: string | null
  onSelectPlot: (plot: Plot) => void
}

export default function PlotList({ selectedPlotId, onSelectPlot }: PlotListProps) {
  const { plots, isLoading, error, refresh } = usePlots()

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-green-800">Plots</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแปลง...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <ul className="space-y-2">
          {plots.map((plot) => (
            <li key={plot.id}>
              <button
                type="button"
                onClick={() => onSelectPlot(plot)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  selectedPlotId === plot.id
                    ? 'border-green-700 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{plot.plot_code}</p>
                <p className="text-xs text-gray-600">{plot.name_short}</p>
              </button>
            </li>
          ))}
          {plots.length === 0 && <li className="text-sm text-gray-500">ยังไม่มีข้อมูลแปลง</li>}
        </ul>
      )}
    </section>
  )
}
