import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { lunaMessages } from '@/app/messages'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { FakeRoomGateway, MemorySessionStore } from '../application/RoomGateway.fixtures'
import { ROOM_GATEWAY, SESSION_STORE, type StoredSession } from '../application/ports'
import { useRoomStore } from '../application/useRoomStore'
import { roomRoutes } from './roomRoutes'

const gameStubRoute = { path: '/room/:code/game', name: 'game', component: { render: () => null } }

type RoomStore = ReturnType<typeof useRoomStore>

interface MountOptions {
  readonly path?: string
  readonly props?: Record<string, unknown>
  readonly stored?: StoredSession
  readonly stubs?: Record<string, boolean>
  readonly seed?: (context: { store: RoomStore; gateway: FakeRoomGateway }) => Promise<unknown>
}

export const mountRoomView = async (component: Component, { path = '/', props = {}, stored, stubs = {}, seed }: MountOptions = {}) => {
  const gateway = new FakeRoomGateway()
  const sessions = new MemorySessionStore(stored ?? null)
  const pinia = createPinia()
  setActivePinia(pinia)
  const provide = { [ROOM_GATEWAY as symbol]: gateway, [SESSION_STORE as symbol]: sessions }
  const host = createApp({})
  host.use(pinia)
  for (const key of Object.getOwnPropertySymbols(provide)) host.provide(key, provide[key])
  const store = host.runWithContext(() => useRoomStore())
  if (seed !== undefined) await seed({ store, gateway })

  const router = createRouter({ history: createMemoryHistory(), routes: [...roomRoutes, gameStubRoute] })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(component, {
    props,
    global: { plugins: [pinia, router, createLunaI18n(lunaMessages, 'en')], provide, stubs }
  })
  await flushPromises()
  return { wrapper, gateway, sessions, router, store }
}
