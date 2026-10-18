import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { FakeRoomGateway, MemorySessionStore } from './RoomGateway.fixtures'
import { ROOM_GATEWAY, SESSION_STORE, type StoredSession } from './ports'
import { useRoomStore } from './useRoomStore'

export const createRoomTestApp = (stored: StoredSession | null = null) => {
  const gateway = new FakeRoomGateway()
  const sessions = new MemorySessionStore(stored)
  const pinia = createPinia()
  const app = createApp({})
  app.use(pinia)
  app.provide(ROOM_GATEWAY, gateway)
  app.provide(SESSION_STORE, sessions)
  setActivePinia(pinia)
  const store = app.runWithContext(() => useRoomStore())
  return { app, pinia, gateway, sessions, store }
}
