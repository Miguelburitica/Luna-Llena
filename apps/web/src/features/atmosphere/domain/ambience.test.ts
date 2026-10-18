import type { MatchView, Phase } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { narratorViewOf, outcomeOf, playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { ambientFor, stingsBetween } from './ambience'

const viewIn = (phase: Phase, overrides: Partial<MatchView> = {}): MatchView => playerViewOf({ phase, ...overrides } as never)

describe('ambientFor', () => {
  it.each<[Phase]>([['night'], ['dawn'], ['day'], ['vote'], ['execution']])('gives %s its own loop', (phase) => {
    expect(ambientFor(viewIn(phase))).toBe(phase)
  })

  it('falls silent after the outcome', () => {
    expect(ambientFor(viewIn('day', { outcome: outcomeOf() }))).toBe('none')
  })

  it('has no loop without a game', () => {
    expect(ambientFor(null)).toBe('none')
  })
})

describe('stingsBetween', () => {
  it('howls at nightfall', () => {
    expect(stingsBetween(viewIn('execution', { round: 1 }), viewIn('night', { round: 2 }))).toEqual(['howl'])
  })

  it('howls when the first night starts a new round only once', () => {
    const night = viewIn('night', { round: 1 })
    expect(stingsBetween(night, viewIn('night', { round: 1 }))).toEqual([])
  })

  it('tolls the bell for a dawn with a death', () => {
    const dawn = viewIn('dawn', { dawn: { round: 1, deaths: ['id-Ana'] } })
    expect(stingsBetween(viewIn('night'), dawn)).toEqual(['bell'])
  })

  it('crows for a dawn with nobody dead', () => {
    const dawn = viewIn('dawn', { dawn: { round: 1, deaths: [] } })
    expect(stingsBetween(viewIn('night'), dawn)).toEqual(['rooster'])
  })

  it('does not repeat the dawn sting while the report stays', () => {
    const dawn = viewIn('dawn', { dawn: { round: 1, deaths: ['id-Ana'] } })
    expect(stingsBetween(dawn, viewIn('day', { dawn: { round: 1, deaths: ['id-Ana'] } }))).toEqual([])
  })

  it('rolls the drums and screams for an execution', () => {
    const verdict = { round: 1, tally: [], executedId: 'id-Luis', tie: false, foolWins: false }
    expect(stingsBetween(viewIn('vote'), viewIn('execution', { verdict }))).toEqual(['drumroll', 'scream'])
  })

  it('rolls the drums and plays the sad trombone for a tie', () => {
    const verdict = { round: 1, tally: [], executedId: null, tie: true, foolWins: false }
    expect(stingsBetween(viewIn('vote'), viewIn('execution', { verdict }))).toEqual(['drumroll', 'trombone'])
  })

  it('only rolls the drums when nobody voted', () => {
    const verdict = { round: 1, tally: [], executedId: null, tie: false, foolWins: false }
    expect(stingsBetween(viewIn('vote'), viewIn('execution', { verdict }))).toEqual(['drumroll'])
  })

  it('adds the sad trombone when the Fool wins', () => {
    const verdict = { round: 1, tally: [], executedId: 'id-Sofi', tie: false, foolWins: true }
    expect(stingsBetween(viewIn('vote'), viewIn('execution', { verdict }))).toEqual(['drumroll', 'scream', 'trombone'])
  })

  it('plays the sad trombone once for a Fool who wins and the game that ends', () => {
    const verdict = { round: 1, tally: [], executedId: 'id-Sofi', tie: false, foolWins: true }
    const before = viewIn('execution', { verdict })
    const after = viewIn('execution', { verdict, outcome: outcomeOf({ winner: 'solo' }), soloWinnerIds: ['id-Sofi'] })
    expect(stingsBetween(before, after)).toEqual([])
  })

  it('plays the sad trombone for a new solo outcome', () => {
    const before = narratorViewOf({ phase: 'day' })
    const after = narratorViewOf({ phase: 'day', outcome: outcomeOf({ winner: 'solo' }), soloWinnerIds: ['id-Sofi'] })
    expect(stingsBetween(before, after)).toEqual(['trombone'])
  })

  it('stays quiet for a village win', () => {
    const after = viewIn('day', { outcome: outcomeOf() })
    expect(stingsBetween(viewIn('day'), after)).toEqual([])
  })

  it('does not replay after a reload', () => {
    const dawn = viewIn('dawn', { dawn: { round: 1, deaths: ['id-Ana'] } })
    expect(stingsBetween(null, dawn)).toEqual([])
  })

  it('treats another game as a first view', () => {
    const other = viewIn('night', { code: 'OTHER1', round: 5 })
    expect(stingsBetween(viewIn('day', { round: 1 }), other)).toEqual([])
  })
})
