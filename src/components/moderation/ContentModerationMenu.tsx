import { useState } from 'react'
import { Alert, Pressable, Text } from 'react-native'

import { ReportContentModal } from '@/components/moderation/ReportContentModal'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useModeration } from '@/context/ModerationContext'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import type { ModerationContentType } from '@/schemas/moderation'

const createStyles = (t: AppPalette) => ({
  button: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.textMuted,
    lineHeight: 20,
  },
})

type Props = {
  contentType: ModerationContentType
  contentId: string
  authorId: string
  authorName: string
  isMine?: boolean
  enabled?: boolean
}

export function ContentModerationMenu({
  contentType,
  contentId,
  authorId,
  authorName,
  isMine = false,
  enabled = true,
}: Props) {
  const styles = useThemedStyles(createStyles)
  const confirm = useConfirmAction()
  const { blockUser, reportContent } = useModeration()
  const [reportOpen, setReportOpen] = useState(false)

  if (!enabled || isMine || !authorId || !contentId) {
    return null
  }

  const openMenu = () => {
    Alert.alert('Content options', undefined, [
      { text: 'Report', onPress: () => setReportOpen(true) },
      {
        text: `Block ${authorName}`,
        style: 'destructive',
        onPress: () => {
          confirm({
            title: `Block ${authorName}?`,
            message:
              'You will no longer see their posts, comments, sticky notes, or reviews. They will not be notified.',
            confirmLabel: 'Block',
            destructive: true,
            onConfirm: async () => {
              await blockUser(authorId)
            },
          })
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <>
      <Pressable
        onPress={openMenu}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Content options"
        hitSlop={8}
      >
        <Text style={styles.label}>⋯</Text>
      </Pressable>
      <ReportContentModal
        open={reportOpen}
        contentType={contentType}
        contentId={contentId}
        onClose={() => setReportOpen(false)}
        onSubmit={reportContent}
      />
    </>
  )
}
