import { usePlots } from '../../hooks/usePlots'

type PlotSelectorProps = {
  selectedPlotId: string | null
  onSelectPlot: (plotId: string) => void
}

export default function PlotSelector({ selectedPlotId, onSelectPlot }: PlotSelectorProps) {
  const { plots, isLoading, error } = usePlots()

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-green-800">1) เลือกแปลง</h3>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดแปลง...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!isLoading && !error && (
        <select
          value={selectedPlotId ?? ''}
          onChange={(event) => onSelectPlot(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">เลือกแปลง</option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name_short} ({plot.plot_code})
            </option>
          ))}
        </select>
      )}
    </section>
  )
}
