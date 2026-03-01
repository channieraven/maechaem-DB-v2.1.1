import { useCallback, useEffect, useState } from 'react'
import type { Tree } from '../lib/database.types'
import { getTrees } from '../lib/database/firestoreService'

export function useTrees(plotId: string | null) {
  const [trees, setTrees] = useState<Tree[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!plotId) {
      setTrees([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getTrees(plotId)
      setTrees(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดข้อมูลต้นไม้ได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [plotId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    trees,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
