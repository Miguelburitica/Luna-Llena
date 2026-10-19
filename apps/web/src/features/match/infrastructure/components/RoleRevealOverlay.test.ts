import { describe, expect, it } from 'vitest'
import { mountMatchView } from '../mountMatchView.fixtures'
import RoleRevealOverlay from './RoleRevealOverlay.vue'

describe('RoleRevealOverlay', () => {
  it('shows the card face down until it is tapped', async () => {
    const { wrapper } = await mountMatchView(RoleRevealOverlay, {
      props: { role: 'seer', team: 'village', me: { name: 'Ana', avatar: 'ana' }, pack: [] }
    })
    expect(wrapper.find('.rcard-back').exists()).toBe(true)
    expect(wrapper.text()).toContain('Your secret role')
    expect(wrapper.text()).not.toContain('Got it')
  })

  it('flips to the role, its team, its power and the win condition', async () => {
    const { wrapper } = await mountMatchView(RoleRevealOverlay, {
      props: { role: 'seer', team: 'village', me: { name: 'Ana', avatar: 'ana' }, pack: [] }
    })
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    const card = wrapper.find('.rcard')
    expect(card.classes()).toContain('team-village')
    expect(card.find('.rcard-name').text()).toBe('Seer')
    expect(card.find('.tbadge').text()).toBe('Village')
    expect(card.find('.rcard-power').text()).toContain('peek at one player')
    expect(card.find('.rcard-win').text()).toBe('Win when every wolf is gone.')
    expect(wrapper.text()).toContain('Got it')
  })

  it('tells the player when they are done', async () => {
    const { wrapper } = await mountMatchView(RoleRevealOverlay, {
      props: { role: 'villager', team: 'village', me: { name: 'Ana', avatar: 'ana' }, pack: [] }
    })
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Got it')?.trigger('click')
    expect(wrapper.emitted('done')).toHaveLength(1)
  })

  it('shows the wolf pack after the flip', async () => {
    const { wrapper } = await mountMatchView(RoleRevealOverlay, {
      props: { role: 'werewolf', team: 'wolves', me: { name: 'Ana', avatar: 'ana' }, pack: [{ id: 'id-Tato', name: 'Tato', avatar: 'tato' }] }
    })
    expect(wrapper.text()).not.toContain('Your pack')
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    expect(wrapper.text()).toContain('You’re a wolf. Awoo.')
    expect(wrapper.text()).toContain('Your pack')
    expect(wrapper.text()).toContain('Tato')
    expect(wrapper.text()).toContain('Ana (you)')
  })

  it('can say another done label and hide the peek hint', async () => {
    const { wrapper } = await mountMatchView(RoleRevealOverlay, {
      props: { role: 'seer', team: 'village', me: null, pack: [], doneLabel: 'I’ve seen it', peekHint: false }
    })
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    expect(wrapper.text()).toContain('I’ve seen it')
    expect(wrapper.find('.reveal-peek').exists()).toBe(false)
  })
})
