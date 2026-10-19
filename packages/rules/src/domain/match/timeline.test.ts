import { describe, expect, it } from 'vitest'
import {
  beginMatch,
  constantRandom,
  DOCTOR,
  DRUNK,
  NARRATOR_ID,
  NIGHT_ROLES,
  OTHER_VILLAGER,
  SEER,
  START_TIME,
  unwrap,
  VILLAGER,
  WITCH,
  WOLF_ONE,
  WOLF_TWO
} from './Match.fixtures'
import type { Match } from './Match'

const random = constantRandom(0.9)

const advance = (match: Match, times = 1) => {
  for (let step = 0; step < times; step += 1) unwrap(match.advance(NARRATOR_ID, START_TIME))
}

const huntTogether = (match: Match, targetId: string) => {
  unwrap(match.act(WOLF_ONE, { kind: 'hunt', targetId }, random))
  unwrap(match.act(WOLF_TWO, { kind: 'hunt', targetId }, random))
}

describe('Night entries', () => {
  it('records the hunt, the protection and the vision of a night without deaths', () => {
    const match = beginMatch({ roles: NIGHT_ROLES })
    huntTogether(match, VILLAGER)
    unwrap(match.act(DOCTOR, { kind: 'protect', targetId: VILLAGER }, random))
    unwrap(match.act(SEER, { kind: 'inspect', targetId: OTHER_VILLAGER }, random))
    advance(match)
    expect(match.timeline).toEqual([
      {
        kind: 'night',
        round: 1,
        victimId: VILLAGER,
        protectedId: VILLAGER,
        healed: false,
        poisonedId: null,
        visions: [{ seerId: SEER, targetId: OTHER_VILLAGER, isWolf: false, fromDrunk: false }],
        deaths: []
      }
    ])
  })

  it('records the heal, the poison, the Drunk vision and the deaths', () => {
    const match = beginMatch({ roles: NIGHT_ROLES })
    huntTogether(match, VILLAGER)
    unwrap(match.act(WITCH, { kind: 'potions', heal: true, poisonTargetId: OTHER_VILLAGER }, random))
    unwrap(match.act(DRUNK, { kind: 'inspect', targetId: VILLAGER }, constantRandom(0.2)))
    advance(match)
    expect(match.timeline).toEqual([
      {
        kind: 'night',
        round: 1,
        victimId: VILLAGER,
        protectedId: null,
        healed: true,
        poisonedId: OTHER_VILLAGER,
        visions: [{ seerId: DRUNK, targetId: VILLAGER, isWolf: true, fromDrunk: true }],
        deaths: [OTHER_VILLAGER]
      }
    ])
  })

  it('adds one entry per night with its own visions', () => {
    const match = beginMatch({ roles: NIGHT_ROLES })
    advance(match, 5)
    unwrap(match.act(SEER, { kind: 'inspect', targetId: WOLF_ONE }, random))
    advance(match)
    expect(match.timeline.map((entry) => [entry.kind, entry.round])).toEqual([
      ['night', 1],
      ['vote', 1],
      ['night', 2]
    ])
    expect(match.timeline[2]).toMatchObject({ visions: [{ seerId: SEER, targetId: WOLF_ONE, isWolf: true }] })
  })
})

describe('Vote entries', () => {
  it('always carry the voter ids, even when the live verdict is anonymous', () => {
    const match = beginMatch({ anonymousVotes: true })
    advance(match, 3)
    for (const voterId of ['p3', 'p4', 'p5']) unwrap(match.vote(voterId, WOLF_ONE))
    advance(match)
    expect(match.verdict?.tally).toEqual([{ targetId: WOLF_ONE, votes: 3, voterIds: null }])
    expect(match.timeline.at(-1)).toEqual({
      kind: 'vote',
      round: 1,
      verdict: {
        round: 1,
        tally: [{ targetId: WOLF_ONE, votes: 3, voterIds: ['p3', 'p4', 'p5'] }],
        executedId: WOLF_ONE,
        tie: false,
        foolWins: false
      }
    })
  })

  it('records a tie and the Fool win', () => {
    const tied = beginMatch()
    advance(tied, 3)
    unwrap(tied.vote('p3', WOLF_ONE))
    unwrap(tied.vote('p4', WOLF_TWO))
    advance(tied)
    expect(tied.timeline.at(-1)).toMatchObject({ kind: 'vote', verdict: { executedId: null, tie: true } })

    const foolish = beginMatch()
    advance(foolish, 3)
    for (const voterId of ['p3', 'p4', 'p5']) unwrap(foolish.vote(voterId, 'p7'))
    advance(foolish)
    expect(foolish.timeline.at(-1)).toMatchObject({ kind: 'vote', verdict: { executedId: 'p7', foolWins: true } })
  })
})

describe('Revenge entries', () => {
  const huntedHunterMatch = () => {
    const match = beginMatch()
    huntTogether(match, 'p6')
    advance(match)
    return match
  }

  it('records the shot taken', () => {
    const match = huntedHunterMatch()
    unwrap(match.avenge('p6', WOLF_ONE, START_TIME))
    expect(match.timeline.at(-1)).toEqual({ kind: 'revenge', round: 1, hunterId: 'p6', targetId: WOLF_ONE })
  })

  it('records the shot skipped without a target', () => {
    const match = huntedHunterMatch()
    unwrap(match.skipRevenge(NARRATOR_ID))
    expect(match.timeline.at(-1)).toEqual({ kind: 'revenge', round: 1, hunterId: 'p6', targetId: null })
  })
})

describe('Narrator entries', () => {
  it('records a kill and a revive that change who is alive', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p3', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p3', true))
    expect(match.timeline).toEqual([
      { kind: 'narrator', round: 1, memberId: 'p3', alive: false },
      { kind: 'narrator', round: 1, memberId: 'p3', alive: true }
    ])
  })

  it('records nothing when the state does not change', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p3', true))
    unwrap(match.setAlive(NARRATOR_ID, 'p3', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p3', false))
    expect(match.timeline).toHaveLength(1)
  })
})

describe('Outcome', () => {
  it('stays empty while the game runs and freezes the timeline and awards at the end', () => {
    const match = beginMatch()
    advance(match, 3)
    for (const voterId of ['p3', 'p4', 'p5']) unwrap(match.vote(voterId, WOLF_ONE))
    advance(match)
    expect(match.outcome).toBeNull()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.outcome).toMatchObject({ winner: 'village' })
    expect(match.outcome?.timeline).toEqual(match.timeline)
    expect(match.outcome?.timeline).not.toBe(match.timeline)
    expect(match.outcome?.awards).toEqual([
      { award: 'most-suspicious', memberId: WOLF_ONE, count: 3 },
      { award: 'worst-liar', memberId: WOLF_ONE, count: 1 },
      { award: 'silent-assassin', memberId: WOLF_TWO, count: null }
    ])
  })
})
