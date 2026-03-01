import { useState } from 'react'
import type { ImportJobIssue } from '../../lib/database.types'
import {
  commitImportJob,
  dryRunPdfImport,
  type CommitImportJobResult,
  type DryRunPdfImportResult,
} from '../../lib/importJobs'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const output = reader.result
      if (typeof output !== 'string') {
        reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
        return
      }

      const base64 = output.split(',')[1]
      if (!base64) {
        reject(new Error('ไม่พบข้อมูลไฟล์ที่เข้ารหัส base64'))
        return
      }

      resolve(base64)
    }
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

function renderIssue(issue: ImportJobIssue, index: number) {
  const color = issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'
  return (
    <li key={`${issue.code}-${index}`} className={`text-sm ${color}`}>
      [{issue.severity.toUpperCase()}] {issue.code}: {issue.message}
      {typeof issue.row_index === 'number' ? ` (row ${issue.row_index})` : ''}
      {issue.field ? ` [${issue.field}]` : ''}
    </li>
  )
}

export default function ImportDryRun() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [plotCode, setPlotCode] = useState('P5')
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DryRunPdfImportResult | null>(null)
  const [commitResult, setCommitResult] = useState<CommitImportJobResult | null>(null)

  const handleDryRun = async () => {
    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์ PDF ก่อน')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setCommitResult(null)

    try {
      const fileBase64 = await toBase64(selectedFile)
      const dryRunResult = await dryRunPdfImport({
        fileName: selectedFile.name,
        fileBase64,
        sourcePlotCode: plotCode,
      })
      setResult(dryRunResult)
    } catch (dryRunError) {
      setError(dryRunError instanceof Error ? dryRunError.message : 'Dry Run ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!result?.jobId) {
      return
    }

    setCommitting(true)
    setError(null)
    setCommitResult(null)

    try {
      const committed = await commitImportJob({ jobId: result.jobId })
      setCommitResult(committed)
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Commit ไม่สำเร็จ')
    } finally {
      setCommitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-base font-semibold text-green-800">PDF Batch Import (Dry Run)</h3>
      <p className="mb-3 text-sm text-gray-600">ทดสอบ parse และ validate ก่อน import จริง โดยยังไม่เขียนข้อมูลลงตารางหลัก</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ไฟล์ PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setSelectedFile(file)
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="plot-code" className="mb-1 block text-sm font-medium text-gray-700">รหัสแปลงอ้างอิง</label>
          <input
            id="plot-code"
            value={plotCode}
            onChange={(event) => setPlotCode(event.target.value)}
            placeholder="เช่น P5"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => void handleDryRun()}
          disabled={loading}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:opacity-40"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'Run Dry Run'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-800">Job: {result.jobId}</p>
          <p className="text-sm text-gray-700">Status: {result.status}</p>
          <p className="text-sm text-gray-700">
            Summary: rows {result.summary.total_rows}, valid {result.summary.valid_rows}, invalid {result.summary.invalid_rows}
          </p>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Issues</p>
            {result.issues.length === 0 ? (
              <p className="text-sm text-green-700">ไม่พบปัญหา</p>
            ) : (
              <ul className="space-y-1">{result.issues.map(renderIssue)}</ul>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => void handleCommit()}
              disabled={committing || result.status !== 'dry_run_completed'}
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-medium text-green-700 enabled:hover:bg-green-50 disabled:opacity-40"
            >
              {committing ? 'กำลัง commit...' : 'Commit Import'}
            </button>
          </div>

          {commitResult && (
            <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
              <p>Status: {commitResult.status}</p>
              <p>
                committed {commitResult.committedRows} rows | trees +{commitResult.createdTrees}/~{commitResult.updatedTrees} |
                logs {commitResult.upsertedGrowthLogs}
              </p>
              <p>DBH upserts: {commitResult.upsertedGrowthDbh} | issues: {commitResult.issueCount}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
