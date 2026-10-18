import type { Verdict } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const executedVerdict: Verdict = {
  round: 2,
  tally: [
    { targetId: 'id-Luis', votes: 4, voterIds: ['id-Marta', 'id-Ana', 'id-Pipe', 'id-Caro'] },
    { targetId: 'id-Tato', votes: 2, voterIds: ['id-Luis', 'id-Sofi'] },
    { targetId: 'id-Sofi', votes: 1, voterIds: ['id-Tato'] }
  ],
  executedId: 'id-Luis',
  tie: false,
  foolWins: false
}

const tieVerdict: Verdict = {
  round: 2,
  tally: [
    { targetId: 'id-Luis', votes: 3, voterIds: null },
    { targetId: 'id-Tato', votes: 3, voterIds: null }
  ],
  executedId: null,
  tie: true,
  foolWins: false
}

const mountExecution = (verdict: Verdict | null, deadRole: 'werewolf' | null = 'werewolf') => {
  const dead = verdict?.executedId ? { [verdict.executedId]: { alive: false, revealedRole: deadRole } } : {}
  const view = playerViewOf({ phase: 'execution', round: 2, players: matchPlayers(dead), verdict })
  return mountMatchView(PlayerTable, { view, props: { view } })
}

describe('VerdictReveal', () => {
  it('draws the tally with bars sized against the top count and the top one marked', async () => {
    const { wrapper } = await mountExecution(executedVerdict)
    const rows = wrapper.findAll('.tally-row')
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.find('.tally-n').text())).toEqual(['4', '2', '1'])
    expect(rows.map((row) => row.find('.bar i').attributes('style'))).toEqual([
      expect.stringContaining('width: 100%'),
      expect.stringContaining('width: 50%'),
      expect.stringContaining('width: 25%')
    ])
    expect(rows[0]?.find('.bar i').classes()).toContain('is-top')
    expect(rows[1]?.find('.bar i').classes()).not.toContain('is-top')
  })

  it('shows who voted for whom', async () => {
    const { wrapper } = await mountExecution(executedVerdict)
    const luis = wrapper.findAll('.tally-row')[0]
    expect(luis?.findAll('.verdict-stack .face').map((face) => face.attributes('aria-label'))).toEqual(['Marta', 'Ana', 'Pipe', 'Caro'])
  })

  it('shows only the counts when the votes are anonymous', async () => {
    const anonymous: Verdict = { ...executedVerdict, tally: executedVerdict.tally.map((entry) => ({ ...entry, voterIds: null })) }
    const { wrapper } = await mountExecution(anonymous)
    expect(wrapper.find('.verdict-stack').exists()).toBe(false)
    expect(wrapper.text()).toContain('Votes are anonymous in this room.')
  })

  it('announces who leaves the village and reveals their role card', async () => {
    const { wrapper } = await mountExecution(executedVerdict)
    expect(wrapper.find('.verdict-result').text()).toContain('Luis leaves the village')
    expect(wrapper.find('.verdict-result .av').classes()).toContain('is-dead')
    expect(wrapper.find('.verdict-was').text()).toContain('Luis was…')
    expect(wrapper.find('.verdict-was .rcard-name').text()).toBe('Werewolf')
  })

  it('keeps the role hidden when it was not revealed', async () => {
    const { wrapper } = await mountExecution(executedVerdict, null)
    expect(wrapper.find('.verdict-was').exists()).toBe(false)
    expect(wrapper.find('.rcard').exists()).toBe(false)
    expect(wrapper.text()).toContain('Their role stays a secret.')
  })

  it('shows the tie card and executes nobody', async () => {
    const { wrapper } = await mountExecution(tieVerdict)
    const card = wrapper.find('.verdict-tie')
    expect(card.text()).toContain('It’s a tie!')
    expect(card.text()).toContain('No execution today')
    expect(wrapper.find('.verdict-was').exists()).toBe(false)
    expect(wrapper.findAll('.bar i.is-top')).toHaveLength(0)
  })

  it('says nobody voted when the tally is empty', async () => {
    const { wrapper } = await mountExecution({ ...tieVerdict, tally: [], tie: false })
    expect(wrapper.find('.tally-row').exists()).toBe(false)
    expect(wrapper.find('.verdict-tie').text()).toContain('Nobody voted')
    expect(wrapper.find('.verdict-tie').text()).toContain('No execution today')
  })

  it('shows nothing before the verdict arrives', async () => {
    const { wrapper } = await mountExecution(null)
    expect(wrapper.find('.verdict').exists()).toBe(false)
  })
})
