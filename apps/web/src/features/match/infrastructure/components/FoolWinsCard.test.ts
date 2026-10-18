import type { Verdict } from '@luna/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const FOOL_KEY = 'luna-llena.fool.LUNA42.2'

const foolVerdict: Verdict = {
  round: 2,
  tally: [{ targetId: 'id-Marta', votes: 5, voterIds: null }],
  executedId: 'id-Marta',
  tie: false,
  foolWins: true
}

const mountFool = (verdict: Verdict | null = foolVerdict, phase: 'execution' | 'night' = 'execution') => {
  const view = playerViewOf({
    phase,
    round: 2,
    players: matchPlayers({ 'id-Marta': { alive: false, revealedRole: 'fool' } }),
    verdict
  })
  return mountMatchView(PlayerTable, { view, props: { view } })
}

beforeEach(() => sessionStorage.clear())

describe('FoolWinsCard', () => {
  it('tells everyone The Fool wins with the Fool’s name', async () => {
    const { wrapper } = await mountFool()
    const overlay = wrapper.find('.fool')
    expect(overlay.attributes('role')).toBe('dialog')
    expect(overlay.find('h1').text()).toBe('The Fool wins!')
    expect(overlay.text()).toContain('Marta')
    expect(overlay.text()).toContain('Marta wanted to be voted out. You all fell for it.')
    expect(overlay.text()).toContain('The game continues')
  })

  it('goes away on Back to the village and is remembered for this tab and round', async () => {
    const { wrapper } = await mountFool()
    await wrapper.findAll('.fool button').find((button) => button.text() === 'Back to the village')?.trigger('click')
    expect(wrapper.find('.fool').exists()).toBe(false)
    expect(sessionStorage.getItem(FOOL_KEY)).toBe('true')
    const { wrapper: reopened } = await mountFool()
    expect(reopened.find('.fool').exists()).toBe(false)
  })

  it('shows again for a later round', async () => {
    sessionStorage.setItem('luna-llena.fool.LUNA42.1', 'true')
    const { wrapper } = await mountFool()
    expect(wrapper.find('.fool').exists()).toBe(true)
  })

  it('stays after the execution while the verdict does', async () => {
    const { wrapper } = await mountFool(foolVerdict, 'night')
    expect(wrapper.find('.fool').exists()).toBe(true)
  })

  it('does not show when the Fool did not win', async () => {
    const { wrapper } = await mountFool({ ...foolVerdict, foolWins: false })
    expect(wrapper.find('.fool').exists()).toBe(false)
    const { wrapper: none } = await mountFool(null)
    expect(none.find('.fool').exists()).toBe(false)
  })
})
