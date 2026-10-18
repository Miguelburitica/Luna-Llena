import type { MatchView } from '@luna/contracts'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { FakeRoomGateway, MemorySessionStore } from '@/features/room/application/RoomGateway.fixtures'
import { ROOM_GATEWAY, SESSION_STORE } from '@/features/room/application/ports'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { FakeMatchGateway } from './MatchGateway.fixtures'
import { MATCH_GATEWAY } from './ports'
import { useMatchStore } from './useMatchStore'

export const createMatchTestApp = (syncView?: MatchView) => {
  const rooms = new FakeRoomGateway()
  const matches = new FakeMatchGateway(syncView)
  const pinia = createPinia()
  const app = createApp({})
  app.use(pinia)
  app.provide(ROOM_GATEWAY, rooms)
  app.provide(SESSION_STORE, new MemorySessionStore())
  app.provide(MATCH_GATEWAY, matches)
  setActivePinia(pinia)
  const room = app.runWithContext(() => useRoomStore())
  const store = app.runWithContext(() => useMatchStore())
  return { app, pinia, rooms, matches, room, store }
}
