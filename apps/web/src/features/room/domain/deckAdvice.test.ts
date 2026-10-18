import { DEFAULT_ROOM_SETTINGS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { balanceVerdictOf, recommendedWolves, suggestedDeckFor } from './deckAdvice'
import { deckSizeOf } from './lobby'

const deckWithWolves = (werewolf: number) => ({ ...DEFAULT_ROOM_SETTINGS.deck, werewolf })

describe('deck advice', () => {
  it('recommends one wolf per four players, at least one', () => {
    expect([3, 6, 7, 8, 11, 12, 15].map(recommendedWolves)).toEqual([1, 1, 2, 2, 3, 3, 4])
  })

  it('calls 2 wolves for 8 players balanced', () => {
    expect(balanceVerdictOf(deckWithWolves(2), 8)).toBe('balanced')
  })

  it('calls 4 wolves for 7 players too many', () => {
    expect(balanceVerdictOf(deckWithWolves(4), 7)).toBe('too-many-wolves')
  })

  it('calls a deck without wolves no-wolves', () => {
    expect(balanceVerdictOf(deckWithWolves(0), 8)).toBe('no-wolves')
  })

  it('calls a single wolf for 15 players too few', () => {
    expect(balanceVerdictOf(deckWithWolves(1), 15)).toBe('too-few-wolves')
  })

  it('tolerates one wolf above or below the recommendation', () => {
    expect(balanceVerdictOf(deckWithWolves(1), 8)).toBe('balanced')
    expect(balanceVerdictOf(deckWithWolves(3), 8)).toBe('balanced')
  })

  it('suggests 2 wolves and all six specials for 8 players', () => {
    expect(suggestedDeckFor(8)).toEqual({
      werewolf: 2,
      villager: 0,
      seer: 1,
      doctor: 1,
      witch: 1,
      hunter: 1,
      fool: 1,
      drunk: 1
    })
  })

  it('suggests 1 wolf and five specials for 6 players', () => {
    expect(suggestedDeckFor(6)).toEqual({
      werewolf: 1,
      villager: 0,
      seer: 1,
      doctor: 1,
      witch: 1,
      hunter: 1,
      fool: 1,
      drunk: 0
    })
  })

  it('suggests 4 wolves, six specials and 5 villagers for 15 players', () => {
    expect(suggestedDeckFor(15)).toMatchObject({ werewolf: 4, villager: 5, seer: 1, drunk: 1 })
  })

  it('always fills exactly one card per player', () => {
    for (let players = 6; players <= 15; players += 1) {
      expect(deckSizeOf(suggestedDeckFor(players))).toBe(players)
      expect(balanceVerdictOf(suggestedDeckFor(players), players)).toBe('balanced')
    }
  })
})
