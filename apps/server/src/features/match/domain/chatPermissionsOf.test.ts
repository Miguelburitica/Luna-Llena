import { CHAT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { chatPermissionsOf } from './chatPermissionsOf'
import type { Match } from './Match'
import { beginMatch, constantRandom, NARRATOR_ID, START_TIME, unwrap } from './Match.fixtures'

const WOLF_ONE = 'p1'
const WOLF_TWO = 'p2'
const SEER = 'p3'
const WITCH = 'p5'
const HUNTER = 'p6'
const FOOL = 'p7'
const WINDOW = CHAT_LIMITS.lastWordsSeconds * 1000

const advance = (match: Match, times = 1, now = START_TIME) => {
  for (let step = 0; step < times; step += 1) unwrap(match.advance(NARRATOR_ID, now))
}

const killAtDawn = (match: Match, victim: string, now = START_TIME) => {
  unwrap(match.act(WOLF_ONE, { kind: 'hunt', targetId: victim }, constantRandom(0)))
  unwrap(match.act(WOLF_TWO, { kind: 'hunt', targetId: victim }, constantRandom(0)))
  advance(match, 1, now)
}

const permissions = (match: Match, memberId: string, now = START_TIME) => chatPermissionsOf(match, memberId, now)

describe('Reading', () => {
  it('lets every living villager read the village only', () => {
    const match = beginMatch()
    expect(permissions(match, SEER).read).toEqual(['village'])
  })

  it('lets wolves read the den by true role and the narrator read everything', () => {
    const match = beginMatch()
    expect(permissions(match, WOLF_ONE).read).toEqual(['village', 'wolves'])
    expect(permissions(match, NARRATOR_ID).read).toEqual(['village', 'wolves', 'ghosts'])
  })

  it('lets the dead read the ghosts and keeps a dead wolf in the den', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    expect(permissions(match, SEER).read).toEqual(['village', 'ghosts'])
    expect(permissions(match, WOLF_TWO).read).toEqual(['village', 'wolves', 'ghosts'])
  })

  it('gives nothing to someone outside the match', () => {
    expect(permissions(beginMatch(), 'stranger')).toEqual({
      read: [],
      write: [],
      closed: [],
      lastWordsUntil: null,
      villagePaused: false
    })
  })
})

describe('Writing by phase', () => {
  it('closes the village for the living at night and opens the den for wolves', () => {
    const match = beginMatch()
    expect(permissions(match, SEER)).toMatchObject({ write: [], closed: ['village'] })
    expect(permissions(match, WOLF_ONE)).toMatchObject({ write: ['wolves'], closed: ['village'] })
  })

  it.each([1, 2, 3, 4])('opens the village by day and closes the den for wolves (step %i)', (steps) => {
    const match = beginMatch()
    advance(match, steps)
    expect(permissions(match, SEER)).toMatchObject({ write: ['village'], closed: [] })
    expect(permissions(match, WOLF_ONE)).toMatchObject({ write: ['village'], closed: ['wolves'] })
  })

  it('lets the narrator write the village in every phase and nothing else', () => {
    const match = beginMatch()
    for (let step = 0; step < 5; step += 1) {
      expect(permissions(match, NARRATOR_ID)).toMatchObject({ write: ['village'], closed: [], villagePaused: false })
      advance(match)
    }
  })

  it('lets the dead write the ghosts in any phase but not the village', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    for (let step = 0; step < 5; step += 1) {
      expect(permissions(match, SEER)).toMatchObject({ write: ['ghosts'], closed: [] })
      advance(match)
    }
  })

  it('does not let a dead wolf write the den', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    expect(permissions(match, WOLF_ONE)).toMatchObject({ write: ['ghosts'], closed: [] })
  })
})

describe('Game over', () => {
  it('opens the village to everyone, the dead included', () => {
    const match = beginMatch()
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_ONE, false))
    unwrap(match.setAlive(NARRATOR_ID, WOLF_TWO, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(permissions(match, SEER).write).toEqual(['village', 'ghosts'])
    expect(permissions(match, 'p4')).toMatchObject({ write: ['village'], closed: [], villagePaused: false })
  })

  it('keeps the den closed for living wolves after the night', () => {
    const match = beginMatch()
    advance(match)
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    unwrap(match.setAlive(NARRATOR_ID, 'p4', false))
    unwrap(match.setAlive(NARRATOR_ID, WITCH, false))
    unwrap(match.setAlive(NARRATOR_ID, HUNTER, false))
    unwrap(match.skipRevenge(NARRATOR_ID))
    unwrap(match.setAlive(NARRATOR_ID, FOOL, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(permissions(match, WOLF_ONE)).toMatchObject({ write: ['village'], closed: ['wolves'] })
  })
})

describe('Last words', () => {
  it('opens a window for a death at dawn when the house rule is on', () => {
    const match = beginMatch({ lastWords: true })
    killAtDawn(match, SEER)
    const dead = permissions(match, SEER)
    expect(dead.lastWordsUntil).toBe(START_TIME + WINDOW)
    expect(dead.write).toEqual(['village', 'ghosts'])
  })

  it('pauses the village for the living while the window is open', () => {
    const match = beginMatch({ lastWords: true })
    killAtDawn(match, SEER)
    expect(permissions(match, 'p4')).toMatchObject({ write: [], closed: ['village'], villagePaused: true })
    expect(permissions(match, NARRATOR_ID)).toMatchObject({ write: ['village'], villagePaused: false })
    expect(permissions(match, SEER).villagePaused).toBe(false)
  })

  it('gives another dead player no voice in the village while someone else speaks', () => {
    const match = beginMatch({ lastWords: true })
    unwrap(match.setAlive(NARRATOR_ID, FOOL, false))
    killAtDawn(match, SEER)
    expect(permissions(match, FOOL)).toMatchObject({ write: ['ghosts'], lastWordsUntil: null })
  })

  it('lets the dying speak even at night', () => {
    const match = beginMatch({ lastWords: true })
    advance(match, 3)
    const vote = (target: string) => {
      for (const voter of ['p1', 'p2', 'p3', 'p4', 'p5', 'p7']) unwrap(match.vote(voter, target))
    }
    vote(HUNTER)
    advance(match)
    expect(permissions(match, HUNTER).lastWordsUntil).toBe(START_TIME + WINDOW)
    unwrap(match.skipRevenge(NARRATOR_ID))
    advance(match)
    expect(match.phase).toBe('night')
    expect(permissions(match, HUNTER).write).toEqual(['village', 'ghosts'])
  })

  it('opens a window for the victim of the Hunter shot', () => {
    const match = beginMatch({ lastWords: true })
    killAtDawn(match, HUNTER)
    const shotAt = START_TIME + 5000
    unwrap(match.avenge(HUNTER, WOLF_ONE, shotAt))
    expect(permissions(match, WOLF_ONE, shotAt).lastWordsUntil).toBe(shotAt + WINDOW)
  })

  it('treats an expired window as closed', () => {
    const match = beginMatch({ lastWords: true })
    killAtDawn(match, SEER)
    const late = START_TIME + WINDOW
    expect(permissions(match, SEER, late)).toMatchObject({ write: ['ghosts'], lastWordsUntil: null })
    expect(permissions(match, 'p4', late)).toMatchObject({ write: ['village'], villagePaused: false })
  })

  it('closes the window when the words are spoken', () => {
    const match = beginMatch({ lastWords: true })
    killAtDawn(match, SEER)
    unwrap(match.closeLastWords(SEER))
    expect(permissions(match, SEER)).toMatchObject({ write: ['ghosts'], lastWordsUntil: null })
    expect(permissions(match, 'p4').villagePaused).toBe(false)
  })

  it('opens no window when the house rule is off', () => {
    const match = beginMatch({ lastWords: false })
    killAtDawn(match, SEER)
    expect(permissions(match, SEER)).toMatchObject({ write: ['ghosts'], lastWordsUntil: null })
    expect(permissions(match, 'p4').villagePaused).toBe(false)
  })

  it('opens no window for a death marked by the narrator and closes it on revival', () => {
    const match = beginMatch({ lastWords: true })
    unwrap(match.setAlive(NARRATOR_ID, SEER, false))
    expect(permissions(match, SEER).lastWordsUntil).toBeNull()
    killAtDawn(match, FOOL)
    unwrap(match.setAlive(NARRATOR_ID, FOOL, true))
    expect(permissions(match, FOOL).lastWordsUntil).toBeNull()
    expect(permissions(match, 'p4').villagePaused).toBe(false)
  })
})
