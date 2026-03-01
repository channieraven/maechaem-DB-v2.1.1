import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usePlots } from '../../hooks/usePlots'
import { getGrowthLogs, getTrees } from '../../lib/database/firestoreService'
import { formatDate } from '../../utils/formatters'

type TrendRow = {
  dateKey: string
  dateLabel: string
  avgHeight: number
}

export default function GrowthTrends() {
  const { plots } = usePlots()
  const [rows, setRows] = useState<TrendRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (plots.length === 0) {
        setRows([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const allTrees = (await Promise.all(plots.map((plot) => getTrees(plot.id)))).flat()
        const allLogs = (await Promise.all(allTrees.map((tree) => getGrowthLogs(tree.id)))).flat()

        const grouped = allLogs.reduce<Record<string, { sum: number; count: number }>>((acc, log) => {
          const dateKey = String(log.survey_date).slice(0, 10)
          if (!acc[dateKey]) {
            acc[dateKey] = { sum: 0, count: 0 }
          }
          acc[dateKey].sum += log.height_m
          acc[dateKey].count += 1
          return acc
        }, {})

        const nextRows = Object.entries(grouped)
          .map(([dateKey, value]) => ({
            dateKey,
            dateLabel: formatDate(dateKey),
            avgHeight: value.count > 0 ? value.sum / value.count : 0,
          }))
          .sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime())

        if (!ignore) {
          setRows(nextRows)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูลแนวโน้มไม่สำเร็จ')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [plots])

  const data = useMemo(() => rows, [rows])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">Growth Trends</h3>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดแนวโน้ม...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!isLoading && !error && data.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีข้อมูลแนวโน้ม</p>}

      {!isLoading && !error && data.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgHeight" name="Avg Height (m)" stroke="#15803D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
