import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import { formatHealthDuration } from '@/types/health'
import type { ReportRange } from '@/lib/reportAnalytics'

export type HealthEventsReport = {
  sicknessCount: number
  injuryCount: number
  totalEvents: number
  sickness: SicknessEventDto[]
  injuries: InjuryEventDto[]
  ongoingSicknessCount: number
  ongoingInjuryCount: number
  withDoctorCount: number
  withMedicationCount: number
}

function inRange(iso: string, rangeDays: ReportRange): boolean {
  if (rangeDays === 0) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays)
  cutoff.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  return !Number.isNaN(d.getTime()) && d >= cutoff
}

function sortSicknessNewest(rows: SicknessEventDto[]): SicknessEventDto[] {
  return [...rows].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

function sortInjuriesNewest(rows: InjuryEventDto[]): InjuryEventDto[] {
  return [...rows].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
}

export function buildHealthEventsReport(
  sickness: SicknessEventDto[],
  injuries: InjuryEventDto[],
  rangeDays: ReportRange,
): HealthEventsReport {
  const filteredSickness = sortSicknessNewest(sickness.filter((row) => inRange(row.startedAt, rangeDays)))
  const filteredInjuries = sortInjuriesNewest(injuries.filter((row) => inRange(row.occurredAt, rangeDays)))

  const withDoctorCount =
    filteredSickness.filter((row) => row.usedDoctorRecommendations).length +
    filteredInjuries.filter((row) => row.usedDoctorRecommendations).length

  return {
    sicknessCount: filteredSickness.length,
    injuryCount: filteredInjuries.length,
    totalEvents: filteredSickness.length + filteredInjuries.length,
    sickness: filteredSickness,
    injuries: filteredInjuries,
    ongoingSicknessCount: filteredSickness.filter((row) => !row.endedAt).length,
    ongoingInjuryCount: filteredInjuries.filter((row) => !row.endedAt).length,
    withDoctorCount,
    withMedicationCount: filteredSickness.filter((row) => row.usedMedication).length,
  }
}

export function healthSummaryLines(report: HealthEventsReport): string[] {
  if (report.totalEvents === 0) return ['No sickness or injury events in this period.']

  const lines: string[] = []
  if (report.sicknessCount > 0) {
    lines.push(
      `${report.sicknessCount} sickness log${report.sicknessCount === 1 ? '' : 's'}${
        report.ongoingSicknessCount > 0 ? ` (${report.ongoingSicknessCount} ongoing)` : ''
      }.`,
    )
  }
  if (report.injuryCount > 0) {
    lines.push(
      `${report.injuryCount} injur${report.injuryCount === 1 ? 'y' : 'ies'} logged${
        report.ongoingInjuryCount > 0 ? ` (${report.ongoingInjuryCount} ongoing)` : ''
      }.`,
    )
  }
  if (report.withDoctorCount > 0) {
    lines.push(`${report.withDoctorCount} event${report.withDoctorCount === 1 ? '' : 's'} with doctor recommendations.`)
  }
  if (report.withMedicationCount > 0) {
    lines.push(`${report.withMedicationCount} sickness log${report.withMedicationCount === 1 ? '' : 's'} with medication.`)
  }
  return lines
}

export function formatSicknessCareSummary(row: SicknessEventDto): string {
  const parts: string[] = []
  if (row.usedDoctorRecommendations) parts.push('Doctor')
  if (row.usedNaturalRemedies) parts.push('Natural remedies')
  if (row.usedMedication) {
    const med = row.medicationUsed?.trim()
    parts.push(med ? `Medication: ${med}` : 'Medication')
  }
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export function formatInjuryCareSummary(row: InjuryEventDto): string {
  const parts: string[] = []
  if (row.usedDoctorRecommendations) parts.push('Doctor')
  if (row.usedNaturalRemedies) parts.push('Natural remedies')
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export function formatSicknessRowSummary(row: SicknessEventDto): string {
  const duration = formatHealthDuration(row.startedAt, row.endedAt)
  const temp = row.temperatureF ? `${row.temperatureF}°F` : null
  const symptoms =
    row.symptoms.length > 0 ? row.symptoms.slice(0, 4).join(', ') + (row.symptoms.length > 4 ? '…' : '') : null
  return [duration, temp, symptoms].filter(Boolean).join(' · ')
}

export function formatInjuryRowSummary(row: InjuryEventDto): string {
  const duration = formatHealthDuration(row.occurredAt, row.endedAt)
  const parts = [row.bodyPart?.trim(), row.hasSwelling ? 'Swelling' : null, duration].filter(Boolean)
  return parts.join(' · ')
}
