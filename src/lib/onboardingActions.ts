type TourActionListener = (name: string) => void

const listeners = new Set<TourActionListener>()

export function emitTourAction(name: string): void {
  listeners.forEach((listener) => listener(name))
}

export function subscribeTourActions(listener: TourActionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
