import { useCallback, useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import type { MapLayerType } from '../../lib/database.types'
import { useAuth } from '../../contexts/AuthContext'
import { deleteMapLayer, uploadMapLayer } from '../../lib/database/firestoreService'
import { useMapLayers } from '../../hooks/useMapLayers'
import { DEFAULT_LAYER_STYLES, LAYER_TYPE_LABELS } from '../../utils/constants'

const LAYER_TYPE_OPTIONS: { value: MapLayerType; label: string }[] = [
  { value: 'plot_boundary', label: LAYER_TYPE_LABELS.plot_boundary },
  { value: 'tree_position', label: LAYER_TYPE_LABELS.tree_position },
  { value: 'contour', label: LAYER_TYPE_LABELS.contour },
  { value: 'infrastructure', label: LAYER_TYPE_LABELS.infrastructure },
]

export default function BuildingPlanUpload() {
  const { profile } = useAuth()
  const { layers, refresh } = useMapLayers()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [layerType, setLayerType] = useState<MapLayerType>('plot_boundary')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin) return null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!name) {
        setName(file.name.replace(/\.geojson$/i, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !name.trim() || !profile) return

    setUploading(true)
    setUploadError(null)

    try {
      const defaultStyle = DEFAULT_LAYER_STYLES[layerType]
      await uploadMapLayer({
        name: name.trim(),
        layerType,
        file: selectedFile,
        style: { ...defaultStyle },
        visibleByDefault: true,
        uploadedBy: profile.id,
      })

      setName('')
      setSelectedFile(null)
      setLayerType('plot_boundary')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'อัปโหลดล้มเหลว'
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = useCallback(async (layerId: string) => {
    setDeletingId(layerId)
    try {
      await deleteMapLayer(layerId)
      await refresh()
    } catch {
      // Silently fail — user can retry
    } finally {
      setDeletingId(null)
    }
  }, [refresh])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-base font-semibold text-green-800">จัดการชั้นข้อมูลแผนที่</h3>

      {/* Upload form */}
      <div className="mb-4 grid gap-3 rounded-lg border border-dashed border-green-300 bg-green-50/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-gray-600">ชื่อชั้นข้อมูล</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ขอบเขตแปลงกลุ่ม 1"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">ประเภทชั้นข้อมูล</label>
          <select
            value={layerType}
            onChange={(e) => setLayerType(e.target.value as MapLayerType)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            {LAYER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">ไฟล์ GeoJSON</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-2 file:rounded-lg file:border-0 file:bg-green-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-green-800 hover:file:bg-green-200"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading || !selectedFile || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
          </button>
        </div>
      </div>

      {uploadError && <p className="mb-3 text-sm text-red-600">{uploadError}</p>}

      {/* Existing layers list */}
      {layers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">ชั้นข้อมูลที่อัปโหลดแล้ว</p>
          <ul className="space-y-1">
            {layers.map((layer) => (
              <li key={layer.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: layer.style.color }}
                  />
                  <span className="text-sm font-medium text-gray-800">{layer.name}</span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    {LAYER_TYPE_LABELS[layer.layer_type] ?? layer.layer_type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(layer.id)}
                  disabled={deletingId === layer.id}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="ลบชั้นข้อมูล"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
