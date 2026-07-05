import { Button } from '@/components/ui/primitives'
import { Spacing } from '@/constants/theme'

type Props = {
  disabled?: boolean
  loading?: boolean
  onPress: () => void
}

export function TrackPdfDownloadButton({ disabled, loading, onPress }: Props) {
  return (
    <Button
      title={loading ? 'Preparing PDF…' : 'Download PDF'}
      variant="secondary"
      onPress={onPress}
      disabled={disabled || loading}
      style={{ marginTop: Spacing.two }}
    />
  )
}
