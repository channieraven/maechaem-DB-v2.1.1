import { useCallback, useEffect, useState } from 'react'
import type { PlotImage } from '../lib/database.types'
import { getPlotImages } from '../lib/database/firestoreService'

export function usePlotImages(plotId: string | null) {
  const [images, setImages] = useState<PlotImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!plotId) {
      setImages([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getPlotImages(plotId)
      setImages(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถโหลดรูปภาพแปลงได้'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [plotId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    images,
    isLoading,
    error,
    refresh,
  }
}
