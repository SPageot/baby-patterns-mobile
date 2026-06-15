import type { ComponentProps } from 'react'

import { TrackLogSection } from './TrackLogSection'

type Props = Omit<ComponentProps<typeof TrackLogSection>, 'kind'>

export function DiaperLogSection(props: Props) {
  return <TrackLogSection kind="diaper" {...props} />
}
