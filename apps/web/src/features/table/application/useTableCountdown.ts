import { PHASE_TIMERS } from '@luna/contracts'
import { computed, watch } from 'vue'
import { useTickingNow } from '@/features/match/application/useCountdown'
import { useTableStore } from './useTableStore'

const MILLISECONDS_PER_SECOND = 1000

export const useTableCountdown = (onTimeUp: () => void = () => undefined) => {
  const table = useTableStore()
  const now = useTickingNow()
  const alerted = new Set<string>()

  const seconds = computed(() => {
    const endsAt = table.view?.phaseEndsAt ?? null
    return endsAt === null ? null : Math.max(0, Math.ceil((endsAt - now.value) / MILLISECONDS_PER_SECOND))
  })
  const totalSeconds = computed(() => {
    const timer = table.view === null ? undefined : PHASE_TIMERS[table.view.phase]
    return timer === undefined ? 0 : (table.journal?.setup.timers[timer] ?? 0)
  })
  const timeUp = computed(() => seconds.value === 0)

  watch(seconds, (next, previous) => {
    const view = table.view
    if (view === null || next !== 0 || previous === null || previous === undefined || previous === 0) return
    const phaseKey = `${view.phase}-${view.round}`
    if (alerted.has(phaseKey)) return
    alerted.add(phaseKey)
    onTimeUp()
  })

  return { seconds, totalSeconds, timeUp }
}
