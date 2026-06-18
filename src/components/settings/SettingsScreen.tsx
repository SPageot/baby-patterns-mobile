import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { BillingSettingsSection } from '@/components/settings/BillingSettingsSection'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
import { SettingsTabs, isSettingsTabId, type SettingsTabId } from '@/components/settings/SettingsTabs'
import { WeeklySummarySettingsSection } from '@/components/settings/WeeklySummarySettingsSection'
import { HomeButton } from '@/components/home/HomeButton'
import {
  Button,
  Card,
  ErrorText,
  Input,
  Label,
  Screen,
  SectionTitle,
  Subtitle,
} from '@/components/ui/primitives'
import { changePassword } from '@/api/settingsApi'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import type { AppPalette } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
  },
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  links: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: Spacing.three,
    justifyContent: 'center' as const,
  },
  link: {
    color: t.accentDeep,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  gate: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.five,
    gap: 12,
  },
  gateTitle: {
    ...heading(24, { weight: '700' }),
    color: t.text,
  },
  gateText: {
    fontSize: 15,
    color: t.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  gateActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 8,
  },
})

export function SettingsScreen() {
  const router = useRouter()
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  const { user, authReady, logout, setUser } = useApp()
  const styles = useThemedStyles(createStyles)

  const [activeTab, setActiveTab] = useState<SettingsTabId>(() =>
    tab && isSettingsTabId(tab) ? tab : 'password',
  )

  useEffect(() => {
    if (tab && isSettingsTabId(tab)) {
      setActiveTab(tab)
    }
  }, [tab])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const username = user?.username?.trim() ?? ''

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const onSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!isApiConfigured()) {
      setError('Set EXPO_PUBLIC_API_URL in .env to connect to the API.')
      return
    }

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.')
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      resetForm()
      setSuccess('Your password has been updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  const onAccountDeleted = async () => {
    await logout()
    router.replace('/')
  }

  if (!authReady) {
    return (
      <Screen>
        <Subtitle>Loading settings…</Subtitle>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>Settings</Text>
          <Text style={styles.gateText}>Log in to manage your account settings.</Text>
          <View style={styles.gateActions}>
            <HomeButton title="Log in" onPress={() => router.push('/login')} />
            <Button title="Sign up" variant="secondary" onPress={() => router.push('/signup')} />
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen style={{ paddingTop: 0 }}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionTitle>Account settings</SectionTitle>
        <Subtitle>Manage your password, subscription, notifications, and account.</Subtitle>

        <SettingsTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'password' ? (
          <Card>
            <SectionTitle>Change password</SectionTitle>
            <Subtitle>Use a strong password you do not use on other sites.</Subtitle>
            {error ? <ErrorText>{error}</ErrorText> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <Label>Current password</Label>
            <Input secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} editable={!saving} />

            <Label>New password</Label>
            <Input secureTextEntry value={newPassword} onChangeText={setNewPassword} editable={!saving} />

            <Label>Confirm new password</Label>
            <Input secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!saving} />

            <Button title={saving ? 'Updating…' : 'Update password'} disabled={saving} onPress={() => void onSubmit()} />
          </Card>
        ) : null}

        {activeTab === 'subscription' ? (
          <Card>
            <BillingSettingsSection user={user} onUserUpdated={setUser} />
          </Card>
        ) : null}

        {activeTab === 'weekly-summary' ? (
          <Card>
            <WeeklySummarySettingsSection user={user} />
          </Card>
        ) : null}

        {activeTab === 'account' ? (
          <Card>
            <SectionTitle>Delete account</SectionTitle>
            <Subtitle>Permanently remove your account and associated data. This action cannot be undone.</Subtitle>
            <Button title="Delete account" variant="ghost" onPress={() => setDeleteModalOpen(true)} />
          </Card>
        ) : null}

        <View style={styles.links}>
          <Pressable onPress={() => router.push('/profile')}>
            <Text style={styles.link}>Back to profile</Text>
          </Pressable>
          <Text style={styles.link}>·</Text>
          <Pressable onPress={() => router.push('/terms')}>
            <Text style={styles.link}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.link}>·</Text>
          <Pressable onPress={() => router.push('/privacy')}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        userId={user.id}
        username={username}
        onDeleted={onAccountDeleted}
      />
    </Screen>
  )
}
