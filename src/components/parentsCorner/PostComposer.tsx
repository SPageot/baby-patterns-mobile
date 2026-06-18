import { PostEditor } from '@/components/parentsCorner/PostEditor'
import type { PostSubmitInput } from '@/schemas/post'

type Props = {
  posting: boolean
  isSiteDeveloper?: boolean
  onPublish: (input: PostSubmitInput) => Promise<void>
}

export function PostComposer({ posting, isSiteDeveloper = false, onPublish }: Props) {
  return (
    <PostEditor
      isSiteDeveloper={isSiteDeveloper}
      submitting={posting}
      submitLabel="Post"
      onSubmit={onPublish}
    />
  )
}
