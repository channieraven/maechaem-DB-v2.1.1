import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSpecies } from '../../hooks/useSpecies'
import type { PlantCategory, Tree, TreeStatus } from '../../lib/database.types'
import { createGrowthEntry } from '../../lib/database/firestoreService'
import BananaFields from './GrowthFormFields/BananaFields'
import BambooFields from './GrowthFormFields/BambooFields'
import CommonFields from './GrowthFormFields/CommonFields'
import RcdFields from './GrowthFormFields/RcdFields'

type GrowthFormProps = {
  tree: Tree
  onSaved?: () => Promise<void> | void
}

type CommonState = {
  surveyDate: string
  heightM: number
  status: TreeStatus
  flowering: boolean
  note: string
}

export default function GrowthForm({ tree, onSaved }: GrowthFormProps) {
  const { user } = useAuth()
  const { species } = useSpecies()

  const [common, setCommon] = useState<CommonState>({
    surveyDate: new Date().toISOString().slice(0, 10),
    heightM: 0,
    status: 'alive',
    flowering: false,
    note: '',
  })
  const [rcdCm, setRcdCm] = useState(0)
  const [bamboo, setBamboo] = useState({
    culmCount: 0,
    rcd1Cm: 0,
    rcd2Cm: 0,
    rcd3Cm: 0,
  })
  const [banana, setBanana] = useState({
    totalPlants: 0,
    plants1yr: 0,
    yieldBunches: 0,
    yieldHands: 0,
    pricePerHand: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const speciesById = useMemo(() => new Map(species.map((item) => [item.id, item])), [species])
  const treeSpecies = speciesById.get(tree.species_id)
  const plantCategory: PlantCategory = treeSpecies?.plant_category ?? 'forest'

  const canSubmit = Boolean(user?.uid && !isSubmitting)

  useEffect(() => {
    if (!showSuccessToast) {
      return
    }

    const timeout = window.setTimeout(() => {
      setShowSuccessToast(false)
    }, 3000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [showSuccessToast])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.uid) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const child =
        plantCategory === 'bamboo'
          ? {
              plantCategory,
              culm_count: bamboo.culmCount,
              dbh_1_cm: bamboo.rcd1Cm,
              dbh_2_cm: bamboo.rcd2Cm,
              dbh_3_cm: bamboo.rcd3Cm,
            }
          : plantCategory === 'banana'
            ? {
                plantCategory,
                total_plants: banana.totalPlants,
                plants_1yr: banana.plants1yr,
                yield_bunches: banana.yieldBunches,
                yield_hands: banana.yieldHands,
                price_per_hand: banana.pricePerHand,
              }
            : {
                plantCategory,
                dbh_cm: rcdCm,
              }

      await createGrowthEntry({
        log: {
          tree_id: tree.id,
          survey_date: common.surveyDate,
          recorder_id: user.uid,
          height_m: common.heightM,
          status: common.status,
          flowering: common.flowering,
          note: common.note,
          synced_from: 'web',
          created_at: new Date().toISOString(),
        },
        child,
      })

      setCommon((prev) => ({ ...prev, heightM: 0, flowering: false, note: '' }))
      setRcdCm(0)
      setBamboo({ culmCount: 0, rcd1Cm: 0, rcd2Cm: 0, rcd3Cm: 0 })
      setBanana({ totalPlants: 0, plants1yr: 0, yieldBunches: 0, yieldHands: 0, pricePerHand: 0 })
      setShowSuccessToast(true)

      await onSaved?.()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลการเจริญเติบโตได้')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-1 text-base font-semibold text-green-800">บันทึกการเจริญเติบโต</h3>
      <p className="mb-4 text-xs text-gray-500">ประเภทพืช: {plantCategory}</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <CommonFields
          values={common}
          onChange={(key, value) =>
            setCommon((prev) => ({
              ...prev,
              [key]: value,
            }))
          }
        />

        {(plantCategory === 'forest' || plantCategory === 'rubber' || plantCategory === 'fruit') && (
          <RcdFields rcdCm={rcdCm} onChange={setRcdCm} />
        )}

        {plantCategory === 'bamboo' && (
          <BambooFields
            values={bamboo}
            onChange={(key, value) =>
              setBamboo((prev) => ({
                ...prev,
                [key]: value,
              }))
            }
          />
        )}

        {plantCategory === 'banana' && (
          <BananaFields
            values={banana}
            onChange={(key, value) =>
              setBanana((prev) => ({
                ...prev,
                [key]: value,
              }))
            }
          />
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผลสำรวจ'}
        </button>
      </form>

      {showSuccessToast && (
        <div className="pointer-events-none fixed right-4 top-20 z-50 rounded-lg border border-green-200 bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          ✓ บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}
    </section>
  )
}
