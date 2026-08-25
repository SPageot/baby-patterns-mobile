import { apiFetch } from './client'
import type { Brand } from '@/schemas/review'

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

/** Diaper brand autocomplete — not the removed product reviews UI. */
export async function fetchBrands(): Promise<Brand[]> {
  const data = await apiFetch<unknown>('api/brands')
  if (!Array.isArray(data)) return []
  return data.map(normalizeBrand).filter((b): b is Brand => b != null)
}

export async function ensureBrand(name: string): Promise<Brand> {
  const data = await apiFetch<unknown>('api/brands/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const brand = normalizeBrand(data)
  if (!brand) throw new Error('Could not save brand')
  return brand
}
