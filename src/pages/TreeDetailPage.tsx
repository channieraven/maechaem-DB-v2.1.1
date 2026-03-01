import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import GrowthChart from '../components/growth/GrowthChart'
import GrowthForm from '../components/growth/GrowthForm'
import GrowthLogTable from '../components/growth/GrowthLogTable'
import TreeDetail from '../components/trees/TreeDetail'
import TreeForm, { type TreeFormValues } from '../components/trees/TreeForm'
import { usePlots } from '../hooks/usePlots'
import { useSpecies } from '../hooks/useSpecies'
import { getTreeByCode } from '../lib/database/firestoreService'
import type { Tree } from '../lib/database.types'

export default function TreeDetailPage() {
  const { treeCode } = useParams<{ treeCode: string }>()
  const { plots } = usePlots()
  const { species, isLoading: speciesLoading } = useSpecies()
  const [baseTree, setBaseTree] = useState<Tree | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  const [draftTree, setDraftTree] = useState<Tree | null>(null)

  const refresh = useCallback(async () => {
    if (!treeCode) {
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await getTreeByCode(decodeURIComponent(treeCode))
      setBaseTree(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error : new Error('โหลดข้อมูลต้นไม้ไม่สำเร็จ'))
    } finally {
      setIsLoading(false)
    }
  }, [treeCode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const currentTree = useMemo(() => {
    if (!baseTree) {
      return null
    }

    if (draftTree && draftTree.id === baseTree.id) {
      return draftTree
    }

    return baseTree
  }, [baseTree, draftTree])

  const speciesById = useMemo(() => new Map(species.map((item) => [item.id, item])), [species])

  if (!treeCode) {
    return <Navigate to="/plots" replace />
  }

  const plotCode = currentTree ? plots.find((plot) => plot.id === currentTree.plot_id)?.plot_code : undefined

  const handleSubmit = (values: TreeFormValues) => {
    if (!currentTree) {
      return
    }

    setDraftTree({
      ...currentTree,
      species_id: values.speciesId,
      tag_label: values.tagLabel,
      row_main: values.rowMain,
      row_sub: values.rowSub,
      note: values.note,
    })
  }

  const loading = isLoading || speciesLoading
  const pageError = loadError

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4">
      <header className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
        <div>
          <h1 className="text-xl font-bold text-green-800">รายละเอียดต้นไม้</h1>
          <p className="mt-1 text-sm text-gray-600">ข้อมูลต้นไม้รายต้นภายในแปลง</p>
        </div>
        <Link
          to={plotCode ? `/plots/${encodeURIComponent(plotCode)}` : '/plots'}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          กลับไปหน้าแปลง
        </Link>
      </header>

      {loading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลต้นไม้...</p>}

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{pageError.message}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {!loading && !pageError && !currentTree && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">ไม่พบข้อมูลต้นไม้ที่เลือก</p>
        </div>
      )}

      {!loading && !pageError && currentTree && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <TreeDetail tree={currentTree} species={speciesById.get(currentTree.species_id)} />
            <TreeForm tree={currentTree} speciesList={species} onSubmit={handleSubmit} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <GrowthForm tree={currentTree} onSaved={refresh} />
            <GrowthChart treeId={currentTree.id} />
          </section>

          <GrowthLogTable treeId={currentTree.id} />
        </>
      )}
    </section>
  )
}
