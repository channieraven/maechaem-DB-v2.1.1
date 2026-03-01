import { useState } from 'react'
import { useSpecies } from '../../hooks/useSpecies'
import type { PlantCategory, Species } from '../../lib/database.types'
import { addSpecies, deleteSpecies, updateSpecies } from '../../lib/database/firestoreService'

const CATEGORY_OPTIONS: PlantCategory[] = ['forest', 'rubber', 'bamboo', 'fruit', 'banana']

const emptyForm = {
  species_code: '',
  species_group: 'A' as 'A' | 'B',
  group_label: '',
  plant_category: 'forest' as PlantCategory,
  name_th: '',
  name_en: '',
  name_sci: '',
  hex_color: '#16A34A',
}

export default function SpeciesManagement() {
  const { species, isLoading, error, refresh } = useSpecies()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (editingId) {
      await updateSpecies(editingId, form)
    } else {
      await addSpecies({
        ...form,
        created_at: new Date().toISOString(),
      })
    }

    setForm(emptyForm)
    setEditingId(null)
    await refresh()
  }

  const startEdit = (item: Species) => {
    setEditingId(item.id)
    setForm({
      species_code: item.species_code,
      species_group: item.species_group,
      group_label: item.group_label,
      plant_category: item.plant_category,
      name_th: item.name_th,
      name_en: item.name_en,
      name_sci: item.name_sci,
      hex_color: item.hex_color,
    })
  }

  const handleDelete = async (speciesId: string) => {
    await deleteSpecies(speciesId)
    await refresh()
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">Species Management</h3>

      <form className="mb-4 grid gap-2 md:grid-cols-2" onSubmit={handleSubmit}>
        <input
          value={form.species_code}
          onChange={(event) => setForm((prev) => ({ ...prev, species_code: event.target.value }))}
          placeholder="species_code"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.name_th}
          onChange={(event) => setForm((prev) => ({ ...prev, name_th: event.target.value }))}
          placeholder="name_th"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.name_en}
          onChange={(event) => setForm((prev) => ({ ...prev, name_en: event.target.value }))}
          placeholder="name_en"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.name_sci}
          onChange={(event) => setForm((prev) => ({ ...prev, name_sci: event.target.value }))}
          placeholder="name_sci"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.group_label}
          onChange={(event) => setForm((prev) => ({ ...prev, group_label: event.target.value }))}
          placeholder="group_label"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={form.species_group}
          onChange={(event) => setForm((prev) => ({ ...prev, species_group: event.target.value as 'A' | 'B' }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
        <select
          value={form.plant_category}
          onChange={(event) => setForm((prev) => ({ ...prev, plant_category: event.target.value as PlantCategory }))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={form.hex_color}
          onChange={(event) => setForm((prev) => ({ ...prev, hex_color: event.target.value }))}
          className="h-10 rounded-lg border border-gray-300 px-2"
        />

        <button
          type="submit"
          className="md:col-span-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          {editingId ? 'อัปเดตชนิดไม้' : 'เพิ่มชนิดไม้'}
        </button>
      </form>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดชนิดไม้...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!isLoading && !error && (
        <ul className="space-y-2">
          {species.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.hex_color }} />
                {item.name_th} ({item.species_code})
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  ลบ
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
