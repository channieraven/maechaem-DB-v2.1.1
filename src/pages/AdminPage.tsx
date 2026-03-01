import DataExport from '../components/admin/DataExport'
import ImportDryRun from '../components/admin/ImportDryRun'
import SpeciesManagement from '../components/admin/SpeciesManagement'
import UserManagement from '../components/admin/UserManagement'

export default function AdminPage() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <h1 className="text-xl font-bold text-green-800">Admin Console</h1>
        <p className="mt-1 text-sm text-gray-600">จัดการผู้ใช้, ชนิดไม้, การตรวจไฟล์นำเข้า และการส่งออกข้อมูล</p>
      </header>

      <UserManagement />
      <SpeciesManagement />
      <ImportDryRun />
      <DataExport />
    </section>
  )
}
