import { useMemo } from 'react'
import { useOffline } from '../../contexts/OfflineContext'

type OfflineIndicatorProps = {
  isSyncing?: boolean
  queueSize?: number
  className?: string
}

export default function OfflineIndicator({
  isSyncing,
  queueSize,
  className = '',
}: OfflineIndicatorProps) {
  const offline = useOffline()

  const resolvedIsSyncing = isSyncing ?? offline.isSyncing
  const resolvedQueueSize = queueSize ?? offline.pendingCount
  const isOnline = offline.isOnline

  const status = useMemo(() => {
    if (!isOnline) {
      return {
        dot: '🔴',
        label: 'ออฟไลน์',
        style: 'border-red-100 bg-red-50 text-red-700',
      }
    }

    if (resolvedIsSyncing || resolvedQueueSize > 0) {
      return {
        dot: '🟡',
        label: resolvedIsSyncing
          ? 'กำลังซิงก์ข้อมูล'
          : `รอซิงก์ ${resolvedQueueSize} รายการ`,
        style: 'border-amber-100 bg-amber-50 text-amber-700',
      }
    }

    return {
      dot: '🟢',
      label: 'ออนไลน์',
      style: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }, [isOnline, resolvedIsSyncing, resolvedQueueSize])

  return (
    <div className={`border-b px-4 py-2 text-xs md:px-6 ${status.style} ${className}`.trim()} role="status" aria-live="polite">
      <span className="font-medium">
        {status.dot} {status.label}
      </span>
    </div>
  )
}
