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

  it('sends a night action through the gateway and keeps its failure', async () => {
    const { store, matches } = createMatchTestApp()
    await store.act({ kind: 'hunt', targetId: 'id-Juan' })
    await store.act({ kind: 'potions', heal: false, poisonTargetId: null })
    expect(matches.calls).toEqual([
      { command: 'act', input: { kind: 'hunt', targetId: 'id-Juan' } },
      { command: 'act', input: { kind: 'potions', heal: false, poisonTargetId: null } }
    ])
    matches.failWith('act', 'not-night')
    expect(await store.act({ kind: 'suspect', targetId: 'id-Juan' })).toEqual({ ok: false, error: { code: 'not-night' } })
    expect(store.failure).toEqual({ code: 'not-night' })
    matches.responses = {}
    await store.act({ kind: 'suspect', targetId: 'id-Juan' })
    expect(store.failure).toBeNull()
  })

  it('sends votes, locks and revenge shots through the gateway', async () => {
    const { store, matches } = createMatchTestApp()
    await store.vote('id-Juan')
    await store.vote(null)
    await store.lockVote()
    await store.avenge('id-Luis')
    await store.skipRevenge()
    expect(matches.calls).toEqual([
      { command: 'vote', input: { targetId: 'id-Juan' } },
      { command: 'vote', input: { targetId: null } },
      { command: 'lockVote', input: undefined },
      { command: 'avenge', input: { targetId: 'id-Luis' } },
      { command: 'skipRevenge', input: undefined }
    ])
  })

  it('keeps the failure of each voting command and clears it on success', async () => {
    const { store, matches } = createMatchTestApp()
    matches.failWith('vote', 'vote-locked')
    expect(await store.vote('id-Juan')).toEqual({ ok: false, error: { code: 'vote-locked' } })
    expect(store.failure).toEqual({ code: 'vote-locked' })
    matches.failWith('lockVote', 'not-vote')
    await store.lockVote()
    expect(store.failure).toEqual({ code: 'not-vote' })
    matches.failWith('avenge', 'no-revenge')
    await store.avenge('id-Luis')
    expect(store.failure).toEqual({ code: 'no-revenge' })
    matches.failWith('skipRevenge', 'no-revenge')
    await store.skipRevenge()
    expect(store.failure).toEqual({ code: 'no-revenge' })
    matches.responses = {}
    await store.skipRevenge()
    expect(store.failure).toBeNull()
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
