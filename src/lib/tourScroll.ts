type ScrollResponder = {
  getOffsetY: () => number
  scrollTo: (y: number, animated?: boolean) => void
}

let responder: ScrollResponder | null = null

/** Screens with a main ScrollView register here so the tour can bring targets into view. */
export function registerTourScrollResponder(next: ScrollResponder | null): () => void {
  responder = next
  return () => {
    if (responder === next) responder = null
  }
}

/** Scroll so a window-rect target sits in the middle band (coach docks opposite the hole). */
export function scrollTourTargetIntoWindow(
  top: number,
  height: number,
  windowHeight: number,
): void {
  if (!responder) return
  const edge = Math.min(windowHeight * 0.38, 300)
  const safeTop = edge
  const safeBottom = windowHeight - edge
  const bottom = top + height
  const offset = responder.getOffsetY()

  if (top >= safeTop && bottom <= safeBottom) return

  if (bottom > safeBottom) {
    const delta = bottom - safeBottom + 16
    responder.scrollTo(Math.max(0, offset + delta), true)
    return
  }
  if (top < safeTop) {
    const delta = safeTop - top
    responder.scrollTo(Math.max(0, offset - delta), true)
  }
}
