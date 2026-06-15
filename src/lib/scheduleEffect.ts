import { useEffect } from 'react'

/**
 * Run effect work after commit so state updates are not treated as synchronous effect setState.
 */
export function useDeferredEffect(effect: () => void | (() => void), deps: readonly unknown[]) {
  useEffect(() => {
    let cleanup: void | (() => void)
    const id = setTimeout(() => {
      cleanup = effect()
    }, 0)
    return () => {
      clearTimeout(id)
      if (typeof cleanup === 'function') cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies full dep list
  }, deps)
}
