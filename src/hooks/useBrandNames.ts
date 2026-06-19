import { useCallback, useEffect, useState } from 'react'
import { isApiConfigured } from '@/api/config'
import { ensureBrand, fetchBrands } from '@/api/reviewsApi'
import { filterBrandsByName } from '@/lib/reviewNames'
import type { Brand } from '@/schemas/review'

export function useBrandNames(enabled = true) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!enabled || !isApiConfigured()) {
      setBrands([])
      return
    }

    setLoading(true)
    try {
      setBrands(await fetchBrands())
    } catch {
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  const suggestionsFor = useCallback(
    (query: string) => filterBrandsByName(brands, query),
    [brands],
  )

  const registerBrandName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || !isApiConfigured()) return

    const created = await ensureBrand(trimmed)
    setBrands((prev) => {
      const exists = prev.some((brand) => brand.id === created.id)
      if (exists) return prev
      return [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    })
  }, [])

  return {
    brands,
    loading,
    reload,
    suggestionsFor,
    registerBrandName,
  }
}
