import { inject, readonly, ref } from 'vue'

export const worksBrowserKey = Symbol('works-browser')

export function createWorksBrowserController() {
  const isOpen = ref(false)
  let opener = null

  const open = (element) => {
    if (element && typeof element.focus === 'function') opener = element
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const restoreFocus = () => {
    if (opener?.isConnected) opener.focus()
    opener = null
  }

  return {
    isOpen: readonly(isOpen),
    open,
    close,
    restoreFocus,
  }
}

export function useWorksBrowser() {
  const controller = inject(worksBrowserKey)
  if (!controller) throw new Error('Works browser controller is unavailable')
  return controller
}
