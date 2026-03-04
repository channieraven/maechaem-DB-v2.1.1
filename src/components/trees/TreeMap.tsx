import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { useSpecies } from '../../hooks/useSpecies'
import { useTrees } from '../../hooks/useTrees'
import { utmToLatLng } from '../../utils/coordinates'

type TreeMapProps = {
  plotId: string
  selectedTreeId?: string | null
  onSelectTree?: (treeId: string) => void
  orthophotoUrl?: string | null
  showOrthophoto?: boolean
  pseudo3d?: boolean
}

type MapPoint = {
  id: string
  treeCode: string
  treeNumber: number
  speciesName: string
  speciesColor: string
  lat: number
  lng: number
}

type RasterState = {
  isLoading: boolean
  isReady: boolean
  error: string | null
}

function FitBounds({ points, disabled = false }: { points: MapPoint[]; disabled?: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (disabled || points.length === 0) {
      return
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng]),
      { padding: [24, 24], maxZoom: 19 }
    )
  }, [disabled, map, points])

  return null
}

function OrthophotoLayer({
  url,
  onStateChange,
}: {
  url: string
  onStateChange: (state: RasterState) => void
}) {
  const map = useMap()

  useEffect(() => {
    let isCancelled = false
    let layer: { removeFrom?: (mapInstance: ReturnType<typeof useMap>) => void } | null = null

    const loadOrthophoto = async () => {
      onStateChange({ isLoading: true, isReady: false, error: null })

      try {
        const [{ default: parseGeoraster }, { default: GeoRasterLayer }] = await Promise.all([
          import('georaster'),
          import('georaster-layer-for-leaflet'),
        ])

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดไฟล์ orthophoto ได้')
        }

        const arrayBuffer = await response.arrayBuffer()
        const georaster = await parseGeoraster(arrayBuffer)

        if (isCancelled) {
          return
        }

        const rasterLayer = new GeoRasterLayer({
          georaster,
          opacity: 0.88,
          resolution: 256,
        })

        rasterLayer.addTo(map)
        layer = rasterLayer

        if (typeof rasterLayer.getBounds === 'function') {
          const bounds = rasterLayer.getBounds()
          if (bounds) {
            map.fitBounds(bounds, { padding: [24, 24], maxZoom: 20 })
          }
        }

        onStateChange({ isLoading: false, isReady: true, error: null })
      } catch (error) {
        if (isCancelled) {
          return
        }

        onStateChange({
          isLoading: false,
          isReady: false,
          error: error instanceof Error ? error.message : 'ไม่สามารถแสดง orthophoto ได้',
        })
      }
    }

    void loadOrthophoto()

    return () => {
      isCancelled = true
      if (layer && typeof layer.removeFrom === 'function') {
        layer.removeFrom(map)
      }
    }
  }, [map, onStateChange, url])

  return null
}

export default function TreeMap({
  plotId,
  selectedTreeId = null,
  onSelectTree,
  orthophotoUrl = null,
  showOrthophoto = true,
  pseudo3d = false,
}: TreeMapProps) {
  const { trees, isLoading: treesLoading, error: treesError } = useTrees(plotId)
  const { species, isLoading: speciesLoading } = useSpecies()
  const [rasterState, setRasterState] = useState<RasterState>({
    isLoading: false,
    isReady: false,
    error: null,
  })

  const shouldRenderOrthophoto = Boolean(showOrthophoto && orthophotoUrl)

  useEffect(() => {
    if (!shouldRenderOrthophoto) {
      setRasterState({ isLoading: false, isReady: false, error: null })
    }
  }, [shouldRenderOrthophoto])

  const points = useMemo(() => {
    const speciesById = new Map(species.map((item) => [item.id, item]))

    return trees
      .map((tree): MapPoint | null => {
        if (!Number.isFinite(tree.utm_x) || !Number.isFinite(tree.utm_y)) {
          return null
        }

        const converted = utmToLatLng(tree.utm_x, tree.utm_y)
        if (!Number.isFinite(converted.lat) || !Number.isFinite(converted.lng)) {
          return null
        }

        const speciesItem = speciesById.get(tree.species_id)

        return {
          id: tree.id,
          treeCode: tree.tree_code,
          treeNumber: tree.tree_number,
          speciesName: speciesItem?.name_th || '-',
          speciesColor: speciesItem?.hex_color || '#16A34A',
          lat: converted.lat,
          lng: converted.lng,
        }
      })
      .filter((point): point is MapPoint => point !== null)
  }, [species, trees])

  const mapCenter = useMemo<[number, number]>(() => {
    if (points.length === 0) {
      return [18.3166, 98.4048]
    }

    const sum = points.reduce(
      (acc, point) => {
        acc.lat += point.lat
        acc.lng += point.lng
        return acc
      },
      { lat: 0, lng: 0 }
    )

    return [sum.lat / points.length, sum.lng / points.length]
  }, [points])

  const isLoading = treesLoading || speciesLoading

  const handleRasterStateChange = useCallback((nextState: RasterState) => {
    setRasterState(nextState)
  }, [])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-green-800">แผนที่ต้นไม้</h3>
        <p className="text-xs text-gray-500">
          {shouldRenderOrthophoto
            ? 'กำลังแสดง orthophoto พร้อมตำแหน่งต้นไม้'
            : 'แสดงตำแหน่งต้นไม้บนแผนที่ฐานมาตรฐาน'}
        </p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแผนที่...</p>}
      {treesError && <p className="text-sm text-red-600">{treesError.message}</p>}
      {!treesError && rasterState.isLoading && <p className="text-sm text-gray-500">กำลังโหลด orthophoto...</p>}
      {!treesError && rasterState.error && <p className="text-sm text-amber-700">{rasterState.error}</p>}

      {!isLoading && !treesError && points.length === 0 && (
        <p className="text-sm text-gray-500">ไม่มีพิกัดต้นไม้ที่พร้อมแสดงบนแผนที่</p>
      )}

      {!isLoading && !treesError && points.length > 0 && (
        <div className="h-80 overflow-hidden rounded-lg border border-gray-200 md:h-[26rem]">
          <MapContainer center={mapCenter} zoom={17} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {shouldRenderOrthophoto && orthophotoUrl && (
              <OrthophotoLayer url={orthophotoUrl} onStateChange={handleRasterStateChange} />
            )}

            <FitBounds points={points} disabled={shouldRenderOrthophoto && rasterState.isReady && !rasterState.error} />

            {points.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={selectedTreeId === point.id ? (pseudo3d ? 12 : 9) : pseudo3d ? 8 : 6}
                pathOptions={{
                  color: selectedTreeId === point.id ? '#111827' : point.speciesColor,
                  fillColor: point.speciesColor,
                  fillOpacity: pseudo3d ? 1 : 0.9,
                  weight: selectedTreeId === point.id ? 3 : pseudo3d ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    onSelectTree?.(point.id)
                  },
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-gray-800">{point.treeCode}</p>
                    <p className="text-gray-600">เลขต้น: {point.treeNumber}</p>
                    <p className="text-gray-600">ชนิด: {point.speciesName}</p>
                    {onSelectTree && (
                      <button
                        type="button"
                        onClick={() => onSelectTree(point.id)}
                        className="rounded-md border border-green-700 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                      >
                        เลือกต้นนี้
                      </button>
                    )}
                    <Link to={`/trees/${encodeURIComponent(point.treeCode)}`} className="text-green-700 hover:underline">
                      ดูรายละเอียดต้นไม้
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </section>
  )
}
