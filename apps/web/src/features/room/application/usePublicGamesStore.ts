import type { PublicRoomCard } from '@luna/contracts'
import { defineStore } from 'pinia'
import { computed, inject, ref } from 'vue'
import { DEFAULT_PUBLIC_GAME_FILTERS, filterPublicRooms, type PublicGameFilters } from '../domain/publicGames'
import { PUBLIC_GAMES_GATEWAY, type RoomFailure } from './ports'

export const usePublicGamesStore = defineStore('publicGames', () => {
  const gateway = inject(PUBLIC_GAMES_GATEWAY)
  if (gateway === undefined) throw new Error('PublicGamesGateway was not provided to the app')

  const rooms = ref<readonly PublicRoomCard[]>([])
  const filters = ref<PublicGameFilters>({ ...DEFAULT_PUBLIC_GAME_FILTERS })
  const watching = ref(false)
  const loaded = ref(false)
  const failure = ref<RoomFailure | null>(null)
  const reported = ref<ReadonlySet<string>>(new Set())

  const visibleRooms = computed(() => filterPublicRooms(rooms.value, filters.value))

  gateway.onRooms((next) => {
    if (watching.value) rooms.value = next
  })

  gateway.onReconnected(() => {
    if (watching.value) void watch()
  })

  const watch = async () => {
    watching.value = true
    const result = await gateway.watch()
    loaded.value = true
    if (result.ok) {
      rooms.value = result.value
      failure.value = null
    } else failure.value = result.error
    return result
  }

  const unwatch = async () => {
    watching.value = false
    return gateway.unwatch()
  }

  const report = async (code: string) => {
    const result = await gateway.report(code)
    if (result.ok) reported.value = new Set([...reported.value, code])
    return result
  }

  const toggle = (filter: keyof PublicGameFilters) => {
    filters.value = { ...filters.value, [filter]: !filters.value[filter] }
  }

  return { rooms, filters, visibleRooms, watching, loaded, failure, reported, watch, unwatch, report, toggle }
})
