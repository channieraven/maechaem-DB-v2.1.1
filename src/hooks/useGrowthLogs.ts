import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GrowthLog, TreeStatus } from '../lib/database.types'
import { getGrowthLogs } from '../lib/database/firestoreService'

type GrowthLogFilters = {
  status?: TreeStatus
  recorderId?: string
  fromDate?: string
  toDate?: string
}

export function useGrowthLogs(treeId: string | null, filters?: GrowthLogFilters) {
  const [rawGrowthLogs, setRawGrowthLogs] = useState<GrowthLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!treeId) {
      setRawGrowthLogs([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getGrowthLogs(treeId)
      setRawGrowthLogs(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดข้อมูลการเจริญเติบโตได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [treeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const growthLogs = useMemo(() => {
    if (!filters) {
      return rawGrowthLogs
    }

    return rawGrowthLogs.filter((log) => {
      if (filters.status && log.status !== filters.status) {
        return false
      }

      if (filters.recorderId && log.recorder_id !== filters.recorderId) {
        return false
      }

      const surveyTime = new Date(String(log.survey_date)).getTime()

      if (filters.fromDate) {
        const fromTime = new Date(filters.fromDate).getTime()
        if (!Number.isNaN(surveyTime) && surveyTime < fromTime) {
          return false
        }
      }

      if (filters.toDate) {
        const toTime = new Date(filters.toDate).getTime()
        if (!Number.isNaN(surveyTime) && surveyTime > toTime) {
          return false
        }
      }

      return true
    })
  }, [rawGrowthLogs, filters])

  return {
    growthLogs,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
