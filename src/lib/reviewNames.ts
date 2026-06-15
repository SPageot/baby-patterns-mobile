import type { Brand } from '@/schemas/review'

export function normalizeReviewName(value: string): string {
  return value.trim().toLowerCase()
}

export function filterBrandsByName(brands: Brand[], query: string): Brand[] {
  const q = normalizeReviewName(query)
  if (!q) return brands.slice(0, 8)
  return brands.filter((brand) => normalizeReviewName(brand.name).includes(q)).slice(0, 8)
}

export function findBrandByName(brands: Brand[], name: string): Brand | undefined {
  const q = normalizeReviewName(name)
  if (!q) return undefined
  return brands.find((brand) => normalizeReviewName(brand.name) === q)
}

export function filterProductsByName(brand: Brand | undefined, query: string): Brand['products'] {
  if (!brand) return []
  const q = normalizeReviewName(query)
  if (!q) return brand.products.slice(0, 8)
  return brand.products
    .filter(
      (product) =>
        normalizeReviewName(product.name).includes(q) ||
        normalizeReviewName(product.category).includes(q),
    )
    .slice(0, 8)
}

export function findProductByName(brand: Brand | undefined, name: string): Brand['products'][number] | undefined {
  if (!brand) return undefined
  const q = normalizeReviewName(name)
  if (!q) return undefined
  return brand.products.find((product) => normalizeReviewName(product.name) === q)
}

export function parseApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  const raw = error.message.trim()
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as { message?: string }
    if (parsed.message) return parsed.message
  } catch {
    // plain text error
  }
  return raw.length > 180 ? fallback : raw
}
