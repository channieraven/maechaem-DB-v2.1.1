import { useTrees } from '../../hooks/useTrees'
import type { Tree } from '../../lib/database.types'

type TreeListProps = {
  plotId: string | null
  selectedTreeId: string | null
  onSelectTree: (tree: Tree) => void
}

export default function TreeList({ plotId, selectedTreeId, onSelectTree }: TreeListProps) {
  const { trees, isLoading, error, refresh } = useTrees(plotId)

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-green-800">Trees</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!plotId}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          รีเฟรช
        </button>
      </div>

      {!plotId && <p className="text-sm text-gray-500">กรุณาเลือกแปลงก่อน</p>}
      {plotId && isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลต้นไม้...</p>}
      {plotId && error && <p className="text-sm text-red-600">{error}</p>}

      {plotId && !isLoading && !error && (
        <ul className="space-y-2">
          {trees.map((tree) => (
            <li key={tree.id}>
              <button
                type="button"
                onClick={() => onSelectTree(tree)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  selectedTreeId === tree.id
                    ? 'border-green-700 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{tree.tree_code}</p>
                <p className="text-xs text-gray-600">เลขต้น: {tree.tree_number}</p>
              </button>
            </li>
          ))}
          {trees.length === 0 && <li className="text-sm text-gray-500">ยังไม่มีข้อมูลต้นไม้ในแปลงนี้</li>}
        </ul>
      )}
    </section>
  )
}
