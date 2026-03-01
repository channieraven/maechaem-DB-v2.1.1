import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTrees } from '../../hooks/useTrees'
import { getGrowthLogs } from '../../lib/database/firestoreService'
import GrowthForm from '../growth/GrowthForm'
import BatchEntry from './BatchEntry'
import PlotSelector from './PlotSelector'
import TreeSelector from './TreeSelector'

export default function SurveyMode() {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [surveyedTreeIds, setSurveyedTreeIds] = useState<Set<string>>(new Set())
  const { trees, isLoading, error } = useTrees(selectedPlotId)

  const loadSurveyedState = useCallback(async () => {
    if (!selectedPlotId || trees.length === 0) {
      setSurveyedTreeIds(new Set())
      return
    }

    const checked = await Promise.all(
      trees.map(async (tree) => {
        const logs = await getGrowthLogs(tree.id)
        return { id: tree.id, done: logs.length > 0 }
      })
    )

    setSurveyedTreeIds(new Set(checked.filter((item) => item.done).map((item) => item.id)))
  }, [selectedPlotId, trees])

  useEffect(() => {
    void loadSurveyedState()
  }, [loadSurveyedState])

  useEffect(() => {
    if (!selectedPlotId) {
      setSelectedTreeId(null)
      return
    }

    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id)
    }
  }, [selectedPlotId, selectedTreeId, trees])

  const selectedTree = useMemo(() => trees.find((tree) => tree.id === selectedTreeId) ?? null, [selectedTreeId, trees])

  const goNextTree = () => {
    if (!selectedTreeId) {
      return
    }

    const currentIndex = trees.findIndex((tree) => tree.id === selectedTreeId)
    const nextTree = trees[currentIndex + 1]
    if (nextTree) {
      setSelectedTreeId(nextTree.id)
    }
  }

  const handleSaved = async () => {
    if (selectedTreeId) {
      setSurveyedTreeIds((prev) => new Set([...prev, selectedTreeId]))
    }
    goNextTree()
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-green-800">Survey Mode</h2>
        <p className="text-sm text-gray-600">เลือกแปลง → เลือกต้น → กรอกข้อมูล → บันทึก → ต้นถัดไป</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <PlotSelector
          selectedPlotId={selectedPlotId}
          onSelectPlot={(plotId) => {
            setSelectedPlotId(plotId || null)
            setSelectedTreeId(null)
          }}
        />

        <TreeSelector
          trees={trees}
          selectedTreeId={selectedTreeId}
          surveyedTreeIds={surveyedTreeIds}
          onSelectTree={setSelectedTreeId}
        />

        <BatchEntry trees={trees} onSaved={loadSurveyedState} />
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลต้นไม้...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {selectedTree && <GrowthForm tree={selectedTree} onSaved={handleSaved} />}
    </section>
  )
}
