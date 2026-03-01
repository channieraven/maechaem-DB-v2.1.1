import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  type DocumentData,
  type WithFieldValue,
} from 'firebase/firestore'
import { db } from './firebase'

const OFFLINE_QUEUE_STORAGE_KEY = 'maechaem_pending_actions'
const OFFLINE_QUEUE_UPDATED_EVENT = 'maechaem-offline-queue-updated'

export interface PendingAction {
  id: string
  collection: string
  action: 'add' | 'update' | 'delete'
  data: Record<string, any>
  childCollection?: string
  childData?: Record<string, any>
  timestamp: number
}

type PendingActionInput = Omit<PendingAction, 'id' | 'timestamp'>

type QueueProcessResult = {
  processed: number
  failed: number
  remaining: number
}

export type OfflineWriteResult<T> =
  | { queued: false; result: T }
  | { queued: true; pendingAction: PendingAction }

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function emitQueueUpdated(queueSize: number) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<{ pendingCount: number }>(OFFLINE_QUEUE_UPDATED_EVENT, {
      detail: { pendingCount: queueSize },
    })
  )
}

function readQueueFromStorage(): PendingAction[] {
  if (!canUseBrowserStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as PendingAction[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueueToStorage(items: PendingAction[]) {
  if (!canUseBrowserStorage()) {
    return
  }

  localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(items))
  emitQueueUpdated(items.length)
}

function createPendingAction(input: PendingActionInput): PendingAction {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...input,
  }
}

function isNetworkLikeError(error: unknown): boolean {
  if (!navigator.onLine) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  const candidate = (error as Error & { code?: string }).code ?? ''

  return [
    'unavailable',
    'deadline-exceeded',
    'failed-precondition',
    'network-request-failed',
  ].some((segment) => candidate.includes(segment))
}

async function applyPendingAction(action: PendingAction): Promise<void> {
  if (action.action === 'add') {
    const documentRef = await addDoc(
      collection(db, action.collection),
      action.data as WithFieldValue<DocumentData>
    )

    if (action.childCollection && action.childData) {
      const childPayload: Record<string, any> = {
        ...action.childData,
      }

      if (!('growth_log_id' in childPayload)) {
        childPayload.growth_log_id = documentRef.id
      }

      await addDoc(
        collection(db, action.childCollection),
        childPayload as WithFieldValue<DocumentData>
      )
    }

    return
  }

  const targetId = typeof action.data.id === 'string' ? action.data.id : ''

  if (!targetId) {
    throw new Error('Pending action is missing document id')
  }

  if (action.action === 'update') {
    const { id: _, ...payload } = action.data
    await updateDoc(doc(db, action.collection, targetId), payload)
    return
  }

  await deleteDoc(doc(db, action.collection, targetId))
}

export function getPendingActions(): PendingAction[] {
  return readQueueFromStorage().sort((a, b) => a.timestamp - b.timestamp)
}

export function getPendingActionCount(): number {
  return getPendingActions().length
}

export function onPendingActionsChanged(listener: (count: number) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ pendingCount: number }>
    listener(customEvent.detail?.pendingCount ?? getPendingActionCount())
  }

  window.addEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handler)

  return () => {
    window.removeEventListener(OFFLINE_QUEUE_UPDATED_EVENT, handler)
  }
}

export function enqueuePendingAction(input: PendingActionInput): PendingAction {
  const nextAction = createPendingAction(input)
  const nextQueue = [...getPendingActions(), nextAction]
  writeQueueToStorage(nextQueue)
  return nextAction
}

export async function processPendingActions(): Promise<QueueProcessResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      processed: 0,
      failed: 0,
      remaining: getPendingActionCount(),
    }
  }

  const queue = getPendingActions()

  if (queue.length === 0) {
    return {
      processed: 0,
      failed: 0,
      remaining: 0,
    }
  }

  let nextIndex = 0
  let processed = 0
  let failed = 0

  while (nextIndex < queue.length) {
    const item = queue[nextIndex]

    try {
      await applyPendingAction(item)
      processed += 1
      nextIndex += 1
    } catch (error) {
      failed += 1

      if (isNetworkLikeError(error)) {
        break
      }

      console.error('Dropping invalid queued action:', item, error)
      nextIndex += 1
    }
  }

  const remainingQueue = queue.slice(nextIndex)
  writeQueueToStorage(remainingQueue)

  return {
    processed,
    failed,
    remaining: remainingQueue.length,
  }
}

export async function executeWriteWithOfflineFallback<T>(params: {
  collection: string
  action: PendingAction['action']
  data: Record<string, any>
  childCollection?: string
  childData?: Record<string, any>
  write: () => Promise<T>
}): Promise<OfflineWriteResult<T>> {
  const pendingInput: PendingActionInput = {
    collection: params.collection,
    action: params.action,
    data: params.data,
    childCollection: params.childCollection,
    childData: params.childData,
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      queued: true,
      pendingAction: enqueuePendingAction(pendingInput),
    }
  }

  try {
    return {
      queued: false,
      result: await params.write(),
    }
  } catch (error) {
    if (!isNetworkLikeError(error)) {
      throw error
    }

    return {
      queued: true,
      pendingAction: enqueuePendingAction(pendingInput),
    }
  }
}
