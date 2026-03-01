import type { PlantCategory, TreeStatus, UserRole } from '../lib/database.types'

export function getStatusLabel(status: TreeStatus): string {
  switch (status) {
    case 'alive': return 'มีชีวิต'
    case 'dead': return 'ตาย'
    case 'missing': return 'ไม่พบต้น'
    default: return status
  }
}

export function getStatusColor(status: TreeStatus): string {
  switch (status) {
    case 'alive': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'dead': return 'bg-red-100 text-red-800 border border-red-200'
    case 'missing': return 'bg-amber-100 text-amber-800 border border-amber-200'
    default: return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
}

export function getCategoryLabel(category: PlantCategory): string {
  switch (category) {
    case 'forest': return 'ไม้ป่า'
    case 'bamboo': return 'ไผ่'
    case 'banana': return 'กล้วย'
    case 'fruit': return 'ไม้ผล'
    case 'rubber': return 'ยางพารา'
    default: return category
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'pending': return 'รอดำเนินการ'
    case 'staff': return 'เจ้าหน้าที่'
    case 'researcher': return 'นักวิจัย'
    case 'executive': return 'ผู้บริหาร'
    case 'external': return 'บุคคลภายนอก'
    case 'admin': return 'ผู้ดูแลระบบ'
    default: return role
  }
}

export function formatDate(
  value: Date | string | number | null | undefined,
  locale = 'th-TH',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number | null | undefined,
  locale = 'th-TH',
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, options).format(value);
}
