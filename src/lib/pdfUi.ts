import i18n from '@/i18n'

export function pdfT(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(`pdf.${key}`, options))
}
