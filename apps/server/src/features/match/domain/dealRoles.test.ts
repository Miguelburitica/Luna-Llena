import { ROLE_IDS, type RoleId } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { SeededRandom } from '../../../shared/application/clockAndRandom.fixtures'
import { dealRoles } from './dealRoles'

const sevenCardDeck: Record<RoleId, number> = {
  werewolf: 2,
  villager: 0,
  seer: 1,
  doctor: 1,
  witch: 1,
  hunter: 1,
  fool: 1,
  drunk: 0
}

const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

describe('dealRoles', () => {
  it('gives each of 7 players exactly one card and uses every card once', () => {
    const seats = dealRoles(sevenCardDeck, playerIds, new SeededRandom(7))
    expect(seats.map((seat) => seat.memberId)).toEqual(playerIds)
    expect(seats.every((seat) => seat.alive)).toBe(true)
    const dealt = Object.fromEntries(ROLE_IDS.map((role) => [role, seats.filter((seat) => seat.role === role).length]))
    expect(dealt).toEqual(sevenCardDeck)
  })

  it('deals the same cards for the same random sequence', () => {
    const first = dealRoles(sevenCardDeck, playerIds, new SeededRandom(42))
    const second = dealRoles(sevenCardDeck, playerIds, new SeededRandom(42))
    expect(second).toEqual(first)
  })

  it('shuffles differently for different random sequences', () => {
    const orders = [1, 2, 3, 4, 5].map((seed) =>
      dealRoles(sevenCardDeck, playerIds, new SeededRandom(seed)).map((seat) => seat.role).join()
    )
    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  it('follows the injected random numbers', () => {
    const zeros = { next: () => 0 }
    const almostOne = { next: () => 0.999 }
    const cards = ['werewolf', 'werewolf', 'seer', 'doctor', 'witch', 'hunter', 'fool']
    expect(dealRoles(sevenCardDeck, playerIds, almostOne).map((seat) => seat.role)).toEqual(cards)
    expect(dealRoles(sevenCardDeck, playerIds, zeros).map((seat) => seat.role)).toEqual([
      'werewolf',
      'seer',
      'doctor',
      'witch',
      'hunter',
      'fool',
      'werewolf'
    ])
  })
})
