import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal'

export type ConfirmActionOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

type ConfirmState = ConfirmActionOptions & { open: true }

const ConfirmContext = createContext<((options: ConfirmActionOptions) => void) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)
  const [busy, setBusy] = useState(false)

  const confirm = useCallback((options: ConfirmActionOptions) => {
    setState({ ...options, open: true })
  }, [])

  const close = useCallback(() => {
    if (busy) return
    setState(null)
  }, [busy])

  const handleConfirm = async () => {
    if (!state || busy) return
    setBusy(true)
    try {
      await state.onConfirm()
      setState(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state ? (
        <ConfirmActionModal
          open={state.open}
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          destructive={state.destructive}
          busy={busy}
          onConfirm={() => void handleConfirm()}
          onClose={close}
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirmAction() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirmAction must be used within ConfirmProvider')
  }
  return confirm
}
