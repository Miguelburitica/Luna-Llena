import { describe, expect, it } from 'vitest'
import { beginMatch, constantRandom, NARRATOR_ID, START_TIME, unwrap } from './Match.fixtures'
import type { Match } from './Match'

const WOLF_ONE = 'p1'
const WOLF_TWO = 'p2'
const SEER = 'p3'
const DOCTOR = 'p4'
const WITCH = 'p5'
const HUNTER = 'p6'
const FOOL = 'p7'

const rejected = (code: string) => ({ ok: false, error: { code } })

const advance = (match: Match, times = 1) => {
  for (let step = 0; step < times; step += 1) unwrap(match.advance(NARRATOR_ID, START_TIME))
}

const voteOpen = (anonymousVotes = false): Match => {
  const match = beginMatch({ anonymousVotes })
  advance(match, 3)
  return match
}

const castAll = (match: Match, votes: Record<string, string[]>) => {
  for (const [targetId, voterIds] of Object.entries(votes)) {
    for (const voterId of voterIds) unwrap(match.vote(voterId, targetId))
  }
}

const executeWith = (match: Match, votes: Record<string, string[]>) => {
  castAll(match, votes)
  advance(match)
}

const killHunterAtDawn = (): Match => {
  const match = beginMatch()
  unwrap(match.act(WOLF_ONE, { kind: 'hunt', targetId: HUNTER }, constantRandom(0)))
  unwrap(match.act(WOLF_TWO, { kind: 'hunt', targetId: HUNTER }, constantRandom(0)))
  advance(match)
  return match
}

describe('Casting a vote', () => {
  it('records a first vote that can still change or clear', () => {
    const match = voteOpen()
    unwrap(match.vote(SEER, WOLF_ONE))
    expect(match.voteOf(SEER)).toEqual({ targetId: WOLF_ONE, locked: false })
    unwrap(match.vote(SEER, WOLF_TWO))
    expect(match.voteOf(SEER)).toEqual({ targetId: WOLF_TWO, locked: false })
    unwrap(match.vote(SEER, null))
    expect(match.voteOf(SEER)).toEqual({ targetId: null, locked: false })
  })

  it('rejects a vote outside the vote phase', () => {
    const match = beginMatch()
    expect(match.vote(SEER, WOLF_ONE)).toEqual(rejected('not-vote'))
    advance(match, 2)
    expect(match.vote(SEER, WOLF_ONE)).toEqual(rejected('not-vote'))
    expect(match.lockVote(SEER)).toEqual(rejected('not-vote'))
  })

  it('rejects a vote for yourself, the dead or an unknown player', () => {
    const match = voteOpen()
    unwrap(match.setAlive(NARRATOR_ID, DOCTOR, false))
    expect(match.vote(SEER, SEER)).toEqual(rejected('target-invalid'))
    expect(match.vote(SEER, DOCTOR)).toEqual(rejected('target-invalid'))
    expect(match.vote(SEER, 'ghost')).toEqual(rejected('target-invalid'))
    expect(match.vote(SEER, NARRATOR_ID)).toEqual(rejected('target-invalid'))
    expect(match.vote(SEER, undefined)).toEqual(rejected('target-invalid'))
    expect(match.voteOf(SEER)).toEqual({ targetId: null, locked: false })
  })

  it('rejects the narrator, the dead and a finished match', () => {
    const match = voteOpen()
    unwrap(match.setAlive(NARRATOR_ID, DOCTOR, false))
    expect(match.vote(NARRATOR_ID, SEER)).toEqual(rejected('not-your-action'))
    expect(match.vote(DOCTOR, SEER)).toEqual(rejected('player-dead'))
    expect(match.lockVote(DOCTOR)).toEqual(rejected('player-dead'))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.vote(SEER, WITCH)).toEqual(rejected('match-over'))
    expect(match.lockVote(SEER)).toEqual(rejected('match-over'))
  })

  it('starts every vote phase with an empty ballot', () => {
    const match = voteOpen()
    unwrap(match.vote(SEER, WOLF_ONE))
    unwrap(match.lockVote(SEER))
    advance(match, 2)
    advance(match, 3)
    expect(match.phase).toBe('vote')
    expect(match.voteOf(SEER)).toEqual({ targetId: null, locked: false })
    expect(match.votingProgress()).toEqual({ voters: 6, voted: 0, locked: 0 })
  })
})

describe('Locking a vote', () => {
  it('keeps a locked vote on its target', () => {
    const match = voteOpen()
    unwrap(match.vote(SEER, WOLF_ONE))
    unwrap(match.lockVote(SEER))
    expect(match.voteOf(SEER)).toEqual({ targetId: WOLF_ONE, locked: true })
    expect(match.vote(SEER, WOLF_TWO)).toEqual(rejected('vote-locked'))
    expect(match.vote(SEER, null)).toEqual(rejected('vote-locked'))
    expect(match.lockVote(SEER)).toEqual(rejected('vote-locked'))
    expect(match.voteOf(SEER)).toEqual({ targetId: WOLF_ONE, locked: true })
  })

  it('rejects locking without a vote', () => {
    const match = voteOpen()
    expect(match.lockVote(SEER)).toEqual(rejected('target-invalid'))
  })

  it('counts voted and locked among the living', () => {
    const match = voteOpen()
    unwrap(match.setAlive(NARRATOR_ID, FOOL, false))
    castAll(match, { [WOLF_ONE]: [SEER, DOCTOR, WITCH] })
    unwrap(match.lockVote(SEER))
    expect(match.votingProgress()).toEqual({ voters: 6, voted: 3, locked: 1 })
  })
})

describe('The verdict', () => {
  it('executes the player with the most votes and orders the tally', () => {
    const match = voteOpen()
    executeWith(match, {
      [WOLF_ONE]: [WOLF_TWO, SEER, DOCTOR, WITCH],
      [WOLF_TWO]: [HUNTER, FOOL],
      [SEER]: [WOLF_ONE]
    })
    expect(match.phase).toBe('execution')
    expect(match.verdict).toEqual({
      round: 1,
      tally: [
        { targetId: WOLF_ONE, votes: 4, voterIds: [WOLF_TWO, SEER, DOCTOR, WITCH] },
        { targetId: WOLF_TWO, votes: 2, voterIds: [HUNTER, FOOL] },
        { targetId: SEER, votes: 1, voterIds: [WOLF_ONE] }
      ],
      executedId: WOLF_ONE,
      tie: false,
      foolWins: false
    })
    expect(match.seats.find((seat) => seat.memberId === WOLF_ONE)?.alive).toBe(false)
  })

  it('orders equal counts by seat order', () => {
    const match = voteOpen()
    executeWith(match, { [WITCH]: [WOLF_ONE, WOLF_TWO], [SEER]: [DOCTOR], [WOLF_TWO]: [HUNTER] })
    expect(match.verdict?.tally.map((entry) => entry.targetId)).toEqual([WITCH, WOLF_TWO, SEER])
    expect(match.verdict?.executedId).toBe(WITCH)
  })

  it('spares everyone on a tie', () => {
    const match = voteOpen()
    executeWith(match, { [WOLF_ONE]: [SEER, DOCTOR, WITCH], [WOLF_TWO]: [HUNTER, FOOL, WOLF_ONE] })
    expect(match.verdict).toMatchObject({ executedId: null, tie: true })
    expect(match.seats.every((seat) => seat.alive)).toBe(true)
  })

  it('spares everyone when nobody voted', () => {
    const match = voteOpen()
    advance(match)
    expect(match.verdict).toEqual({ round: 1, tally: [], executedId: null, tie: false, foolWins: false })
    expect(match.seats.every((seat) => seat.alive)).toBe(true)
  })

  it('hides who voted for whom when votes are anonymous', () => {
    const match = voteOpen(true)
    executeWith(match, { [WOLF_ONE]: [SEER, DOCTOR], [WOLF_TWO]: [WITCH] })
    expect(match.verdict?.tally).toEqual([
      { targetId: WOLF_ONE, votes: 2, voterIds: null },
      { targetId: WOLF_TWO, votes: 1, voterIds: null }
    ])
    expect(match.verdict?.executedId).toBe(WOLF_ONE)
  })

  it('counts unlocked votes at their latest value', () => {
    const match = voteOpen()
    unwrap(match.vote(SEER, WOLF_ONE))
    unwrap(match.vote(SEER, WOLF_TWO))
    unwrap(match.vote(DOCTOR, WOLF_ONE))
    unwrap(match.lockVote(DOCTOR))
    advance(match)
    expect(match.verdict?.tally.map((entry) => [entry.targetId, entry.votes])).toEqual([
      [WOLF_ONE, 1],
      [WOLF_TWO, 1]
    ])
    expect(match.verdict?.tie).toBe(true)
  })

  it('ignores votes of the dead and votes for the dead', () => {
    const match = voteOpen()
    castAll(match, { [WOLF_ONE]: [SEER, DOCTOR, WITCH], [WOLF_TWO]: [HUNTER] })
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    advance(match)
    expect(match.verdict?.tally).toEqual([{ targetId: WOLF_TWO, votes: 1, voterIds: [HUNTER] }])
    expect(match.verdict?.executedId).toBe(WOLF_TWO)
  })

  it('keeps the verdict through the execution and clears it when the next night begins', () => {
    const match = voteOpen()
    executeWith(match, { [WOLF_ONE]: [SEER] })
    expect(match.verdict).not.toBeNull()
    advance(match)
    expect(match.phase).toBe('night')
    expect(match.verdict).toBeNull()
  })

  it('asks to end the game when the village executes the last werewolf', () => {
    const match = voteOpen()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    expect(match.pendingWinner).toBeNull()
    executeWith(match, { [WOLF_ONE]: [SEER, DOCTOR, WITCH] })
    expect(match.pendingWinner).toBe('village')
  })
})

describe('The Fool', () => {
  it('wins alone when the village executes them and the game goes on', () => {
    const match = voteOpen()
    executeWith(match, { [FOOL]: [SEER, DOCTOR, WITCH] })
    expect(match.verdict).toMatchObject({ executedId: FOOL, foolWins: true })
    expect(match.soloWinnerIds).toEqual([FOOL])
    expect(match.pendingWinner).toBeNull()
    expect(match.outcome).toBeNull()
  })

  it('does not win when the wolves kill them at night', () => {
    const match = beginMatch()
    unwrap(match.act(WOLF_ONE, { kind: 'hunt', targetId: FOOL }, constantRandom(0)))
    unwrap(match.act(WOLF_TWO, { kind: 'hunt', targetId: FOOL }, constantRandom(0)))
    advance(match)
    expect(match.seats.find((seat) => seat.memberId === FOOL)?.alive).toBe(false)
    expect(match.soloWinnerIds).toEqual([])
    expect(match.verdict).toBeNull()
  })

  it('stays recorded when the wolves win later', () => {
    const match = voteOpen()
    executeWith(match, { [FOOL]: [SEER, DOCTOR, WITCH] })
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    unwrap(match.setAlive(NARRATOR_ID, DOCTOR, false))
    expect(match.pendingWinner).toBe('wolves')
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.outcome).toEqual({ winner: 'wolves' })
    expect(match.soloWinnerIds).toEqual([FOOL])
  })
})

describe('Hunter revenge', () => {
  it('opens a shot when the wolves kill the Hunter and kills the pick at once', () => {
    const match = killHunterAtDawn()
    expect(match.revenge).toEqual({ hunterId: HUNTER, targetId: null, pending: true })
    unwrap(match.avenge(HUNTER, SEER))
    expect(match.revenge).toEqual({ hunterId: HUNTER, targetId: SEER, pending: false })
    expect(match.seats.find((seat) => seat.memberId === SEER)?.alive).toBe(false)
  })

  it('opens a shot when the village executes the Hunter', () => {
    const match = voteOpen()
    executeWith(match, { [HUNTER]: [SEER, DOCTOR, WITCH] })
    expect(match.revenge).toEqual({ hunterId: HUNTER, targetId: null, pending: true })
    unwrap(match.avenge(HUNTER, WOLF_ONE))
    expect(match.seats.find((seat) => seat.memberId === WOLF_ONE)?.alive).toBe(false)
  })

  it('opens a shot when the narrator kills the Hunter', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, HUNTER, false))
    expect(match.revenge).toEqual({ hunterId: HUNTER, targetId: null, pending: true })
  })

  it('opens a shot when the Witch poisons the Hunter', () => {
    const match = beginMatch()
    unwrap(match.act(WITCH, { kind: 'potions', heal: false, poisonTargetId: HUNTER }, constantRandom(0)))
    advance(match)
    expect(match.revenge).toMatchObject({ hunterId: HUNTER, pending: true })
  })

  it('does not open a shot for other roles or for a dead player killed again', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    expect(match.revenge).toBeNull()
    unwrap(match.setAlive(NARRATOR_ID, HUNTER, false))
    unwrap(match.skipRevenge(NARRATOR_ID))
    unwrap(match.setAlive(NARRATOR_ID, HUNTER, false))
    expect(match.revenge).toMatchObject({ pending: false })
  })

  it('blocks advancing while the shot is pending', () => {
    const match = killHunterAtDawn()
    expect(match.advance(NARRATOR_ID, START_TIME)).toEqual(rejected('revenge-pending'))
    expect(match.phase).toBe('dawn')
  })

  it('lets the narrator skip the shot and advance again', () => {
    const match = killHunterAtDawn()
    unwrap(match.skipRevenge(NARRATOR_ID))
    expect(match.seats.filter((seat) => !seat.alive).map((seat) => seat.memberId)).toEqual([HUNTER])
    advance(match)
    expect(match.phase).toBe('day')
    expect(match.revenge).toBeNull()
  })

  it('keeps the resolved shot visible until the next advance', () => {
    const match = killHunterAtDawn()
    unwrap(match.avenge(HUNTER, FOOL))
    expect(match.revenge).toMatchObject({ targetId: FOOL, pending: false })
    advance(match)
    expect(match.revenge).toBeNull()
  })

  it('rejects a pick by anyone but the pending Hunter', () => {
    const match = killHunterAtDawn()
    expect(match.avenge(SEER, WOLF_ONE)).toEqual(rejected('no-revenge'))
    expect(match.avenge(NARRATOR_ID, WOLF_ONE)).toEqual(rejected('no-revenge'))
    expect(match.revenge?.pending).toBe(true)
  })

  it('rejects a pick with no shot pending and a skip with no shot pending', () => {
    const match = beginMatch()
    expect(match.avenge(HUNTER, WOLF_ONE)).toEqual(rejected('no-revenge'))
    expect(match.skipRevenge(NARRATOR_ID)).toEqual(rejected('no-revenge'))
    const resolved = killHunterAtDawn()
    unwrap(resolved.avenge(HUNTER, WOLF_ONE))
    expect(resolved.avenge(HUNTER, WOLF_TWO)).toEqual(rejected('no-revenge'))
    expect(resolved.skipRevenge(NARRATOR_ID)).toEqual(rejected('no-revenge'))
  })

  it('rejects the narrator-only skip from a player', () => {
    expect(killHunterAtDawn().skipRevenge(SEER)).toEqual(rejected('not-narrator'))
  })

  it('rejects dead, unknown and self targets', () => {
    const match = killHunterAtDawn()
    expect(match.avenge(HUNTER, HUNTER)).toEqual(rejected('target-invalid'))
    expect(match.avenge(HUNTER, 'ghost')).toEqual(rejected('target-invalid'))
    expect(match.avenge(HUNTER, undefined)).toEqual(rejected('target-invalid'))
    expect(match.revenge?.pending).toBe(true)
  })

  it('asks to end the game when the shot kills the last werewolf', () => {
    const match = killHunterAtDawn()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.avenge(HUNTER, WOLF_ONE))
    expect(match.pendingWinner).toBe('village')
  })

  it('rejects a shot once the match is over', () => {
    const match = killHunterAtDawn()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.avenge(HUNTER, SEER)).toEqual(rejected('match-over'))
  })
})
