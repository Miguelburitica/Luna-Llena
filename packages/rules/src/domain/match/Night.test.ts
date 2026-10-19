import { describe, expect, it } from 'vitest'
import { Night } from './Night'
import {
  beginMatch,
  constantRandom,
  DOCTOR,
  DRUNK,
  NARRATOR_ID,
  NIGHT_ROLES,
  OTHER_VILLAGER,
  seatsOf,
  SEER,
  START_TIME,
  unwrap,
  VILLAGER,
  WITCH,
  WOLF_ONE,
  WOLF_TWO
} from './Match.fixtures'
import { packVictimOf, resolveDawn } from './resolveDawn'

const random = constantRandom(0.9)

const nightMatch = () => beginMatch({ roles: NIGHT_ROLES })

const code = (result: { ok: boolean; error?: unknown }) => (result.ok ? 'ok' : (result.error as { code: string }).code)

const hunt = (match: ReturnType<typeof nightMatch>, wolfId: string, targetId: string) =>
  match.act(wolfId, { kind: 'hunt', targetId }, random)

const advance = (match: ReturnType<typeof nightMatch>, times = 1) => {
  for (let step = 0; step < times; step += 1) unwrap(match.advance(NARRATOR_ID, START_TIME))
}

const isAlive = (match: ReturnType<typeof nightMatch>, memberId: string) =>
  match.seats.find((seat) => seat.memberId === memberId)?.alive

describe('packVictimOf', () => {
  it('has no victim without picks', () => {
    expect(packVictimOf([])).toBeNull()
  })

  it('picks the player named by the most wolves', () => {
    expect(
      packVictimOf([
        { wolfId: WOLF_ONE, targetId: 'a' },
        { wolfId: WOLF_TWO, targetId: 'b' },
        { wolfId: 'w3', targetId: 'a' }
      ])
    ).toBe('a')
  })

  it('breaks a tie with the most recent pick', () => {
    expect(
      packVictimOf([
        { wolfId: WOLF_ONE, targetId: 'a' },
        { wolfId: WOLF_TWO, targetId: 'b' }
      ])
    ).toBe('b')
  })
})

describe('The wolves hunt', () => {
  it('shows the pack agrees on Juan', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(hunt(match, WOLF_TWO, VILLAGER))
    expect(match.packVictim()).toBe(VILLAGER)
  })

  it('takes the latest pick of a split pack', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, OTHER_VILLAGER))
    unwrap(hunt(match, WOLF_TWO, VILLAGER))
    expect(match.packVictim()).toBe(VILLAGER)
  })

  it('moves a wolf that changes its mind to the end', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, OTHER_VILLAGER))
    unwrap(hunt(match, WOLF_TWO, VILLAGER))
    unwrap(hunt(match, WOLF_ONE, OTHER_VILLAGER))
    expect(match.packVictim()).toBe(OTHER_VILLAGER)
    expect(match.night.huntPicks).toHaveLength(2)
  })
})

describe('Acting rules', () => {
  it('rejects acting during the day', () => {
    const match = nightMatch()
    advance(match, 2)
    expect(code(hunt(match, WOLF_ONE, VILLAGER))).toBe('not-night')
  })

  it('rejects the dead', () => {
    const match = nightMatch()
    unwrap(match.setAlive(NARRATOR_ID, DOCTOR, false))
    expect(code(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))).toBe('player-dead')
  })

  it('rejects an action that is not the role action', () => {
    const match = nightMatch()
    expect(code(match.act(VILLAGER, { kind: 'inspect', targetId: SEER }, random))).toBe('not-your-action')
    expect(code(match.act(NARRATOR_ID, { kind: 'suspect', targetId: SEER }, random))).toBe('not-your-action')
    expect(code(match.act(VILLAGER, 'nonsense', random))).toBe('not-your-action')
    expect(code(match.act(VILLAGER, null, random))).toBe('not-your-action')
  })

  it('rejects a match that is over', () => {
    const match = nightMatch()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(code(match.act(VILLAGER, { kind: 'suspect', targetId: SEER }, random))).toBe('match-over')
  })

  it('rejects wolves hunting wolves', () => {
    expect(code(hunt(nightMatch(), WOLF_ONE, WOLF_TWO))).toBe('target-invalid')
  })

  it('rejects dead, unknown and malformed targets', () => {
    const match = nightMatch()
    unwrap(match.setAlive(NARRATOR_ID, VILLAGER, false))
    expect(code(match.act(SEER, { kind: 'inspect', targetId: VILLAGER }, random))).toBe('target-invalid')
    expect(code(match.act(SEER, { kind: 'inspect', targetId: 'ghost' }, random))).toBe('target-invalid')
    expect(code(match.act(SEER, { kind: 'inspect' }, random))).toBe('target-invalid')
    expect(code(match.act(SEER, { kind: 'inspect', targetId: 7 }, random))).toBe('target-invalid')
  })

  it('rejects targeting yourself except for protection', () => {
    const match = nightMatch()
    expect(code(match.act(SEER, { kind: 'inspect', targetId: SEER }, random))).toBe('target-invalid')
    expect(code(match.act(VILLAGER, { kind: 'suspect', targetId: VILLAGER }, random))).toBe('target-invalid')
    expect(code(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: WITCH }, random))).toBe('target-invalid')
    expect(code(match.act(WITCH, { kind: 'potions', heal: 'yes', poisonTargetId: null }, random))).toBe('target-invalid')
  })

  it('lets a suspect be named and changed', () => {
    const match = nightMatch()
    unwrap(match.act(VILLAGER, { kind: 'suspect', targetId: SEER }, random))
    unwrap(match.act(VILLAGER, { kind: 'suspect', targetId: DOCTOR }, random))
    expect(match.night.suspicions.get(VILLAGER)).toBe(DOCTOR)
  })
})

describe('Visions', () => {
  it('tells the Seer the truth about a wolf and a villager', () => {
    const wolfMatch = nightMatch()
    unwrap(wolfMatch.act(SEER, { kind: 'inspect', targetId: WOLF_ONE }, random))
    expect(wolfMatch.night.inspections.get(SEER)).toEqual({ round: 1, targetId: WOLF_ONE, isWolf: true, fromDrunk: false })
    const villagerMatch = nightMatch()
    unwrap(villagerMatch.act(SEER, { kind: 'inspect', targetId: VILLAGER }, random))
    expect(villagerMatch.night.inspections.get(SEER)?.isWolf).toBe(false)
  })

  it('allows one peek per night', () => {
    const match = nightMatch()
    unwrap(match.act(SEER, { kind: 'inspect', targetId: VILLAGER }, random))
    expect(code(match.act(SEER, { kind: 'inspect', targetId: WOLF_ONE }, random))).toBe('already-inspected')
    expect(match.night.inspections.get(SEER)?.targetId).toBe(VILLAGER)
  })

  it('keeps the vision history across nights', () => {
    const match = nightMatch()
    unwrap(match.act(SEER, { kind: 'inspect', targetId: VILLAGER }, random))
    advance(match, 5)
    expect(match.phase).toBe('night')
    unwrap(match.act(SEER, { kind: 'inspect', targetId: WOLF_ONE }, random))
    expect(match.visionsOf(SEER)).toEqual([
      { round: 1, targetId: VILLAGER, isWolf: false },
      { round: 2, targetId: WOLF_ONE, isWolf: true }
    ])
  })

  it('gives the Drunk a random result decided at inspection time', () => {
    const wolfish = nightMatch()
    unwrap(wolfish.act(DRUNK, { kind: 'inspect', targetId: VILLAGER }, constantRandom(0.2)))
    expect(wolfish.night.inspections.get(DRUNK)).toEqual({ round: 1, targetId: VILLAGER, isWolf: true, fromDrunk: true })
    const innocent = nightMatch()
    unwrap(innocent.act(DRUNK, { kind: 'inspect', targetId: WOLF_ONE }, constantRandom(0.7)))
    expect(innocent.night.inspections.get(DRUNK)?.isWolf).toBe(false)
    expect(code(innocent.act(DRUNK, { kind: 'inspect', targetId: VILLAGER }, constantRandom(0.1)))).toBe('already-inspected')
    expect(innocent.visionsOf(DRUNK)).toHaveLength(1)
  })
})

describe('Protection', () => {
  it('forbids the same patient two nights in a row', () => {
    const match = nightMatch()
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))
    advance(match, 5)
    expect(match.blockedPatientOf(DOCTOR)).toBe(VILLAGER)
    expect(code(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))).toBe('protected-last-night')
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: OTHER_VILLAGER }, random))
  })

  it('lets the Doctor protect themselves', () => {
    const match = nightMatch()
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: DOCTOR }, random))
    expect(match.night.protections.get(DOCTOR)).toBe(DOCTOR)
  })

  it('frees the patient after a night without protection', () => {
    const match = nightMatch()
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))
    advance(match, 5)
    advance(match, 5)
    expect(match.blockedPatientOf(DOCTOR)).toBeNull()
  })
})

describe('Potions', () => {
  it('lets the Witch change and cancel until dawn', () => {
    const match = nightMatch()
    unwrap(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: VILLAGER }, random))
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: null }, random))
    expect(match.night.potions.get(WITCH)).toEqual({ heal: false, poisonTargetId: null })
    expect(match.potionsSpentBy(WITCH)).toEqual({ heal: false, poison: false })
  })

  it('rejects a heal that is already used', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: null }, random))
    advance(match, 5)
    expect(match.potionsSpentBy(WITCH)).toEqual({ heal: true, poison: false })
    expect(code(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: null }, random))).toBe('potion-used')
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: VILLAGER }, random))
  })

  it('rejects a poison that is already used', () => {
    const match = nightMatch()
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: VILLAGER }, random))
    advance(match, 5)
    expect(code(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: OTHER_VILLAGER }, random))).toBe(
      'potion-used'
    )
  })

  it('keeps both potions when the Witch does nothing', () => {
    const match = nightMatch()
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: null }, random))
    expect(match.night.hasActed(WITCH, 'potions')).toBe(true)
    advance(match)
    expect(match.potionsSpentBy(WITCH)).toEqual({ heal: false, poison: false })
  })

  it('accepts a heal with no victim and spends nothing', () => {
    const match = nightMatch()
    unwrap(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: null }, random))
    advance(match)
    expect(match.dawn).toEqual({ round: 1, deaths: [] })
    expect(match.potionsSpentBy(WITCH).heal).toBe(false)
  })
})

describe('Dawn resolution', () => {
  it('kills the wolves victim', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    advance(match)
    expect(match.phase).toBe('dawn')
    expect(match.dawn).toEqual({ round: 1, deaths: [VILLAGER] })
    expect(isAlive(match, VILLAGER)).toBe(false)
  })

  it('saves a victim protected by the Doctor', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))
    advance(match)
    expect(match.dawn?.deaths).toEqual([])
    expect(isAlive(match, VILLAGER)).toBe(true)
  })

  it('saves a victim healed by the Witch and spends the heal', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: null }, random))
    advance(match)
    expect(match.dawn?.deaths).toEqual([])
    expect(match.potionsSpentBy(WITCH)).toEqual({ heal: true, poison: false })
  })

  it('kills the victim and the poisoned player', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: OTHER_VILLAGER }, random))
    advance(match)
    expect(match.dawn?.deaths).toEqual([VILLAGER, OTHER_VILLAGER])
    expect(match.potionsSpentBy(WITCH)).toEqual({ heal: false, poison: true })
  })

  it('poisons through the Doctor protection', () => {
    const match = nightMatch()
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: VILLAGER }, random))
    advance(match)
    expect(match.dawn?.deaths).toEqual([VILLAGER])
  })

  it('ends a night without actions with nobody dead', () => {
    const match = nightMatch()
    advance(match)
    expect(match.dawn).toEqual({ round: 1, deaths: [] })
    expect(match.seats.every((seat) => seat.alive)).toBe(true)
    expect(match.pendingWinner).toBeNull()
  })

  it('asks to end the game when the poison kills the last wolf', () => {
    const match = beginMatch({ roles: ['werewolf', 'witch', 'villager', 'villager'] })
    unwrap(match.act('p2', { kind: 'potions', heal: false, poisonTargetId: 'p1' }, random))
    advance(match)
    expect(match.pendingWinner).toBe('village')
  })

  it('uses the same resolution for the preview and the real dawn', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: OTHER_VILLAGER }, random))
    const preview = match.previewDawn()
    expect(preview).toMatchObject({ victimId: VILLAGER, protectedId: OTHER_VILLAGER, deaths: [VILLAGER] })
    advance(match)
    expect(match.dawn?.deaths).toEqual(preview.deaths)
  })

  it('keeps the dawn report until the next night starts', () => {
    const match = nightMatch()
    unwrap(hunt(match, WOLF_ONE, VILLAGER))
    advance(match)
    advance(match, 3)
    expect(match.phase).toBe('execution')
    expect(match.dawn).not.toBeNull()
    advance(match)
    expect(match.phase).toBe('night')
    expect(match.dawn).toBeNull()
    expect(match.night.huntPicks).toEqual([])
  })

  it('ignores the actions of players who died during the night', () => {
    const night = new Night()
    night.pickPrey(WOLF_ONE, VILLAGER)
    const seats = seatsOf(NIGHT_ROLES).map((seat) => (seat.memberId === WOLF_ONE ? { ...seat, alive: false } : seat))
    expect(resolveDawn(night, seats, new Map()).deaths).toEqual([])
  })
})
