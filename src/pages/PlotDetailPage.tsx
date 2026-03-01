import { Link, Navigate, useParams } from 'react-router-dom'
import PlotDetail from '../components/plots/PlotDetail'
import { usePlots } from '../hooks/usePlots'

export default function PlotDetailPage() {
  const { plotCode } = useParams<{ plotCode: string }>()
  const { plots, isLoading, error, refresh } = usePlots()

  if (!plotCode) {
    return <Navigate to="/plots" replace />
  }

  const normalizedCode = decodeURIComponent(plotCode)
  const plot = plots.find((item) => item.plot_code === normalizedCode)

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
        <div>
          <h1 className="text-xl font-bold text-green-800">รายละเอียดแปลง</h1>
          <p className="mt-1 text-sm text-gray-600">ข้อมูลเชิงลึกของแปลงปลูกและสถิติการรอด</p>
        </div>
        <Link
          to="/plots"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          ย้อนกลับรายการ
        </Link>
      </header>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดรายละเอียดแปลง...</p>}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error.message}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {!isLoading && !error && !plot && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">ไม่พบข้อมูลแปลงที่เลือก</p>
        </div>
      )}

      {!isLoading && !error && plot && <PlotDetail plot={plot} />}
    </section>
  )
}
