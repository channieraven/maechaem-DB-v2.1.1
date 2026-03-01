import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { usePlots } from '../../hooks/usePlots'
import { useSpecies } from '../../hooks/useSpecies'
import { getTrees } from '../../lib/database/firestoreService'

type DistributionRow = {
  speciesId: string
  name: string
  value: number
  color: string
}

export default function SpeciesDistribution() {
  const { plots } = usePlots()
  const { species } = useSpecies()
  const [rows, setRows] = useState<DistributionRow[]>([])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (plots.length === 0 || species.length === 0) {
        setRows([])
        return
      }

      const trees = (await Promise.all(plots.map((plot) => getTrees(plot.id)))).flat()
      const counters = trees.reduce<Record<string, number>>((acc, tree) => {
        acc[tree.species_id] = (acc[tree.species_id] ?? 0) + 1
        return acc
      }, {})

      const nextRows = species
        .map((item) => ({
          speciesId: item.id,
          name: item.name_th,
          value: counters[item.id] ?? 0,
          color: item.hex_color,
        }))
        .filter((item) => item.value > 0)

      if (!ignore) {
        setRows(nextRows)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [plots, species])

  const data = useMemo(() => rows, [rows])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">Species Distribution</h3>

      {data.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีข้อมูลชนิดไม้</p>}

      {data.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={110}>
                {data.map((entry) => (
                  <Cell key={entry.speciesId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
