import { useCallback, useState } from 'react'

import { fetchBrands } from '@/api/reviewsApi'
import { isApiConfigured } from '@/api/config'
import type { Brand } from '@/schemas/review'
import { useDeferredEffect } from '@/lib/scheduleEffect'

export function useReviews(enabled: boolean) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled || !isApiConfigured()) {
      setBrands([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setBrands(await fetchBrands())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load brands')
      setBrands([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useDeferredEffect(() => {
    void load()
  }, [load])

  return {
    brands,
    loading,
    error,
    reload: load,
  }
}
