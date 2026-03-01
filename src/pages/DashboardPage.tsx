import DashboardOverview from '../components/dashboard/DashboardOverview'
import GrowthTrends from '../components/dashboard/GrowthTrends'
import SpeciesDistribution from '../components/dashboard/SpeciesDistribution'
import SurvivalChart from '../components/dashboard/SurvivalChart'

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <h1 className="text-xl font-bold text-green-800">แดชบอร์ด</h1>
        <p className="mt-1 text-sm text-gray-600">ภาพรวม, อัตรารอด, แนวโน้มการเติบโต และสัดส่วนชนิดไม้</p>
      </header>

      <DashboardOverview />

      <section className="grid gap-4 xl:grid-cols-2">
        <SurvivalChart />
        <GrowthTrends />
      </section>

      <SpeciesDistribution />
    </section>
  )
}
