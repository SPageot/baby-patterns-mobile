export type PostAuthor = {
  id: string
  username: string
  fullName: string
  avatarUrl?: string
  isPro?: boolean
  isSiteDeveloper?: boolean
}

export type PostMedia = {
  id: string
  url: string
  mediaType: 'image' | 'video'
}

export type PostBadge =
  | 'advice'
  | 'recommendation'
  | 'question'
  | 'milestone'
  | 'celebration'
  | 'tip'
  | 'site-error'

export type PostLinkPreview = {
  id: string
  url: string
  title: string
  description: string
  imageUrl: string
  siteName: string
}

export type Post = {
  id: string
  content: string
  badge: PostBadge | null
  customBadge: string | null
  createdAt: string
  updatedAt: string | null
  author: PostAuthor
  media: PostMedia[]
  linkPreviews: PostLinkPreview[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export type PostComment = {
  id: string
  content: string
  createdAt: string
  author: PostAuthor
  likeCount: number
  likedByMe: boolean
}

export type PostMediaUpload = {
  uri: string
  name: string
  type: string
}

export type PostSubmitInput = {
  content: string
  badge: PostBadge | null
  customBadge: string | null
  files: PostMediaUpload[]
  removeMediaIds: string[]
}
