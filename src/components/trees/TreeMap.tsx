import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { useSpecies } from '../../hooks/useSpecies'
import { useTrees } from '../../hooks/useTrees'
import { utmToLatLng } from '../../utils/coordinates'

type TreeMapProps = {
  plotId: string
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

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) {
      return
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng]),
      { padding: [24, 24], maxZoom: 19 }
    )
  }, [map, points])

  return null
}

export default function TreeMap({ plotId }: TreeMapProps) {
  const { trees, isLoading: treesLoading, error: treesError } = useTrees(plotId)
  const { species, isLoading: speciesLoading } = useSpecies()

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

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-green-800">แผนที่ต้นไม้</h3>
        <p className="text-xs text-gray-500">สี marker แสดงชนิดไม้จาก species.hex_color</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">กำลังโหลดข้อมูลแผนที่...</p>}
      {treesError && <p className="text-sm text-red-600">{treesError.message}</p>}

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

            <FitBounds points={points} />

            {points.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={6}
                pathOptions={{ color: point.speciesColor, fillColor: point.speciesColor, fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-gray-800">{point.treeCode}</p>
                    <p className="text-gray-600">เลขต้น: {point.treeNumber}</p>
                    <p className="text-gray-600">ชนิด: {point.speciesName}</p>
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
