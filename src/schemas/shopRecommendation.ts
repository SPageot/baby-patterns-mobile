import type { ParentAuthor } from '@/schemas/parentSolutionBoard'

export type ShopRecommendation = {
  id: string
  category: string
  name: string
  purchaseUrl: string
  imageUrl: string
  price: string
  siteName: string
  notes?: string
  submittedBy?: ParentAuthor
  createdAt: string
  isMine: boolean
  averageRating: number
  reviewCount: number
  myReviewId: string | null
}

export type ShopRecommendationReview = {
  id: string
  shopRecommendationId: string
  rating: number
  content: string
  createdAt: string
  author: ParentAuthor
  isMine: boolean
}

export type ShopRecommendationGroup = {
  category: string
  itemCount: number
  items: ShopRecommendation[]
}

export type ShopRecommendationCatalog = {
  groups: ShopRecommendationGroup[]
}

export type CreateShopRecommendationInput = {
  category: string
  name: string
  purchaseUrl: string
  notes?: string
}
