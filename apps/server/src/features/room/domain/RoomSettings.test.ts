import { describe, expect, it } from 'vitest'
import { unwrap } from './Room.fixtures'
import { RoomSettings } from './RoomSettings'

const invalid = { ok: false, error: { code: 'settings-invalid' } }

describe('RoomSettings', () => {
  it('starts with the classic defaults', () => {
    const settings = RoomSettings.defaults()
    expect(settings.theme).toBe('classic')
    expect(settings.timers).toEqual({ night: 60, day: 180, vote: 60 })
    expect(settings.houseRules).toEqual({
      ghostPowers: true,
      lastWords: true,
      revealRoleOnDeath: true,
      anonymousVotes: false
    })
    expect(settings.deck).toEqual({
      werewolf: 2,
      villager: 0,
      seer: 1,
      doctor: 1,
      witch: 1,
      hunter: 1,
      fool: 1,
      drunk: 1
    })
    expect(settings.deckSize).toBe(8)
  })

  it('updates only the given values', () => {
    const settings = unwrap(RoomSettings.defaults().apply({ timers: { day: 300 }, houseRules: { anonymousVotes: true } }))
    expect(settings.timers).toEqual({ night: 60, day: 300, vote: 60 })
    expect(settings.houseRules.anonymousVotes).toBe(true)
    expect(settings.houseRules.ghostPowers).toBe(true)
  })

  it('accepts 0 as manual advance', () => {
    expect(unwrap(RoomSettings.defaults().apply({ timers: { night: 0 } })).timers.night).toBe(0)
  })

  it.each([
    ['a vote timer outside the allowed set', { timers: { vote: 45 } }],
    ['an unknown timer', { timers: { dusk: 60 } }],
    ['the locked colombia theme', { theme: 'colombia' }],
    ['an unknown house rule', { houseRules: { chaos: true } }],
    ['a non-boolean house rule', { houseRules: { lastWords: 'yes' } }],
    ['an unknown role', { deck: { vampire: 1 } }],
    ['a negative count', { deck: { seer: -1 } }],
    ['a fractional count', { deck: { seer: 1.5 } }],
    ['a deck above 15 cards', { deck: { villager: 9 } }],
    ['two seers', { deck: { seer: 2 } }],
    ['5 werewolves', { deck: { werewolf: 5 } }],
    ['a non-object', 'night']
  ])('rejects %s', (_, input) => {
    expect(RoomSettings.defaults().apply(input)).toEqual(invalid)
  })

  it('accepts four werewolves', () => {
    expect(unwrap(RoomSettings.defaults().apply({ deck: { werewolf: 4 } })).deck.werewolf).toBe(4)
  })

  it('builds settings from missing input as defaults', () => {
    expect(unwrap(RoomSettings.fromInput(undefined))).toEqual(RoomSettings.defaults())
  })
})
