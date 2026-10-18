import { onScopeDispose, shallowRef } from 'vue'

export const useFlash = <T>(durationMs: number) => {
  const current = shallowRef<T | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  const clear = () => {
    clearTimeout(timer)
    current.value = null
  }

  const show = (value: T) => {
    clearTimeout(timer)
    current.value = value
    timer = setTimeout(clear, durationMs)
  }

  onScopeDispose(() => clearTimeout(timer))

  return { current, show }
}
