import { Link } from 'react-router-dom'
import { useSpecies } from '../../hooks/useSpecies'
import { useTrees } from '../../hooks/useTrees'

type TreeTableProps = {
  plotId: string
}

export default function TreeTable({ plotId }: TreeTableProps) {
  const { trees, isLoading: treesLoading, error: treesError, refresh } = useTrees(plotId)
  const { species, isLoading: speciesLoading } = useSpecies()

  const speciesById = new Map(species.map((item) => [item.id, item]))
  const isLoading = treesLoading || speciesLoading

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-green-800">รายการต้นไม้</h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          รีเฟรช
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลต้นไม้...</p>}
      {treesError && <p className="text-sm text-red-600">{treesError.message}</p>}

      {!isLoading && !treesError && trees.length === 0 && (
        <p className="text-sm text-gray-500">ยังไม่มีข้อมูลต้นไม้ในแปลงนี้</p>
      )}

      {!isLoading && !treesError && trees.length > 0 && (
        <>
          <ul className="space-y-2 md:hidden">
            {trees.map((tree) => {
              const speciesItem = speciesById.get(tree.species_id)

              return (
                <li key={tree.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{tree.tree_code}</p>
                      <p className="text-xs text-gray-600">เลขต้น: {tree.tree_number}</p>
                    </div>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: speciesItem?.hex_color ?? '#9CA3AF' }}
                      aria-label="สีชนิดไม้"
                    />
                  </div>

                  <p className="text-xs text-gray-600">ชนิดไม้: {speciesItem?.name_th || '-'}</p>
                  <p className="text-xs text-gray-600">แถว: {tree.row_main}.{tree.row_sub}</p>

                  <Link
                    to={`/trees/${encodeURIComponent(tree.tree_code)}`}
                    className="mt-2 inline-block rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white"
                  >
                    ดูรายละเอียด
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Tree Code</th>
                  <th className="px-3 py-2">เลขต้น</th>
                  <th className="px-3 py-2">ชนิดไม้</th>
                  <th className="px-3 py-2">ตำแหน่งแถว</th>
                  <th className="px-3 py-2">การทำงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {trees.map((tree) => {
                  const speciesItem = speciesById.get(tree.species_id)

                  return (
                    <tr key={tree.id}>
                      <td className="px-3 py-2 font-medium text-gray-800">{tree.tree_code}</td>
                      <td className="px-3 py-2 text-gray-700">{tree.tree_number}</td>
                      <td className="px-3 py-2 text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: speciesItem?.hex_color ?? '#9CA3AF' }}
                            aria-hidden="true"
                          />
                          {speciesItem?.name_th || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{tree.row_main}.{tree.row_sub}</td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/trees/${encodeURIComponent(tree.tree_code)}`}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          เปิด
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
