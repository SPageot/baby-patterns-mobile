import type { jsPDF } from 'jspdf'
import type { Baby } from '@/schemas/user'
import type { LogRecord } from '@/types/babyLog'
import { buildDiaperPdfContent } from './diaperPdfContent'
import { appendDiaperReportPages } from './diaperReportPdf'
import { buildFeedingPdfContent } from './feedingPdfContent'
import { appendFeedingReportPages } from './feedingReportPdf'
import { buildPottyPdfContent } from './pottyPdfContent'
import { appendPottyReportPages } from './pottyReportPdf'
import { filterLogsForKindReport, type ReportRange } from './reportAnalytics'
import { buildSleepPdfContent } from './sleepPdfContent'
import { appendSleepReportPages } from './sleepReportPdf'

export function appendTrackWeeklyLogSections(
  doc: jsPDF,
  logs: LogRecord[],
  babies: Baby[],
  caregiverName: string,
  rangeDays: ReportRange,
): void {
  const sleepContent = buildSleepPdfContent(
    filterLogsForKindReport(logs, 'sleep', rangeDays),
    babies,
    '',
    caregiverName,
  )
  appendSleepReportPages(doc, sleepContent)

  const diaperContent = buildDiaperPdfContent(
    filterLogsForKindReport(logs, 'diaper', rangeDays),
    babies,
    '',
    caregiverName,
  )
  appendDiaperReportPages(doc, diaperContent, { continueDocument: true })

  const feedingContent = buildFeedingPdfContent(
    filterLogsForKindReport(logs, 'feeding', rangeDays),
    babies,
    '',
    caregiverName,
  )
  appendFeedingReportPages(doc, feedingContent, { continueDocument: true })

  const pottyContent = buildPottyPdfContent(
    filterLogsForKindReport(logs, 'potty', rangeDays),
    babies,
    '',
    caregiverName,
  )
  appendPottyReportPages(doc, pottyContent, { continueDocument: true })
}
