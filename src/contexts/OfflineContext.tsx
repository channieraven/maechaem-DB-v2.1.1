import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getPendingActionCount,
  onPendingActionsChanged,
  processPendingActions,
} from '../lib/offlineQueue'

export type OfflineStatus = 'online' | 'offline' | 'syncing'

type OfflineContextValue = {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  status: OfflineStatus
  syncNow: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [pendingCount, setPendingCount] = useState(() => getPendingActionCount())
  const [isSyncing, setIsSyncing] = useState(false)

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      const result = await processPendingActions()
      setPendingCount(result.remaining)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    setPendingCount(getPendingActionCount())

    const unsubscribe = onPendingActionsChanged((count) => {
      setPendingCount(count)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isOnline) {
      return
    }

    void syncNow()
  }, [isOnline, syncNow])

  const status: OfflineStatus = useMemo(() => {
    if (!isOnline) {
      return 'offline'
    }

    if (isSyncing) {
      return 'syncing'
    }

    return 'online'
  }, [isOnline, isSyncing])

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      pendingCount,
      isSyncing,
      status,
      syncNow,
    }),
    [isOnline, pendingCount, isSyncing, status, syncNow]
  )

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext)

  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }

  return context
}
