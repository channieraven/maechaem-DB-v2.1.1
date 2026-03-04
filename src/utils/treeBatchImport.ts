import Papa from 'papaparse'

type RawRow = Record<string, string>

export type TreeBatchImportIssue = {
  lineNumber: number
  severity: 'error' | 'warning'
  message: string
}

export type ParsedTreeBatchRow = {
  lineNumber: number
  treeNumber: number
  tagLabel: string
  treeCode: string
  speciesName: string
  rowMain: number
  rowSub: number
  note: string
}

export type TreeBatchParseResult = {
  rows: ParsedTreeBatchRow[]
  issues: TreeBatchImportIssue[]
  totalRows: number
}

function getValue(row: RawRow, key: string): string {
  return (row[key] || '').trim()
}

function parseNumericToken(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRowPosition(tagLabel: string): { rowMain: number; rowSub: number } | null {
  const matched = tagLabel.match(/P\d+\s*(\d+)\s*\(([^)]+)\)/i)
  if (!matched) {
    return null
  }

  const rowMain = Number(matched[1])
  const rowSubToken = matched[2].trim().toUpperCase()

  if (!Number.isFinite(rowMain)) {
    return null
  }

  if (/^\d+$/.test(rowSubToken)) {
    return { rowMain, rowSub: Number(rowSubToken) }
  }

  const alphaMatched = rowSubToken.match(/^(\d+)-([A-Z])$/)
  if (!alphaMatched) {
    return null
  }

  const base = Number(alphaMatched[1])
  const suffix = alphaMatched[2].charCodeAt(0) - 64
  if (!Number.isFinite(base) || suffix < 1 || suffix > 26) {
    return null
  }

  return {
    rowMain,
    rowSub: base * 10 + suffix,
  }
}

export function parseTreeBatchText(content: string): TreeBatchParseResult {
  const parsed = Papa.parse<RawRow>(content.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (value) => value.trim(),
  })

  const issues: TreeBatchImportIssue[] = []
  const rows: ParsedTreeBatchRow[] = []
  const seenTreeCodes = new Set<string>()

  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      issues.push({
        lineNumber: Number(error.row ?? 0) + 2,
        severity: 'error',
        message: `รูปแบบไฟล์ไม่ถูกต้อง: ${error.message}`,
      })
    }
  }

  const requiredHeaders = ['ต้นที่', 'เลขแท็กต้นไม้', 'เลขรหัสต้นไม้', 'ชนิดพันธุ์']
  for (const header of requiredHeaders) {
    if (!parsed.meta.fields?.includes(header)) {
      issues.push({
        lineNumber: 1,
        severity: 'error',
        message: `ไม่พบคอลัมน์ที่จำเป็น: ${header}`,
      })
    }
  }

  parsed.data.forEach((rawRow, index) => {
    const lineNumber = index + 2
    const treeNumberRaw = getValue(rawRow, 'ต้นที่')
    const tagLabel = getValue(rawRow, 'เลขแท็กต้นไม้')
    const treeCode = getValue(rawRow, 'เลขรหัสต้นไม้')
    const speciesName = getValue(rawRow, 'ชนิดพันธุ์')
    const note = getValue(rawRow, 'หมายเหตุ')

    if (!treeNumberRaw && !tagLabel && !treeCode && !speciesName) {
      return
    }

    const treeNumberParsed = parseNumericToken(treeNumberRaw)
    if (treeNumberParsed === null) {
      issues.push({
        lineNumber,
        severity: 'warning',
        message: 'ข้ามแถวนี้ เพราะต้นที่ไม่ใช่ตัวเลข (เช่นแถวปลูกแทรก)',
      })
      return
    }

    if (!tagLabel || !treeCode || !speciesName) {
      issues.push({
        lineNumber,
        severity: 'error',
        message: 'ข้อมูลไม่ครบ (ต้องมีเลขแท็กต้นไม้, เลขรหัสต้นไม้, ชนิดพันธุ์)',
      })
      return
    }

    const normalizedCode = treeCode.toUpperCase()
    if (seenTreeCodes.has(normalizedCode)) {
      issues.push({
        lineNumber,
        severity: 'warning',
        message: `พบรหัสต้นไม้ซ้ำในไฟล์ (${treeCode}) จึงข้ามแถวนี้`,
      })
      return
    }

    const rowPosition = parseRowPosition(tagLabel)
    const fallbackRow = Math.trunc(treeNumberParsed)
    const rowMain = rowPosition?.rowMain ?? fallbackRow
    const rowSub = rowPosition?.rowSub ?? fallbackRow

    if (!rowPosition) {
      issues.push({
        lineNumber,
        severity: 'warning',
        message: 'ไม่สามารถอ่านตำแหน่งแถวจากเลขแท็กได้ ใช้ต้นที่แทน (row_main/row_sub)',
      })
    }

    seenTreeCodes.add(normalizedCode)

    rows.push({
      lineNumber,
      treeNumber: Math.trunc(treeNumberParsed),
      tagLabel,
      treeCode,
      speciesName,
      rowMain,
      rowSub,
      note,
    })
  })

  return {
    rows,
    issues,
    totalRows: parsed.data.length,
  }
}
