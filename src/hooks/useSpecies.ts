import { useCallback, useEffect, useState } from 'react'
import type { Species } from '../lib/database.types'
import { getSpecies } from '../lib/database/firestoreService'

export function useSpecies() {
  const [species, setSpecies] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getSpecies()
      setSpecies(data)
    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error('ไม่สามารถโหลดข้อมูลชนิดพืชได้')
      setError(normalizedError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    species,
    loading,
    isLoading: loading,
    error,
    refresh,
  }
}
