import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
}

/**
 * Minimal toast bus — a module-level list rendered once by ToastHost
 * in App.vue, so toasts survive route changes (e.g. upload → detail).
 */
const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function toast(message: string, timeoutMs = 2600): void {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message }]
    setTimeout(() => dismiss(id), timeoutMs)
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, toast, dismiss }
}
