import { describe, expect, it } from 'vitest'
import { beginMatch, NARRATOR_ID, START_TIME, unwrap } from './Match.fixtures'
import type { Match } from './Match'

const GHOST = 'p3'
const OTHER_GHOST = 'p4'
const MARTA = 'p6'
const CARO = 'p7'

const withGhosts = (ghostPowers = true): Match => {
  const match = beginMatch({ ghostPowers })
  unwrap(match.setAlive(NARRATOR_ID, GHOST, false))
  unwrap(match.setAlive(NARRATOR_ID, OTHER_GHOST, false))
  return match
}

const failure = (match: Match, actorId: string, input: unknown) => {
  const result = match.haunt(actorId, input)
  if (result.ok) throw new Error('Expected a rejection')
  return result.error.code
}

describe('Who may haunt', () => {
  it('shows a fresh ghost one haunt available and nobody else anything', () => {
    const match = withGhosts()
    expect(match.hauntAvailableTo(GHOST)).toBe(true)
    expect(match.hauntAvailableTo(MARTA)).toBeNull()
    expect(match.hauntAvailableTo(NARRATOR_ID)).toBeNull()
  })

  it('rejects a second haunt and keeps the other ghost untouched', () => {
    const match = withGhosts()
    unwrap(match.haunt(GHOST, { kind: 'flicker' }))
    expect(match.hauntAvailableTo(GHOST)).toBe(false)
    expect(failure(match, GHOST, { kind: 'flicker' })).toBe('haunt-used')
    expect(failure(match, GHOST, { kind: 'whisper', targetId: MARTA, word: 'bakery' })).toBe('haunt-used')
    expect(match.hauntAvailableTo(OTHER_GHOST)).toBe(true)
  })

  it('rejects the living and the narrator', () => {
    const match = withGhosts()
    expect(failure(match, CARO, { kind: 'flicker' })).toBe('not-a-ghost')
    expect(failure(match, NARRATOR_ID, { kind: 'flicker' })).toBe('not-a-ghost')
    expect(failure(match, 'stranger', { kind: 'flicker' })).toBe('not-a-ghost')
  })

  it('rejects every haunt when the house rule is off and hides the power', () => {
    const match = withGhosts(false)
    expect(failure(match, GHOST, { kind: 'flicker' })).toBe('ghost-powers-off')
    expect(failure(match, CARO, { kind: 'flicker' })).toBe('ghost-powers-off')
    expect(match.hauntAvailableTo(GHOST)).toBeNull()
  })

  it('rejects haunts once the game is over', () => {
    const match = withGhosts()
    for (const wolf of ['p1', 'p2']) unwrap(match.setAlive(NARRATOR_ID, wolf, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(failure(match, GHOST, { kind: 'flicker' })).toBe('match-over')
  })

  it('checks the rules in the documented order', () => {
    const off = withGhosts(false)
    expect(failure(off, CARO, 'nonsense')).toBe('ghost-powers-off')
    const on = withGhosts()
    expect(failure(on, CARO, 'nonsense')).toBe('not-a-ghost')
    unwrap(on.haunt(GHOST, { kind: 'flicker' }))
    expect(failure(on, GHOST, 'nonsense')).toBe('haunt-used')
    expect(failure(on, OTHER_GHOST, 'nonsense')).toBe('whisper-invalid')
  })
})

describe('Whispers', () => {
  it('returns the trimmed word and the target of a whisper', () => {
    const match = withGhosts()
    expect(unwrap(match.haunt(GHOST, { kind: 'whisper', targetId: MARTA, word: '  bakery ' }))).toEqual({
      kind: 'whisper',
      ghostId: GHOST,
      targetId: MARTA,
      word: 'bakery'
    })
  })

  it.each([
    ['several words', 'it was Tato'],
    ['an empty word', '   '],
    ['a word over 20 characters', 'a'.repeat(21)],
    ['a non-string word', 42]
  ])('rejects %s and keeps the haunt', (_label, word) => {
    const match = withGhosts()
    expect(failure(match, GHOST, { kind: 'whisper', targetId: MARTA, word })).toBe('whisper-invalid')
    expect(match.hauntAvailableTo(GHOST)).toBe(true)
    expect(match.timeline.filter((entry) => entry.kind === 'haunt')).toEqual([])
  })

  it('accepts a word of exactly 20 characters', () => {
    const match = withGhosts()
    expect(unwrap(match.haunt(GHOST, { kind: 'whisper', targetId: MARTA, word: 'a'.repeat(20) })).word).toHaveLength(20)
  })

  it.each([
    ['a dead player', OTHER_GHOST],
    ['the ghost itself', GHOST],
    ['an unknown id', 'nobody'],
    ['a missing target', undefined]
  ])('rejects a whisper to %s and keeps the haunt', (_label, targetId) => {
    const match = withGhosts()
    expect(failure(match, GHOST, { kind: 'whisper', targetId, word: 'bakery' })).toBe('target-invalid')
    expect(match.hauntAvailableTo(GHOST)).toBe(true)
  })

  it.each([
    ['a missing input', undefined],
    ['an unknown kind', { kind: 'shout' }],
    ['a null input', null]
  ])('rejects %s as malformed', (_label, input) => {
    const match = withGhosts()
    expect(failure(match, GHOST, input)).toBe('whisper-invalid')
    expect(match.hauntAvailableTo(GHOST)).toBe(true)
  })
})

describe('The ghost secret in the timeline', () => {
  it('records a whisper and a flicker with their round', () => {
    const match = withGhosts()
    unwrap(match.advance(NARRATOR_ID, START_TIME))
    unwrap(match.haunt(GHOST, { kind: 'whisper', targetId: MARTA, word: 'bakery' }))
    unwrap(match.haunt(OTHER_GHOST, { kind: 'flicker' }))
    expect(match.timeline.filter((entry) => entry.kind === 'haunt')).toEqual([
      { kind: 'haunt', round: 1, ghostId: GHOST, haunt: 'whisper', targetId: MARTA, word: 'bakery' },
      { kind: 'haunt', round: 1, ghostId: OTHER_GHOST, haunt: 'flicker', targetId: null, word: null }
    ])
  })

  it('carries the haunt into the outcome timeline at the end of the game', () => {
    const match = withGhosts()
    unwrap(match.haunt(GHOST, { kind: 'whisper', targetId: MARTA, word: 'bakery' }))
    for (const wolf of ['p1', 'p2']) unwrap(match.setAlive(NARRATOR_ID, wolf, false))
    unwrap(match.endGame(NARRATOR_ID))
    expect(match.outcome?.timeline).toContainEqual({
      kind: 'haunt',
      round: 1,
      ghostId: GHOST,
      haunt: 'whisper',
      targetId: MARTA,
      word: 'bakery'
    })
  })
})
