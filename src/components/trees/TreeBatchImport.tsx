import { useMemo, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSpecies } from '../../hooks/useSpecies'
import { useTrees } from '../../hooks/useTrees'
import { addTree, updatePlot } from '../../lib/database/firestoreService'
import type { Plot, Tree } from '../../lib/database.types'
import { parseTreeBatchText, type ParsedTreeBatchRow, type TreeBatchImportIssue } from '../../utils/treeBatchImport'

type TreeBatchImportProps = {
  plot: Plot
  onImported?: () => Promise<void> | void
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').trim().toLowerCase()
}

export default function TreeBatchImport({ plot, onImported }: TreeBatchImportProps) {
  const { profile } = useAuth()
  const { species } = useSpecies()
  const { trees, refresh: refreshTrees } = useTrees(plot.id)
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedTreeBatchRow[]>([])
  const [parseIssues, setParseIssues] = useState<TreeBatchImportIssue[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [totalRows, setTotalRows] = useState(0)

  const speciesByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of species) {
      const normalizedName = normalizeText(item.name_th)
      if (normalizedName) {
        map.set(normalizedName, item.id)
      }
    }
    return map
  }, [species])

  const existingTreeCodes = useMemo(() => {
    return new Set(trees.map((item) => item.tree_code.toUpperCase().trim()))
  }, [trees])

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setStatus(null)

    if (!file) {
      setFileName('')
      setParsedRows([])
      setParseIssues([])
      setTotalRows(0)
      return
    }

    try {
      const text = await file.text()
      const result = parseTreeBatchText(text)
      setFileName(file.name)
      setParsedRows(result.rows)
      setParseIssues(result.issues)
      setTotalRows(result.totalRows)
    } catch (error) {
      setFileName(file.name)
      setParsedRows([])
      setParseIssues([
        {
          lineNumber: 0,
          severity: 'error',
          message: error instanceof Error ? error.message : 'ไม่สามารถอ่านไฟล์ได้',
        },
      ])
      setTotalRows(0)
    }
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setStatus('ยังไม่มีข้อมูลที่พร้อมนำเข้า')
      return
    }

    setIsImporting(true)
    setStatus(null)

    const nextIssues: TreeBatchImportIssue[] = []
    const createdTreeCodes = new Set<string>()
    const payloads: Omit<Tree, 'id'>[] = []

    for (const row of parsedRows) {
      const normalizedCode = row.treeCode.toUpperCase().trim()
      if (existingTreeCodes.has(normalizedCode) || createdTreeCodes.has(normalizedCode)) {
        nextIssues.push({
          lineNumber: row.lineNumber,
          severity: 'warning',
          message: `มีต้นไม้รหัส ${row.treeCode} อยู่แล้ว จึงข้ามแถวนี้`,
        })
        continue
      }

      const speciesId = speciesByName.get(normalizeText(row.speciesName))
      if (!speciesId) {
        nextIssues.push({
          lineNumber: row.lineNumber,
          severity: 'error',
          message: `ไม่พบชนิดพันธุ์ในระบบ: ${row.speciesName}`,
        })
        continue
      }

      createdTreeCodes.add(normalizedCode)
      payloads.push({
        tree_code: row.treeCode,
        plot_id: plot.id,
        species_id: speciesId,
        tree_number: row.treeNumber,
        tag_label: row.tagLabel,
        row_main: row.rowMain,
        row_sub: row.rowSub,
        utm_x: 0,
        utm_y: 0,
        geom: {
          type: 'Point',
          coordinates: [0, 0],
        },
        grid_spacing: 0,
        note: row.note,
        created_at: new Date().toISOString(),
      })
    }

    let importedCount = 0

    try {
      for (const payload of payloads) {
        await addTree(payload)
        importedCount += 1
      }

      if (importedCount > 0) {
        await updatePlot(plot.id, {
          tree_count: plot.tree_count + importedCount,
          alive_count: plot.alive_count + importedCount,
          last_edited_by: profile?.fullname || 'batch import',
          last_edited_at: new Date().toISOString(),
        })
      }

      setParseIssues((prev) => [...prev, ...nextIssues])
      setStatus(`นำเข้าสำเร็จ ${importedCount} ต้นไม้`)
      await refreshTrees()
      await onImported?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'นำเข้าข้อมูลไม่สำเร็จ'
      setStatus(message)
      setParseIssues((prev) => [
        ...prev,
        ...nextIssues,
        {
          lineNumber: 0,
          severity: 'error',
          message,
        },
      ])
    } finally {
      setIsImporting(false)
    }
  }

  const errorCount = parseIssues.filter((item) => item.severity === 'error').length
  const warningCount = parseIssues.filter((item) => item.severity === 'warning').length

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-green-800">นำเข้าต้นไม้แบบชุด (CSV/TXT)</h3>
        <p className="text-xs text-gray-500">อ้างอิงรูปแบบไฟล์จาก P5-A-02.csv และ P5-B.txt</p>
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(event) => {
              void handleFileSelected(event)
            }}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
          {fileName && <p className="mt-1 text-xs text-gray-600">ไฟล์ที่เลือก: {fileName}</p>}
        </div>

        {(fileName || totalRows > 0) && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <p>จำนวนแถวในไฟล์: {totalRows}</p>
            <p>แถวพร้อมนำเข้า: {parsedRows.length}</p>
            <p>ปัญหา: error {errorCount} / warning {warningCount}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={isImporting || parsedRows.length === 0}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImporting ? 'กำลังนำเข้า...' : 'นำเข้าต้นไม้'}
        </button>

        {status && <p className="text-sm text-gray-700">{status}</p>}

        {parseIssues.length > 0 && (
          <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-xs">
            <ul className="space-y-1">
              {parseIssues.map((issue, index) => (
                <li key={`${issue.lineNumber}-${index}`} className={issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}>
                  {issue.lineNumber > 0 ? `บรรทัด ${issue.lineNumber}: ` : ''}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
