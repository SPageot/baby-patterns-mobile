import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import { formatHealthDuration } from '@/types/health'
import type { PediatricianVisitDto } from '@/types/pediatrician'
import type { ReportRange } from '@/lib/reportAnalytics'

export type HealthEventsReport = {
  sicknessCount: number
  injuryCount: number
  pediatricianCount: number
  totalEvents: number
  sickness: SicknessEventDto[]
  injuries: InjuryEventDto[]
  pediatricianVisits: PediatricianVisitDto[]
  ongoingSicknessCount: number
  ongoingInjuryCount: number
  withDoctorCount: number
  withMedicationCount: number
  withImmunizationCount: number
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

function sortPediatricianNewest(rows: PediatricianVisitDto[]): PediatricianVisitDto[] {
  return [...rows].sort((a, b) => (a.visitedAt < b.visitedAt ? 1 : -1))
}

export function buildHealthEventsReport(
  sickness: SicknessEventDto[],
  injuries: InjuryEventDto[],
  pediatricianVisits: PediatricianVisitDto[],
  rangeDays: ReportRange,
): HealthEventsReport {
  const filteredSickness = sortSicknessNewest(sickness.filter((row) => inRange(row.startedAt, rangeDays)))
  const filteredInjuries = sortInjuriesNewest(injuries.filter((row) => inRange(row.occurredAt, rangeDays)))
  const filteredVisits = sortPediatricianNewest(
    pediatricianVisits.filter((row) => inRange(row.visitedAt, rangeDays)),
  )

  const withDoctorCount =
    filteredSickness.filter((row) => row.usedDoctorRecommendations).length +
    filteredInjuries.filter((row) => row.usedDoctorRecommendations).length

  return {
    sicknessCount: filteredSickness.length,
    injuryCount: filteredInjuries.length,
    pediatricianCount: filteredVisits.length,
    totalEvents: filteredSickness.length + filteredInjuries.length + filteredVisits.length,
    sickness: filteredSickness,
    injuries: filteredInjuries,
    pediatricianVisits: filteredVisits,
    ongoingSicknessCount: filteredSickness.filter((row) => !row.endedAt).length,
    ongoingInjuryCount: filteredInjuries.filter((row) => !row.endedAt).length,
    withDoctorCount,
    withMedicationCount: filteredSickness.filter((row) => row.usedMedication).length,
    withImmunizationCount: filteredVisits.filter((row) => row.immunizations.length > 0).length,
  }
}

export function healthSummaryLines(report: HealthEventsReport): string[] {
  if (report.totalEvents === 0) return ['No sickness, injury, or pediatrician visit data in this period.']

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
  if (report.pediatricianCount > 0) {
    lines.push(
      `${report.pediatricianCount} pediatrician visit${report.pediatricianCount === 1 ? '' : 's'}${
        report.withImmunizationCount > 0
          ? ` (${report.withImmunizationCount} with immunization${report.withImmunizationCount === 1 ? '' : 's'})`
          : ''
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

export function formatPediatricianRowSummary(row: PediatricianVisitDto): string {
  const parts = [
    row.hospital?.trim() || null,
    row.immunizations.length > 0 ? row.immunizations.slice(0, 4).join(', ') : null,
    row.recommendations?.trim() || null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
}
