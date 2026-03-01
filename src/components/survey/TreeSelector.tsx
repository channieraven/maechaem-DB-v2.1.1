import type { Tree } from '../../lib/database.types'

type TreeSelectorProps = {
  trees: Tree[]
  selectedTreeId: string | null
  surveyedTreeIds: Set<string>
  onSelectTree: (treeId: string) => void
}

export default function TreeSelector({ trees, selectedTreeId, surveyedTreeIds, onSelectTree }: TreeSelectorProps) {
  return (
    <section className="card rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-green-800">2) เลือกต้นไม้</h3>

      {trees.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีต้นไม้ในแปลงที่เลือก</p>}

      {trees.length > 0 && (
        <ul className="max-h-80 space-y-2 overflow-auto pr-1">
          {trees.map((tree) => {
            const surveyed = surveyedTreeIds.has(tree.id)
            return (
              <li key={tree.id}>
                <button
                  type="button"
                  onClick={() => onSelectTree(tree.id)}
                  className={[
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition',
                    selectedTreeId === tree.id
                      ? 'border-green-700 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <span>
                    <span className="font-medium">{tree.tree_code}</span>
                    <span className="ml-2 text-xs text-gray-600">เลขต้น {tree.tree_number}</span>
                  </span>
                  <span className="text-base" aria-label={surveyed ? 'สำรวจแล้ว' : 'ยังไม่สำรวจ'}>
                    {surveyed ? '✅' : '⬜'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
