import { describe, expect, it } from 'vitest'
import { narratorViewOf, playerViewOf } from './MatchGateway.fixtures'
import { createMatchTestApp } from './matchApp.fixtures'

describe('match store', () => {
  it('holds the view it syncs on entry and when it arrived', async () => {
    const view = playerViewOf({ round: 2 })
    const { store } = createMatchTestApp(view)
    const result = await store.sync()
    expect(result.ok).toBe(true)
    expect(store.view).toEqual(view)
    expect(store.receivedAt).toBeGreaterThan(0)
    expect(store.isNarrator).toBe(false)
  })

  it('recognises the narrator perspective', async () => {
    const { store } = createMatchTestApp(narratorViewOf())
    await store.sync()
    expect(store.isNarrator).toBe(true)
  })

  it('applies live views for its own room only', async () => {
    const { store, room, matches } = createMatchTestApp()
    await room.join('LUNA42', 'Caro')
    await store.sync()
    matches.pushView(playerViewOf({ phase: 'dawn' }))
    matches.pushView(playerViewOf({ code: 'NUBE77', phase: 'day' }))
    expect(store.view?.phase).toBe('dawn')
  })

  it('sends each narrator command through the gateway', async () => {
    const { store, matches } = createMatchTestApp(narratorViewOf())
    await store.advance()
    await store.extendTimer()
    await store.setAlive('id-Juan', false)
    await store.endGame()
    await store.keepPlaying()
    expect(matches.calls).toEqual([
      { command: 'advance', input: undefined },
      { command: 'extendTimer', input: undefined },
      { command: 'setAlive', input: { memberId: 'id-Juan', alive: false } },
      { command: 'endGame', input: undefined },
      { command: 'keepPlaying', input: undefined }
    ])
  })

  it('keeps a command failure for the view and clears it on success', async () => {
    const { store, matches } = createMatchTestApp(narratorViewOf())
    matches.failWith('advance', 'match-over')
    expect(await store.advance()).toEqual({ ok: false, error: { code: 'match-over' } })
    expect(store.failure).toEqual({ code: 'match-over' })
    matches.responses = {}
    await store.advance()
    expect(store.failure).toBeNull()
  })

  it('keeps a sync failure and no view', async () => {
    const { store, matches } = createMatchTestApp()
    matches.failWith('sync', 'match-not-found')
    await store.sync()
    expect(store.view).toBeNull()
    expect(store.failure).toEqual({ code: 'match-not-found' })
  })
})
