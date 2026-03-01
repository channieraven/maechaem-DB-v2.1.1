import { useCallback, useEffect, useState } from 'react'
import type { Plot } from '../lib/database.types'
import { getPlots } from '../lib/database/firestoreService'

export function usePlots() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getPlots()
      setPlots(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลแปลงปลูกได้'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    plots,
    isLoading,
    error,
    refresh,
  }
}
