import { useCallback, useEffect, useState } from 'react'
import type { MapExperienceConfig } from '../lib/database.types'
import { getMapExperienceConfig } from '../lib/database/firestoreService'

export function useMapExperienceConfig(configId = 'default') {
  const [config, setConfig] = useState<MapExperienceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getMapExperienceConfig(configId)
      setConfig(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดการตั้งค่าแผนที่ได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [configId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    config,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
