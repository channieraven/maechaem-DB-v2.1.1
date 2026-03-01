import PlotList from '../components/plots/PlotList'

export default function PlotsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
        <h1 className="text-xl font-bold text-green-800">รายการแปลงปลูก</h1>
        <p className="mt-1 text-sm text-gray-600">หน้าแรกหลังเข้าสู่ระบบ แสดงข้อมูลแปลง 12 รายการแรก</p>
      </header>

      <PlotList maxItems={12} />
    </section>
  )
}
