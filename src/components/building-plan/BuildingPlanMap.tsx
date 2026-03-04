import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, LayersControl, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { MapLayer } from '../../lib/database.types'
import { useMapLayers } from '../../hooks/useMapLayers'
import { LAYER_TYPE_LABELS } from '../../utils/constants'

type GeoJsonCache = Record<string, FeatureCollection>

function FitAllLayers({ geojsonCache, visibleIds }: { geojsonCache: GeoJsonCache; visibleIds: Set<string> }) {
  const map = useMap()

  useEffect(() => {
    const allCoords: [number, number][] = []

    for (const [id, fc] of Object.entries(geojsonCache)) {
      if (!visibleIds.has(id)) continue

      for (const feature of fc.features) {
        const geom = feature.geometry
        if (geom.type === 'Point') {
          allCoords.push([geom.coordinates[1], geom.coordinates[0]])
        } else if (geom.type === 'LineString' || geom.type === 'MultiPoint') {
          for (const coord of geom.coordinates) {
            allCoords.push([coord[1], coord[0]])
          }
        } else if (geom.type === 'Polygon' || geom.type === 'MultiLineString') {
          for (const ring of geom.coordinates) {
            for (const coord of ring) {
              allCoords.push([coord[1], coord[0]])
            }
          }
        } else if (geom.type === 'MultiPolygon') {
          for (const polygon of geom.coordinates) {
            for (const ring of polygon) {
              for (const coord of ring) {
                allCoords.push([coord[1], coord[0]])
              }
            }
          }
        }
      }
    }

    if (allCoords.length > 0) {
      map.fitBounds(allCoords, { padding: [24, 24], maxZoom: 18 })
    }
  }, [map, geojsonCache, visibleIds])

  return null
}

function layerStyleToPathOptions(style: MapLayer['style']): PathOptions {
  return {
    color: style.color,
    weight: style.weight,
    opacity: style.opacity,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
  }
}

export default function BuildingPlanMap() {
  const { layers, isLoading, error } = useMapLayers()
  const [geojsonCache, setGeojsonCache] = useState<GeoJsonCache>({})
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(new Set())
  const [fetchErrors, setFetchErrors] = useState<Record<string, string>>({})

  // Fetch GeoJSON data for each layer
  useEffect(() => {
    if (layers.length === 0) return

    const defaultVisible = new Set<string>()
    layers.forEach((layer) => {
      if (layer.visible_by_default) defaultVisible.add(layer.id)
    })
    setVisibleLayerIds(defaultVisible)

    layers.forEach(async (layer) => {
      if (geojsonCache[layer.id]) return

      try {
        const response = await fetch(layer.geojson_url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = (await response.json()) as FeatureCollection
        setGeojsonCache((prev) => ({ ...prev, [layer.id]: data }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ไม่สามารถโหลดชั้นข้อมูลได้'
        setFetchErrors((prev) => ({ ...prev, [layer.id]: message }))
      }
    })
  }, [layers]) // eslint-disable-line react-hooks/exhaustive-deps

  const layersByType = useMemo(() => {
    const grouped: Record<string, MapLayer[]> = {}
    for (const layer of layers) {
      const key = layer.layer_type
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(layer)
    }
    return grouped
  }, [layers])

  const toggleLayer = (layerId: string) => {
    setVisibleLayerIds((prev) => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }

  const mapCenter = useMemo<[number, number]>(() => [18.3166, 98.4048], [])

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">กำลังโหลดแผนผังการปลูก...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-red-600">{error.message}</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-green-800">แผนที่แผนผังการปลูก</h3>
          <p className="text-xs text-gray-500">เปิด/ปิดชั้นข้อมูลได้จากแผงควบคุมด้านขวาของแผนที่</p>
        </div>
        <p className="text-xs text-gray-400">{layers.length} ชั้นข้อมูล</p>
      </div>

      {layers.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm text-gray-500">ยังไม่มีชั้นข้อมูลแผนที่ — อัปโหลด GeoJSON เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="relative">
          <div className="h-[28rem] overflow-hidden rounded-lg border border-gray-200 md:h-[36rem]">
            <MapContainer center={mapCenter} zoom={15} className="h-full w-full" scrollWheelZoom>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="ภาพดาวเทียม">
                  <TileLayer
                    attribution='&copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="ภูมิประเทศ">
                  <TileLayer
                    attribution='&copy; OpenTopoMap'
                    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <FitAllLayers geojsonCache={geojsonCache} visibleIds={visibleLayerIds} />

              {layers.map((layer) => {
                const data = geojsonCache[layer.id]
                if (!data || !visibleLayerIds.has(layer.id)) return null

                return (
                  <GeoJSON
                    key={`${layer.id}-${JSON.stringify(layer.style)}`}
                    data={data}
                    style={() => layerStyleToPathOptions(layer.style)}
                    pointToLayer={(_feature, latlng) => {
                      return L.circleMarker(latlng, {
                        radius: 5,
                        ...layerStyleToPathOptions(layer.style),
                      })
                    }}
                    onEachFeature={(feature, leafletLayer: Layer) => {
                      const props = feature.properties
                      if (props && Object.keys(props).length > 0) {
                        const rows = Object.entries(props)
                          .filter(([, v]) => v != null && v !== '')
                          .map(([k, v]) => `<tr><td class="pr-2 text-xs text-gray-500">${k}</td><td class="text-xs font-medium">${v}</td></tr>`)
                          .join('')
                        if (rows) {
                          leafletLayer.bindPopup(`<table>${rows}</table>`)
                        }
                      }
                    }}
                  />
                )
              })}
            </MapContainer>
          </div>

          {/* Custom layer toggle panel */}
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">ชั้นข้อมูล</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(layersByType).map(([type, typeLayers]) => (
                <div key={type}>
                  <p className="mb-1 text-xs font-medium text-gray-700">
                    {LAYER_TYPE_LABELS[type] ?? type}
                  </p>
                  {typeLayers.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={visibleLayerIds.has(layer.id)}
                        onChange={() => toggleLayer(layer.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-green-600"
                      />
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: layer.style.color }}
                      />
                      <span className="truncate text-gray-700">{layer.name}</span>
                      {fetchErrors[layer.id] && (
                        <span className="text-xs text-red-500" title={fetchErrors[layer.id]}>!</span>
                      )}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
