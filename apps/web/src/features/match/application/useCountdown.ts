import { PHASE_TIMERS } from '@luna/contracts'
import { computed, onScopeDispose, ref } from 'vue'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { secondsLeft } from '../domain/phases'
import { useMatchStore } from './useMatchStore'

const TICK_MS = 1000

export const useTickingNow = () => {
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), TICK_MS)
  onScopeDispose(() => clearInterval(timer))
  return now
}

export const useCountdown = () => {
  const match = useMatchStore()
  const now = useTickingNow()

  return computed(() => {
    const view = match.view
    if (view === null) return null
    return secondsLeft(view.phaseEndsAt, view.serverNow, match.receivedAt, Math.max(now.value, match.receivedAt))
  })
}

export const useMatchTimer = () => {
  const match = useMatchStore()
  const room = useRoomStore()
  const seconds = useCountdown()
  const totalSeconds = computed(() => {
    const timer = match.view === null ? undefined : PHASE_TIMERS[match.view.phase]
    return timer === undefined ? 0 : (room.snapshot?.settings.timers[timer] ?? 0)
  })
  return { seconds, totalSeconds }
}
