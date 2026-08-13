import { useEffect, useRef, useState, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { useHomeTheme } from '@/hooks/useHomeTheme'
import { isActiveTourTarget, subscribeTourSession } from '@/lib/onboardingSession'
import { registerTourTarget } from '@/lib/tourTargetRegistry'

type Props = {
  id: string
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Registers a view for onboarding measure + local highlight ring when active. */
export function TourTarget({ id, children, style }: Props) {
  const ref = useRef<View>(null)
  const colors = useHomeTheme()
  const [active, setActive] = useState(() => isActiveTourTarget(id))

  useEffect(() => subscribeTourSession(() => setActive(isActiveTourTarget(id))), [id])

  useEffect(() => {
    return registerTourTarget(id, () => {
      return new Promise((resolve) => {
        const node = ref.current
        if (!node) {
          resolve(null)
          return
        }
        node.measureInWindow((x, y, width, height) => {
          if (width <= 0 || height <= 0) {
            resolve(null)
            return
          }
          resolve({ top: y, left: x, width, height })
        })
      })
    })
  }, [id])

  return (
    <View
      ref={ref}
      collapsable={false}
      testID={id}
      style={[
        style,
        active
          ? {
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.accentDeep,
              backgroundColor:
                colors.mode === 'light' ? 'rgba(61,107,90,0.08)' : 'rgba(255,255,255,0.06)',
            }
          : null,
      ]}
    >
      {children}
    </View>
  )
}
