import BuildingPlanMap from '../components/building-plan/BuildingPlanMap'
import BuildingPlanUpload from '../components/building-plan/BuildingPlanUpload'

export default function BuildingPlanPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <h1 className="text-xl font-bold text-green-800">แผนผังการปลูก</h1>
        <p className="mt-1 text-sm text-gray-600">
          แผนที่แสดงขอบเขตแปลง, ตำแหน่งต้นไม้, เส้นชั้นความสูง และโครงสร้างพื้นฐาน
        </p>
      </header>

      <BuildingPlanMap />
      <BuildingPlanUpload />
    </section>
  )
}
