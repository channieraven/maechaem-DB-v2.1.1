import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import type { ImportJobIssue, ImportJobSummary } from './database.types'

export type DryRunPdfImportInput = {
  fileName: string
  fileBase64: string
  sourcePlotCode?: string
}

export type DryRunPdfImportResult = {
  jobId: string
  status: 'dry_run_completed' | 'failed'
  summary: ImportJobSummary
  issues: ImportJobIssue[]
}

export type CommitImportJobInput = {
  jobId: string
}

export type CommitImportJobResult = {
  jobId: string
  accepted: boolean
  status: 'validated' | 'committed'
  committedRows: number
  createdTrees: number
  updatedTrees: number
  upsertedGrowthLogs: number
  upsertedGrowthDbh: number
  issueCount: number
}

export async function dryRunPdfImport(input: DryRunPdfImportInput): Promise<DryRunPdfImportResult> {
  const callable = httpsCallable<DryRunPdfImportInput, DryRunPdfImportResult>(functions, 'dryRunPdfImport')
  const response = await callable(input)
  return response.data
}

export async function commitImportJob(input: CommitImportJobInput): Promise<CommitImportJobResult> {
  const callable = httpsCallable<CommitImportJobInput, CommitImportJobResult>(functions, 'commitImportJob')
  const response = await callable(input)
  return response.data
}
