import { useCallback, useEffect, useState } from 'react'
import type { PlotImage } from '../lib/database.types'
import { getPlotImages } from '../lib/database/firestoreService'

export function usePlotImages(plotId: string | null) {
  const [images, setImages] = useState<PlotImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!plotId) {
      setImages([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getPlotImages(plotId)
      setImages(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดรูปภาพแปลงได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [plotId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    images,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
