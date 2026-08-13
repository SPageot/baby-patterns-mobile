import type { OnboardingStep } from '@/content/onboardingTour'

type Listener = () => void

let activeStep: OnboardingStep | null = null
let tourRunning = false
const listeners = new Set<Listener>()

export function setTourSession(running: boolean, step: OnboardingStep | null): void {
  tourRunning = running
  activeStep = step
  listeners.forEach((l) => l())
}

export function isTourRunning(): boolean {
  return tourRunning
}

export function getActiveTourStep(): OnboardingStep | null {
  return activeStep
}

export function subscribeTourSession(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isActiveTourTarget(id: string): boolean {
  if (!tourRunning || !activeStep) return false
  if (activeStep.preferAlternateIfVisible && activeStep.alternateTargetId === id) {
    return true
  }
  return activeStep.targetId === id || activeStep.alternateTargetId === id
}
