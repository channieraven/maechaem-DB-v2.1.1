import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers3, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGrowthLogs } from '../../hooks/useGrowthLogs'
import { useMapExperienceConfig } from '../../hooks/useMapExperienceConfig'
import { usePlotBasemap } from '../../hooks/usePlotBasemap'
import { usePlots } from '../../hooks/usePlots'
import { useTrees } from '../../hooks/useTrees'
import { deletePlotBasemap, getGrowthLogs, uploadPlotBasemapTiff } from '../../lib/database/firestoreService'
import { formatDate, formatNumber } from '../../utils/formatters'
import GrowthForm from '../growth/GrowthForm'
import TreeMap from '../trees/TreeMap'
import TreeSelector from './TreeSelector'

export default function SurveyMode() {
  const { isAdmin } = useAuth()
  const { plots, isLoading: plotsLoading, error: plotsError } = usePlots()
  const { config, isLoading: configLoading, error: configError } = useMapExperienceConfig()
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [surveyedTreeIds, setSurveyedTreeIds] = useState<Set<string>>(new Set())
  const [showOrthophoto, setShowOrthophoto] = useState(true)
  const [pseudo3d, setPseudo3d] = useState(false)
  const [orthophotoFile, setOrthophotoFile] = useState<File | null>(null)
  const [isBasemapSubmitting, setIsBasemapSubmitting] = useState(false)
  const [basemapActionError, setBasemapActionError] = useState<string | null>(null)
  const { trees, isLoading, error } = useTrees(selectedPlotId)
  const {
    basemap,
    isLoading: basemapLoading,
    error: basemapError,
    refresh: refreshBasemap,
  } = usePlotBasemap(selectedPlotId)

  const configuredPlots = useMemo(() => {
    const configuredIds = config?.plot_ids ?? []

    if (configuredIds.length === 0) {
      return plots
    }

    const plotById = new Map(plots.map((plot) => [plot.id, plot]))
    return configuredIds.map((plotId) => plotById.get(plotId)).filter((plot): plot is NonNullable<typeof plot> => Boolean(plot))
  }, [config?.plot_ids, plots])

  const selectedPlot = useMemo(
    () => configuredPlots.find((plot) => plot.id === selectedPlotId) ?? null,
    [configuredPlots, selectedPlotId]
  )

  const selectedTree = useMemo(() => trees.find((tree) => tree.id === selectedTreeId) ?? null, [selectedTreeId, trees])
  const { growthLogs, isLoading: growthLogLoading } = useGrowthLogs(selectedTree?.id ?? null)

  const surveyedCount = surveyedTreeIds.size

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
    if (configuredPlots.length === 0) {
      setSelectedPlotId(null)
      return
    }

    if (!selectedPlotId || !configuredPlots.some((plot) => plot.id === selectedPlotId)) {
      setSelectedPlotId(configuredPlots[0].id)
      setSelectedTreeId(null)
    }
  }, [configuredPlots, selectedPlotId])

  useEffect(() => {
    if (!selectedPlotId) {
      setSelectedTreeId(null)
      return
    }

    if (trees.length > 0 && !selectedTreeId) {
      setSelectedTreeId(trees[0].id)
    }
  }, [selectedPlotId, selectedTreeId, trees])

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

  const handleOrthophotoUpload = async () => {
    if (!selectedPlotId || !orthophotoFile) {
      return
    }

    setBasemapActionError(null)
    setIsBasemapSubmitting(true)

    try {
      await uploadPlotBasemapTiff({
        plotId: selectedPlotId,
        file: orthophotoFile,
      })

      setOrthophotoFile(null)
      await refreshBasemap()
    } catch (uploadError) {
      setBasemapActionError(uploadError instanceof Error ? uploadError.message : 'อัปโหลด orthophoto ไม่สำเร็จ')
    } finally {
      setIsBasemapSubmitting(false)
    }
  }

  const handleOrthophotoDelete = async () => {
    if (!selectedPlotId) {
      return
    }

    const confirmed = window.confirm('ยืนยันการลบ orthophoto ของแปลงนี้?')
    if (!confirmed) {
      return
    }

    setBasemapActionError(null)
    setIsBasemapSubmitting(true)

    try {
      await deletePlotBasemap(selectedPlotId)
      await refreshBasemap()
    } catch (deleteError) {
      setBasemapActionError(deleteError instanceof Error ? deleteError.message : 'ลบ orthophoto ไม่สำเร็จ')
    } finally {
      setIsBasemapSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-green-800">โหมดสำรวจแผนที่ 2D</h2>
        <p className="text-sm text-gray-600">
          โฟกัสหลัก: แผนที่โต้ตอบ 2D + การบันทึกการเจริญเติบโตของต้นไม้ (รองรับโหมด 2.5D)
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700">แปลงทดลอง</span>
            <select
              value={selectedPlotId ?? ''}
              onChange={(event) => {
                setSelectedPlotId(event.target.value || null)
                setSelectedTreeId(null)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              disabled={plotsLoading || configuredPlots.length === 0}
            >
              <option value="">เลือกแปลง</option>
              {configuredPlots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name_short} ({plot.plot_code})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShowOrthophoto((prev) => !prev)}
            className={[
              'rounded-lg border px-3 py-2 text-sm font-medium',
              showOrthophoto ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-700',
            ].join(' ')}
          >
            {showOrthophoto ? 'ซ่อน Orthophoto' : 'แสดง Orthophoto'}
          </button>

          <button
            type="button"
            onClick={() => setPseudo3d((prev) => !prev)}
            className={[
              'rounded-lg border px-3 py-2 text-sm font-medium',
              pseudo3d ? 'border-amber-600 bg-amber-500 text-white' : 'border-gray-300 bg-white text-gray-700',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-4 w-4" />
              {pseudo3d ? 'ปิดโหมด 2.5D' : 'เปิดโหมด 2.5D'}
            </span>
          </button>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <p className="text-xs text-gray-500">จำนวนแปลงตาม config</p>
            <p className="font-semibold text-gray-800">{formatNumber(configuredPlots.length)}</p>
          </div>
        </div>

        {(plotsError || configError || basemapError) && (
          <div className="mt-3 space-y-1 text-sm text-red-600">
            {plotsError && <p>{plotsError.message}</p>}
            {configError && <p>{configError.message}</p>}
            {basemapError && <p>{basemapError.message}</p>}
          </div>
        )}

        {isAdmin && selectedPlotId && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-semibold text-amber-900">จัดการ Orthophoto (ผู้ดูแลระบบ)</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept=".tif,.tiff,image/tiff"
                onChange={(event) => setOrthophotoFile(event.target.files?.[0] ?? null)}
                className="max-w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => void handleOrthophotoUpload()}
                disabled={!orthophotoFile || isBasemapSubmitting}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white enabled:hover:bg-amber-700 disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  {isBasemapSubmitting ? 'กำลังอัปโหลด...' : basemap ? 'แทนที่ Orthophoto' : 'อัปโหลด Orthophoto'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleOrthophotoDelete()}
                disabled={!basemap || isBasemapSubmitting}
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 enabled:hover:bg-red-50 disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  ลบ Orthophoto
                </span>
              </button>
            </div>

            {basemapActionError && <p className="mt-2 text-sm text-red-700">{basemapActionError}</p>}
          </div>
        )}

        {!isAdmin && (
          <p className="mt-3 text-xs text-gray-500">การอัปโหลด/แก้ไข/ลบ orthophoto ทำได้เฉพาะผู้ดูแลระบบ</p>
        )}
      </section>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลต้นไม้...</p>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {selectedPlotId ? (
            <TreeMap
              plotId={selectedPlotId}
              selectedTreeId={selectedTreeId}
              onSelectTree={setSelectedTreeId}
              orthophotoUrl={basemap?.download_url ?? null}
              showOrthophoto={showOrthophoto}
              pseudo3d={pseudo3d}
            />
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">กรุณาเลือกแปลงก่อน</section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">แปลงที่เลือก</p>
              <p className="font-semibold text-gray-900">{selectedPlot ? selectedPlot.plot_code : '-'}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">จำนวนต้นไม้</p>
              <p className="font-semibold text-gray-900">{formatNumber(trees.length)}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">บันทึกแล้ว</p>
              <p className="font-semibold text-gray-900">{formatNumber(surveyedCount)}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Orthophoto ล่าสุด</p>
              <p className="font-semibold text-gray-900">
                {basemapLoading ? 'กำลังโหลด...' : basemap ? formatDate(basemap.updated_at) : 'ยังไม่มีไฟล์'}
              </p>
            </article>
          </section>
        </div>

        <div className="space-y-4">
          <TreeSelector
            trees={trees}
            selectedTreeId={selectedTreeId}
            surveyedTreeIds={surveyedTreeIds}
            onSelectTree={setSelectedTreeId}
          />

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-base font-semibold text-green-800">เอกสารการเจริญเติบโต</h3>
            {selectedTree ? (
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <p>
                  ต้นที่เลือก: <span className="font-medium">{selectedTree.tree_code}</span>
                </p>
                <p>เลขต้น: {formatNumber(selectedTree.tree_number)}</p>
                <p>
                  จำนวนบันทึก:{' '}
                  {growthLogLoading ? 'กำลังโหลด...' : formatNumber(growthLogs.length)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">เลือกต้นไม้จากรายการหรือคลิกบนแผนที่</p>
            )}
          </section>

          {selectedTree && <GrowthForm tree={selectedTree} onSaved={handleSaved} />}
        </div>
      </div>

      {(plotsLoading || configLoading) && <p className="text-xs text-gray-500">กำลังเตรียมข้อมูลแผนที่...</p>}
    </section>
  )
}
