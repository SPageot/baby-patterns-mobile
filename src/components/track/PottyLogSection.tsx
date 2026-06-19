import type { ComponentProps } from 'react'

import { TrackLogSection } from './TrackLogSection'

type Props = Omit<ComponentProps<typeof TrackLogSection>, 'kind'>

export function PottyLogSection(props: Props) {
  return <TrackLogSection kind="potty" {...props} />
}
