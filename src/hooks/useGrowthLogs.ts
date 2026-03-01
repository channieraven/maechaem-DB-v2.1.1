import { useCallback, useEffect, useState } from 'react'
import type { GrowthLog } from '../lib/database.types'
import { getGrowthLogs } from '../lib/database/firestoreService'

export function useGrowthLogs(treeId: string | null) {
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!treeId) {
      setGrowthLogs([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getGrowthLogs(treeId)
      setGrowthLogs(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลการเจริญเติบโตได้'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [treeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    growthLogs,
    isLoading,
    error,
    refresh,
  }
}
