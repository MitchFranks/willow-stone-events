'use client'

// The planner's toast, as a plain toast object for the shared ToastHost that
// AppShell draws (one stack for the whole app, so toasts never overlap). This
// maps the planner's one toast to { id, message, small, actions }: Undo while
// the undo slot is filled, and "Open X's phone" after a send. Toasts last 10
// seconds (B-11).

import { useEffect } from 'react'
import { firstName } from '@/lib/staffing/derive'
import { useStaffing2 } from '@/lib/staffing/store'

export function usePlannerToasts() {
  const { toast, dismissToast, canUndo, undo, openPhone } = useStaffing2()

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => dismissToast(toast.id), 10000)
    return () => clearTimeout(t)
  }, [toast, dismissToast])

  if (!toast) return { toasts: [], dismiss: dismissToast }
  const actions = []
  if (toast.undo && canUndo) actions.push({ label: 'Undo', onClick: undo })
  if (toast.phone) actions.push({ label: `Open ${firstName(toast.phone)}'s phone (prototype)`, onClick: () => openPhone(toast.phone) })
  return {
    toasts: [{ id: toast.id, message: toast.message, small: toast.small, tone: toast.tone, actions }],
    dismiss: dismissToast
  }
}
