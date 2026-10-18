import { DEFAULT_ROOM_SETTINGS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { avatarChoices, cardsInDeck, deckSizeOf, namesOf, playersOf, teamCountsOf, timerLabelOf } from './lobby'
import { memberView, snapshotOf } from './snapshot.fixtures'

describe('lobby view rules', () => {
  it('lists players without the narrator', () => {
    expect(playersOf(snapshotOf()).map((player) => player.name)).toEqual(['Ana', 'Caro'])
  })

  it('marks avatars as free, held by others or mine', () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true, avatar: 'nico' }), memberView('Caro', { avatar: 'caro' })]
    })
    const choices = avatarChoices(snapshot, 'id-Caro')
    expect(choices.find((choice) => choice.avatar === 'caro')).toMatchObject({ mine: true })
    expect(choices.find((choice) => choice.avatar === 'nico')?.holder?.name).toBe('Nico')
    expect(choices.find((choice) => choice.avatar === 'vale')).toMatchObject({ holder: null, mine: false })
    expect(choices).toHaveLength(10)
  })

  it('summarises the deck', () => {
    expect(cardsInDeck(DEFAULT_ROOM_SETTINGS.deck).map((card) => card.role)).not.toContain('villager')
    expect(deckSizeOf({ werewolf: 2, seer: 1 })).toBe(3)
    expect(teamCountsOf(DEFAULT_ROOM_SETTINGS.deck)).toEqual({ wolves: 2, village: 5, solo: 1 })
  })

  it('names members by id and skips unknown ids', () => {
    expect(namesOf(snapshotOf(), ['id-Caro', 'id-Ghost'])).toEqual(['Caro'])
  })

  it('labels timers in seconds, minutes or off', () => {
    expect(timerLabelOf(0)).toEqual({ unit: 'off' })
    expect(timerLabelOf(45)).toEqual({ unit: 'seconds', value: 45 })
    expect(timerLabelOf(180)).toEqual({ unit: 'minutes', value: 3 })
  })
})
