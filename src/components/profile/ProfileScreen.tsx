import { Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'

import { FamilyMembersSection } from '@/components/profile/FamilyMembersSection'
import { HomeButton } from '@/components/home/HomeButton'
import { NavIcon } from '@/components/icons/NavIcon'
import { UserAvatar } from '@/components/ui/UserAvatar'
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
import { useApp } from '@/context/AppContext'
import { useProfile } from '@/hooks/useProfile'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
  },
  hero: {
    alignItems: 'center' as const,
    marginBottom: Spacing.three,
  },
  avatarActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: t.text,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  username: {
    fontSize: 14,
    color: t.textMuted,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  settingsLink: {
    marginTop: 12,
  },
  settingsLinkText: {
    color: t.accentDeep,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: Spacing.two,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '30%' as const,
    minWidth: 96,
    padding: 14,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: t.text,
  },
  statLabel: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  statAvg: {
    fontSize: 11,
    color: t.textMuted,
    marginTop: 6,
    textAlign: 'center' as const,
  },
  babyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.strokeSubtle,
  },
  babyName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: t.text,
  },
  babyShared: {
    fontSize: 12,
    color: t.accentDeep,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  babyMeta: {
    fontSize: 12,
    color: t.textMuted,
    marginTop: 2,
  },
  gate: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.five,
    gap: 12,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
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
  babiesHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
})

export function ProfileScreen() {
  const router = useRouter()
  const { user, authReady, loadBabiesForCurrentUser } = useApp()
  const profile = useProfile()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void loadBabiesForCurrentUser()
    }, [loadBabiesForCurrentUser, user?.id]),
  )

  if (!authReady) {
    return (
      <Screen>
        <Subtitle>Loading profile…</Subtitle>
      </Screen>
    )
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>Your profile</Text>
          <Text style={styles.gateText}>Log in to manage your photo, location, babies, and family sharing.</Text>
          <View style={styles.gateActions}>
            <HomeButton title="Log in" onPress={() => router.push('/login')} />
            <Button title="Sign up" variant="secondary" onPress={() => router.push('/signup')} />
          </View>
        </View>
      </Screen>
    )
  }

  const displayName = user?.fullName?.trim() || user?.username || 'Parent'
  const username = user?.username?.trim()
  const hasAvatar = Boolean(user?.avatarUrl?.trim())
  const avatarBusy = profile.uploadingAvatar || profile.deletingAvatar

  return (
    <Screen style={{ paddingTop: 0 }}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {profile.profileError ? <ErrorText>{profile.profileError}</ErrorText> : null}

        <View style={styles.hero}>
          <UserAvatar user={user} size="lg" />
          {profile.apiConfigured ? (
            <View style={styles.avatarActions}>
              <Button
                title={profile.uploadingAvatar ? 'Uploading…' : 'Change photo'}
                variant="secondary"
                disabled={avatarBusy}
                onPress={() => void profile.pickAvatar()}
              />
              {hasAvatar ? (
                <Button
                  title={profile.deletingAvatar ? 'Removing…' : 'Remove photo'}
                  variant="ghost"
                  disabled={avatarBusy}
                  onPress={() => void profile.removeAvatar()}
                />
              ) : null}
            </View>
          ) : null}

          <Text style={styles.name}>{displayName}</Text>
          {username ? <Text style={styles.username}>@{username}</Text> : null}

          <Pressable accessibilityRole="link" onPress={() => router.push('/settings')} style={styles.settingsLink}>
            <Text style={styles.settingsLinkText}>Account settings</Text>
          </Pressable>
        </View>

        <Card>
          <SectionTitle>Location</SectionTitle>
          <Label>City, state or region</Label>
          <Input
            value={profile.locationDraft}
            onChangeText={profile.setLocationDraft}
            placeholder="City, state or region"
            editable={profile.apiConfigured && !profile.savingLocation}
          />
          {profile.apiConfigured ? (
            <Button
              title={profile.savingLocation ? 'Saving…' : 'Save location'}
              variant="secondary"
              disabled={profile.savingLocation}
              onPress={() => void profile.saveLocation()}
            />
          ) : null}
        </Card>

        <Card>
          <SectionTitle>This month</SectionTitle>
          <Subtitle>{profile.currentMonthLabel()} across all your babies</Subtitle>

          {profile.statsLoading ? (
            <Subtitle>Loading activity…</Subtitle>
          ) : profile.babies.length === 0 ? (
            <>
              <Subtitle>Add a baby to start tracking diapers, sleep, and feeding.</Subtitle>
              <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
            </>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <NavIcon name="diaper" size={18} color={colors.text} />
                <Text style={styles.statValue}>{profile.monthStats.diapers}</Text>
                <Text style={styles.statLabel}>Diapers</Text>
                <Text style={styles.statAvg}>{profile.formatAvgPerDay(profile.monthAverages.diapers)} avg / day</Text>
              </View>
              <View style={styles.stat}>
                <NavIcon name="moon" size={18} color={colors.text} />
                <Text style={styles.statValue}>{profile.monthStats.sleep}</Text>
                <Text style={styles.statLabel}>Sleep logs</Text>
                <Text style={styles.statAvg}>
                  {profile.formatSleepDurationShort(profile.monthSleepStats.avgMinutesPerDay)} avg / day
                </Text>
              </View>
              <View style={styles.stat}>
                <NavIcon name="bottle" size={18} color={colors.text} />
                <Text style={styles.statValue}>{profile.monthStats.feeding}</Text>
                <Text style={styles.statLabel}>Feeds</Text>
                <Text style={styles.statAvg}>{profile.formatAvgPerDay(profile.monthAverages.feeding)} avg / day</Text>
              </View>
            </View>
          )}
        </Card>

        <Card>
          <View style={styles.babiesHead}>
            <SectionTitle>Your babies</SectionTitle>
            <Button title="Add baby" variant="ghost" onPress={() => router.push('/add-baby')} />
          </View>
          {profile.babies.length === 0 ? (
            <Subtitle>No babies yet.</Subtitle>
          ) : (
            profile.babies.map((baby) => (
              <View key={baby.id} style={styles.babyRow}>
                <View>
                  <Text style={styles.babyName}>{baby.fullName}</Text>
                  {baby.isShared && baby.sharedFromUsername ? (
                    <Text style={styles.babyShared}>From @{baby.sharedFromUsername}</Text>
                  ) : null}
                  {baby.birthdate ? <Text style={styles.babyMeta}>Born {baby.birthdate}</Text> : null}
                </View>
              </View>
            ))
          )}
        </Card>

        <Card>
          <FamilyMembersSection enabled={profile.apiConfigured && Boolean(user.id)} />
        </Card>
      </ScrollView>
    </Screen>
  )
}
