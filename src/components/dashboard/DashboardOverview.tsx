import { useMemo } from 'react'
import { usePlots } from '../../hooks/usePlots'
import { formatNumber } from '../../utils/formatters'

export default function DashboardOverview() {
  const { plots, isLoading, error } = usePlots()

  const stats = useMemo(() => {
    const totalPlots = plots.length
    const totalTrees = plots.reduce((sum, plot) => sum + plot.tree_count, 0)
    const totalAlive = plots.reduce((sum, plot) => sum + plot.alive_count, 0)
    const survivalRate = totalTrees > 0 ? (totalAlive / totalTrees) * 100 : 0

    return {
      totalPlots,
      totalTrees,
      totalAlive,
      survivalRate,
    }
  }, [plots])

  if (isLoading) {
    return <p className="text-sm text-gray-500">กำลังโหลดภาพรวม...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">จำนวนแปลงทั้งหมด</p>
        <p className="text-2xl font-bold text-green-800">{formatNumber(stats.totalPlots)}</p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">จำนวนต้นไม้ทั้งหมด</p>
        <p className="text-2xl font-bold text-green-800">{formatNumber(stats.totalTrees)}</p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">จำนวนต้นรอด</p>
        <p className="text-2xl font-bold text-green-800">{formatNumber(stats.totalAlive)}</p>
      </article>
      <article className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">อัตรารอดรวม</p>
        <p className="text-2xl font-bold text-emerald-700">{stats.survivalRate.toFixed(1)}%</p>
      </article>
    </section>
  )
}
