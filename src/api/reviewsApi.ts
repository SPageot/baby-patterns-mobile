import { apiFetch } from './client'
import type { Brand, ProductReview } from '@/schemas/review'

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

function pickNullableStr(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '') return null
    if (typeof v === 'object') continue
    return String(v).trim()
  }
  return null
}

function normalizeAuthor(raw: unknown): ProductReview['author'] {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: pickStr(o, 'id', 'Id'),
    username: pickStr(o, 'username', 'Username'),
    fullName: pickStr(o, 'fullName', 'FullName'),
  }
}

function normalizeProduct(raw: unknown): Brand['products'][number] | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    name: pickStr(o, 'name', 'Name'),
    description: pickStr(o, 'description', 'Description'),
    category: pickStr(o, 'category', 'Category'),
    averageRating: pickNum(o, 'averageRating', 'AverageRating'),
    reviewCount: pickNum(o, 'reviewCount', 'ReviewCount'),
    myReviewId: pickNullableStr(o, 'myReviewId', 'MyReviewId'),
  }
}

export function normalizeBrand(raw: unknown): Brand | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  const productsRaw = o.products ?? o.Products
  const products = Array.isArray(productsRaw)
    ? productsRaw
        .map(normalizeProduct)
        .filter((p): p is Brand['products'][number] => p != null)
    : []
  return {
    id,
    name: pickStr(o, 'name', 'Name'),
    description: pickStr(o, 'description', 'Description'),
    products,
  }
}

export function normalizeReview(raw: unknown): ProductReview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = pickStr(o, 'id', 'Id')
  if (!id) return null
  return {
    id,
    productId: pickStr(o, 'productId', 'ProductId'),
    rating: pickNum(o, 'rating', 'Rating'),
    content: pickStr(o, 'content', 'Content'),
    createdAt: pickStr(o, 'createdAt', 'CreatedAt'),
    author: normalizeAuthor(o.author ?? o.Author),
    isMine: Boolean(o.isMine ?? o.IsMine),
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  const data = await apiFetch<unknown>('api/brands')
  if (!Array.isArray(data)) return []
  return data.map(normalizeBrand).filter((b): b is Brand => b != null)
}

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  const data = await apiFetch<unknown>(`api/brands/products/${productId}/reviews`)
  if (!Array.isArray(data)) return []
  return data.map(normalizeReview).filter((r): r is ProductReview => r != null)
}

export async function submitProductReview(
  productId: string,
  rating: number,
  content: string,
): Promise<ProductReview> {
  const data = await apiFetch<unknown>(`api/brands/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, content }),
  })
  const review = normalizeReview(data)
  if (!review) throw new Error('Could not save review')
  return review
}

export async function deleteProductReview(reviewId: string): Promise<void> {
  await apiFetch(`api/brands/reviews/${reviewId}`, { method: 'DELETE' })
}

export async function createBrand(name: string): Promise<Brand> {
  const data = await apiFetch<unknown>('api/brands', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  const brand = normalizeBrand(data)
  if (!brand) throw new Error('Could not add brand')
  return brand
}

export async function createProduct(
  brandId: string,
  name: string,
  category = 'General',
): Promise<Brand['products'][number]> {
  const data = await apiFetch<unknown>(`api/brands/${brandId}/products`, {
    method: 'POST',
    body: JSON.stringify({ name, category }),
  })
  const product = normalizeProduct(data)
  if (!product) throw new Error('Could not add product')
  return product
}
