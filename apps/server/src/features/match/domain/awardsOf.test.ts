import type { TimelineEntry } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { awardsOf } from './awardsOf'
import { seatsOf, SEVEN_ROLES } from './Match.fixtures'

const seats = seatsOf(SEVEN_ROLES)
const WOLF_ONE = 'p1'
const WOLF_TWO = 'p2'
const SEER = 'p3'
const DOCTOR = 'p4'
const WITCH = 'p5'
const HUNTER = 'p6'
const FOOL = 'p7'

const voteOf = (round: number, votes: Record<string, string[]>, executedId: string | null): TimelineEntry => ({
  kind: 'vote',
  round,
  verdict: {
    round,
    tally: Object.entries(votes).map(([targetId, voterIds]) => ({ targetId, votes: voterIds.length, voterIds })),
    executedId,
    tie: false,
    foolWins: false
  }
})

const awardOf = (timeline: readonly TimelineEntry[], award: string) =>
  awardsOf(timeline, seats).find((candidate) => candidate.award === award)

describe('Most Suspicious', () => {
  it('goes to the player with the most votes over the whole game', () => {
    const timeline = [
      voteOf(1, { [HUNTER]: [WOLF_ONE, WOLF_TWO, SEER, DOCTOR], [FOOL]: [WITCH] }, HUNTER),
      voteOf(2, { [HUNTER]: [WOLF_ONE, WOLF_TWO, SEER, DOCTOR, WITCH], [WITCH]: [FOOL] }, HUNTER)
    ]
    expect(awardOf(timeline, 'most-suspicious')).toEqual({ award: 'most-suspicious', memberId: HUNTER, count: 9 })
  })

  it('adds votes across days and breaks ties by seat order', () => {
    const timeline = [
      voteOf(1, { [WITCH]: [SEER, DOCTOR], [SEER]: [WITCH] }, WITCH),
      voteOf(2, { [SEER]: [WOLF_ONE] }, null)
    ]
    expect(awardOf(timeline, 'most-suspicious')).toEqual({ award: 'most-suspicious', memberId: SEER, count: 2 })
  })

  it('is left out when nobody received a vote', () => {
    expect(awardOf([], 'most-suspicious')).toBeUndefined()
  })
})

describe('Worst Liar', () => {
  it('goes to the first wolf executed, with the day of the execution', () => {
    const timeline = [
      voteOf(1, { [SEER]: [WOLF_ONE] }, null),
      voteOf(2, { [WOLF_TWO]: [SEER, DOCTOR, WITCH] }, WOLF_TWO),
      voteOf(3, { [WOLF_ONE]: [SEER, DOCTOR] }, WOLF_ONE)
    ]
    expect(awardOf(timeline, 'worst-liar')).toEqual({ award: 'worst-liar', memberId: WOLF_TWO, count: 2 })
  })

  it('is left out when no wolf was executed', () => {
    const timeline = [voteOf(1, { [HUNTER]: [SEER, DOCTOR] }, HUNTER), voteOf(2, { [WOLF_ONE]: [SEER] }, null)]
    expect(awardOf(timeline, 'worst-liar')).toBeUndefined()
  })
})

describe('Betrayed Own Team', () => {
  it('goes to the village player with the most votes against village players', () => {
    const timeline = [
      voteOf(1, { [HUNTER]: [SEER, DOCTOR], [WOLF_ONE]: [WITCH] }, HUNTER),
      voteOf(2, { [WITCH]: [SEER], [SEER]: [DOCTOR] }, null),
      voteOf(3, { [DOCTOR]: [SEER] }, DOCTOR)
    ]
    expect(awardOf(timeline, 'betrayed-own-team')).toEqual({ award: 'betrayed-own-team', memberId: SEER, count: 3 })
  })

  it('ignores wolves voting, votes for wolves and votes for the Fool', () => {
    const timeline = [voteOf(1, { [HUNTER]: [WOLF_ONE, WOLF_TWO], [WOLF_ONE]: [SEER], [FOOL]: [DOCTOR] }, HUNTER)]
    expect(awardOf(timeline, 'betrayed-own-team')).toBeUndefined()
  })

  it('breaks ties by seat order', () => {
    const timeline = [voteOf(1, { [HUNTER]: [DOCTOR, SEER] }, HUNTER)]
    expect(awardOf(timeline, 'betrayed-own-team')).toEqual({ award: 'betrayed-own-team', memberId: SEER, count: 1 })
  })
})

describe('Silent Assassin', () => {
  it('goes to the first wolf who never received a vote', () => {
    const timeline = [voteOf(1, { [WOLF_ONE]: [SEER, DOCTOR] }, WOLF_ONE)]
    expect(awardOf(timeline, 'silent-assassin')).toEqual({ award: 'silent-assassin', memberId: WOLF_TWO, count: null })
  })

  it('is left out when every wolf received a vote', () => {
    const timeline = [voteOf(1, { [WOLF_ONE]: [SEER], [WOLF_TWO]: [DOCTOR] }, null)]
    expect(awardOf(timeline, 'silent-assassin')).toBeUndefined()
  })
})

describe('Award order', () => {
  it('follows the server award list and leaves out the awards without a winner', () => {
    const timeline = [voteOf(1, { [WOLF_ONE]: [SEER, DOCTOR, WITCH], [HUNTER]: [SEER] }, WOLF_ONE)]
    expect(awardsOf(timeline, seats).map((award) => award.award)).toEqual([
      'most-suspicious',
      'worst-liar',
      'betrayed-own-team',
      'silent-assassin'
    ])
    expect(awardsOf([voteOf(1, { [WOLF_ONE]: [SEER], [WOLF_TWO]: [DOCTOR] }, null)], seats)).toEqual([
      { award: 'most-suspicious', memberId: WOLF_ONE, count: 1 }
    ])
  })
})
