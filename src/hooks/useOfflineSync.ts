import { useCallback, useMemo, useState } from 'react'

const OFFLINE_QUEUE_KEY = 'maechaem_offline_queue'

export type OfflineActionType =
  | 'ADD_GROWTH_LOG'
  | 'UPLOAD_IMAGE'
  | 'DELETE_IMAGE'
  | 'CUSTOM'

export type OfflineQueueItem<TPayload = unknown> = {
  id: string
  type: OfflineActionType
  payload: TPayload
  createdAt: string
}

function readQueueFromStorage(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as OfflineQueueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueueToStorage(items: OfflineQueueItem[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items))
}

export function useOfflineSync() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => readQueueFromStorage())

  const enqueue = useCallback(
    <TPayload,>(type: OfflineActionType, payload: TPayload) => {
      const nextItem: OfflineQueueItem<TPayload> = {
        id: crypto.randomUUID(),
        type,
        payload,
        createdAt: new Date().toISOString(),
      }

      setQueue((prev) => {
        const next = [...prev, nextItem]
        writeQueueToStorage(next)
        return next
      })

      return nextItem
    },
    []
  )

  const remove = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.id !== id)
      writeQueueToStorage(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setQueue([])
    writeQueueToStorage([])
  }, [])

  const flush = useCallback(
    async (
      processor: (item: OfflineQueueItem) => Promise<void>
    ): Promise<{ success: number; failed: number }> => {
      let success = 0
      let failed = 0
      const failedIds = new Set<string>()

      for (const item of queue) {
        try {
          await processor(item)
          success += 1
        } catch {
          failed += 1
          failedIds.add(item.id)
        }
      }

      if (success > 0) {
        setQueue((prev) => {
          const next = prev.filter((item) => failedIds.has(item.id))
          writeQueueToStorage(next)
          return next
        })
      }

      return { success, failed }
    },
    [queue]
  )

  const queueSize = useMemo(() => queue.length, [queue])

  return {
    queue,
    queueSize,
    enqueue,
    remove,
    clear,
    flush,
  }
}
