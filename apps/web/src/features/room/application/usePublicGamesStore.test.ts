import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { describe, expect, it } from 'vitest'
import { FakePublicGamesGateway, publicCardOf } from './RoomGateway.fixtures'
import { PUBLIC_GAMES_GATEWAY } from './ports'
import { usePublicGamesStore } from './usePublicGamesStore'

const storeWith = (gateway = new FakePublicGamesGateway()) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const app = createApp({})
  app.use(pinia)
  app.provide(PUBLIC_GAMES_GATEWAY, gateway)
  return { gateway, store: app.runWithContext(() => usePublicGamesStore()) }
}

describe('Public games store', () => {
  it('loads the list when it starts watching', async () => {
    const { store, gateway } = storeWith()
    await store.watch()
    expect(gateway.calls).toEqual(['watch'])
    expect(store.visibleRooms.map((room) => room.code)).toEqual(['LUNA42'])
  })

  it('follows live updates while watching and ignores them after leaving', async () => {
    const { store, gateway } = storeWith()
    await store.watch()
    gateway.pushRooms([publicCardOf({ playerCount: 6 })])
    expect(store.rooms[0]?.playerCount).toBe(6)
    await store.unwatch()
    gateway.pushRooms([])
    expect(store.rooms).toHaveLength(1)
    expect(gateway.calls).toEqual(['watch', 'unwatch'])
  })

  it('hides rooms in progress until the filter is turned off', async () => {
    const { store, gateway } = storeWith()
    gateway.rooms = [publicCardOf(), publicCardOf({ code: 'RUNNNN', status: 'in-progress', joinable: false })]
    await store.watch()
    expect(store.visibleRooms).toHaveLength(1)
    store.toggle('waitingOnly')
    expect(store.visibleRooms.map((room) => room.code)).toEqual(['LUNA42', 'RUNNNN'])
  })

  it('watches again after a reconnect', async () => {
    const { store, gateway } = storeWith()
    await store.watch()
    gateway.pushReconnected()
    expect(gateway.calls).toEqual(['watch', 'watch'])
  })

  it('remembers rooms it reported', async () => {
    const { store, gateway } = storeWith()
    await store.report('LUNA42')
    expect(gateway.calls).toEqual(['report:LUNA42'])
    expect(store.reported.has('LUNA42')).toBe(true)
  })
})
