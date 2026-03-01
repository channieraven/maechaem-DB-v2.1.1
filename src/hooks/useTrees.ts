import { useCallback, useEffect, useState } from 'react'
import type { Tree } from '../lib/database.types'
import { getTrees } from '../lib/database/firestoreService'

export function useTrees(plotId: string | null) {
  const [trees, setTrees] = useState<Tree[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!plotId) {
      setTrees([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getTrees(plotId)
      setTrees(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลต้นไม้ได้'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [plotId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    trees,
    isLoading,
    error,
    refresh,
  }
}
