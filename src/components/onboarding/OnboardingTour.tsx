import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { usePathname, useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/primitives'
import { getOnboardingSteps, type OnboardingStep } from '@/content/onboardingTour'
import { HomeRadius } from '@/constants/homeTheme'
import { Spacing } from '@/constants/theme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { userNeedsLegalAcceptance } from '@/lib/legalContent'
import { subscribeTourActions } from '@/lib/onboardingActions'
import {
  getOnboardingStatus,
  setOnboardingStatus,
} from '@/lib/onboardingPreference'
import { subscribeOnboardingTourRequest } from '@/lib/onboardingTourRequest'
import { setTourSession } from '@/lib/onboardingSession'
import { isProUser } from '@/lib/subscription'
import { measureTourTarget, type TargetRect } from '@/lib/tourTargetRegistry'
import { scrollTourTargetIntoWindow } from '@/lib/tourScroll'

type Phase = 'idle' | 'offer' | 'tour' | 'skip-hint' | 'complete'

const PAD = 8
const MISSING_SKIP_MS = 4500

function normalizePath(path: string): string {
  return (path.split('?')[0] || '/').replace(/\/$/, '') || '/'
}

async function resolveHole(step: OnboardingStep): Promise<TargetRect | null> {
  if (step.preferAlternateIfVisible && step.alternateTargetId) {
    const alt = await measureTourTarget(step.alternateTargetId)
    if (alt) {
      return {
        top: alt.top - PAD,
        left: alt.left - PAD,
        width: alt.width + PAD * 2,
        height: alt.height + PAD * 2,
      }
    }
  }
  if (step.targetId) {
    const primary = await measureTourTarget(step.targetId)
    if (primary) {
      return {
        top: primary.top - PAD,
        left: primary.left - PAD,
        width: primary.width + PAD * 2,
        height: primary.height + PAD * 2,
      }
    }
  }
  if (step.alternateTargetId) {
    const alt = await measureTourTarget(step.alternateTargetId)
    if (alt) {
      return {
        top: alt.top - PAD,
        left: alt.left - PAD,
        width: alt.width + PAD * 2,
        height: alt.height + PAD * 2,
      }
    }
  }
  return null
}

async function hasTarget(step: OnboardingStep): Promise<boolean> {
  if (step.preferAlternateIfVisible && step.alternateTargetId) {
    if (await measureTourTarget(step.alternateTargetId)) return true
  }
  if (step.targetId && (await measureTourTarget(step.targetId))) return true
  if (step.alternateTargetId && (await measureTourTarget(step.alternateTargetId))) return true
  return false
}

function placeCoachAway(
  hole: TargetRect | null,
  coachH: number,
  winH: number,
): number {
  const margin = 16
  const gap = 14
  const maxTop = Math.max(margin, winH - coachH - margin)
  if (!hole) return maxTop

  const holeCenterY = hole.top + hole.height / 2
  const preferAbove = holeCenterY > winH * 0.42
  const aboveTop = hole.top - gap - coachH
  const belowTop = hole.top + hole.height + gap
  const roomAbove = aboveTop >= margin
  const roomBelow = belowTop + coachH <= winH - margin

  let top: number
  if (preferAbove && roomAbove) top = aboveTop
  else if (!preferAbove && roomBelow) top = belowTop
  else if (roomAbove) top = aboveTop
  else if (roomBelow) top = belowTop
  else top = preferAbove ? margin : maxTop

  const coachBottom = top + coachH
  const overlaps = top < hole.top + hole.height + gap && coachBottom > hole.top - gap
  if (overlaps) top = holeCenterY > winH / 2 ? margin : maxTop

  return Math.max(margin, Math.min(top, maxTop))
}

const createStyles = (t: ReturnType<typeof useHomeTheme>) => ({
  overlayRoot: {
    ...({ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }),
    elevation: 999999,
  },
  dim: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(15,18,24,0.55)',
  },
  hole: {
    position: 'absolute' as const,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: t.accentDeep,
  },
  coach: {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    gap: Spacing.one,
    zIndex: 1000000,
    elevation: 1000000,
    overflow: 'hidden' as const,
  },
  title: {
    ...heading(20, { weight: '700' }),
    color: t.text,
    textAlign: 'center' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  meta: {
    fontSize: 13,
    color: t.textMuted,
    textAlign: 'center' as const,
  },
  progress: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap' as const,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: t.strokeSubtle,
  },
  dotDone: {
    backgroundColor: t.accent,
    opacity: 0.55,
  },
  dotActive: {
    backgroundColor: t.accentDeep,
    width: 16,
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 10,
    marginTop: Spacing.one,
    flexWrap: 'wrap' as const,
  },
  nav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginLeft: 'auto' as const,
  },
  hint: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.accentDeep,
    textAlign: 'right' as const,
  },
  offerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    padding: Spacing.three,
  },
  offerCard: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  offerActions: {
    flexDirection: 'column' as const,
    gap: 10,
  },
})

export function OnboardingTour() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { width: winW, height: winH } = useWindowDimensions()
  const { user, authReady } = useApp()
  const styles = useThemedStyles(createStyles)
  const [phase, setPhase] = useState<Phase>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null)
  const [hole, setHole] = useState<TargetRect | null>(null)
  const [menuOpen, setMenuOpenFlag] = useState(false)
  const [tourIsPro, setTourIsPro] = useState(false)
  const stepsRef = useRef<OnboardingStep[]>([])

  const userId = user?.id?.trim() ?? ''
  const gatesClear =
    authReady && Boolean(userId) && !userNeedsLegalAcceptance(user?.legalPolicyVersion)

  const steps = useMemo(() => {
    if (phase === 'tour' || phase === 'complete') {
      return stepsRef.current.length ? stepsRef.current : getOnboardingSteps(tourIsPro)
    }
    return getOnboardingSteps(isProUser(user))
  }, [phase, tourIsPro, user])

  const step = steps[stepIndex]
  const inTour = phase === 'tour'

  const beginTour = useCallback(() => {
    const pro = isProUser(user)
    setTourIsPro(pro)
    stepsRef.current = getOnboardingSteps(pro)
    setStepIndex(0)
    setPhase('tour')
    if (normalizePath(pathname) !== '/profile') {
      router.push('/profile' as Href)
    }
  }, [user, pathname, router])

  useEffect(() => {
    if (inTour && step) setTourSession(true, step)
    else setTourSession(false, null)
    return () => setTourSession(false, null)
  }, [inTour, step, stepIndex])

  useEffect(() => {
    return subscribeTourActions((name) => {
      if (name === 'menu-open') setMenuOpenFlag(true)
      if (name === 'menu-close') setMenuOpenFlag(false)
    })
  }, [])

  useEffect(() => {
    if (!gatesClear || !userId) {
      if (!userId) {
        setPhase('idle')
        setCheckedUserId(null)
      }
      return
    }
    let cancelled = false
    void (async () => {
      const status = await getOnboardingStatus(userId)
      if (cancelled) return
      if (status != null) {
        setCheckedUserId(userId)
        setPhase((prev) =>
          prev === 'tour' || prev === 'complete' || prev === 'skip-hint' ? prev : 'idle',
        )
        return
      }
      if (checkedUserId === userId) return
      setCheckedUserId(userId)
      setPhase('offer')
      setStepIndex(0)
    })()
    return () => {
      cancelled = true
    }
  }, [gatesClear, userId, checkedUserId])

  useEffect(() => {
    return subscribeOnboardingTourRequest(() => {
      if (!userId) return
      beginTour()
    })
  }, [userId, beginTour])

  const advance = useCallback(() => {
    setStepIndex((i) => {
      const list = stepsRef.current
      return Math.min(list.length - 1, i + 1)
    })
  }, [])

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const persistSkipped = useCallback(async () => {
    if (userId) await setOnboardingStatus(userId, 'skipped')
  }, [userId])

  const persistStarted = useCallback(async () => {
    if (userId) await setOnboardingStatus(userId, 'started')
  }, [userId])

  const persistCompleted = useCallback(async () => {
    if (userId) await setOnboardingStatus(userId, 'completed')
  }, [userId])

  const onSkip = useCallback(() => {
    void persistSkipped().then(() => setPhase('skip-hint'))
  }, [persistSkipped])

  const onStart = useCallback(() => {
    void persistStarted().then(() => beginTour())
  }, [persistStarted, beginTour])

  const onGotIt = useCallback(() => {
    void persistSkipped().then(() => setPhase('idle'))
  }, [persistSkipped])

  const finishAndGo = useCallback(
    (path: '/diapers' | '/profile') => {
      void persistCompleted().then(() => {
        setPhase('idle')
        router.push(path as Href)
      })
    },
    [persistCompleted, router],
  )

  useEffect(() => {
    if (!inTour || !step) {
      setHole(null)
      return
    }
    let cancelled = false
    let scrolledForStep = false
    const tick = () => {
      void resolveHole(step).then((rect) => {
        if (cancelled) return
        setHole(rect)
        if (rect && !scrolledForStep) {
          scrolledForStep = true
          scrollTourTargetIntoWindow(rect.top, rect.height, winH)
        }
      })
    }
    tick()
    const id = setInterval(tick, 250)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [inTour, step, stepIndex, pathname, menuOpen, winH])

  useEffect(() => {
    if (!inTour || !step?.skipIfMissing || !step.targetId) return
    const started = Date.now()
    const id = setInterval(() => {
      void hasTarget(step).then((ok) => {
        if (ok) return
        if (Date.now() - started < MISSING_SKIP_MS) return
        advance()
      })
    }, 400)
    return () => clearInterval(id)
  }, [inTour, step, stepIndex, advance])

  useEffect(() => {
    if (!inTour || !step) return
    const rule = step.advance
    let done = false
    const once = () => {
      if (done) return
      done = true
      advance()
    }

    if (rule.type === 'finish-button' || rule.type === 'next-button') return

    if (rule.type === 'pathname') {
      if (normalizePath(pathname) === normalizePath(rule.path)) once()
      return
    }

    if (rule.type === 'menu-open') {
      if (menuOpen) once()
      return
    }

    if (rule.type === 'click-target') {
      return subscribeTourActions((name) => {
        if (name === `click:${step.targetId}`) once()
      })
    }

    if (rule.type === 'event') {
      return subscribeTourActions((name) => {
        if (name === rule.name) once()
      })
    }
  }, [inTour, step, stepIndex, pathname, menuOpen, advance])

  if (phase === 'offer' || phase === 'skip-hint') {
    const isOffer = phase === 'offer'
    return (
      <Modal visible transparent animationType="fade" onRequestClose={isOffer ? onSkip : onGotIt}>
        <View style={styles.offerOverlay}>
          <View style={styles.offerCard}>
            <Text style={styles.title}>
              {isOffer ? t('onboarding.offer.title') : t('onboarding.skipHint.title')}
            </Text>
            <Text style={styles.body}>
              {isOffer ? t('onboarding.offer.body') : t('onboarding.skipHint.body')}
            </Text>
            <View style={styles.offerActions}>
              {isOffer ? (
                <>
                  <Button title={t('onboarding.offer.skip')} variant="ghost" onPress={onSkip} />
                  <Button title={t('onboarding.offer.start')} onPress={onStart} />
                </>
              ) : (
                <Button title={t('onboarding.skipHint.gotIt')} onPress={onGotIt} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  if (phase === 'complete') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.offerOverlay}>
          <View style={styles.offerCard}>
            <Text style={styles.title}>{t('onboarding.complete.title')}</Text>
            <Text style={styles.body}>
              {t(tourIsPro ? 'onboarding.complete.bodyPro' : 'onboarding.complete.bodyFree')}
            </Text>
            <View style={styles.offerActions}>
              <Button
                title={t('onboarding.complete.startTracking')}
                onPress={() => finishAndGo('/diapers')}
              />
              <Button
                title={t('onboarding.complete.explore')}
                variant="ghost"
                onPress={() => finishAndGo('/profile')}
              />
              <Button
                title={t('onboarding.complete.restart')}
                variant="ghost"
                onPress={() => {
                  setStepIndex(0)
                  setPhase('tour')
                }}
              />
              <Button
                title={t('onboarding.complete.dontShow')}
                variant="ghost"
                onPress={() => finishAndGo('/profile')}
              />
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  if (phase !== 'tour' || !step) return null

  const isLast = step.advance.type === 'finish-button'
  const needsNext = step.advance.type === 'next-button'
  const coachMaxH = Math.min(winH * 0.36, 300)
  const coachTop = placeCoachAway(hole, coachMaxH, winH)

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      {hole ? (
        <>
          <View
            style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.dim,
              { top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.dim,
              {
                top: hole.top,
                left: hole.left + hole.width,
                width: Math.max(0, winW - (hole.left + hole.width)),
                height: hole.height,
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.dim,
              {
                top: hole.top + hole.height,
                left: 0,
                right: 0,
                height: Math.max(0, winH - (hole.top + hole.height)),
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.hole,
              { top: hole.top, left: hole.left, width: hole.width, height: hole.height },
            ]}
            pointerEvents="none"
          />
        </>
      ) : (
        <View style={[styles.dim, { top: 0, left: 0, right: 0, bottom: 0 }]} pointerEvents="none" />
      )}

      <View
        style={[
          styles.coach,
          {
            top: coachTop,
            bottom: undefined,
            maxHeight: coachMaxH,
          },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View
              key={`${s.id}-${i}`}
              style={[
                styles.dot,
                i < stepIndex ? styles.dotDone : null,
                i === stepIndex ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
        <Text style={styles.meta}>
          {t('onboarding.tour.stepOf', {
            current: stepIndex + 1,
            total: steps.length,
          })}
        </Text>
        <Text style={styles.title}>{t(`onboarding.steps.${step.id}.title`)}</Text>
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.body}>{t(`onboarding.steps.${step.id}.body`)}</Text>
        </ScrollView>
        <View style={styles.actions}>
          <Button title={t('onboarding.tour.skip')} variant="ghost" onPress={onSkip} />
          <View style={styles.nav}>
            {stepIndex > 0 ? (
              <Button title={t('onboarding.tour.back')} variant="ghost" onPress={goBack} />
            ) : null}
            {isLast ? (
              <Button title={t('onboarding.tour.finish')} onPress={() => setPhase('complete')} />
            ) : needsNext ? (
              <Button title={t('onboarding.tour.next')} onPress={advance} />
            ) : (
              <Text style={styles.hint}>{t('onboarding.tour.doAction')}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
