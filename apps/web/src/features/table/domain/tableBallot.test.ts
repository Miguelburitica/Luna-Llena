import { describe, expect, it } from 'vitest'
import { liveTallyOf, toggledVote, votersFor } from './tableBallot'

const cast = (targetId: string | null) => ({ targetId, locked: false })

describe('table ballot', () => {
  it('Hands up: groups voters by accused and tallies from most to fewest', () => {
    const votes = { ana: cast('luis'), caro: cast('luis'), pipe: cast('luis'), sofi: cast('luis'), juan: cast('sofi'), tato: cast('sofi') }

    expect(votersFor(votes, 'luis')).toEqual(['ana', 'caro', 'pipe', 'sofi'])
    expect(liveTallyOf(votes).map(({ targetId, votes: count }) => [targetId, count])).toEqual([
      ['luis', 4],
      ['sofi', 2]
    ])
  })

  it('Changing hands: tapping a voter under another accused moves the vote', () => {
    expect(toggledVote({ caro: cast('luis') }, 'caro', 'tato')).toBe('tato')
  })

  it('tapping a voter again clears the vote', () => {
    expect(toggledVote({ caro: cast('luis') }, 'caro', 'luis')).toBeNull()
  })

  it('ignores cleared votes in the tally', () => {
    expect(liveTallyOf({ caro: cast(null) })).toEqual([])
  })
})
