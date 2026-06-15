export type ReviewAuthor = {
  id: string
  username: string
  fullName: string
}

export type ProductSummary = {
  id: string
  name: string
  description: string
  category: string
  averageRating: number
  reviewCount: number
  myReviewId: string | null
}

export type Brand = {
  id: string
  name: string
  description: string
  products: ProductSummary[]
}

export type ProductReview = {
  id: string
  productId: string
  rating: number
  content: string
  createdAt: string
  author: ReviewAuthor
  isMine: boolean
}
