import type { Verdict } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { memberView } from '@/features/room/domain/snapshot.fixtures'
import { narratorViewOf, playerViewOf } from '../application/MatchGateway.fixtures'
import { seatsOf } from './seating'
import {
  revengeStanceOf,
  revengeTargetsFor,
  tallyBars,
  verdictOutcomeOf,
  voteLinesOf,
  voteProgressOf,
  voteTargetsFor
} from './voting'

const members = [memberView('Ana'), memberView('Juan'), memberView('Luis'), memberView('Tato')]

const players = [
  { id: 'id-Ana', alive: true, revealedRole: null },
  { id: 'id-Juan', alive: false, revealedRole: null },
  { id: 'id-Luis', alive: true, revealedRole: null },
  { id: 'id-Tato', alive: true, revealedRole: null }
]

const voting = { voted: 2, locked: 1, voters: 3 }

const verdictOf = (overrides: Partial<Verdict> = {}): Verdict => ({
  round: 1,
  tally: [],
  executedId: null,
  tie: false,
  foolWins: false,
  ...overrides
})

describe('voting domain', () => {
  const view = playerViewOf({ players, phase: 'vote', voting })
  const seats = seatsOf(view, members, 'id-Ana')

  it('offers living players other than you to vote for', () => {
    expect(voteTargetsFor(view, seats).map((target) => target.seat.name)).toEqual(['Luis', 'Tato'])
    expect(voteTargetsFor(view, seats).every((target) => target.blocked === null)).toBe(true)
  })

  it('offers nobody to vote for when voting is closed', () => {
    expect(voteTargetsFor(playerViewOf({ players }), seats)).toEqual([])
  })

  it('offers the Hunter every living player but the Hunter', () => {
    const shot = playerViewOf({ players, revenge: { hunterId: 'id-Ana', targetId: null, pending: true } })
    expect(revengeTargetsFor(shot, seats).map((target) => target.seat.name)).toEqual(['Luis', 'Tato'])
    const dead = players.map((player) => (player.id === 'id-Ana' ? { ...player, alive: false } : player))
    const aimed = playerViewOf({ players: dead, revenge: { hunterId: 'id-Ana', targetId: null, pending: true } })
    expect(revengeTargetsFor(aimed, seatsOf(aimed, members, 'id-Ana')).map((target) => target.seat.name)).toEqual(['Luis', 'Tato'])
    expect(revengeTargetsFor(playerViewOf({ players }), seats)).toEqual([])
  })

  it('tells the shooter, the watchers and a settled shot apart', () => {
    const pending = { hunterId: 'id-Ana', targetId: null, pending: true }
    expect(revengeStanceOf(playerViewOf({ players, revenge: pending }), seats)).toBe('shooter')
    expect(revengeStanceOf(playerViewOf({ players, revenge: { ...pending, hunterId: 'id-Tato' } }), seats)).toBe('watcher')
    expect(revengeStanceOf(playerViewOf({ players, revenge: { ...pending, targetId: 'id-Luis', pending: false } }), seats)).toBe('settled')
    expect(revengeStanceOf(playerViewOf({ players }), seats)).toBeNull()
  })

  it('counts how many are still to vote', () => {
    expect(voteProgressOf(view)).toEqual({ voted: 2, locked: 1, voters: 3, remaining: 1 })
    expect(voteProgressOf(playerViewOf({ players }))).toBeNull()
  })

  it('sizes the tally bars against the top count and marks the executed one', () => {
    const verdict = verdictOf({
      tally: [
        { targetId: 'id-Luis', votes: 4, voterIds: null },
        { targetId: 'id-Tato', votes: 2, voterIds: null },
        { targetId: 'id-Ana', votes: 1, voterIds: null }
      ],
      executedId: 'id-Luis'
    })
    expect(tallyBars(verdict).map((bar) => [bar.targetId, bar.percent, bar.isTop])).toEqual([
      ['id-Luis', 100, true],
      ['id-Tato', 50, false],
      ['id-Ana', 25, false]
    ])
  })

  it('marks no bar as the top one on a tie and draws nothing for an empty tally', () => {
    const tie = verdictOf({
      tally: [
        { targetId: 'id-Luis', votes: 3, voterIds: null },
        { targetId: 'id-Tato', votes: 3, voterIds: null }
      ],
      tie: true
    })
    expect(tallyBars(tie).map((bar) => [bar.percent, bar.isTop])).toEqual([
      [100, false],
      [100, false]
    ])
    expect(tallyBars(verdictOf())).toEqual([])
  })

  it('classifies the verdict', () => {
    expect(verdictOutcomeOf(verdictOf({ executedId: 'id-Luis' }))).toBe('executed')
    expect(verdictOutcomeOf(verdictOf({ tie: true }))).toBe('tie')
    expect(verdictOutcomeOf(verdictOf())).toBe('nobody')
  })

  it('lists the living voters with their target and lock for the narrator', () => {
    const narrator = narratorViewOf({
      players,
      voting,
      votes: { 'id-Ana': { targetId: 'id-Tato', locked: true }, 'id-Luis': { targetId: null, locked: false } }
    })
    const lines = voteLinesOf(narrator, seatsOf(narrator, members, undefined))
    expect(lines.map((line) => [line.seat.name, line.targetId, line.locked])).toEqual([
      ['Ana', 'id-Tato', true],
      ['Luis', null, false],
      ['Tato', null, false]
    ])
  })
})
