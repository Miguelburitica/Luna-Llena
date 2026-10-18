import { computed, onScopeDispose, ref } from 'vue'
import { secondsLeft } from '../domain/phases'
import { useMatchStore } from './useMatchStore'

const TICK_MS = 1000

export const useCountdown = () => {
  const match = useMatchStore()
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), TICK_MS)
  onScopeDispose(() => clearInterval(timer))

  return computed(() => {
    const view = match.view
    if (view === null) return null
    return secondsLeft(view.phaseEndsAt, view.serverNow, match.receivedAt, Math.max(now.value, match.receivedAt))
  })
}
