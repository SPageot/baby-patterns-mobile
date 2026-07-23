import { Linking } from 'react-native'

import { loadDiaperLogsForBabies } from '@/api/diaperApi'
import { loadFeedingLogsForBabies } from '@/api/feedingApi'
import { loadGrowthForBabies } from '@/api/growthApi'
import { loadInjuryForBabies } from '@/api/injuryApi'
import { loadMilestonesForBabies } from '@/api/milestoneApi'
import { loadPediatricianVisitsForBabies } from '@/api/pediatricianApi'
import { loadPottyLogsForBabies } from '@/api/pottyApi'
import { loadSicknessForBabies } from '@/api/sicknessApi'
import { loadSleepLogsForBabies } from '@/api/sleepApi'
import { isApiConfigured } from '@/api/config'
import { recordPdfExportAudit } from '@/api/auditApi'
import type { Baby, User } from '@/schemas/user'
import { isProUser } from '@/lib/subscription'
import {
  attachmentOptionLabel,
  consultantMailtoUrl,
  type ConsultantPdfAttachment,
} from '@/lib/consultantEmailPdf'

type Ctx = {
  user: User | null
  babies: Baby[]
}

function babyRefs(babies: Baby[]) {
  return babies.filter((b) => !b.isShared).map((baby) => ({ id: baby.id, fullName: baby.fullName }))
}

function caregiverName(user: User | null): string {
  return user?.fullName?.trim() || user?.username?.trim() || 'Caregiver'
}

async function openMailto(url: string) {
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) await Linking.openURL(url)
}

export async function sendConsultantEmailWithAttachment(opts: {
  email: string
  consultantName: string
  attachment: ConsultantPdfAttachment
  ctx: Ctx
}): Promise<void> {
  const { email, consultantName, attachment, ctx } = opts
  const mailto = consultantMailtoUrl(email, consultantName, attachmentOptionLabel(attachment))

  if (attachment === 'none') {
    await openMailto(mailto)
    return
  }

  if (!ctx.user) {
    throw new Error('Log in to attach a tracking PDF.')
  }
  if (!isApiConfigured()) {
    throw new Error('API is not configured, so PDFs cannot be generated.')
  }

  const ownBabies = ctx.babies.filter((b) => !b.isShared)
  if (ownBabies.length === 0) {
    throw new Error('Add a baby before attaching a tracking PDF.')
  }

  const refs = babyRefs(ctx.babies)
  const name = caregiverName(ctx.user)

  if (attachment === 'sleep') {
    const logs = await loadSleepLogsForBabies(refs)
    if (!logs.length) throw new Error('Log at least one sleep session before attaching a sleep PDF.')
    const { downloadSleepReportPdf } = await import('@/lib/sleepReportPdf')
    await downloadSleepReportPdf({
      logs,
      babies: ownBabies,
      selectedBabyId: '',
      caregiverName: name,
    })
    return
  }

  if (attachment === 'diaper') {
    const logs = await loadDiaperLogsForBabies(refs)
    if (!logs.length) throw new Error('Log at least one diaper change before attaching a diaper PDF.')
    const { downloadDiaperReportPdf } = await import('@/lib/diaperReportPdf')
    await downloadDiaperReportPdf({
      logs,
      babies: ownBabies,
      selectedBabyId: '',
      caregiverName: name,
    })
    return
  }

  if (attachment === 'feeding') {
    const logs = await loadFeedingLogsForBabies(refs)
    if (!logs.length) throw new Error('Log at least one feeding before attaching a feeding PDF.')
    const { downloadFeedingReportPdf } = await import('@/lib/feedingReportPdf')
    await downloadFeedingReportPdf({
      logs,
      babies: ownBabies,
      selectedBabyId: '',
      caregiverName: name,
    })
    return
  }

  if (attachment === 'potty') {
    const logs = await loadPottyLogsForBabies(refs)
    if (!logs.length) throw new Error('Log at least one potty visit before attaching a potty PDF.')
    const { downloadPottyReportPdf } = await import('@/lib/pottyReportPdf')
    await downloadPottyReportPdf({
      logs,
      babies: ownBabies,
      selectedBabyId: '',
      caregiverName: name,
    })
    return
  }

  if (!isProUser(ctx.user)) {
    throw new Error('Full reports PDF is a Pro feature. Choose a single track PDF, or upgrade to Pro.')
  }

  const [diapers, sleep, feeding, potty, growthRows, milestoneRows, sickness, injuries, pediatricianVisits] =
    await Promise.all([
      loadDiaperLogsForBabies(refs),
      loadSleepLogsForBabies(refs),
      loadFeedingLogsForBabies(refs),
      loadPottyLogsForBabies(refs),
      loadGrowthForBabies(refs),
      loadMilestonesForBabies(refs),
      loadSicknessForBabies(refs),
      loadInjuryForBabies(refs),
      loadPediatricianVisitsForBabies(refs),
    ])

  const logs = [...diapers, ...sleep, ...feeding, ...potty]
  if (!logs.length) {
    throw new Error('Log some tracking data before attaching a full reports PDF.')
  }

  await recordPdfExportAudit({
    source: 'reports',
    rangeDays: 30,
    babyCount: ownBabies.length,
    includeAnalysis: true,
  })

  const { downloadTrackingReportPdf } = await import('@/lib/trackingReportPdf')
  await downloadTrackingReportPdf({
    logs,
    measurements: growthRows,
    milestones: milestoneRows,
    sickness,
    injuries,
    pediatricianVisits,
    babies: ownBabies,
    parentName: name,
    includeAnalysis: true,
    rangeDays: 30,
  })
}
