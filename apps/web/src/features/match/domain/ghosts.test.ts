import { GHOST_LIMITS, type HauntEffect } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import type { Seat } from './seating'
import { hauntLine, whisperProblem, whisperTargetsFor } from './ghosts'

const names: Record<string, string> = { 'id-Juan': 'Juan', 'id-Marta': 'Marta' }
const nameOf = (memberId: string | null) => (memberId === null ? '' : (names[memberId] ?? ''))

const effect = (overrides: Partial<HauntEffect> = {}): HauntEffect => ({
  id: 'haunt-1',
  kind: 'flicker',
  word: null,
  ghostId: 'id-Juan',
  targetId: null,
  sentAt: 1_000,
  ...overrides
})

describe('whisperProblem', () => {
  it('accepts one word up to the limit', () => {
    expect(whisperProblem('bakery')).toBeNull()
    expect(whisperProblem('  bakery  ')).toBeNull()
    expect(whisperProblem('a'.repeat(GHOST_LIMITS.maxWhisperLength))).toBeNull()
  })

  it('rejects an empty or blank word', () => {
    expect(whisperProblem('')).toBe('empty')
    expect(whisperProblem('   ')).toBe('empty')
  })

  it('rejects a word over the limit', () => {
    expect(whisperProblem('a'.repeat(GHOST_LIMITS.maxWhisperLength + 1))).toBe('too-long')
  })

  it('rejects more than one word', () => {
    expect(whisperProblem('two words')).toBe('spaces')
    expect(whisperProblem('tab\tbed')).toBe('spaces')
  })
})

describe('hauntLine', () => {
  it('names the ghost for a flicker', () => {
    expect(hauntLine(effect(), nameOf)).toEqual({
      key: 'match.ghost.feed.flicker',
      params: { ghost: 'Juan', target: '', word: '' }
    })
  })

  it('names the ghost, the word and the target for a whisper', () => {
    const whisper = effect({ kind: 'whisper', word: 'bakery', targetId: 'id-Marta' })
    expect(hauntLine(whisper, nameOf)).toEqual({
      key: 'match.ghost.feed.whisper',
      params: { ghost: 'Juan', target: 'Marta', word: 'bakery' }
    })
  })

  it('leaves the ghost blank when the effect hides it', () => {
    expect(hauntLine(effect({ ghostId: null }), nameOf).params.ghost).toBe('')
  })
})

const seat = (name: string, overrides: Partial<Seat> = {}): Seat => ({
  id: `id-${name}`,
  name,
  avatar: null,
  alive: true,
  revealedRole: null,
  isYou: false,
  isPack: false,
  ...overrides
})

describe('whisperTargetsFor', () => {
  it('offers the living except yourself', () => {
    const seats = [seat('Juan', { alive: false, isYou: true }), seat('Marta'), seat('Luis', { alive: false }), seat('Ana')]
    expect(whisperTargetsFor(seats).map((target) => [target.seat.name, target.blocked])).toEqual([
      ['Marta', null],
      ['Ana', null]
    ])
  })
})
