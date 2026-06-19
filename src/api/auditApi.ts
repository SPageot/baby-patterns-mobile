import { apiFetch } from '@/api/client'

export type ExportAuditSource = 'profile' | 'reports'

export async function recordPdfExportAudit(options: {
  source: ExportAuditSource
  rangeDays?: number
  babyCount: number
  includeAnalysis?: boolean
}): Promise<void> {
  await apiFetch<void>('api/audit/export', {
    method: 'POST',
    body: JSON.stringify({
      source: options.source,
      rangeDays: options.rangeDays ?? null,
      babyCount: options.babyCount,
      includeAnalysis: options.includeAnalysis ?? false,
    }),
  })
}
