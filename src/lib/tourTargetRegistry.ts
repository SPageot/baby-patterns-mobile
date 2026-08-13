type TargetRect = { top: number; left: number; width: number; height: number }

type RegistryEntry = {
  measure: () => Promise<TargetRect | null>
}

const registry = new Map<string, RegistryEntry>()

export function registerTourTarget(
  id: string,
  measure: () => Promise<TargetRect | null>,
): () => void {
  registry.set(id, { measure })
  return () => {
    if (registry.get(id)?.measure === measure) registry.delete(id)
  }
}

export async function measureTourTarget(id: string): Promise<TargetRect | null> {
  const entry = registry.get(id)
  if (!entry) return null
  try {
    return await entry.measure()
  } catch {
    return null
  }
}

export type { TargetRect }
