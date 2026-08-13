import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { PinProblemModal } from '@/components/solutionBoard/PinProblemModal'
import { PinSolutionModal } from '@/components/solutionBoard/PinSolutionModal'
import { Button, ErrorText } from '@/components/ui/primitives'
import { PageLoadingScreen } from '@/components/ui/Loading'
import { isApiConfigured } from '@/api/config'
import { useApp } from '@/context/AppContext'
import { useConfirmAction } from '@/context/ConfirmContext'
import { useModeration } from '@/context/ModerationContext'
import { useParentSolutionBoard } from '@/hooks/useParentSolutionBoard'
import {
  PARENT_PROBLEM_CATEGORIES,
  type ParentProblem,
} from '@/schemas/parentSolutionBoard'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.two,
  },
  hero: {
    marginBottom: Spacing.three,
    alignItems: 'flex-start' as const,
  },
  eyebrow: {
    alignSelf: 'flex-start' as const,
    color: t.accentDeep,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card2,
  },
  title: {
    ...heading(32, { weight: '700' }),
    color: t.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  toolbar: {
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  joinText: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  joinActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  chips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: Spacing.three,
  },
  chip: {
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: t.accentSoft,
    borderColor: t.accentLavender,
  },
  chipText: {
    fontSize: 13,
    color: t.text,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    color: t.accentDeep,
    fontWeight: '700' as const,
  },
  panel: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.stroke,
    backgroundColor: t.card2,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  carousel: {
    gap: Spacing.two,
  },
  navRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.stroke,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  navBtnText: {
    fontSize: 26,
    lineHeight: 30,
    color: t.text,
  },
  empty: {
    backgroundColor: t.card,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    padding: Spacing.four,
    alignItems: 'center' as const,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  card: {
    backgroundColor: t.card,
    borderRadius: HomeRadius.lg,
    borderWidth: 1,
    borderColor: t.stroke,
    padding: Spacing.three,
    shadowColor: '#644f78',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardSage: {
    backgroundColor: t.mode === 'dark' ? 'rgba(90,140,110,0.12)' : '#eef9f2',
  },
  badges: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden' as const,
    backgroundColor: t.card2,
    color: t.textMuted,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  badgeNew: {
    backgroundColor: t.accentSoft,
    color: t.accentDeep,
    borderColor: t.accentLavender,
  },
  badgeTrending: {
    backgroundColor: t.mode === 'dark' ? 'rgba(199,160,140,0.18)' : '#fff5ee',
    color: t.mode === 'dark' ? '#e1c2b2' : '#9a5a32',
  },
  problemTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  problemBody: {
    fontSize: 15,
    lineHeight: 22,
    color: t.textMuted,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: t.textMuted,
  },
  actions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 14,
  },
  solutionsHeading: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
    marginBottom: 8,
  },
  solutionNote: {
    backgroundColor: t.card2,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    padding: 12,
    marginBottom: 10,
  },
  solutionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: t.text,
    marginBottom: 8,
  },
  solutionFoot: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  counter: {
    textAlign: 'center' as const,
    marginTop: 12,
    color: t.textMuted,
    fontSize: 13,
  },
  status: {
    color: t.textMuted,
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
})

function categoryLabel(category: string, t: (key: string, opts?: { defaultValue?: string }) => string) {
  const found = PARENT_PROBLEM_CATEGORIES.find((c) => c.id === category)
  return t(`community.solutionBoard.categories.${category}`, {
    defaultValue: found?.label ?? category,
  })
}

function authorLabel(problem: ParentProblem, t: (key: string) => string) {
  if (problem.isAnonymous || !problem.author) {
    return t('community.solutionBoard.anonymousParent')
  }
  return problem.author.fullName || problem.author.username || t('community.solutionBoard.anonymousParent')
}

export function SolutionBoardScreen() {
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const router = useRouter()
  const { user, authReady } = useApp()
  const confirm = useConfirmAction()
  const { isBlocked } = useModeration()
  const isLoggedIn = Boolean(user?.id)
  const [category, setCategory] = useState('all')
  const [pinProblemOpen, setPinProblemOpen] = useState(false)
  const [pinSolutionOpen, setPinSolutionOpen] = useState(false)
  const board = useParentSolutionBoard(authReady && isApiConfigured(), category)

  const visibleProblems = useMemo(
    () =>
      board.problems.filter((p) => {
        if (!p.author || p.isAnonymous) return true
        return !isBlocked(p.author.id)
      }),
    [board.problems, isBlocked],
  )

  const active =
    board.activeDetail && visibleProblems.some((p) => p.id === board.activeDetail?.id)
      ? board.activeDetail
      : visibleProblems.find((p) => p.id === board.activeId) ?? null

  const activeIndex = active ? visibleProblems.findIndex((p) => p.id === active.id) : -1
  const solutions = (active?.solutions ?? []).filter((s) => !isBlocked(s.author.id))

  useEffect(() => {
    if (visibleProblems.length === 0) return
    if (board.activeId && visibleProblems.some((p) => p.id === board.activeId)) return
    board.setActiveId(visibleProblems[0].id)
  }, [visibleProblems, board.activeId, board.setActiveId])

  const goPrevVisible = useCallback(() => {
    if (visibleProblems.length === 0) return
    const idx = Math.max(0, activeIndex)
    const prev = visibleProblems[(idx - 1 + visibleProblems.length) % visibleProblems.length]
    if (prev) board.setActiveId(prev.id)
  }, [visibleProblems, activeIndex, board.setActiveId])

  const goNextVisible = useCallback(() => {
    if (visibleProblems.length === 0) return
    const idx = Math.max(0, activeIndex)
    const next = visibleProblems[(idx + 1) % visibleProblems.length]
    if (next) board.setActiveId(next.id)
  }, [visibleProblems, activeIndex, board.setActiveId])

  const swipeHandlers = useRef({ goPrevVisible, goNextVisible })
  swipeHandlers.current = { goPrevVisible, goNextVisible }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dx <= -48) swipeHandlers.current.goNextVisible()
          else if (g.dx >= 48) swipeHandlers.current.goPrevVisible()
        },
      }),
    [],
  )

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    action()
  }

  if (!authReady) {
    return <PageLoadingScreen label={t('common.loading')} />
  }

  if (!isApiConfigured()) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.status}>{t('community.solutionBoard.apiMissingMobile')}</Text>
      </ScrollView>
    )
  }

  if (board.loading) {
    return <PageLoadingScreen label={t('common.loading')} />
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('nav.groups.community')}</Text>
        <Text style={styles.title}>{t('community.solutionBoard.title')}</Text>
        <Text style={styles.subtitle}>{t('community.solutionBoard.subtitle')}</Text>
      </View>

      <View style={styles.toolbar}>
        {isLoggedIn ? (
          <Button title={t('community.solutionBoard.pinProblem')} onPress={() => setPinProblemOpen(true)} />
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.joinText}>{t('community.solutionBoard.signInHint')}</Text>
            <View style={styles.joinActions}>
              <Link href="/signup" asChild>
                <Button title={t('community.parentsCorner.signUpToPost')} />
              </Link>
              <Link href="/login" asChild>
                <Button title={t('common.logIn')} variant="secondary" />
              </Link>
            </View>
          </View>
        )}
      </View>

      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, category === 'all' ? styles.chipActive : null]}
          onPress={() => setCategory('all')}
        >
          <Text style={[styles.chipText, category === 'all' ? styles.chipTextActive : null]}>
            {t('community.solutionBoard.allCategories')}
          </Text>
        </Pressable>
        {PARENT_PROBLEM_CATEGORIES.map((c) => {
          const activeChip = category === c.id
          return (
            <Pressable
              key={c.id}
              style={[styles.chip, activeChip ? styles.chipActive : null]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={[styles.chipText, activeChip ? styles.chipTextActive : null]}>
                {categoryLabel(c.id, t)}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {board.error ? <ErrorText>{board.error}</ErrorText> : null}

      {visibleProblems.length === 0 ? (
        <View style={styles.panel}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('community.solutionBoard.empty')}</Text>
            <Text style={styles.emptyBody}>
              {isLoggedIn
                ? t('community.solutionBoard.emptyLoggedIn')
                : t('community.solutionBoard.emptyGuest')}
            </Text>
            {isLoggedIn ? (
              <Button title={t('community.solutionBoard.pinProblem')} onPress={() => setPinProblemOpen(true)} />
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <View style={styles.carousel}>
          <View style={styles.navRow}>
            <Pressable
              style={styles.navBtn}
              onPress={goPrevVisible}
              disabled={visibleProblems.length < 2}
              accessibilityLabel={t('community.solutionBoard.prev')}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </Pressable>
            <Pressable
              style={styles.navBtn}
              onPress={goNextVisible}
              disabled={visibleProblems.length < 2}
              accessibilityLabel={t('community.solutionBoard.next')}
            >
              <Text style={styles.navBtnText}>›</Text>
            </Pressable>
          </View>

          {active ? (
            <View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                active.colorIndex % 2 === 1 ? styles.cardSage : null,
                {
                  transform: [
                    {
                      rotate: `${Math.max(-2.5, Math.min(2.5, active.rotationDeg || -1))}deg`,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.badges}>
                <Text style={styles.badge}>{categoryLabel(active.category, t)}</Text>
                {active.isNew ? (
                  <Text style={[styles.badge, styles.badgeNew]}>{t('community.solutionBoard.badgeNew')}</Text>
                ) : null}
                {active.isTrending ? (
                  <Text style={[styles.badge, styles.badgeTrending]}>
                    {t('community.solutionBoard.badgeTrending')}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.problemTitle}>{active.title}</Text>
              <Text style={styles.problemBody}>{active.description}</Text>

              <View style={styles.meta}>
                <Text style={styles.metaText}>{authorLabel(active, t)}</Text>
                <Text style={styles.metaText}>
                  {t('community.solutionBoard.solutionCount', { count: active.solutionCount })}
                </Text>
              </View>

              <View style={styles.actions}>
                <Button
                  title={`${t('community.solutionBoard.meToo')} · ${active.meTooCount}`}
                  variant={active.meTooByMe ? 'primary' : 'secondary'}
                  onPress={() => requireAuth(() => void board.meToo())}
                />
                <Button
                  title={t('community.solutionBoard.pinSolution')}
                  onPress={() => requireAuth(() => setPinSolutionOpen(true))}
                />
                {active.isMine ? (
                  <Button
                    title={t('common.delete')}
                    variant="ghost"
                    onPress={() =>
                      confirm({
                        title: t('community.solutionBoard.removeProblemTitle'),
                        message: t('community.solutionBoard.removeProblemBody'),
                        onConfirm: async () => {
                          await board.removeProblem(active.id)
                        },
                      })
                    }
                  />
                ) : null}
              </View>

              <Text style={styles.solutionsHeading}>{t('community.solutionBoard.solutionsHeading')}</Text>
              {solutions.length === 0 ? (
                <Text style={styles.emptyBody}>{t('community.solutionBoard.noSolutionsYet')}</Text>
              ) : (
                solutions.map((sol) => (
                  <View
                    key={sol.id}
                    style={[
                      styles.solutionNote,
                      { transform: [{ rotate: `${sol.rotationDeg || 0}deg` }] },
                    ]}
                  >
                    <View style={styles.badges}>
                      {sol.isMostUpvoted ? (
                        <Text style={[styles.badge, styles.badgeTrending]}>
                          {t('community.solutionBoard.mostUpvoted')}
                        </Text>
                      ) : null}
                      {sol.helpedSomeone ? (
                        <Text style={[styles.badge, styles.badgeNew]}>
                          {t('community.solutionBoard.helpedSomeone')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.solutionBody}>{sol.body}</Text>
                    <View style={styles.solutionFoot}>
                      <Text style={styles.metaText}>{sol.author.fullName || sol.author.username}</Text>
                      <View style={styles.actions}>
                        <Button
                          title={`${t('community.solutionBoard.upvote')} · ${sol.upvoteCount}`}
                          variant={sol.upvotedByMe ? 'primary' : 'secondary'}
                          onPress={() => requireAuth(() => void board.upvote(sol.id))}
                        />
                        {sol.isMine ? (
                          <Button
                            title={t('common.delete')}
                            variant="ghost"
                            onPress={() =>
                              confirm({
                                title: t('community.solutionBoard.removeSolutionTitle'),
                                message: t('community.solutionBoard.removeSolutionBody'),
                                onConfirm: async () => {
                                  await board.removeSolution(sol.id)
                                },
                              })
                            }
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {activeIndex >= 0 ? (
            <Text style={styles.counter}>
              {t('community.solutionBoard.counter', {
                current: activeIndex + 1,
                total: visibleProblems.length,
              })}
            </Text>
          ) : null}
          </View>
        </View>
      )}

      <PinProblemModal
        open={pinProblemOpen}
        saving={board.saving}
        onClose={() => setPinProblemOpen(false)}
        onSubmit={board.pinProblem}
      />
      <PinSolutionModal
        open={pinSolutionOpen}
        saving={board.saving}
        onClose={() => setPinSolutionOpen(false)}
        onSubmit={board.pinSolution}
      />
    </ScrollView>
  )
}
