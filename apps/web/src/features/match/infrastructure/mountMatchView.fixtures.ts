import { ok, type MatchPlayerView, type MatchView, type MemberView } from '@luna/contracts'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { lunaMessages } from '@/app/messages'
import { FakeRoomGateway, MemorySessionStore, sessionFor } from '@/features/room/application/RoomGateway.fixtures'
import { ROOM_GATEWAY, SESSION_STORE } from '@/features/room/application/ports'
import { useRoomStore } from '@/features/room/application/useRoomStore'
import { memberView, snapshotOf } from '@/features/room/domain/snapshot.fixtures'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import { FakeChatGateway } from '@/features/chat/application/ChatGateway.fixtures'
import { CHAT_GATEWAY } from '@/features/chat/application/ports'
import { atmosphereProvides, createAtmosphereKit } from '@/features/atmosphere/application/Atmosphere.fixtures'
import type { AtmosphereSettings } from '@/features/atmosphere/domain/soundSettings'
import { FakeMatchGateway, playerViewOf } from '../application/MatchGateway.fixtures'
import { MATCH_GATEWAY } from '../application/ports'
import { useMatchStore } from '../application/useMatchStore'
import { matchRoutes } from './matchRoutes'

export const PLAYER_NAMES = ['Ana', 'Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Tato', 'Pipe']

export const rosterMembers = (bots: readonly string[] = []): MemberView[] => [
  memberView('Nico', { isNarrator: true, avatar: 'nico' }),
  ...PLAYER_NAMES.map((name) =>
    memberView(name, { ready: true, bot: bots.includes(name) ? { personality: 'chaos', difficulty: 'normal' } : null })
  )
]

export const matchPlayers = (overrides: Record<string, Partial<MatchPlayerView>> = {}): MatchPlayerView[] =>
  PLAYER_NAMES.map((name) => ({ id: `id-${name}`, alive: true, revealedRole: null, ...overrides[`id-${name}`] }))

const stub = { render: () => null }

interface MountOptions {
  readonly path?: string
  readonly props?: Record<string, unknown>
  readonly view?: MatchView
  readonly memberId?: string
  readonly voiceCallUrl?: string | null
  readonly bots?: readonly string[]
  readonly preload?: boolean
  readonly resume?: boolean
  readonly atmosphereSettings?: AtmosphereSettings
  readonly configure?: (gateways: { matches: FakeMatchGateway; rooms: FakeRoomGateway; chats: FakeChatGateway }) => void
}

export const mountMatchView = async (
  component: Component,
  { path = '/room/LUNA42/game', props = {}, view = playerViewOf(), memberId = 'id-Ana', voiceCallUrl = null, bots = [], preload = true, resume = false, atmosphereSettings, configure }: MountOptions = {}
) => {
  const rooms = new FakeRoomGateway()
  const matches = new FakeMatchGateway(view)
  const chats = new FakeChatGateway()
  const sessions = new MemorySessionStore()
  const atmosphere = createAtmosphereKit(atmosphereSettings ?? null)
  const pinia = createPinia()
  setActivePinia(pinia)
  const provide = { [ROOM_GATEWAY as symbol]: rooms, [SESSION_STORE as symbol]: sessions, [MATCH_GATEWAY as symbol]: matches, [CHAT_GATEWAY as symbol]: chats, ...atmosphereProvides(atmosphere) }
  const host = createApp({})
  host.use(pinia)
  for (const key of Object.getOwnPropertySymbols(provide)) host.provide(key, provide[key])
  const room = host.runWithContext(() => useRoomStore())
  const match = host.runWithContext(() => useMatchStore())
  const session = sessionFor(memberId, snapshotOf({ status: 'in-game', voiceCallUrl, members: rosterMembers(bots) }))
  if (resume) {
    sessions.save({ code: session.code, memberId, token: session.token })
    rooms.answer('resume', ok(session))
  } else {
    rooms.answer('join', ok(session))
    await room.join('LUNA42', 'Ana')
  }
  if (preload) await match.sync()
  matches.calls.length = 0
  configure?.({ matches, rooms, chats })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...matchRoutes,
      { path: '/', name: 'home', component: stub },
      { path: '/join/:code?', name: 'join', component: stub },
      { path: '/room/:code', name: 'lobby', component: stub }
    ]
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(component, {
    props,
    global: { plugins: [pinia, router, createLunaI18n(lunaMessages, 'en')], provide }
  })
  await flushPromises()
  return { wrapper, rooms, matches, chats, sessions, router, room, match, atmosphere, pinia }
}
