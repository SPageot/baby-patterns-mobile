import { forwardRef, useEffect, useImperativeHandle, useRef, type ComponentProps } from 'react'
import { ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'

import { registerTourScrollResponder } from '@/lib/tourScroll'

type Props = ComponentProps<typeof ScrollView>

/** ScrollView that the onboarding tour can scroll so targets stay above the coach. */
export const TourScrollView = forwardRef<ScrollView, Props>(function TourScrollView(
  { onScroll, ...props },
  ref,
) {
  const innerRef = useRef<ScrollView>(null)
  const offsetY = useRef(0)

  useImperativeHandle(ref, () => innerRef.current as ScrollView)

  useEffect(() => {
    return registerTourScrollResponder({
      getOffsetY: () => offsetY.current,
      scrollTo: (y, animated = true) => {
        innerRef.current?.scrollTo({ y, animated })
      },
    })
  }, [])

  return (
    <ScrollView
      {...props}
      ref={innerRef}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        offsetY.current = e.nativeEvent.contentOffset.y
        onScroll?.(e)
      }}
      scrollEventThrottle={props.scrollEventThrottle ?? 16}
    />
  )
})
