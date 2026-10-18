import { describe, expect, it } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const tableOf = (overrides = {}) => playerViewOf({ players: matchPlayers(), ...overrides })

describe('PlayerTable', () => {
  it('shows the phase and the round in the banner', async () => {
    const view = tableOf({ phase: 'night', round: 2 })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.find('.ph-name').text()).toBe('Night')
    expect(wrapper.find('.ph-sub').text()).toBe('Night 2 · The village sleeps')
    expect(wrapper.classes()).toContain('ph-night')
  })

  it('counts down to the end of a timed phase and warns near the end', async () => {
    const view = tableOf({ phase: 'night', phaseEndsAt: 1_060_000, serverNow: 1_000_000 })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.find('.timer b').text()).toBe('1:00')
    expect(wrapper.find('.timer').classes()).not.toContain('is-warn')
    const closing = tableOf({ phaseEndsAt: 1_005_000, serverNow: 1_000_000 })
    const { wrapper: closingWrapper } = await mountMatchView(PlayerTable, { view: closing, props: { view: closing } })
    expect(closingWrapper.find('.timer').classes()).toContain('is-warn')
  })

  it('shows no countdown for a manual phase', async () => {
    const view = tableOf({ phase: 'day', phaseEndsAt: null })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.find('.timer').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ph-day')
  })

  it('seats every player by name and marks your own seat', async () => {
    const view = tableOf()
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    const seats = wrapper.findAll('.seat')
    expect(seats).toHaveLength(8)
    expect(seats.map((seat) => seat.find('.av-name').text())).toContain('Tato')
    const mine = seats.filter((seat) => seat.find('.you-tag').exists())
    expect(mine).toHaveLength(1)
    expect(mine[0]?.find('.av-name').text()).toBe('Ana')
  })

  it('shows the dead as tombstones with their revealed role', async () => {
    const view = tableOf({ players: matchPlayers({ 'id-Juan': { alive: false, revealedRole: 'doctor' } }) })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    const juan = wrapper.findAll('.seat').find((seat) => seat.text().includes('Juan'))
    expect(juan?.find('.av').classes()).toContain('is-dead')
    expect(juan?.find('.tbadge').text()).toBe('Doctor')
    expect(wrapper.text()).toContain('7 of 8 alive')
  })

  it('hides the role of the dead when it was not revealed', async () => {
    const view = tableOf({ players: matchPlayers({ 'id-Juan': { alive: false } }) })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    const juan = wrapper.findAll('.seat').find((seat) => seat.text().includes('Juan'))
    expect(juan?.find('.tbadge').exists()).toBe(false)
  })

  it('marks the pack members for wolves only', async () => {
    const wolf = tableOf({ you: { role: 'werewolf', team: 'wolves', packIds: ['id-Tato'] } })
    const { wrapper } = await mountMatchView(PlayerTable, { view: wolf, props: { view: wolf } })
    const marked = wrapper.findAll('.seat').filter((seat) => seat.find('.av-badge').exists())
    expect(marked.map((seat) => seat.find('.av-name').text())).toEqual(['Tato'])
    const villager = tableOf()
    const { wrapper: other } = await mountMatchView(PlayerTable, { view: villager, props: { view: villager } })
    expect(other.find('.av-badge').exists()).toBe(false)
  })

  it('peeks at your role while the button is held and hides it on release', async () => {
    const view = tableOf({ you: { role: 'seer', team: 'village', packIds: [] } })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    const peek = wrapper.find('[aria-label="Hold to peek at your role"]')
    expect(wrapper.find('.rcard-mini').exists()).toBe(false)
    await peek.trigger('pointerdown')
    expect(wrapper.find('.rcard-mini small').text()).toBe('Seer')
    await peek.trigger('pointerup')
    expect(wrapper.find('.rcard-mini').exists()).toBe(false)
    await peek.trigger('pointerdown')
    await peek.trigger('pointerleave')
    expect(wrapper.find('.rcard-mini').exists()).toBe(false)
  })

  it('announces who did not wake up at dawn, with the revealed role', async () => {
    const view = tableOf({
      phase: 'dawn',
      players: matchPlayers({ 'id-Juan': { alive: false, revealedRole: 'doctor' } }),
      dawn: { round: 1, deaths: ['id-Juan'] }
    })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.text()).toContain('Juan didn’t wake up')
    expect(wrapper.find('.dawn-death .av').classes()).toEqual(expect.arrayContaining(['is-dead', 'a-drop']))
    expect(wrapper.find('.dawn-death .rcard-mini small').text()).toBe('Doctor')
  })

  it('announces that nobody died', async () => {
    const view = tableOf({ phase: 'dawn', dawn: { round: 1, deaths: [] } })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.text()).toContain('Nobody died tonight!')
    expect(wrapper.find('.f-rooster').exists()).toBe(true)
  })

  it('shows no announcement before dawn reports', async () => {
    const view = tableOf({ phase: 'dawn', dawn: null })
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.find('.dawn-nobody').exists()).toBe(false)
  })
})

describe('PlayerTable voice call', () => {
  it('shows the call as an icon button in the top bar during every phase', async () => {
    for (const phase of ['night', 'day', 'vote'] as const) {
      const view = tableOf({ phase })
      const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view }, voiceCallUrl: 'https://discord.gg/abc123' })
      const call = wrapper.find('.banner a.join-call')
      expect(call.attributes('aria-label')).toBe('Join on Discord')
      expect(call.classes()).toContain('btn-icon')
      expect(call.attributes('rel')).toBe('noopener noreferrer')
    }
  })

  it('shows no call button without a link', async () => {
    const view = tableOf()
    const { wrapper } = await mountMatchView(PlayerTable, { view, props: { view } })
    expect(wrapper.find('a.join-call').exists()).toBe(false)
  })
})
