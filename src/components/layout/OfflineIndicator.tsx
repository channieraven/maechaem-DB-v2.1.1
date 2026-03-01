import { useEffect, useMemo, useState } from 'react'

type OfflineIndicatorProps = {
  isSyncing?: boolean
  queueSize?: number
  className?: string
}

export default function OfflineIndicator({
  isSyncing = false,
  queueSize = 0,
  className = '',
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)

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

  const status = useMemo(() => {
    if (!isOnline) {
      return {
        dot: '🔴',
        label: 'ออฟไลน์',
        style: 'border-red-100 bg-red-50 text-red-700',
      }
    }

    if (isSyncing || queueSize > 0) {
      return {
        dot: '🟡',
        label: queueSize > 0 ? `รอซิงก์ ${queueSize} รายการ` : 'กำลังซิงก์ข้อมูล',
        style: 'border-amber-100 bg-amber-50 text-amber-700',
      }
    }

    return {
      dot: '🟢',
      label: 'ออนไลน์',
      style: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    }
  }, [isOnline, isSyncing, queueSize])

  return (
    <div className={`border-b px-4 py-2 text-xs md:px-6 ${status.style} ${className}`.trim()} role="status" aria-live="polite">
      <span className="font-medium">
        {status.dot} {status.label}
      </span>
    </div>
  )
}
