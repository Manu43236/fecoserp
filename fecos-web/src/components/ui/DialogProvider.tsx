import { createContext, useContext, useState, useRef, useCallback, type ReactNode, type ComponentType } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

type DialogKind = 'success' | 'error' | 'info' | 'confirm'

export interface DialogOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ActiveDialog extends DialogOptions { kind: DialogKind }

export interface DialogApi {
  /** Green success dialog with a single OK button. */
  success: (o: DialogOptions) => Promise<void>
  /** Red error dialog with a single OK button. */
  error:   (o: DialogOptions) => Promise<void>
  /** Neutral info dialog with a single OK button. */
  info:    (o: DialogOptions) => Promise<void>
  /** Confirm/cancel dialog. Resolves true if confirmed, false if dismissed. */
  confirm: (o: DialogOptions) => Promise<boolean>
}

const DialogContext = createContext<DialogApi | null>(null)

interface KindMeta { Icon: ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; okLabel: string }
const META: Record<DialogKind, KindMeta> = {
  success: { Icon: CheckCircle2,  color: '#10b981',              okLabel: 'OK' },
  error:   { Icon: XCircle,       color: '#ef4444',              okLabel: 'OK' },
  info:    { Icon: Info,          color: 'var(--color-primary)', okLabel: 'OK' },
  confirm: { Icon: AlertTriangle, color: '#f59e0b',              okLabel: 'Confirm' },
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null)
  const resolver = useRef<((v: boolean) => void) | undefined>(undefined)

  const open = useCallback((kind: DialogKind, o: DialogOptions) =>
    new Promise<boolean>(resolve => { resolver.current = resolve; setDialog({ kind, ...o }) }), [])

  const settle = useCallback((v: boolean) => {
    setDialog(null)
    resolver.current?.(v)
    resolver.current = undefined
  }, [])

  const api: DialogApi = {
    success: o => open('success', o).then(() => undefined),
    error:   o => open('error', o).then(() => undefined),
    info:    o => open('info', o).then(() => undefined),
    confirm: o => open('confirm', o),
  }

  const meta = dialog ? META[dialog.kind] : null
  const isConfirm = dialog?.kind === 'confirm'

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && meta && (
        <Modal
          open
          onClose={() => settle(false)}
          title={dialog.title}
          size="sm"
          footer={
            <>
              {isConfirm && (
                <Button variant="secondary" onClick={() => settle(false)}>{dialog.cancelLabel ?? 'Cancel'}</Button>
              )}
              <Button variant={isConfirm && dialog.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>
                {dialog.confirmLabel ?? meta.okLabel}
              </Button>
            </>
          }
        >
          <div className="flex gap-3">
            <meta.Icon size={22} className="shrink-0 mt-0.5" style={{ color: meta.color }} />
            {dialog.message && <div className="text-sm text-gray-600">{dialog.message}</div>}
          </div>
        </Modal>
      )}
    </DialogContext.Provider>
  )
}

export function useDialogs(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialogs must be used within <DialogProvider>')
  return ctx
}
