import { apiFetch } from './client'
import type { ParentAuthor } from '@/schemas/parentSolutionBoard'
import type {
  CreateShopRecommendationInput,
  ShopRecommendation,
  ShopRecommendationCatalog,
  ShopRecommendationGroup,
  ShopRecommendationReview,
} from '@/schemas/shopRecommendation'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return ''
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'boolean') return v
    if (v === 'true') return true
    if (v === 'false') return false
  }
  return false
}

function pickNullableStr(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') return null
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return null
}

function normalizeAuthor(raw: unknown): ParentAuthor | null {
  if (raw == null) return null
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const avatarRaw = pickStr(o, 'avatarUrl', 'AvatarUrl')
  return {
    id,
    username: pickStr(o, 'username', 'Username'),
    fullName: pickStr(o, 'fullName', 'FullName'),
    avatarUrl: avatarRaw || undefined,
    isPro: pickBool(o, 'isPro', 'IsPro'),
    isSiteDeveloper: pickBool(o, 'isSiteDeveloper', 'IsSiteDeveloper'),
  }
}

function normalizeItem(raw: unknown): ShopRecommendation | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const purchaseUrl = pickStr(o, 'purchaseUrl', 'PurchaseUrl')
  const name = pickStr(o, 'name', 'Name')
  if (!id || !purchaseUrl || !name) return null
  return {
    id,
    category: pickStr(o, 'category', 'Category') || 'Other',
    name,
    purchaseUrl,
    imageUrl: pickStr(o, 'imageUrl', 'ImageUrl'),
    price: pickStr(o, 'price', 'Price'),
    siteName: pickStr(o, 'siteName', 'SiteName'),
    notes: pickStr(o, 'notes', 'Notes') || undefined,
    submittedBy: normalizeAuthor(o.submittedBy ?? o.SubmittedBy) ?? undefined,
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    isMine: pickBool(o, 'isMine', 'IsMine'),
    averageRating: pickNum(o, 'averageRating', 'AverageRating'),
    reviewCount: pickNum(o, 'reviewCount', 'ReviewCount'),
    myReviewId: pickNullableStr(o, 'myReviewId', 'MyReviewId'),
  }
}

function normalizeGroup(raw: unknown): ShopRecommendationGroup | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const category = pickStr(o, 'category', 'Category')
  if (!category) return null
  const itemsRaw = o.items ?? o.Items
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.map(normalizeItem).filter((i): i is ShopRecommendation => i != null)
    : []
  return {
    category,
    itemCount: items.length,
    items,
  }
}

export function normalizeShopReview(raw: unknown): ShopRecommendationReview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  const author = normalizeAuthor(o.author ?? o.Author)
  if (!id || !author) return null
  return {
    id,
    shopRecommendationId: pickStr(o, 'shopRecommendationId', 'ShopRecommendationId'),
    rating: pickNum(o, 'rating', 'Rating'),
    content: pickStr(o, 'content', 'Content'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    author,
    isMine: pickBool(o, 'isMine', 'IsMine'),
  }
}

export async function fetchShopRecommendationCatalog(): Promise<ShopRecommendationCatalog> {
  const data = await apiFetch<unknown>('api/shop-recommendations')
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const groupsRaw = o.groups ?? o.Groups
  const groups = Array.isArray(groupsRaw)
    ? groupsRaw.map(normalizeGroup).filter((g): g is ShopRecommendationGroup => g != null)
    : []
  return { groups }
}

export async function fetchShopCategories(): Promise<string[]> {
  const data = await apiFetch<unknown>('api/shop-recommendations/categories')
  if (!Array.isArray(data)) return []
  return data.map((v) => String(v).trim()).filter(Boolean)
}

export async function createShopRecommendation(
  input: CreateShopRecommendationInput,
): Promise<ShopRecommendation> {
  const data = await apiFetch<unknown>('api/shop-recommendations', {
    method: 'POST',
    body: JSON.stringify({
      category: input.category,
      name: input.name,
      purchaseUrl: input.purchaseUrl,
      notes: input.notes,
    }),
  })
  const item = normalizeItem(data)
  if (!item) throw new Error('Create recommendation: invalid response from server')
  return item
}

export async function deleteShopRecommendation(id: string): Promise<void> {
  await apiFetch(`api/shop-recommendations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function fetchShopItemReviews(itemId: string): Promise<ShopRecommendationReview[]> {
  const data = await apiFetch<unknown>(
    `api/shop-recommendations/${encodeURIComponent(itemId)}/reviews`,
  )
  if (!Array.isArray(data)) return []
  return data.map(normalizeShopReview).filter((r): r is ShopRecommendationReview => r != null)
}

export async function submitShopItemReview(
  itemId: string,
  rating: number,
  content: string,
): Promise<ShopRecommendationReview> {
  const data = await apiFetch<unknown>(
    `api/shop-recommendations/${encodeURIComponent(itemId)}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify({ rating, content }),
    },
  )
  const review = normalizeShopReview(data)
  if (!review) throw new Error('Submit review: invalid response from server')
  return review
}

export async function deleteShopItemReview(reviewId: string): Promise<void> {
  await apiFetch(`api/shop-recommendations/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  })
}
