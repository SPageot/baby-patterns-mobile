import type { Brand } from '@/schemas/review'

export function filterBrandsByQuery(brands: Brand[], query: string): Brand[] {
  const q = query.trim().toLowerCase()
  if (!q) return brands

  return brands
    .map((brand) => {
      const brandMatch = brand.name.toLowerCase().includes(q)
      const products = brandMatch
        ? brand.products
        : brand.products.filter(
            (product) =>
              product.name.toLowerCase().includes(q) ||
              product.category.toLowerCase().includes(q),
          )

      if (!brandMatch && products.length === 0) return null

      return { ...brand, products }
    })
    .filter((brand): brand is Brand => brand != null)
}
