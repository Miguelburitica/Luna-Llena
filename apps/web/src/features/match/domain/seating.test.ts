import { describe, expect, it } from 'vitest'
import { memberView } from '@/features/room/domain/snapshot.fixtures'
import { narratorViewOf, playerViewOf } from '../application/MatchGateway.fixtures'
import { aliveCountOf, seatsOf, trueRoleOf } from './seating'

const members = [memberView('Ana', { avatar: 'ana' }), memberView('Juan', { avatar: 'juan' }), memberView('Luis')]

const players = [
  { id: 'id-Ana', alive: true, revealedRole: null },
  { id: 'id-Juan', alive: false, revealedRole: 'doctor' as const },
  { id: 'id-Luis', alive: true, revealedRole: null }
]

describe('seating', () => {
  it('names every seat, marks you and the pack, and keeps the death state', () => {
    const view = playerViewOf({ players })
    expect(seatsOf(view, members, 'id-Ana', ['id-Luis'])).toEqual([
      { id: 'id-Ana', name: 'Ana', avatar: 'ana', alive: true, revealedRole: null, isYou: true, isPack: false },
      { id: 'id-Juan', name: 'Juan', avatar: 'juan', alive: false, revealedRole: 'doctor', isYou: false, isPack: false },
      { id: 'id-Luis', name: 'Luis', avatar: null, alive: true, revealedRole: null, isYou: false, isPack: true }
    ])
  })

  it('counts who is alive', () => {
    expect(aliveCountOf(playerViewOf({ players }))).toBe(2)
  })

  it('reads true roles from the narrator roles and from the roles revealed to players', () => {
    expect(trueRoleOf(narratorViewOf({ players, roles: { 'id-Ana': 'drunk' } }), 'id-Ana')).toBe('drunk')
    expect(trueRoleOf(playerViewOf({ players }), 'id-Juan')).toBe('doctor')
    expect(trueRoleOf(playerViewOf({ players }), 'id-Ana')).toBeNull()
  })
})
