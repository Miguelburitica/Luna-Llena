import { describe, expect, it } from 'vitest'
import { accessOf } from '../application/ChatGateway.fixtures'
import { composerState } from './composer'

describe('composer state', () => {
  it('lets a member write where the server says they may', () => {
    const access = accessOf({ write: ['village'] })
    expect(composerState(access, 'village', 'day')).toEqual({ state: 'write', note: null })
  })

  it('explains that the village sleeps at night', () => {
    expect(composerState(accessOf(), 'village', 'night')).toEqual({ state: 'night-closed', note: 'villageAsleep' })
  })

  it('explains that the den is quiet by day', () => {
    const access = accessOf({ read: ['village', 'wolves'] })
    expect(composerState(access, 'wolves', 'day')).toEqual({ state: 'night-closed', note: 'denQuiet' })
  })

  it('pauses the village while last words are open', () => {
    const access = accessOf({ villagePaused: true })
    expect(composerState(access, 'village', 'dawn')).toEqual({ state: 'paused', note: 'paused' })
  })

  it('keeps the village read-only for the dead', () => {
    const access = accessOf({ read: ['village', 'ghosts'], write: ['ghosts'] })
    expect(composerState(access, 'village', 'day')).toEqual({ state: 'read-only', note: 'villageReadOnly' })
    expect(composerState(access, 'village', 'night')).toEqual({ state: 'read-only', note: 'villageReadOnly' })
  })

  it('keeps the den read-only for a dead wolf', () => {
    const access = accessOf({ read: ['village', 'wolves', 'ghosts'], write: ['ghosts'] })
    expect(composerState(access, 'wolves', 'night')).toEqual({ state: 'read-only', note: 'denReadOnly' })
  })
})
