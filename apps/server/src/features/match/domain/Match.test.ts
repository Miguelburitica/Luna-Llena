import { describe, expect, it } from 'vitest'
import { beginMatch, NARRATOR_ID, START_TIME, unwrap } from './Match.fixtures'

const notNarrator = { ok: false, error: { code: 'not-narrator' } }
const matchOver = { ok: false, error: { code: 'match-over' } }

const advanceTimes = (match: ReturnType<typeof beginMatch>, times: number, now = START_TIME) => {
  for (let step = 0; step < times; step += 1) unwrap(match.advance(NARRATOR_ID, now))
}

describe('Phase cycle', () => {
  it('starts at night 1', () => {
    const match = beginMatch()
    expect(match.phase).toBe('night')
    expect(match.round).toBe(1)
  })

  it('follows night, dawn, day, vote, execution and a new night with the next round', () => {
    const match = beginMatch()
    const seen = []
    for (let step = 0; step < 5; step += 1) {
      unwrap(match.advance(NARRATOR_ID, START_TIME))
      seen.push([match.phase, match.round])
    }
    expect(seen).toEqual([
      ['dawn', 1],
      ['day', 1],
      ['vote', 1],
      ['execution', 1],
      ['night', 2]
    ])
  })

  it('shows night 2 after advancing five times from night 1', () => {
    const match = beginMatch()
    advanceTimes(match, 5)
    expect([match.phase, match.round]).toEqual(['night', 2])
  })

  it('rejects a player advancing the phase', () => {
    const match = beginMatch()
    expect(match.advance('p1', START_TIME)).toEqual(notNarrator)
    expect(match.phase).toBe('night')
  })
})

describe('Phase timers', () => {
  it('counts down 60 seconds from the start of night 1', () => {
    expect(beginMatch({ timers: { night: 60 } }).phaseEndsAt).toBe(START_TIME + 60_000)
  })

  it('has no end time for dawn and execution', () => {
    const match = beginMatch()
    advanceTimes(match, 1)
    expect([match.phase, match.phaseEndsAt]).toEqual(['dawn', null])
    advanceTimes(match, 3)
    expect([match.phase, match.phaseEndsAt]).toEqual(['execution', null])
  })

  it('starts the day and vote countdowns when those phases begin', () => {
    const match = beginMatch({ timers: { day: 120, vote: 30 } })
    advanceTimes(match, 2, START_TIME + 5_000)
    expect([match.phase, match.phaseEndsAt]).toEqual(['day', START_TIME + 5_000 + 120_000])
    advanceTimes(match, 1, START_TIME + 9_000)
    expect([match.phase, match.phaseEndsAt]).toEqual(['vote', START_TIME + 9_000 + 30_000])
  })

  it('has no countdown for a manual day', () => {
    const match = beginMatch({ timers: { day: 0 } })
    advanceTimes(match, 2)
    expect([match.phase, match.phaseEndsAt]).toEqual(['day', null])
  })

  it('adds 30 seconds to a running timer', () => {
    const match = beginMatch({ timers: { vote: 60 } })
    advanceTimes(match, 3, START_TIME)
    const tenSecondsLeftAt = START_TIME + 50_000
    expect((match.phaseEndsAt ?? 0) - tenSecondsLeftAt).toBe(10_000)
    unwrap(match.extendTimer(NARRATOR_ID))
    expect((match.phaseEndsAt ?? 0) - tenSecondsLeftAt).toBe(40_000)
  })

  it('rejects more time when no timer runs', () => {
    const match = beginMatch({ timers: { night: 0 } })
    expect(match.extendTimer(NARRATOR_ID)).toEqual({ ok: false, error: { code: 'timer-not-running' } })
  })

  it('rejects more time from a player', () => {
    expect(beginMatch().extendTimer('p1')).toEqual(notNarrator)
  })
})

describe('Alive and dead', () => {
  it('marks a player dead and alive again', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p3', false))
    expect(match.seats.find((seat) => seat.memberId === 'p3')?.alive).toBe(false)
    unwrap(match.setAlive(NARRATOR_ID, 'p3', true))
    expect(match.seats.find((seat) => seat.memberId === 'p3')?.alive).toBe(true)
  })

  it('rejects an unknown member and a player acting', () => {
    const match = beginMatch()
    expect(match.setAlive(NARRATOR_ID, 'ghost', false)).toEqual({ ok: false, error: { code: 'member-not-found' } })
    expect(match.setAlive(NARRATOR_ID, NARRATOR_ID, false)).toEqual({ ok: false, error: { code: 'member-not-found' } })
    expect(match.setAlive('p1', 'p2', false)).toEqual(notNarrator)
  })
})

describe('Win detection', () => {
  it('asks to end the game for the village when the last werewolf falls', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    expect(match.pendingWinner).toBeNull()
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    expect(match.pendingWinner).toBe('village')
  })

  it('asks to end the game for the wolves when they are as many as the others', () => {
    const match = beginMatch()
    for (const memberId of ['p3', 'p4']) unwrap(match.setAlive(NARRATOR_ID, memberId, false))
    expect(match.pendingWinner).toBeNull()
    unwrap(match.setAlive(NARRATOR_ID, 'p5', false))
    expect(match.pendingWinner).toBe('wolves')
  })

  it('clears the question when the narrator keeps playing', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    unwrap(match.keepPlaying(NARRATOR_ID))
    expect(match.pendingWinner).toBeNull()
    expect(match.outcome).toBeNull()
  })

  it('asks again after the next change to who is alive', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    unwrap(match.keepPlaying(NARRATOR_ID))
    unwrap(match.setAlive(NARRATOR_ID, 'p3', false))
    expect(match.pendingWinner).toBe('village')
  })

  it('withdraws the question when a player is revived', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', true))
    expect(match.pendingWinner).toBeNull()
  })

  it('rejects keep playing from a player', () => {
    expect(beginMatch().keepPlaying('p1')).toEqual(notNarrator)
  })
})

describe('Ending the game', () => {
  it('ends with the village as winner', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.outcome).toMatchObject({ winner: 'village' })
  })

  it('rejects ending while no team has won', () => {
    const match = beginMatch()
    expect(match.endGame(NARRATOR_ID)).toEqual({ ok: false, error: { code: 'no-winner-yet' } })
    expect(match.outcome).toBeNull()
  })

  it('rejects ending by a player', () => {
    expect(beginMatch().endGame('p1')).toEqual(notNarrator)
  })

  it('rejects every narrator command once the match is over', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, 'p1', false))
    unwrap(match.setAlive(NARRATOR_ID, 'p2', false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.advance(NARRATOR_ID, START_TIME)).toEqual(matchOver)
    expect(match.extendTimer(NARRATOR_ID)).toEqual(matchOver)
    expect(match.setAlive(NARRATOR_ID, 'p1', true)).toEqual(matchOver)
    expect(match.keepPlaying(NARRATOR_ID)).toEqual(matchOver)
    expect(match.endGame(NARRATOR_ID)).toEqual(matchOver)
  })
})

describe('Membership', () => {
  it('knows the narrator and the seated players only', () => {
    const match = beginMatch()
    expect(match.hasMember(NARRATOR_ID)).toBe(true)
    expect(match.hasMember('p4')).toBe(true)
    expect(match.hasMember('stranger')).toBe(false)
  })
})
