import { useCallback, useEffect, useState } from 'react'
import type { PlotBasemap } from '../lib/database.types'
import { getPlotBasemap } from '../lib/database/firestoreService'

export function usePlotBasemap(plotId: string | null) {
  const [basemap, setBasemap] = useState<PlotBasemap | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!plotId) {
      setBasemap(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getPlotBasemap(plotId)
      setBasemap(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดข้อมูล orthophoto ได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [plotId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    basemap,
    setBasemap,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
