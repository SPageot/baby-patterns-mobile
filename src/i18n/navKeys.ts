import type { NavGroupId } from '@/lib/navLinks'

const HREF_TO_KEY: Record<string, string> = {
  '/': 'nav.links.home',
  '/diapers': 'nav.links.diapers',
  '/feeding': 'nav.links.feeding',
  '/sleep': 'nav.links.sleep',
  '/potty': 'nav.links.potty',
  '/behavior': 'nav.links.behavior',
  '/growth': 'nav.links.growthMilestones',
  '/health': 'nav.links.healthEvents',
  '/pediatrician': 'nav.links.pediatrician',
  '/reports': 'nav.links.reports',
  '/weekly-summary': 'nav.links.weeklySummary',
  '/daily-memories': 'nav.links.dailyMemories',
  '/parents-corner': 'nav.links.parentsCorner',
  '/solution-board': 'nav.links.solutionBoard',
  '/reviews': 'nav.links.reviews',
  '/consultants': 'nav.links.consultants',
  '/pricing': 'nav.links.pricing',
  '/why': 'nav.links.why',
  '/profile': 'nav.links.profile',
  '/settings': 'nav.links.settings',
}

export function navLinkI18nKey(href: string): string {
  return HREF_TO_KEY[href] ?? href
}

export function navGroupI18nKey(id: NavGroupId): string {
  return `nav.groups.${id}`
}
