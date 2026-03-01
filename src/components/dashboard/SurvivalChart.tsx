import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usePlots } from '../../hooks/usePlots'

export default function SurvivalChart() {
  const { plots, isLoading, error } = usePlots()

  const data = useMemo(
    () =>
      plots.map((plot) => ({
        name: plot.name_short,
        survivalRate: plot.tree_count > 0 ? (plot.alive_count / plot.tree_count) * 100 : 0,
      })),
    [plots]
  )

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">Survival Rate by Plot</h3>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดกราฟ...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!isLoading && !error && data.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>}

      {!isLoading && !error && data.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="survivalRate" fill="#16A34A" name="Survival %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
