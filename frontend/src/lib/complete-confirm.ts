import { useSyncExternalStore } from 'react'

/** Set when someone ticks "Don't ask me again" in the complete dialog. Per browser. */
const STORAGE_KEY = 'daymark.skipCompleteConfirm'

const listeners = new Set<() => void>()

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export const setSkipCompleteConfirm = (skip: boolean) => {
  try {
    if (skip) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode); the dialog simply keeps asking.
  }
  listeners.forEach((listener) => listener())
}

/** Whether completing a task should skip the confirm dialog. */
export const useSkipCompleteConfirm = () => useSyncExternalStore(subscribe, read, () => false)
