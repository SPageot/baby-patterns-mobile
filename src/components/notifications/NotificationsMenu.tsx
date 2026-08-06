import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { NavIcon } from '@/components/icons/NavIcon'
import { LoadingState } from '@/components/ui/Loading'
import { useNotifications } from '@/hooks/useNotifications'
import { useConfirmAction } from '@/context/ConfirmContext'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'
import type { AppNotification } from '@/schemas/notification'
import { notificationRoute } from '@/schemas/notification'

type Props = {
  enabled: boolean
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const createStyles = (t: AppPalette) => ({
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.stroke,
    borderRadius: 12,
    backgroundColor: t.card,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: t.error,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end' as const,
  },
  panel: {
    maxHeight: 480,
    borderTopLeftRadius: HomeRadius.lg,
    borderTopRightRadius: HomeRadius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: t.stroke,
    backgroundColor: t.card,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: t.text,
  },
  actions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'flex-end' as const,
    flexShrink: 1,
  },
  action: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.accentDeep,
  },
  actionDanger: {
    color: t.error,
  },
  status: {
    fontSize: 14,
    color: t.textMuted,
    paddingVertical: Spacing.two,
  },
  list: {
    gap: 8,
    paddingBottom: Spacing.two,
  },
  item: {
    padding: 14,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  itemUnread: {
    borderColor: t.accentLavender,
    backgroundColor: t.accentSoft,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: t.text,
    fontWeight: '500' as const,
  },
  time: {
    marginTop: 6,
    fontSize: 12,
    color: t.textMuted,
  },
  pressed: {
    opacity: 0.82,
  },
})

export function NotificationsMenu({ enabled }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const confirm = useConfirmAction()
  const { items, unreadCount, loading, clearing, open, setOpen, markRead, markAllRead, clearAll } =
    useNotifications(enabled)

  const onClearAll = () => {
    confirm({
      title: t('notifications.clearAllConfirm'),
      message: t('notifications.clearAllConfirmBody'),
      confirmLabel: t('notifications.clearAll'),
      onConfirm: () => clearAll(),
    })
  }

  const onSelect = (item: AppNotification) => {
    void markRead(item.id)
    setOpen(false)
    router.push(notificationRoute(item.type) as Parameters<typeof router.push>[0])
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0 ? `${unreadCount} unread notifications` : t('notifications.title')
        }
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.bellBtn, pressed && styles.pressed]}
      >
        <NavIcon name="bell" size={20} color={colors.text} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.panel, { paddingBottom: insets.bottom + Spacing.two }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.head}>
              <Text style={styles.title}>{t('notifications.title')}</Text>
              {(unreadCount > 0 || items.length > 0) && (
                <View style={styles.actions}>
                  {unreadCount > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={clearing}
                      onPress={() => void markAllRead()}
                      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                    >
                      <Text style={styles.actionText}>Mark all read</Text>
                    </Pressable>
                  ) : null}
                  {items.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={clearing}
                      onPress={onClearAll}
                      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                    >
                      <Text style={[styles.actionText, styles.actionDanger]}>
                        {clearing ? t('common.loading') : t('notifications.clearAll')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </View>

            {loading ? <LoadingState label="Loading…" size="sm" inline compact /> : null}
            {!loading && items.length === 0 ? (
              <Text style={styles.status}>{t('notifications.empty')}</Text>
            ) : null}

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.item,
                    !item.isRead && styles.itemUnread,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{formatWhen(item.createdAt)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
