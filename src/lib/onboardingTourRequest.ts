type TourRequestListener = () => void

const listeners = new Set<TourRequestListener>()

/** Settings (and other UI) can open the tour after the user previously skipped or finished. */
export function requestOnboardingTour(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeOnboardingTourRequest(listener: TourRequestListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
