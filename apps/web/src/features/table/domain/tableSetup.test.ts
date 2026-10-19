import { describe, expect, it } from 'vitest'
import { suggestedDeckFor } from '@/features/room/domain/deckAdvice'
import {
  canDeal,
  defaultTableSetup,
  nameErrorsOf,
  seatNameOf,
  unmetDealConditionsOf,
  withSeatCount
} from './tableSetup'

describe('table setup', () => {
  it('Quick setup: 8 unnamed seats with the suggested deck can be dealt', () => {
    const setup = { ...withSeatCount(defaultTableSetup(), 8), deck: suggestedDeckFor(8) }

    expect(setup.names.map((_, index) => seatNameOf(setup, index))).toEqual(Array(8).fill(null))
    expect(setup.deck).toMatchObject({ werewolf: 2, seer: 1, doctor: 1, witch: 1, hunter: 1, fool: 1, drunk: 1, villager: 0 })
    expect(canDeal(setup)).toBe(true)
  })

  it('Same name twice: the second seat shows name-taken and dealing is not possible', () => {
    const names = ['', 'Ana', '', '', 'ana', '', '', '']
    const setup = { ...defaultTableSetup(), names }

    expect(nameErrorsOf(setup)[4]).toBe('name-taken')
    expect(nameErrorsOf(setup)[1]).toBeNull()
    expect(canDeal(setup)).toBe(false)
  })

  it('rejects a name longer than 20 characters', () => {
    const setup = { ...defaultTableSetup(), names: ['x'.repeat(21), '', '', '', '', '', '', ''] }

    expect(nameErrorsOf(setup)[0]).toBe('name-invalid')
  })

  it('Deck too big: 7 players with 8 cards is a deck mismatch', () => {
    const setup = { ...withSeatCount(defaultTableSetup(), 7), deck: suggestedDeckFor(8) }

    expect(unmetDealConditionsOf(setup)).toEqual(['deck-mismatch'])
    expect(canDeal(setup)).toBe(false)
  })

  it('a deck without wolves cannot be dealt', () => {
    const setup = { ...defaultTableSetup(), deck: { ...suggestedDeckFor(8), werewolf: 0, villager: 2 } }

    expect(unmetDealConditionsOf(setup)).toEqual(['no-wolves'])
  })

  it('Too few players: the seat count stops at 6 and at 15', () => {
    expect(withSeatCount(defaultTableSetup(), 5).names).toHaveLength(6)
    expect(withSeatCount(defaultTableSetup(), 16).names).toHaveLength(15)
  })

  it('keeps names when the seat count changes', () => {
    const setup = { ...defaultTableSetup(), names: ['Ana', 'Caro', '', '', '', '', '', ''] }

    expect(withSeatCount(setup, 6).names.slice(0, 2)).toEqual(['Ana', 'Caro'])
  })
})
