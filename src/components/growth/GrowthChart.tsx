import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useGrowthLogs } from '../../hooks/useGrowthLogs'
import { getGrowthDbhByTreeId } from '../../lib/database/firestoreService'
import { formatDate } from '../../utils/formatters'

type GrowthChartProps = {
  treeId: string
}

type DbhRow = {
  growth_log_id: string
  dbh_cm: number
}

export default function GrowthChart({ treeId }: GrowthChartProps) {
  const { growthLogs, isLoading, error } = useGrowthLogs(treeId)
  const [dbhRows, setDbhRows] = useState<DbhRow[]>([])

  useEffect(() => {
    let ignore = false

    const loadDbh = async () => {
      const rows = await getGrowthDbhByTreeId(treeId)
      if (!ignore) {
        setDbhRows(rows)
      }
    }

    void loadDbh()

    return () => {
      ignore = true
    }
  }, [treeId])

  const chartData = useMemo(() => {
    const dbhByLogId = new Map(dbhRows.map((item) => [item.growth_log_id, item.dbh_cm]))

    return [...growthLogs]
      .sort((a, b) => new Date(String(a.survey_date)).getTime() - new Date(String(b.survey_date)).getTime())
      .map((item) => ({
        date: formatDate(item.survey_date),
        height: item.height_m,
        dbh: dbhByLogId.get(item.id) ?? null,
      }))
  }, [dbhRows, growthLogs])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">แนวโน้มการเติบโต</h3>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดกราฟ...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      {!isLoading && !error && chartData.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีข้อมูลเพียงพอ</p>}

      {!isLoading && !error && chartData.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="height" name="Height (m)" stroke="#15803D" strokeWidth={2} />
              <Line type="monotone" dataKey="dbh" name="DBH (cm)" stroke="#2563EB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
