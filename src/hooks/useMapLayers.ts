import { useCallback, useEffect, useState } from 'react'
import type { MapLayer } from '../lib/database.types'
import { getMapLayers } from '../lib/database/firestoreService'

export function useMapLayers() {
  const [layers, setLayers] = useState<MapLayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMapLayers()
      setLayers(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดข้อมูลชั้นแผนที่ได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    layers,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
