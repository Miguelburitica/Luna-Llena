import type { MatchView, NightActionInput, Result } from '@luna/contracts'
import { defineStore } from 'pinia'
import { computed, inject, ref } from 'vue'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { MATCH_GATEWAY, type MatchFailure } from './ports'

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} was not provided to the app`)
  return value
}

export const useMatchStore = defineStore('match', () => {
  const gateway = required(inject(MATCH_GATEWAY), 'MatchGateway')
  const room = useRoomStore()

  const view = ref<MatchView | null>(null)
  const receivedAt = ref(0)
  const failure = ref<MatchFailure | null>(null)

  const adopt = (next: MatchView) => {
    view.value = next
    receivedAt.value = Date.now()
  }

  const sync = async (): Promise<Result<MatchView, MatchFailure>> => {
    const result = await gateway.sync()
    if (result.ok) adopt(result.value)
    failure.value = result.ok ? null : result.error
    return result
  }

  const command = async (send: () => Promise<Result<void, MatchFailure>>): Promise<Result<void, MatchFailure>> => {
    const result = await send()
    failure.value = result.ok ? null : result.error
    return result
  }

  const reset = () => {
    view.value = null
    receivedAt.value = 0
    failure.value = null
  }

  gateway.onView((next) => {
    if (next.code === room.session?.code) adopt(next)
  })

  return {
    view,
    receivedAt,
    failure,
    isNarrator: computed(() => view.value?.perspective === 'narrator'),
    sync,
    reset,
    advance: () => command(() => gateway.advance()),
    extendTimer: () => command(() => gateway.extendTimer()),
    setAlive: (memberId: string, alive: boolean) => command(() => gateway.setAlive(memberId, alive)),
    endGame: () => command(() => gateway.endGame()),
    keepPlaying: () => command(() => gateway.keepPlaying()),
    act: (input: NightActionInput) => command(() => gateway.act(input)),
    vote: (targetId: string | null) => command(() => gateway.vote(targetId)),
    lockVote: () => command(() => gateway.lockVote()),
    avenge: (targetId: string) => command(() => gateway.avenge(targetId)),
    skipRevenge: () => command(() => gateway.skipRevenge())
  }
})
