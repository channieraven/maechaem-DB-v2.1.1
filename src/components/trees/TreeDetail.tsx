import type { Species, Tree } from '../../lib/database.types'
import { formatNumber } from '../../utils/formatters'

type TreeDetailProps = {
  tree: Tree
  species?: Species
}

export default function TreeDetail({ tree, species }: TreeDetailProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <header className="mb-4 border-b border-gray-200 pb-3">
        <h2 className="text-lg font-semibold text-green-900">{tree.tree_code}</h2>
        <p className="text-sm text-gray-500">รายละเอียดต้นไม้รายต้น</p>
      </header>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">เลขต้น</dt>
          <dd className="font-medium text-gray-800">{formatNumber(tree.tree_number)}</dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">ชนิดไม้</dt>
          <dd className="inline-flex items-center gap-2 font-medium text-gray-800">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: species?.hex_color ?? '#9CA3AF' }}
              aria-hidden="true"
            />
            {species?.name_th || '-'}
          </dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">รหัสแท็ก</dt>
          <dd className="font-medium text-gray-800">{tree.tag_label || '-'}</dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">ตำแหน่งแถว</dt>
          <dd className="font-medium text-gray-800">
            {formatNumber(tree.row_main)}.{formatNumber(tree.row_sub)}
          </dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">UTM X</dt>
          <dd className="font-medium text-gray-800">{formatNumber(tree.utm_x)}</dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <dt className="text-xs text-gray-500">UTM Y</dt>
          <dd className="font-medium text-gray-800">{formatNumber(tree.utm_y)}</dd>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
          <dt className="text-xs text-gray-500">หมายเหตุ</dt>
          <dd className="whitespace-pre-wrap font-medium text-gray-800">{tree.note || '-'}</dd>
        </div>
      </dl>
    </section>
  )
}
