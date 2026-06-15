import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  accentColor: string
  accentBorder: string
  accentSoft: string
  children: ReactNode
}

const createStyles = (t: AppPalette) => ({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 56, 0.45)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  panel: {
    width: '100%' as const,
    flex: 1,
    maxHeight: '100%' as const,
    backgroundColor: t.card,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    overflow: 'hidden' as const,
  },
  panelAccent: {
    height: 3,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card2,
    marginLeft: 12,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    color: t.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
})

export function TrackLogModalShell({
  open,
  onClose,
  title,
  accentColor,
  accentBorder,
  accentSoft,
  children,
}: Props) {
  const styles = useThemedStyles(createStyles)

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
          <View style={styles.panel}>
            <View style={[styles.panelAccent, { backgroundColor: accentColor }]} />
            <View style={[styles.header, { borderBottomColor: accentBorder, backgroundColor: accentSoft }]}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
