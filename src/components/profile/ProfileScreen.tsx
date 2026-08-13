import { Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BabyDetailsModal } from '@/components/baby/BabyDetailsModal'
import { FamilyMembersSection } from '@/components/profile/FamilyMembersSection'
import { ProfileActivityCalendar } from '@/components/profile/ProfileActivityCalendar'
import { PostCard } from '@/components/parentsCorner/PostCard'
import { HomeButton } from '@/components/home/HomeButton'
import { NavIcon } from '@/components/icons/NavIcon'
import { TourScrollView } from '@/components/onboarding/TourScrollView'
import { TourTarget } from '@/components/onboarding/TourTarget'
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
import { PageLoadingScreen } from '@/components/ui/Loading'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useProfile } from '@/hooks/useProfile'
import { consumeBillingWelcome, completeBillingReturn } from '@/lib/billingReturn'
import { isOwnPost } from '@/lib/postUtils'
import { isPaidProUser, isProUser, isSiteDeveloper } from '@/lib/subscription'
import type { Baby } from '@/schemas/user'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
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
    ...heading(26, { weight: '700' }),
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
    alignItems: 'stretch' as const,
  },
  statHead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  statPage: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800' as const,
    color: t.text,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: t.text,
    textAlign: 'center' as const,
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
  statAction: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card2,
    alignSelf: 'stretch' as const,
    alignItems: 'center' as const,
  },
  statActionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  statPressed: {
    opacity: 0.85,
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
  welcomePro: {
    marginBottom: Spacing.two,
    padding: 12,
    borderRadius: HomeRadius.lg,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  welcomeProText: {
    color: t.accentDeep,
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  proBadge: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
    textAlign: 'center' as const,
  },
  siteDevBadge: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#0f766e',
    textAlign: 'center' as const,
  },
  babiesHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  monthHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 8,
  },
  monthHeadCopy: {
    flex: 1,
  },
  babyEdit: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  postsHead: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
})

export function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, authReady, loadBabiesForCurrentUser, setUser, addBaby } = useApp()
  const confirm = useConfirmAction()
  const profile = useProfile()
  const colors = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [proWelcome, setProWelcome] = useState(false)
  const [editBaby, setEditBaby] = useState<Baby | null>(null)
  const isPro = isProUser(user)
  const isSiteDev = isSiteDeveloper(user)
  const isPaidPro = isPaidProUser(user)

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void loadBabiesForCurrentUser()
    }, [loadBabiesForCurrentUser, user?.id]),
  )

  useFocusEffect(
    useCallback(() => {
      if (!authReady || !user) return

      void (async () => {
        const welcomed = await consumeBillingWelcome()
        if (welcomed) {
          setProWelcome(true)
          return
        }
        const synced = await completeBillingReturn(setUser)
        if (synced) setProWelcome(true)
      })()
    }, [authReady, setUser, user]),
  )

  if (!authReady || (user && profile.pageLoading)) {
    return <PageLoadingScreen label="Loading profile…" />
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
      <TourScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {profile.profileError ? <ErrorText>{profile.profileError}</ErrorText> : null}

        {proWelcome && isPaidPro ? (
          <View style={styles.welcomePro}>
            <Text style={styles.welcomeProText}>Welcome to Baby Pattern Pro! Your account is upgraded.</Text>
          </View>
        ) : null}

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
          {isSiteDev ? (
            <Text style={styles.siteDevBadge}>Site developer</Text>
          ) : isPaidPro ? (
            <Text style={styles.proBadge}>Pro member</Text>
          ) : null}

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

        <TourTarget id="profile-this-month">
        <Card>
          <View style={styles.monthHead}>
            <View style={styles.monthHeadCopy}>
              <SectionTitle>This month</SectionTitle>
              <Subtitle>{profile.currentMonthLabel()} across all your babies</Subtitle>
            </View>
            {profile.apiConfigured && profile.babies.length > 0 ? (
              profile.isPro ? (
                <Button
                  title={profile.exportingPdf ? 'Preparing…' : 'Download PDF'}
                  variant="secondary"
                  disabled={profile.exportingPdf}
                  onPress={() => void profile.downloadTrackingPdf()}
                />
              ) : (
                <Button
                  title="Upgrade for PDF"
                  variant="secondary"
                  onPress={() => router.push('/pricing')}
                />
              )
            ) : null}
          </View>

          {profile.babies.length === 0 ? (
            <>
              <Subtitle>Add a baby to start tracking diapers, sleep, feeding, growth, milestones, and health.</Subtitle>
              <Button title="Add a baby" onPress={() => router.push('/add-baby')} />
            </>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="diaper" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.diapers')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthStats.diapers}</Text>
                <Text style={styles.statAvg}>{profile.formatAvgPerDay(profile.monthAverages.diapers)} avg / day</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open diapers"
                  onPress={() => router.push('/diapers')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="moon" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.sleep')}</Text>
                </View>
                <Text style={styles.statValue}>
                  {profile.formatSleepDurationShort(profile.monthSleepStats.totalMinutes)}
                </Text>
                <Text style={styles.statAvg}>
                  {profile.formatSleepDurationShort(profile.monthSleepStats.avgMinutesPerDay)} avg / day
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open sleep"
                  onPress={() => router.push('/sleep')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="bottle" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.feeding')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthStats.feeding}</Text>
                <Text style={styles.statAvg}>{profile.formatAvgPerDay(profile.monthAverages.feeding)} avg / day</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open feeding"
                  onPress={() => router.push('/feeding')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="potty" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.potty')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthStats.potty}</Text>
                <Text style={styles.statAvg}>{profile.formatAvgPerDay(profile.monthAverages.potty)} avg / day</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open potty"
                  onPress={() => router.push('/potty')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="growth" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.growth')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthExtendedStats.growth}</Text>
                <Text style={styles.statAvg}>{profile.monthExtendedStats.growthDetail}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open growth"
                  onPress={() => router.push('/growth')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="star" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.growth')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthExtendedStats.milestones}</Text>
                <Text style={styles.statAvg}>{profile.monthExtendedStats.milestoneDetail}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open milestones"
                  onPress={() => router.push('/growth')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
              <View style={styles.stat}>
                <View style={styles.statHead}>
                  <NavIcon name="health" size={18} color={colors.text} />
                  <Text style={styles.statPage}>{t('profile.pages.health')}</Text>
                </View>
                <Text style={styles.statValue}>{profile.monthExtendedStats.health}</Text>
                <Text style={styles.statAvg}>{profile.monthExtendedStats.healthDetail}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open health"
                  onPress={() => router.push('/health')}
                  style={({ pressed }) => [styles.statAction, pressed && styles.statPressed]}
                >
                  <Text style={styles.statActionText}>{t('common.open')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {profile.babies.length > 0 ? (
            <ProfileActivityCalendar
              logs={profile.allLogs}
              injuries={profile.injuryRows}
              pediatricianVisits={profile.pediatricianRows}
            />
          ) : null}
        </Card>
        </TourTarget>

        <Card>
          <View style={styles.babiesHead}>
            <SectionTitle>Your babies</SectionTitle>
            <TourTarget id="profile-add-baby-btn">
              <Button title="Add baby" variant="ghost" onPress={() => router.push('/add-baby')} />
            </TourTarget>
          </View>
          {profile.babies.length === 0 ? (
            <Subtitle>No babies yet.</Subtitle>
          ) : (
            profile.babies.map((baby) => (
              <View key={baby.id} style={styles.babyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.babyName}>{baby.fullName}</Text>
                  {baby.isShared && baby.sharedFromUsername ? (
                    <Text style={styles.babyShared}>From @{baby.sharedFromUsername}</Text>
                  ) : null}
                  {baby.birthdate ? <Text style={styles.babyMeta}>Born {baby.birthdate}</Text> : null}
                  {baby.currentLocation?.trim() ? (
                    <Text style={styles.babyMeta}>{baby.currentLocation.trim()}</Text>
                  ) : null}
                </View>
                {profile.apiConfigured && !baby.isShared ? (
                  <TourTarget id="edit-baby-btn">
                    <Pressable onPress={() => setEditBaby(baby)}>
                      <Text style={styles.babyEdit}>Edit profile</Text>
                    </Pressable>
                  </TourTarget>
                ) : null}
              </View>
            ))
          )}
        </Card>

        <Card>
          <View style={styles.postsHead}>
            <SectionTitle>Parents Corner posts</SectionTitle>
            <Button title="Go to feed" variant="ghost" onPress={() => router.push('/parents-corner')} />
          </View>
          {!profile.apiConfigured ? (
            <Subtitle>Connect the API to view your posts.</Subtitle>
          ) : profile.posts.length === 0 ? (
            <>
              <Subtitle>You haven&apos;t shared anything in Parents Corner yet.</Subtitle>
              <Button title="Write a post" onPress={() => router.push('/parents-corner')} />
            </>
          ) : (
            profile.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                comments={profile.commentsByPost[post.id] ?? []}
                commentsOpen={Boolean(profile.commentsOpen[post.id])}
                commentsLoading={Boolean(profile.commentsLoading[post.id])}
                canEdit={isOwnPost(post, user.id)}
                canDelete={isOwnPost(post, user.id)}
                editing={profile.editingPostId === post.id}
                saving={profile.savingPostId === post.id}
                onLike={() => void profile.likePost(post.id)}
                onToggleComments={() => void profile.toggleComments(post.id)}
                onComment={(content) => profile.submitComment(post.id, content)}
                onLikeComment={(commentId) => void profile.likeComment(post.id, commentId)}
                onEdit={() => profile.setEditingPostId(post.id)}
                onCancelEdit={() => profile.setEditingPostId(null)}
                onSaveEdit={(input) => profile.savePostEdit(post.id, input)}
                onDelete={() => {
                  confirm({
                    title: 'Delete post?',
                    message: 'This post and its comments will be removed. This cannot be undone.',
                    onConfirm: () => profile.removePost(post.id),
                  })
                }}
                isSiteDeveloper={isSiteDev}
              />
            ))
          )}
        </Card>

        <Card>
          <FamilyMembersSection enabled={profile.apiConfigured && Boolean(user.id)} user={user} />
        </Card>
      </TourScrollView>

      <BabyDetailsModal
        baby={editBaby}
        open={editBaby != null}
        canEdit
        startInEditMode
        onBabyUpdated={(updated) => {
          addBaby(updated)
          setEditBaby(updated)
        }}
        onClose={() => setEditBaby(null)}
      />
    </Screen>
  )
}
