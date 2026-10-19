import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { lunaMessages } from '@/app/messages'
import { atmosphereProvides, createAtmosphereKit } from '@/features/atmosphere/application/Atmosphere.fixtures'
import type { AtmosphereSettings } from '@/features/atmosphere/domain/soundSettings'
import { FakeChatGateway } from '@/features/chat/application/ChatGateway.fixtures'
import { CHAT_GATEWAY } from '@/features/chat/application/ports'
import { FakeMatchGateway } from '@/features/match/application/MatchGateway.fixtures'
import { MATCH_GATEWAY } from '@/features/match/application/ports'
import { FakeRoomGateway, MemorySessionStore } from '@/features/room/application/RoomGateway.fixtures'
import { ROOM_GATEWAY, SESSION_STORE } from '@/features/room/application/ports'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { createTableKit, tableProvides } from '../application/Table.fixtures'
import { useTableStore } from '../application/useTableStore'
import type { TableJournal } from '../domain/tableJournal'
import { tableRoutes } from './tableRoutes'

const stub = { render: () => null }

interface MountOptions {
  readonly path?: string
  readonly journal?: TableJournal | null
  readonly atmosphereSettings?: AtmosphereSettings
}

export const mountTableView = async (component: Component, { path = '/table', journal = null, atmosphereSettings }: MountOptions = {}) => {
  const kit = createTableKit(journal)
  const atmosphere = createAtmosphereKit(atmosphereSettings ?? null)
  const rooms = new FakeRoomGateway()
  const matches = new FakeMatchGateway()
  const chats = new FakeChatGateway()
  const provide = {
    [ROOM_GATEWAY as symbol]: rooms,
    [SESSION_STORE as symbol]: new MemorySessionStore(),
    [MATCH_GATEWAY as symbol]: matches,
    [CHAT_GATEWAY as symbol]: chats,
    ...atmosphereProvides(atmosphere),
    ...tableProvides(kit)
  }
  const pinia = createPinia()
  setActivePinia(pinia)
  const host = createApp({})
  host.use(pinia)
  for (const key of Object.getOwnPropertySymbols(provide)) host.provide(key, provide[key])
  const table = host.runWithContext(() => useTableStore())

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: stub }, ...tableRoutes.map(({ path, name }) => ({ path, name, component: stub }))]
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(component, {
    global: { plugins: [pinia, router, createLunaI18n(lunaMessages, 'en')], provide, stubs: { SettingsOverlay: true } }
  })
  await flushPromises()
  return { wrapper, table, kit, atmosphere, router, rooms, matches, chats }
}

type Wrapper = Awaited<ReturnType<typeof mountTableView>>['wrapper']

export const buttonNamed = (wrapper: Wrapper, text: string | RegExp) =>
  wrapper.findAll('button').find((button) => (typeof text === 'string' ? button.text().trim() === text : text.test(button.text())))

export const press = async (wrapper: Wrapper, text: string | RegExp) => {
  const button = buttonNamed(wrapper, text)
  if (button === undefined) throw new Error(`No button ${String(text)}`)
  await button.trigger('click')
  await flushPromises()
}

export const pickNamed = async (scope: Pick<Wrapper, 'findAll'>, name: string) => {
  const pick = scope.findAll('.pick').find((candidate) => candidate.find('.pick-name').text() === name)
  if (pick === undefined) throw new Error(`No pick ${name}`)
  await pick.trigger('click')
  await flushPromises()
}

export const pickNames = (scope: Pick<Wrapper, 'findAll'>) => scope.findAll('.pick').map((pick) => pick.find('.pick-name').text())
