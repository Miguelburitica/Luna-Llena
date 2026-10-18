import type { TimelineEntry } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { outcomeOf, playerViewOf, youOf, narratorViewOf } from '../application/MatchGateway.fixtures'
import { factsOf, flavorLineOf, orderedAwards, plotTwistOf, timelineChapters } from './endGame'

const night = (round: number, overrides: Partial<Extract<TimelineEntry, { kind: 'night' }>> = {}): TimelineEntry => ({
  kind: 'night',
  round,
  victimId: null,
  protectedId: null,
  healed: false,
  poisonedId: null,
  visions: [],
  deaths: [],
  ...overrides
})

const vote = (round: number, overrides: Partial<Extract<TimelineEntry, { kind: 'vote' }>['verdict']> = {}): TimelineEntry => ({
  kind: 'vote',
  round,
  verdict: { round, tally: [], executedId: null, tie: false, foolWins: false, ...overrides }
})

const revenge = (round: number, targetId: string | null = 'id-Luis'): TimelineEntry => ({
  kind: 'revenge',
  round,
  hunterId: 'id-Ana',
  targetId
})

const narrator = (round: number, alive: boolean): TimelineEntry => ({ kind: 'narrator', round, memberId: 'id-Juan', alive })

const haunt = (round: number, overrides: Partial<Extract<TimelineEntry, { kind: 'haunt' }>> = {}): TimelineEntry => ({
  kind: 'haunt',
  round,
  ghostId: 'id-Juan',
  haunt: 'flicker',
  targetId: null,
  word: null,
  ...overrides
})

const roleOf = (memberId: string) => (memberId === 'id-Luis' ? ('werewolf' as const) : null)

describe('timelineChapters', () => {
  it('opens a night and a day chapter per round, in order', () => {
    const outcome = outcomeOf({ timeline: [night(1), vote(1), night(2), vote(2)] })
    expect(timelineChapters(outcome).map((chapter) => chapter.id)).toEqual(['night-1', 'day-1', 'night-2', 'day-2'])
  })

  it('files revenge and narrator entries before the round vote under the night', () => {
    const outcome = outcomeOf({ timeline: [narrator(1, false), night(1), revenge(1), vote(1)] })
    const [first, second] = timelineChapters(outcome)
    expect(first?.entries.map((entry) => entry.kind)).toEqual(['narrator', 'night', 'revenge'])
    expect(second?.entries.map((entry) => entry.kind)).toEqual(['vote'])
  })

  it('files revenge and narrator entries after the vote under the day', () => {
    const outcome = outcomeOf({ timeline: [night(1), vote(1), revenge(1), narrator(1, true), night(2)] })
    const chapters = timelineChapters(outcome)
    expect(chapters.map((chapter) => chapter.entries.map((entry) => entry.kind))).toEqual([
      ['night'],
      ['vote', 'revenge', 'narrator'],
      ['night']
    ])
  })

  it('files a haunt after the night resolved under the day, and one before it under the night', () => {
    const outcome = outcomeOf({ timeline: [haunt(1), night(1), haunt(1), vote(1), haunt(1), night(2)] })
    expect(timelineChapters(outcome).map((chapter) => chapter.entries.map((entry) => entry.kind))).toEqual([
      ['haunt', 'night'],
      ['haunt', 'vote', 'haunt'],
      ['night']
    ])
  })

  it('gives a round with only a day its own chapter and none for an empty timeline', () => {
    expect(timelineChapters(outcomeOf({ timeline: [vote(3)] })).map((chapter) => chapter.id)).toEqual(['day-3'])
    expect(timelineChapters(outcomeOf())).toEqual([])
  })
})

describe('plotTwistOf', () => {
  const players = [
    { id: 'id-Caro', alive: true, revealedRole: 'drunk' as const },
    { id: 'id-Ana', alive: true, revealedRole: 'seer' as const }
  ]

  it('names the card the player saw and the role they truly had', () => {
    const view = playerViewOf({ players, you: youOf({ role: 'seer' }) })
    expect(plotTwistOf(view, 'id-Caro')).toEqual({ seen: 'seer', was: 'drunk' })
  })

  it('is empty when the card told the truth, and for the narrator', () => {
    expect(plotTwistOf(playerViewOf({ players, you: youOf({ role: 'seer' }) }), 'id-Ana')).toBeNull()
    expect(plotTwistOf(narratorViewOf({ players, roles: { 'id-Caro': 'drunk' } }), 'id-Caro')).toBeNull()
  })
})

describe('flavorLineOf', () => {
  it('points at one flavor line per winner', () => {
    expect(flavorLineOf('wolves')).toBe('match.over.flavor.wolves')
  })
})

describe('factsOf', () => {
  it('tells a night fact by fact', () => {
    const entry = night(1, {
      victimId: 'id-Ana',
      protectedId: 'id-Ana',
      healed: true,
      poisonedId: 'id-Sofi',
      visions: [
        { seerId: 'id-Marta', targetId: 'id-Sofi', isWolf: false, fromDrunk: false },
        { seerId: 'id-Caro', targetId: 'id-Luis', isWolf: true, fromDrunk: true }
      ],
      deaths: ['id-Sofi']
    })
    expect(factsOf(entry, roleOf).map((fact) => [fact.key, fact.memberIds])).toEqual([
      ['hunt', ['id-Ana']],
      ['doctorSaved', ['id-Ana']],
      ['witchHealed', ['id-Ana']],
      ['witchPoisoned', ['id-Sofi']],
      ['visionClear', ['id-Sofi']],
      ['drunkVisionWolf', ['id-Luis']],
      ['died', ['id-Sofi']]
    ])
  })

  it('tells a quiet night', () => {
    expect(factsOf(night(1, { protectedId: 'id-Juan' }), roleOf).map((fact) => fact.key)).toEqual([
      'noVictim',
      'doctorProtected',
      'noDeaths'
    ])
  })

  it('tells an execution with who voted for whom and the true role', () => {
    const entry = vote(2, {
      tally: [
        { targetId: 'id-Luis', votes: 2, voterIds: ['id-Ana', 'id-Juan'] },
        { targetId: 'id-Tato', votes: 1, voterIds: ['id-Luis'] }
      ],
      executedId: 'id-Luis',
      foolWins: true
    })
    expect(factsOf(entry, roleOf)).toEqual([
      { key: 'ballot', memberIds: ['id-Luis', 'id-Ana', 'id-Juan'], count: 2, role: null },
      { key: 'ballot', memberIds: ['id-Tato', 'id-Luis'], count: 1, role: null },
      { key: 'executed', memberIds: ['id-Luis'], count: 2, role: null },
      { key: 'executedRole', memberIds: ['id-Luis'], count: 0, role: 'werewolf' },
      { key: 'foolWon', memberIds: ['id-Luis'], count: 0, role: null }
    ])
  })

  it('tells a tie and an empty vote', () => {
    const tie = vote(1, {
      tie: true,
      tally: [
        { targetId: 'id-Luis', votes: 3, voterIds: ['id-Ana'] },
        { targetId: 'id-Tato', votes: 3, voterIds: ['id-Juan'] }
      ]
    })
    expect(factsOf(tie, roleOf).at(-1)).toEqual({ key: 'tie', memberIds: ['id-Luis', 'id-Tato'], count: 3, role: null })
    expect(factsOf(vote(1), roleOf).map((fact) => fact.key)).toEqual(['noVotes'])
  })

  it('tells the Hunter and the narrator', () => {
    expect(factsOf(revenge(1), roleOf).map((fact) => [fact.key, fact.memberIds])).toEqual([['hunterShot', ['id-Ana', 'id-Luis']]])
    expect(factsOf(revenge(1, null), roleOf)[0]?.key).toBe('hunterHeld')
    expect(factsOf(narrator(1, false), roleOf)[0]?.key).toBe('narratorKilled')
    expect(factsOf(narrator(1, true), roleOf)[0]?.key).toBe('narratorRevived')
  })
})

describe('factsOf haunts', () => {
  it('tells a flicker with the ghost', () => {
    expect(factsOf(haunt(1), roleOf)).toEqual([{ key: 'hauntFlicker', memberIds: ['id-Juan'], count: 0, role: null }])
  })

  it('tells a whisper with the ghost, the target and the word', () => {
    const whisper = haunt(1, { haunt: 'whisper', targetId: 'id-Marta', word: 'bakery' })
    expect(factsOf(whisper, roleOf)).toEqual([
      { key: 'hauntWhisper', memberIds: ['id-Juan', 'id-Marta'], count: 0, role: null, word: 'bakery' }
    ])
  })
})

describe('orderedAwards', () => {
  it('follows the award vocabulary order and skips what is absent', () => {
    const chatterbox = { award: 'chatterbox' as const, memberId: 'id-Ana', count: 4 }
    const liar = { award: 'worst-liar' as const, memberId: 'id-Luis', count: 2 }
    const suspicious = { award: 'most-suspicious' as const, memberId: 'id-Tato', count: 9 }
    expect(orderedAwards([chatterbox, liar, null, suspicious])).toEqual([suspicious, liar, chatterbox])
    expect(orderedAwards([null])).toEqual([])
  })
})
