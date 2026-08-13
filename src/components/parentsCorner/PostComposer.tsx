import { PostEditor } from '@/components/parentsCorner/PostEditor'
import { TourTarget } from '@/components/onboarding/TourTarget'
import type { PostSubmitInput } from '@/schemas/post'

type Props = {
  posting: boolean
  isSiteDeveloper?: boolean
  onPublish: (input: PostSubmitInput) => Promise<void>
}

export function PostComposer({ posting, isSiteDeveloper = false, onPublish }: Props) {
  return (
    <TourTarget id="parents-corner-compose">
      <PostEditor
        isSiteDeveloper={isSiteDeveloper}
        submitting={posting}
        submitLabel="Post"
        onSubmit={onPublish}
      />
    </TourTarget>
  )
}
