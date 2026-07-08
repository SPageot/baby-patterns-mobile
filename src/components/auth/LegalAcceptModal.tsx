import { useCallback, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'

import { acceptLegalPolicies } from '@/api/authApi'
import { Button } from '@/components/ui/primitives'
import { HomeRadius } from '@/constants/homeTheme'
import { Spacing } from '@/constants/theme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { LEGAL_POLICY_VERSION, userNeedsLegalAcceptance } from '@/lib/legalContent'

const createStyles = (t: ReturnType<typeof useHomeTheme>) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    padding: Spacing.three,
  },
  card: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    ...heading(22, { weight: '700' }),
    color: t.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: t.textMuted,
  },
  legalRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: t.stroke,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: t.accentDeep,
    borderColor: t.accentDeep,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  legalText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: t.text,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '600' as const,
  },
  error: {
    color: '#c45c7a',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
})

export function LegalAcceptModal() {
  const { user, setUser, logout, authReady } = useApp()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = authReady && Boolean(user) && userNeedsLegalAcceptance(user?.legalPolicyVersion)

  const onAccept = useCallback(async () => {
    if (!accepted || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await acceptLegalPolicies({
        acceptTerms: true,
        acceptPrivacy: true,
        policyVersion: LEGAL_POLICY_VERSION,
      })
      if (user) {
        setUser({ ...user, legalPolicyVersion: LEGAL_POLICY_VERSION })
      }
      setAccepted(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save acceptance')
    } finally {
      setSubmitting(false)
    }
  }, [accepted, submitting, setUser, user])

  const openLink = (path: '/terms' | '/privacy') => {
    router.push(path)
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Updated Terms and Privacy Policy</Text>
          <Text style={styles.body}>
            We updated our Terms of Use and Privacy Policy to reflect how Baby Pattern works today,
            including health and pediatrician tracking, reports, notifications, and Pro features.
            Please review and accept to continue using your account.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={styles.legalRow}
            onPress={() => {
              setAccepted((prev) => !prev)
              setError(null)
            }}
            disabled={submitting}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.legalText}>
              I agree to the{' '}
              <Text style={styles.link} onPress={() => openLink('/terms')}>
                Terms of Use
              </Text>{' '}
              and{' '}
              <Text style={styles.link} onPress={() => openLink('/privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>

          <View style={styles.actions}>
            <Button
              title="Sign out"
              variant="secondary"
              disabled={submitting}
              onPress={() => void logout()}
              style={{ flex: 1 }}
            />
            <Button
              title={submitting ? 'Saving…' : 'Accept and continue'}
              disabled={!accepted || submitting}
              onPress={() => void onAccept()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
