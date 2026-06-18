import type { GrowthMeasurementDto, MilestoneDto } from '@/types/growth'
import type { InjuryEventDto, SicknessEventDto } from '@/types/health'
import { isoInLocalMonth } from '@/lib/trackUtils'

function trimmedMeasurement(value: string | number | null | undefined): string {
  return String(value ?? '').trim()
}

export type ProfileExtendedMonthStats = {
  growth: number
  milestones: number
  sickness: number
  injuries: number
  health: number
  growthDetail: string
  milestoneDetail: string
  healthDetail: string
}

export function buildProfileExtendedMonthStats(
  growthRows: GrowthMeasurementDto[],
  milestoneRows: MilestoneDto[],
  sicknessRows: SicknessEventDto[],
  injuryRows: InjuryEventDto[],
  year: number,
  month: number,
): ProfileExtendedMonthStats {
  const growthInMonth = growthRows.filter((row) => isoInLocalMonth(row.recordedAt, year, month))
  const milestonesInMonth = milestoneRows.filter((row) =>
    isoInLocalMonth(row.achievedAt, year, month),
  )
  const sicknessInMonth = sicknessRows.filter((row) => isoInLocalMonth(row.startedAt, year, month))
  const injuriesInMonth = injuryRows.filter((row) => isoInLocalMonth(row.occurredAt, year, month))

  const growthSorted = [...growthInMonth].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  const latestWeightRow = growthSorted.find((row) => trimmedMeasurement(row.weightLbs))
  const latestHeightRow = growthSorted.find((row) => trimmedMeasurement(row.heightInches))
  const latestWeight = latestWeightRow ? trimmedMeasurement(latestWeightRow.weightLbs) : ''
  const latestHeight = latestHeightRow ? trimmedMeasurement(latestHeightRow.heightInches) : ''

  let growthDetail = '—'
  if (latestWeight) growthDetail = `${latestWeight} lb latest`
  else if (latestHeight) growthDetail = `${latestHeight} in latest`
  else if (growthInMonth.length > 0) growthDetail = 'Logged this month'

  const milestoneSorted = [...milestonesInMonth].sort((a, b) =>
    b.achievedAt.localeCompare(a.achievedAt),
  )
  const latestTitle = milestoneSorted[0]?.title?.trim()
  let milestoneDetail = '—'
  if (latestTitle) {
    milestoneDetail = latestTitle.length > 28 ? `${latestTitle.slice(0, 26)}…` : latestTitle
  } else if (milestonesInMonth.length > 0) {
    milestoneDetail = 'Achieved this month'
  }

  const sickness = sicknessInMonth.length
  const injuries = injuriesInMonth.length
  let healthDetail = '—'
  if (sickness > 0 || injuries > 0) {
    const parts: string[] = []
    if (sickness > 0) parts.push(`${sickness} sickness`)
    if (injuries > 0) parts.push(`${injuries} injur${injuries === 1 ? 'y' : 'ies'}`)
    healthDetail = parts.join(' · ')
  }

  return {
    growth: growthInMonth.length,
    milestones: milestonesInMonth.length,
    sickness,
    injuries,
    health: sickness + injuries,
    growthDetail,
    milestoneDetail,
    healthDetail,
  }
}
