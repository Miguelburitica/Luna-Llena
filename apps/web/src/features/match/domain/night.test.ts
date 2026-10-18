import { describe, expect, it } from 'vitest'
import { memberView } from '@/features/room/domain/snapshot.fixtures'
import { narratorViewOf, playerViewOf } from '../application/MatchGateway.fixtures'
import {
  actionLineOf,
  deathsAnnouncement,
  offeredTargetsFor,
  packAgreement,
  targetsFor
} from './night'
import { seatsOf } from './seating'

const names = ['Ana', 'Juan', 'Luis', 'Tato']
const members = names.map((name) => memberView(name))

const players = [
  { id: 'id-Ana', alive: true, revealedRole: null },
  { id: 'id-Juan', alive: false, revealedRole: 'doctor' as const },
  { id: 'id-Luis', alive: true, revealedRole: null },
  { id: 'id-Tato', alive: true, revealedRole: null }
]

const seatsFor = (packIds: string[] = []) => seatsOf(playerViewOf({ players }), members, 'id-Ana', packIds)

const reasons = (view: ReturnType<typeof playerViewOf>, packIds: string[] = []) =>
  Object.fromEntries(targetsFor(view, seatsFor(packIds)).map((target) => [target.seat.name, target.blocked]))

describe('targetsFor', () => {
  it('offers nothing outside the night', () => {
    expect(targetsFor(playerViewOf({ players }), seatsFor())).toEqual([])
  })

  it('blocks the dead, yourself and your pack when hunting', () => {
    const view = playerViewOf({
      players,
      you: { role: 'werewolf', team: 'wolves', packIds: ['id-Luis'], night: { action: 'hunt', targetId: null, packPicks: {}, packVictimId: null }, visions: [] }
    })
    expect(reasons(view, ['id-Luis'])).toEqual({ Ana: 'self', Juan: 'dead', Luis: 'wolf', Tato: null })
  })

  it('blocks the dead and yourself when inspecting, suspecting or poisoning', () => {
    const inspect = { action: 'inspect', targetId: null, vision: null } as const
    const suspect = { action: 'suspect', targetId: null } as const
    const potions = { action: 'potions', acted: false, victimId: null, heal: false, poisonTargetId: null, healAvailable: true, poisonAvailable: true } as const
    for (const night of [inspect, suspect, potions]) {
      const view = playerViewOf({ players, you: { role: 'seer', team: 'village', packIds: [], night, visions: [] } })
      expect(reasons(view)).toEqual({ Ana: 'self', Juan: 'dead', Luis: null, Tato: null })
    }
  })

  it('lets the Doctor protect themselves but not last night’s patient', () => {
    const view = playerViewOf({
      players,
      you: { role: 'doctor', team: 'village', packIds: [], night: { action: 'protect', targetId: null, blockedTargetId: 'id-Luis' }, visions: [] }
    })
    expect(reasons(view)).toEqual({ Ana: null, Juan: 'dead', Luis: 'last-night', Tato: null })
  })

  it('offers only the seats a player can pick or see explained', () => {
    const view = playerViewOf({
      players,
      you: { role: 'doctor', team: 'village', packIds: [], night: { action: 'protect', targetId: null, blockedTargetId: 'id-Luis' }, visions: [] }
    })
    expect(offeredTargetsFor(view, seatsFor()).map((target) => target.seat.name)).toEqual(['Ana', 'Luis', 'Tato'])
  })
})

describe('packAgreement', () => {
  it('is the target every wolf picked', () => {
    expect(packAgreement({ a: 'x', b: 'x' })).toBe('x')
  })

  it('is nothing when the pack is split or has not picked', () => {
    expect(packAgreement({ a: 'x', b: 'y' })).toBeNull()
    expect(packAgreement({})).toBeNull()
  })

  it('needs every wolf of the pack to have picked', () => {
    expect(packAgreement({ a: 'x' }, 2)).toBeNull()
    expect(packAgreement({ a: 'x' }, 1)).toBe('x')
  })
})

describe('deathsAnnouncement', () => {
  it('is nothing before dawn reports', () => {
    expect(deathsAnnouncement(playerViewOf({ players }))).toBeNull()
  })

  it('lists who died with the role the house rule revealed', () => {
    expect(deathsAnnouncement(playerViewOf({ players, dawn: { round: 1, deaths: ['id-Juan'] } }))).toEqual([
      { id: 'id-Juan', role: 'doctor' }
    ])
  })

  it('is an empty list when nobody died', () => {
    expect(deathsAnnouncement(narratorViewOf({ players, dawn: { round: 1, deaths: [] } }))).toEqual([])
  })
})

describe('actionLineOf', () => {
  const action = {
    action: 'hunt',
    acted: true,
    targetId: 'id-Juan',
    visionIsWolf: null,
    fromDrunk: false,
    heal: false,
    poisonTargetId: null
  } as const

  it('describes what each role did', () => {
    expect(actionLineOf(action)).toMatchObject({ key: 'picked', icon: 'paw', targetId: 'id-Juan', waiting: false })
    expect(actionLineOf({ ...action, action: 'protect' })).toMatchObject({ key: 'protecting', icon: 'shield' })
    expect(actionLineOf({ ...action, action: 'suspect' })).toMatchObject({ key: 'suspects', icon: 'help' })
  })

  it('shows the inspection result and marks the Drunk', () => {
    const inspected = { ...action, action: 'inspect', visionIsWolf: true } as const
    expect(actionLineOf(inspected)).toMatchObject({ key: 'inspected', icon: 'eye', outcome: 'wolf' })
    expect(actionLineOf({ ...inspected, visionIsWolf: false, fromDrunk: true })).toMatchObject({
      key: 'drunkInspected',
      icon: 'beer',
      outcome: 'notWolf'
    })
  })

  it('describes each potion choice', () => {
    const potions = { ...action, action: 'potions' } as const
    expect(actionLineOf({ ...potions, heal: true, poisonTargetId: 'id-Luis' })).toMatchObject({ key: 'healAndPoison', targetId: 'id-Luis' })
    expect(actionLineOf({ ...potions, heal: true, targetId: null })).toMatchObject({ key: 'heal' })
    expect(actionLineOf({ ...potions, poisonTargetId: 'id-Luis' })).toMatchObject({ key: 'poison', targetId: 'id-Luis' })
    expect(actionLineOf(potions)).toMatchObject({ key: 'nothing' })
  })

  it('waits for whoever has not acted', () => {
    expect(actionLineOf({ ...action, acted: false })).toMatchObject({ key: 'idle', icon: 'hourglass', waiting: true })
    expect(actionLineOf({ ...action, action: 'potions', acted: false })).toMatchObject({ key: 'deciding', waiting: true })
  })
})
