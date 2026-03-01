import { useState } from 'react'
import { getGrowthLogs, getPlots, getSpecies, getTrees } from '../../lib/database/firestoreService'

function toCsv<T extends object>(rows: T[]) {
  if (rows.length === 0) {
    return ''
  }

  const normalizedRows = rows as Array<Record<string, unknown>>
  const headers = Object.keys(normalizedRows[0])
  const lines = [headers.join(',')]

  normalizedRows.forEach((row) => {
    const cells = headers.map((key) => {
      const raw = row[key]
      const value = raw === null || raw === undefined ? '' : String(raw)
      return `"${value.split('"').join('""')}"`
    })
    lines.push(cells.join(','))
  })

  return lines.join('\n')
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function DataExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async () => {
    setLoading(true)
    setError(null)

    try {
      const plots = await getPlots()
      const allTrees = (await Promise.all(plots.map((plot) => getTrees(plot.id)))).flat()
      const growthLogs = (await Promise.all(allTrees.map((tree) => getGrowthLogs(tree.id)))).flat()
      const species = await getSpecies()

      downloadCsv('plots.csv', toCsv(plots))
      downloadCsv('trees.csv', toCsv(allTrees))
      downloadCsv('growth_logs.csv', toCsv(growthLogs))
      downloadCsv('species.csv', toCsv(species))
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export CSV ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-green-800">Data Export</h3>
      <p className="mb-3 text-sm text-gray-600">ส่งออก CSV: plots, trees, growth_logs, species</p>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => void exportData()}
        disabled={loading}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:opacity-40"
      >
        {loading ? 'กำลังเตรียมไฟล์...' : 'Export CSV'}
      </button>
    </section>
  )
}
