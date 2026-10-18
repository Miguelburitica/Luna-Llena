import { describe, expect, it } from 'vitest'
import { narratorViewOf, playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import GameView from './GameView.vue'

const finished = (soloWinnerIds: string[]) =>
  playerViewOf({
    players: matchPlayers({ 'id-Marta': { alive: false, revealedRole: 'fool' }, 'id-Luis': { revealedRole: 'werewolf' } }),
    outcome: { winner: 'wolves' },
    soloWinnerIds
  })

describe('GameOverView', () => {
  it('lists the winning team and the solo winners under it', async () => {
    const { wrapper } = await mountMatchView(GameView, { view: finished(['id-Marta']), preload: false })
    expect(wrapper.find('.over-banner').text()).toBe('Wolves win!')
    const winners = wrapper.findAll('.over-solo-winner')
    expect(winners).toHaveLength(1)
    expect(winners[0]?.text()).toContain('Marta')
    expect(winners[0]?.text()).toContain('The Fool also won')
  })

  it('lists no solo winners when nobody won alone', async () => {
    const { wrapper } = await mountMatchView(GameView, { view: finished([]), preload: false })
    expect(wrapper.find('.over-solo').exists()).toBe(false)
  })

  it('shows the same to the narrator', async () => {
    const view = narratorViewOf({
      players: matchPlayers(),
      roles: { 'id-Marta': 'fool' },
      outcome: { winner: 'village' },
      soloWinnerIds: ['id-Marta']
    })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false, memberId: 'id-Nico' })
    expect(wrapper.find('.over-solo-winner').text()).toContain('The Fool also won')
  })
})
