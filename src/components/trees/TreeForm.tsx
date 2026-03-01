import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Species, Tree } from '../../lib/database.types'

export type TreeFormValues = {
  speciesId: string
  tagLabel: string
  rowMain: number
  rowSub: number
  note: string
}

type TreeFormProps = {
  tree: Tree
  speciesList: Species[]
  onSubmit: (values: TreeFormValues) => void
}

export default function TreeForm({ tree, speciesList, onSubmit }: TreeFormProps) {
  const initialValues = useMemo<TreeFormValues>(
    () => ({
      speciesId: tree.species_id,
      tagLabel: tree.tag_label,
      rowMain: tree.row_main,
      rowSub: tree.row_sub,
      note: tree.note,
    }),
    [tree.note, tree.row_main, tree.row_sub, tree.species_id, tree.tag_label]
  )

  const [values, setValues] = useState<TreeFormValues>(initialValues)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-4 text-base font-semibold text-green-800">แก้ไขข้อมูลต้นไม้</h3>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="speciesId" className="mb-1 block text-xs font-medium text-gray-600">
            ชนิดไม้
          </label>
          <select
            id="speciesId"
            value={values.speciesId}
            onChange={(event) => setValues((prev) => ({ ...prev, speciesId: event.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
          >
            {speciesList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name_th}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tagLabel" className="mb-1 block text-xs font-medium text-gray-600">
            รหัสแท็ก
          </label>
          <input
            id="tagLabel"
            value={values.tagLabel}
            onChange={(event) => setValues((prev) => ({ ...prev, tagLabel: event.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rowMain" className="mb-1 block text-xs font-medium text-gray-600">
              แถวหลัก
            </label>
            <input
              id="rowMain"
              type="number"
              value={values.rowMain}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  rowMain: Number(event.target.value),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label htmlFor="rowSub" className="mb-1 block text-xs font-medium text-gray-600">
              แถวย่อย
            </label>
            <input
              id="rowSub"
              type="number"
              value={values.rowSub}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  rowSub: Number(event.target.value),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="note" className="mb-1 block text-xs font-medium text-gray-600">
            หมายเหตุ
          </label>
          <textarea
            id="note"
            rows={3}
            value={values.note}
            onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-400"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          บันทึกข้อมูล
        </button>
      </form>
    </section>
  )
}
