import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSpecies } from '../../hooks/useSpecies'
import type { Tree, TreeStatus } from '../../lib/database.types'
import { createGrowthEntry } from '../../lib/database/firestoreService'

type BatchEntryProps = {
  trees: Tree[]
  onSaved?: () => Promise<void> | void
}

export default function BatchEntry({ trees, onSaved }: BatchEntryProps) {
  const { user } = useAuth()
  const { species } = useSpecies()

  const [treeIdsText, setTreeIdsText] = useState('')
  const [heightM, setHeightM] = useState(0)
  const [status, setStatus] = useState<TreeStatus>('alive')
  const [surveyDate, setSurveyDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speciesById = useMemo(() => new Map(species.map((item) => [item.id, item])), [species])
  const treesById = useMemo(() => new Map(trees.map((tree) => [tree.id, tree])), [trees])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.uid) {
      return
    }

    const targetIds = treeIdsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (targetIds.length === 0) {
      setError('กรุณาระบุ Tree ID อย่างน้อย 1 รายการ')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      for (const treeId of targetIds) {
        const tree = treesById.get(treeId)
        if (!tree) {
          continue
        }

        const plantCategory = speciesById.get(tree.species_id)?.plant_category ?? 'forest'

        await createGrowthEntry({
          log: {
            tree_id: treeId,
            survey_date: surveyDate,
            recorder_id: user.uid,
            height_m: heightM,
            status,
            flowering: false,
            note: 'batch-entry',
            synced_from: 'web',
            created_at: new Date().toISOString(),
          },
          child:
            plantCategory === 'banana'
              ? {
                  plantCategory,
                  total_plants: 0,
                  plants_1yr: 0,
                  yield_bunches: 0,
                  yield_hands: 0,
                  price_per_hand: 0,
                }
              : plantCategory === 'bamboo'
                ? {
                    plantCategory,
                    culm_count: 0,
                    dbh_1_cm: 0,
                    dbh_2_cm: 0,
                    dbh_3_cm: 0,
                  }
                : {
                    plantCategory,
                    dbh_cm: 0,
                  },
        })
      }

      await onSaved?.()
      setTreeIdsText('')
      setHeightM(0)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกแบบชุดไม่สำเร็จ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-green-800">บันทึกข้อมูลแบบชุด</h3>
      <p className="mb-3 text-xs text-gray-500">กรอก Tree ID หลายรายการ (คั่นด้วย comma) เพื่อบันทึกค่าเดียวกันพร้อมกัน</p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          rows={3}
          value={treeIdsText}
          onChange={(event) => setTreeIdsText(event.target.value)}
          placeholder="tree-id-1, tree-id-2, tree-id-3"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="date"
            value={surveyDate}
            onChange={(event) => setSurveyDate(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            min={0}
            value={heightM}
            onChange={(event) => setHeightM(Number(event.target.value))}
            placeholder="ความสูง (เมตร)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TreeStatus)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="alive">มีชีวิต</option>
            <option value="dead">ตาย</option>
            <option value="missing">ไม่พบต้น</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:opacity-40"
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกแบบชุด'}
        </button>
      </form>
    </section>
  )
}
